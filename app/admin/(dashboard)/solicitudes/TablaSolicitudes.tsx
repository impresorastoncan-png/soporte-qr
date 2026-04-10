'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cambiarEstado, eliminarSolicitud } from './actions'
import { urgenciaConfig, formatearFecha } from '@/lib/utils'
import type { SolicitudRow, EstadoSolicitud } from '@/lib/supabase/types'

const estadoConfig: Record<EstadoSolicitud, { label: string; bg: string; text: string }> = {
  pendiente: { label: 'Pendiente', bg: '#fef3c7', text: '#92400e' },
  en_proceso: { label: 'En proceso', bg: '#dbeafe', text: '#1e40af' },
  resuelto: { label: 'Resuelto', bg: '#d1fae5', text: '#065f46' },
}

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}

export default function TablaSolicitudes({ solicitudes }: { solicitudes: SolicitudRow[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<SolicitudRow | null>(null)
  const [pending, start] = useTransition()

  function handleCambiarEstado(estado: EstadoSolicitud) {
    if (!selected) return
    start(async () => {
      try {
        await cambiarEstado(selected.id, estado)
        setSelected({ ...selected, estado })
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function handleEliminar() {
    if (!selected) return
    if (!confirm(`¿Eliminar la solicitud ${selected.ticket_id}? Esta acción no se puede deshacer.`)) return
    start(async () => {
      try {
        await eliminarSolicitud(selected.id)
        setSelected(null)
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  if (solicitudes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-sm font-semibold text-gray-700">Sin solicitudes</p>
        <p className="text-xs text-gray-500 mt-1">No hay solicitudes que coincidan con los filtros.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Ticket</th>
                <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold">Máquina</th>
                <th className="text-left px-4 py-3 font-semibold">Urgencia</th>
                <th className="text-left px-4 py-3 font-semibold">Estado</th>
                <th className="text-left px-4 py-3 font-semibold">Tóner</th>
                <th className="text-left px-4 py-3 font-semibold">Hace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {solicitudes.map(s => {
                const u = urgenciaConfig[s.urgencia]
                const e = estadoConfig[s.estado]
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{s.ticket_id}</td>
                    <td className="px-4 py-3 text-gray-800">{s.cliente_nombre}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-gray-700">{s.serial}</p>
                      <p className="text-xs text-gray-500">{s.modelo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                        style={{ backgroundColor: u.color + '22', color: u.color }}
                      >
                        {u.emoji} {u.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ backgroundColor: e.bg, color: e.text }}
                      >
                        {e.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {s.necesita_toner ? <span className="text-orange-700 font-semibold">Sí</span> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{tiempoRelativo(s.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Ticket</p>
                <p className="font-mono text-sm font-bold text-gray-800">{selected.ticket_id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block px-3 py-1 rounded text-sm font-bold"
                  style={{
                    backgroundColor: urgenciaConfig[selected.urgencia].color + '22',
                    color: urgenciaConfig[selected.urgencia].color,
                  }}
                >
                  {urgenciaConfig[selected.urgencia].emoji} {urgenciaConfig[selected.urgencia].label}
                </span>
                <span
                  className="inline-block px-3 py-1 rounded text-sm font-semibold"
                  style={{
                    backgroundColor: estadoConfig[selected.estado].bg,
                    color: estadoConfig[selected.estado].text,
                  }}
                >
                  {estadoConfig[selected.estado].label}
                </span>
                {selected.necesita_toner && (
                  <span className="inline-block px-3 py-1 rounded text-sm font-semibold bg-orange-100 text-orange-800">
                    Tóner
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-0.5">Cliente</p>
                  <p className="text-gray-800 font-semibold">{selected.cliente_nombre}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-0.5">Fecha</p>
                  <p className="text-gray-800">{formatearFecha(selected.created_at)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-0.5">Serial</p>
                  <p className="font-mono text-xs font-bold text-gray-800">{selected.serial}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-0.5">Modelo</p>
                  <p className="text-gray-800">{selected.modelo}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-0.5">Ubicación</p>
                  <p className="text-gray-800">{selected.ubicacion || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-0.5">Solicitante</p>
                  <p className="text-gray-800">{selected.nombre_solicitante}</p>
                  {selected.correo_solicitante && (
                    <p className="text-xs text-gray-500">{selected.correo_solicitante}</p>
                  )}
                </div>
                {selected.tipo_problema && (
                  <div className="col-span-2">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold mb-0.5">Tipo de problema</p>
                    <p className="text-gray-800">{selected.tipo_problema}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold mb-1">Descripción</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap">
                  {selected.descripcion}
                </div>
              </div>

              {selected.fotos_urls && selected.fotos_urls.length > 0 && (
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-2">
                    Fotos ({selected.fotos_urls.length})
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.fotos_urls.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-5">
                <p className="text-[11px] text-gray-400 uppercase font-semibold mb-2">Cambiar estado</p>
                <div className="flex gap-2">
                  {(['pendiente', 'en_proceso', 'resuelto'] as EstadoSolicitud[]).map(est => {
                    const cfg = estadoConfig[est]
                    const activo = selected.estado === est
                    return (
                      <button
                        key={est}
                        type="button"
                        disabled={pending || activo}
                        onClick={() => handleCambiarEstado(est)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-60"
                        style={{
                          backgroundColor: activo ? cfg.bg : 'white',
                          color: activo ? cfg.text : '#374151',
                          borderColor: activo ? cfg.text : '#d1d5db',
                        }}
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={handleEliminar}
                  disabled={pending}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Eliminar solicitud
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
