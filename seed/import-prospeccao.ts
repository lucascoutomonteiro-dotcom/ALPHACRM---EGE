import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/schema'
import XLSX from 'xlsx'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

const FILE = process.argv[2] || 'C:\\Users\\LucasCouto\\OneDrive - EGE Soluções LTDA - EPP\\Jornada Comercial\\CRM_EGE_v4_CRM.xlsm'

const VALID_STATUS = [
  'Nunca Contatado', '1o Contato Feito', 'Follow-up Agendado', 'Em Andamento',
  'Elaborar Proposta', 'Proposta Enviada', 'Oportunidade', 'Fechado Ganho',
  'Fechado Perdido', 'Inativo',
]
const VALID_CANAIS = ['WhatsApp', 'Ligação', 'E-mail', 'LinkedIn']
const VALID_ORIGENS = ['Base Lucas', 'Base EGE', 'Indicação', 'Técnico']

function excelDateToISO(serial: number | null): string | null {
  if (!serial || typeof serial !== 'number') return null
  try {
    const d = new Date(Math.round((serial - 25569) * 86400 * 1000))
    return d.toISOString().split('T')[0]
  } catch { return null }
}

async function main() {
  console.log('📂 Lendo planilha PROSPECCAO...')
  const wb = XLSX.readFile(FILE)
  const ws = wb.Sheets['PROSPECCAO']
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null }) as any[][]

  // Header at index 1, data from index 2
  const dataRows = rows.slice(2).filter((r) => r[0] && String(r[0]).trim().length > 0)
  console.log(`📊 ${dataRows.length} contatos encontrados`)

  // Clear existing (from seed mock data — keep users/metas)
  console.log('🗑️  Limpando contatos existentes...')
  await db.delete(schema.contatos)

  const BATCH = 200
  let imported = 0
  let skipped = 0

  for (let i = 0; i < dataRows.length; i += BATCH) {
    const batch = dataRows.slice(i, i + BATCH)
    const values: typeof schema.contatos.$inferInsert[] = []

    for (const r of batch) {
      const nome = r[0] ? String(r[0]).trim() : null
      if (!nome) { skipped++; continue }

      const empresa = r[1] ? String(r[1]).trim() : null
      const cidade = r[2] ? String(r[2]).trim() : null
      const cnpj = r[3] ? String(r[3]).trim() : null
      const cargo = r[4] ? String(r[4]).trim() : null
      const telefone = r[5] ? String(r[5]).trim() : null
      const email = r[6] ? String(r[6]).trim().toLowerCase() : null
      const origemRaw = r[7] ? String(r[7]).trim() : null
      const origem = origemRaw && VALID_ORIGENS.includes(origemRaw) ? origemRaw : (origemRaw ? 'Base Lucas' : null)
      const canalRaw = r[8] ? String(r[8]).trim() : null
      const canal = canalRaw && VALID_CANAIS.includes(canalRaw) ? canalRaw : null
      const dataPrimeiroContato = excelDateToISO(r[9])
      const statusRaw = r[10] ? String(r[10]).trim() : null
      const status = statusRaw && VALID_STATUS.includes(statusRaw) ? statusRaw : 'Nunca Contatado'
      const proximaAtividade = excelDateToISO(r[11])
      const historico = r[14] ? String(r[14]).trim() : null
      const segmento = r[15] ? String(r[15]).trim() : null
      const servicoRaw = r[16] ? String(r[16]).trim() : null
      const servicoInteresse = servicoRaw ? servicoRaw.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean) : null
      const valorEstimado = r[17] && typeof r[17] === 'number' ? String(r[17]) : null
      const numeroProposta = r[18] ? String(r[18]).trim() : null
      const probabilidade = r[19] && typeof r[19] === 'number' ? Math.round(r[19] * 100) <= 100 ? Math.round(r[19] * 100) : Math.round(r[19]) : null

      values.push({
        nome, empresa, cidade, cnpj, cargo, telefone, email,
        origem, canal, dataPrimeiroContato, status,
        proximaAtividade, historico, segmento,
        servicoInteresse: servicoInteresse ?? undefined,
        valorEstimado, numeroProposta, probabilidade,
      })
    }

    if (values.length > 0) {
      await db.insert(schema.contatos).values(values)
      imported += values.length
    }

    process.stdout.write(`\r⏳ ${imported} / ${dataRows.length} importados...`)
  }

  console.log(`\n✅ ${imported} contatos importados, ${skipped} pulados`)
  console.log('🎉 Importação concluída!')
}

main().catch((e) => { console.error(e); process.exit(1) })
