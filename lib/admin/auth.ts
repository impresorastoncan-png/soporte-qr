import { createSSRClient } from '@/lib/supabase/server'
import { createAdminSSRClient } from './supabase-admin'
import type { AppRole } from './roles'

export interface AdminProfile {
  user_id: string
  nombre: string
  cedula: string | null
  rol: AppRole
  telefono: string | null
  empleado_id: string | null
  activo: boolean
}

export interface CurrentUser {
  user: {
    id: string
    email: string | undefined
  }
  profile: AdminProfile | null
}

/**
 * Server-side: obtiene el usuario autenticado y su perfil del schema admin.
 * Retorna null si no hay sesión activa.
 */
export async function getCurrentProfile(): Promise<CurrentUser | null> {
  const supabase = await createSSRClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const adminDb = await createAdminSSRClient()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return {
    user: { id: user.id, email: user.email },
    profile: profile as AdminProfile | null,
  }
}
