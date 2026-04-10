import { notFound } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, Card } from '@/components/admin/ui'
import MaquinaForm from '../MaquinaForm'
import ZonaPeligro from '../ZonaPeligro'
import MaquinaQR from '../MaquinaQR'
import type { ClienteRow, MaquinaRow, TecnicoRow } from '@/lib/supabase/types'

export default async function EditarMaquinaPage({
  params,
}: {
  params: Promise<{ serial: string }>
}) {
  const { serial } = await params
  const supabase = await createSSRClient()

  const { data: maqData } = await supabase
    .from('maquinas')
    .select('*')
    .eq('serial', serial.toUpperCase())
    .single()

  const maquina = maqData as MaquinaRow | null
  if (!maquina) notFound()

  const [{ data: cls }, { data: tcs }, { data: asignaciones }, { data: alms }] = await Promise.all([
    supabase.from('clientes').select('*').eq('activo', true).order('nombre'),
    supabase.from('tecnicos').select('*').eq('activo', true).order('nombre'),
    supabase.from('maquina_tecnicos').select('tecnico_id').eq('maquina_id', maquina.id),
    supabase.from('clientes').select('*').eq('es_almacen', true).order('nombre'),
  ])

  const tecnicoIdsAsignados = ((asignaciones ?? []) as { tecnico_id: string }[]).map(a => a.tecnico_id)
  const almacenes = (alms ?? []) as ClienteRow[]
  const clientesList = (cls ?? []) as ClienteRow[]
  const clienteActual = clientesList.find(c => c.id === maquina.cliente_id)?.nombre ?? '—'

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <PageHeader titulo="Editar máquina" subtitulo={`${maquina.modelo} · ${maquina.serial}`} />
      <Card className="p-6">
        <MaquinaQR
          serial={maquina.serial}
          modelo={maquina.modelo}
          clienteNombre={clienteActual}
        />
        <MaquinaForm
          maquina={maquina}
          clientes={clientesList}
          tecnicos={(tcs ?? []) as TecnicoRow[]}
          tecnicoIdsAsignados={tecnicoIdsAsignados}
        />
        <ZonaPeligro
          maquinaId={maquina.id}
          clienteIdActual={maquina.cliente_id}
          almacenes={almacenes}
        />
      </Card>
    </div>
  )
}
