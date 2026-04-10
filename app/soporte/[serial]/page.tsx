import { notFound } from 'next/navigation'
import { createAnonClient } from '@/lib/supabase/server'
import SoporteFormulario from './SoporteFormulario'

export default async function SoportePage({
  params,
}: {
  params: Promise<{ serial: string }>
}) {
  const { serial } = await params
  const supabase = createAnonClient()

  // Buscar máquina
  const { data: maquina } = await supabase
    .from('maquinas')
    .select('id, serial, modelo, ubicacion, activo, cliente_id')
    .eq('serial', serial.toUpperCase())
    .single()

  if (!maquina || !maquina.activo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Equipo no encontrado</h1>
          <p className="text-gray-500 text-sm mb-6">
            El código QR escaneado no corresponde a ningún equipo activo en nuestro sistema.
          </p>
          <p className="text-xs text-gray-400">
            Serial: <span className="font-mono font-semibold">{serial}</span>
          </p>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              ¿Necesita ayuda? Contáctenos:<br />
              <a href="mailto:gerenciaatc@toncandigital.com" className="text-blue-600 hover:underline">
                gerenciaatc@toncandigital.com
              </a>{' '}
              · (0212) 735 1960/1961
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Buscar cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, nombre, activo')
    .eq('id', maquina.cliente_id)
    .single()

  if (!cliente || !cliente.activo) {
    notFound()
  }

  return (
    <SoporteFormulario
      serial={maquina.serial}
      modelo={maquina.modelo}
      ubicacion={maquina.ubicacion}
      clienteNombre={cliente.nombre}
    />
  )
}
