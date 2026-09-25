import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  // Atualiza o updated_at do SAINT-GOBAIN MAUÁ para 10/09/2026 12:00 Brasília = 15:00 UTC
  const result = await sql`
    UPDATE contatos
    SET updated_at = '2026-09-10T15:00:00Z'
    WHERE id = 'c22358e2-f408-4251-8846-3d7dcde7c419'
    RETURNING id, nome, empresa, updated_at
  `

  return NextResponse.json({ updated: result })
}
