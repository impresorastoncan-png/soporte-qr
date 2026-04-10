import Link from 'next/link'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, PrimaryButton, Card, EmptyState, Badge } from '@/components/admin/ui'
import EliminarMaquinaBoton from './EliminarMaquinaBoton'
import type { MaquinaRow, ClienteRow } from '@/lib/supabase/types'

export default async function MaquinasPage() {
  const supabase = await createSSRClient()

  const [{ data: maqs }, { data: cls }] = await Promise.all([
    supabase.from('maquinas').select('*').order('serial'),
    supabase.from('clientes').select('id, nombre'),
  ])

  const maquinas = (maqs ?? []) as MaquinaRow[]
  const clientes = (cls ?? []) as Pick<ClienteRow, 'id' | 'nombre'>[]
  const mapaClientes = new Map(clientes.map(c => [c.id, c.nombre]))

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <PageHeader
        titulo="Máquinas"
        subtitulo={`${maquinas.length} equipo(s) en el sistema`}
        actions={
          <PrimaryButton href="/admin/maquinas/nueva">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nueva máquina
          </PrimaryButton>
        }
      />

      <Card>
        {maquinas.length === 0 ? (
          <EmptyState
            titulo="Sin máquinas registradas"
            subtitulo="Crea una máquina individual o importa un Excel desde la página de un cliente."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Serial</th>
                  <th className="text-left px-5 py-3 font-semibold">Modelo</th>
                  <th className="text-left px-5 py-3 font-semibold">Cliente</th>
                  <th className="text-left px-5 py-3 font-semibold">Ubicación</th>
                  <th className="text-left px-5 py-3 font-semibold">Estado</th>
                  <th className="text-right px-5 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maquinas.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">{m.serial}</td>
                    <td className="px-5 py-3 text-gray-800">{m.modelo}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/clientes/${m.cliente_id}`} className="text-blue-600 hover:underline">
                        {mapaClientes.get(m.cliente_id) ?? '—'}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{m.ubicacion || '—'}</td>
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
                        <EliminarMaquinaBoton id={m.id} serial={m.serial} clienteId={m.cliente_id} />
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
