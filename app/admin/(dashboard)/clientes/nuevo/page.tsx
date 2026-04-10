import { PageHeader, Card } from '@/components/admin/ui'
import ClienteForm from '../ClienteForm'

export default function NuevoClientePage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <PageHeader titulo="Nuevo cliente" subtitulo="Registrar una nueva empresa en el sistema" />
      <Card className="p-6">
        <ClienteForm />
      </Card>
    </div>
  )
}
