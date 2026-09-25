import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  const log: string[] = []

  try {
    // ── UPDATES: serviços FEITO que faltaram na migração original ────────────

    // AAK: nr10_spda → FEITO (vendido: cerca elétrica / NR-10)
    await sql`UPDATE clientes_ege SET nr10_spda = 'FEITO', updated_at = now()
              WHERE UPPER(cliente) = 'AAK' AND (nr10_spda IS NULL OR nr10_spda = 'VAZIO' OR nr10_spda = 'CROSS' OR nr10_spda = 'UPSELL')`
    log.push('✓ AAK: nr10Spda → FEITO')

    // ANDRITZ: nr12_manuais → FEITO (manuais NR-12 aceito)
    await sql`UPDATE clientes_ege SET nr12_manuais = 'FEITO', updated_at = now()
              WHERE UPPER(cliente) = 'ANDRITZ' AND (nr12_manuais IS NULL OR nr12_manuais = 'VAZIO' OR nr12_manuais = 'CROSS' OR nr12_manuais = 'UPSELL')`
    log.push('✓ ANDRITZ: nr12Manuais → FEITO')

    // BRF: nr10_pie_laudo → FEITO (laudo NR-12 aceito, enquadra em NR-10 Laudo)
    await sql`UPDATE clientes_ege SET nr10_pie_laudo = 'FEITO', updated_at = now()
              WHERE UPPER(cliente) = 'BRF' AND (nr10_pie_laudo IS NULL OR nr10_pie_laudo = 'VAZIO' OR nr10_pie_laudo = 'CROSS' OR nr10_pie_laudo = 'UPSELL')`
    log.push('✓ BRF: nr10PieLaudo → FEITO')

    // CBC: nr12_adequacao CROSS → FEITO (adequação aceita)
    await sql`UPDATE clientes_ege SET nr12_adequacao = 'FEITO', updated_at = now()
              WHERE UPPER(cliente) = 'CBC' AND (nr12_adequacao IS NULL OR nr12_adequacao = 'VAZIO' OR nr12_adequacao = 'CROSS' OR nr12_adequacao = 'UPSELL')`
    log.push('✓ CBC: nr12Adequacao → FEITO')

    // CONDAT: terceirizacao_hh → FEITO (inspeção termogrÁfica já era FEITO, HH também foi aceito)
    await sql`UPDATE clientes_ege SET terceirizacao_hh = 'FEITO', updated_at = now()
              WHERE UPPER(cliente) = 'CONDAT' AND (terceirizacao_hh IS NULL OR terceirizacao_hh = 'VAZIO' OR terceirizacao_hh = 'CROSS' OR terceirizacao_hh = 'UPSELL')`
    log.push('✓ CONDAT: terceirizacaoHh → FEITO')

    // VALEO: nr12_manuais → FEITO (manuais aceitos em múltiplas propostas)
    await sql`UPDATE clientes_ege SET nr12_manuais = 'FEITO', updated_at = now()
              WHERE UPPER(cliente) = 'VALEO' AND (nr12_manuais IS NULL OR nr12_manuais = 'VAZIO' OR nr12_manuais = 'CROSS' OR nr12_manuais = 'UPSELL')`
    log.push('✓ VALEO: nr12Manuais → FEITO')

    // ── INSERTS: clientes novos com vendas aceitas ────────────────────────────

    // IBEPLAS - Arujá-SP
    const ibeplas = await sql`SELECT id FROM clientes_ege WHERE UPPER(cliente) = 'IBEPLAS' LIMIT 1`
    if (ibeplas.length > 0) {
      log.push('— IBEPLAS: já existe')
    } else {
      await sql`INSERT INTO clientes_ege (cliente, local, nr12_adequacao, caca_vaz_reparo, classificacao, status_acao, updated_at)
                VALUES ('IBEPLAS', 'ARUJA - SP', 'FEITO', 'VAZIO', 'PRATA', 'A iniciar', now())`
      log.push('✓ Inserido: IBEPLAS (Arujá-SP) — nr12Adequacao=FEITO')
    }

    // INRODA - Avaré-SP
    const inroda = await sql`SELECT id FROM clientes_ege WHERE UPPER(cliente) = 'INRODA' LIMIT 1`
    if (inroda.length > 0) {
      log.push('— INRODA: já existe')
    } else {
      await sql`INSERT INTO clientes_ege (cliente, local, nr12_adequacao, caca_vaz_reparo, classificacao, status_acao, updated_at)
                VALUES ('INRODA', 'AVARE - SP', 'FEITO', 'VAZIO', 'PRATA', 'A iniciar', now())`
      log.push('✓ Inserido: INRODA (Avaré-SP) — nr12Adequacao=FEITO')
    }

    return NextResponse.json({ ok: true, total: log.length, log })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), log }, { status: 500 })
  }
}
