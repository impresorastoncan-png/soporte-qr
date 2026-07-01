import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  const serviceClient = createServiceClient()

  // Devuelve TODAS las solicitudes pendientes o en_proceso (el tablero en vivo)
  const { data: solicitudes, error } = await serviceClient
    .from('solicitudes')
    .select('id, ticket_id, cliente_nombre, modelo, serial, ubicacion, urgencia, descripcion, necesita_toner, tipo_problema, created_at, estado')
    .in('estado', ['pendiente', 'en_proceso'])
    .order('urgencia', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error obteniendo solicitudes activas:', error)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }

  return Response.json({ solicitudes: solicitudes ?? [] })
}
