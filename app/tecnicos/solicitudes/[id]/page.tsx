'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { urgenciaConfig, formatearFecha } from '@/lib/utils'
import type { Urgencia } from '@/lib/supabase/types'
import FirmaCanvas, { type FirmaCanvasHandle } from '@/components/tecnicos/FirmaCanvas'

// Pasos: llegada → falla → solucion → firma → confirmacion
type Step = 'llegada' | 'falla' | 'solucion' | 'firma' | 'confirmacion'
const STEPS: Step[] = ['llegada', 'falla', 'solucion', 'firma']
const STEP_LABELS = ['Llegada', 'Falla', 'Solución', 'Firma']

interface SolicitudDetalle {
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
  estado: string
  contador: number
}

export default function VisitaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [tecnicoId, setTecnicoId] = useState('')
  const [tecnicoNombre, setTecnicoNombre] = useState('')

  const [step, setStep] = useState<Step>('llegada')
  const [visitaId, setVisitaId] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  // Step 1 — Llegada
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const fotoRef = useRef<HTMLInputElement>(null)

  // Step 2 — Falla
  const [descripcionFalla, setDescripcionFalla] = useState('')

  // Step 3 — Solución
  const [descripcionSolucion, setDescripcionSolucion] = useState('')

  // Step 4 — Firma
  const firmaRef = useRef<FirmaCanvasHandle>(null)
  const [nombreFirmante, setNombreFirmante] = useState('')
  const [firmaData, setFirmaData] = useState('')
  const [firmaCaptured, setFirmaCaptured] = useState(false)

  useEffect(() => {
    let tId = ''
    let tNombre = ''

    try {
      const stored = localStorage.getItem('toncan_tecnico')
      if (!stored) { router.replace('/tecnicos'); return }
      const parsed = JSON.parse(stored)
      tId = parsed.id
      tNombre = parsed.nombre
      setTecnicoId(tId)
      setTecnicoNombre(tNombre)
    } catch {
      router.replace('/tecnicos')
      return
    }

    fetch(`/api/tecnicos/solicitud/${id}`)
      .then(r => r.json())
      .then(async data => {
        if (!data.solicitud) { router.replace('/tecnicos'); return }
        setSolicitud(data.solicitud)

        // Buscar visita activa existente para este técnico
        const vRes = await fetch(`/api/tecnicos/visita?solicitudId=${id}&tecnicoId=${tId}`)
        const vData = await vRes.json()

        if (vData.visita) {
          setVisitaId(vData.visita.id)
          if (vData.visita.hora_llegada) setStep('falla')
        } else {
          // Auto-crear la visita: el técnico está atendiendo esta solicitud
          const fd = new FormData()
          fd.append('action', 'reclamar')
          fd.append('solicitudId', id)
          fd.append('tecnicoId', tId)
          fd.append('tecnicoNombre', tNombre)
          const rRes = await fetch('/api/tecnicos/visita', { method: 'POST', body: fd })
          const rData = await rRes.json()
          if (rData.visitaId) setVisitaId(rData.visitaId)
        }

        setLoading(false)
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleLlegada() {
    if (!foto) { setError('Toma una foto de llegada en el lugar del cliente'); return }
    if (!visitaId) { setError('Error: no hay visita activa. Vuelve al tablero.'); return }
    setError('')
    setEnviando(true)

    try {
      const fd = new FormData()
      fd.append('action', 'iniciar')
      fd.append('visitaId', visitaId)
      fd.append('foto', foto)

      const res = await fetch('/api/tecnicos/visita', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) { setError(data.error ?? 'Error al registrar llegada'); return }
      setStep('falla')
    } catch {
      setError('Error de conexión. Intente nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function handleCompletar() {
    if (!visitaId) { setError('Error: no hay visita activa'); return }

    const firmaFinal = firmaCaptured
      ? firmaData
      : (firmaRef.current && !firmaRef.current.isEmpty() ? firmaRef.current.toDataURL() : '')

    if (!firmaFinal) { setError('Capture la firma del encargado'); return }
    if (!nombreFirmante.trim()) { setError('Ingrese el nombre del firmante'); return }

    setError('')
    setEnviando(true)

    try {
      const fd = new FormData()
      fd.append('action', 'completar')
      fd.append('visitaId', visitaId)
      fd.append('solicitudId', id)
      fd.append('descripcionFalla', descripcionFalla.trim())
      fd.append('descripcionSolucion', descripcionSolucion.trim())
      fd.append('firmaClienteData', firmaFinal)
      fd.append('nombreFirmante', nombreFirmante.trim())

      const res = await fetch('/api/tecnicos/visita', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) { setError(data.error ?? 'Error al completar visita'); return }
      setStep('confirmacion')
    } catch {
      setError('Error de conexión. Intente nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFoto(f)
      setFotoPreview(URL.createObjectURL(f))
      setError('')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    )
  }

  if (!solicitud) return null

  const urg = urgenciaConfig[solicitud.urgencia]
  const stepIdx = STEPS.indexOf(step as typeof STEPS[number])

  return (
    <div className="max-w-lg mx-auto p-4 pt-4 pb-10">
      {/* Cabecera de la solicitud */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-5">
        <div style={{ backgroundColor: urg.color }} className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-white font-bold text-sm">{urg.emoji} {urg.label.toUpperCase()}</span>
          <span className="text-white/80 text-xs font-mono">{solicitud.ticket_id}</span>
        </div>
        <div className="p-4 space-y-0.5">
          <p className="font-semibold text-gray-800">{solicitud.cliente_nombre}</p>
          <p className="text-sm text-gray-500">{solicitud.modelo} · {solicitud.serial}</p>
          {solicitud.ubicacion && <p className="text-xs text-gray-400">{solicitud.ubicacion}</p>}
          <p className="text-xs text-gray-400 pt-1">{formatearFecha(solicitud.created_at)}</p>
          <div className="pt-2 mt-1 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Falla reportada por el cliente</p>
            <p className="text-sm text-gray-700">{solicitud.descripcion}</p>
          </div>
        </div>
      </div>

      {/* Indicador de pasos */}
      {step !== 'confirmacion' && (
        <div className="flex items-center mb-6">
          {STEPS.map((s, i) => {
            const done = stepIdx > i
            const active = step === s
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: done ? '#295536' : active ? '#162f52' : '#e5e7eb',
                      color: done || active ? '#fff' : '#9ca3af',
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium mt-1 ${active ? 'text-gray-800' : 'text-gray-400'}`}>
                    {STEP_LABELS[i]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-4 rounded mb-4 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── STEP 1: Llegada ── */}
      {step === 'llegada' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Registrar llegada</h2>
            <p className="text-sm text-gray-500">Toma una foto en el lugar del cliente para verificar tu llegada.</p>
          </div>

          <input
            ref={fotoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFotoChange}
          />

          {fotoPreview ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoPreview} alt="Foto de llegada" className="w-full max-h-60 object-cover rounded-xl border border-gray-200" />
              <button type="button" onClick={() => fotoRef.current?.click()} className="text-sm text-blue-600 underline">
                Cambiar foto
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fotoRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors active:scale-[0.98]"
            >
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500 font-medium">Tomar foto de llegada</p>
              <p className="text-xs text-gray-400 mt-1">Verifica tu hora y lugar de llegada</p>
            </button>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleLlegada}
            disabled={enviando || !foto}
            style={{ backgroundColor: enviando || !foto ? '#6b7280' : '#162f52' }}
            className="w-full text-white font-semibold py-3.5 rounded-xl text-base disabled:cursor-not-allowed"
          >
            {enviando ? 'Registrando llegada...' : 'Confirmar llegada →'}
          </button>
        </div>
      )}

      {/* ── STEP 2: Descripción de la falla ── */}
      {step === 'falla' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Descripción de la falla</h2>
            <p className="text-sm text-gray-500">Describe lo que encontraste en el equipo al llegar.</p>
          </div>

          <textarea
            value={descripcionFalla}
            onChange={e => setDescripcionFalla(e.target.value)}
            rows={5}
            autoFocus
            placeholder="Ej: Al llegar el equipo mostraba el error E007-0000 en pantalla. El rodillo del fusor presentaba desgaste visible y temperatura fuera de rango. Cola de impresión con 12 trabajos bloqueados..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={() => {
              if (!descripcionFalla.trim() || descripcionFalla.trim().length < 10) {
                setError('Describe la falla encontrada (mínimo 10 caracteres)')
                return
              }
              setError('')
              setStep('solucion')
            }}
            style={{ backgroundColor: '#162f52' }}
            className="w-full text-white font-semibold py-3.5 rounded-xl text-base"
          >
            Siguiente → Descripción de la solución
          </button>
        </div>
      )}

      {/* ── STEP 3: Descripción de la solución ── */}
      {step === 'solucion' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Descripción de la solución</h2>
            <p className="text-sm text-gray-500">Explica detalladamente cómo resolviste la falla.</p>
          </div>

          <textarea
            value={descripcionSolucion}
            onChange={e => setDescripcionSolucion(e.target.value)}
            rows={5}
            autoFocus
            placeholder="Ej: Se reemplazó el fusor completo (modelo FM4-8400-000). Se liberó la cola de impresión y se realizó una prueba de 20 copias con resultado satisfactorio. El equipo quedó operativo al 100%..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('falla'); setError('') }}
              className="flex-none border border-gray-300 text-gray-600 font-medium py-3 px-4 rounded-xl text-sm"
            >
              ← Atrás
            </button>
            <button
              onClick={() => {
                if (!descripcionSolucion.trim() || descripcionSolucion.trim().length < 10) {
                  setError('Describe la solución aplicada (mínimo 10 caracteres)')
                  return
                }
                setError('')
                setStep('firma')
              }}
              style={{ backgroundColor: '#162f52' }}
              className="flex-1 text-white font-semibold py-3 rounded-xl text-base"
            >
              Siguiente → Firma del cliente
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Firma digital ── */}
      {step === 'firma' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Firma de conformidad</h2>
            <p className="text-sm text-gray-500">El encargado en el cliente debe firmar confirmando que el servicio fue satisfactorio.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Firma del cliente</label>
            {firmaCaptured ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={firmaData} alt="Firma" className="w-full h-48 object-contain border-2 border-green-300 rounded-xl bg-white" />
                <button
                  type="button"
                  onClick={() => { setFirmaCaptured(false); setFirmaData('') }}
                  className="text-sm text-blue-600 underline"
                >
                  Borrar y volver a firmar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <FirmaCanvas ref={firmaRef} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => firmaRef.current?.clear()}
                    className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2 rounded-xl"
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!firmaRef.current || firmaRef.current.isEmpty()) {
                        setError('Por favor dibuje la firma del encargado')
                        return
                      }
                      setFirmaData(firmaRef.current.toDataURL())
                      setFirmaCaptured(true)
                      setError('')
                    }}
                    style={{ backgroundColor: '#295536' }}
                    className="flex-1 text-white text-sm font-semibold py-2 rounded-xl"
                  >
                    Guardar firma
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Nombre del firmante</label>
            <input
              type="text"
              value={nombreFirmante}
              onChange={e => setNombreFirmante(e.target.value)}
              placeholder="Nombre completo del encargado"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('solucion'); setError('') }}
              className="flex-none border border-gray-300 text-gray-600 font-medium py-3 px-4 rounded-xl text-sm"
            >
              ← Atrás
            </button>
            <button
              onClick={handleCompletar}
              disabled={enviando}
              style={{ backgroundColor: enviando ? '#6b7280' : '#162f52' }}
              className="flex-1 text-white font-semibold py-3 rounded-xl text-base disabled:cursor-not-allowed"
            >
              {enviando ? 'Finalizando visita...' : 'Finalizar visita ✓'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: Confirmación ── */}
      {step === 'confirmacion' && (
        <div className="text-center py-8 space-y-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#295536' }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">¡Visita completada!</h2>
            <p className="text-gray-500 text-sm mt-1">La solicitud fue marcada como resuelta.</p>
          </div>
          {solicitud && (
            <div className="bg-gray-100 rounded-xl p-4 inline-block">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Ticket cerrado</p>
              <p className="text-xl font-mono font-bold" style={{ color: '#162f52' }}>{solicitud.ticket_id}</p>
            </div>
          )}
          <div className="pt-4">
            <Link
              href="/tecnicos"
              style={{ backgroundColor: '#162f52' }}
              className="inline-block text-white font-semibold py-3 px-8 rounded-xl text-base"
            >
              Volver al tablero
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
