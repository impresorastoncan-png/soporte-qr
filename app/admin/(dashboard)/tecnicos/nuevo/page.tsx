import { PageHeader, Card } from '@/components/admin/ui'
import TecnicoForm from '../TecnicoForm'

export default function NuevoTecnicoPage() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <PageHeader titulo="Nuevo técnico" subtitulo="Agregar personal técnico al sistema" />
      <Card className="p-6">
        <TecnicoForm />
      </Card>
    </div>
  )
}
