// Script: seed-propostas.js
// Importa CSV de oportunidades, cria tabela propostas, e atualiza clientes_ege com serviços FEITO
const { neon } = require(require('path').join(__dirname, '..', 'node_modules', '@neondatabase', 'serverless'))
const fs = require('fs')
const path = require('path')

const DATABASE_URL = 'postgresql://neondb_owner:npg_W5mohbtND6fB@ep-snowy-poetry-acsjimsj.sa-east-1.aws.neon.tech/neondb?sslmode=require'
const sql = neon(DATABASE_URL)

const CSV_PATH = 'C:\\Users\\LucasCouto\\Downloads\\ege_oportunidades.csv'

function parseDate(s) {
  if (!s || s.trim() === '') return null
  const [d, m, y] = s.trim().split('/')
  if (!d || !m || !y) return null
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

function parseValor(s) {
  if (!s || s.trim() === '') return null
  const n = parseFloat(s.replace('R$','').replace(/\./g,'').replace(',','.').trim())
  return isNaN(n) ? null : n
}

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim())
  const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g,''))
  return lines.slice(1).map(line => {
    const vals = line.split(';').map(v => v.trim().replace(/^"|"$/g,''))
    const obj = {}
    headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
    return obj
  }).filter(r => r['ID Oportunidade'])
}

// Mapeia escopo/nome proposta → campos de serviço
function mapServicos(escopo, nome) {
  const text = `${escopo} ${nome}`.toUpperCase()
  return {
    nr12AprRisco:      /NR.?12.*(APR|RISCO|ANALISE.DE.RISCO)/.test(text) ? 'FEITO' : null,
    nr12Procedimentos: /NR.?12.*(PROCEDIMENTO|INSTRUCAO|INSTRU)/.test(text) ? 'FEITO' : null,
    nr12Manuais:       /NR.?12.*(MANUAL|LIVRO)/.test(text) ? 'FEITO' : null,
    nr12Treinamento:   /NR.?12.*(TREINAMENTO|CAPACITA|CURSO)/.test(text) ? 'FEITO' : null,
    nr12Conceituacao:  /NR.?12.*(CONCEITU|CONCEPT)/.test(text) ? 'FEITO' : null,
    nr12Adequacao:     /(ADEQUA|NR.?12)/.test(text) ? 'FEITO' : null,
    cacaVazDeteccao:   /(CA.A.VAZ|VAZAMENTO).*(DETEC|INSPEC|VERIF)/.test(text) ? 'FEITO' : null,
    cacaVazReparo:     /(CA.A.VAZ|VAZAMENTO).*(REPARO|CORRE|ELIM)/.test(text) ? 'FEITO' : null,
    termografia:       /TERMOGRAF/.test(text) ? 'FEITO' : null,
    terceirizacaoHh:   /(TERCEIRIZ|M.O.DE.OBRA|T.CNICO|ELETRICISTA|ENCANADOR|MECANIC)/.test(text) ? 'FEITO' : null,
    nr10PieLaudo:      /NR.?10.*(PIE|LAUDO|PROJETO)/.test(text) ? 'FEITO' : null,
    nr10Spda:          /NR.?10.*(SPDA|PARA.?RAIO)/.test(text) ? 'FEITO' : null,
    nr10Instalacoes:   /NR.?10/.test(text) ? 'FEITO' : null,
  }
}

async function main() {
  console.log('📄 Lendo CSV...')
  const content = fs.readFileSync(CSV_PATH, 'utf-8')
  const rows = parseCSV(content)
  console.log(`✓ ${rows.length} registros encontrados`)

  // 1. Criar tabela propostas
  console.log('\n🔨 Criando tabela propostas...')
  await sql.query(`
    CREATE TABLE IF NOT EXISTS propostas (
      id text PRIMARY KEY,
      nome_proposta text,
      pilar text,
      cliente text,
      localidade text,
      situacao text,
      temperatura text,
      responsavel text,
      fonte text,
      contato text,
      valor_pc numeric(14,2),
      data_criacao date,
      prazo_envio date,
      data_enviada date,
      prazo_follow_up date,
      fup_atrasado boolean DEFAULT false,
      ultima_acao_fup text,
      fups_realizados integer DEFAULT 0,
      previsao_fechamento date,
      nivel_dor text,
      score integer,
      escopo text,
      created_at timestamptz DEFAULT now()
    )
  `)
  console.log('✓ Tabela propostas OK')

  // 2. Inserir propostas em batches
  console.log('\n📥 Inserindo propostas...')
  await sql.query('TRUNCATE propostas')

  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    for (const r of batch) {
      await sql.query(
        `INSERT INTO propostas (id,nome_proposta,pilar,cliente,localidade,situacao,temperatura,responsavel,
          fonte,contato,valor_pc,data_criacao,prazo_envio,data_enviada,prazo_follow_up,
          fup_atrasado,fups_realizados,previsao_fechamento,nivel_dor,score,escopo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         ON CONFLICT (id) DO UPDATE SET situacao=EXCLUDED.situacao, prazo_follow_up=EXCLUDED.prazo_follow_up,
           temperatura=EXCLUDED.temperatura, score=EXCLUDED.score`,
        [
          r['ID Oportunidade'], r['Nome Proposta'], r['Pilar'], r['Cliente']?.trim(), r['Localidade'],
          r['Situação'], r['Temperatura'], r['Responsável'], r['Fonte'], r['Contato'],
          parseValor(r['Valor PC']), parseDate(r['Data Criação']), parseDate(r['Prazo Envio']),
          parseDate(r['Data Enviada']), parseDate(r['Prazo Follow-Up']),
          r['FUP Atrasado']?.toLowerCase() === 'sim',
          parseInt(r['FUPs Realizados']) || 0,
          parseDate(r['Previsão Fechamento']), r['Nível da Dor'],
          parseInt(r['Score']) || null, r['Escopo']
        ]
      )
      inserted++
    }
    process.stdout.write(`\r  ${inserted}/${rows.length}`)
  }
  console.log(`\n✓ ${inserted} propostas inseridas`)

  // 3. Atualizar clientes_ege com serviços baseados em propostas ACEITAS do Pilar A
  // + Terceirização HH do Pilar T (mão de obra)
  // + Caça Vaz do Pilar C/E
  console.log('\n🔄 Atualizando serviços de clientes_ege...')

  const aceitasPilarA   = rows.filter(r => r['Pilar'] === 'A' && r['Situação'] === 'Aceita')
  const aceitasTerceiriz = rows.filter(r => r['Pilar'] !== 'A' && r['Situação'] === 'Aceita' &&
    /(TERCEIRIZ|M.O.DE.OBRA|T.CNICO|ELETRICISTA)/i.test(`${r['Nome Proposta']} ${r['Escopo']}`))
  const aceitasCacaVaz  = rows.filter(r => r['Pilar'] !== 'A' && r['Situação'] === 'Aceita' &&
    /(CA.A.VAZ|VAZAMENTO)/i.test(`${r['Nome Proposta']} ${r['Escopo']}`))

  // Mapear por cliente
  const mapaServicos = {}
  function setFeito(cliente, campo) {
    if (!cliente) return
    const c = cliente.trim().toUpperCase()
    if (!mapaServicos[c]) mapaServicos[c] = {}
    mapaServicos[c][campo] = 'FEITO'
  }

  for (const r of aceitasPilarA) {
    const s = mapServicos(r['Escopo'], r['Nome Proposta'])
    Object.entries(s).forEach(([k, v]) => { if (v) setFeito(r['Cliente'], k) })
  }
  for (const r of aceitasTerceiriz) setFeito(r['Cliente'], 'terceirizacaoHh')
  for (const r of aceitasCacaVaz) {
    const text = `${r['Nome Proposta']} ${r['Escopo']}`.toUpperCase()
    if (/(DETEC|INSPEC|VERIF)/.test(text)) setFeito(r['Cliente'], 'cacaVazDeteccao')
    if (/(REPARO|CORRE|ELIM)/.test(text)) setFeito(r['Cliente'], 'cacaVazReparo')
    if (!/(DETEC|INSPEC|REPARO|CORRE)/.test(text)) { setFeito(r['Cliente'], 'cacaVazDeteccao'); setFeito(r['Cliente'], 'cacaVazReparo') }
  }

  // Buscar clientes do banco
  const clientesBanco = await sql.query('SELECT id, cliente FROM clientes_ege')
  let updated = 0
  for (const c of clientesBanco.rows ?? clientesBanco) {
    const nomeUpper = c.cliente.toUpperCase()
    // Tentar match exato ou parcial
    const match = mapaServicos[nomeUpper] ||
      Object.entries(mapaServicos).find(([k]) => nomeUpper.includes(k) || k.includes(nomeUpper))?.[1]
    if (!match) continue

    const sets = Object.entries(match)
      .map(([campo, val], idx) => {
        const col = {
          nr12AprRisco:'nr12_apr_risco', nr12Procedimentos:'nr12_procedimentos',
          nr12Manuais:'nr12_manuais', nr12Treinamento:'nr12_treinamento',
          nr12Conceituacao:'nr12_conceituacao', nr12Adequacao:'nr12_adequacao',
          cacaVazDeteccao:'caca_vaz_deteccao', cacaVazReparo:'caca_vaz_reparo',
          termografia:'termografia', terceirizacaoHh:'terceirizacao_hh',
          nr10PieLaudo:'nr10_pie_laudo', nr10Spda:'nr10_spda', nr10Instalacoes:'nr10_instalacoes'
        }[campo]
        return col ? `${col} = '${val}'` : null
      }).filter(Boolean)

    if (sets.length === 0) continue
    await sql.query(`UPDATE clientes_ege SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`, [c.id])
    updated++
  }
  console.log(`✓ ${updated} clientes_ege atualizados com serviços FEITO`)

  // 4. Verificar clientes outros pilares sem Pilar A → para oportunidades_bc
  const clientesPilarA = new Set(rows.filter(r => r['Pilar'] === 'A').map(r => r['Cliente']?.trim().toUpperCase()))
  const semPilarA = [...new Set(
    rows.filter(r => r['Pilar'] !== 'A' && r['Situação'] === 'Aceita' && r['Cliente']?.trim())
        .map(r => r['Cliente'].trim())
  )].filter(c => !clientesPilarA.has(c.toUpperCase()))

  console.log(`\n📋 ${semPilarA.length} clientes sem Pilar A (candidatos oportunidades_bc):`)
  semPilarA.forEach(c => console.log(`  - ${c}`))

  console.log('\n✅ Seed concluído com sucesso!')
}

main().catch(e => { console.error('\n❌ Erro:', e.message); process.exit(1) })
