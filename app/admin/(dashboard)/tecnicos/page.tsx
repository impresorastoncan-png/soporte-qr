import Link from 'next/link'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, PrimaryButton, Card, EmptyState, Badge } from '@/components/admin/ui'
import type { TecnicoRow } from '@/lib/supabase/types'
import EliminarBoton from './EliminarBoton'

export default async function TecnicosPage() {
  const supabase = await createSSRClient()
  const { data } = await supabase.from('tecnicos').select('*').order('nombre')
  const tecnicos = (data ?? []) as TecnicoRow[]

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <PageHeader
        titulo="Técnicos"
        subtitulo="Personal técnico asignable a máquinas"
        actions={
          <PrimaryButton href="/admin/tecnicos/nuevo">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo técnico
          </PrimaryButton>
        }
      />

      <Card>
        {tecnicos.length === 0 ? (
          <EmptyState
            titulo="Sin técnicos registrados"
            subtitulo="Agregue el personal técnico para poder asignarlo a máquinas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Nombre</th>
                  <th className="text-left px-5 py-3 font-semibold">Correo</th>
                  <th className="text-left px-5 py-3 font-semibold">Estado</th>
                  <th className="text-right px-5 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tecnicos.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{t.nombre}</td>
                    <td className="px-5 py-3 text-gray-600">{t.email}</td>
                    <td className="px-5 py-3">
                      {t.activo
                        ? <Badge bg="#d1fae5" text="#065f46" label="Activo" />
                        : <Badge bg="#f3f4f6" text="#6b7280" label="Inactivo" />}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/tecnicos/${t.id}`}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Editar
                        </Link>
                        <EliminarBoton id={t.id} nombre={t.nombre} />
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
