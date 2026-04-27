'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { importarCostos, type CostoRow } from './actions'

const CATEGORIAS_MAP: Record<string, string> = {
  'insumos': 'insumos',
  'repuestos': 'insumos',
  'personal': 'personal',
  'viaticos': 'viaticos',
  'movilizacion': 'movilizacion',
  'transporte': 'movilizacion',
  'dotacion': 'dotacion',
  'administracion': 'admin',
  'utilidad': 'utilidad',
  'financieros': 'financieros',
  'otros': 'otro',
}

function detectCategoria(concepto: string): string {
  const lower = concepto.toLowerCase()
  for (const [key, val] of Object.entries(CATEGORIAS_MAP)) {
    if (lower.includes(key)) return val
  }
  return 'otro'
}

export default function ImportarCostos() {
  const [periodo, setPeriodo] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  })
  const [costos, setCostos] = useState<CostoRow[]>([])
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
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      const parsed: CostoRow[] = []
      for (const row of rows) {
        const r = row as (string | number)[]
        // Buscar filas con un concepto y monto USD
        const concepto = String(r[1] || '').trim()
        const montoUsd = Number(r[2])

        if (concepto && montoUsd && !isNaN(montoUsd) && montoUsd > 0) {
          // Saltar filas de subtotal/total
          const lower = concepto.toLowerCase()
          if (lower.includes('subtotal') || lower.includes('total') || lower.includes('calculo') || lower.includes('facturacion') || lower.includes('precio por')) continue

          parsed.push({
            categoria: detectCategoria(concepto),
            concepto,
            monto_usd: montoUsd,
            monto_bs: Number(r[3]) || 0,
            monto_eur: Number(r[4]) || 0,
          })
        }
      }

      setCostos(parsed)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  async function handleImport() {
    setLoading(true)
    setResult(null)
    const res = await importarCostos(periodo, costos)
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-800">Estructura de Costos</h3>
        <p className="text-xs text-gray-500 mt-0.5">Sube el Excel de estructura de costos. Formato esperado: No., Concepto, Costo USD, Costo Bs, Costo EUR, % del Total.</p>
      </div>
      <div className="p-5">
        <div className="flex items-end gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Periodo</label>
            <input
              type="month"
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {costos.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">{costos.length} conceptos detectados:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Categoria</th>
                    <th className="text-left px-3 py-2 font-semibold">Concepto</th>
                    <th className="text-right px-3 py-2 font-semibold">USD</th>
                    <th className="text-right px-3 py-2 font-semibold">Bs</th>
                    <th className="text-right px-3 py-2 font-semibold">EUR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {costos.map((c, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-semibold">{c.categoria}</span>
                      </td>
                      <td className="px-3 py-1.5 text-gray-800">{c.concepto}</td>
                      <td className="px-3 py-1.5 text-right font-mono">${c.monto_usd.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-500">{c.monto_bs.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-500">{c.monto_eur.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td className="px-3 py-2" colSpan={2}>Total</td>
                    <td className="px-3 py-2 text-right font-mono">${costos.reduce((s, c) => s + c.monto_usd, 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-500">{costos.reduce((s, c) => s + c.monto_bs, 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-500">{costos.reduce((s, c) => s + c.monto_eur, 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <button
              onClick={handleImport}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#162f52' }}
            >
              {loading ? 'Importando...' : `Importar ${costos.length} conceptos`}
            </button>
          </div>
        )}

        {result && (
          <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-semibold ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  )
}
