import { notFound } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, Card } from '@/components/admin/ui'
import MaquinaForm from '../MaquinaForm'
import ZonaPeligro from '../ZonaPeligro'
import MaquinaQR from '../MaquinaQR'
import { urgenciaConfig, formatearFecha } from '@/lib/utils'
import type { ClienteRow, MaquinaRow, TecnicoRow, SolicitudRow } from '@/lib/supabase/types'

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

  const [{ data: cls }, { data: tcs }, { data: asignaciones }, { data: alms }, { data: solsData }] = await Promise.all([
    supabase.from('clientes').select('*').eq('activo', true).order('nombre'),
    supabase.from('tecnicos').select('*').eq('activo', true).order('nombre'),
    supabase.from('maquina_tecnicos').select('tecnico_id').eq('maquina_id', maquina.id),
    supabase.from('clientes').select('*').eq('es_almacen', true).order('nombre'),
    supabase
      .from('solicitudes')
      .select('id, ticket_id, contador, urgencia, created_at, cliente_nombre, estado')
      .eq('maquina_id', maquina.id)
      .gt('contador', 0)
      .order('created_at', { ascending: true }),
  ])

  const tecnicoIdsAsignados = ((asignaciones ?? []) as { tecnico_id: string }[]).map(a => a.tecnico_id)
  const almacenes = (alms ?? []) as ClienteRow[]
  const clientesList = (cls ?? []) as ClienteRow[]
  const clienteActual = clientesList.find(c => c.id === maquina.cliente_id)?.nombre ?? '—'

  // Calcular deltas entre lecturas consecutivas
  type Lectura = Pick<SolicitudRow, 'id' | 'ticket_id' | 'contador' | 'urgencia' | 'created_at' | 'cliente_nombre' | 'estado'>
  const lecturas = (solsData ?? []) as Lectura[]
  const lecturasCon = lecturas.map((l, i) => ({
    ...l,
    delta: i === 0 ? null : l.contador - lecturas[i - 1].contador,
  }))

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
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

      {/* Historial de contadores */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3">
          Historial de contadores
          {lecturasCon.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              {lecturasCon.length} lectura{lecturasCon.length !== 1 ? 's' : ''}
              {' · '}último: {lecturasCon[lecturasCon.length - 1].contador.toLocaleString('es-VE')}
            </span>
          )}
        </h2>

        {lecturasCon.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-gray-500">Aún no hay lecturas registradas para este equipo.</p>
            <p className="text-xs text-gray-400 mt-1">Se registran automáticamente cuando un cliente envía una solicitud de soporte.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold">Ticket</th>
                  <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                  <th className="text-right px-4 py-3 font-semibold">Contador</th>
                  <th className="text-right px-4 py-3 font-semibold">Copias desde anterior</th>
                  <th className="text-left px-4 py-3 font-semibold">Urgencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...lecturasCon].reverse().map(l => {
                  const u = urgenciaConfig[l.urgencia]
                  return (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatearFecha(l.created_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">
                        {l.ticket_id}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">{l.cliente_nombre}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-800">
                        {l.contador.toLocaleString('es-VE')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {l.delta === null ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <span className={`text-xs font-semibold ${l.delta < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                            {l.delta < 0 ? '' : '+'}{l.delta.toLocaleString('es-VE')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                          style={{ backgroundColor: u.color + '22', color: u.color }}
                        >
                          {u.emoji} {u.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  )
}
