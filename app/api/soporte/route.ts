import { NextRequest } from 'next/server'
import { createServiceClient, createAnonClient } from '@/lib/supabase/server'
import { solicitudSchema } from '@/lib/validations'
import { sendSolicitudEmail } from '@/lib/email'
import { generarTicketId, formatearFecha } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = solicitudSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const anonClient = createAnonClient()
    const serviceClient = createServiceClient()

    // 1. Buscar máquina
    const { data: maquina } = await anonClient
      .from('maquinas')
      .select('id, serial, modelo, ubicacion, encargado_email, activo, cliente_id')
      .eq('serial', data.serial)
      .single()

    if (!maquina || !maquina.activo) {
      return Response.json({ error: 'Máquina no encontrada o inactiva' }, { status: 404 })
    }

    // 2. Buscar cliente
    const { data: cliente } = await anonClient
      .from('clientes')
      .select('id, nombre, atc_email, activo')
      .eq('id', maquina.cliente_id)
      .single()

    if (!cliente || !cliente.activo) {
      return Response.json({ error: 'Cliente inactivo' }, { status: 400 })
    }

    // 3. Obtener técnicos asignados
    const { data: tecnicosRel } = await serviceClient
      .from('maquina_tecnicos')
      .select('tecnico_id')
      .eq('maquina_id', maquina.id)

    const tecnicoIds = (tecnicosRel ?? []).map(r => r.tecnico_id)
    let tecnicosEmails: string[] = []

    if (tecnicoIds.length > 0) {
      const { data: tecnicos } = await serviceClient
        .from('tecnicos')
        .select('email')
        .in('id', tecnicoIds)
        .eq('activo', true)

      tecnicosEmails = (tecnicos ?? []).map(t => t.email)
    }

    const ticketId = generarTicketId()
    const now = new Date().toISOString()
    const fechaFormateada = formatearFecha(now)

    // 4. Insertar solicitud
    const { data: solicitud, error: insertError } = await serviceClient
      .from('solicitudes')
      .insert({
        maquina_id: maquina.id,
        serial: maquina.serial,
        cliente_nombre: cliente.nombre,
        modelo: maquina.modelo,
        ubicacion: maquina.ubicacion,
        nombre_solicitante: data.nombre_solicitante.trim(),
        correo_solicitante: data.correo_solicitante?.trim() || null,
        urgencia: data.urgencia,
        necesita_toner: data.necesita_toner,
        tipo_problema: data.tipo_problema || null,
        descripcion: data.descripcion.trim(),
        fotos_urls: data.fotos_urls && data.fotos_urls.length > 0 ? data.fotos_urls : null,
        estado: 'pendiente',
        ticket_id: ticketId,
      })
      .select('id')
      .single()

    if (insertError || !solicitud) {
      console.error('Error insertando solicitud:', insertError)
      return Response.json({ error: 'Error al registrar la solicitud' }, { status: 500 })
    }

    // 5. Enviar emails
    try {
      await sendSolicitudEmail({
        ticketId,
        fecha: fechaFormateada,
        clienteNombre: cliente.nombre,
        ubicacion: maquina.ubicacion,
        modelo: maquina.modelo,
        serial: maquina.serial,
        atcEmail: cliente.atc_email,
        tecnicosEmails,
        encargadoEmail: maquina.encargado_email,
        correoSolicitante: data.correo_solicitante?.trim() || null,
        urgencia: data.urgencia,
        necesitaToner: data.necesita_toner,
        tipoProblema: data.tipo_problema || null,
        descripcion: data.descripcion.trim(),
        fotosUrls: data.fotos_urls && data.fotos_urls.length > 0 ? data.fotos_urls : null,
      })
    } catch (emailError) {
      console.error('Error enviando email (solicitud guardada igualmente):', emailError)
    }

    return Response.json({ success: true, ticketId, solicitudId: solicitud.id }, { status: 201 })
  } catch (err) {
    console.error('Error en POST /api/soporte:', err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
