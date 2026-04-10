'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'

type ActionState = { error?: string; success?: boolean }

export async function guardarTecnico(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = (formData.get('id') as string) || null
  const nombre = (formData.get('nombre') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const activo = formData.get('activo') === 'on'

  if (!nombre || nombre.length < 2) return { error: 'El nombre es obligatorio' }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Correo inválido' }

  const supabase = await createSSRClient()

  if (id) {
    const { error } = await supabase
      .from('tecnicos')
      .update({ nombre, email, activo })
      .eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('tecnicos').insert({ nombre, email, activo })
    if (error) {
      if (error.code === '23505') return { error: 'Ya existe un técnico con ese correo' }
      return { error: error.message }
    }
  }

  revalidatePath('/admin/tecnicos')
  redirect('/admin/tecnicos')
}

export async function eliminarTecnico(id: string) {
  const supabase = await createSSRClient()
  const { error } = await supabase.from('tecnicos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/tecnicos')
}
