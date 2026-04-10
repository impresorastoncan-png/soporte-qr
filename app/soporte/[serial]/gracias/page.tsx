import Image from 'next/image'
import Link from 'next/link'

export default async function GraciasPage({
  params,
  searchParams,
}: {
  params: Promise<{ serial: string }>
  searchParams: Promise<{ ticket?: string }>
}) {
  const { serial } = await params
  const { ticket } = await searchParams

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
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 pt-12 pb-12 text-center">
        {/* Icono check */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#295536' }}>
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Solicitud enviada!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Su solicitud de soporte técnico ha sido registrada y notificada al equipo de Toncan Digital.
        </p>

        {ticket && (
          <div className="bg-gray-100 rounded-xl p-4 mb-6 inline-block">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Número de ticket</p>
            <p className="text-2xl font-mono font-bold" style={{ color: '#162f52' }}>{ticket}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-left">
          <p className="text-sm text-blue-800 font-semibold mb-1">¿Qué pasa ahora?</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• El equipo técnico fue notificado por correo.</li>
            <li>• Un técnico se pondrá en contacto con usted.</li>
            <li>• Si ingresó su correo, recibirá una copia de la notificación.</li>
          </ul>
        </div>

        <Link
          href={`/soporte/${serial}`}
          className="text-sm font-semibold underline"
          style={{ color: '#162f52' }}
        >
          Enviar otra solicitud
        </Link>

        <div className="mt-12 pt-6 border-t border-gray-200">
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
