import { PageHeader } from '@/components/admin/ui'
import ImportarRelaciones from './ImportarRelaciones'
import ImportarNomina from './ImportarNomina'
import ImportarCostos from './ImportarCostos'

export default function ImportarPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <PageHeader
        titulo="Importar Datos"
        subtitulo="Carga relaciones anexas, genera nomina y actualiza estructura de costos"
      />

      <div className="space-y-6">
        <ImportarRelaciones />
        <ImportarNomina />
        <ImportarCostos />
      </div>
    </div>
  )
}
