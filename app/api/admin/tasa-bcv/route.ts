import { NextResponse } from 'next/server'
import { createAdminSSRClient } from '@/lib/admin/supabase-admin'

const DOLARAPI_USD = 'https://ve.dolarapi.com/v1/dolares/oficial'
const DOLARAPI_EUR = 'https://ve.dolarapi.com/v1/euros/oficial'

/** GET — devuelve la tasa más reciente de admin.tasas_cambio */
export async function GET() {
  try {
    const supabase = await createAdminSSRClient()
    const { data, error } = await supabase
      .from('tasas_cambio')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { bs_usd: 0, bs_eur: 0, fecha: null, fuente: null, stale: true },
        { status: 200 }
      )
    }

    return NextResponse.json({ ...data, stale: false })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/** POST — consulta DolarAPI, guarda en admin.tasas_cambio, retorna valores frescos */
export async function POST() {
  try {
    const [usdRes, eurRes] = await Promise.all([
      fetch(DOLARAPI_USD, { next: { revalidate: 0 } }),
      fetch(DOLARAPI_EUR, { next: { revalidate: 0 } }),
    ])

    if (!usdRes.ok || !eurRes.ok) {
      // Fallback: retornar última tasa guardada
      return fallbackLastRate()
    }

    const usd = await usdRes.json() as { promedio: number; fechaActualizacion: string }
    const eur = await eurRes.json() as { promedio: number; fechaActualizacion: string }

    const bs_usd = usd.promedio
    const bs_eur = eur.promedio
    const fecha = usd.fechaActualizacion
      ? usd.fechaActualizacion.slice(0, 10)
      : new Date().toISOString().slice(0, 10)

    // Guardar en DB
    const supabase = await createAdminSSRClient()
    await supabase
      .from('tasas_cambio')
      .upsert(
        { fecha, bs_usd, bs_eur, fuente: 'BCV' },
        { onConflict: 'fecha' }
      )

    return NextResponse.json({ fecha, bs_usd, bs_eur, fuente: 'BCV', stale: false })
  } catch {
    return fallbackLastRate()
  }
}

async function fallbackLastRate() {
  try {
    const supabase = await createAdminSSRClient()
    const { data } = await supabase
      .from('tasas_cambio')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      return NextResponse.json({ ...data, stale: true })
    }
  } catch { /* ignore */ }

  return NextResponse.json(
    { bs_usd: 0, bs_eur: 0, fecha: null, fuente: null, stale: true },
    { status: 200 }
  )
}
