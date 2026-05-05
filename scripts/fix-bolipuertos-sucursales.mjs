/**
 * Fix: Separar BOLIPUERTOS en clientes por sucursal
 * - Renombra el cliente existente a "BOLIPUERTOS - SEDE"
 * - Crea 7 clientes adicionales por sucursal
 * - Reasigna maquinas segun el Excel de origen
 * - Borra el cobro agregado y crea cobros individuales por sucursal
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'

const SUPABASE_URL = 'https://oesfledeibzjyodyimgt.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) { console.error('Falta SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const publicDb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const adminDb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: 'admin' }, auth: { persistSession: false } })

const BASE = 'contadores de febrero 2026'
const PERIODO = '2026-02'

const SUCURSALES = [
  { file: 'Bolip Guamache Contadores Feb 2026.xlsx', nombre: 'BOLIPUERTOS - GUAMACHE' },
  { file: 'Bolip Guanta Contadores Feb 2026.xlsx', nombre: 'BOLIPUERTOS - GUANTA' },
  { file: 'Bolip La Ceiba Contadores Feb 2026.xlsx', nombre: 'BOLIPUERTOS - LA CEIBA' },
  { file: 'Bolip La Guaira Contadores Feb 2026.xlsx', nombre: 'BOLIPUERTOS - LA GUAIRA' },
  { file: 'Bolip Maracaibo Contadores Feb 2026.xlsx', nombre: 'BOLIPUERTOS - MARACAIBO' },
  { file: 'Bolip Pto Cabello Contadores Feb 2026.xlsx', nombre: 'BOLIPUERTOS - PTO CABELLO' },
  { file: 'Bolip Pto Seco Contadores Feb 2026.xlsx', nombre: 'BOLIPUERTOS - PTO SECO' },
  { file: 'Bolip Sede Contadores Feb 2026.xlsx', nombre: 'BOLIPUERTOS - SEDE' },
]

function getSerialsFromFile(filePath) {
  const buf = readFileSync(filePath)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const serials = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    // Find header row
    let headerIdx = -1
    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      if ((rows[i] || []).some(c => String(c).toLowerCase() === 'item')) {
        headerIdx = i
        break
      }
    }
    if (headerIdx < 0) continue

    // Read equipment serials
    for (let j = headerIdx + 1; j < rows.length; j++) {
      const r = rows[j] || []
      const item = Number(r[0])
      if (!item || isNaN(item)) break
      const serial = String(r[3] || '').trim()
      if (serial) serials.push(serial)
    }
  }

  return serials
}

function getCostFromFile(filePath) {
  const buf = readFileSync(filePath)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  let costoPorCopia = 0
  let totalCopias = 0
  let totalUsd = 0
  let tasaCambio = 0

  // Find header
  let headerIdx = -1
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    if ((rows[i] || []).some(c => String(c).toLowerCase() === 'item')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) return { costoPorCopia: 0.05, totalCopias: 0, totalUsd: 0, tasaCambio: 405.35 }

  // Count copies from equipment
  for (let j = headerIdx + 1; j < rows.length; j++) {
    const r = rows[j] || []
    const item = Number(r[0])
    if (!item || isNaN(item)) break
    totalCopias += Number(r[7]) || 0
  }

  // Find cost/copy and tasa in summary rows
  for (let k = headerIdx + 1; k < rows.length; k++) {
    const r = rows[k] || []
    const joined = r.map(String).join(' ').toLowerCase()
    if (joined.includes('copias x') || joined.includes('copias ×')) {
      costoPorCopia = Number(r[6]) || 0
    }
    if (joined.includes('tipo de cambio')) {
      tasaCambio = Number(r[7]) || 0
    }
  }

  totalUsd = totalCopias * costoPorCopia
  return { costoPorCopia, totalCopias, totalUsd, tasaCambio: tasaCambio || 405.35 }
}

async function main() {
  console.log('=== FIX: Separar BOLIPUERTOS por sucursal ===\n')

  // 1. Find the existing BOLIPUERTOS client
  const { data: existing } = await publicDb
    .from('clientes')
    .select('id, nombre')
    .ilike('nombre', '%BOLIPUERTOS%')

  if (!existing || existing.length === 0) {
    console.error('No se encontro cliente BOLIPUERTOS')
    process.exit(1)
  }

  const originalId = existing[0].id
  console.log(`Cliente original: ${existing[0].nombre} (${originalId})`)

  // 2. Delete old cobros for the original client
  const { error: delCobroErr } = await adminDb
    .from('cobros_mensuales')
    .delete()
    .eq('cliente_id', originalId)
    .eq('periodo', PERIODO)

  if (delCobroErr) console.log(`  Warn borrando cobro: ${delCobroErr.message}`)
  else console.log('  Cobro agregado eliminado')

  // 3. Delete old lecturas for machines of original client
  const { data: oldMaquinas } = await publicDb
    .from('maquinas')
    .select('id')
    .eq('cliente_id', originalId)

  if (oldMaquinas && oldMaquinas.length > 0) {
    const maqIds = oldMaquinas.map(m => m.id)
    const { error: delLectErr } = await adminDb
      .from('lecturas_contador')
      .delete()
      .in('equipo_id', maqIds)

    if (delLectErr) console.log(`  Warn borrando lecturas: ${delLectErr.message}`)
    else console.log(`  ${maqIds.length} lecturas antiguas eliminadas`)
  }

  // 4. Process each sucursal
  for (const suc of SUCURSALES) {
    console.log(`\n--- ${suc.nombre} ---`)

    const filePath = join(BASE, 'atc1', suc.file)
    const serials = getSerialsFromFile(filePath)
    const { costoPorCopia, totalCopias, totalUsd, tasaCambio } = getCostFromFile(filePath)
    console.log(`  Seriales: ${serials.length} | Copias: ${totalCopias} | USD: $${totalUsd.toFixed(2)}`)

    let clienteId

    if (suc.nombre === 'BOLIPUERTOS - SEDE') {
      // Rename the original
      await publicDb
        .from('clientes')
        .update({ nombre: suc.nombre })
        .eq('id', originalId)
      clienteId = originalId
      console.log(`  Renombrado cliente existente a "${suc.nombre}"`)
    } else {
      // Create new client
      const { data: created, error } = await publicDb
        .from('clientes')
        .insert({
          nombre: suc.nombre,
          atc_email: 'ATC1',
          activo: true,
          es_almacen: false,
          tarifa_bn_usd: costoPorCopia,
        })
        .select('id')
        .single()

      if (error) {
        // Maybe already exists from a prior run
        const { data: ex } = await publicDb.from('clientes').select('id').eq('nombre', suc.nombre).single()
        if (ex) {
          clienteId = ex.id
          console.log(`  Cliente ya existia`)
        } else {
          console.error(`  ERROR creando cliente: ${error.message}`)
          continue
        }
      } else {
        clienteId = created.id
        console.log(`  + Cliente creado: ${suc.nombre}`)
      }
    }

    // 5. Reassign machines by serial
    for (const serial of serials) {
      const { data: maq } = await publicDb
        .from('maquinas')
        .select('id')
        .eq('serial', serial)
        .limit(1)
        .single()

      if (maq) {
        await publicDb.from('maquinas').update({ cliente_id: clienteId }).eq('id', maq.id)

        // 6. Insert lectura
        // Re-read from file to get actual values
      }
    }

    // Re-parse file for full lectura data
    const buf = readFileSync(filePath)
    const wb = XLSX.read(buf, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    let headerIdx = -1
    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      if ((rows[i] || []).some(c => String(c).toLowerCase() === 'item')) {
        headerIdx = i
        break
      }
    }

    if (headerIdx >= 0) {
      for (let j = headerIdx + 1; j < rows.length; j++) {
        const r = rows[j] || []
        const item = Number(r[0])
        if (!item || isNaN(item)) break

        const serial = String(r[3] || '').trim()
        const tipo = String(r[2] || 'B/N').trim()
        const lectActual = Number(r[6]) || 0
        const diferencia = Number(r[7]) || 0

        if (!serial) continue

        const { data: maq } = await publicDb
          .from('maquinas')
          .select('id')
          .eq('serial', serial)
          .limit(1)
          .single()

        if (maq) {
          await adminDb.from('lecturas_contador').insert({
            equipo_id: maq.id,
            fecha: '2026-02-28',
            contador_bn: tipo !== 'C' && tipo !== 'COLOR' ? lectActual : 0,
            contador_color: tipo === 'C' || tipo === 'COLOR' ? lectActual : 0,
            copias_periodo_bn: tipo !== 'C' && tipo !== 'COLOR' ? diferencia : 0,
            copias_periodo_color: tipo === 'C' || tipo === 'COLOR' ? diferencia : 0,
          })
        }
      }
    }

    console.log(`  Maquinas reasignadas y lecturas insertadas`)

    // 7. Insert cobro for this sucursal
    const { error: cobroErr } = await adminDb.from('cobros_mensuales').insert({
      cliente_id: clienteId,
      periodo: PERIODO,
      copias_bn: totalCopias,
      copias_color: 0,
      monto_bn_usd: Number(totalUsd.toFixed(2)),
      monto_color_usd: 0,
      tasa_bcv: tasaCambio,
      estado_relacion: 'proforma',
      aplica_minimo: false,
      monto_minimo_usd: 0,
    })

    if (cobroErr) {
      console.log(`  Warn cobro: ${cobroErr.message}`)
    } else {
      console.log(`  Cobro insertado: $${totalUsd.toFixed(2)}`)
    }
  }

  console.log('\n=== DONE ===')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
