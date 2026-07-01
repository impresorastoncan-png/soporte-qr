import Image from 'next/image'

export const metadata = {
  title: 'Portal Técnico — Toncan Digital',
}

export default function TecnicosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header style={{ backgroundColor: '#162f52' }} className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
        <Image
          src="/logo-toncan.png"
          alt="Toncan Digital"
          width={120}
          height={38}
          className="h-auto w-auto max-h-8"
          priority
        />
        <span className="text-blue-200 text-sm font-medium">· Portal de Campo</span>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
