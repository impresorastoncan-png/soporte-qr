import Image from 'next/image'
import LoginForm from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-6 rounded-2xl" style={{ backgroundColor: '#162f52' }}>
            <Image
              src="/logo-toncan.png"
              alt="Toncan Digital"
              width={180}
              height={60}
              priority
              className="mx-auto h-auto w-auto max-h-14"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-5">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">Ingrese con su cuenta autorizada</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <LoginForm next={next} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Corporación Toncan Digital, C.A.
        </p>
      </div>
    </div>
  )
}
