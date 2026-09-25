import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  // Quais empresas têm reparo marcado como FEITO (incorreto — só o laudo foi feito)
  const antes = await sql`
    SELECT cliente, caca_vaz_deteccao, caca_vaz_reparo
    FROM clientes_ege
    WHERE caca_vaz_reparo = 'FEITO'
    ORDER BY cliente
  `

  // Corrige: FEITO → CROSS (oportunidade de vender o reparo após detecção)
  await sql`
    UPDATE clientes_ege
    SET caca_vaz_reparo = 'CROSS', updated_at = now()
    WHERE caca_vaz_reparo = 'FEITO'
  `

  return NextResponse.json({
    ok: true,
    corrigidos: antes.length,
    empresas: antes.map(r => ({
      cliente: r.cliente,
      deteccao: r.caca_vaz_deteccao,
      reparoAntes: r.caca_vaz_reparo,
      reparoDepois: 'CROSS',
    })),
  })
}
