import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
export const dynamic = 'force-dynamic'

export async function GET() {
  const log: string[] = []

  async function run(desc: string, query: string) {
    try {
      await sql.unsafe(query)
      log.push(`✅ ${desc}`)
    } catch (err) {
      log.push(`⚠️  ${desc}: ${String(err).slice(0, 120)}`)
    }
  }

  try {
    // ── Criar tabela accounts ─────────────────────────────────────────────────
    await run('CREATE accounts', `
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id),
        nome TEXT NOT NULL,
        cnpj TEXT,
        segmento TEXT,
        cidade TEXT,
        estado TEXT,
        website TEXT,
        telefone TEXT,
        email TEXT,
        responsavel_id UUID REFERENCES users(id),
        status TEXT DEFAULT 'Ativo',
        potencial_estimado NUMERIC(14,2),
        origem TEXT,
        observacoes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)

    // ── Índices ───────────────────────────────────────────────────────────────
    await run('idx accounts.organization_id', `CREATE INDEX IF NOT EXISTS idx_accounts_org ON accounts(organization_id)`)
    await run('idx accounts.responsavel_id', `CREATE INDEX IF NOT EXISTS idx_accounts_resp ON accounts(responsavel_id)`)
    await run('idx accounts.status', `CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)`)

    // ── Adicionar account_id em contatos ──────────────────────────────────────
    await run('contatos.account_id', `ALTER TABLE contatos ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id)`)
    await run('idx contatos.account_id', `CREATE INDEX IF NOT EXISTS idx_contatos_account ON contatos(account_id)`)

    return NextResponse.json({ ok: true, total: log.length, log })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), log }, { status: 500 })
  }
}
