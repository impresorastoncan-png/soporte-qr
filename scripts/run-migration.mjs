// Intentar ejecutar SQL en Supabase por distintas vias
const SUPABASE_URL = 'https://oesfledeibzjyodyimgt.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const REF = 'oesfledeibzjyodyimgt'

const SQL = `
INSERT INTO admin.profiles (user_id, nombre, rol, activo)
VALUES ('9eebb336-817a-4072-80e3-f85fd085f533', 'Gerencia ATC', 'admin', true)
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE admin.clientes
  ADD COLUMN IF NOT EXISTS copiado_minimo integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tarifa_fija_usd numeric(10,4) DEFAULT 0;

ALTER TABLE admin.cobros_mensuales
  ADD COLUMN IF NOT EXISTS estado_relacion text DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS aplica_minimo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS monto_minimo_usd numeric(12,2) DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cobros_mensuales_estado_relacion_check'
  ) THEN
    ALTER TABLE admin.cobros_mensuales
      ADD CONSTRAINT cobros_mensuales_estado_relacion_check
      CHECK (estado_relacion IN ('pendiente','proforma','listo'));
  END IF;
END
$$;
`

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

async function tryEndpoint(name, url, body) {
  try {
    console.log(`\nIntentando: ${name}`)
    console.log(`  URL: ${url}`)
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const text = await res.text()
    console.log(`  Status: ${res.status}`)
    if (res.ok) {
      console.log(`  EXITO!`)
      console.log(`  Respuesta: ${text.slice(0, 500)}`)
      return true
    } else {
      console.log(`  Error: ${text.slice(0, 300)}`)
      return false
    }
  } catch (err) {
    console.log(`  Excepcion: ${err.message}`)
    return false
  }
}

async function main() {
  // Intento 1: /pg endpoint (Supabase SQL API experimental)
  let ok = await tryEndpoint(
    'Supabase /pg/query',
    `${SUPABASE_URL}/pg/query`,
    { query: SQL }
  )
  if (ok) return

  // Intento 2: /rest/v1/rpc con funcion exec_sql (si existe)
  ok = await tryEndpoint(
    'RPC exec_sql',
    `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    { sql: SQL }
  )
  if (ok) return

  // Intento 3: /sql endpoint
  ok = await tryEndpoint(
    'Supabase /sql',
    `${SUPABASE_URL}/sql`,
    { query: SQL }
  )
  if (ok) return

  // Intento 4: Management API
  ok = await tryEndpoint(
    'Management API query',
    `https://api.supabase.com/v1/projects/${REF}/database/query`,
    { query: SQL }
  )
  if (ok) return

  // Intento 5: pg-meta endpoint
  ok = await tryEndpoint(
    'pg-meta query',
    `${SUPABASE_URL}/pg-meta/default/query`,
    { query: SQL }
  )
  if (ok) return

  // Intento 6: Supabase connect endpoint
  for (const path of ['/database/query', '/graphql/v1', '/pg/sql']) {
    ok = await tryEndpoint(
      `Endpoint ${path}`,
      `${SUPABASE_URL}${path}`,
      { query: SQL }
    )
    if (ok) return
  }

  console.log('\n========================================')
  console.log('No se pudo ejecutar SQL automaticamente.')
  console.log('Necesitas ejecutarlo manualmente en Supabase Dashboard > SQL Editor.')
  console.log('========================================')
}

main()
