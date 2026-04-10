'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { retirarMaquina, eliminarMaquina } from './actions'
import type { ClienteRow } from '@/lib/supabase/types'

interface Props {
  maquinaId: string
  clienteIdActual: string
  almacenes: ClienteRow[]
}

export default function ZonaPeligro({ maquinaId, clienteIdActual, almacenes }: Props) {
  const router = useRouter()
  const [almacenId, setAlmacenId] = useState('')
  const [error, setError] = useState('')
  const [pendingRetirar, startRetirar] = useTransition()
  const [pendingEliminar, startEliminar] = useTransition()

  function handleRetirar() {
    setError('')
    if (!almacenId) {
      setError('Selecciona un almacén')
      return
    }
    const nombre = almacenes.find(a => a.id === almacenId)?.nombre ?? 'almacén'
    if (!confirm(`¿Retirar esta máquina al almacén "${nombre}"? Quedará inactiva y sin ubicación.`)) return
    startRetirar(async () => {
      try {
        await retirarMaquina(maquinaId, almacenId)
        router.push(`/admin/clientes/${almacenId}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al retirar')
      }
    })
  }

  function handleEliminar() {
    setError('')
    if (!confirm('¿Eliminar esta máquina PERMANENTEMENTE? Esta acción no se puede deshacer. Si tiene solicitudes históricas, la operación será bloqueada.')) return
    startEliminar(async () => {
      try {
        await eliminarMaquina(maquinaId, clienteIdActual)
        router.push('/admin/maquinas')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al eliminar')
      }
    })
  }

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <h3 className="text-sm font-bold text-red-800 mb-1">Zona de peligro</h3>
      <p className="text-xs text-gray-500 mb-4">
        Retirar a almacén conserva el histórico de solicitudes. Eliminar es permanente.
      </p>

      <div className="space-y-4">
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">Retirar a almacén</p>
          <p className="text-xs text-amber-800 mb-3">
            La máquina se moverá al almacén seleccionado, quedará marcada como inactiva y sin ubicación asignada. El QR seguirá funcionando.
          </p>
          <div className="flex gap-2">
            <select
              value={almacenId}
              onChange={e => setAlmacenId(e.target.value)}
              className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white text-gray-900"
            >
              <option value="">Seleccionar almacén destino...</option>
              {almacenes.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRetirar}
              disabled={pendingRetirar || !almacenId}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
            >
              {pendingRetirar ? 'Retirando...' : 'Retirar'}
            </button>
          </div>
        </div>

        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-900 mb-2">Eliminar permanentemente</p>
          <p className="text-xs text-red-800 mb-3">
            Borra la máquina de la base de datos. Solo se permite si no tiene solicitudes históricas.
          </p>
          <button
            type="button"
            onClick={handleEliminar}
            disabled={pendingEliminar}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {pendingEliminar ? 'Eliminando...' : 'Eliminar máquina'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
