'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { importarContadores, type ContadorRow } from '../actions'

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function ImportarContadores({
  clienteId,
  periodo,
  tasaBcv,
  costoPorCopia,
  onClose,
}: {
  clienteId: string
  periodo: string
  tasaBcv: number
  costoPorCopia: number
  onClose: () => void
}) {
  const [rows, setRows] = useState<ContadorRow[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = evt.target?.result
      if (!data) return

      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[]

      const parsed: ContadorRow[] = []

      for (let i = 0; i < rawRows.length; i++) {
        const raw = rawRows[i]
        // Normalize keys
        const normalized: Record<string, unknown> = {}
        for (const key of Object.keys(raw)) {
          normalized[normalizeHeader(key)] = raw[key]
        }

        const serial = String(
          normalized['serial'] ?? normalized['serial_acc'] ?? normalized['serie'] ?? ''
        ).trim()
        if (!serial) continue

        const item = Number(normalized['item'] ?? normalized['n'] ?? normalized['no'] ?? i + 1) || i + 1
        const modelo = String(normalized['modelo'] ?? normalized['model'] ?? '').trim()
        const tipo = String(normalized['tipo'] ?? normalized['type'] ?? 'M').trim().toUpperCase()
        const ubicacion = String(normalized['ubicacion'] ?? normalized['location'] ?? '').trim()
        const lectAnterior = Number(normalized['lect. ant'] ?? normalized['lect ant'] ?? normalized['lect_anterior'] ?? normalized['anterior'] ?? 0) || 0
        const lectActual = Number(normalized['lect. actual'] ?? normalized['lect actual'] ?? normalized['lect_actual'] ?? normalized['actual'] ?? 0) || 0
        const diferencia = Number(normalized['diferencia'] ?? normalized['dif'] ?? normalized['diff'] ?? 0) || (lectActual - lectAnterior)

        parsed.push({ item, modelo, tipo, serial, ubicacion, lectAnterior, lectActual, diferencia })
      }

      setRows(parsed)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  async function handleImport() {
    setLoading(true)
    setResult(null)
    const res = await importarContadores(clienteId, periodo, rows, tasaBcv, costoPorCopia)
    setResult(res)
    setLoading(false)
    if (res.ok) {
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 1500)
    }
  }

  const totalCopias = rows.reduce((s, r) => s + r.diferencia, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-800">Importar Contadores</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Periodo: {periodo} | Formato: Item, Modelo, Tipo, Serial, Ubicación, Lect Anterior, Lect Actual, Diferencia
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <div className="p-6">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {rows.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  {rows.length} equipos detectados — {totalCopias.toLocaleString('es-VE')} copias totales
                </p>
              </div>

              <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-center">N°</th>
                      <th className="px-2 py-2 text-left">Modelo</th>
                      <th className="px-2 py-2 text-center">Tipo</th>
                      <th className="px-2 py-2 text-left">Serial</th>
                      <th className="px-2 py-2 text-left">Ubicación</th>
                      <th className="px-2 py-2 text-right">Anterior</th>
                      <th className="px-2 py-2 text-right">Actual</th>
                      <th className="px-2 py-2 text-right">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 text-center text-gray-400">{r.item}</td>
                        <td className="px-2 py-1.5">{r.modelo}</td>
                        <td className="px-2 py-1.5 text-center">{r.tipo}</td>
                        <td className="px-2 py-1.5 font-mono">{r.serial}</td>
                        <td className="px-2 py-1.5 text-gray-500">{r.ubicacion}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{r.lectAnterior.toLocaleString('es-VE')}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{r.lectActual.toLocaleString('es-VE')}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold">{r.diferencia.toLocaleString('es-VE')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#162f52' }}
                >
                  {loading ? 'Importando...' : `Importar ${rows.length} lecturas`}
                </button>
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-semibold ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
