'use server'

import { createAdminSSRClient } from '@/lib/admin/supabase-admin'

export type RelacionRow = {
  item: number
  modelo: string
  tipo: string // M (monocromo/B&N) o C (color)
  serial: string
  ubicacion: string
  lectAnterior: number
  lectActual: number
  diferencia: number
}

export type RelacionBloque = {
  cliente: string
  contrato: string
  tipoEquipo: 'bn' | 'color'
  periodo: string
  tasaCambio: number
  costoPorCopia: number
  equipos: RelacionRow[]
  totalCopias: number
  totalUsd: number
}

export type ImportResult = {
  ok: boolean
  message: string
  inserted?: number
}

/** Importar relaciones anexas (contadores) al sistema */
export async function importarRelacionesAnexas(bloques: RelacionBloque[]): Promise<ImportResult> {
  try {
    const supabase = await createAdminSSRClient()
    let totalInserted = 0

    for (const bloque of bloques) {
      // Buscar o crear cliente
      let clienteId: string | null = null
      const { data: existingCliente } = await supabase
        .from('clientes')
        .select('id')
        .ilike('razon_social', `%${bloque.cliente.split(' ').slice(0, 2).join('%')}%`)
        .limit(1)
        .single()

      if (existingCliente) {
        clienteId = existingCliente.id
      }

      // Insertar cobro mensual
      if (clienteId) {
        const cobro = bloque.tipoEquipo === 'bn'
          ? { copias_bn: bloque.totalCopias, monto_bn_usd: bloque.totalUsd, copias_color: 0, monto_color_usd: 0 }
          : { copias_color: bloque.totalCopias, monto_color_usd: bloque.totalUsd, copias_bn: 0, monto_bn_usd: 0 }

        await supabase
          .from('cobros_mensuales')
          .upsert({
            cliente_id: clienteId,
            periodo: bloque.periodo,
            ...cobro,
            tasa_bcv: bloque.tasaCambio,
          }, { onConflict: 'cliente_id,periodo' })
      }

      // Insertar lecturas de contadores
      for (const eq of bloque.equipos) {
        // Buscar equipo por serial
        const { data: equipo } = await supabase
          .from('equipos')
          .select('id')
          .eq('serial', eq.serial)
          .limit(1)
          .single()

        if (equipo) {
          await supabase.from('lecturas_contador').insert({
            equipo_id: equipo.id,
            fecha: new Date().toISOString().slice(0, 10),
            contador_bn: eq.tipo === 'M' || eq.tipo === 'B/N' ? eq.lectActual : 0,
            contador_color: eq.tipo === 'C' ? eq.lectActual : 0,
            copias_periodo_bn: eq.tipo === 'M' || eq.tipo === 'B/N' ? eq.diferencia : 0,
            copias_periodo_color: eq.tipo === 'C' ? eq.diferencia : 0,
          })
          totalInserted++
        }
      }
    }

    return { ok: true, message: `Importacion completada: ${totalInserted} lecturas registradas`, inserted: totalInserted }
  } catch (err) {
    return { ok: false, message: `Error: ${err instanceof Error ? err.message : 'desconocido'}` }
  }
}

/** Generar nomina del mes */
export async function generarNomina(periodo: string): Promise<ImportResult> {
  try {
    const supabase = await createAdminSSRClient()

    // Obtener tasa BCV mas reciente
    const { data: tasa } = await supabase
      .from('tasas_cambio')
      .select('bs_usd')
      .order('fecha', { ascending: false })
      .limit(1)
      .single()

    const tasaBcv = tasa?.bs_usd ?? 0
    if (!tasaBcv) {
      return { ok: false, message: 'No hay tasa BCV registrada. Actualiza la tasa primero.' }
    }

    // Obtener empleados activos
    const { data: empleados } = await supabase
      .from('empleados')
      .select('id, salario_base_usd')
      .eq('activo', true)

    if (!empleados || empleados.length === 0) {
      return { ok: false, message: 'No hay empleados activos registrados.' }
    }

    let inserted = 0
    for (const emp of empleados) {
      const salario = Number(emp.salario_base_usd) || 0
      const prestaciones = salario * 0.17
      const bonoVacacional = salario * 0.06
      const utilidades = salario * 0.17

      const { error } = await supabase.from('nomina_mensual').upsert({
        empleado_id: emp.id,
        periodo,
        salario_usd: salario,
        prestaciones_usd: Number(prestaciones.toFixed(2)),
        bono_vacacional_usd: Number(bonoVacacional.toFixed(2)),
        utilidades_usd: Number(utilidades.toFixed(2)),
        tasa_bcv: tasaBcv,
      }, { onConflict: 'empleado_id,periodo' })

      if (!error) inserted++
    }

    return { ok: true, message: `Nomina ${periodo} generada: ${inserted} empleados`, inserted }
  } catch (err) {
    return { ok: false, message: `Error: ${err instanceof Error ? err.message : 'desconocido'}` }
  }
}

/** Importar estructura de costos */
export type CostoRow = {
  categoria: string
  concepto: string
  monto_usd: number
  monto_bs: number
  monto_eur: number
}

export async function importarCostos(periodo: string, costos: CostoRow[]): Promise<ImportResult> {
  try {
    const supabase = await createAdminSSRClient()

    // Obtener tasa BCV
    const { data: tasa } = await supabase
      .from('tasas_cambio')
      .select('bs_usd')
      .order('fecha', { ascending: false })
      .limit(1)
      .single()

    const tasaBcv = tasa?.bs_usd ?? 0

    // Eliminar costos previos del periodo para reemplazar
    await supabase.from('costos_estructura').delete().eq('periodo', periodo)

    let inserted = 0
    for (const c of costos) {
      const { error } = await supabase.from('costos_estructura').insert({
        periodo,
        categoria: c.categoria,
        concepto: c.concepto,
        monto_usd: c.monto_usd,
        monto_bs: c.monto_bs || c.monto_usd * tasaBcv,
        monto_eur: c.monto_eur,
        tasa_bcv: tasaBcv,
      })
      if (!error) inserted++
    }

    return { ok: true, message: `Estructura de costos ${periodo} importada: ${inserted} registros`, inserted }
  } catch (err) {
    return { ok: false, message: `Error: ${err instanceof Error ? err.message : 'desconocido'}` }
  }
}
