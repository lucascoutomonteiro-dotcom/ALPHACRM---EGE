import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  try {
    // Caça Vazamento é semestral: clientes com FEITO viram RENOVAR (oportunidade ativa de renovação)
    const r1 = await sql`
      UPDATE clientes_ege
      SET caca_vaz_deteccao = 'RENOVAR', updated_at = now()
      WHERE caca_vaz_deteccao = 'FEITO'
    `
    // Mesma lógica pode se aplicar a outros serviços recorrentes no futuro
    return NextResponse.json({
      ok: true,
      cacaVazamentoAtualizados: r1.length ?? 'ok',
      mensagem: 'FEITO → RENOVAR para Caça Vazamento em todos os clientes.',
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
