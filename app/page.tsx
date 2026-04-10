import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-7 w-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h4.5v4.5h-4.5zM15.75 4.5h4.5v4.5h-4.5zM3.75 16.5h4.5v4.5h-4.5zM15 15h2.25v2.25H15zM18.75 18.75H21V21h-2.25zM15 18.75h2.25V21H15zM18.75 15H21v2.25h-2.25z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Toncan Digital
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Sistema de Soporte QR
        </p>
        <p className="mt-6 text-sm leading-6 text-slate-600">
          Gestión de solicitudes de soporte técnico para impresoras Canon iR-ADVance.
          Los usuarios finales reportan fallas escaneando el código QR en cada equipo.
        </p>
        <Link
          href="/admin/login"
          className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Administrar
        </Link>
        <p className="mt-6 text-xs text-slate-400">
          Corporación Toncan Digital, C.A.
        </p>
      </div>
    </main>
  )
}
