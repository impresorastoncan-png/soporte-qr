'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function FiltroContadores({ atc, q }: { atc?: string; q?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/admin/contadores?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        placeholder="Buscar por razón social o RIF..."
        defaultValue={q ?? ''}
        onChange={(e) => update('q', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 bg-white w-72"
      />
      <select
        value={atc ?? ''}
        onChange={(e) => update('atc', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Todos los ATC</option>
        <option value="ATC1">ATC1</option>
        <option value="ATC2">ATC2</option>
        <option value="ATC3">ATC3</option>
      </select>
    </div>
  )
}
