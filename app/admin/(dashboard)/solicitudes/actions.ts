'use server'

import { revalidatePath } from 'next/cache'
import { createSSRClient } from '@/lib/supabase/server'
import type { EstadoSolicitud } from '@/lib/supabase/types'

export async function cambiarEstado(id: string, estado: EstadoSolicitud) {
  const supabase = await createSSRClient()
  const { error } = await supabase.from('solicitudes').update({ estado }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/solicitudes')
  revalidatePath('/admin')
}

export async function eliminarSolicitud(id: string) {
  const supabase = await createSSRClient()
  const { error } = await supabase.from('solicitudes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/solicitudes')
  revalidatePath('/admin')
}
