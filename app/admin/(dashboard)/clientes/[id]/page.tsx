import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, PrimaryButton, SecondaryButton, Card, Badge, EmptyState } from '@/components/admin/ui'
import EliminarMaquinaBoton from '../../maquinas/EliminarMaquinaBoton'
import type { ClienteRow, MaquinaRow } from '@/lib/supabase/types'

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSSRClient()

  const { data: clienteData } = await supabase.from('clientes').select('*').eq('id', id).single()
  const cliente = clienteData as ClienteRow | null
  if (!cliente) notFound()

  const { data: maqs } = await supabase
    .from('maquinas')
    .select('*')
    .eq('cliente_id', id)
    .order('serial')
  const maquinas = (maqs ?? []) as MaquinaRow[]

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-2">
        <Link
          href={cliente.es_almacen ? '/admin/almacenes' : '/admin/clientes'}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Volver a {cliente.es_almacen ? 'almacenes' : 'clientes'}
        </Link>
      </div>

      <PageHeader
        titulo={cliente.nombre}
        subtitulo={cliente.rif ? `RIF: ${cliente.rif}` : undefined}
        actions={
          <>
            <SecondaryButton href={`/admin/clientes/${id}/editar`}>Editar cliente</SecondaryButton>
            <PrimaryButton href={`/admin/clientes/${id}/stickers`}>Generar stickers</PrimaryButton>
          </>
        }
      />

      {/* Info del cliente */}
      <Card className="p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">ATC Asignado</p>
            <p className="text-gray-800">{cliente.atc_email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Dirección</p>
            <p className="text-gray-800">{cliente.direccion || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Estado</p>
            {cliente.activo
              ? <Badge bg="#d1fae5" text="#065f46" label="Activo" />
              : <Badge bg="#f3f4f6" text="#6b7280" label="Inactivo" />}
          </div>
        </div>
      </Card>

      {/* Máquinas del cliente */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Máquinas ({maquinas.length})</h2>
          <p className="text-xs text-gray-500">Equipos arrendados a este cliente</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton href={`/admin/clientes/${id}/importar`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6h13v6M9 11V5a2 2 0 012-2h9a2 2 0 012 2v6M9 11H4a2 2 0 00-2 2v4a2 2 0 002 2h5m0-8V17" />
            </svg>
            Importar Excel
          </SecondaryButton>
          <PrimaryButton href={`/admin/maquinas/nueva?cliente=${id}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Agregar máquina
          </PrimaryButton>
        </div>
      </div>

      <Card>
        {maquinas.length === 0 ? (
          <EmptyState
            titulo="Sin máquinas registradas"
            subtitulo="Agrega máquinas individualmente o importa un Excel con toda la flota."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Serial</th>
                  <th className="text-left px-5 py-3 font-semibold">Modelo</th>
                  <th className="text-left px-5 py-3 font-semibold">Ubicación</th>
                  <th className="text-left px-5 py-3 font-semibold">Encargado</th>
                  <th className="text-left px-5 py-3 font-semibold">Estado</th>
                  <th className="text-right px-5 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maquinas.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">{m.serial}</td>
                    <td className="px-5 py-3 text-gray-800">{m.modelo}</td>
                    <td className="px-5 py-3 text-gray-600">{m.ubicacion || '—'}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{m.encargado_email || '—'}</td>
                    <td className="px-5 py-3">
                      {m.activo
                        ? <Badge bg="#d1fae5" text="#065f46" label="Activa" />
                        : <Badge bg="#f3f4f6" text="#6b7280" label="Inactiva" />}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/admin/maquinas/${m.serial}`}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Editar
                        </Link>
                        <EliminarMaquinaBoton id={m.id} serial={m.serial} clienteId={id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
