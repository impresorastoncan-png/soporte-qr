import Link from 'next/link'

export default function AccesoDenegadoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V4m0 0L8 8m4-4l4 4M5 20h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Acceso denegado</h1>
        <p className="text-sm text-gray-500 mb-6">
          Tu rol no tiene permisos para acceder a esta sección. Contacta al administrador si crees que es un error.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#162f52' }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
