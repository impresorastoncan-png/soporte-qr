'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Tecnico {
  id: string
  nombre: string
}

export default function SelectorTecnico({ tecnicos }: { tecnicos: Tecnico[] }) {
  const router = useRouter()
  const [tecnicoActual, setTecnicoActual] = useState<Tecnico | null>(null)
  const [cambiando, setCambiando] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('toncan_tecnico')
      if (stored) {
        const parsed = JSON.parse(stored) as Tecnico
        if (tecnicos.find(t => t.id === parsed.id)) {
          setTecnicoActual(parsed)
        }
      }
    } catch {
      // localStorage no disponible o dato corrupto
    }
  }, [tecnicos])

  function seleccionar(tecnico: Tecnico) {
    localStorage.setItem('toncan_tecnico', JSON.stringify(tecnico))
    router.push('/tecnicos/solicitudes')
  }

  if (tecnicoActual && !cambiando) {
    return (
      <div className="space-y-4">
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Sesión activa</p>
          <p className="text-xl font-bold text-gray-800">{tecnicoActual.nombre}</p>
        </div>
        <button
          onClick={() => router.push('/tecnicos/solicitudes')}
          style={{ backgroundColor: '#162f52' }}
          className="w-full text-white font-semibold py-3 rounded-xl text-base"
        >
          Ver mis solicitudes
        </button>
        <button
          onClick={() => setCambiando(true)}
          className="w-full text-gray-500 font-medium py-2 text-sm underline"
        >
          Cambiar técnico
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tecnicos.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No hay técnicos activos registrados.</p>
      ) : (
        tecnicos.map(tecnico => (
          <button
            key={tecnico.id}
            onClick={() => seleccionar(tecnico)}
            className="w-full bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl px-5 py-4 text-left transition-all shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: '#162f52' }}>
                {tecnico.nombre.charAt(0).toUpperCase()}
              </div>
              <span className="text-base font-semibold text-gray-800">{tecnico.nombre}</span>
            </div>
          </button>
        ))
      )}
    </div>
  )
}
