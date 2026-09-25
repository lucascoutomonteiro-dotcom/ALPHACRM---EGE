import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

// Ordem de prioridade — número maior = status mais forte (nunca rebaixar)
const PRIORIDADE: Record<string, number> = { VAZIO: 0, UPSELL: 1, CROSS: 2, RENOVAR: 3, FEITO: 4 }

// 65 clientes com propostas Aceitas no portfólio Pilar A (gerado a partir do CSV de 26/08/2026)
const CLIENTES_CSV = [{"cliente":"THYSSENKRUPP","localidade":"CAMPO LIMPO PAULISTA - SP","terceirizacaoHh":"FEITO","nr12Adequacao":"CROSS","nr12Treinamento":"CROSS","nr12AprRisco":"FEITO","cacaVazDeteccao":"FEITO"},{"cliente":"SHERWIN WILLIAMS","localidade":"São Bernardo Do Campo - SP","nr12Adequacao":"CROSS","cacaVazDeteccao":"FEITO","nr12AprRisco":"CROSS"},{"cliente":"AHLSTROM","localidade":"LOUVEIRA - SP","terceirizacaoHh":"FEITO","nr12Adequacao":"FEITO","nr10PieLaudo":"CROSS","cacaVazDeteccao":"FEITO"},{"cliente":"JDE","localidade":"JUNDIAI - SP","nr12Adequacao":"FEITO","nr12AprRisco":"FEITO","terceirizacaoHh":"FEITO","cacaVazDeteccao":"FEITO","nr12Treinamento":"CROSS"},{"cliente":"GBMX","localidade":"HORTOLANDIA - SP","nr12Adequacao":"FEITO","nr12Treinamento":"CROSS","nr12AprRisco":"FEITO","terceirizacaoHh":"FEITO","nr12Procedimentos":"CROSS"},{"cliente":"NOURYON","localidade":"ITUPEVA - SP","terceirizacaoHh":"FEITO","nr10PieLaudo":"CROSS","nr12Adequacao":"FEITO","nr12AprRisco":"FEITO"},{"cliente":"GKN","localidade":"HORTOLANDIA - SP","cacaVazDeteccao":"FEITO"},{"cliente":"MINEBEA","localidade":"MANAUS - AM","cacaVazDeteccao":"FEITO"},{"cliente":"FITESA","localidade":"COSMOPOLIS - SP","nr12AprRisco":"CROSS","nr12Adequacao":"FEITO"},{"cliente":"BAKELS","localidade":"Vinhedo - SP","terceirizacaoHh":"FEITO","nr12Treinamento":"CROSS","nr12AprRisco":"CROSS","nr12Adequacao":"FEITO","nr10PieLaudo":"FEITO"},{"cliente":"UNILEVER","localidade":"VINHEDO","terceirizacaoHh":"FEITO","nr12Adequacao":"CROSS","nr12AprRisco":"FEITO"},{"cliente":"ANDRITZ","localidade":"PETROPOLIS","nr12Procedimentos":"CROSS","nr12Adequacao":"FEITO","nr12AprRisco":"CROSS","cacaVazDeteccao":"FEITO","terceirizacaoHh":"FEITO","nr12Treinamento":"FEITO"},{"cliente":"PEPSICO","localidade":"ITU","cacaVazDeteccao":"FEITO"},{"cliente":"CROWN","localidade":"Cabreúva","nr12Adequacao":"FEITO","nr12AprRisco":"FEITO"},{"cliente":"AAK","localidade":"JUNDIAI","nr12Adequacao":"FEITO","terceirizacaoHh":"FEITO","nr12AprRisco":"FEITO","nr10PieLaudo":"FEITO"},{"cliente":"MAGNETI MARELLI","localidade":"LAVRAS","cacaVazDeteccao":"FEITO"},{"cliente":"CBC","localidade":"JUNDIAI","nr12Adequacao":"CROSS","terceirizacaoHh":"FEITO"},{"cliente":"CRUZ","localidade":"CURITIBA","terceirizacaoHh":"FEITO"},{"cliente":"DEXCO","localidade":"CAJAMAR","nr12Adequacao":"FEITO","cacaVazDeteccao":"FEITO","nr12AprRisco":"FEITO","terceirizacaoHh":"FEITO","nr12Procedimentos":"CROSS","nr10PieLaudo":"CROSS","nr12Treinamento":"CROSS"},{"cliente":"NEO RODAS","localidade":"VINHEDO","cacaVazDeteccao":"FEITO"},{"cliente":"ACG","localidade":"COTIA","nr12AprRisco":"FEITO","nr12Treinamento":"CROSS","nr12Adequacao":"FEITO","cacaVazDeteccao":"CROSS","nr10PieLaudo":"CROSS"},{"cliente":"VALEO","localidade":"ITATIBA","nr12Adequacao":"FEITO","nr12AprRisco":"FEITO","cacaVazDeteccao":"CROSS"},{"cliente":"SAINT-GOBAIN","localidade":"CANADA","nr12Adequacao":"FEITO","nr12AprRisco":"CROSS","terceirizacaoHh":"FEITO"},{"cliente":"WEIR MINERALS","localidade":"JUNDIAI","nr12AprRisco":"FEITO","terceirizacaoHh":"FEITO","nr12Adequacao":"FEITO","cacaVazDeteccao":"CROSS","nr12Treinamento":"CROSS","nr12Manuais":"CROSS"},{"cliente":"ALLTERRA AGRO","localidade":"PAINS","terceirizacaoHh":"FEITO"},{"cliente":"BRF","localidade":"EMBU DAS ARTES","nr12Adequacao":"FEITO"},{"cliente":"FANAVID","localidade":"GUARULHOS","cacaVazDeteccao":"FEITO"},{"cliente":"PLASCAR","localidade":"JUNDIAI","nr12Adequacao":"CROSS","terceirizacaoHh":"FEITO","nr12AprRisco":"CROSS","nr10PieLaudo":"CROSS"},{"cliente":"AUMOVIO","localidade":"VARZEA PAULISTA","cacaVazDeteccao":"FEITO"},{"cliente":"FINI","localidade":"JUNDIAI","nr12Adequacao":"FEITO","nr12Manuais":"FEITO","nr12AprRisco":"FEITO","terceirizacaoHh":"CROSS","nr10PieLaudo":"FEITO"},{"cliente":"HARALD","localidade":"SANTANA DE PARNAIBA","cacaVazDeteccao":"FEITO","nr12AprRisco":"FEITO","terceirizacaoHh":"FEITO","nr12Adequacao":"FEITO"},{"cliente":"FEMSA","localidade":"JUNDIAI","cacaVazDeteccao":"FEITO"},{"cliente":"BARBI BRASIL","localidade":"VARZEA PAULISTA","nr12AprRisco":"FEITO","nr12Adequacao":"CROSS"},{"cliente":"NITRO QUIMICA","localidade":"SAO PAULO","cacaVazDeteccao":"FEITO","nr12Treinamento":"CROSS"},{"cliente":"NOVELIS","localidade":"PINDAMONHANGABA","cacaVazDeteccao":"FEITO","nr12AprRisco":"CROSS"},{"cliente":"JUNGHEINRICH","localidade":"ITUPEVA","nr12Treinamento":"CROSS","nr12Adequacao":"FEITO","terceirizacaoHh":"FEITO","nr10PieLaudo":"CROSS","nr12AprRisco":"CROSS"},{"cliente":"PYROTEK","localidade":"JUNDIAI","cacaVazDeteccao":"CROSS","nr12AprRisco":"FEITO","nr12Adequacao":"CROSS"},{"cliente":"BIGNARDI","localidade":"JUNDIAI","terceirizacaoHh":"FEITO","nr12AprRisco":"CROSS","nr10PieLaudo":"CROSS"},{"cliente":"MESSER GASES","localidade":"JUNDIAI","nr12AprRisco":"CROSS","cacaVazDeteccao":"FEITO","terceirizacaoHh":"CROSS"},{"cliente":"LCI VENTILADORES","localidade":"ITUPEVA","nr12Adequacao":"CROSS","nr12AprRisco":"FEITO"},{"cliente":"SULZER","localidade":"JUNDIAI","terceirizacaoHh":"FEITO"},{"cliente":"STEELCORP","localidade":"CAJAMAR","terceirizacaoHh":"FEITO"},{"cliente":"CONDAT","localidade":"BOM JESUS DOS PERDOES","termografia":"FEITO","nr12AprRisco":"CROSS"},{"cliente":"KERRY","localidade":"BARUERI","cacaVazDeteccao":"FEITO","nr12Manuais":"CROSS","terceirizacaoHh":"FEITO","nr12Adequacao":"FEITO"},{"cliente":"BELGO","localidade":"ITAUNA","cacaVazDeteccao":"FEITO"},{"cliente":"KANJIKO","localidade":"SALTO","cacaVazDeteccao":"FEITO"},{"cliente":"APTAR","localidade":"CAJAMAR","cacaVazDeteccao":"FEITO","nr12AprRisco":"FEITO","nr12Adequacao":"FEITO"},{"cliente":"MERCURY","localidade":"VALINHOS","nr10PieLaudo":"CROSS","cacaVazDeteccao":"CROSS","nr12AprRisco":"FEITO"},{"cliente":"JOYSON SAFETY","localidade":"JUNDIAI","nr12Adequacao":"FEITO","terceirizacaoHh":"CROSS","cacaVazDeteccao":"CROSS"},{"cliente":"HIGIDENT","localidade":"ITAJUBA","cacaVazDeteccao":"FEITO"},{"cliente":"VITAS","localidade":"CANDEIAS","nr12AprRisco":"CROSS","terceirizacaoHh":"CROSS","nr12Adequacao":"FEITO"},{"cliente":"EFTEC","localidade":"SANTANA DE PARNAIBA","nr12Adequacao":"CROSS","nr12AprRisco":"FEITO"},{"cliente":"JOHNSON ELECTRIC","localidade":"ARUJA - SP","nr12Adequacao":"FEITO"},{"cliente":"MICROPOWER","localidade":"SAO PAULO","terceirizacaoHh":"FEITO"},{"cliente":"VOESTALPINE","localidade":"SAO PAULO - SP","nr12Adequacao":"FEITO"},{"cliente":"CANTUSTORE","localidade":"ITUPEVA - SP","nr12Adequacao":"FEITO"},{"cliente":"EGE","localidade":"Fazgran","nr12Treinamento":"FEITO"},{"cliente":"AGRANA","localidade":"Cabreúva","terceirizacaoHh":"CROSS","nr12Adequacao":"CROSS","nr12AprRisco":"FEITO"},{"cliente":"CRS BRANDS","localidade":"Jundiaí","nr12Adequacao":"CROSS","cacaVazDeteccao":"FEITO"},{"cliente":"TIROLEZ","localidade":"Arapua","cacaVazDeteccao":"FEITO","nr12AprRisco":"CROSS","nr12Adequacao":"CROSS"},{"cliente":"DOREMUS","localidade":"Guarulhos","cacaVazDeteccao":"FEITO"},{"cliente":"MARQUESPAN","localidade":"Tatuí","cacaVazDeteccao":"FEITO"},{"cliente":"COBRECOM","localidade":"Itu","cacaVazDeteccao":"FEITO"},{"cliente":"NITTO DENKO","localidade":"Santana De Parnaiíba","cacaVazDeteccao":"FEITO"},{"cliente":"MIRACEMA","localidade":"Campinas","nr12Adequacao":"FEITO"}]

const COLS = ['nr12AprRisco','nr12Procedimentos','nr12Manuais','nr12Treinamento','nr12Adequacao','cacaVazDeteccao','termografia','terceirizacaoHh','nr10PieLaudo'] as const
type Col = typeof COLS[number]

function merge(atual: string, novo: string): string {
  return (PRIORIDADE[novo] ?? 0) > (PRIORIDADE[atual] ?? 0) ? novo : atual
}

function normalizar(nome: string) {
  return nome.toUpperCase().replace(/[^A-Z0-9]/g, '').trim()
}

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    // Busca todos os clientes existentes
    const existentes = await sql`SELECT id, cliente, nr12_apr_risco, nr12_procedimentos, nr12_manuais, nr12_treinamento, nr12_adequacao, caca_vaz_deteccao, termografia, terceirizacao_hh, nr10_pie_laudo FROM clientes_ege`

    const mapaExistentes: Record<string, typeof existentes[0]> = {}
    for (const e of existentes) {
      mapaExistentes[normalizar(e.cliente as string)] = e
    }

    const atualizados: string[] = []
    const inseridos: string[] = []
    const ignorados: string[] = []

    for (const csv of CLIENTES_CSV) {
      const chave = normalizar(csv.cliente)
      const existente = mapaExistentes[chave]

      if (existente) {
        // Merge: só atualiza coluna se o novo valor tiver prioridade maior
        const updates: Partial<Record<string, string>> = {}
        const dbMap: Record<Col, string> = {
          nr12AprRisco:     existente.nr12_apr_risco as string || 'VAZIO',
          nr12Procedimentos:existente.nr12_procedimentos as string || 'VAZIO',
          nr12Manuais:      existente.nr12_manuais as string || 'VAZIO',
          nr12Treinamento:  existente.nr12_treinamento as string || 'VAZIO',
          nr12Adequacao:    existente.nr12_adequacao as string || 'VAZIO',
          cacaVazDeteccao:  existente.caca_vaz_deteccao as string || 'VAZIO',
          termografia:      existente.termografia as string || 'VAZIO',
          terceirizacaoHh:  existente.terceirizacao_hh as string || 'VAZIO',
          nr10PieLaudo:     existente.nr10_pie_laudo as string || 'VAZIO',
        }
        let changed = false
        for (const col of COLS) {
          const csvVal = (csv as unknown as Record<string, string>)[col]
          if (!csvVal) continue
          const merged = merge(dbMap[col], csvVal)
          if (merged !== dbMap[col]) {
            updates[col] = merged
            changed = true
          }
        }
        if (changed) {
          await sql`
            UPDATE clientes_ege SET
              nr12_apr_risco      = COALESCE(${updates.nr12AprRisco ?? null}, nr12_apr_risco),
              nr12_procedimentos  = COALESCE(${updates.nr12Procedimentos ?? null}, nr12_procedimentos),
              nr12_manuais        = COALESCE(${updates.nr12Manuais ?? null}, nr12_manuais),
              nr12_treinamento    = COALESCE(${updates.nr12Treinamento ?? null}, nr12_treinamento),
              nr12_adequacao      = COALESCE(${updates.nr12Adequacao ?? null}, nr12_adequacao),
              caca_vaz_deteccao   = COALESCE(${updates.cacaVazDeteccao ?? null}, caca_vaz_deteccao),
              termografia         = COALESCE(${updates.termografia ?? null}, termografia),
              terceirizacao_hh    = COALESCE(${updates.terceirizacaoHh ?? null}, terceirizacao_hh),
              nr10_pie_laudo      = COALESCE(${updates.nr10PieLaudo ?? null}, nr10_pie_laudo),
              updated_at          = now()
            WHERE id = ${existente.id}
          `
          atualizados.push(csv.cliente)
        } else {
          ignorados.push(csv.cliente + ' (sem mudança)')
        }
      } else {
        // Inserir como novo cliente
        const c = csv as unknown as Record<string, string>
        await sql`
          INSERT INTO clientes_ege (
            cliente, local,
            nr12_apr_risco, nr12_procedimentos, nr12_manuais, nr12_treinamento, nr12_adequacao,
            caca_vaz_deteccao, termografia, terceirizacao_hh, nr10_pie_laudo,
            status_acao, updated_at
          ) VALUES (
            ${csv.cliente}, ${csv.localidade},
            ${c.nr12AprRisco || 'VAZIO'}, ${c.nr12Procedimentos || 'VAZIO'}, ${c.nr12Manuais || 'VAZIO'},
            ${c.nr12Treinamento || 'VAZIO'}, ${c.nr12Adequacao || 'VAZIO'},
            ${c.cacaVazDeteccao || 'VAZIO'}, ${c.termografia || 'VAZIO'},
            ${c.terceirizacaoHh || 'VAZIO'}, ${c.nr10PieLaudo || 'VAZIO'},
            'A iniciar', now()
          )
        `
        inseridos.push(csv.cliente)
      }
    }

    return NextResponse.json({
      ok: true,
      resumo: {
        totalProcessados: CLIENTES_CSV.length,
        atualizados: atualizados.length,
        inseridos: inseridos.length,
        semMudanca: ignorados.length,
      },
      atualizados,
      inseridos,
      semMudanca: ignorados,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
