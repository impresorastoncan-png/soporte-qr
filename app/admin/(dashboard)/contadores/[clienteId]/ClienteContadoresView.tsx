'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Badge } from '@/components/admin/ui'
import { actualizarEstadoRelacion, guardarCopiadoMinimo } from '../actions'
import ImportarContadores from './ImportarContadores'
import GenerarReporte from './GenerarReporte'

type ClienteInfo = {
  razon_social: string
  rif: string
  direccion: string
  atc: string
  tarifa_bn_usd: number
  tarifa_color_usd: number
  copiado_minimo: number
  tarifa_fija_usd: number
}

type Equipo = {
  id: string
  serial: string
  modelo: string
  marca: string
  ubicacion: string
}

type Lectura = {
  equipo_id: string
  contador_bn: number
  contador_color: number
  copias_periodo_bn: number
  copias_periodo_color: number
  fecha: string
}

type CobroMes = {
  periodo: string
  copias_bn: number
  copias_color: number
  monto_bn_usd: number
  monto_color_usd: number
  total_usd: number
  tasa_bcv: number
  estado_relacion: string
  aplica_minimo: boolean
  monto_minimo_usd: number
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: '#fef3c7', text: '#92400e', label: 'Pendiente' },
  proforma: { bg: '#dbeafe', text: '#1e40af', label: 'Proforma' },
  listo: { bg: '#d1fae5', text: '#065f46', label: 'Listo' },
}

export default function ClienteContadoresView({
  clienteId,
  cliente,
  equipos,
  anio,
  mesSeleccionado,
  mesesConDatos,
  lecturas,
  cobroMes,
  tasaBcv,
  fechaTasa,
}: {
  clienteId: string
  cliente: ClienteInfo
  equipos: Equipo[]
  anio: number
  mesSeleccionado: string | null
  mesesConDatos: string[]
  lecturas: Lectura[]
  cobroMes: CobroMes | null
  tasaBcv: number
  fechaTasa: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showImport, setShowImport] = useState(false)
  const [copiadoMin, setCopiadoMin] = useState(cliente.copiado_minimo)
  const [tarifaFija, setTarifaFija] = useState(cliente.tarifa_fija_usd)
  const [savingMin, setSavingMin] = useState(false)
  const [minMsg, setMinMsg] = useState('')

  const mesesSet = new Set(mesesConDatos)

  function selectMes(mes: number) {
    const periodo = `${anio}-${String(mes).padStart(2, '0')}`
    router.push(`/admin/contadores/${clienteId}?anio=${anio}&mes=${periodo}`)
  }

  function changeAnio(delta: number) {
    router.push(`/admin/contadores/${clienteId}?anio=${anio + delta}`)
  }

  async function handleEstado(estado: 'pendiente' | 'proforma' | 'listo') {
    if (!mesSeleccionado) return
    startTransition(async () => {
      await actualizarEstadoRelacion(clienteId, mesSeleccionado, estado)
    })
  }

  async function handleGuardarMinimo() {
    setSavingMin(true)
    setMinMsg('')
    const res = await guardarCopiadoMinimo(clienteId, copiadoMin, tarifaFija)
    setMinMsg(res.message)
    setSavingMin(false)
  }

  // Mapear lecturas a equipos
  const lecturaMap = new Map<string, Lectura>()
  lecturas.forEach(l => lecturaMap.set(l.equipo_id, l))

  // Calcular totales del mes
  const totalCopias = lecturas.reduce((s, l) => s + (l.copias_periodo_bn ?? 0) + (l.copias_periodo_color ?? 0), 0)
  const aplicaMinimo = copiadoMin > 0 && totalCopias < copiadoMin && totalCopias > 0

  // Datos para reporte
  const reporteRows = equipos
    .filter(e => lecturaMap.has(e.id))
    .map((e, i) => {
      const l = lecturaMap.get(e.id)!
      const lectActual = l.contador_bn || l.contador_color
      const diferencia = (l.copias_periodo_bn ?? 0) + (l.copias_periodo_color ?? 0)
      const lectAnterior = lectActual - diferencia
      return {
        item: i + 1,
        modelo: e.modelo,
        tipo: l.contador_color > 0 ? 'C' : 'M',
        serial: e.serial,
        ubicacion: e.ubicacion,
        lectAnterior,
        lectActual,
        diferencia,
      }
    })

  return (
    <div className="space-y-6">
      {/* Info del cliente */}
      <Card>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Tarifa B/N</p>
            <p className="font-semibold text-gray-800">${cliente.tarifa_bn_usd.toFixed(4)}/copia</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Tarifa Color</p>
            <p className="font-semibold text-gray-800">${cliente.tarifa_color_usd.toFixed(4)}/copia</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Equipos en campo</p>
            <p className="font-semibold text-gray-800">{equipos.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Tasa BCV</p>
            <p className="font-semibold text-gray-800">{tasaBcv > 0 ? `${tasaBcv.toFixed(4)} Bs/$` : 'Sin tasa'}</p>
            {fechaTasa && <p className="text-[10px] text-gray-400">{fechaTasa}</p>}
          </div>
        </div>
      </Card>

      {/* Copiado minimo */}
      <Card>
        <div className="p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Copiado Mínimo</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mínimo de copias</label>
              <input
                type="number"
                value={copiadoMin}
                onChange={e => setCopiadoMin(parseInt(e.target.value) || 0)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tarifa fija USD</label>
              <input
                type="number"
                step="0.01"
                value={tarifaFija}
                onChange={e => setTarifaFija(parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <button
              onClick={handleGuardarMinimo}
              disabled={savingMin}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#162f52' }}
            >
              {savingMin ? 'Guardando...' : 'Guardar'}
            </button>
            {minMsg && <span className="text-xs text-green-700 font-semibold">{minMsg}</span>}
          </div>
        </div>
      </Card>

      {/* Calendario anual */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeAnio(-1)} className="text-gray-500 hover:text-gray-800 text-lg font-bold px-2">&larr;</button>
            <h3 className="text-lg font-bold text-gray-800">{anio}</h3>
            <button onClick={() => changeAnio(1)} className="text-gray-500 hover:text-gray-800 text-lg font-bold px-2">&rarr;</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {MESES.map((nombre, i) => {
              const mes = i + 1
              const periodo = `${anio}-${String(mes).padStart(2, '0')}`
              const tieneDatos = mesesSet.has(periodo)
              const isSelected = mesSeleccionado === periodo
              return (
                <button
                  key={mes}
                  onClick={() => selectMes(mes)}
                  className={`py-4 rounded-xl text-center transition-all border-2 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : tieneDatos
                        ? 'border-green-300 bg-green-50 hover:border-green-500'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <p className={`text-sm font-bold ${isSelected ? 'text-blue-700' : tieneDatos ? 'text-green-700' : 'text-gray-600'}`}>
                    {nombre}
                  </p>
                  {tieneDatos && (
                    <p className="text-[10px] mt-1 text-green-600 font-semibold">Cargado</p>
                  )}
                  {!tieneDatos && (
                    <p className="text-[10px] mt-1 text-gray-400">Sin datos</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Detalle del mes seleccionado */}
      {mesSeleccionado && (
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Contadores — {MESES[parseInt(mesSeleccionado.split('-')[1]) - 1]} {mesSeleccionado.split('-')[0]}
                </h3>
                {cobroMes && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge {...(estadoBadge[cobroMes.estado_relacion] ?? estadoBadge.pendiente)} />
                    <div className="flex gap-1 ml-2">
                      {(['pendiente', 'proforma', 'listo'] as const).map(est => (
                        <button
                          key={est}
                          onClick={() => handleEstado(est)}
                          disabled={isPending || cobroMes.estado_relacion === est}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                            cobroMes.estado_relacion === est
                              ? 'bg-gray-200 text-gray-500 cursor-default'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {est}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {lecturas.length === 0 ? (
                  <button
                    onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ backgroundColor: '#162f52' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Importar Contadores
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowImport(true)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    >
                      Re-importar
                    </button>
                    <GenerarReporte
                      cliente={cliente}
                      rows={reporteRows}
                      periodo={mesSeleccionado}
                      tasaBcv={cobroMes?.tasa_bcv ?? tasaBcv}
                      fechaTasa={fechaTasa}
                      costoPorCopia={cliente.tarifa_bn_usd}
                      totalCopias={totalCopias}
                      copiadoMinimo={copiadoMin}
                      tarifaFija={tarifaFija}
                      aplicaMinimo={aplicaMinimo}
                    />
                  </>
                )}
              </div>
            </div>

            {lecturas.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="text-center px-3 py-2 font-semibold">N°</th>
                        <th className="text-left px-3 py-2 font-semibold">Modelo</th>
                        <th className="text-center px-3 py-2 font-semibold">Tipo</th>
                        <th className="text-left px-3 py-2 font-semibold">Serial</th>
                        <th className="text-left px-3 py-2 font-semibold">Ubicación</th>
                        <th className="text-right px-3 py-2 font-semibold">Lect. Ant.</th>
                        <th className="text-right px-3 py-2 font-semibold">Lect. Actual</th>
                        <th className="text-right px-3 py-2 font-semibold">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reporteRows.map((r) => (
                        <tr key={r.serial} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-center text-gray-500">{r.item}</td>
                          <td className="px-3 py-2 text-gray-800 font-medium">{r.modelo}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.tipo === 'C' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {r.tipo === 'C' ? 'COLOR' : 'B/N'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.serial}</td>
                          <td className="px-3 py-2 text-gray-600 text-xs">{r.ubicacion}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{r.lectAnterior.toLocaleString('es-VE')}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{r.lectActual.toLocaleString('es-VE')}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs font-bold text-gray-800">{r.diferencia.toLocaleString('es-VE')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Resumen */}
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Total Copias</p>
                      <p className="text-lg font-bold text-gray-800">{totalCopias.toLocaleString('es-VE')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Costo/Copia</p>
                      <p className="text-lg font-bold text-gray-800">${cliente.tarifa_bn_usd.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">
                        {aplicaMinimo ? 'Tarifa Fija (Mínimo)' : 'Subtotal USD'}
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        ${aplicaMinimo
                          ? tarifaFija.toFixed(2)
                          : (totalCopias * cliente.tarifa_bn_usd).toFixed(2)
                        }
                      </p>
                      {aplicaMinimo && (
                        <p className="text-[10px] text-amber-600 font-semibold">
                          No alcanza mínimo de {copiadoMin.toLocaleString('es-VE')} copias
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Total Bs (Tasa: {(cobroMes?.tasa_bcv ?? tasaBcv).toFixed(2)})</p>
                      <p className="text-lg font-bold text-gray-800">
                        {(() => {
                          const baseUsd = aplicaMinimo ? tarifaFija : totalCopias * cliente.tarifa_bn_usd
                          const tasa = cobroMes?.tasa_bcv ?? tasaBcv
                          const iva = baseUsd * 0.16
                          const totalBs = (baseUsd + iva) * tasa
                          return `Bs ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : !showImport ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 0l-2-2m2 2l-2 2M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1zm5-4h6m-3-3v6" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">Sin contadores para este mes</p>
                <p className="text-xs text-gray-500 mt-1">Importe un Excel con las lecturas de los equipos.</p>
              </div>
            ) : null}
          </div>
        </Card>
      )}

      {/* Modal importar */}
      {showImport && mesSeleccionado && (
        <ImportarContadores
          clienteId={clienteId}
          periodo={mesSeleccionado}
          tasaBcv={tasaBcv}
          costoPorCopia={cliente.tarifa_bn_usd}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
