export function generarTicketId(): string {
  return 'TKT-' + String(Date.now()).slice(-6)
}

export const urgenciaConfig = {
  baja:    { label: 'Baja',    emoji: '🟢', color: '#009933', desc: 'Puede esperar' },
  media:   { label: 'Media',   emoji: '🟡', color: '#f39c12', desc: 'Esta semana' },
  alta:    { label: 'Alta',    emoji: '🟠', color: '#e67e22', desc: 'Hoy' },
  critica: { label: 'Crítica', emoji: '🔴', color: '#CC0000', desc: 'Urgente, afecta operaciones' },
} as const

export const tiposProblema = [
  'Atasco de papel',
  'Error en pantalla / código de error',
  'Calidad de impresión deficiente',
  'La máquina no enciende',
  'No imprime / no responde',
  'Ruido inusual',
  'Problema con escáner',
  'Problema con fax',
  'Solicitud de mantenimiento preventivo',
  'Otro',
] as const

export function formatearFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
