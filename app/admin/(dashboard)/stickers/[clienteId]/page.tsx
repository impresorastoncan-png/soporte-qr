import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/ui'
import type { ClienteRow, MaquinaRow } from '@/lib/supabase/types'
import StickersCliente from './StickersCliente'

export default async function StickersClientePage({
  params,
}: {
  params: Promise<{ clienteId: string }>
}) {
  const { clienteId } = await params
  const supabase = await createSSRClient()

  const { data: clienteData } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .single()
  const cliente = clienteData as ClienteRow | null
  if (!cliente) notFound()

  const { data: maqs } = await supabase
    .from('maquinas')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('activo', true)
    .order('serial')
  const maquinas = (maqs ?? []) as MaquinaRow[]

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-2">
        <Link href="/admin/stickers" className="text-xs font-semibold text-gray-500 hover:text-gray-700">
          ← Volver a clientes
        </Link>
      </div>
      <PageHeader
        titulo={`Stickers · ${cliente.nombre}`}
        subtitulo={`${maquinas.length} máquina${maquinas.length === 1 ? '' : 's'} activa${maquinas.length === 1 ? '' : 's'}`}
      />
      <StickersCliente clienteNombre={cliente.nombre} maquinas={maquinas} />
    </div>
  )
}
