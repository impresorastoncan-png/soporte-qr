import dynamic from 'next/dynamic'

export const metadata = {
  title: 'Diagrama del sistema — Toncan Digital',
}

const DiagramaMermaid = dynamic(() => import('@/components/DiagramaMermaid'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  ),
})

export default function DiagramaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Diagrama del sistema</h1>
          <p className="text-sm text-gray-500 mt-1">
            Flujos, procesos y relaciones de la plataforma Toncan Digital
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <DiagramaMermaid />
        </div>
      </div>
    </div>
  )
}
