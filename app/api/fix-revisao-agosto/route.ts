import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  const log: string[] = []

  try {
    // ── 1. NITRO QUIMICA: reparo foi feito (Aceita 03/02/2026) ──────────────
    const nitro = await sql`
      SELECT id FROM clientes_ege
      WHERE UPPER(REPLACE(cliente, ' ', '')) LIKE '%NITROQUIMICA%'
      LIMIT 1
    `
    if (nitro.length > 0) {
      await sql`
        UPDATE clientes_ege SET caca_vaz_reparo = 'FEITO', updated_at = now()
        WHERE id = ${nitro[0].id as string}
      `
      log.push('✓ NITRO QUIMICA: caca_vaz_reparo → FEITO')
    } else {
      log.push('✗ NITRO QUIMICA não encontrada no banco')
    }

    // ── 2. PEPSICO - ITAQUERA ────────────────────────────────────────────────
    const pepsicoItaquera = await sql`
      SELECT id FROM clientes_ege
      WHERE UPPER(cliente) = 'PEPSICO' AND UPPER(local) LIKE '%ITAQUERA%'
      LIMIT 1
    `
    if (pepsicoItaquera.length > 0) {
      log.push('— PEPSICO (Itaquera): já existe')
    } else {
      await sql`
        INSERT INTO clientes_ege (cliente, local, caca_vaz_deteccao, caca_vaz_reparo, classificacao, status_acao, updated_at)
        VALUES ('PEPSICO', 'ITAQUERA - SP', 'FEITO', 'CROSS', 'PRATA', 'A iniciar', now())
      `
      log.push('✓ Inserido: PEPSICO (Itaquera) — deteccao=FEITO, reparo=CROSS')
    }

    // ── 3. JDE - SALVADOR ───────────────────────────────────────────────────
    const jdeSalvador = await sql`
      SELECT id FROM clientes_ege
      WHERE UPPER(cliente) = 'JDE' AND UPPER(local) LIKE '%SALVADOR%'
      LIMIT 1
    `
    if (jdeSalvador.length > 0) {
      log.push('— JDE (Salvador): já existe')
    } else {
      await sql`
        INSERT INTO clientes_ege (cliente, local, caca_vaz_deteccao, caca_vaz_reparo, classificacao, status_acao, updated_at)
        VALUES ('JDE', 'SALVADOR - BA', 'FEITO', 'CROSS', 'PRATA', 'A iniciar', now())
      `
      log.push('✓ Inserido: JDE (Salvador) — deteccao=FEITO, reparo=CROSS')
    }

    // ── 4. MAGNETI MARELLI - MAUÁ ───────────────────────────────────────────
    const magnetiMaua = await sql`
      SELECT id FROM clientes_ege
      WHERE UPPER(REPLACE(cliente,' ','')) LIKE '%MAGNETIMARELLI%' AND UPPER(local) LIKE '%MAUA%'
      LIMIT 1
    `
    if (magnetiMaua.length > 0) {
      log.push('— MAGNETI MARELLI (Mauá): já existe')
    } else {
      await sql`
        INSERT INTO clientes_ege (cliente, local, caca_vaz_deteccao, caca_vaz_reparo, classificacao, status_acao, updated_at)
        VALUES ('MAGNETI MARELLI', 'MAUA - SP', 'FEITO', 'CROSS', 'PRATA', 'A iniciar', now())
      `
      log.push('✓ Inserido: MAGNETI MARELLI (Mauá) — deteccao=FEITO, reparo=CROSS')
    }

    return NextResponse.json({ ok: true, log })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), log }, { status: 500 })
  }
}
