import Link from 'next/link'
import { createSSRClient } from '@/lib/supabase/server'
import { createAdminSSRClient } from '@/lib/admin/supabase-admin'
import { PageHeader, Card, Badge, EmptyState } from '@/components/admin/ui'
import type { ClienteRow } from '@/lib/supabase/types'
import FiltroContadores from './FiltroContadores'

export default async function ContadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ atc?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createSSRClient()
  const adminDb = await createAdminSSRClient()

  // Fetch clientes del schema PUBLIC (mismos que en Soporte QR)
  let query = supabase
    .from('clientes')
    .select('*')
    .eq('es_almacen', false)
    .eq('activo', true)
    .order('nombre')

  if (params.q) {
    query = query.or(`nombre.ilike.%${params.q}%,rif.ilike.%${params.q}%`)
  }

  const { data: clientes } = await query
  let lista = (clientes ?? []) as ClienteRow[]

  // Filtro por ATC (atc_email contiene ATC1, ATC2, ATC3)
  if (params.atc) {
    lista = lista.filter(c => c.atc_email?.toUpperCase().includes(params.atc!.toUpperCase()))
  }

  // Conteo de maquinas por cliente
  const { data: maqs } = await supabase.from('maquinas').select('cliente_id, activo')
  const conteoEquipos = new Map<string, number>()
  ;((maqs ?? []) as { cliente_id: string; activo: boolean }[]).forEach(m => {
    if (m.activo) conteoEquipos.set(m.cliente_id, (conteoEquipos.get(m.cliente_id) ?? 0) + 1)
  })

  // Ultimo cobro mensual por cliente (admin schema)
  const { data: cobros } = await adminDb
    .from('cobros_mensuales')
    .select('cliente_id, periodo, estado_relacion, copias_bn, total_usd')
    .order('periodo', { ascending: false })
  const ultimoCobro = new Map<string, { periodo: string; estado: string; copias: number; total: number }>()
  ;(cobros ?? []).forEach((c: { cliente_id: string; periodo: string; estado_relacion: string; copias_bn: number; total_usd: number }) => {
    if (!ultimoCobro.has(c.cliente_id)) {
      ultimoCobro.set(c.cliente_id, {
        periodo: c.periodo,
        estado: c.estado_relacion ?? 'pendiente',
        copias: c.copias_bn ?? 0,
        total: Number(c.total_usd ?? 0),
      })
    }
  })

  const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
    pendiente: { bg: '#fef3c7', text: '#92400e', label: 'Pendiente' },
    proforma: { bg: '#dbeafe', text: '#1e40af', label: 'Proforma' },
    listo: { bg: '#d1fae5', text: '#065f46', label: 'Listo' },
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <PageHeader
        titulo="Contadores"
        subtitulo="Gestión de lecturas de contadores y relaciones anexas por cliente"
      />

      <FiltroContadores atc={params.atc} q={params.q} />

      <Card>
        {lista.length === 0 ? (
          <EmptyState
            titulo="Sin clientes registrados"
            subtitulo="Agregue clientes en la sección Clientes para gestionar contadores."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Cliente</th>
                  <th className="text-left px-5 py-3 font-semibold">RIF</th>
                  <th className="text-left px-5 py-3 font-semibold">ATC</th>
                  <th className="text-center px-5 py-3 font-semibold">Máquinas</th>
                  <th className="text-left px-5 py-3 font-semibold">Último Periodo</th>
                  <th className="text-left px-5 py-3 font-semibold">Estado</th>
                  <th className="text-right px-5 py-3 font-semibold">Total USD</th>
                  <th className="text-right px-5 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((c) => {
                  const uc = ultimoCobro.get(c.id)
                  const badge = uc ? estadoBadge[uc.estado] ?? estadoBadge.pendiente : null
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/contadores/${c.id}`}
                          className="font-semibold text-gray-800 hover:text-blue-600"
                        >
                          {c.nombre}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-600 font-mono text-xs">{c.rif || '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{c.atc_email || '—'}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                          {conteoEquipos.get(c.id) ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">
                        {uc ? uc.periodo : <span className="text-gray-400">Sin datos</span>}
                      </td>
                      <td className="px-5 py-3">
                        {badge ? (
                          <Badge bg={badge.bg} text={badge.text} label={badge.label} />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs text-gray-700">
                        {uc ? `$${uc.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/contadores/${c.id}`}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Ver contadores
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
