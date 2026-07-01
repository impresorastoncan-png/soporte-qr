import { z } from 'zod'

export const solicitudSchema = z.object({
  serial: z.string().min(1),
  nombre_solicitante: z.string().min(2, 'Ingrese su nombre completo'),
  correo_solicitante: z.string().email('Correo electrónico inválido').min(1, 'Ingrese su correo electrónico'),
  urgencia: z.enum(['baja', 'media', 'alta', 'critica']),
  necesita_toner: z.boolean(),
  tipo_problema: z.string().optional(),
  descripcion: z.string().min(10, 'Describa el problema (mínimo 10 caracteres)'),
  contador: z.coerce.number().int('El contador debe ser un número entero').min(0, 'El contador no puede ser negativo'),
  fotos_urls: z.array(z.string().url()).optional(),
})

export type SolicitudInput = z.infer<typeof solicitudSchema>
