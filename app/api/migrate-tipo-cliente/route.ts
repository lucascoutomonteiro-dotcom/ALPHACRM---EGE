import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  await sql`ALTER TABLE contatos ADD COLUMN IF NOT EXISTS tipo_cliente text`
  return NextResponse.json({ ok: true, message: 'Coluna tipo_cliente adicionada em contatos' })
}
