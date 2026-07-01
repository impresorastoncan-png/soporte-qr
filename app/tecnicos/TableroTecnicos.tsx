'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { urgenciaConfig, formatearFecha } from '@/lib/utils'
import type { Urgencia } from '@/lib/supabase/types'

interface Tecnico {
  id: string
  nombre: string
}

interface SolicitudCard {
  id: string
  ticket_id: string
  cliente_nombre: string
  modelo: string
  serial: string
  ubicacion: string
  urgencia: Urgencia
  descripcion: string
  necesita_toner: boolean
  tipo_problema: string | null
  created_at: string
  estado: 'pendiente' | 'en_proceso'
}

const URGENCIA_ORDER: Record<Urgencia, number> = { critica: 0, alta: 1, media: 2, baja: 3 }

function sortSolicitudes(list: SolicitudCard[]): SolicitudCard[] {
  return [...list].sort((a, b) => {
    const urgDiff = URGENCIA_ORDER[a.urgencia] - URGENCIA_ORDER[b.urgencia]
    if (urgDiff !== 0) return urgDiff
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

export default function TableroTecnicos({
  tecnicos,
  solicitudesIniciales,
}: {
  tecnicos: Tecnico[]
  solicitudesIniciales: SolicitudCard[]
}) {
  const router = useRouter()
  const [identidad, setIdentidad] = useState<Tecnico | null>(null)
  const [mostrandoSelector, setMostrandoSelector] = useState(false)
  const [solicitudes, setSolicitudes] = useState<SolicitudCard[]>(sortSolicitudes(solicitudesIniciales))
  const [reclamando, setReclamando] = useState<string | null>(null)
  const [errorReclamo, setErrorReclamo] = useState('')

  // Leer identidad de localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem('toncan_tecnico')
      if (stored) {
        const parsed = JSON.parse(stored) as Tecnico
        if (tecnicos.find(t => t.id === parsed.id)) {
          setIdentidad(parsed)
        } else {
          setMostrandoSelector(true)
        }
      } else {
        setMostrandoSelector(true)
      }
    } catch {
      setMostrandoSelector(true)
    }
  }, [tecnicos])

  // Supabase Realtime: suscribirse a cambios en solicitudes
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('tecnicos-tablero')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitudes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nueva = payload.new as SolicitudCard
            if (nueva.estado === 'pendiente' || nueva.estado === 'en_proceso') {
              setSolicitudes(prev => sortSolicitudes([...prev, nueva]))
            }
          } else if (payload.eventType === 'UPDATE') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const actualizada = payload.new as any
            setSolicitudes(prev => {
              const filtrada = prev.filter(s => s.id !== actualizada.id)
              if (actualizada.estado === 'resuelto') return sortSolicitudes(filtrada)
              return sortSolicitudes([...filtrada, actualizada as SolicitudCard])
            })
          } else if (payload.eventType === 'DELETE') {
            setSolicitudes(prev => prev.filter(s => s.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const seleccionarTecnico = useCallback((tecnico: Tecnico) => {
    localStorage.setItem('toncan_tecnico', JSON.stringify(tecnico))
    setIdentidad(tecnico)
    setMostrandoSelector(false)
  }, [])

  async function reclamarSolicitud(solicitudId: string) {
    if (!identidad) { setMostrandoSelector(true); return }
    setReclamando(solicitudId)
    setErrorReclamo('')

    try {
      const fd = new FormData()
      fd.append('action', 'reclamar')
      fd.append('solicitudId', solicitudId)
      fd.append('tecnicoId', identidad.id)
      fd.append('tecnicoNombre', identidad.nombre)

      const res = await fetch('/api/tecnicos/visita', { method: 'POST', body: fd })
      const data = await res.json()

      if (res.status === 409) {
        setErrorReclamo('Esta solicitud ya fue tomada por otro técnico.')
        setReclamando(null)
        return
      }

      if (!res.ok || !data.visitaId) {
        setErrorReclamo(data.error ?? 'Error al tomar la solicitud')
        setReclamando(null)
        return
      }

      router.push(`/tecnicos/solicitudes/${solicitudId}?visitaId=${data.visitaId}`)
    } catch {
      setErrorReclamo('Error de conexión. Intente nuevamente.')
      setReclamando(null)
    }
  }

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')
  const enProceso = solicitudes.filter(s => s.estado === 'en_proceso')

  return (
    <>
      {/* Gate de identidad — overlay fullscreen */}
      {mostrandoSelector && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#162f52' }}>
          <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-sm mx-auto w-full">
            <h1 className="text-2xl font-bold text-white mb-2">¿Quién eres?</h1>
            <p className="text-blue-200 text-sm mb-8">
              Selecciona tu nombre para ver el tablero de solicitudes.
            </p>
            <div className="space-y-3">
              {tecnicos.map(tecnico => (
                <button
                  key={tecnico.id}
                  onClick={() => seleccionarTecnico(tecnico)}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl px-5 py-4 text-left transition-all active:scale-[0.98] flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {tecnico.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-base font-semibold">{tecnico.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tablero principal */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-12">
        {/* Barra de identidad */}
        {identidad && (
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Técnico</p>
              <p className="text-base font-bold text-gray-800">{identidad.nombre}</p>
            </div>
            <button
              onClick={() => setMostrandoSelector(true)}
              className="text-xs text-gray-400 underline"
            >
              Cambiar
            </button>
          </div>
        )}

        {/* Contadores rápidos */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-400 font-medium">Pendientes</p>
            <p className="text-2xl font-bold text-gray-800">{pendientes.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-orange-200 px-4 py-3">
            <p className="text-xs text-orange-400 font-medium">En atención</p>
            <p className="text-2xl font-bold text-orange-600">{enProceso.length}</p>
          </div>
        </div>

        {errorReclamo && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-700 text-sm">{errorReclamo}</p>
          </div>
        )}

        {/* Lista de solicitudes */}
        {solicitudes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Sin solicitudes activas</p>
            <p className="text-gray-400 text-sm mt-1">Actualiza si acabas de llegar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudes.map(s => {
              const urg = urgenciaConfig[s.urgencia]
              const enPr = s.estado === 'en_proceso'
              const cargando = reclamando === s.id

              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${enPr ? 'border-orange-200 opacity-70' : 'border-gray-200'}`}
                >
                  {/* Banda de urgencia */}
                  <div style={{ backgroundColor: urg.color }} className="px-4 py-2 flex items-center justify-between">
                    <span className="text-white font-bold text-sm">
                      {urg.emoji} {urg.label.toUpperCase()}
                      {enPr && ' · EN ATENCIÓN'}
                    </span>
                    <span className="text-white/80 text-xs font-mono">{s.ticket_id}</span>
                  </div>

                  <div className="p-4">
                    <p className="font-semibold text-gray-800 text-base">{s.cliente_nombre}</p>
                    <p className="text-sm text-gray-500">{s.modelo} · {s.serial}</p>
                    {s.ubicacion && <p className="text-xs text-gray-400 mt-0.5">{s.ubicacion}</p>}
                    {s.tipo_problema && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">{s.tipo_problema}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{s.descripcion}</p>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">{formatearFecha(s.created_at)}</span>
                      {s.necesita_toner && (
                        <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                          ⚠️ Tóner
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón de acción */}
                  {!enPr ? (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => reclamarSolicitud(s.id)}
                        disabled={cargando || !!reclamando}
                        style={{ backgroundColor: cargando ? '#6b7280' : '#162f52' }}
                        className="w-full text-white text-sm font-semibold py-2.5 rounded-xl disabled:cursor-not-allowed transition-colors"
                      >
                        {cargando ? 'Tomando solicitud...' : 'Tomar esta solicitud →'}
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 pb-4">
                      <div className="w-full text-center text-xs text-orange-500 font-medium py-2 border border-orange-200 rounded-xl">
                        En atención por otro técnico
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
