import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, SecondaryButton } from '@/components/admin/ui'
import FiltrosBar from './FiltrosBar'
import TablaSolicitudes from './TablaSolicitudes'
import type { SolicitudRow, ClienteRow } from '@/lib/supabase/types'

type SP = {
  cliente?: string
  urgencia?: string
  estado?: string
  desde?: string
  hasta?: string
  toner?: string
  q?: string
}

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const sp = await searchParams
  const valores = {
    cliente: sp.cliente ?? '',
    urgencia: sp.urgencia ?? '',
    estado: sp.estado ?? '',
    desde: sp.desde ?? '',
    hasta: sp.hasta ?? '',
    toner: sp.toner ?? '',
    q: sp.q ?? '',
  }

  const supabase = await createSSRClient()

  let query = supabase
    .from('solicitudes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  if (valores.cliente) query = query.eq('cliente_nombre', valores.cliente)
  if (valores.urgencia) query = query.eq('urgencia', valores.urgencia)
  if (valores.estado) query = query.eq('estado', valores.estado)
  if (valores.toner === '1') query = query.eq('necesita_toner', true)
  if (valores.toner === '0') query = query.eq('necesita_toner', false)
  if (valores.desde) query = query.gte('created_at', `${valores.desde}T00:00:00`)
  if (valores.hasta) query = query.lte('created_at', `${valores.hasta}T23:59:59`)
  if (valores.q) {
    const term = valores.q.trim()
    query = query.or(
      `ticket_id.ilike.%${term}%,serial.ilike.%${term}%,nombre_solicitante.ilike.%${term}%`
    )
  }

  const [{ data: solsData }, { data: clsData }] = await Promise.all([
    query,
    supabase.from('clientes').select('*').order('nombre'),
  ])

  const solicitudes = (solsData ?? []) as SolicitudRow[]
  const clientes = (clsData ?? []) as ClienteRow[]

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length
  const criticas = solicitudes.filter(s => s.urgencia === 'critica' && s.estado !== 'resuelto').length

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <PageHeader
        titulo="Solicitudes"
        subtitulo={`${solicitudes.length} resultado(s) · ${pendientes} pendientes · ${criticas} críticas activas`}
        actions={
          <SecondaryButton href="/admin/live">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Vista en vivo
          </SecondaryButton>
        }
      />

      <FiltrosBar clientes={clientes} valores={valores} />
      <TablaSolicitudes solicitudes={solicitudes} />
    </div>
  )
}
