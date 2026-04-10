import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, Card } from '@/components/admin/ui'
import ImportarExcel from './ImportarExcel'
import type { ClienteRow } from '@/lib/supabase/types'

export default async function ImportarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSSRClient()

  const { data } = await supabase.from('clientes').select('*').eq('id', id).single()
  const cliente = data as ClienteRow | null
  if (!cliente) notFound()

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-2">
        <Link href={`/admin/clientes/${id}`} className="text-xs text-gray-500 hover:text-gray-700">
          ← Volver a {cliente.nombre}
        </Link>
      </div>

      <PageHeader
        titulo="Importar máquinas desde Excel"
        subtitulo={`Carga masiva para ${cliente.nombre}`}
      />

      {/* Instrucciones */}
      <Card className="p-5 mb-5 bg-blue-50 border-blue-200">
        <h3 className="text-sm font-bold text-blue-900 mb-2">Formato esperado del Excel</h3>
        <p className="text-xs text-blue-800 mb-3">
          La primera fila debe contener los encabezados. Las columnas reconocidas son (no distingue mayúsculas/minúsculas):
        </p>
        <div className="bg-white rounded-lg border border-blue-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-blue-100">
              <tr>
                <th className="text-left px-3 py-2 font-bold text-blue-900">serial</th>
                <th className="text-left px-3 py-2 font-bold text-blue-900">modelo</th>
                <th className="text-left px-3 py-2 font-bold text-blue-900">ubicacion</th>
                <th className="text-left px-3 py-2 font-bold text-blue-900">encargado_email</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-blue-100">
                <td className="px-3 py-2 font-mono">XWH04309</td>
                <td className="px-3 py-2">iR-ADV 4535i</td>
                <td className="px-3 py-2">Piso 2 · Administración</td>
                <td className="px-3 py-2">juan@cliente.com</td>
              </tr>
              <tr className="border-t border-blue-100">
                <td className="px-3 py-2 font-mono">XLJ04170</td>
                <td className="px-3 py-2">iR-ADV C5540</td>
                <td className="px-3 py-2">Recepción</td>
                <td className="px-3 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="text-xs text-blue-800 mt-3 space-y-1">
          <li>• <strong>serial</strong> y <strong>modelo</strong> son obligatorios.</li>
          <li>• <strong>ubicacion</strong> y <strong>encargado_email</strong> son opcionales.</li>
          <li>• Si un serial ya existe en este cliente, se actualizarán sus datos.</li>
          <li>• Si un serial ya existe en <em>otro</em> cliente, esa fila se omite.</li>
          <li>• Todas las máquinas se importarán como activas.</li>
        </ul>
      </Card>

      <Card className="p-6">
        <ImportarExcel clienteId={id} clienteNombre={cliente.nombre} />
      </Card>
    </div>
  )
}
