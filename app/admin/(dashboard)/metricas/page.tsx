import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, Card } from '@/components/admin/ui'
import { urgenciaConfig } from '@/lib/utils'
import GraficoBarrasTecnico from '@/components/admin/metricas/GraficoBarrasTecnico'
import GraficoUrgencias from '@/components/admin/metricas/GraficoUrgencias'
import GraficoVisitasMes from '@/components/admin/metricas/GraficoVisitasMes'
import type { VisitaTecnicaRow, SolicitudRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

function horasEntre(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60)
}

function mesLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function MetricasPage() {
  const supabase = await createSSRClient()

  const [{ data: visitas }, { data: solicitudes }] = await Promise.all([
    supabase.from('visitas_tecnicas').select('*').order('created_at', { ascending: false }),
    supabase.from('solicitudes').select('id, urgencia, estado, created_at').order('created_at', { ascending: false }).limit(500),
  ])

  const todasVisitas = (visitas ?? []) as VisitaTecnicaRow[]
  const todasSolicitudes = (solicitudes ?? []) as Pick<SolicitudRow, 'id' | 'urgencia' | 'estado' | 'created_at'>[]

  // Mapa solicitud_id → created_at para cálculo de tiempo de respuesta
  const solicitudMap = new Map(todasSolicitudes.map(s => [s.id, s.created_at]))

  // --- Métricas por técnico ---
  const tecnicosMap = new Map<string, { respuesta: number[]; resolucion: number[] }>()

  for (const v of todasVisitas) {
    if (!tecnicosMap.has(v.tecnico_nombre)) {
      tecnicosMap.set(v.tecnico_nombre, { respuesta: [], resolucion: [] })
    }
    const entry = tecnicosMap.get(v.tecnico_nombre)!

    if (v.hora_llegada) {
      const solicitudCreada = solicitudMap.get(v.solicitud_id)
      if (solicitudCreada) {
        entry.respuesta.push(horasEntre(solicitudCreada, v.hora_llegada))
      }
    }
    if (v.hora_llegada && v.hora_cierre) {
      entry.resolucion.push(horasEntre(v.hora_llegada, v.hora_cierre))
    }
  }

  const avg = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length

  const datosTiempos = Array.from(tecnicosMap.entries()).map(([nombre, d]) => ({
    nombre: nombre.split(' ')[0], // primer nombre para que quepa en el gráfico
    respuesta: parseFloat(avg(d.respuesta).toFixed(2)),
    resolucion: parseFloat(avg(d.resolucion).toFixed(2)),
  }))

  // --- Métricas por urgencia (resueltos) ---
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

  // --- KPIs rápidos ---
  const visitasCompletadas = todasVisitas.filter(v => v.hora_cierre).length
  const visitasEnCurso = todasVisitas.filter(v => v.hora_llegada && !v.hora_cierre).length
  const totalResueltos = todasSolicitudes.filter(s => s.estado === 'resuelto').length

  const tiemposRespuestaTotal = todasVisitas
    .filter(v => v.hora_llegada)
    .map(v => {
      const sc = solicitudMap.get(v.solicitud_id)
      return sc ? horasEntre(sc, v.hora_llegada!) : null
    })
    .filter((v): v is number => v !== null)

  const avgRespuestaGlobal = avg(tiemposRespuestaTotal)

  return (
    <div>
      <PageHeader
        titulo="Métricas de Campo"
        subtitulo="Tiempos de respuesta y eficiencia del equipo técnico"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Visitas completadas" value={visitasCompletadas.toString()} />
        <KpiCard label="En curso" value={visitasEnCurso.toString()} color="orange" />
        <KpiCard label="Tickets resueltos" value={totalResueltos.toString()} color="green" />
        <KpiCard
          label="T. respuesta promedio"
          value={tiemposRespuestaTotal.length > 0 ? `${avgRespuestaGlobal.toFixed(1)}h` : '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tiempos por técnico */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Tiempos promedio por técnico (horas)
          </h2>
          <GraficoBarrasTecnico datos={datosTiempos} />
        </Card>

        {/* Urgencias resueltas */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Tickets resueltos por urgencia
          </h2>
          <GraficoUrgencias datos={datosUrgencias} />
        </Card>
      </div>

      {/* Visitas por mes */}
      <Card className="p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Visitas por mes por técnico
        </h2>
        <GraficoVisitasMes datos={datosVisitasMes} tecnicos={tecnicosNombres} />
      </Card>

      {/* Tabla detalle de visitas recientes */}
      {todasVisitas.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Visitas recientes
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-semibold">Técnico</th>
                  <th className="px-4 py-3 text-left font-semibold">Ticket</th>
                  <th className="px-4 py-3 text-left font-semibold">Llegada</th>
                  <th className="px-4 py-3 text-left font-semibold">T. Respuesta</th>
                  <th className="px-4 py-3 text-left font-semibold">T. Resolución</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todasVisitas.slice(0, 50).map(v => {
                  const sc = solicitudMap.get(v.solicitud_id)
                  const tRespuesta = sc && v.hora_llegada ? horasEntre(sc, v.hora_llegada) : null
                  const tResolucion = v.hora_llegada && v.hora_cierre ? horasEntre(v.hora_llegada, v.hora_cierre) : null
                  return (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{v.tecnico_nombre}</td>
                      <td className="px-4 py-3 font-mono text-gray-600 text-xs">{v.solicitud_id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {v.hora_llegada ? new Date(v.hora_llegada).toLocaleString('es-VE') : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {tRespuesta !== null ? `${tRespuesta.toFixed(1)}h` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {tResolucion !== null ? `${tResolucion.toFixed(1)}h` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${v.hora_cierre ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {v.hora_cierre ? 'Completada' : 'En curso'}
                        </span>
                      </td>
                    </tr>
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
  const text = { blue: '#162f52', green: '#166534', orange: '#9a3412' }[color]

  return (
    <Card className={`p-4 ${bg}`}>
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: text }}>{value}</p>
    </Card>
  )
}
