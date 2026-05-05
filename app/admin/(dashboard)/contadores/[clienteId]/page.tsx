import Link from 'next/link'
import { createSSRClient } from '@/lib/supabase/server'
import { createAdminSSRClient } from '@/lib/admin/supabase-admin'
import { PageHeader, Card, SecondaryButton } from '@/components/admin/ui'
import type { ClienteRow } from '@/lib/supabase/types'
import ClienteContadoresView from './ClienteContadoresView'

export default async function ContadoresClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ clienteId: string }>
  searchParams: Promise<{ anio?: string; mes?: string }>
}) {
  const { clienteId } = await params
  const sp = await searchParams
  const currentYear = new Date().getFullYear()
  const anio = parseInt(sp.anio ?? String(currentYear))
  const mesSeleccionado = sp.mes ?? null

  const supabase = await createSSRClient()
  const adminDb = await createAdminSSRClient()

  // Info del cliente (schema PUBLIC)
  const { data: clienteRaw } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .single()

  const cliente = clienteRaw as (ClienteRow & {
    copiado_minimo?: number
    tarifa_fija_usd?: number
    tarifa_bn_usd?: number
    tarifa_color_usd?: number
  }) | null

  if (!cliente) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl">
        <PageHeader titulo="Cliente no encontrado" />
        <SecondaryButton href="/admin/contadores">Volver</SecondaryButton>
      </div>
    )
  }

  // Maquinas del cliente (schema PUBLIC)
  const { data: maquinas } = await supabase
    .from('maquinas')
    .select('id, serial, modelo, ubicacion')
    .eq('cliente_id', clienteId)
    .eq('activo', true)
    .order('serial')

  // Cobros mensuales del año (admin schema, pero con IDs de public)
  const { data: cobros } = await adminDb
    .from('cobros_mensuales')
    .select('*')
    .eq('cliente_id', clienteId)
    .gte('periodo', `${anio}-01`)
    .lte('periodo', `${anio}-12`)
    .order('periodo')

  // Lecturas del mes seleccionado
  let lecturas: {
    equipo_id: string
    contador_bn: number
    contador_color: number
    copias_periodo_bn: number
    copias_periodo_color: number
    fecha: string
  }[] = []

  if (mesSeleccionado) {
    const maquinaIds = (maquinas ?? []).map((m: { id: string }) => m.id)
    if (maquinaIds.length > 0) {
      const inicioMes = `${mesSeleccionado}-01`
      const [y, m] = mesSeleccionado.split('-').map(Number)
      const finMes = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`

      const { data: lects } = await adminDb
        .from('lecturas_contador')
        .select('equipo_id, contador_bn, contador_color, copias_periodo_bn, copias_periodo_color, fecha')
        .in('equipo_id', maquinaIds)
        .gte('fecha', inicioMes)
        .lte('fecha', finMes)

      lecturas = lects ?? []
    }
  }

  // Tasa BCV mas reciente
  const { data: tasa } = await adminDb
    .from('tasas_cambio')
    .select('bs_usd, fecha')
    .order('fecha', { ascending: false })
    .limit(1)
    .single()

  const tasaBcv = Number(tasa?.bs_usd ?? 0)
  const fechaTasa = tasa?.fecha ?? ''

  // Cobro del mes seleccionado
  const cobroMes = mesSeleccionado
    ? (cobros ?? []).find((c: { periodo: string }) => c.periodo === mesSeleccionado) ?? null
    : null

  // Meses con datos
  const mesesConDatos = new Set((cobros ?? []).map((c: { periodo: string }) => c.periodo))

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <PageHeader
        titulo={cliente.nombre}
        subtitulo={`${cliente.rif ? `RIF: ${cliente.rif} | ` : ''}${cliente.atc_email || ''} | ${cliente.direccion ?? ''}`}
        actions={
          <Link
            href="/admin/contadores"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            Volver
          </Link>
        }
      />

      <ClienteContadoresView
        clienteId={clienteId}
        cliente={{
          razon_social: cliente.nombre,
          rif: cliente.rif ?? '',
          direccion: cliente.direccion ?? '',
          atc: cliente.atc_email ?? '',
          tarifa_bn_usd: Number(cliente.tarifa_bn_usd ?? 0.04),
          tarifa_color_usd: Number(cliente.tarifa_color_usd ?? 0.60),
          copiado_minimo: cliente.copiado_minimo ?? 0,
          tarifa_fija_usd: Number(cliente.tarifa_fija_usd ?? 0),
        }}
        equipos={(maquinas ?? []).map((m: { id: string; serial: string; modelo: string; ubicacion: string | null }) => ({
          id: m.id,
          serial: m.serial,
          modelo: m.modelo ?? '',
          marca: '',
          ubicacion: m.ubicacion ?? '',
        }))}
        anio={anio}
        mesSeleccionado={mesSeleccionado}
        mesesConDatos={Array.from(mesesConDatos)}
        lecturas={lecturas}
        cobroMes={cobroMes ? {
          periodo: cobroMes.periodo,
          copias_bn: cobroMes.copias_bn ?? 0,
          copias_color: cobroMes.copias_color ?? 0,
          monto_bn_usd: Number(cobroMes.monto_bn_usd ?? 0),
          monto_color_usd: Number(cobroMes.monto_color_usd ?? 0),
          total_usd: Number(cobroMes.total_usd ?? 0),
          tasa_bcv: Number(cobroMes.tasa_bcv ?? 0),
          estado_relacion: cobroMes.estado_relacion ?? 'pendiente',
          aplica_minimo: cobroMes.aplica_minimo ?? false,
          monto_minimo_usd: Number(cobroMes.monto_minimo_usd ?? 0),
        } : null}
        tasaBcv={tasaBcv}
        fechaTasa={fechaTasa}
      />
    </div>
  )
}
