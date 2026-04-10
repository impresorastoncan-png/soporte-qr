import Link from 'next/link'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, PrimaryButton, Card, EmptyState, Badge } from '@/components/admin/ui'
import type { ClienteRow } from '@/lib/supabase/types'
import EliminarBoton from './EliminarBoton'

export default async function ClientesPage() {
  const supabase = await createSSRClient()
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('es_almacen', false)
    .order('nombre')
  const lista = (clientes ?? []) as ClienteRow[]

  // Contar máquinas por cliente
  const { data: maqs } = await supabase.from('maquinas').select('cliente_id, activo')
  const conteo = new Map<string, number>()
  ;((maqs ?? []) as { cliente_id: string; activo: boolean }[]).forEach(m => {
    if (m.activo) conteo.set(m.cliente_id, (conteo.get(m.cliente_id) ?? 0) + 1)
  })

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <PageHeader
        titulo="Clientes"
        subtitulo="Empresas corporativas con máquinas arrendadas"
        actions={
          <PrimaryButton href="/admin/clientes/nuevo">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo cliente
          </PrimaryButton>
        }
      />

      <Card>
        {lista.length === 0 ? (
          <EmptyState
            titulo="Sin clientes registrados"
            subtitulo="Agregue el primer cliente para empezar a registrar sus máquinas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Nombre</th>
                  <th className="text-left px-5 py-3 font-semibold">RIF</th>
                  <th className="text-left px-5 py-3 font-semibold">ATC</th>
                  <th className="text-center px-5 py-3 font-semibold">Máquinas</th>
                  <th className="text-left px-5 py-3 font-semibold">Estado</th>
                  <th className="text-right px-5 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/clientes/${c.id}`} className="font-semibold text-gray-800 hover:text-blue-600">
                        {c.nombre}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{c.rif || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{c.atc_email}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                        {conteo.get(c.id) ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {c.activo
                        ? <Badge bg="#d1fae5" text="#065f46" label="Activo" />
                        : <Badge bg="#f3f4f6" text="#6b7280" label="Inactivo" />}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/admin/clientes/${c.id}`}
                          className="text-xs font-semibold text-gray-600 hover:underline"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/admin/clientes/${c.id}/editar`}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Editar
                        </Link>
                        <EliminarBoton id={c.id} nombre={c.nombre} />
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
