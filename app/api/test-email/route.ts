import { sendSolicitudEmail } from '@/lib/email'

export async function GET() {
  try {
    await sendSolicitudEmail({
      ticketId: 'TKT-TEST01',
      fecha: new Date().toLocaleDateString('es-VE'),
      clienteNombre: 'TEST CLIENTE',
      ubicacion: 'Oficina de prueba',
      modelo: 'Kyocera TASKalfa',
      serial: 'TEST-SERIAL',
      atcEmail: 'atc2@toncandigital.com',
      emailFijo: null,
      tecnicosEmails: [],
      encargadoEmail: null,
      correoSolicitante: 'jomore.mail@gmail.com',
      urgencia: 'baja',
      necesitaToner: false,
      tipoProblema: 'Diagnóstico',
      descripcion: 'Este es un email de prueba para verificar que el sistema funciona correctamente.',
      fotosUrls: null,
    })
    return Response.json({ ok: true, message: 'Email enviado exitosamente' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }
}
