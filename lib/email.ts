import { Resend } from 'resend'
import { render } from '@react-email/components'
import { SolicitudEmail } from '@/components/email/SolicitudEmail'
import { urgenciaConfig } from './utils'
import type { Urgencia } from './supabase/types'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendSolicitudEmailParams {
  ticketId: string
  fecha: string
  clienteNombre: string
  ubicacion: string
  modelo: string
  serial: string
  atcEmail: string
  tecnicosEmails: string[]
  encargadoEmail?: string | null
  correoSolicitante?: string | null
  urgencia: Urgencia
  necesitaToner: boolean
  tipoProblema?: string | null
  descripcion: string
  fotosUrls?: string[] | null
}

export async function sendSolicitudEmail(params: SendSolicitudEmailParams) {
  const urg = urgenciaConfig[params.urgencia]

  // Construir asunto
  const tonerFlag = params.necesitaToner ? ' · ⚠️ TÓNER' : ''
  const subject = `${urg.emoji} [${params.ticketId}] ${params.modelo} · ${params.clienteNombre}${tonerFlag}`

  // Construir lista de destinatarios (sin duplicados)
  const destinatariosSet = new Set<string>()
  destinatariosSet.add(params.atcEmail)
  params.tecnicosEmails.forEach(e => destinatariosSet.add(e))
  if (params.encargadoEmail) destinatariosSet.add(params.encargadoEmail)
  destinatariosSet.add(process.env.EMAIL_ALMACEN!)
  destinatariosSet.add(process.env.EMAIL_GERENTE_TEC!)

  // TEMPORAL: mientras el dominio no esté verificado en Resend, solo se puede
  // enviar a impresorastoncan@gmail.com. Filtrar el resto para pruebas.
  const ALLOWED_TEST_EMAIL = 'impresorastoncan@gmail.com'
  const to = Array.from(destinatariosSet).filter(e => e === ALLOWED_TEST_EMAIL)
  if (to.length === 0) to.push(ALLOWED_TEST_EMAIL)
  const cc =
    params.correoSolicitante === ALLOWED_TEST_EMAIL ? [params.correoSolicitante] : []

  const html = await render(
    SolicitudEmail({
      ticketId: params.ticketId,
      fecha: params.fecha,
      clienteNombre: params.clienteNombre,
      ubicacion: params.ubicacion,
      modelo: params.modelo,
      serial: params.serial,
      tecnicosEmails: params.tecnicosEmails,
      encargadoEmail: params.encargadoEmail,
      correoSolicitante: params.correoSolicitante,
      urgencia: params.urgencia,
      necesitaToner: params.necesitaToner,
      tipoProblema: params.tipoProblema,
      descripcion: params.descripcion,
      fotosUrls: params.fotosUrls,
    })
  )

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    cc,
    subject,
    html,
  })

  if (error) {
    console.error('Error enviando email:', error)
    throw new Error(`Error al enviar notificación: ${error.message}`)
  }

  return data
}
