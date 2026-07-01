import { createAnonClient } from '@/lib/supabase/server'
import TableroTecnicos from './TableroTecnicos'

export const dynamic = 'force-dynamic'

export default async function TecnicosPage() {
  const supabase = createAnonClient()

  const [{ data: tecnicos }, { data: solicitudesIniciales }] = await Promise.all([
    supabase.from('tecnicos').select('id, nombre').eq('activo', true).order('nombre'),
    supabase
      .from('solicitudes')
      .select('id, ticket_id, cliente_nombre, modelo, serial, ubicacion, urgencia, descripcion, necesita_toner, tipo_problema, created_at, estado')
      .in('estado', ['pendiente', 'en_proceso'])
      .order('created_at', { ascending: true }),
  ])

  return (
    <TableroTecnicos
      tecnicos={tecnicos ?? []}
      solicitudesIniciales={solicitudesIniciales ?? []}
    />
  )
}
