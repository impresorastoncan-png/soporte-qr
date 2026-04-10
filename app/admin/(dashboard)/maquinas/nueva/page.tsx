import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, Card } from '@/components/admin/ui'
import MaquinaForm from '../MaquinaForm'
import type { ClienteRow, TecnicoRow } from '@/lib/supabase/types'

export default async function NuevaMaquinaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>
}) {
  const { cliente: clienteIdPreseleccionado } = await searchParams
  const supabase = await createSSRClient()

  const [{ data: cls }, { data: tcs }] = await Promise.all([
    supabase.from('clientes').select('*').eq('activo', true).order('nombre'),
    supabase.from('tecnicos').select('*').eq('activo', true).order('nombre'),
  ])

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <PageHeader titulo="Nueva máquina" subtitulo="Registrar un equipo en el sistema" />
      <Card className="p-6">
        <MaquinaForm
          clientes={(cls ?? []) as ClienteRow[]}
          tecnicos={(tcs ?? []) as TecnicoRow[]}
          clienteIdPreseleccionado={clienteIdPreseleccionado}
        />
      </Card>
    </div>
  )
}
