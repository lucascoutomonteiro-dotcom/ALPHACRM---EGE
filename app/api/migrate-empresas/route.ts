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
      log.push(`⚠️  ${desc}: ${String(err).slice(0, 200)}`)
    }
  }

  // Criar tabela empresas (substitui accounts com nome correto)
  await run('CREATE empresas', `
    CREATE TABLE IF NOT EXISTS empresas (
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

  await run('idx empresas.organization_id', `CREATE INDEX IF NOT EXISTS idx_empresas_org ON empresas(organization_id)`)
  await run('idx empresas.responsavel_id', `CREATE INDEX IF NOT EXISTS idx_empresas_resp ON empresas(responsavel_id)`)
  await run('idx empresas.status', `CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status)`)

  // Migrar dados de accounts para empresas (caso haja dados inseridos)
  await run('MIGRATE dados accounts->empresas', `
    INSERT INTO empresas (id, organization_id, nome, cnpj, segmento, cidade, estado, website, telefone, email, responsavel_id, status, potencial_estimado, origem, observacoes, created_at, updated_at)
    SELECT id, organization_id, nome, cnpj, segmento, cidade, estado, website, telefone, email, responsavel_id, status, potencial_estimado, origem, observacoes, created_at, updated_at
    FROM accounts
    WHERE nome IS NOT NULL
    ON CONFLICT (id) DO NOTHING
  `)

  // Adicionar empresa_id em contatos (substitui account_id para evitar FK quebrado)
  await run('contatos.empresa_id', `ALTER TABLE contatos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id)`)
  await run('idx contatos.empresa_id', `CREATE INDEX IF NOT EXISTS idx_contatos_empresa ON contatos(empresa_id)`)

  return NextResponse.json({ ok: true, total: log.length, log })
}
