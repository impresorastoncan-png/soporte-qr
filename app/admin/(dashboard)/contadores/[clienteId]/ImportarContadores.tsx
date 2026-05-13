'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { importarContadores, type ContadorRow } from '../actions'

function norm(h: unknown): string {
  return String(h ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
}

/** Keywords that identify the header row */
const HEADER_HINTS = ['serial', 'serie', 'modelo', 'model', 'lect', 'anterior', 'actual', 'diferencia', 'dif']

/** Find the row index that looks like the header row */
function findHeaderRow(grid: unknown[][]): number {
  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const cells = (grid[r] || []).map(c => norm(c))
    const matches = HEADER_HINTS.filter(kw => cells.some(c => c.includes(kw)))
    if (matches.length >= 2) return r
  }
  return -1
}

/** Map a normalized header to our canonical field name */
function mapHeader(h: string): string | null {
  const n = norm(h)
  if (/serial|serie/.test(n)) return 'serial'
  if (/modelo|model/.test(n)) return 'modelo'
  if (/tipo|type/.test(n)) return 'tipo'
  if (/ubicacion|location|departamento|dept|area/.test(n)) return 'ubicacion'
  if (/item|^n$|^no$|^n ?o?$/.test(n)) return 'item'
  if (/lect.*ant|anterior|inicio|counter.*prev/.test(n)) return 'lectAnterior'
  if (/lect.*act|actual|final|counter.*curr/.test(n)) return 'lectActual'
  if (/diferencia|dif|diff|copias|consumo/.test(n)) return 'diferencia'
  return null
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
  const [parseError, setParseError] = useState<string | null>(null)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setParseError(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = evt.target?.result
      if (!data) return

      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]

      // Read as raw grid (array of arrays) to auto-detect the header row
      const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]

      if (grid.length === 0) {
        setParseError('El archivo está vacío o no se pudo leer ninguna fila.')
        setRows([])
        return
      }

      const headerIdx = findHeaderRow(grid)

      if (headerIdx === -1) {
        const allCells = grid.slice(0, 10).flat().filter(c => String(c).trim()).map(c => String(c).trim())
        setParseError(
          `No se encontró una fila de encabezados con columnas reconocibles. ` +
          `Contenido detectado en las primeras filas: ${allCells.slice(0, 20).join(', ')}. ` +
          `Asegúrese de que el archivo tenga columnas como Serial, Modelo, Lect. Ant, Lect. Actual, etc.`
        )
        setRows([])
        return
      }

      // Build column mapping: colIndex → canonical field name
      const headerCells = grid[headerIdx] as unknown[]
      const colMap: Record<number, string> = {}
      for (let c = 0; c < headerCells.length; c++) {
        const mapped = mapHeader(String(headerCells[c]))
        if (mapped) colMap[c] = mapped
      }

      if (!Object.values(colMap).includes('serial')) {
        const found = headerCells.map(c => String(c).trim()).filter(Boolean)
        setParseError(
          `Se detectó fila de encabezados (fila ${headerIdx + 1}: ${found.join(', ')}), ` +
          `pero no se encontró una columna "Serial". Verifique el nombre de la columna.`
        )
        setRows([])
        return
      }

      // Parse data rows (everything after the header)
      const parsed: ContadorRow[] = []
      for (let r = headerIdx + 1; r < grid.length; r++) {
        const row = grid[r] as unknown[]
        if (!row || row.every(c => String(c).trim() === '')) continue

        const record: Record<string, unknown> = {}
        for (const [colStr, field] of Object.entries(colMap)) {
          record[field] = row[Number(colStr)]
        }

        const serial = String(record['serial'] ?? '').trim()
        if (!serial) continue

        const idx = parsed.length
        const item = Number(record['item']) || idx + 1
        const modelo = String(record['modelo'] ?? '').trim()
        const tipo = String(record['tipo'] ?? 'M').trim().toUpperCase()
        const ubicacion = String(record['ubicacion'] ?? '').trim()
        const lectAnterior = Number(record['lectAnterior']) || 0
        const lectActual = Number(record['lectActual']) || 0
        const diferencia = Number(record['diferencia']) || (lectActual - lectAnterior)

        parsed.push({ item, modelo, tipo, serial, ubicacion, lectAnterior, lectActual, diferencia })
      }

      if (parsed.length === 0) {
        setParseError(
          `Se encontraron encabezados en la fila ${headerIdx + 1}, pero no se detectaron filas de datos válidas debajo. ` +
          `Verifique que las filas de datos tengan un valor en la columna Serial.`
        )
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

          {parseError && (
            <div className="mt-3 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {parseError}
            </div>
          )}

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
