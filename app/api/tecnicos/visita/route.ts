import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const solicitudId = request.nextUrl.searchParams.get('solicitudId')
  const tecnicoId = request.nextUrl.searchParams.get('tecnicoId')

  if (!solicitudId || !tecnicoId) {
    return Response.json({ error: 'solicitudId y tecnicoId requeridos' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data } = await serviceClient
    .from('visitas_tecnicas')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .eq('tecnico_id', tecnicoId)
    .is('hora_cierre', null)
    .maybeSingle()

  return Response.json({ visita: data })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const action = formData.get('action') as string

    if (!action) {
      return Response.json({ error: 'action requerido' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // --- RECLAMAR: el técnico toma una solicitud del tablero ---
    if (action === 'reclamar') {
      const solicitudId = formData.get('solicitudId') as string
      const tecnicoId = formData.get('tecnicoId') as string
      const tecnicoNombre = formData.get('tecnicoNombre') as string

      if (!solicitudId || !tecnicoId || !tecnicoNombre) {
        return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
      }

      const { data: visita, error: insertError } = await serviceClient
        .from('visitas_tecnicas')
        .insert({
          solicitud_id: solicitudId,
          tecnico_id: tecnicoId,
          tecnico_nombre: tecnicoNombre,
        })
        .select('id')
        .single()

      if (insertError || !visita) {
        console.error('Error creando visita:', insertError)
        return Response.json({ error: 'Error al crear visita' }, { status: 500 })
      }

      // Solo avanza a en_proceso si aún estaba pendiente
      await serviceClient
        .from('solicitudes')
        .update({ estado: 'en_proceso' })
        .eq('id', solicitudId)
        .eq('estado', 'pendiente')

      return Response.json({ success: true, visitaId: visita.id })
    }

    // --- INICIAR: técnico llegó al sitio y sube foto ---
    if (action === 'iniciar') {
      const visitaId = formData.get('visitaId') as string
      const foto = formData.get('foto') as File | null

      if (!visitaId) {
        return Response.json({ error: 'visitaId requerido' }, { status: 400 })
      }

      let fotoUrl: string | null = null

      if (foto && foto.size > 0) {
        // Obtener solicitud_id desde la visita para construir el path
        const { data: visitaData } = await serviceClient
          .from('visitas_tecnicas')
          .select('solicitud_id')
          .eq('id', visitaId)
          .single()

        if (visitaData) {
          const ext = foto.name.split('.').pop()?.toLowerCase() ?? 'jpg'
          const path = `${visitaData.solicitud_id}/${Date.now()}.${ext}`
          const bytes = await foto.arrayBuffer()

          const { error: uploadError } = await serviceClient.storage
            .from('visitas-fotos')
            .upload(path, Buffer.from(bytes), { contentType: foto.type, upsert: false })

          if (!uploadError) {
            const { data: signed } = await serviceClient.storage
              .from('visitas-fotos')
              .createSignedUrl(path, 60 * 60 * 24 * 365)
            fotoUrl = signed?.signedUrl ?? null
          } else {
            console.error('Error subiendo foto de visita:', uploadError)
          }
        }
      }

      const { error: updateError } = await serviceClient
        .from('visitas_tecnicas')
        .update({ hora_llegada: new Date().toISOString(), foto_llegada_url: fotoUrl })
        .eq('id', visitaId)

      if (updateError) {
        return Response.json({ error: 'Error al registrar llegada' }, { status: 500 })
      }

      return Response.json({ success: true })
    }

    // --- COMPLETAR: toda la info de resolución + firma ---
    if (action === 'completar') {
      const visitaId = formData.get('visitaId') as string
      const solicitudId = formData.get('solicitudId') as string
      const descripcionFalla = formData.get('descripcionFalla') as string
      const descripcionSolucion = formData.get('descripcionSolucion') as string
      const firmaClienteData = formData.get('firmaClienteData') as string
      const nombreFirmante = formData.get('nombreFirmante') as string

      if (!visitaId || !solicitudId || !descripcionFalla || !descripcionSolucion || !firmaClienteData || !nombreFirmante) {
        return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
      }

      const { error: updateError } = await serviceClient
        .from('visitas_tecnicas')
        .update({
          descripcion_falla: descripcionFalla.trim(),
          descripcion_solucion: descripcionSolucion.trim(),
          firma_cliente_data: firmaClienteData,
          nombre_firmante: nombreFirmante.trim(),
          hora_cierre: new Date().toISOString(),
        })
        .eq('id', visitaId)

      if (updateError) {
        console.error('Error completando visita:', updateError)
        return Response.json({ error: 'Error al completar visita' }, { status: 500 })
      }

      await serviceClient
        .from('solicitudes')
        .update({ estado: 'resuelto' })
        .eq('id', solicitudId)

      return Response.json({ success: true })
    }

    return Response.json({ error: 'action no válido' }, { status: 400 })
  } catch (err) {
    console.error('Error en POST /api/tecnicos/visita:', err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
