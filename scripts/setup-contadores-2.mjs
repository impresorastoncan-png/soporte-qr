// Script para insertar profile y ejecutar migracion via supabase-js con service_role
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oesfledeibzjyodyimgt.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'admin' },
  auth: { persistSession: false },
})

const supabasePublic = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function main() {
  const userId = '9eebb336-817a-4072-80e3-f85fd085f533'

  // 1. Insertar profile
  console.log('--- Insertando profile admin.profiles ---')
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      nombre: 'Gerencia ATC',
      rol: 'admin',
      activo: true,
    }, { onConflict: 'user_id' })
    .select()

  if (profileErr) {
    console.error('Error profile:', profileErr.message)
  } else {
    console.log('Profile creado/actualizado:', JSON.stringify(profile, null, 2))
  }

  // 2. Ejecutar ALTER TABLE via rpc sql (si existe la funcion)
  // Intentar agregar columnas via SQL directo no es posible con supabase-js
  // Pero podemos verificar si las columnas ya existen intentando leerlas
  console.log('\n--- Verificando columnas en admin.clientes ---')
  const { data: clienteTest, error: clienteErr } = await supabase
    .from('clientes')
    .select('id, copiado_minimo, tarifa_fija_usd')
    .limit(1)

  if (clienteErr && clienteErr.message.includes('copiado_minimo')) {
    console.log('Columnas NO existen aun. Necesitas ejecutar el SQL de migracion.')
    console.log('Ve a Supabase Dashboard > SQL Editor y ejecuta el contenido de:')
    console.log('supabase/migrations/20260504000001_contadores_schema.sql')
  } else if (clienteErr) {
    console.log('Error consultando clientes:', clienteErr.message)
  } else {
    console.log('Columnas ya existen! Datos:', JSON.stringify(clienteTest, null, 2))
  }

  console.log('\n--- Verificando columnas en admin.cobros_mensuales ---')
  const { data: cobroTest, error: cobroErr } = await supabase
    .from('cobros_mensuales')
    .select('id, estado_relacion, aplica_minimo, monto_minimo_usd')
    .limit(1)

  if (cobroErr && (cobroErr.message.includes('estado_relacion') || cobroErr.message.includes('aplica_minimo'))) {
    console.log('Columnas NO existen aun en cobros_mensuales.')
  } else if (cobroErr) {
    console.log('Error consultando cobros:', cobroErr.message)
  } else {
    console.log('Columnas ya existen! OK')
  }

  console.log('\n--- RESUMEN ---')
  console.log('Usuario auth: gerenciatc@toncandigital.com (ID: ' + userId + ')')
  console.log('Profile: admin.profiles insertado')
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
