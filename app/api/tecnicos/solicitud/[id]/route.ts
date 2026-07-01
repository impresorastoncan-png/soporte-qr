import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from('solicitudes')
    .select('id, ticket_id, cliente_nombre, modelo, serial, ubicacion, urgencia, descripcion, necesita_toner, tipo_problema, created_at, estado, contador')
    .eq('id', id)
    .single()

  if (error || !data) {
    return Response.json({ error: 'No encontrado' }, { status: 404 })
  }

  return Response.json({ solicitud: data })
}
