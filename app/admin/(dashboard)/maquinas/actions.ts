'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'

type ActionState = { error?: string }

export async function guardarMaquina(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = (formData.get('id') as string) || null
  const serial = (formData.get('serial') as string)?.trim().toUpperCase()
  const modelo = (formData.get('modelo') as string)?.trim()
  const cliente_id = (formData.get('cliente_id') as string)?.trim()
  const ubicacion = (formData.get('ubicacion') as string)?.trim() || ''
  const encargado_email = (formData.get('encargado_email') as string)?.trim().toLowerCase() || null
  const activo = formData.get('activo') === 'on'
  const tecnicoIds = formData.getAll('tecnico_ids') as string[]

  if (!serial || serial.length < 2) return { error: 'El serial es obligatorio' }
  if (!modelo) return { error: 'El modelo es obligatorio' }
  if (!cliente_id) return { error: 'Debe seleccionar un cliente' }
  if (encargado_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(encargado_email)) {
    return { error: 'Correo del encargado inválido' }
  }

  const supabase = await createSSRClient()
  let maquinaId = id

  if (id) {
    const { error } = await supabase
      .from('maquinas')
      .update({ serial, modelo, cliente_id, ubicacion, encargado_email, activo })
      .eq('id', id)
    if (error) {
      if (error.code === '23505') return { error: 'Ya existe una máquina con ese serial' }
      return { error: error.message }
    }
  } else {
    const { data, error } = await supabase
      .from('maquinas')
      .insert({ serial, modelo, cliente_id, ubicacion, encargado_email, activo })
      .select('id')
      .single()
    if (error) {
      if (error.code === '23505') return { error: 'Ya existe una máquina con ese serial' }
      return { error: error.message }
    }
    maquinaId = (data as { id: string }).id
  }

  // Sincronizar técnicos asignados
  if (maquinaId) {
    await supabase.from('maquina_tecnicos').delete().eq('maquina_id', maquinaId)
    if (tecnicoIds.length > 0) {
      const rows = tecnicoIds.map(tecnico_id => ({ maquina_id: maquinaId!, tecnico_id }))
      const { error: relError } = await supabase.from('maquina_tecnicos').insert(rows)
      if (relError) return { error: `Máquina guardada pero falló asignación de técnicos: ${relError.message}` }
    }
  }

  revalidatePath('/admin/maquinas')
  revalidatePath(`/admin/clientes/${cliente_id}`)
  redirect(`/admin/clientes/${cliente_id}`)
}

export async function eliminarMaquina(id: string, clienteId: string) {
  const supabase = await createSSRClient()
  await supabase.from('maquina_tecnicos').delete().eq('maquina_id', id)
  const { error } = await supabase.from('maquinas').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('No se puede eliminar: la máquina tiene solicitudes históricas. Retírala a un almacén en su lugar.')
    }
    throw new Error(error.message)
  }
  revalidatePath('/admin/maquinas')
  revalidatePath(`/admin/clientes/${clienteId}`)
}

export async function retirarMaquina(maquinaId: string, almacenId: string) {
  if (!almacenId) throw new Error('Debes seleccionar un almacén')
  const supabase = await createSSRClient()

  const { data: almacen } = await supabase
    .from('clientes')
    .select('id, es_almacen')
    .eq('id', almacenId)
    .single()
  if (!almacen || !(almacen as { es_almacen: boolean }).es_almacen) {
    throw new Error('El destino no es un almacén válido')
  }

  const { data: maqData } = await supabase
    .from('maquinas')
    .select('cliente_id')
    .eq('id', maquinaId)
    .single()
  const oldClienteId = (maqData as { cliente_id: string } | null)?.cliente_id

  const { error } = await supabase
    .from('maquinas')
    .update({
      cliente_id: almacenId,
      ubicacion: '',
      encargado_email: null,
      activo: false,
    })
    .eq('id', maquinaId)
  if (error) throw new Error(error.message)

  await supabase.from('maquina_tecnicos').delete().eq('maquina_id', maquinaId)

  revalidatePath('/admin/maquinas')
  revalidatePath('/admin/almacenes')
  if (oldClienteId) revalidatePath(`/admin/clientes/${oldClienteId}`)
  revalidatePath(`/admin/clientes/${almacenId}`)
}

// ── IMPORTACIÓN MASIVA DESDE EXCEL ──────────────────────────────────────────

export type FilaImportar = {
  serial: string
  modelo: string
  ubicacion: string
  encargado_email: string | null
}

type ImportResult = {
  error?: string
  inserted?: number
  updated?: number
  skipped?: { serial: string; razon: string }[]
}

export async function importarMaquinas(
  clienteId: string,
  filas: FilaImportar[]
): Promise<ImportResult> {
  if (!clienteId) return { error: 'Cliente no especificado' }
  if (filas.length === 0) return { error: 'No hay filas para importar' }

  const supabase = await createSSRClient()

  // Verificar que el cliente existe
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('id', clienteId)
    .single()
  if (!cliente) return { error: 'Cliente no encontrado' }

  let inserted = 0
  let updated = 0
  const skipped: { serial: string; razon: string }[] = []

  for (const fila of filas) {
    const serial = fila.serial.trim().toUpperCase()
    const modelo = fila.modelo.trim()
    const ubicacion = (fila.ubicacion ?? '').trim()
    const encargado_email = fila.encargado_email?.trim().toLowerCase() || null

    if (!serial) {
      skipped.push({ serial: '(vacío)', razon: 'Serial vacío' })
      continue
    }
    if (!modelo) {
      skipped.push({ serial, razon: 'Modelo vacío' })
      continue
    }

    // ¿Existe ya esa máquina?
    const { data: existente } = await supabase
      .from('maquinas')
      .select('id, cliente_id, clientes!inner(es_almacen)')
      .eq('serial', serial)
      .maybeSingle()

    if (existente) {
      const existing = existente as { id: string; cliente_id: string; clientes: { es_almacen: boolean } | { es_almacen: boolean }[] | null }
      const clienteRel = Array.isArray(existing.clientes) ? existing.clientes[0] : existing.clientes
      const enAlmacen = clienteRel?.es_almacen === true
      // Si existe en otro cliente real (no almacén), saltamos
      if (existing.cliente_id !== clienteId && !enAlmacen) {
        skipped.push({ serial, razon: 'Ya existe en otro cliente' })
        continue
      }
      // Actualizar campos (y mover al cliente si venía de un almacén)
      const { error } = await supabase
        .from('maquinas')
        .update({
          modelo,
          ubicacion,
          encargado_email,
          cliente_id: clienteId,
          activo: true,
        })
        .eq('id', existing.id)
      if (error) {
        skipped.push({ serial, razon: error.message })
        continue
      }
      updated++
    } else {
      const { error } = await supabase.from('maquinas').insert({
        serial,
        modelo,
        cliente_id: clienteId,
        ubicacion,
        encargado_email,
        activo: true,
      })
      if (error) {
        skipped.push({ serial, razon: error.message })
        continue
      }
      inserted++
    }
  }

  revalidatePath('/admin/maquinas')
  revalidatePath(`/admin/clientes/${clienteId}`)

  return { inserted, updated, skipped }
}
