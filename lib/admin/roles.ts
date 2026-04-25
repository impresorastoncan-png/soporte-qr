export const APP_ROLES = [
  'super_admin',
  'admin',
  'contabilidad',
  'supervisor',
  'tecnico',
  'chofer',
] as const

export type AppRole = (typeof APP_ROLES)[number]

const ADMIN_ROLES: AppRole[] = ['super_admin', 'admin', 'contabilidad']
const ADMIN_ROUTE_ROLES: AppRole[] = ['super_admin', 'admin', 'contabilidad', 'supervisor']
const PORTAL_ROLES: AppRole[] = ['super_admin', 'admin', 'supervisor', 'tecnico', 'chofer']

export function isAdmin(rol: AppRole): boolean {
  return ADMIN_ROLES.includes(rol)
}

export function canAccessAdmin(rol: AppRole): boolean {
  return ADMIN_ROUTE_ROLES.includes(rol)
}

export function canAccessPortal(rol: AppRole): boolean {
  return PORTAL_ROLES.includes(rol)
}
