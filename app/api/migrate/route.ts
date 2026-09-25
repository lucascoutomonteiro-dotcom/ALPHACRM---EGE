import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS interacoes_ege (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_ege_id UUID REFERENCES clientes_ege(id) ON DELETE CASCADE,
        data_interacao TIMESTAMPTZ DEFAULT now(),
        tipo TEXT NOT NULL,
        descricao TEXT,
        proximo_passo TEXT,
        data_proximo_passo DATE,
        usuario_id UUID REFERENCES users(id)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS propostas (
        id TEXT PRIMARY KEY,
        nome_proposta TEXT,
        pilar TEXT,
        cliente TEXT,
        localidade TEXT,
        situacao TEXT,
        temperatura TEXT,
        responsavel TEXT,
        fonte TEXT,
        contato TEXT,
        valor_pc NUMERIC(14,2),
        data_criacao DATE,
        prazo_envio DATE,
        data_enviada DATE,
        prazo_follow_up DATE,
        fup_atrasado BOOLEAN DEFAULT false,
        ultima_acao_fup TEXT,
        fups_realizados INTEGER DEFAULT 0,
        previsao_fechamento DATE,
        nivel_dor TEXT,
        score INTEGER,
        escopo TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `

    return NextResponse.json({ ok: true, message: 'Tabelas criadas com sucesso.' })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
