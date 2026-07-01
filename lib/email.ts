import { Resend } from 'resend'
import { render } from '@react-email/components'
import { SolicitudEmail } from '@/components/email/SolicitudEmail'
import { ConfirmacionClienteEmail } from '@/components/email/ConfirmacionClienteEmail'
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
  contador: number
  atcEmail: string
  emailFijo?: string | null
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
  if (params.emailFijo) destinatariosSet.add(params.emailFijo)
  params.tecnicosEmails.forEach(e => destinatariosSet.add(e))
  if (params.encargadoEmail) destinatariosSet.add(params.encargadoEmail)
  destinatariosSet.add(process.env.EMAIL_ALMACEN!)
  destinatariosSet.add(process.env.EMAIL_SOPORTE!)

  const to = Array.from(destinatariosSet)
  const cc = params.correoSolicitante ? [params.correoSolicitante] : []

  const html = await render(
    SolicitudEmail({
      ticketId: params.ticketId,
      fecha: params.fecha,
      clienteNombre: params.clienteNombre,
      ubicacion: params.ubicacion,
      modelo: params.modelo,
      serial: params.serial,
      contador: params.contador,
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
    from: process.env.EMAIL_FROM ?? 'Toncan Digital <noreply@toncandigital.com>',
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

interface SendConfirmacionEmailParams {
  ticketId: string
  fecha: string
  clienteNombre: string
  ubicacion: string
  modelo: string
  nombreSolicitante: string
  correoSolicitante: string
  urgencia: Urgencia
}

export async function sendConfirmacionEmail(params: SendConfirmacionEmailParams) {
  const urg = urgenciaConfig[params.urgencia]
  const subject = `${urg.emoji} [${params.ticketId}] Su solicitud fue recibida — Toncan Digital`

  const html = await render(
    ConfirmacionClienteEmail({
      ticketId: params.ticketId,
      fecha: params.fecha,
      clienteNombre: params.clienteNombre,
      ubicacion: params.ubicacion,
      modelo: params.modelo,
      nombreSolicitante: params.nombreSolicitante,
      urgencia: params.urgencia,
    })
  )

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'Toncan Digital <noreply@toncandigital.com>',
    to: [params.correoSolicitante],
    subject,
    html,
  })

  if (error) {
    console.error('Error enviando confirmación al cliente:', error)
    throw new Error(`Error al enviar confirmación: ${error.message}`)
  }

  return data
}
