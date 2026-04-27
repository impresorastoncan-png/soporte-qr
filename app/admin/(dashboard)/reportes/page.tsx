import { createAdminSSRClient } from '@/lib/admin/supabase-admin'
import { createSSRClient } from '@/lib/supabase/server'
import PinGate from './PinGate'
import DashboardReportes, { type ReportesData } from './DashboardReportes'

export default async function ReportesPage() {
  const adminDb = await createAdminSSRClient()
  const publicDb = await createSSRClient()

  // Queries en paralelo
  const [
    { count: empleadosCount },
    { data: salarioRow },
    { count: clientesCount },
    { count: equiposCampo },
    { count: equiposInventario },
    { data: tasaRow },
  ] = await Promise.all([
    adminDb.from('empleados').select('*', { count: 'exact', head: true }).eq('activo', true),
    adminDb.rpc('sum_salarios') as unknown as { data: { total: number } | null },
    adminDb.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
    adminDb.from('equipos').select('*', { count: 'exact', head: true }).eq('estado', 'campo'),
    adminDb.from('equipos').select('*', { count: 'exact', head: true }).eq('estado', 'inventario'),
    adminDb.from('tasas_cambio').select('*').order('fecha', { ascending: false }).limit(1).single(),
  ])

  // Fallback: contar maquinas del schema public si no hay equipos admin
  let totalEquiposCampo = equiposCampo ?? 0
  let totalEquiposInv = equiposInventario ?? 0
  if (totalEquiposCampo === 0) {
    const { count } = await publicDb.from('maquinas').select('*', { count: 'exact', head: true }).eq('activo', true)
    totalEquiposCampo = count ?? 0
  }

  // Calcular suma de salarios manualmente si el RPC no existe
  let sumaSalarios = 0
  if (salarioRow && typeof salarioRow === 'object' && 'total' in salarioRow) {
    sumaSalarios = (salarioRow as { total: number }).total
  } else {
    const { data: allEmpleados } = await adminDb.from('empleados').select('salario_base_usd').eq('activo', true)
    if (allEmpleados) {
      sumaSalarios = allEmpleados.reduce((acc, e) => acc + (Number(e.salario_base_usd) || 0), 0)
    }
  }

  const data: ReportesData = {
    empleados: empleadosCount ?? 0,
    sumaSalarios,
    clientesActivos: clientesCount ?? 0,
    equiposCampo: totalEquiposCampo,
    equiposInventario: totalEquiposInv,
    tasaUsd: tasaRow?.bs_usd ?? 0,
    tasaEur: tasaRow?.bs_eur ?? 0,
    tasaFecha: tasaRow?.fecha ?? null,
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PinGate
        lockedFallback={<DashboardReportes data={data} unlocked={false} />}
      >
        <DashboardReportes data={data} unlocked={true} />
      </PinGate>
    </div>
  )
}
