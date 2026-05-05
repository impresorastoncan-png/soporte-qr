/**
 * Carga masiva: contadores de febrero 2026
 * - Parsea todos los Excel de la carpeta "contadores de febrero 2026"
 * - Crea clientes que no existan en public.clientes
 * - Crea máquinas que no existan en public.maquinas
 * - Inserta lecturas en admin.lecturas_contador
 * - Inserta cobros en admin.cobros_mensuales
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
const SKIP_FILES = ['EJEMPLO.xlsx'] // duplicado de Bolip Sede

// ATC mapping basado en la carpeta
const ATC_MAP = { atc1: 'ATC1', atc2: 'ATC2', atc3: 'ATC3' }

// Estadísticas
const stats = {
  archivos: 0,
  sheets: 0,
  clientesCreados: 0,
  clientesExistentes: 0,
  maquinasCreadas: 0,
  maquinasExistentes: 0,
  lecturasInsertadas: 0,
  cobrosInsertados: 0,
  errores: [],
}

function parseSheet(rows) {
  // Buscar fila de cliente (contiene "Cliente ")
  let clienteName = ''
  let contrato = ''
  let costoPorCopia = 0
  let tasaCambio = 0
  let copiadoMinimo = 0

  const equipos = []

  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const joined = (rows[i] || []).map(String).join(' ')
    if (/cliente\s/i.test(joined)) {
      const match = joined.match(/cliente\s+(.+)/i)
      if (match) clienteName = match[1].trim()
    }
    if (/contrato\s+minimo/i.test(joined)) {
      contrato = joined.trim()
    }
  }

  // Buscar header (Item, Modelo...)
  let headerIdx = -1
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const row = rows[i] || []
    if (row.some(c => String(c).toLowerCase() === 'item')) {
      headerIdx = i
      break
    }
  }

  if (headerIdx < 0 || !clienteName) return null

  // Leer equipos
  for (let j = headerIdx + 1; j < rows.length; j++) {
    const r = rows[j] || []
    const item = Number(r[0])
    if (!item || isNaN(item)) break
    equipos.push({
      item,
      modelo: String(r[1] || '').trim(),
      tipo: String(r[2] || 'B/N').trim(),
      serial: String(r[3] || '').trim(),
      ubicacion: String(r[4] || '').trim(),
      lectAnterior: Number(r[5]) || 0,
      lectActual: Number(r[6]) || 0,
      diferencia: Number(r[7]) || 0,
    })
  }

  // Buscar totales
  for (let k = headerIdx + equipos.length + 1; k < Math.min(rows.length, headerIdx + equipos.length + 15); k++) {
    const r = rows[k] || []
    const joined = r.map(String).join(' ').toLowerCase()
    if (joined.includes('copiado minimo global')) {
      copiadoMinimo = Number(r[7]) || 0
    }
    if (joined.includes('copias x') || joined.includes('copias ×')) {
      costoPorCopia = Number(r[6]) || 0
    }
    if (joined.includes('tipo de cambio')) {
      tasaCambio = Number(r[7]) || 0
    }
  }

  const totalCopias = equipos.reduce((s, e) => s + e.diferencia, 0)
  const totalUsd = totalCopias * costoPorCopia

  return { clienteName, contrato, equipos, costoPorCopia, tasaCambio, copiadoMinimo, totalCopias, totalUsd }
}

async function getOrCreateCliente(nombre, atc) {
  // Buscar por nombre similar
  const searchTerms = nombre.split(/[\s,]+/).filter(t => t.length > 2).slice(0, 3)
  let searchQ = searchTerms.map(t => `nombre.ilike.%${t}%`).join(',')

  const { data: existing } = await publicDb
    .from('clientes')
    .select('id, nombre')
    .or(searchQ)
    .eq('es_almacen', false)
    .limit(5)

  // Buscar la mejor coincidencia
  if (existing && existing.length > 0) {
    // Intentar match exacto o parcial
    const exact = existing.find(c => c.nombre.toUpperCase() === nombre.toUpperCase())
    if (exact) {
      stats.clientesExistentes++
      return exact.id
    }
    // Tomar el primero si los terminos de busqueda coinciden
    const nameUp = nombre.toUpperCase()
    const best = existing.find(c => {
      const cUp = c.nombre.toUpperCase()
      return searchTerms.every(t => cUp.includes(t.toUpperCase())) ||
             cUp.includes(nameUp.slice(0, 15))
    })
    if (best) {
      stats.clientesExistentes++
      return best.id
    }
  }

  // Crear cliente nuevo
  const { data: created, error } = await publicDb
    .from('clientes')
    .insert({
      nombre,
      atc_email: atc,
      activo: true,
      es_almacen: false,
    })
    .select('id')
    .single()

  if (error) {
    stats.errores.push(`Error creando cliente "${nombre}": ${error.message}`)
    return null
  }

  stats.clientesCreados++
  console.log(`  + Cliente creado: ${nombre} (${atc})`)
  return created.id
}

async function getOrCreateMaquina(serial, modelo, ubicacion, clienteId) {
  const { data: existing } = await publicDb
    .from('maquinas')
    .select('id')
    .eq('serial', serial)
    .limit(1)
    .single()

  if (existing) {
    stats.maquinasExistentes++
    // Actualizar ubicacion y modelo si cambió
    await publicDb
      .from('maquinas')
      .update({ modelo, ubicacion, activo: true })
      .eq('id', existing.id)
    return existing.id
  }

  // Crear maquina nueva
  const { data: created, error } = await publicDb
    .from('maquinas')
    .insert({
      serial,
      modelo,
      ubicacion,
      cliente_id: clienteId,
      activo: true,
    })
    .select('id')
    .single()

  if (error) {
    stats.errores.push(`Error creando maquina "${serial}": ${error.message}`)
    return null
  }

  stats.maquinasCreadas++
  return created.id
}

async function processFile(filePath, atc) {
  const buf = readFileSync(filePath)
  const wb = XLSX.read(buf, { type: 'buffer' })

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    const parsed = parseSheet(rows)
    if (!parsed || parsed.equipos.length === 0) {
      console.log(`  Skipping sheet "${sheetName}" (no data)`)
      continue
    }

    stats.sheets++
    console.log(`  Sheet: ${sheetName} | ${parsed.clienteName} | ${parsed.equipos.length} equipos | ${parsed.totalCopias} copias | $${parsed.totalUsd.toFixed(2)}`)

    // 1. Get or create cliente
    const clienteId = await getOrCreateCliente(parsed.clienteName, atc)
    if (!clienteId) continue

    // 2. Update copiado minimo y tarifa si tiene valores
    if (parsed.copiadoMinimo > 0 || parsed.costoPorCopia > 0) {
      await publicDb
        .from('clientes')
        .update({
          copiado_minimo: parsed.copiadoMinimo,
          tarifa_bn_usd: parsed.costoPorCopia,
        })
        .eq('id', clienteId)
    }

    // 3. Process equipos: create machines + insert lecturas
    for (const eq of parsed.equipos) {
      if (!eq.serial) continue

      const maquinaId = await getOrCreateMaquina(eq.serial, eq.modelo, eq.ubicacion, clienteId)
      if (!maquinaId) continue

      // Insert lectura
      const { error: lectErr } = await adminDb.from('lecturas_contador').insert({
        equipo_id: maquinaId,
        fecha: '2026-02-28',
        contador_bn: eq.tipo !== 'C' && eq.tipo !== 'COLOR' ? eq.lectActual : 0,
        contador_color: eq.tipo === 'C' || eq.tipo === 'COLOR' ? eq.lectActual : 0,
        copias_periodo_bn: eq.tipo !== 'C' && eq.tipo !== 'COLOR' ? eq.diferencia : 0,
        copias_periodo_color: eq.tipo === 'C' || eq.tipo === 'COLOR' ? eq.diferencia : 0,
      })

      if (lectErr) {
        stats.errores.push(`Lectura ${eq.serial}: ${lectErr.message}`)
      } else {
        stats.lecturasInsertadas++
      }
    }

    // 4. Upsert cobro mensual
    const aplicaMinimo = parsed.copiadoMinimo > 0 && parsed.totalCopias < parsed.copiadoMinimo
    const { error: cobroErr } = await adminDb.from('cobros_mensuales').upsert({
      cliente_id: clienteId,
      periodo: PERIODO,
      copias_bn: parsed.totalCopias,
      copias_color: 0,
      monto_bn_usd: Number(parsed.totalUsd.toFixed(2)),
      monto_color_usd: 0,
      tasa_bcv: parsed.tasaCambio || 405.35,
      estado_relacion: 'proforma',
      aplica_minimo: aplicaMinimo,
      monto_minimo_usd: 0,
    }, { onConflict: 'cliente_id,periodo', ignoreDuplicates: false })

    if (cobroErr) {
      // Si ya existe, sumar las copias (cliente con múltiples sheets/contratos)
      const { data: existing } = await adminDb
        .from('cobros_mensuales')
        .select('id, copias_bn, monto_bn_usd')
        .eq('cliente_id', clienteId)
        .eq('periodo', PERIODO)
        .single()

      if (existing) {
        await adminDb.from('cobros_mensuales').update({
          copias_bn: (existing.copias_bn ?? 0) + parsed.totalCopias,
          monto_bn_usd: Number(((Number(existing.monto_bn_usd) || 0) + parsed.totalUsd).toFixed(2)),
          tasa_bcv: parsed.tasaCambio || 405.35,
        }).eq('id', existing.id)
      } else {
        stats.errores.push(`Cobro ${parsed.clienteName}: ${cobroErr.message}`)
      }
    } else {
      stats.cobrosInsertados++
    }
  }
}

async function main() {
  console.log('=== CARGA MASIVA: Contadores Febrero 2026 ===\n')

  for (const atcDir of ['atc1', 'atc2', 'atc3']) {
    const dir = join(BASE, atcDir)
    const files = readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$') && !SKIP_FILES.includes(f))

    console.log(`\n--- ${ATC_MAP[atcDir]} (${files.length} archivos) ---`)

    for (const file of files) {
      const filePath = join(dir, file)
      console.log(`\nArchivo: ${file}`)
      stats.archivos++

      try {
        await processFile(filePath, ATC_MAP[atcDir])
      } catch (err) {
        stats.errores.push(`${file}: ${err.message}`)
        console.error(`  ERROR: ${err.message}`)
      }
    }
  }

  console.log('\n\n=== RESUMEN ===')
  console.log(`Archivos procesados: ${stats.archivos}`)
  console.log(`Sheets procesados: ${stats.sheets}`)
  console.log(`Clientes creados: ${stats.clientesCreados}`)
  console.log(`Clientes existentes: ${stats.clientesExistentes}`)
  console.log(`Maquinas creadas: ${stats.maquinasCreadas}`)
  console.log(`Maquinas existentes (actualizadas): ${stats.maquinasExistentes}`)
  console.log(`Lecturas insertadas: ${stats.lecturasInsertadas}`)
  console.log(`Cobros insertados: ${stats.cobrosInsertados}`)

  if (stats.errores.length > 0) {
    console.log(`\nErrores (${stats.errores.length}):`)
    stats.errores.forEach(e => console.log(`  - ${e}`))
  }
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
