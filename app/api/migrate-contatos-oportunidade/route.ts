import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`
    ALTER TABLE contatos
    ADD COLUMN IF NOT EXISTS gerou_oportunidade boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS servico_oportunidade text
  `

  return NextResponse.json({ ok: true, message: 'Colunas gerou_oportunidade e servico_oportunidade adicionadas em contatos' })
}
