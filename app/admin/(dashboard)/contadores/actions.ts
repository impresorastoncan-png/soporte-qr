'use server'

import { createAdminSSRClient } from '@/lib/admin/supabase-admin'
import { createSSRClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ContadorRow = {
  item: number
  modelo: string
  tipo: string
  serial: string
  ubicacion: string
  lectAnterior: number
  lectActual: number
  diferencia: number
}

export type ImportContadoresResult = {
  ok: boolean
  message: string
  inserted?: number
}

/** Importar lecturas de contadores para un cliente y periodo.
 *  - Crea maquinas nuevas si no existen (por serial)
 *  - Actualiza modelo/ubicacion de maquinas existentes
 *  - Reasigna maquinas al cliente si estaban en otro
 *  - Inserta lecturas (historial de contadores)
 *  - Upsert cobro mensual
 */
export async function importarContadores(
  clienteId: string,
  periodo: string,
  rows: ContadorRow[],
  tasaBcv: number,
  costoPorCopia: number,
): Promise<ImportContadoresResult> {
  try {
    const adminDb = await createAdminSSRClient()
    const publicDb = await createSSRClient()
    let totalInserted = 0
    let maquinasCreadas = 0
    let maquinasActualizadas = 0

    const totalCopias = rows.reduce((s, r) => s + r.diferencia, 0)

    // Buscar info del cliente en public.clientes para copiado minimo
    const { data: cliente } = await publicDb
      .from('clientes')
      .select('copiado_minimo, tarifa_fija_usd')
      .eq('id', clienteId)
      .single()

    const copiadoMinimo = (cliente as { copiado_minimo?: number })?.copiado_minimo ?? 0
    const tarifaFija = Number((cliente as { tarifa_fija_usd?: number })?.tarifa_fija_usd ?? 0)
    const aplicaMinimo = copiadoMinimo > 0 && totalCopias < copiadoMinimo

    // Calcular montos
    const montoCopiasUsd = totalCopias * costoPorCopia
    const montoMinimoUsd = aplicaMinimo ? tarifaFija : 0
    const totalUsd = aplicaMinimo ? tarifaFija : montoCopiasUsd

    // Upsert cobro mensual (admin schema, con ID de public.clientes)
    await adminDb
      .from('cobros_mensuales')
      .upsert({
        cliente_id: clienteId,
        periodo,
        copias_bn: totalCopias,
        copias_color: 0,
        monto_bn_usd: Number(totalUsd.toFixed(2)),
        monto_color_usd: 0,
        tasa_bcv: tasaBcv,
        estado_relacion: 'pendiente',
        aplica_minimo: aplicaMinimo,
        monto_minimo_usd: Number(montoMinimoUsd.toFixed(2)),
      }, { onConflict: 'cliente_id,periodo' })

    // Procesar cada equipo: crear/actualizar maquina + insertar lectura
    const fechaHoy = new Date().toISOString().slice(0, 10)
    // Derivar fecha de fin de periodo para la lectura
    const [pAnio, pMes] = periodo.split('-').map(Number)
    const fechaLectura = `${pAnio}-${String(pMes).padStart(2, '0')}-${new Date(pAnio, pMes, 0).getDate()}`

    for (const eq of rows) {
      if (!eq.serial) continue

      // Buscar maquina existente por serial
      const { data: maquinaExistente } = await publicDb
        .from('maquinas')
        .select('id, cliente_id, modelo, ubicacion')
        .eq('serial', eq.serial)
        .limit(1)
        .single()

      let maquinaId: string

      if (maquinaExistente) {
        maquinaId = maquinaExistente.id
        // Actualizar modelo, ubicacion, reasignar al cliente y marcar activa
        await publicDb
          .from('maquinas')
          .update({
            modelo: eq.modelo || maquinaExistente.modelo,
            ubicacion: eq.ubicacion || maquinaExistente.ubicacion,
            cliente_id: clienteId,
            activo: true,
          })
          .eq('id', maquinaId)
        maquinasActualizadas++
      } else {
        // Crear maquina nueva
        const { data: nuevaMaquina, error: createErr } = await publicDb
          .from('maquinas')
          .insert({
            serial: eq.serial,
            modelo: eq.modelo,
            ubicacion: eq.ubicacion,
            cliente_id: clienteId,
            activo: true,
          })
          .select('id')
          .single()

        if (createErr || !nuevaMaquina) continue
        maquinaId = nuevaMaquina.id
        maquinasCreadas++
      }

      // Insertar lectura (historial — no borra las anteriores)
      const esBN = eq.tipo !== 'C' && eq.tipo !== 'COLOR'
      await adminDb.from('lecturas_contador').insert({
        equipo_id: maquinaId,
        fecha: fechaLectura || fechaHoy,
        contador_bn: esBN ? eq.lectActual : 0,
        contador_color: !esBN ? eq.lectActual : 0,
        copias_periodo_bn: esBN ? eq.diferencia : 0,
        copias_periodo_color: !esBN ? eq.diferencia : 0,
      })
      totalInserted++
    }

    revalidatePath(`/admin/contadores/${clienteId}`)
    revalidatePath('/admin/contadores')

    const parts = [`${totalInserted} lecturas importadas`]
    if (maquinasCreadas > 0) parts.push(`${maquinasCreadas} maquinas nuevas creadas`)
    if (maquinasActualizadas > 0) parts.push(`${maquinasActualizadas} maquinas actualizadas`)

    return { ok: true, message: parts.join(', '), inserted: totalInserted }
  } catch (err) {
    return { ok: false, message: `Error: ${err instanceof Error ? err.message : 'desconocido'}` }
  }
}

/** Actualizar estado de relacion anexa */
export async function actualizarEstadoRelacion(
  clienteId: string,
  periodo: string,
  estado: 'pendiente' | 'proforma' | 'listo',
): Promise<{ ok: boolean; message: string }> {
  try {
    const adminDb = await createAdminSSRClient()
    const { error } = await adminDb
      .from('cobros_mensuales')
      .update({ estado_relacion: estado })
      .eq('cliente_id', clienteId)
      .eq('periodo', periodo)

    if (error) return { ok: false, message: error.message }

    revalidatePath(`/admin/contadores/${clienteId}`)
    revalidatePath('/admin/contadores')
    return { ok: true, message: `Estado actualizado a "${estado}"` }
  } catch (err) {
    return { ok: false, message: `Error: ${err instanceof Error ? err.message : 'desconocido'}` }
  }
}

/** Guardar copiado minimo y tarifa fija de un cliente (public.clientes) */
export async function guardarCopiadoMinimo(
  clienteId: string,
  copiadoMinimo: number,
  tarifaFijaUsd: number,
): Promise<{ ok: boolean; message: string }> {
  try {
    const publicDb = await createSSRClient()
    const { error } = await publicDb
      .from('clientes')
      .update({
        copiado_minimo: copiadoMinimo,
        tarifa_fija_usd: tarifaFijaUsd,
      })
      .eq('id', clienteId)

    if (error) return { ok: false, message: error.message }

    revalidatePath(`/admin/contadores/${clienteId}`)
    return { ok: true, message: 'Configuracion de copiado minimo guardada' }
  } catch (err) {
    return { ok: false, message: `Error: ${err instanceof Error ? err.message : 'desconocido'}` }
  }
}
