'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { importarRelacionesAnexas, type RelacionBloque, type RelacionRow } from './actions'

export default function ImportarRelaciones() {
  const [bloques, setBloques] = useState<RelacionBloque[]>([])
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
      const parsed: RelacionBloque[] = []

      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName]
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        // Buscar bloques de datos en el sheet
        let i = 0
        while (i < rows.length) {
          const row = rows[i] as (string | number)[]

          // Detectar fila de cliente
          const clienteRow = row.find(c => typeof c === 'string' && c.toLowerCase().includes('cliente'))
          if (clienteRow && typeof clienteRow === 'string') {
            const cliente = clienteRow.replace(/^cliente\s*/i, '').trim()

            // Siguiente fila: contrato
            const contratoRow = rows[i + 1] as (string | number)[] | undefined
            const contrato = contratoRow?.find(c => typeof c === 'string' && c.toLowerCase().includes('contrato'))
            const contratoStr = typeof contrato === 'string' ? contrato.trim() : ''

            // Buscar fila de header (Item, Modelo, Tipo, Serial...)
            let headerIdx = i + 2
            while (headerIdx < Math.min(i + 6, rows.length)) {
              const h = rows[headerIdx] as (string | number)[]
              if (h.some(c => typeof c === 'string' && c.toLowerCase().includes('item'))) break
              headerIdx++
            }

            // Leer equipos desde headerIdx+1
            const equipos: RelacionRow[] = []
            let j = headerIdx + 1
            while (j < rows.length) {
              const r = rows[j] as (string | number)[]
              const item = Number(r[0])
              if (!item || isNaN(item)) break
              equipos.push({
                item,
                modelo: String(r[1] || ''),
                tipo: String(r[2] || 'M'),
                serial: String(r[3] || '').trim(),
                ubicacion: String(r[4] || ''),
                lectAnterior: Number(r[5]) || 0,
                lectActual: Number(r[6]) || 0,
                diferencia: Number(r[7]) || 0,
              })
              j++
            }

            // Buscar totales y tasa
            let totalCopias = 0
            let costoPorCopia = 0
            let tasaCambio = 0
            let totalUsd = 0

            for (let k = j; k < Math.min(j + 10, rows.length); k++) {
              const r = rows[k] as (string | number)[]
              const joined = r.map(String).join(' ').toLowerCase()
              if (joined.includes('total') && joined.includes('copias')) {
                totalCopias = Number(r[7]) || equipos.reduce((s, e) => s + e.diferencia, 0)
              }
              if (joined.includes('copias x') || joined.includes('copias ×')) {
                costoPorCopia = Number(r[6]) || 0
                totalUsd = Number(r[7]) || 0
              }
              if (joined.includes('tipo de cambio') || joined.includes('tasa')) {
                tasaCambio = Number(r[7]) || 0
              }
            }

            if (totalCopias === 0) {
              totalCopias = equipos.reduce((s, e) => s + e.diferencia, 0)
            }

            // Determinar si es B/N o Color
            const tipoEquipo: 'bn' | 'color' = costoPorCopia >= 0.1 ? 'color' : 'bn'

            // Determinar periodo desde la fecha del documento
            const fechaRow = rows.find(r => {
              const joined = (r as (string | number)[]).map(String).join(' ')
              return /\d{2}\/\d{2}\/\d{4}/.test(joined) || /caracas/i.test(joined)
            })
            let periodo = new Date().toISOString().slice(0, 7)
            if (fechaRow) {
              const match = (fechaRow as (string | number)[]).map(String).join(' ').match(/(\d{2})\/(\d{2})\/(\d{4})/)
              if (match) {
                const [, , mes, anio] = match
                // Mes anterior al de la fecha del documento (las relaciones son del mes previo)
                const m = parseInt(mes) - 1
                if (m < 1) {
                  periodo = `${parseInt(anio) - 1}-12`
                } else {
                  periodo = `${anio}-${m.toString().padStart(2, '0')}`
                }
              }
            }

            if (equipos.length > 0) {
              parsed.push({
                cliente,
                contrato: contratoStr,
                tipoEquipo,
                periodo,
                tasaCambio,
                costoPorCopia,
                equipos,
                totalCopias,
                totalUsd,
              })
            }

            i = j
            continue
          }
          i++
        }
      }

      setBloques(parsed)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  async function handleImport() {
    setLoading(true)
    setResult(null)
    const res = await importarRelacionesAnexas(bloques)
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-800">Relaciones Anexas (Contadores)</h3>
        <p className="text-xs text-gray-500 mt-0.5">Sube el Excel con las lecturas de contadores por cliente. Formato: Item, Modelo, Tipo, Serial, Ubicacion, Lect Anterior, Lect Actual, Diferencia.</p>
      </div>
      <div className="p-5">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {bloques.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">{bloques.length} bloque(s) detectado(s):</p>
            {bloques.map((b, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{b.cliente}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${b.tipoEquipo === 'color' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {b.tipoEquipo === 'color' ? 'COLOR' : 'B/N'}
                  </span>
                </div>
                <p className="text-gray-500 mt-1">{b.contrato} | Periodo: {b.periodo} | {b.equipos.length} equipos | {b.totalCopias.toLocaleString('es-VE')} copias | ${b.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })} USD</p>
                {b.tasaCambio > 0 && <p className="text-gray-400">Tasa: {b.tasaCambio} Bs | Costo/copia: ${b.costoPorCopia}</p>}
              </div>
            ))}

            <button
              onClick={handleImport}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#162f52' }}
            >
              {loading ? 'Importando...' : `Importar ${bloques.reduce((s, b) => s + b.equipos.length, 0)} lecturas`}
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
