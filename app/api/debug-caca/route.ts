import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  const r = await sql`
    SELECT cliente, caca_vaz_deteccao, caca_vaz_reparo
    FROM clientes_ege
    ORDER BY cliente
  `
  const contagem: Record<string, number> = {}
  for (const row of r) {
    const v = (row.caca_vaz_deteccao as string) || 'VAZIO'
    contagem[v] = (contagem[v] || 0) + 1
  }
  return NextResponse.json({ contagem, amostra: r.slice(0, 20) })
}
