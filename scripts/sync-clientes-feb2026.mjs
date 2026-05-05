/**
 * Sinceramiento de clientes con datos de contadores febrero 2026
 * - Consolida duplicados (queda uno por cliente con el nombre del Excel)
 * - Corrige atc_email a atcX@toncandigital.com
 * - Reasigna maquinas y recalcula cobros
 * - Desactiva clientes "BOLIPUERTOS - X" viejos, usa "Bolipuerto X" originales renombrados
 */
import { readFileSync, readdirSync } from 'fs'
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

const ATC_EMAILS = {
  atc1: 'atc1@toncandigital.com',
  atc2: 'atc2@toncandigital.com',
  atc3: 'atc3@toncandigital.com',
}

// Mapeo de cliente Excel -> nombre preferido en el sistema
// El primer match en la BD se conserva, los demas se eliminan
const BOLIP_SUCURSALES = {
  'Bolip Guamache Contadores Feb 2026.xlsx': 'BOLIPUERTOS - GUAMACHE',
  'Bolip Guanta Contadores Feb 2026.xlsx': 'BOLIPUERTOS - GUANTA',
  'Bolip La Ceiba Contadores Feb 2026.xlsx': 'BOLIPUERTOS - LA CEIBA',
  'Bolip La Guaira Contadores Feb 2026.xlsx': 'BOLIPUERTOS - LA GUAIRA',
  'Bolip Maracaibo Contadores Feb 2026.xlsx': 'BOLIPUERTOS - MARACAIBO',
  'Bolip Pto Cabello Contadores Feb 2026.xlsx': 'BOLIPUERTOS - PTO CABELLO',
  'Bolip Pto Seco Contadores Feb 2026.xlsx': 'BOLIPUERTOS - PTO SECO',
  'Bolip Sede Contadores Feb 2026.xlsx': 'BOLIPUERTOS - SEDE',
}

function parseClienteFromFile(filePath) {
  const buf = readFileSync(filePath)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const results = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    let clienteName = ''
    let headerIdx = -1
    const serials = []
    let totalCopias = 0
    let costoPorCopia = 0
    let tasaCambio = 405.35
    let totalUsd = 0

    // Find client name
    for (let i = 0; i < Math.min(rows.length, 6); i++) {
      const joined = (rows[i] || []).map(String).join(' ')
      if (/cliente\s/i.test(joined)) {
        const match = joined.match(/cliente\s+(.+)/i)
        if (match) clienteName = match[1].trim()
      }
    }

    // Find header
    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      if ((rows[i] || []).some(c => String(c).toLowerCase() === 'item')) {
        headerIdx = i
        break
      }
    }

    if (headerIdx < 0 || !clienteName) continue

    // Read equipment
    for (let j = headerIdx + 1; j < rows.length; j++) {
      const r = rows[j] || []
      const item = Number(r[0])
      if (!item || isNaN(item)) break
      serials.push({
        serial: String(r[3] || '').trim(),
        modelo: String(r[1] || '').trim(),
        tipo: String(r[2] || 'M').trim(),
        ubicacion: String(r[4] || '').trim(),
        lectAnterior: Number(r[5]) || 0,
        lectActual: Number(r[6]) || 0,
        diferencia: Number(r[7]) || 0,
      })
      totalCopias += Number(r[7]) || 0
    }

    // Find cost and totals
    for (let k = headerIdx; k < rows.length; k++) {
      const r = rows[k] || []
      const joined = r.map(String).join(' ').toLowerCase()
      if (joined.includes('copias x') || joined.includes('copias ×')) {
        costoPorCopia = Number(r[6]) || 0
        totalUsd = Number(r[7]) || 0
      }
      if (joined.includes('tipo de cambio')) {
        tasaCambio = Number(r[7]) || 405.35
      }
    }

    if (!totalUsd && costoPorCopia) totalUsd = totalCopias * costoPorCopia

    results.push({ clienteName, sheetName, serials, totalCopias, costoPorCopia, tasaCambio, totalUsd })
  }
  return results
}

async function main() {
  console.log('=== SINCERAMIENTO DE CLIENTES ===\n')

  // Step 1: Delete duplicate "Bolipuerto X" clients (old ones) and merge into "BOLIPUERTOS - X"
  console.log('--- Paso 1: Eliminar duplicados Bolipuerto ---')
  const oldBolipNames = [
    'Bolipuerto Guamache', 'Bolipuerto Guanta', 'Bolipuerto La Ceiba',
    'Bolipuerto La Guaira', 'Bolipuerto Maracaibo', 'Bolipuerto Puerto Cabello',
    'Bolipuerto Puerto Seco', 'Bolipuerto Sede',
  ]
  for (const oldName of oldBolipNames) {
    const { data: old } = await publicDb.from('clientes').select('id').eq('nombre', oldName).single()
    if (old) {
      // Move any machines from old to new equivalent
      const newName = 'BOLIPUERTOS - ' + oldName.replace('Bolipuerto ', '').toUpperCase()
        .replace('PUERTO CABELLO', 'PTO CABELLO').replace('PUERTO SECO', 'PTO SECO')
      const { data: newClient } = await publicDb.from('clientes').select('id').eq('nombre', newName).single()
      if (newClient) {
        await publicDb.from('maquinas').update({ cliente_id: newClient.id }).eq('cliente_id', old.id)
        // Move cobros
        await adminDb.from('cobros_mensuales').update({ cliente_id: newClient.id }).eq('cliente_id', old.id)
        await adminDb.from('lecturas_contador').delete().eq('equipo_id', old.id) // these won't match but safe
      }
      // Delete old client
      const { error } = await publicDb.from('clientes').delete().eq('id', old.id)
      if (error) {
        // If FK error, just deactivate
        await publicDb.from('clientes').update({ activo: false }).eq('id', old.id)
        console.log(`  ${oldName}: desactivado (FK constraint)`)
      } else {
        console.log(`  ${oldName}: eliminado`)
      }
    }
  }

  // Also handle "Fundaci��n Centro Cultural Chacao" duplicate
  const { data: fccOld } = await publicDb.from('clientes').select('id').eq('nombre', 'Fundación Centro Cultural Chacao').single()
  const { data: fccNew } = await publicDb.from('clientes').select('id').eq('nombre', 'FUNDACION CENTRO CULTURAL CHACAO').single()
  if (fccOld && fccNew) {
    await publicDb.from('maquinas').update({ cliente_id: fccNew.id }).eq('cliente_id', fccOld.id)
    await adminDb.from('cobros_mensuales').update({ cliente_id: fccNew.id }).eq('cliente_id', fccOld.id)
    const { error } = await publicDb.from('clientes').delete().eq('id', fccOld.id)
    console.log(`  Fundación Centro Cultural Chacao: ${error ? 'desactivado' : 'eliminado (duplicado)'}`)
    if (error) await publicDb.from('clientes').update({ activo: false }).eq('id', fccOld.id)
  }

  // Handle "Operaciones La Candelaria" duplicate
  const { data: olcOld } = await publicDb.from('clientes').select('id').eq('nombre', 'Operaciones La Candelaria, C.A').single()
  const { data: olcNew } = await publicDb.from('clientes').select('id').eq('nombre', 'OPERACIONES LA CANDELARIA, C.A').single()
  if (olcOld && olcNew) {
    await publicDb.from('maquinas').update({ cliente_id: olcNew.id }).eq('cliente_id', olcOld.id)
    await adminDb.from('cobros_mensuales').update({ cliente_id: olcNew.id }).eq('cliente_id', olcOld.id)
    const { error } = await publicDb.from('clientes').delete().eq('id', olcOld.id)
    console.log(`  Operaciones La Candelaria, C.A: ${error ? 'desactivado' : 'eliminado (duplicado)'}`)
    if (error) await publicDb.from('clientes').update({ activo: false }).eq('id', olcOld.id)
  }

  // Step 2: Process all Excel files - ensure clients exist with correct names and ATC emails
  console.log('\n--- Paso 2: Sincerar clientes desde Excel ---')

  // Delete ALL existing cobros and lecturas for PERIODO to re-insert cleanly
  console.log('  Limpiando cobros y lecturas de 2026-02...')
  await adminDb.from('cobros_mensuales').delete().eq('periodo', PERIODO)
  // Get all machine IDs to delete their lecturas for this period
  const { data: allMaqs } = await publicDb.from('maquinas').select('id')
  if (allMaqs && allMaqs.length > 0) {
    // Delete in batches of 100
    for (let i = 0; i < allMaqs.length; i += 100) {
      const batch = allMaqs.slice(i, i + 100).map(m => m.id)
      await adminDb.from('lecturas_contador').delete().in('equipo_id', batch).eq('fecha', '2026-02-28')
    }
  }
  console.log('  Listo.')

  // Now process each ATC folder
  for (const atcDir of ['atc1', 'atc2', 'atc3']) {
    const atcEmail = ATC_EMAILS[atcDir]
    const dir = join(BASE, atcDir)
    const files = readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$') && f !== 'EJEMPLO.xlsx')

    console.log(`\n  === ${atcDir.toUpperCase()} (${atcEmail}) — ${files.length} archivos ===`)

    for (const file of files) {
      const filePath = join(dir, file)

      // Special handling for Bolipuertos (already split by sucursal)
      if (file.startsWith('Bolip ')) {
        const sucNombre = BOLIP_SUCURSALES[file]
        if (!sucNombre) { console.log(`    SKIP: ${file}`); continue }

        const sheets = parseClienteFromFile(filePath)
        if (sheets.length === 0) continue
        const sheet = sheets[0]

        // Find or create the sucursal client
        let { data: cliente } = await publicDb.from('clientes').select('id').eq('nombre', sucNombre).single()
        if (!cliente) {
          const { data: created } = await publicDb.from('clientes').insert({
            nombre: sucNombre, atc_email: atcEmail, activo: true, es_almacen: false,
          }).select('id').single()
          cliente = created
          console.log(`    + Creado: ${sucNombre}`)
        } else {
          await publicDb.from('clientes').update({ atc_email: atcEmail, activo: true }).eq('id', cliente.id)
        }

        if (!cliente) continue

        // Upsert machines and insert lecturas
        for (const eq of sheet.serials) {
          if (!eq.serial) continue
          let { data: maq } = await publicDb.from('maquinas').select('id').eq('serial', eq.serial).single()
          if (!maq) {
            const { data: created } = await publicDb.from('maquinas').insert({
              serial: eq.serial, modelo: eq.modelo, ubicacion: eq.ubicacion,
              cliente_id: cliente.id, activo: true,
            }).select('id').single()
            maq = created
          } else {
            await publicDb.from('maquinas').update({
              modelo: eq.modelo, ubicacion: eq.ubicacion, cliente_id: cliente.id, activo: true,
            }).eq('id', maq.id)
          }
          if (!maq) continue
          const esBN = eq.tipo !== 'C' && eq.tipo !== 'COLOR'
          await adminDb.from('lecturas_contador').insert({
            equipo_id: maq.id, fecha: '2026-02-28',
            contador_bn: esBN ? eq.lectActual : 0,
            contador_color: !esBN ? eq.lectActual : 0,
            copias_periodo_bn: esBN ? eq.diferencia : 0,
            copias_periodo_color: !esBN ? eq.diferencia : 0,
          })
        }

        // Insert cobro
        await adminDb.from('cobros_mensuales').insert({
          cliente_id: cliente.id, periodo: PERIODO,
          copias_bn: sheet.totalCopias, copias_color: 0,
          monto_bn_usd: Number(sheet.totalUsd.toFixed(2)), monto_color_usd: 0,
          tasa_bcv: sheet.tasaCambio, estado_relacion: 'proforma',
          aplica_minimo: false, monto_minimo_usd: 0,
        })

        console.log(`    ${sucNombre}: ${sheet.serials.length} equipos, ${sheet.totalCopias} copias, $${sheet.totalUsd.toFixed(2)}`)
        continue
      }

      // Non-Bolipuertos files
      const sheets = parseClienteFromFile(filePath)
      if (sheets.length === 0) { console.log(`    SKIP: ${file} (no data)`); continue }

      // For multi-sheet files, all sheets belong to the same client
      const clienteName = sheets[0].clienteName

      // Find existing client by exact name
      let { data: cliente } = await publicDb.from('clientes').select('id, nombre').eq('nombre', clienteName).single()

      if (!cliente) {
        // Try case-insensitive search
        const { data: found } = await publicDb.from('clientes').select('id, nombre').ilike('nombre', clienteName).single()
        if (found) {
          cliente = found
          // Rename to exact Excel name
          await publicDb.from('clientes').update({ nombre: clienteName, atc_email: atcEmail, activo: true }).eq('id', found.id)
        }
      }

      if (!cliente) {
        // Create new client
        const { data: created, error } = await publicDb.from('clientes').insert({
          nombre: clienteName, atc_email: atcEmail, activo: true, es_almacen: false,
        }).select('id, nombre').single()
        if (error) {
          console.log(`    ERROR creando "${clienteName}": ${error.message}`)
          continue
        }
        cliente = created
        console.log(`    + Creado: ${clienteName}`)
      } else {
        // Update atc_email
        await publicDb.from('clientes').update({ atc_email: atcEmail, activo: true }).eq('id', cliente.id)
      }

      // Process all sheets for this client
      let totalCopiasCliente = 0
      let totalUsdCliente = 0
      let tasaCambioCliente = 405.35

      for (const sheet of sheets) {
        totalCopiasCliente += sheet.totalCopias
        totalUsdCliente += sheet.totalUsd
        if (sheet.tasaCambio) tasaCambioCliente = sheet.tasaCambio

        // Upsert machines and insert lecturas
        for (const eq of sheet.serials) {
          if (!eq.serial) continue
          let { data: maq } = await publicDb.from('maquinas').select('id').eq('serial', eq.serial).single()
          if (!maq) {
            const { data: created } = await publicDb.from('maquinas').insert({
              serial: eq.serial, modelo: eq.modelo, ubicacion: eq.ubicacion,
              cliente_id: cliente.id, activo: true,
            }).select('id').single()
            maq = created
          } else {
            await publicDb.from('maquinas').update({
              modelo: eq.modelo, ubicacion: eq.ubicacion, cliente_id: cliente.id, activo: true,
            }).eq('id', maq.id)
          }
          if (!maq) continue
          const esBN = eq.tipo !== 'C' && eq.tipo !== 'COLOR'
          await adminDb.from('lecturas_contador').insert({
            equipo_id: maq.id, fecha: '2026-02-28',
            contador_bn: esBN ? eq.lectActual : 0,
            contador_color: !esBN ? eq.lectActual : 0,
            copias_periodo_bn: esBN ? eq.diferencia : 0,
            copias_periodo_color: !esBN ? eq.diferencia : 0,
          })
        }
      }

      // Insert cobro for this client (aggregated from all sheets)
      await adminDb.from('cobros_mensuales').insert({
        cliente_id: cliente.id, periodo: PERIODO,
        copias_bn: totalCopiasCliente, copias_color: 0,
        monto_bn_usd: Number(totalUsdCliente.toFixed(2)), monto_color_usd: 0,
        tasa_bcv: tasaCambioCliente, estado_relacion: 'proforma',
        aplica_minimo: false, monto_minimo_usd: 0,
      })

      console.log(`    ${clienteName}: ${sheets.reduce((s, sh) => s + sh.serials.length, 0)} equipos, ${totalCopiasCliente} copias, $${totalUsdCliente.toFixed(2)}`)
    }
  }

  // Step 3: Fix atc_email for ALL clients that have wrong format
  console.log('\n--- Paso 3: Corregir emails ATC ---')
  const { data: allClientes } = await publicDb.from('clientes').select('id, nombre, atc_email').eq('es_almacen', false)
  let fixed = 0
  for (const c of allClientes || []) {
    const email = (c.atc_email || '').toLowerCase()
    let correctEmail = null

    if (email === 'atc1' || email.includes('atc1')) correctEmail = 'atc1@toncandigital.com'
    else if (email === 'atc2' || email.includes('atc2')) correctEmail = 'atc2@toncandigital.com'
    else if (email === 'atc3' || email.includes('atc3')) correctEmail = 'atc3@toncandigital.com'

    if (correctEmail && email !== correctEmail) {
      await publicDb.from('clientes').update({ atc_email: correctEmail }).eq('id', c.id)
      fixed++
    }
  }
  console.log(`  ${fixed} emails corregidos a formato atcX@toncandigital.com`)

  // Step 4: Final summary
  console.log('\n--- Paso 4: Resumen final ---')
  const { data: finalClientes } = await publicDb.from('clientes').select('id, nombre, atc_email, activo').eq('es_almacen', false).eq('activo', true).order('atc_email, nombre')
  console.log(`\nClientes activos: ${finalClientes.length}`)
  for (const c of finalClientes) {
    const { count } = await publicDb.from('maquinas').select('id', { count: 'exact', head: true }).eq('cliente_id', c.id).eq('activo', true)
    console.log(`  ${c.atc_email} | ${c.nombre} | ${count ?? 0} maquinas`)
  }

  const { data: cobros } = await adminDb.from('cobros_mensuales').select('cliente_id, copias_bn, monto_bn_usd').eq('periodo', PERIODO)
  const totalCopias = (cobros || []).reduce((s, c) => s + (c.copias_bn ?? 0), 0)
  const totalUsd = (cobros || []).reduce((s, c) => s + Number(c.monto_bn_usd ?? 0), 0)
  console.log(`\nFebrero 2026: ${(cobros||[]).length} cobros | ${totalCopias.toLocaleString()} copias | $${totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
