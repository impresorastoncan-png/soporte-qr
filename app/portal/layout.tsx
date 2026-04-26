import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/admin/auth'
import { canAccessPortal } from '@/lib/admin/roles'
import Link from 'next/link'
import PortalBottomNav from './PortalBottomNav'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentProfile()

  if (!current) {
    redirect('/admin/login?next=/portal')
  }

  if (current.profile && !canAccessPortal(current.profile.rol)) {
    redirect('/acceso-denegado')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header compacto */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <Link href="/portal" className="text-sm font-bold text-gray-800">
            Toncan Digital
          </Link>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Portal Técnico</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-700 truncate max-w-[140px]">
            {current.profile?.nombre ?? current.user.email}
          </p>
          {current.profile?.rol && (
            <span className="text-[10px] text-gray-400 capitalize">
              {current.profile.rol.replace('_', ' ')}
            </span>
          )}
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <PortalBottomNav />
    </div>
  )
}
