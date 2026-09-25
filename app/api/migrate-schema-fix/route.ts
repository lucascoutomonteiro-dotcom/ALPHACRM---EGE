import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = 'force-dynamic'

// Adiciona todas as colunas que podem estar faltando após a atualização do schema
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
    // ── crm_colunas ──────────────────────────────────────────────────────────
    await run('crm_colunas.sistema', `ALTER TABLE crm_colunas ADD COLUMN IF NOT EXISTS sistema BOOLEAN DEFAULT false`)
    await run('crm_colunas.created_at', `ALTER TABLE crm_colunas ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`)

    // ── contatos ─────────────────────────────────────────────────────────────
    await run('contatos.responsavel_id', `ALTER TABLE contatos ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES users(id)`)
    await run('contatos.tipo_cliente', `ALTER TABLE contatos ADD COLUMN IF NOT EXISTS tipo_cliente TEXT`)
    await run('contatos.gerou_oportunidade', `ALTER TABLE contatos ADD COLUMN IF NOT EXISTS gerou_oportunidade BOOLEAN DEFAULT false`)
    await run('contatos.servico_oportunidade', `ALTER TABLE contatos ADD COLUMN IF NOT EXISTS servico_oportunidade TEXT`)
    await run('contatos.updated_at', `ALTER TABLE contatos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()`)

    // ── interacoes ────────────────────────────────────────────────────────────
    await run('interacoes.gerou_oportunidade', `ALTER TABLE interacoes ADD COLUMN IF NOT EXISTS gerou_oportunidade BOOLEAN DEFAULT false`)
    await run('interacoes.servico_oportunidade', `ALTER TABLE interacoes ADD COLUMN IF NOT EXISTS servico_oportunidade TEXT`)

    // ── crm_eventos — criar se não existir ────────────────────────────────────
    await run('CREATE crm_eventos', `
      CREATE TABLE IF NOT EXISTS crm_eventos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contato_id UUID REFERENCES contatos(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (contato_id, tipo, mes, ano)
      )
    `)

    // ── key_accounts — criar colunas novas se não existirem ──────────────────
    await run('key_accounts.health_score', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS health_score INTEGER`)
    await run('key_accounts.health_status', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS health_status TEXT`)
    await run('key_accounts.proxima_acao', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS proxima_acao TEXT`)
    await run('key_accounts.proxima_acao_data', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS proxima_acao_data DATE`)
    await run('key_accounts.proxima_acao_responsavel', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS proxima_acao_responsavel TEXT`)
    await run('key_accounts.plano_30d', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS plano_30d TEXT`)
    await run('key_accounts.plano_90d', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS plano_90d TEXT`)
    await run('key_accounts.barreiras', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS barreiras TEXT`)
    await run('key_accounts.estrategia', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS estrategia TEXT`)
    await run('key_accounts.estrategia_expansao', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS estrategia_expansao TEXT`)
    await run('key_accounts.plano_atualizado_em', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS plano_atualizado_em TIMESTAMPTZ`)
    await run('key_accounts.created_by', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id)`)
    await run('key_accounts.updated_by', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id)`)
    await run('key_accounts.archived_at', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ`)
    await run('key_accounts.updated_at', `ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()`)

    // ── ka_stakeholders — criar se não existir ────────────────────────────────
    await run('CREATE ka_stakeholders', `
      CREATE TABLE IF NOT EXISTS ka_stakeholders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key_account_id UUID NOT NULL REFERENCES key_accounts(id) ON DELETE CASCADE,
        contato_id UUID REFERENCES contatos(id),
        nome TEXT NOT NULL,
        cargo TEXT,
        departamento TEXT,
        email TEXT,
        telefone TEXT,
        linkedin TEXT,
        nivel_poder TEXT NOT NULL DEFAULT 'INFLUENCIADOR_TECNICO',
        posicionamento TEXT NOT NULL DEFAULT 'NEUTRO',
        nivel_relacionamento TEXT DEFAULT 'FRIO',
        qualificacao_status TEXT NOT NULL DEFAULT 'PENDENTE',
        ultima_interacao DATE,
        proxima_acao TEXT,
        observacoes TEXT,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)

    // ── ka_visitas — criar se não existir ─────────────────────────────────────
    await run('CREATE ka_visitas', `
      CREATE TABLE IF NOT EXISTS ka_visitas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key_account_id UUID NOT NULL REFERENCES key_accounts(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        tipo TEXT NOT NULL,
        participantes TEXT[],
        objetivo TEXT,
        resultado TEXT,
        proximos_passos TEXT,
        nivel_avanco TEXT,
        progresso_nivel TEXT,
        criado_por UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `)

    // ── ka_penetracao — criar se não existir ──────────────────────────────────
    await run('CREATE ka_penetracao', `
      CREATE TABLE IF NOT EXISTS ka_penetracao (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key_account_id UUID NOT NULL REFERENCES key_accounts(id) ON DELETE CASCADE,
        departamento TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Não iniciado',
        responsavel TEXT,
        prazo DATE,
        observacoes TEXT,
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)

    return NextResponse.json({ ok: true, total: log.length, log })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), log }, { status: 500 })
  }
}
