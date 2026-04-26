import { getCurrentProfile } from '@/lib/admin/auth'

export default async function PortalHomePage() {
  const current = await getCurrentProfile()

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800">
        Hola, {current?.profile?.nombre ?? 'Técnico'}
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Rol: {current?.profile?.rol?.replace('_', ' ') ?? 'sin asignar'}
      </p>
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">Portal técnico en construcción.</p>
      </div>
    </div>
  )
}
