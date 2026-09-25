const { neon } = require('./node_modules/@neondatabase/serverless')
const fs = require('fs')
const sql = neon('postgresql://neondb_owner:npg_W5mohbtND6fB@ep-snowy-poetry-acsjimsj.sa-east-1.aws.neon.tech/neondb?sslmode=require')

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

function mapServicos(escopo, nome) {
  const text = `${escopo} ${nome}`.toUpperCase()
  return {
    nr12AprRisco:      /NR.?12.*(APR|RISCO)/.test(text) ? 'FEITO' : null,
    nr12Procedimentos: /NR.?12.*(PROCEDIMENTO|INSTRUCAO|INSTRUÇÃO)/.test(text) ? 'FEITO' : null,
    nr12Manuais:       /NR.?12.*(MANUAL|LIVRO)/.test(text) ? 'FEITO' : null,
    nr12Treinamento:   /NR.?12.*(TREINAMENTO|CAPACITA|CURSO)/.test(text) ? 'FEITO' : null,
    nr12Conceituacao:  /NR.?12.*(CONCEITU|CONCEPT)/.test(text) ? 'FEITO' : null,
    nr12Adequacao:     /(ADEQUA|NR.?12)/.test(text) ? 'FEITO' : null,
    cacaVazDeteccao:   /(VAZAMENTO|CACA.VAZ).*(DETEC|INSPEC|VERIF)/.test(text) ? 'FEITO' : null,
    cacaVazReparo:     /(VAZAMENTO|CACA.VAZ).*(REPARO|CORRE|ELIM)/.test(text) ? 'FEITO' : null,
    termografia:       /TERMOGRAF/.test(text) ? 'FEITO' : null,
    terceirizacaoHh:   /(TERCEIRIZ|MAO.DE.OBRA|TÉCNICO|TECNICO|ELETRICISTA|ENCANADOR)/.test(text) ? 'FEITO' : null,
    nr10PieLaudo:      /NR.?10.*(PIE|LAUDO|PROJETO)/.test(text) ? 'FEITO' : null,
    nr10Spda:          /NR.?10.*(SPDA|PARA.?RAIO)/.test(text) ? 'FEITO' : null,
    nr10Instalacoes:   /NR.?10/.test(text) ? 'FEITO' : null,
  }
}

async function main() {
  const rows = parseCSV(fs.readFileSync('C:\\Users\\LucasCouto\\Downloads\\ege_oportunidades.csv', 'utf-8'))
  const aceitasPilarA = rows.filter(r => r['Pilar'] === 'A' && r['Situação'] === 'Aceita')
  const aceitasTerceiriz = rows.filter(r => r['Pilar'] !== 'A' && r['Situação'] === 'Aceita' && /(TERCEIRIZ|MAO.DE.OBRA|TÉCNICO|TECNICO|ELETRICISTA)/i.test(`${r['Nome Proposta']} ${r['Escopo']}`))
  const aceitasCacaVaz = rows.filter(r => r['Pilar'] !== 'A' && r['Situação'] === 'Aceita' && /VAZAMENTO|CACA.VAZ/i.test(`${r['Nome Proposta']} ${r['Escopo']}`))

  const mapa = {}
  function set(cliente, campo) {
    if (!cliente) return
    const c = cliente.trim().toUpperCase()
    if (!mapa[c]) mapa[c] = {}
    mapa[c][campo] = 'FEITO'
  }

  for (const r of aceitasPilarA) {
    const s = mapServicos(r['Escopo'], r['Nome Proposta'])
    Object.entries(s).forEach(([k,v]) => { if(v) set(r['Cliente'],k) })
  }
  for (const r of aceitasTerceiriz) set(r['Cliente'], 'terceirizacaoHh')
  for (const r of aceitasCacaVaz) {
    const t = `${r['Nome Proposta']} ${r['Escopo']}`.toUpperCase()
    set(r['Cliente'], 'cacaVazDeteccao')
    set(r['Cliente'], 'cacaVazReparo')
  }

  const COL = { nr12AprRisco:'nr12_apr_risco', nr12Procedimentos:'nr12_procedimentos', nr12Manuais:'nr12_manuais', nr12Treinamento:'nr12_treinamento', nr12Conceituacao:'nr12_conceituacao', nr12Adequacao:'nr12_adequacao', cacaVazDeteccao:'caca_vaz_deteccao', cacaVazReparo:'caca_vaz_reparo', termografia:'termografia', terceirizacaoHh:'terceirizacao_hh', nr10PieLaudo:'nr10_pie_laudo', nr10Spda:'nr10_spda', nr10Instalacoes:'nr10_instalacoes' }

  const clientes = await sql.query('SELECT id, cliente FROM clientes_ege')
  let updated = 0
  for (const c of clientes) {
    const nomeU = c.cliente.toUpperCase()
    let match = mapa[nomeU]
    if (!match) {
      const found = Object.entries(mapa).find(([k]) => nomeU.includes(k.substring(0,6)) || k.includes(nomeU.substring(0,6)))
      if (found) match = found[1]
    }
    if (!match) continue
    const sets = Object.entries(match).map(([k,v]) => COL[k] ? `${COL[k]}='${v}'` : null).filter(Boolean)
    if (!sets.length) continue
    await sql.query(`UPDATE clientes_ege SET ${sets.join(',')}, updated_at=now() WHERE id=$1`, [c.id])
    console.log(`  ✓ ${c.cliente}: ${Object.keys(match).join(', ')}`)
    updated++
  }
  console.log(`\nTotal: ${updated} clientes atualizados`)
}
main().catch(e => { console.error('Erro:', e.message); process.exit(1) })
