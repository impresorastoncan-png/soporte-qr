'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
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

const POLL_INTERVAL = 20_000

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
  const [pendingNav, setPendingNav] = useState<string | null>(null)
  const [solicitudes, setSolicitudes] = useState<SolicitudCard[]>(sortSolicitudes(solicitudesIniciales))
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Leer identidad guardada — no bloquea la vista
  useEffect(() => {
    try {
      const stored = localStorage.getItem('toncan_tecnico')
      if (stored) {
        const parsed = JSON.parse(stored) as Tecnico
        if (tecnicos.find(t => t.id === parsed.id)) {
          setIdentidad(parsed)
        }
      }
    } catch { /* ignore */ }
  }, [tecnicos])

  // Polling — fuente principal de actualización en vivo
  const fetchSolicitudes = useCallback(async () => {
    try {
      const res = await fetch('/api/tecnicos/solicitudes')
      if (!res.ok) return
      const data = await res.json()
      if (data.solicitudes) {
        setSolicitudes(sortSolicitudes(data.solicitudes))
        setUltimaActualizacion(new Date())
      }
    } catch { /* ignore network errors */ }
  }, [])

  useEffect(() => {
    // Primer fetch inmediato para mostrar datos frescos al montar
    fetchSolicitudes()
    pollRef.current = setInterval(fetchSolicitudes, POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchSolicitudes])

  const seleccionarTecnico = useCallback((tecnico: Tecnico) => {
    localStorage.setItem('toncan_tecnico', JSON.stringify(tecnico))
    setIdentidad(tecnico)
    setMostrandoSelector(false)
    if (pendingNav) {
      router.push(pendingNav)
      setPendingNav(null)
    }
  }, [router, pendingNav])

  function irASolicitud(id: string) {
    if (!identidad) {
      setPendingNav(`/tecnicos/solicitudes/${id}`)
      setMostrandoSelector(true)
      return
    }
    router.push(`/tecnicos/solicitudes/${id}`)
  }

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')
  const enProceso = solicitudes.filter(s => s.estado === 'en_proceso')

  return (
    <>
      {/* Modal selector de técnico — aparece solo al intentar atender */}
      {mostrandoSelector && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-1">¿Quién eres?</h2>
            <p className="text-sm text-gray-500 mb-5">Selecciona tu nombre para continuar.</p>
            <div className="space-y-2">
              {tecnicos.map(tecnico => (
                <button
                  key={tecnico.id}
                  onClick={() => seleccionarTecnico(tecnico)}
                  className="w-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98] flex items-center gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                    style={{ backgroundColor: '#162f52' }}
                  >
                    {tecnico.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-800">{tecnico.nombre}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setMostrandoSelector(false); setPendingNav(null) }}
              className="mt-4 w-full text-sm text-gray-400 py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tablero principal — siempre visible */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-12">

        {/* Barra superior */}
        <div className="flex items-center justify-between mb-5">
          <div>
            {identidad ? (
              <>
                <p className="text-xs text-gray-400 uppercase font-semibold">Técnico</p>
                <p className="text-base font-bold text-gray-800">{identidad.nombre}</p>
              </>
            ) : (
              <button
                onClick={() => setMostrandoSelector(true)}
                className="text-sm font-semibold underline"
                style={{ color: '#162f52' }}
              >
                Selecciona tu nombre →
              </button>
            )}
          </div>
          <div className="text-right">
            {identidad && (
              <button onClick={() => setMostrandoSelector(true)} className="text-xs text-gray-400 underline block mb-1">
                Cambiar
              </button>
            )}
            <button
              onClick={fetchSolicitudes}
              className="text-xs text-gray-400 underline"
            >
              Actualizar
            </button>
            {ultimaActualizacion && (
              <p className="text-[10px] text-gray-300 mt-0.5">
                {ultimaActualizacion.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

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

        {/* Lista de solicitudes */}
        {solicitudes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Sin solicitudes activas</p>
            <p className="text-gray-400 text-sm mt-1">Se actualiza automáticamente cada 20 segundos.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudes.map(s => {
              const urg = urgenciaConfig[s.urgencia]
              const enPr = s.estado === 'en_proceso'

              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${enPr ? 'border-orange-200' : 'border-gray-200'}`}
                >
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

                  <div className="px-4 pb-4">
                    <button
                      onClick={() => irASolicitud(s.id)}
                      style={{ backgroundColor: enPr ? '#9a3412' : '#162f52' }}
                      className="w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:opacity-80"
                    >
                      {enPr ? 'Ver / Atender →' : 'Atender solicitud →'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
