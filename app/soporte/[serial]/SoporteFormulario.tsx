'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { tiposProblema } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Props {
  serial: string
  modelo: string
  ubicacion: string
  clienteNombre: string
}

const urgencias = [
  { value: 'baja',    label: 'Baja',    desc: 'Puede esperar',             color: 'green',  emoji: '🟢' },
  { value: 'media',   label: 'Media',   desc: 'Esta semana',               color: 'yellow', emoji: '🟡' },
  { value: 'alta',    label: 'Alta',    desc: 'Hoy',                       color: 'orange', emoji: '🟠' },
  { value: 'critica', label: 'Crítica', desc: 'Urgente, afecta operaciones', color: 'red',  emoji: '🔴' },
] as const

type UrgenciaValue = typeof urgencias[number]['value']

export default function SoporteFormulario({ serial, modelo, ubicacion, clienteNombre }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nombre_solicitante: '',
    correo_solicitante: '',
    urgencia: '' as UrgenciaValue | '',
    necesita_toner: '' as 'si' | 'no' | '',
    tipo_problema: '',
    descripcion: '',
  })

  const [fotos, setFotos] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')

  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!form.nombre_solicitante.trim() || form.nombre_solicitante.trim().length < 2) {
      e.nombre_solicitante = 'Ingrese su nombre completo'
    }
    if (form.correo_solicitante && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_solicitante)) {
      e.correo_solicitante = 'Correo inválido'
    }
    if (!form.urgencia) e.urgencia = 'Seleccione el nivel de urgencia'
    if (!form.necesita_toner) e.necesita_toner = 'Indique si necesita tóner'
    if (!form.descripcion.trim() || form.descripcion.trim().length < 10) {
      e.descripcion = 'Describa el problema (mínimo 10 caracteres)'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setEnviando(true)
    setErrorGeneral('')

    try {
      // Subir fotos a Supabase Storage
      const fotosUrls: string[] = []
      for (let i = 0; i < fotos.length; i++) {
        const foto = fotos[i]
        const ext = foto.name.split('.').pop()
        const path = `${serial}/${Date.now()}-${i}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('solicitudes-fotos')
          .upload(path, foto, { upsert: false })

        if (uploadError) {
          console.error('Error subiendo foto:', uploadError)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('solicitudes-fotos')
          .getPublicUrl(uploadData.path)

        fotosUrls.push(urlData.publicUrl)
      }

      // Enviar al API
      const response = await fetch('/api/soporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial,
          nombre_solicitante: form.nombre_solicitante.trim(),
          correo_solicitante: form.correo_solicitante.trim() || undefined,
          urgencia: form.urgencia,
          necesita_toner: form.necesita_toner === 'si',
          tipo_problema: form.tipo_problema || undefined,
          descripcion: form.descripcion.trim(),
          fotos_urls: fotosUrls.length > 0 ? fotosUrls : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrorGeneral(result.error || 'Error al enviar la solicitud. Intente nuevamente.')
        return
      }

      router.push(`/soporte/${serial}/gracias?ticket=${result.ticketId}`)
    } catch {
      setErrorGeneral('Error de conexión. Por favor intente nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  function handleFotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3)
    setFotos(files)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ backgroundColor: '#162f52' }} className="py-6 px-4">
        <div className="max-w-xl mx-auto text-center">
          <Image
            src="/logo-toncan.png"
            alt="Toncan Digital"
            width={220}
            height={70}
            priority
            className="mx-auto h-auto w-auto max-h-16"
          />
          <h1 className="text-white text-xl font-bold mt-4">Solicitud de Soporte Técnico</h1>
          <p className="text-blue-200 text-sm mt-1">{clienteNombre}</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 pb-12">
        {/* Tarjeta de máquina */}
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mt-5 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Equipo</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-400">Modelo</p>
              <p className="font-semibold text-gray-800">{modelo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Serial</p>
              <p className="font-mono font-semibold text-gray-800">{serial}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Ubicación</p>
              <p className="font-semibold text-gray-800">{ubicacion || '—'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre del solicitante <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre_solicitante}
              onChange={e => setForm(f => ({ ...f, nombre_solicitante: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 ${errors.nombre_solicitante ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              placeholder="Ej: María González"
            />
            {errors.nombre_solicitante && <p className="text-red-500 text-xs mt-1">{errors.nombre_solicitante}</p>}
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Correo electrónico{' '}
              <span className="text-gray-400 font-normal">(opcional — recibirá copia de la notificación)</span>
            </label>
            <input
              type="email"
              value={form.correo_solicitante}
              onChange={e => setForm(f => ({ ...f, correo_solicitante: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 ${errors.correo_solicitante ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              placeholder="correo@empresa.com"
            />
            {errors.correo_solicitante && <p className="text-red-500 text-xs mt-1">{errors.correo_solicitante}</p>}
          </div>

          {/* Urgencia */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nivel de urgencia <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {urgencias.map(u => (
                <label
                  key={u.value}
                  className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
                    form.urgencia === u.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgencia"
                    value={u.value}
                    checked={form.urgencia === u.value}
                    onChange={() => setForm(f => ({ ...f, urgencia: u.value }))}
                    className="sr-only"
                  />
                  <span className="text-lg">{u.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{u.label}</p>
                    <p className="text-xs text-gray-500">{u.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.urgencia && <p className="text-red-500 text-xs mt-1">{errors.urgencia}</p>}
          </div>

          {/* Tóner */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ¿Necesita tóner? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {[{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }].map(opt => (
                <label
                  key={opt.value}
                  className={`flex-1 flex items-center justify-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
                    form.necesita_toner === opt.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="necesita_toner"
                    value={opt.value}
                    checked={form.necesita_toner === opt.value}
                    onChange={() => setForm(f => ({ ...f, necesita_toner: opt.value as 'si' | 'no' }))}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.necesita_toner && <p className="text-red-500 text-xs mt-1">{errors.necesita_toner}</p>}
          </div>

          {/* Tipo de problema */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tipo de problema <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              value={form.tipo_problema}
              onChange={e => setForm(f => ({ ...f, tipo_problema: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Seleccionar tipo...</option>
              {tiposProblema.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Descripción del problema <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={4}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.descripcion ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              placeholder="Describa el problema que está experimentando..."
            />
            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
          </div>

          {/* Fotos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Fotos <span className="text-gray-400 font-normal">(opcional, máx. 3)</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFotosChange}
                className="hidden"
              />
              {fotos.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-700 font-medium">{fotos.length} foto(s) seleccionada(s)</p>
                  <p className="text-xs text-gray-400 mt-1">{fotos.map(f => f.name).join(', ')}</p>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">Toca para adjuntar fotos</p>
                </div>
              )}
            </div>
          </div>

          {/* Error general */}
          {errorGeneral && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errorGeneral}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={enviando}
            style={{ backgroundColor: enviando ? '#6b7280' : '#162f52' }}
            className="w-full text-white font-semibold py-3 rounded-xl text-base transition-colors disabled:cursor-not-allowed"
          >
            {enviando ? 'Enviando solicitud...' : 'Enviar Solicitud'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Para más información:{' '}
            <a href="mailto:gerenciaatc@toncandigital.com" className="text-blue-600 hover:underline">
              gerenciaatc@toncandigital.com
            </a>{' '}
            · (0212) 735 1960/1961
          </p>
        </div>
      </main>
    </div>
  )
}
