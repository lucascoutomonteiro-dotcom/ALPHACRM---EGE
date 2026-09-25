import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())

  // Interacoes com Proposta ou Reunião do ano
  const propostaReuniao = await sql`
    SELECT i.id, i.tipo, i.data_interacao,
           (i.data_interacao AT TIME ZONE 'America/Sao_Paulo')::date AS data_br,
           i.gerou_oportunidade, i.servico_oportunidade,
           c.nome AS contato, c.empresa
    FROM interacoes i
    LEFT JOIN contatos c ON i.contato_id = c.id
    WHERE i.tipo IN ('Proposta', 'Reunião')
      AND EXTRACT(YEAR FROM i.data_interacao) = 2026
    ORDER BY i.data_interacao DESC
    LIMIT 20
  `

  // Contatos com gerouOportunidade=true
  const contatosOport = await sql`
    SELECT id, nome, empresa, gerou_oportunidade, servico_oportunidade, updated_at,
           (updated_at AT TIME ZONE 'America/Sao_Paulo')::date AS data_br
    FROM contatos
    WHERE gerou_oportunidade = true
    LIMIT 20
  `

  // Contagem geral de interacoes por tipo no ano
  const porTipo = await sql`
    SELECT tipo, COUNT(*) as total
    FROM interacoes
    WHERE EXTRACT(YEAR FROM data_interacao) = 2026
    GROUP BY tipo
    ORDER BY total DESC
  `

  return NextResponse.json({ hojeStr: hoje, propostaReuniao, contatosOport, porTipo })
}
