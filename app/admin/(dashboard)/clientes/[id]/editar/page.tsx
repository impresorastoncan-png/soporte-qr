import { notFound } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, Card } from '@/components/admin/ui'
import ClienteForm from '../../ClienteForm'
import type { ClienteRow } from '@/lib/supabase/types'

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSSRClient()

  const { data } = await supabase.from('clientes').select('*').eq('id', id).single()
  const cliente = data as ClienteRow | null
  if (!cliente) notFound()

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <PageHeader titulo="Editar cliente" subtitulo={cliente.nombre} />
      <Card className="p-6">
        <ClienteForm cliente={cliente} />
      </Card>
    </div>
  )
}
