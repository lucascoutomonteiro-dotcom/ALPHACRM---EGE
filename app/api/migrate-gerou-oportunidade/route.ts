import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  try {
    await sql`
      ALTER TABLE interacoes_ege
      ADD COLUMN IF NOT EXISTS gerou_oportunidade boolean NOT NULL DEFAULT false
    `
    return NextResponse.json({ ok: true, message: 'Coluna gerou_oportunidade adicionada.' })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
