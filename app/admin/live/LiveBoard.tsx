'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { urgenciaConfig } from '@/lib/utils'
import type { SolicitudRow, Urgencia } from '@/lib/supabase/types'

const urgenciaPeso: Record<Urgencia, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baja: 3,
}

function ordenar(list: SolicitudRow[]): SolicitudRow[] {
  return [...list].sort((a, b) => {
    const p = urgenciaPeso[a.urgencia] - urgenciaPeso[b.urgencia]
    if (p !== 0) return p
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

function tiempoRelativo(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}

function pitidoCritico() {
  try {
    const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    osc.start()
    osc.stop(ctx.currentTime + 0.7)
  } catch {}
}

export default function LiveBoard({ iniciales }: { iniciales: SolicitudRow[] }) {
  const [solicitudes, setSolicitudes] = useState<SolicitudRow[]>(ordenar(iniciales))
  const [now, setNow] = useState(Date.now())
  const [sonido, setSonido] = useState(false)
  const [conectado, setConectado] = useState(false)
  const sonidoRef = useRef(false)

  useEffect(() => {
    sonidoRef.current = sonido
  }, [sonido])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('solicitudes-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'solicitudes' },
        (payload) => {
          const nueva = payload.new as SolicitudRow
          if (nueva.estado === 'resuelto') return
          setSolicitudes(prev => ordenar([nueva, ...prev.filter(s => s.id !== nueva.id)]))
          if (nueva.urgencia === 'critica' && sonidoRef.current) pitidoCritico()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'solicitudes' },
        (payload) => {
          const actualizada = payload.new as SolicitudRow
          setSolicitudes(prev => {
            if (actualizada.estado === 'resuelto') {
              return prev.filter(s => s.id !== actualizada.id)
            }
            const existe = prev.some(s => s.id === actualizada.id)
            const nueva = existe
              ? prev.map(s => (s.id === actualizada.id ? actualizada : s))
              : [actualizada, ...prev]
            return ordenar(nueva)
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'solicitudes' },
        (payload) => {
          const vieja = payload.old as { id: string }
          setSolicitudes(prev => prev.filter(s => s.id !== vieja.id))
        }
      )
      .subscribe((status) => {
        setConectado(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length
  const enProceso = solicitudes.filter(s => s.estado === 'en_proceso').length
  const criticas = solicitudes.filter(s => s.urgencia === 'critica').length
  const fecha = new Date(now).toLocaleString('es-VE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="px-8 py-5 border-b border-slate-700 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-5">
          <div className="bg-white/5 rounded-xl p-2">
            <Image
              src="/logo-toncan.png"
              alt="Toncan Digital"
              width={160}
              height={50}
              className="h-10 w-auto"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Soporte en vivo</h1>
            <p className="text-sm text-slate-400 capitalize">{fecha}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">Pendientes</p>
            <p className="text-4xl font-black text-amber-400">{pendientes}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">En proceso</p>
            <p className="text-4xl font-black text-blue-400">{enProceso}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">Críticas</p>
            <p className={`text-4xl font-black ${criticas > 0 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
              {criticas}
            </p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${conectado ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-400">{conectado ? 'En vivo' : 'Desconectado'}</span>
            </div>
            <button
              type="button"
              onClick={() => setSonido(s => !s)}
              className={`text-xs px-3 py-1 rounded-full border ${
                sonido
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {sonido ? 'Sonido ON' : 'Sonido OFF'}
            </button>
            <Link href="/admin/solicitudes" className="text-xs text-slate-500 hover:text-slate-300">
              ← Salir
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        {solicitudes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-5">
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-slate-200">Todo al día</p>
            <p className="text-sm text-slate-500 mt-2">No hay solicitudes pendientes ni en proceso</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {solicitudes.map(s => {
              const cfg = urgenciaConfig[s.urgencia]
              const critica = s.urgencia === 'critica'
              const enProc = s.estado === 'en_proceso'
              return (
                <div
                  key={s.id}
                  className={`rounded-xl overflow-hidden border-2 shadow-lg ${
                    critica ? 'animate-pulse-slow' : ''
                  } ${enProc ? 'opacity-70' : ''}`}
                  style={{
                    borderColor: cfg.color,
                    backgroundColor: '#1e293b',
                  }}
                >
                  <div
                    className="px-4 py-2 flex items-center justify-between"
                    style={{ backgroundColor: cfg.color }}
                  >
                    <span className="font-black text-white text-sm uppercase tracking-wider">
                      {cfg.emoji} {cfg.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-white/90">{s.ticket_id}</span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Cliente</p>
                      <p className="text-lg font-bold text-white truncate" title={s.cliente_nombre}>
                        {s.cliente_nombre}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Ubicación</p>
                      <p className="text-sm text-slate-200 truncate" title={s.ubicacion}>
                        {s.ubicacion || '—'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Máquina</p>
                        <p className="font-mono text-xs font-bold text-slate-100">{s.serial}</p>
                        <p className="text-xs text-slate-400">{s.modelo}</p>
                      </div>
                      {s.necesita_toner && (
                        <span className="px-2 py-1 rounded bg-orange-500/20 border border-orange-500 text-orange-300 text-[10px] font-bold uppercase">
                          Tóner
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-700">
                      <p className="text-xs text-slate-300 line-clamp-2" title={s.descripcion}>
                        {s.descripcion}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        {s.nombre_solicitante}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {tiempoRelativo(s.created_at, now)}
                      </span>
                    </div>

                    {enProc && (
                      <div className="pt-2 border-t border-slate-700">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase">
                          En proceso
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(204, 0, 0, 0.6); }
          50% { box-shadow: 0 0 0 8px rgba(204, 0, 0, 0); }
        }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
