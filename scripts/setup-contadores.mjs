// Script temporal para configurar usuario gerencia ATC y migraciones
const SUPABASE_URL = 'https://oesfledeibzjyodyimgt.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Falta SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

async function main() {
  // 1. Crear usuario auth gerenciatc@toncandigital.com
  console.log('--- Creando usuario auth gerenciatc@toncandigital.com ---')
  const createUserRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: 'gerenciatc@toncandigital.com',
      password: 'ToncanATC2026!',
      email_confirm: true,
    }),
  })
  const userData = await createUserRes.json()

  if (createUserRes.ok) {
    console.log('Usuario creado:', userData.id)
  } else if (userData.msg?.includes('already') || userData.message?.includes('already') || JSON.stringify(userData).includes('already')) {
    console.log('Usuario ya existe, buscando...')
    // Buscar usuario existente
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, {
      headers,
    })
    const listData = await listRes.json()
    const existing = listData.users?.find(u => u.email === 'gerenciatc@toncandigital.com')
    if (existing) {
      userData.id = existing.id
      console.log('Usuario encontrado:', userData.id)
    } else {
      console.error('No se pudo encontrar el usuario existente')
      console.error(JSON.stringify(userData, null, 2))
      process.exit(1)
    }
  } else {
    console.error('Error creando usuario:', JSON.stringify(userData, null, 2))
    process.exit(1)
  }

  const userId = userData.id

  // 2. Insertar profile en admin.profiles
  console.log('\n--- Insertando profile admin.profiles ---')
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'return=representation',
      'Accept-Profile': 'admin',
      'Content-Profile': 'admin',
    },
    body: JSON.stringify({
      user_id: userId,
      nombre: 'Gerencia ATC',
      rol: 'admin',
      activo: true,
    }),
  })

  if (profileRes.ok) {
    const profileData = await profileRes.json()
    console.log('Profile creado:', JSON.stringify(profileData, null, 2))
  } else {
    const err = await profileRes.text()
    if (err.includes('duplicate') || err.includes('already exists') || err.includes('unique')) {
      console.log('Profile ya existe, OK.')
    } else {
      console.error('Error insertando profile:', profileRes.status, err)
    }
  }

  // 3. Ejecutar migracion SQL via pg_net o rpc (ALTER TABLE)
  // No se puede ejecutar ALTER TABLE via REST API directamente.
  // Intentaremos via la API SQL de Supabase Management API
  console.log('\n--- Ejecutando migracion de schema (ALTER TABLE) ---')

  // Alternativa: usar la conexion directa si supabase CLI esta disponible
  // Por ahora usamos el endpoint de SQL si esta disponible
  const migrationSQL = `
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

  // Intentar via rpc si hay una funcion exec_sql (poco probable)
  // La alternativa real es el Supabase Management API
  const ref = 'oesfledeibzjyodyimgt'

  // Intentar Management API (requiere token de servicio o personal access token)
  // Como no tenemos PAT, intentamos con pg endpoint experimental
  const sqlRes = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: migrationSQL }),
  })

  if (sqlRes.ok) {
    console.log('Migracion SQL ejecutada correctamente!')
  } else {
    console.log('No se pudo ejecutar la migracion SQL via API (esto es normal).')
    console.log('Status:', sqlRes.status)
    console.log('\n========================================')
    console.log('ACCION REQUERIDA: Ejecuta este SQL en Supabase Dashboard > SQL Editor:')
    console.log('========================================')
    console.log(migrationSQL)
    console.log('========================================')
  }

  console.log('\n--- RESUMEN ---')
  console.log(`Usuario: gerenciatc@toncandigital.com`)
  console.log(`Password: ToncanATC2026!`)
  console.log(`User ID: ${userId}`)
  console.log(`Rol: admin`)
  console.log('Recuerda cambiar la contrasena despues del primer login.')
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
