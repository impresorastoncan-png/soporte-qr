'use client'

import { useRouter } from 'next/navigation'
import type { ClienteRow } from '@/lib/supabase/types'

interface Props {
  clientes: ClienteRow[]
  valores: {
    cliente: string
    urgencia: string
    estado: string
    desde: string
    hasta: string
    toner: string
    q: string
  }
}

export default function FiltrosBar({ clientes, valores }: Props) {
  const router = useRouter()
  const activos =
    !!valores.cliente ||
    !!valores.urgencia ||
    !!valores.estado ||
    !!valores.desde ||
    !!valores.hasta ||
    !!valores.toner ||
    !!valores.q

  return (
    <form
      method="get"
      action="/admin/solicitudes"
      className="bg-white rounded-xl border border-gray-200 p-4 mb-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Cliente</label>
          <select
            name="cliente"
            defaultValue={valores.cliente}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          >
            <option value="">Todos</option>
            {clientes.map(c => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Urgencia</label>
          <select
            name="urgencia"
            defaultValue={valores.urgencia}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          >
            <option value="">Todas</option>
            <option value="critica">🔴 Crítica</option>
            <option value="alta">🟠 Alta</option>
            <option value="media">🟡 Media</option>
            <option value="baja">🟢 Baja</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Estado</label>
          <select
            name="estado"
            defaultValue={valores.estado}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="resuelto">Resuelto</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Tóner</label>
          <select
            name="toner"
            defaultValue={valores.toner}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          >
            <option value="">Cualquiera</option>
            <option value="1">Solo con tóner</option>
            <option value="0">Sin tóner</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Desde</label>
          <input
            type="date"
            name="desde"
            defaultValue={valores.desde}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Hasta</label>
          <input
            type="date"
            name="hasta"
            defaultValue={valores.hasta}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Buscar</label>
          <input
            type="text"
            name="q"
            defaultValue={valores.q}
            placeholder="ticket, serial, solicitante..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        {activos && (
          <button
            type="button"
            onClick={() => router.push('/admin/solicitudes')}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            Limpiar
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#162f52' }}
        >
          Filtrar
        </button>
      </div>
    </form>
  )
}
