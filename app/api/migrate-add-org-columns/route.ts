import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = 'force-dynamic'

// Adiciona organization_id a todas as tabelas que precisam — seguro rodar múltiplas vezes
export async function GET() {
  const log: string[] = []

  try {
    // Busca org padrão
    const [org] = await sql`SELECT id FROM organizations WHERE slug = 'ege-solucoes' LIMIT 1`
    if (!org) {
      return NextResponse.json({ ok: false, error: 'Execute /api/migrate-multitenant primeiro.' }, { status: 400 })
    }
    const orgId = org.id as string
    log.push(`✅ Organização: ${orgId}`)

    const tabelas = [
      'contatos', 'clientes_ege', 'oportunidades_bc', 'metas',
      'crm_colunas', 'propostas', 'key_accounts', 'planos_acao', 'interacoes_ege',
    ]

    for (const tabela of tabelas) {
      try {
        await sql.unsafe(`ALTER TABLE ${tabela} ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`)
        await sql.unsafe(`UPDATE ${tabela} SET organization_id = '${orgId}' WHERE organization_id IS NULL`)
        log.push(`✅ ${tabela}.organization_id OK`)
      } catch (err) {
        log.push(`⚠️  ${tabela}: ${String(err)}`)
      }
    }

    return NextResponse.json({ ok: true, log })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), log }, { status: 500 })
  }
}
