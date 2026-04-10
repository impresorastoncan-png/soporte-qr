'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { eliminarMaquina } from './actions'

interface Props {
  id: string
  serial: string
  clienteId: string
}

export default function EliminarMaquinaBoton({ id, serial, clienteId }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function handleClick() {
    if (!confirm(`¿Eliminar la máquina ${serial} permanentemente?\n\nSi tiene solicitudes históricas, la operación será bloqueada. Usa "Retirar a almacén" en ese caso.`)) return
    start(async () => {
      try {
        await eliminarMaquina(id, clienteId)
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error al eliminar')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? '...' : 'Eliminar'}
    </button>
  )
}
