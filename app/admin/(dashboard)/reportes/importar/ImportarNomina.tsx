'use client'

import { useState } from 'react'
import { generarNomina } from './actions'

export default function ImportarNomina() {
  const [periodo, setPeriodo] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleGenerar() {
    setLoading(true)
    setResult(null)
    const res = await generarNomina(periodo)
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-800">Nomina Mensual</h3>
        <p className="text-xs text-gray-500 mt-0.5">Genera la nomina del periodo seleccionado. Calcula automaticamente prestaciones (17%), bono vacacional (6%) y utilidades (17%) sobre el salario base.</p>
      </div>
      <div className="p-5">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Periodo</label>
            <input
              type="month"
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleGenerar}
            disabled={loading || !periodo}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#162f52' }}
          >
            {loading ? 'Generando...' : 'Generar nomina'}
          </button>
        </div>

        <div className="mt-3 bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
          Se usara la tasa BCV mas reciente registrada. Asegurate de actualizar la tasa antes de generar.
        </div>

        {result && (
          <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-semibold ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  )
}
