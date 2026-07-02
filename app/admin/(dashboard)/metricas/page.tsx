import { Fragment } from 'react'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, Card } from '@/components/admin/ui'
import { urgenciaConfig } from '@/lib/utils'
import GraficoBarrasTecnico from '@/components/admin/metricas/GraficoBarrasTecnico'
import GraficoUrgencias from '@/components/admin/metricas/GraficoUrgencias'
import GraficoVisitasMes from '@/components/admin/metricas/GraficoVisitasMes'
import type { VisitaTecnicaRow, SolicitudRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type SolicitudResumen = Pick<SolicitudRow, 'id' | 'urgencia' | 'estado' | 'created_at' | 'ticket_id' | 'cliente_nombre'>

function horasEntre(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60)
}

function mesLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function MetricasPage() {
  const supabase = await createSSRClient()

  const [{ data: visitas }, { data: solicitudes }] = await Promise.all([
    supabase.from('visitas_tecnicas').select('*').order('created_at', { ascending: false }),
    supabase
      .from('solicitudes')
      .select('id, urgencia, estado, created_at, ticket_id, cliente_nombre')
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const todasVisitas = (visitas ?? []) as VisitaTecnicaRow[]
  const todasSolicitudes = (solicitudes ?? []) as SolicitudResumen[]

  const solicitudMap = new Map(todasSolicitudes.map(s => [s.id, s]))

  // --- Métricas por técnico ---
  const tecnicosMap = new Map<string, { respuesta: number[]; resolucion: number[] }>()

  for (const v of todasVisitas) {
    if (!tecnicosMap.has(v.tecnico_nombre)) {
      tecnicosMap.set(v.tecnico_nombre, { respuesta: [], resolucion: [] })
    }
    const entry = tecnicosMap.get(v.tecnico_nombre)!
    if (v.hora_llegada) {
      const sol = solicitudMap.get(v.solicitud_id)
      if (sol) entry.respuesta.push(horasEntre(sol.created_at, v.hora_llegada))
    }
    if (v.hora_llegada && v.hora_cierre) {
      entry.resolucion.push(horasEntre(v.hora_llegada, v.hora_cierre))
    }
  }

  const avg = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length

  const datosTiempos = Array.from(tecnicosMap.entries()).map(([nombre, d]) => ({
    nombre: nombre.split(' ')[0],
    respuesta: parseFloat(avg(d.respuesta).toFixed(2)),
    resolucion: parseFloat(avg(d.resolucion).toFixed(2)),
  }))

  // --- Urgencias ---
  const urgenciasCount: Record<string, number> = { baja: 0, media: 0, alta: 0, critica: 0 }
  for (const s of todasSolicitudes) {
    if (s.estado === 'resuelto') urgenciasCount[s.urgencia] = (urgenciasCount[s.urgencia] ?? 0) + 1
  }
  const datosUrgencias = (['critica', 'alta', 'media', 'baja'] as const).map(u => ({
    name: `${urgenciaConfig[u].emoji} ${urgenciaConfig[u].label}`,
    value: urgenciasCount[u] ?? 0,
    color: urgenciaConfig[u].color,
  }))

  // --- Visitas por mes por técnico ---
  const mesesSet = new Set<string>()
  const porMesTecnico = new Map<string, Map<string, number>>()
  for (const v of todasVisitas) {
    if (!v.hora_llegada) continue
    const mes = mesLabel(v.hora_llegada)
    mesesSet.add(mes)
    if (!porMesTecnico.has(mes)) porMesTecnico.set(mes, new Map())
    const mesMap = porMesTecnico.get(mes)!
    mesMap.set(v.tecnico_nombre, (mesMap.get(v.tecnico_nombre) ?? 0) + 1)
  }
  const tecnicosNombres = Array.from(tecnicosMap.keys())
  const meses = Array.from(mesesSet).sort()
  const datosVisitasMes = meses.map(mes => {
    const entry: Record<string, string | number> = { mes }
    for (const nombre of tecnicosNombres) {
      entry[nombre] = porMesTecnico.get(mes)?.get(nombre) ?? 0
    }
    return entry
  })

  // --- KPIs ---
  const visitasConLlegada = todasVisitas.filter(v => v.hora_llegada)
  const visitasCompletadas = todasVisitas.filter(v => v.hora_cierre).length
  const visitasSinCerrar = todasVisitas.filter(v => v.hora_llegada && !v.hora_cierre)
  const totalResueltos = todasSolicitudes.filter(s => s.estado === 'resuelto').length
  const tasaCierre = visitasConLlegada.length > 0
    ? Math.round(visitasCompletadas / visitasConLlegada.length * 100)
    : null

  const tiemposRespuesta = visitasConLlegada
    .map(v => {
      const sol = solicitudMap.get(v.solicitud_id)
      return sol ? horasEntre(sol.created_at, v.hora_llegada!) : null
    })
    .filter((v): v is number => v !== null)

  const avgRespuestaGlobal = avg(tiemposRespuesta)

  return (
    <div>
      <PageHeader
        titulo="Métricas de Campo"
        subtitulo="Tiempos de respuesta y eficiencia del equipo técnico"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Visitas completadas" value={visitasCompletadas.toString()} />
        <KpiCard
          label="Sin cerrar"
          value={visitasSinCerrar.length.toString()}
          color={visitasSinCerrar.length > 0 ? 'orange' : 'blue'}
        />
        <KpiCard label="Tickets resueltos" value={totalResueltos.toString()} color="green" />
        <KpiCard
          label="T. respuesta prom."
          value={tiemposRespuesta.length > 0 ? `${avgRespuestaGlobal.toFixed(1)}h` : '—'}
        />
        <KpiCard
          label="Tasa de cierre"
          value={tasaCierre !== null ? `${tasaCierre}%` : '—'}
          color={tasaCierre === null ? 'blue' : tasaCierre >= 80 ? 'green' : 'orange'}
        />
      </div>

      {/* Alerta: visitas sin cerrar */}
      {visitasSinCerrar.length > 0 && (
        <Card className="mb-6 border-orange-200 overflow-hidden">
          <div className="px-5 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
            <span className="text-orange-600 font-bold text-sm">⚠️ Visitas sin cerrar</span>
            <span className="text-xs text-orange-400">
              El técnico llegó pero no completó el informe ni la firma
            </span>
          </div>
          <div className="divide-y divide-orange-50">
            {visitasSinCerrar.map(v => {
              const sol = solicitudMap.get(v.solicitud_id)
              const msAbierta = v.hora_llegada
                ? Date.now() - new Date(v.hora_llegada).getTime()
                : null
              const tiempoLabel = msAbierta === null ? null
                : msAbierta < 3_600_000
                  ? `${Math.round(msAbierta / 60_000)}m`
                  : `${(msAbierta / 3_600_000).toFixed(1)}h`
              const esLarga = msAbierta !== null && msAbierta > 2 * 3_600_000

              return (
                <div key={v.id} className="px-5 py-3 flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">{v.tecnico_nombre}</span>
                    {sol && (
                      <span className="text-gray-500 ml-2 text-xs">
                        <span className="font-mono">{sol.ticket_id}</span>
                        {' · '}{sol.cliente_nombre}
                      </span>
                    )}
                    {v.hora_llegada && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Llegó: {formatFecha(v.hora_llegada)}
                      </p>
                    )}
                  </div>
                  {tiempoLabel && (
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${esLarga ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      Hace {tiempoLabel}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Tiempos promedio por técnico (horas)
          </h2>
          <GraficoBarrasTecnico datos={datosTiempos} />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Tickets resueltos por urgencia
          </h2>
          <GraficoUrgencias datos={datosUrgencias} />
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Visitas por mes por técnico
        </h2>
        <GraficoVisitasMes datos={datosVisitasMes} tecnicos={tecnicosNombres} />
      </Card>

      {/* Tabla de informes de visita */}
      {todasVisitas.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Informes de visita técnica
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Haz clic en "Ver informe" para leer la descripción de falla y solución
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-semibold">Técnico</th>
                  <th className="px-4 py-3 text-left font-semibold">Ticket</th>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold">Llegada</th>
                  <th className="px-4 py-3 text-left font-semibold">T. Resp.</th>
                  <th className="px-4 py-3 text-left font-semibold">T. Resol.</th>
                  <th className="px-4 py-3 text-left font-semibold">Firmante</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todasVisitas.slice(0, 50).map(v => {
                  const sol = solicitudMap.get(v.solicitud_id)
                  const tResp = sol && v.hora_llegada ? horasEntre(sol.created_at, v.hora_llegada) : null
                  const tResol = v.hora_llegada && v.hora_cierre ? horasEntre(v.hora_llegada, v.hora_cierre) : null
                  const tieneInforme = v.descripcion_falla || v.descripcion_solucion

                  return (
                    <Fragment key={v.id}>
                      <tr className="hover:bg-gray-50 align-top">
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{v.tecnico_nombre}</td>
                        <td className="px-4 py-3 font-mono text-gray-600 text-xs whitespace-nowrap">
                          {sol?.ticket_id ?? v.solicitud_id.slice(0, 8) + '…'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                          {sol?.cliente_nombre ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                          {v.hora_llegada ? formatFecha(v.hora_llegada) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {tResp !== null ? `${tResp.toFixed(1)}h` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {tResol !== null ? `${tResol.toFixed(1)}h` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                          {v.nombre_firmante ?? '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${v.hora_cierre ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {v.hora_cierre ? 'Completada' : 'En curso'}
                          </span>
                        </td>
                      </tr>

                      {/* Fila expandible con informe técnico */}
                      {tieneInforme && (
                        <tr className="bg-blue-50/30">
                          <td colSpan={8} className="px-4 pt-0 pb-3">
                            <details>
                              <summary className="text-xs text-blue-600 cursor-pointer select-none list-none hover:text-blue-800 pt-1">
                                Ver informe técnico ▾
                              </summary>
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 pl-2 border-l-2 border-blue-200">
                                {v.descripcion_falla && (
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                      Falla encontrada
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">{v.descripcion_falla}</p>
                                  </div>
                                )}
                                {v.descripcion_solucion && (
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                      Solución aplicada
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">{v.descripcion_solucion}</p>
                                  </div>
                                )}
                              </div>
                            </details>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  color = 'blue',
}: {
  label: string
  value: string
  color?: 'blue' | 'green' | 'orange'
}) {
  const bg = { blue: 'bg-blue-50', green: 'bg-green-50', orange: 'bg-orange-50' }[color]
  const textColor = { blue: '#162f52', green: '#166534', orange: '#9a3412' }[color]

  return (
    <Card className={`p-4 ${bg}`}>
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: textColor }}>{value}</p>
    </Card>
  )
}
