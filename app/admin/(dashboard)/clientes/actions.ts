'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'

type ActionState = { error?: string }

export async function guardarCliente(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = (formData.get('id') as string) || null
  const nombre = (formData.get('nombre') as string)?.trim()
  const rif = (formData.get('rif') as string)?.trim() || null
  const direccion = (formData.get('direccion') as string)?.trim() || null
  const atc_email = (formData.get('atc_email') as string)?.trim().toLowerCase()
  const activo = formData.get('activo') === 'on'

  if (!nombre || nombre.length < 2) return { error: 'El nombre es obligatorio' }
  if (!atc_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(atc_email)) {
    return { error: 'Correo del ATC inválido' }
  }

  const supabase = await createSSRClient()

  if (id) {
    const { error } = await supabase
      .from('clientes')
      .update({ nombre, rif, direccion, atc_email, activo })
      .eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('clientes')
      .insert({ nombre, rif, direccion, atc_email, activo })
    if (error) {
      if (error.code === '23505') return { error: 'Ya existe un cliente con ese nombre' }
      return { error: error.message }
    }
  }

  revalidatePath('/admin/clientes')
  redirect('/admin/clientes')
}

export async function eliminarCliente(id: string) {
  const supabase = await createSSRClient()
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('No se puede eliminar: el cliente tiene máquinas asociadas. Elimínalas o reasígnalas primero.')
    }
    throw new Error(error.message)
  }
  revalidatePath('/admin/clientes')
}
