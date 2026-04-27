import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json() as { pin?: string }

    if (!pin) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const correctPin = process.env.ADMIN_REPORT_PIN
    if (!correctPin) {
      // Si no hay PIN configurado, dejar pasar (desarrollo)
      return NextResponse.json({ valid: true })
    }

    return NextResponse.json({ valid: pin === correctPin })
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
