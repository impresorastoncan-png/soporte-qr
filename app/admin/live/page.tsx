import { redirect } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'
import LiveBoard from './LiveBoard'
import type { SolicitudRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function LivePage() {
  const supabase = await createSSRClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login?next=/admin/live')

  const { data } = await supabase
    .from('solicitudes')
    .select('*')
    .neq('estado', 'resuelto')
    .order('created_at', { ascending: false })
    .limit(200)

  const iniciales = (data ?? []) as SolicitudRow[]

  return <LiveBoard iniciales={iniciales} />
}
