'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/admin/actions'
import type { AppRole } from '@/lib/admin/roles'

const soporteItems = [
  { href: '/admin', label: 'Dashboard', icon: 'home' },
  { href: '/admin/solicitudes', label: 'Solicitudes', icon: 'inbox' },
  { href: '/admin/clientes', label: 'Clientes', icon: 'building' },
  { href: '/admin/almacenes', label: 'Almacenes', icon: 'warehouse' },
  { href: '/admin/maquinas', label: 'Máquinas', icon: 'printer' },
  { href: '/admin/tecnicos', label: 'Técnicos', icon: 'users' },
  { href: '/admin/stickers', label: 'Stickers QR', icon: 'qr' },
]

const gestionItems = [
  { href: '/admin/nomina', label: 'Nómina', icon: 'wallet' },
  { href: '/admin/costos', label: 'Costos', icon: 'calculator' },
  { href: '/admin/viaticos', label: 'Viáticos', icon: 'car' },
  { href: '/admin/cobros', label: 'Cobros', icon: 'receipt' },
  { href: '/admin/reportes', label: 'Reportes', icon: 'chart' },
]

// Combinar para compatibilidad
const navItems = soporteItems

const icons: Record<string, React.ReactNode> = {
  home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  inbox: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3l-1 2h-6l-1-2H4" />,
  building: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  warehouse: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21V9l9-6 9 6v12M9 21v-6h6v6M3 21h18" />,
  printer: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />,
  users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  qr: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />,
  wallet: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 14a1 1 0 100 2 1 1 0 000-2z" />,
  calculator: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m-6 4h6m-6 4h2m2 0h2M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  car: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 11l2-6h14l2 6M3 11h18v6H3v-6z" />,
  receipt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />,
  chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
}

const rolLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  contabilidad: 'Contabilidad',
  supervisor: 'Supervisor',
  tecnico: 'Técnico',
  chofer: 'Chofer',
}

interface SidebarProps {
  userEmail: string
  userName?: string
  userRole?: AppRole
}

function NavSection({ title, items, pathname }: { title: string; items: typeof soporteItems; pathname: string }) {
  return (
    <>
      <p className="text-[10px] text-blue-300/60 uppercase tracking-widest font-semibold px-3 pt-4 pb-1">
        {title}
      </p>
      {items.map(item => {
        const isActive = item.href === '/admin'
          ? pathname === '/admin'
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-white/10 text-white font-semibold'
                : 'text-blue-100 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {icons[item.icon]}
            </svg>
            {item.label}
          </Link>
        )
      })}
    </>
  )
}

export default function Sidebar({ userEmail, userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const showGestion = userRole && ['super_admin', 'admin', 'contabilidad'].includes(userRole)

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: '#162f52' }}>
      <div className="p-5 border-b border-white/10">
        <div className="bg-white/5 rounded-xl p-3">
          <Image
            src="/logo-toncan.png"
            alt="Toncan Digital"
            width={160}
            height={50}
            className="mx-auto h-auto w-auto max-h-10"
          />
        </div>
        <p className="text-center text-[10px] text-blue-200 uppercase tracking-widest mt-3 font-semibold">
          Panel Admin
        </p>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <NavSection title="Soporte QR" items={soporteItems} pathname={pathname} />
        {showGestion && (
          <>
            <div className="border-t border-white/10 my-3" />
            <NavSection title="Gestión" items={gestionItems} pathname={pathname} />
          </>
        )}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="px-3 py-2 mb-2">
          {userName && (
            <p className="text-xs text-white font-semibold truncate">{userName}</p>
          )}
          <p className="text-[10px] text-blue-200 truncate" title={userEmail}>{userEmail}</p>
          {userRole && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-blue-200">
              {rolLabels[userRole] ?? userRole}
            </span>
          )}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-100 hover:bg-white/5 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
