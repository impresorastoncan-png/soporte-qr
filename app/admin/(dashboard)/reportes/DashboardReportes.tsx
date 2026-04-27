'use client'

import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import Link from 'next/link'

export type ReportesData = {
  empleados: number
  sumaSalarios: number
  clientesActivos: number
  equiposCampo: number
  equiposInventario: number
  tasaUsd: number
  tasaEur: number
  tasaFecha: string | null
}

const fmtUsd = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toLocaleString('es-VE')}`
const fmtNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toLocaleString('es-VE')

/* ─── datos hardcoded (se reemplazarán con importaciones reales) ─── */
const COPIAS_MES = 527_478
const INGRESOS_MES = 26_374
const COSTOS_MES = 18_169
const MARGEN = INGRESOS_MES - COSTOS_MES
const MARGEN_PCT = ((MARGEN / INGRESOS_MES) * 100).toFixed(1)

const ROI = {
  inversion: 71_560,
  boss: 54_350,
  cbm: 17_210,
  nacionalizacion: 7_156,
  totalInversion: 78_716,
  ingresoProy: 14_760,
  payback: 4.8,
  roiAnual: 198,
  copiasBN: 11_200,
  copiasColor: 9_000,
  costoOp: 5_440,
  utilidadNeta: 14_760,
}

const TOP_CLIENTES = [
  { pos: 1, nombre: 'F. Stanzione', atc: 'ATC3', equipos: 2, copias: 63_041, copEq: 31_521, eficiencia: 'Optimo' },
  { pos: 2, nombre: 'Inv. Altamirano', atc: 'ATC3', equipos: 1, copias: 18_524, copEq: 18_524, eficiencia: 'Optimo' },
  { pos: 3, nombre: 'Alimentos Maco', atc: 'ATC3', equipos: 5, copias: 32_955, copEq: 6_591, eficiencia: 'Alto' },
  { pos: 4, nombre: 'Taurel', atc: 'ATC2', equipos: 1, copias: 4_993, copEq: 4_993, eficiencia: 'Alto' },
  { pos: 5, nombre: 'K-NOB Trading', atc: 'ATC2', equipos: 2, copias: 6_197, copEq: 3_099, eficiencia: 'Medio' },
  { pos: 6, nombre: 'Bolip Guamache', atc: 'ATC1', equipos: 8, copias: 21_590, copEq: 2_699, eficiencia: 'Medio' },
  { pos: 7, nombre: 'Centro Ort. Pod.', atc: 'ATC2', equipos: 4, copias: 10_168, copEq: 2_542, eficiencia: 'Medio' },
  { pos: 8, nombre: 'Bolip La Guaira', atc: 'ATC1', equipos: 46, copias: 105_878, copEq: 2_302, eficiencia: 'Medio' },
  { pos: 9, nombre: 'Epran', atc: 'ATC2', equipos: 1, copias: 1_785, copEq: 1_785, eficiencia: 'Medio' },
  { pos: 10, nombre: 'Bolip Sede', atc: 'ATC1', equipos: 35, copias: 54_898, copEq: 1_569, eficiencia: 'Medio' },
]

const CLIENTES_BAJO = [
  { nombre: 'Bolip La Ceiba', detalle: '5 eq. -> 387 cop/eq (muy bajo)', tipo: 'warning' },
  { nombre: 'Bolip Pto Seco', detalle: '3 eq. -> 1,336 cop/eq (bajo)', tipo: 'warning' },
  { nombre: 'Gente Creativa', detalle: '1 eq. -> 279 cop/eq (critico)', tipo: 'danger' },
]

const PROYECCION = [
  { concepto: 'Equipos en campo', actual: '268', proy: '418', delta: '+56%', up: true },
  { concepto: 'Copias mensuales', actual: '527,478', proy: '822,624', delta: '+56%', up: true },
  { concepto: 'Ingresos mensuales', actual: '$26,374', proy: '$41,131', delta: '+56%', up: true },
  { concepto: 'Costos operativos', actual: '$18,169', proy: '$25,837', delta: '+42%', up: false },
  { concepto: 'Margen Bruto', actual: '$8,205', proy: '$15,294', delta: '+86%', up: true, bold: true },
  { concepto: 'Margen %', actual: '31.1%', proy: '37.2%', delta: '+6.1pp', up: true },
]

/* ─── componente ─── */

export default function DashboardReportes({
  data,
  unlocked,
}: {
  data: ReportesData
  unlocked: boolean
}) {
  const atcChartRef = useRef<HTMLCanvasElement>(null)
  const nominaChartRef = useRef<HTMLCanvasElement>(null)
  const proyChartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const charts: Chart[] = []

    if (unlocked && atcChartRef.current) {
      charts.push(new Chart(atcChartRef.current, {
        type: 'bar',
        data: {
          labels: ['ATC1', 'ATC2', 'ATC3'],
          datasets: [{ label: 'Copias/Equipo', data: [1545, 1481, 7066], backgroundColor: ['#162f52', '#3b82f6', '#dc2626'] }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#9ca3af', font: { size: 10 } }, grid: { color: '#f3f4f6' } },
            x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { display: false } },
          },
        },
      }))
    }

    if (unlocked && nominaChartRef.current) {
      charts.push(new Chart(nominaChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Direccion', 'Tecnicos', 'Admin', 'Otros'],
          datasets: [{ data: [2341, 2972, 2156, 1784], backgroundColor: ['#dc2626', '#162f52', '#3b82f6', '#f59e0b'], borderWidth: 0 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { font: { size: 10 }, padding: 8, color: '#6b7280' } } },
        },
      }))
    }

    if (unlocked && proyChartRef.current) {
      charts.push(new Chart(proyChartRef.current, {
        type: 'line',
        data: {
          labels: ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          datasets: [
            { label: 'Ingresos', data: [28000, 32000, 36000, 39000, 40000, 41000, 41131, 41131, 41131], borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', fill: true, tension: 0.4 },
            { label: 'Costos', data: [19000, 21000, 23000, 24500, 25200, 25600, 25837, 25837, 25837], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { font: { size: 10 }, padding: 12, color: '#6b7280' } } },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#9ca3af', font: { size: 10 }, callback: (v) => `$${Number(v) / 1000}K` }, grid: { color: '#f3f4f6' } },
            x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { display: false } },
          },
        },
      }))
    }

    return () => charts.forEach(c => c.destroy())
  }, [unlocked])

  const blur = !unlocked ? 'blur-md select-none pointer-events-none' : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de Gestion Integral</h1>
          <p className="text-sm text-gray-500 mt-1">Analisis consolidado: ROI, Rentabilidad, Personal y Proyecciones</p>
        </div>
        <Link
          href="/admin/reportes/importar"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#162f52' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Importar datos
        </Link>
      </div>

      {!unlocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg mt-0.5">&#9888;</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Datos financieros protegidos</p>
            <p className="text-xs text-amber-600">Ingresa el PIN para ver nomina, cobros, costos y proyecciones detalladas.</p>
          </div>
        </div>
      )}

      {/* ─── 1. STATS GRID ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon="users" color="#22c55e" value={data.empleados.toString()} label="Empleados" />
        <StatCard icon="printer" color="#3b82f6" value={data.equiposCampo.toString()} label="Equipos en Campo" change={`+${data.equiposInventario} inventario`} />
        <StatCard icon="copy" color="#f59e0b" value={fmtNum(COPIAS_MES)} label="Copias/Mes" />
        <StatCard icon="building" color="#a855f7" value={data.clientesActivos.toString()} label="Clientes Activos" />
        <div className={blur}>
          <StatCard icon="dollar" color="#06b6d4" value={fmtUsd(INGRESOS_MES)} label="Ingresos/Mes" />
        </div>
        <div className={blur}>
          <StatCard icon="chart" color="#ef4444" value={fmtUsd(MARGEN)} label="Margen Bruto" change={`${MARGEN_PCT}% margen`} />
        </div>
      </div>

      {/* ─── 2. ROI ─── */}
      <Section title="Analisis ROI - Equipos Importados (150 unidades)">
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${blur}`}>
          <RoiCard label="INVERSION TOTAL" value={`$${ROI.inversion.toLocaleString('es-VE')}`} sub={`Boss $${ROI.boss.toLocaleString('es-VE')} + CBM $${ROI.cbm.toLocaleString('es-VE')}`} variant="danger" />
          <RoiCard label="INGRESO PROYECTADO/MES" value={`$${ROI.ingresoProy.toLocaleString('es-VE')}`} sub="150 eq x 1,968 cop x $0.05" variant="green" />
          <RoiCard label="PAYBACK" value={ROI.payback.toString()} sub="meses para recuperar" variant="green" />
          <RoiCard label="ROI ANUAL" value={`${ROI.roiAnual}%`} sub="retorno sobre inversion" variant="green" />
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 ${blur}`}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Desglose de Inversion</div>
            <div className="p-4 space-y-0">
              <MiniStat label={`Boss International (110 eq. usados)`} value={`$${ROI.boss.toLocaleString('es-VE')}`} />
              <MiniStat label={`CBM Trading (40 Canon IR1643i II)`} value={`$${ROI.cbm.toLocaleString('es-VE')}`} />
              <MiniStat label="Nacionalizacion estimada (10%)" value={`$${ROI.nacionalizacion.toLocaleString('es-VE')}`} />
              <div className="flex justify-between items-center px-0 py-3 -mx-4 -mb-4 px-4 bg-gray-50 font-semibold text-sm">
                <span>TOTAL INVERSION</span>
                <span className="text-red-600">${ROI.totalInversion.toLocaleString('es-VE')}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Proyeccion de Ingresos (150 equipos)</div>
            <div className="p-4 space-y-0">
              <MiniStat label="Copias B/N (280K x $0.04)" value={`$${ROI.copiasBN.toLocaleString('es-VE')}`} color="text-green-600" />
              <MiniStat label="Copias Color (15K x $0.60)" value={`$${ROI.copiasColor.toLocaleString('es-VE')}`} color="text-green-600" />
              <MiniStat label="Costo operativo adicional (est.)" value={`-$${ROI.costoOp.toLocaleString('es-VE')}`} color="text-red-600" />
              <div className="flex justify-between items-center px-4 py-3 -mx-4 -mb-4 rounded-b-xl font-semibold text-sm text-white" style={{ backgroundColor: '#162f52' }}>
                <span>UTILIDAD NETA MENSUAL</span>
                <span>${ROI.utilidadNeta.toLocaleString('es-VE')}</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── 3. RENTABILIDAD ─── */}
      <Section title="Analisis de Rentabilidad por Cliente/ATC">
        <div className={`grid grid-cols-1 xl:grid-cols-3 gap-4 ${blur}`}>
          {/* Tabla top 10 */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-800">Top 10 Clientes por Rentabilidad</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">Copias/Equipo</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">#</th>
                    <th className="text-left px-4 py-2 font-semibold">Cliente</th>
                    <th className="text-left px-4 py-2 font-semibold">ATC</th>
                    <th className="text-right px-4 py-2 font-semibold">Eq.</th>
                    <th className="text-right px-4 py-2 font-semibold">Copias</th>
                    <th className="text-right px-4 py-2 font-semibold">Cop/Eq</th>
                    <th className="text-left px-4 py-2 font-semibold">Eficiencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {TOP_CLIENTES.map(c => (
                    <tr key={c.pos} className={c.eficiencia === 'Optimo' ? 'bg-green-50/50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2 font-semibold text-gray-600">{c.pos <= 3 ? ['', '\u{1F947}', '\u{1F948}', '\u{1F949}'][c.pos] : c.pos}</td>
                      <td className="px-4 py-2 font-semibold text-gray-800">{c.nombre}</td>
                      <td className="px-4 py-2"><AtcBadge atc={c.atc} /></td>
                      <td className="px-4 py-2 text-right text-gray-700">{c.equipos}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{c.copias.toLocaleString('es-VE')}</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">{c.copEq.toLocaleString('es-VE')}</td>
                      <td className="px-4 py-2"><EfBadge ef={c.eficiencia} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts + alertas */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Rentabilidad por ATC</div>
              <div className="p-4" style={{ height: 200 }}>
                <canvas ref={atcChartRef} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Clientes Bajo Rendimiento</div>
              <div className="p-3 space-y-2">
                {CLIENTES_BAJO.map(c => (
                  <div key={c.nombre} className={`px-3 py-2 rounded-lg text-xs border-l-3 ${c.tipo === 'danger' ? 'bg-red-50 border-l-red-500' : 'bg-amber-50 border-l-amber-500'}`} style={{ borderLeftWidth: 3 }}>
                    <p className="font-semibold text-gray-800">{c.nombre}</p>
                    <p className="text-gray-500">{c.detalle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── 4. KPIs PERSONAL ─── */}
      <Section title="KPIs de Productividad del Personal">
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${blur}`}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Carga de Trabajo Actual</div>
            <div className="p-4 grid grid-cols-2 gap-2.5">
              <KpiBox value="38.3" label="Equipos por Tecnico (7)" color="text-green-600" />
              <KpiBox value="10.7" label="Equipos por Empleado" />
              <KpiBox value="75,354" label="Copias por Tecnico/Mes" />
              <KpiBox value="$3,768" label="Facturacion por Tecnico" color="text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Proyeccion con 150 Equipos Nuevos</div>
            <div className="p-4 grid grid-cols-2 gap-2.5">
              <KpiBox value="59.7" label="Equipos por Tecnico" color="text-amber-700" border="border-amber-300" />
              <KpiBox value="16.7" label="Equipos por Empleado" />
              <KpiBox value="+56%" label="Aumento Carga Tecnicos" color="text-red-700" />
              <KpiBox value="$5,877" label="Facturacion por Tecnico" color="text-green-600" border="border-green-300" />
            </div>
            <div className="mx-4 mb-4 bg-amber-50 rounded-lg px-3 py-2 text-xs">
              <p className="font-semibold text-amber-800">Recomendacion</p>
              <p className="text-amber-600">Considerar contratar 2-3 tecnicos adicionales para mantener ratio optimo de 40-45 eq/tecnico</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Distribucion de Nomina</div>
            <div className="p-4" style={{ height: 200 }}>
              <canvas ref={nominaChartRef} />
            </div>
            <div className="text-center pb-4 pt-2 border-t border-gray-100 mx-4">
              <span className="text-xs text-gray-500">Total Nomina: </span>
              <span className="text-base font-bold text-gray-800">${data.sumaSalarios ? data.sumaSalarios.toLocaleString('es-VE') : '9,253'}/mes</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── 5. PROYECCIONES ─── */}
      <Section title="Proyecciones Financieras">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${blur}`}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Estado Actual vs Proyectado (con 150 eq. nuevos)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Concepto</th>
                    <th className="text-right px-4 py-2 font-semibold">Actual</th>
                    <th className="text-right px-4 py-2 font-semibold">Proyectado</th>
                    <th className="text-right px-4 py-2 font-semibold">&Delta;</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {PROYECCION.map(p => (
                    <tr key={p.concepto} className={p.bold ? 'bg-gray-50 font-semibold' : ''}>
                      <td className="px-4 py-2 text-gray-800">{p.concepto}</td>
                      <td className="px-4 py-2 text-right text-gray-700 font-medium">{p.actual}</td>
                      <td className={`px-4 py-2 text-right ${p.up ? 'text-green-600' : 'text-red-600'}`}>{p.proy}</td>
                      <td className={`px-4 py-2 text-right ${p.up ? 'text-green-600' : 'text-red-600'}`}>{p.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">Proyeccion Anual</div>
            <div className="p-4" style={{ height: 240 }}>
              <canvas ref={proyChartRef} />
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 ${blur}`}>
          <RoiCard label="INGRESOS ANUALES PROYECTADOS" value="$493,572" sub="$41,131 x 12 meses" variant="alt" valueColor="text-green-600" />
          <RoiCard label="COSTOS ANUALES PROYECTADOS" value="$310,044" sub="$25,837 x 12 meses" variant="alt" valueColor="text-amber-700" />
          <RoiCard label="UTILIDAD ANUAL PROYECTADA" value="$183,528" sub="37.2% margen neto" variant="green" />
        </div>
      </Section>

      {/* ─── 6. RESUMEN EJECUTIVO ─── */}
      <Section title="Resumen Ejecutivo y Recomendaciones">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 text-white font-semibold text-sm" style={{ backgroundColor: '#162f52' }}>Fortalezas</div>
            <div className="p-4 space-y-2">
              <AlertItem type="success" title="ROI excepcional en importaciones" desc="198% ROI anual con payback de 4.8 meses" />
              <AlertItem type="success" title="Clientes de alta eficiencia" desc="F. Stanzione genera 31,521 cop/eq - 16x el promedio" />
              <AlertItem type="success" title="Margen saludable" desc="31.1% actual, proyectable a 37.2%" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-amber-500 text-white font-semibold text-sm">Areas de Atencion</div>
            <div className="p-4 space-y-2">
              <AlertItem type="warning" title="Capacidad tecnica al limite" desc="59.7 eq/tecnico proyectado - contratar 2-3 tecnicos" />
              <AlertItem type="warning" title="Clientes de bajo rendimiento" desc="La Ceiba, Pto Seco, Gente Creativa - evaluar renegociacion" />
              <AlertItem type="info" title="Concentracion en Bolipuertos" desc="60.6% de ingresos - diversificar cartera" />
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

/* ─── sub-componentes ─── */

function StatCard({ icon, color, value, label, change }: { icon: string; color: string; value: string; label: string; change?: string }) {
  const icons: Record<string, React.ReactNode> = {
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    printer: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />,
    copy: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />,
    building: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    dollar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  }
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${color}15` }}>
        <svg className="w-4 h-4" fill="none" stroke={color} viewBox="0 0 24 24">{icons[icon]}</svg>
      </div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-500 font-medium">{label}</p>
      {change && <p className="text-[10px] text-green-600 mt-0.5">{change}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#162f52' }} />
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function RoiCard({ label, value, sub, variant, valueColor }: { label: string; value: string; sub: string; variant: 'green' | 'danger' | 'alt'; valueColor?: string }) {
  const bg = variant === 'green' ? 'bg-gradient-to-br from-[#162f52] to-[#0d1d35] text-white'
    : variant === 'danger' ? 'bg-white border border-gray-200'
    : 'bg-white border border-gray-200'
  const vc = variant === 'green' ? 'text-white' : variant === 'danger' ? 'text-red-600' : (valueColor ?? 'text-gray-800')
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${variant === 'green' ? 'text-blue-200' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${vc}`}>{value}</p>
      <p className={`text-[10px] mt-1 ${variant === 'green' ? 'text-blue-200' : 'text-gray-500'}`}>{sub}</p>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`font-semibold ${color ?? 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

function KpiBox({ value, label, color, border }: { value: string; label: string; color?: string; border?: string }) {
  return (
    <div className={`bg-gray-50 rounded-lg p-3 text-center ${border ? `border ${border}` : ''}`}>
      <p className={`text-lg font-bold ${color ?? 'text-gray-900'}`}>{value}</p>
      <p className="text-[9px] text-gray-600 mt-0.5">{label}</p>
    </div>
  )
}

function AtcBadge({ atc }: { atc: string }) {
  const colors: Record<string, string> = { ATC1: 'bg-blue-100 text-blue-700', ATC2: 'bg-purple-100 text-purple-700', ATC3: 'bg-red-100 text-red-700' }
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${colors[atc] ?? 'bg-gray-100 text-gray-600'}`}>{atc}</span>
}

function EfBadge({ ef }: { ef: string }) {
  const colors: Record<string, string> = { Optimo: 'bg-green-100 text-green-700', Alto: 'bg-green-50 text-green-600', Medio: 'bg-amber-50 text-amber-600', Bajo: 'bg-red-50 text-red-600' }
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${colors[ef] ?? 'bg-gray-100 text-gray-600'}`}>{ef}</span>
}

function AlertItem({ type, title, desc }: { type: 'success' | 'warning' | 'danger' | 'info'; title: string; desc: string }) {
  const styles: Record<string, string> = {
    success: 'bg-green-50 border-l-green-500',
    warning: 'bg-amber-50 border-l-amber-500',
    danger: 'bg-red-50 border-l-red-500',
    info: 'bg-blue-50 border-l-blue-500',
  }
  return (
    <div className={`${styles[type]} rounded-lg px-3 py-2 text-xs`} style={{ borderLeftWidth: 3 }}>
      <p className="font-semibold text-gray-800">{title}</p>
      <p className="text-gray-500">{desc}</p>
    </div>
  )
}
