import Link from 'next/link'
import { createSSRClient } from '@/lib/supabase/server'
import { formatearFecha } from '@/lib/utils'
import type { SolicitudRow } from '@/lib/supabase/types'

type Metric = {
  label: string
  value: number
  color: string
  href: string
  icon: React.ReactNode
}

const urgenciaBadge: Record<string, { bg: string; text: string; label: string }> = {
  baja:    { bg: '#d1fae5', text: '#065f46', label: 'Baja' },
  media:   { bg: '#fef3c7', text: '#92400e', label: 'Media' },
  alta:    { bg: '#fed7aa', text: '#9a3412', label: 'Alta' },
  critica: { bg: '#fecaca', text: '#991b1b', label: 'Crítica' },
}

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  pendiente:  { bg: '#fef3c7', text: '#92400e', label: 'Pendiente' },
  en_proceso: { bg: '#dbeafe', text: '#1e40af', label: 'En proceso' },
  resuelto:   { bg: '#d1fae5', text: '#065f46', label: 'Resuelto' },
}

export default async function DashboardPage() {
  const supabase = await createSSRClient()

  // Fechas
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const inicioSemana = new Date(hoy)
  inicioSemana.setDate(hoy.getDate() - hoy.getDay())

  const [
    { count: maquinasActivas },
    { count: solicitudesHoy },
    { count: solicitudesSemana },
    { count: solicitudesPendientes },
    { data: ultimas },
  ] = await Promise.all([
    supabase.from('maquinas').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('solicitudes').select('*', { count: 'exact', head: true }).gte('created_at', hoy.toISOString()),
    supabase.from('solicitudes').select('*', { count: 'exact', head: true }).gte('created_at', inicioSemana.toISOString()),
    supabase.from('solicitudes').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('solicitudes').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  const solicitudes = (ultimas ?? []) as SolicitudRow[]

  const metrics: Metric[] = [
    {
      label: 'Máquinas activas',
      value: maquinasActivas ?? 0,
      color: '#162f52',
      href: '/admin/maquinas',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      ),
    },
    {
      label: 'Solicitudes hoy',
      value: solicitudesHoy ?? 0,
      color: '#295536',
      href: '/admin/solicitudes',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      ),
    },
    {
      label: 'Solicitudes esta semana',
      value: solicitudesSemana ?? 0,
      color: '#1e40af',
      href: '/admin/solicitudes',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      ),
    },
    {
      label: 'Pendientes',
      value: solicitudesPendientes ?? 0,
      color: '#73262f',
      href: '/admin/solicitudes?estado=pendiente',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen del sistema de soporte</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(m => (
          <Link
            key={m.label}
            href={m.href}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${m.color}15` }}
              >
                <svg className="w-5 h-5" fill="none" stroke={m.color} viewBox="0 0 24 24">
                  {m.icon}
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{m.label}</p>
          </Link>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Link href="/admin/clientes/nuevo" className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Nuevo cliente</p>
            <p className="text-xs text-gray-500">Agregar empresa</p>
          </div>
        </Link>
        <Link href="/admin/maquinas" className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Nueva máquina</p>
            <p className="text-xs text-gray-500">Registrar equipo</p>
          </div>
        </Link>
        <Link href="/admin/stickers" className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Generar stickers</p>
            <p className="text-xs text-gray-500">Imprimir QR codes</p>
          </div>
        </Link>
      </div>

      {/* Últimas solicitudes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Últimas solicitudes</h2>
          <Link href="/admin/solicitudes" className="text-xs font-semibold text-blue-600 hover:underline">
            Ver todas →
          </Link>
        </div>

        {solicitudes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">Aún no hay solicitudes registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Ticket</th>
                  <th className="text-left px-5 py-3 font-semibold">Cliente</th>
                  <th className="text-left px-5 py-3 font-semibold">Máquina</th>
                  <th className="text-left px-5 py-3 font-semibold">Urgencia</th>
                  <th className="text-center px-5 py-3 font-semibold">Tóner</th>
                  <th className="text-left px-5 py-3 font-semibold">Estado</th>
                  <th className="text-left px-5 py-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {solicitudes.map(s => {
                  const u = urgenciaBadge[s.urgencia]
                  const e = estadoBadge[s.estado]
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">{s.ticket_id}</td>
                      <td className="px-5 py-3 text-gray-800">{s.cliente_nombre}</td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-gray-800 font-medium">{s.modelo}</p>
                          <p className="text-xs text-gray-400 font-mono">{s.serial}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: u.bg, color: u.text }}
                        >
                          {u.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {s.necesita_toner ? <span className="text-red-600 font-semibold">Sí</span> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: e.bg, color: e.text }}
                        >
                          {e.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{formatearFecha(s.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
