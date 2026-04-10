import Link from 'next/link'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, Card, EmptyState } from '@/components/admin/ui'
import type { ClienteRow } from '@/lib/supabase/types'

export default async function AlmacenesPage() {
  const supabase = await createSSRClient()
  const { data: almacenes } = await supabase
    .from('clientes')
    .select('*')
    .eq('es_almacen', true)
    .order('nombre')
  const lista = (almacenes ?? []) as ClienteRow[]

  const { data: maqs } = await supabase.from('maquinas').select('cliente_id')
  const conteo = new Map<string, number>()
  ;((maqs ?? []) as { cliente_id: string }[]).forEach(m => {
    conteo.set(m.cliente_id, (conteo.get(m.cliente_id) ?? 0) + 1)
  })

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <PageHeader
        titulo="Almacenes"
        subtitulo="Equipos fuera de servicio o no asignados a cliente"
      />

      <Card>
        {lista.length === 0 ? (
          <EmptyState
            titulo="Sin almacenes registrados"
            subtitulo="Corre la migración SQL para crear CTD QTA y CTD L4."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Nombre</th>
                  <th className="text-left px-5 py-3 font-semibold">Dirección</th>
                  <th className="text-left px-5 py-3 font-semibold">Contacto</th>
                  <th className="text-center px-5 py-3 font-semibold">Máquinas</th>
                  <th className="text-right px-5 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/clientes/${a.id}`} className="font-semibold text-gray-800 hover:text-blue-600">
                        {a.nombre}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{a.direccion || '—'}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{a.atc_email}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                        {conteo.get(a.id) ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/clientes/${a.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Ver máquinas
                      </Link>
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
