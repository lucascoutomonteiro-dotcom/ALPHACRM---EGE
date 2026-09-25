import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { db } from '@/lib/db'
import { accounts } from '@/lib/schema'

const sqlRaw = neon(process.env.DATABASE_URL!)
export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, unknown> = {}

  // Verifica se empresas existe via raw SQL
  try {
    const rows = await sqlRaw`SELECT id, nome FROM empresas LIMIT 1`
    results.empresas_raw = { ok: true, count: rows.length }
  } catch (err) {
    results.empresas_raw_error = String(err)
  }

  // Verifica via Drizzle (accounts -> empresas)
  try {
    const rows = await db.select({ id: accounts.id, nome: accounts.nome }).from(accounts).limit(1)
    results.accounts_drizzle = { ok: true, count: rows.length }
  } catch (err) {
    results.accounts_drizzle_error = String(err)
  }

  return NextResponse.json(results)
}
