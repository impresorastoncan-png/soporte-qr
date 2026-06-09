import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const to = ['jo.moreno@correo.unimet.edu.ve', 'jomore.mail@gmail.com']
  const from = process.env.EMAIL_FROM ?? 'Toncan Digital <noreply@toncandigital.com>'

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: '✅ [TEST] Diagnóstico de envío de correos Toncan',
    html: '<p>Si recibes este correo, el sistema de envío funciona correctamente.</p><p><b>FROM:</b> ' + from + '</p><p><b>TO:</b> ' + to.join(', ') + '</p>',
  })

  return Response.json({
    from,
    to,
    resendData: data,
    resendError: error,
    apiKey: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.slice(0, 8)}...` : 'NOT SET',
  })
}
