import { notFound } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, Card } from '@/components/admin/ui'
import TecnicoForm from '../TecnicoForm'
import type { TecnicoRow } from '@/lib/supabase/types'

export default async function EditarTecnicoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSSRClient()

  const { data } = await supabase.from('tecnicos').select('*').eq('id', id).single()
  const tecnico = data as TecnicoRow | null
  if (!tecnico) notFound()

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <PageHeader titulo="Editar técnico" subtitulo={tecnico.email} />
      <Card className="p-6">
        <TecnicoForm tecnico={tecnico} />
      </Card>
    </div>
  )
}
