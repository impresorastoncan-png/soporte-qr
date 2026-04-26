import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/admin/auth'
import { canAccessAdmin } from '@/lib/admin/roles'
import Sidebar from '@/components/admin/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentProfile()

  if (!current) {
    redirect('/admin/login')
  }

  // Si tiene perfil admin, verificar que su rol tenga acceso a /admin
  // Si NO tiene perfil, dejarlo pasar (usuario legacy del SaaS QR sin rol asignado)
  if (current.profile && !canAccessAdmin(current.profile.rol)) {
    redirect('/portal')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userEmail={current.user.email ?? 'admin'}
        userName={current.profile?.nombre}
        userRole={current.profile?.rol}
      />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
