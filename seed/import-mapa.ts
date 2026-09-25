import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/schema'
import XLSX from 'xlsx'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

const FILE = process.argv[2] || 'C:\\Users\\LucasCouto\\OneDrive - EGE Soluções LTDA - EPP\\Jornada Comercial\\EGE_Mapa_Completo_Oportunidades_2026 (4).xlsx'

function iconToStatus(v: string | null): string {
  if (!v) return 'VAZIO'
  if (v.includes('✅')) return 'FEITO'
  if (v.includes('⚠️')) return 'UPSELL'
  if (v.includes('🔄')) return 'RENOVAR'
  if (v.includes('🔴')) return 'CROSS'
  return 'VAZIO'
}

function classif(v: string | null): string {
  if (!v) return 'BRONZE'
  if (v.includes('OURO')) return 'OURO'
  if (v.includes('PRATA')) return 'PRATA'
  return 'BRONZE'
}

async function main() {
  const wb = XLSX.readFile(FILE)

  // ─── F1 Base EGE ────────────────────────────────────────────────────────────
  console.log('Importando F1 - Base EGE...')
  const wsBase = wb.Sheets['F1 - Base EGE']
  const dBase = XLSX.utils.sheet_to_json<any[]>(wsBase, { header: 1, defval: null }) as any[][]

  // Rows 6-53 (row 54 = TOTAL — skip)
  const clientesRows = dBase.slice(6, 54).filter((r) => r[1] && typeof r[1] === 'string' && !r[1].startsWith('TOTAL'))
  let rankCounter = 0

  await db.delete(schema.clientesEge)
  for (const r of clientesRows) {
    rankCounter++
    await db.insert(schema.clientesEge).values({
      rank: rankCounter,
      cliente: r[1] ?? '',
      local: r[2] ?? null,
      contatoNome: r[3] ?? null,
      classificacao: classif(r[0]),
      nr12AprRisco: iconToStatus(r[4]),
      nr12Procedimentos: iconToStatus(r[5]),
      nr12Manuais: iconToStatus(r[6]),
      nr12Treinamento: iconToStatus(r[7]),
      nr12Conceituacao: iconToStatus(r[8]),
      nr12Adequacao: iconToStatus(r[9]),
      cacaVazDeteccao: iconToStatus(r[10]),
      cacaVazReparo: iconToStatus(r[11]),
      termografia: iconToStatus(r[12]),
      terceirizacaoHh: iconToStatus(r[13]),
      nr10PieLaudo: iconToStatus(r[14]),
      nr10Spda: iconToStatus(r[15]),
      nr10Instalacoes: iconToStatus(r[16]),
      numOportunidades: typeof r[17] === 'number' ? r[17] : null,
      potencialTotal: typeof r[18] === 'number' ? String(r[18]) : null,
      prazoUrgencia: r[19] ?? null,
      acao30d: r[20] ?? null,
      statusAcao: r[21] ?? 'A iniciar',
    })
  }
  console.log(`✅ ${rankCounter} clientes EGE importados`)

  // ─── Oportunidades Pilar B e C ───────────────────────────────────────────────
  console.log('Importando Oportunidades Pilar B e C...')
  const wsOp = wb.Sheets['Oportunidades Pilar B e C']
  const dOp = XLSX.utils.sheet_to_json<any[]>(wsOp, { header: 1, defval: null }) as any[][]

  // Rows 7-43 (row 44 = TOTAL — skip)
  const opRows = dOp.slice(7, 44).filter((r) => typeof r[0] === 'number')

  await db.delete(schema.oportunidadesBc)
  for (const r of opRows) {
    const servicos = r[5] ? String(r[5]).split(',').map((s: string) => s.trim()).filter(Boolean) : []
    await db.insert(schema.oportunidadesBc).values({
      cliente: r[1] ?? '',
      pilaresAtuais: r[2] ?? null,
      segmento: r[3] ?? null,
      ticketEstimado: typeof r[4] === 'number' ? String(r[4]) : null,
      servicosPrioritarios: servicos,
      potencialCross: r[6] ?? null,
      status: r[7] ?? 'A prospectar',
    })
  }
  console.log(`✅ ${opRows.length} oportunidades B/C importadas`)

  // ─── Plano de Ação ───────────────────────────────────────────────────────────
  console.log('Importando Plano de Ação...')
  const wsPlano = wb.Sheets['Plano de Ação']
  const dPlano = XLSX.utils.sheet_to_json<any[]>(wsPlano, { header: 1, defval: null }) as any[][]

  // Parse with section tracking
  const VALID_STATUSES = ['CONCLUIDO', 'EM ANDAMENTO', 'A INICIAR', 'PAUSADO']
  let prazoAtual = 'CURTO'
  let frenteAtual = ''
  const acoes: typeof schema.planosAcao.$inferInsert[] = []

  const sectionRe = /CURTO PRAZO|MÉDIO PRAZO|MEDIO PRAZO|LONGO PRAZO/i
  const frenteRe = /^F(\d|3\/4)/i

  for (let i = 5; i < dPlano.length; i++) {
    const r = dPlano[i]
    if (!r || !r.some((v: any) => v !== null)) continue
    const cell0 = r[0] ? String(r[0]) : ''

    // Section separator
    if (sectionRe.test(cell0)) {
      if (/MEDIO|MÉDIO/i.test(cell0)) prazoAtual = 'MEDIO'
      if (/LONGO/i.test(cell0)) prazoAtual = 'LONGO'
      continue
    }

    // Frente label row (has content only in col 0)
    const onlyCol0 = r.slice(1).every((v: any) => v === null)
    if (onlyCol0 && frenteRe.test(cell0)) {
      const m = cell0.match(/F[\d\/]+/i)
      frenteAtual = m ? m[0].toUpperCase() : frenteAtual
      continue
    }
    if (onlyCol0) continue // other section header rows

    // Data row
    const oQue = r[0] ? String(r[0]) : null
    const porQue = r[1] ? String(r[1]) : null
    const quem = r[2] ? String(r[2]) : null
    const quando = r[3] ? String(r[3]) : null
    const onde = r[4] ? String(r[4]) : null
    const como = r[5] ? String(r[5]) : null
    const kpi = r[6] ? String(r[6]) : null
    const statusRaw = r[7] ? String(r[7]).toUpperCase().trim() : 'A INICIAR'
    const status = VALID_STATUSES.includes(statusRaw) ? statusRaw : 'A INICIAR'

    if (oQue) {
      acoes.push({ frente: frenteAtual || null, oQue, porQue, quem, quando, onde, como, kpi, status, prazo: prazoAtual })
    }
  }

  await db.delete(schema.planosAcao)
  for (const a of acoes) {
    await db.insert(schema.planosAcao).values(a)
  }
  console.log(`✅ ${acoes.length} ações importadas`)
  console.log('🎉 Importação do Mapa concluída!')
}

main().catch((e) => { console.error(e); process.exit(1) })
