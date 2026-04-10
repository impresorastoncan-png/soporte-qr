'use client'

import { useState, useTransition } from 'react'
import { eliminarCliente } from './actions'

export default function EliminarBoton({ id, nombre }: { id: string; nombre: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  function handleClick() {
    if (!confirm(`¿Eliminar al cliente "${nombre}"? Esta acción no se puede deshacer.`)) return
    setError('')
    start(async () => {
      try {
        await eliminarCliente(id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al eliminar')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? 'Eliminando...' : 'Eliminar'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </>
  )
}
