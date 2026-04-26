import { PageHeader } from '@/components/admin/ui'

export default function ReportesPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <PageHeader
        titulo="Reportes"
        subtitulo="Dashboard financiero y operativo — en construcción"
      />
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-sm text-gray-500">Esta sección estará disponible en fases posteriores.</p>
      </div>
    </div>
  )
}
