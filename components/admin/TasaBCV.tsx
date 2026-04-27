'use client'

import { useEffect, useState, useCallback } from 'react'

type TasaData = {
  bs_usd: number
  bs_eur: number
  fecha: string | null
  stale: boolean
}

export default function TasaBCV() {
  const [tasa, setTasa] = useState<TasaData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchTasa = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tasa-bcv')
      if (res.ok) {
        const data = await res.json()
        setTasa(data)
      }
    } catch { /* silencioso */ }
  }, [])

  const refreshTasa = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tasa-bcv', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setTasa(data)
      }
    } catch { /* silencioso */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasa()
    // Refrescar cada 30 min
    const interval = setInterval(fetchTasa, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchTasa])

  if (!tasa) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-xs text-gray-400">
        Cargando tasa...
      </div>
    )
  }

  const fechaLabel = tasa.fecha
    ? new Date(tasa.fecha + 'T12:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' })
    : '—'

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase">USD</span>
          <span className="text-xs font-bold text-gray-800">
            {tasa.bs_usd ? tasa.bs_usd.toFixed(2) : '—'}
          </span>
        </div>
        <div className="w-px h-4 bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase">EUR</span>
          <span className="text-xs font-bold text-gray-800">
            {tasa.bs_eur ? tasa.bs_eur.toFixed(2) : '—'}
          </span>
        </div>
        <div className="w-px h-4 bg-gray-300" />
        <span className="text-[10px] text-gray-400">{fechaLabel}</span>
        {tasa.stale && (
          <span className="text-[9px] text-amber-500 font-semibold">ANTIGUO</span>
        )}
      </div>
      <button
        onClick={refreshTasa}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        title="Actualizar tasa BCV"
      >
        <svg
          className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  )
}
