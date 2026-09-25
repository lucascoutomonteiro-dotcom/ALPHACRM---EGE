import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`
    CREATE TABLE IF NOT EXISTS key_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      cnpj TEXT,
      segmento TEXT,
      cidade TEXT,
      estado TEXT,
      site TEXT,
      observacoes TEXT,
      status TEXT NOT NULL DEFAULT 'Em Desenvolvimento',
      potencial_estimado NUMERIC(12,2),
      servicos_contratados TEXT[],
      servicos_potencial TEXT[],
      plano_30d TEXT,
      plano_90d TEXT,
      barreiras TEXT,
      estrategia TEXT,
      plano_atualizado_em TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS ka_stakeholders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key_account_id UUID NOT NULL REFERENCES key_accounts(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      cargo TEXT,
      departamento TEXT,
      email TEXT,
      telefone TEXT,
      linkedin TEXT,
      nivel_poder TEXT NOT NULL,
      posicionamento TEXT NOT NULL,
      nivel_relacionamento TEXT,
      ultima_interacao DATE,
      proxima_acao TEXT,
      observacoes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `

  await sql`
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
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `

  return NextResponse.json({ ok: true, message: 'Tabelas key_accounts, ka_stakeholders, ka_visitas criadas com sucesso' })
}
