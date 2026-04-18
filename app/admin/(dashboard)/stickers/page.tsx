import Link from 'next/link'
import { createSSRClient } from '@/lib/supabase/server'
import { PageHeader, Card, EmptyState } from '@/components/admin/ui'
import type { ClienteRow } from '@/lib/supabase/types'

export default async function StickersPage() {
  const supabase = await createSSRClient()
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('es_almacen', false)
    .eq('activo', true)
    .order('nombre')
  const lista = (clientes ?? []) as ClienteRow[]

  const { data: maqs } = await supabase
    .from('maquinas')
    .select('cliente_id, activo')
  const conteo = new Map<string, number>()
  ;((maqs ?? []) as { cliente_id: string; activo: boolean }[]).forEach(m => {
    if (m.activo) conteo.set(m.cliente_id, (conteo.get(m.cliente_id) ?? 0) + 1)
  })

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <PageHeader
        titulo="Stickers QR"
        subtitulo="Elige un cliente para imprimir los stickers de sus máquinas"
      />

      <Card>
        {lista.length === 0 ? (
          <EmptyState
            titulo="Sin clientes activos"
            subtitulo="Registre un cliente con máquinas para generar stickers."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {lista.map(c => {
              const n = conteo.get(c.id) ?? 0
              return (
                <Link
                  key={c.id}
                  href={`/admin/stickers/${c.id}`}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#162f52] hover:shadow-sm transition-all bg-white"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{c.nombre}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{c.rif || '—'}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-lg bg-[#162f52]/5 border border-[#162f52]/10">
                    <span className="text-xl font-bold text-[#162f52]">{n}</span>
                    <span className="text-[9px] uppercase tracking-wide text-gray-500 font-semibold">
                      {n === 1 ? 'máquina' : 'máquinas'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
