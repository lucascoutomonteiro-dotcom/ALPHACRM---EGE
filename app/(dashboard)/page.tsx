import { db } from '@/lib/db'
import { metas, contatos, interacoes, clientesEge, interacoesEge, crmEventos, deals, dealColunas } from '@/lib/schema'
import { eq, and, lte, gt, inArray, desc, sql as drizzleSql, gte } from 'drizzle-orm'
import { DashboardPropostas, type PropostasData, type RawDeal, type DealColunaMeta } from '@/components/dashboard/DashboardPropostas'
import { requireAuth } from '@/lib/session'
import { KPICardToggle } from '@/components/dashboard/KPICardToggle'
import { GaugeChart } from '@/components/dashboard/GaugeChart'
import { GraficoEvolucao } from '@/components/dashboard/GraficoEvolucao'
import { GraficoAtividade, type AtividadeItem } from '@/components/dashboard/GraficoAtividade'
import { GraficoConversao, type ConversaoItem } from '@/components/dashboard/GraficoConversao'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { FollowupItem } from '@/components/dashboard/FollowupItem'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

function pct(realizado: number, meta: number) {
  return meta > 0 ? Math.round((realizado / meta) * 100) : 0
}

function fmtBRL(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor)
}

interface PageProps {
  searchParams: Promise<{ meses?: string; ano?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  try {
  const user = await requireAuth()
  const params = await searchParams
  const now = new Date()
  const mesAtual = now.getMonth() + 1
  const anoAtual = now.getFullYear()

  const ano = Number(params?.ano ?? anoAtual)
  const mesesRaw = params?.meses ?? String(mesAtual)
  const mesesSelecionados = mesesRaw.split(',').map(Number).filter((m) => m >= 1 && m <= 12)

  const metasCols = {
    id: metas.id, mes: metas.mes, ano: metas.ano,
    metaEbitda: metas.metaEbitda, faturamentoNecessario: metas.faturamentoNecessario,
    pipelineNecessario: metas.pipelineNecessario, metaContratos: metas.metaContratos,
    metaPropostas: metas.metaPropostas, metaPropostasValor: metas.metaPropostasValor,
    metaProspeccoes: metas.metaProspeccoes, metaReunioes: metas.metaReunioes,
    realizadoVendas: metas.realizadoVendas, realizadoEbitda: metas.realizadoEbitda,
    realizadoPipeline: metas.realizadoPipeline, realizadoPipelineQtd: metas.realizadoPipelineQtd,
    realizadoPropostas: metas.realizadoPropostas, realizadoPropostasValor: metas.realizadoPropostasValor,
    realizadoProspeccoes: metas.realizadoProspeccoes, realizadoReunioes: metas.realizadoReunioes,
    contratosFechados: metas.contratosFechados,
  }

  const metasData = await db.select(metasCols).from(metas).where(
    and(eq(metas.ano, ano), inArray(metas.mes, mesesSelecionados))
  )

  // Dados de todos os meses do ano para o gráfico de evolução
  const metasTodosOsMeses = await db.select(metasCols).from(metas).where(eq(metas.ano, ano))

  const v    = metasData.reduce((s, m) => s + Number(m.realizadoVendas ?? 0), 0)
  const e    = metasData.reduce((s, m) => s + Number(m.realizadoEbitda ?? 0), 0)
  const p    = metasData.reduce((s, m) => s + Number(m.realizadoPipeline ?? 0), 0)
  const pQtd = metasData.reduce((s, m) => s + (m.realizadoPipelineQtd ?? 0), 0)
  const mv   = metasData.reduce((s, m) => s + Number(m.faturamentoNecessario ?? 0), 0)
  const me   = metasData.reduce((s, m) => s + Number(m.metaEbitda ?? 0), 0)
  const mp   = metasData.reduce((s, m) => s + Number(m.pipelineNecessario ?? 0), 0)
  const mpr  = metasData.reduce((s, m) => s + (m.metaPropostas ?? 0), 0)
  const mprV = metasData.reduce((s, m) => s + Number(m.metaPropostasValor ?? 0), 0)
  const rpr  = metasData.reduce((s, m) => s + (m.realizadoPropostas ?? 0), 0)
  const rprV = metasData.reduce((s, m) => s + Number(m.realizadoPropostasValor ?? 0), 0)
  const mprosp  = metasData.reduce((s, m) => s + (m.metaProspeccoes ?? 0), 0)
  const rprosp  = metasData.reduce((s, m) => s + (m.realizadoProspeccoes ?? 0), 0)
  const mreu    = metasData.reduce((s, m) => s + (m.metaReunioes ?? 0), 0)
  const rreu    = metasData.reduce((s, m) => s + (m.realizadoReunioes ?? 0), 0)
  const totalContratos = metasData.reduce((s, m) => s + (m.contratosFechados ?? 0), 0)
  const mcontrat = metasData.reduce((s, m) => s + (m.metaContratos ?? 0), 0)
  const ticketMedio = totalContratos > 0 ? Math.round(v / totalContratos) : 0

  // Follow-ups
  function toBrDate(d: Date | string | null | undefined): string {
    const date = d ? new Date(d) : now
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date)
  }
  const hoje = toBrDate(now)
  const em7dias = new Date(now)
  em7dias.setDate(em7dias.getDate() + 7)
  const em7diasStr = toBrDate(em7dias)

  const fuHoje = await db.select({
    id: contatos.id, nome: contatos.nome, empresa: contatos.empresa,
    status: contatos.status, telefone: contatos.telefone, email: contatos.email, historico: contatos.historico,
  }).from(contatos).where(eq(contatos.proximaAtividade, hoje))

  const fu7dias = await db.select({
    id: contatos.id, nome: contatos.nome, empresa: contatos.empresa,
    status: contatos.status, telefone: contatos.telefone, email: contatos.email, historico: contatos.historico,
    proximaAtividade: contatos.proximaAtividade,
  }).from(contatos).where(
    and(gt(contatos.proximaAtividade, hoje), lte(contatos.proximaAtividade, em7diasStr))
  )

  const fuVencidos = await db.select({
    id: contatos.id, nome: contatos.nome, empresa: contatos.empresa,
    status: contatos.status, telefone: contatos.telefone, email: contatos.email, historico: contatos.historico,
    proximaAtividade: contatos.proximaAtividade,
  }).from(contatos).where(lte(contatos.proximaAtividade, hoje)).limit(20)

  // Follow-ups de Oportunidades (interacoesEge com data_proximo_passo)
  type EgeFu = { id: string; nome: string; localidade: string | null; proximaAtividade: string; ultimaInteracao: string | null }
  let egeHoje: EgeFu[] = [], ege7dias: EgeFu[] = [], egeVencidos: EgeFu[] = []
  try {
    const egeRows = await db
      .select({
        id: clientesEge.id,
        nome: clientesEge.cliente,
        localidade: clientesEge.local,
        proximaAtividade: interacoesEge.dataProximoPasso,
        descricao: interacoesEge.descricao,
        tipo: interacoesEge.tipo,
        dataInteracao: interacoesEge.dataInteracao,
      })
      .from(interacoesEge)
      .innerJoin(clientesEge, eq(interacoesEge.clienteEgeId, clientesEge.id))
      .where(drizzleSql`${interacoesEge.dataProximoPasso} IS NOT NULL`)
      .orderBy(desc(interacoesEge.dataInteracao))

    // Deduplica por cliente (mantém o mais recente com follow-up)
    const visto = new Set<string>()
    const egeDedup: typeof egeRows = []
    for (const r of egeRows) {
      if (!visto.has(r.id)) { visto.add(r.id); egeDedup.push(r) }
    }

    const toEgeFu = (r: typeof egeRows[0]): EgeFu => ({
      id: r.id,
      nome: r.nome,
      localidade: r.localidade,
      proximaAtividade: r.proximaAtividade as string,
      ultimaInteracao: r.dataInteracao
        ? `${new Date(r.dataInteracao as unknown as string).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })} — ${r.tipo}${r.descricao ? ': ' + r.descricao : ''}`
        : null,
    })

    egeHoje    = egeDedup.filter(r => r.proximaAtividade === hoje).map(toEgeFu)
    ege7dias   = egeDedup.filter(r => r.proximaAtividade && r.proximaAtividade > hoje && r.proximaAtividade <= em7diasStr).map(toEgeFu)
    egeVencidos = egeDedup.filter(r => r.proximaAtividade && r.proximaAtividade < hoje).map(toEgeFu)
  } catch { /* interacoes_ege pode não existir */ }

  // Interações EGE do mês selecionado — para breakdown no gauge de Prospecções
  const mesStr = String(mesesSelecionados[mesesSelecionados.length - 1]).padStart(2, '0')
  const prefixoMes = `${ano}-${mesStr}`
  let egeInteracoesMes = 0
  let egeReunioesMes = 0
  let egePropostasMes = 0
  try {
    const egeCount = await db
      .select({ tipo: interacoesEge.tipo, dataInteracao: interacoesEge.dataInteracao })
      .from(interacoesEge)
      .where(drizzleSql`to_char(${interacoesEge.dataInteracao}, 'YYYY-MM') = ${prefixoMes}`)
    egeInteracoesMes = egeCount.length
    egeReunioesMes   = egeCount.filter(i => i.tipo === 'Reunião').length
    egePropostasMes  = egeCount.filter(i => i.tipo === 'Proposta').length
  } catch { /* tabela pode não existir */ }

  // Atividade comercial — interações do ano corrente (para gráfico com filtro de mês)
  const inicioAno = `${anoAtual}-01-01`

  const interacoesCrm = await db
    .select({
      tipo: interacoes.tipo,
      dataInteracao: interacoes.dataInteracao,
      contatoId: interacoes.contatoId,
      nomeContato: contatos.nome,
      empresaContato: contatos.empresa,
      gerouOportunidade: interacoes.gerouOportunidade,
      servicoOportunidade: interacoes.servicoOportunidade,
    })
    .from(interacoes)
    .leftJoin(contatos, eq(interacoes.contatoId, contatos.id))
    .where(drizzleSql`${interacoes.dataInteracao} >= ${inicioAno}::date`)

  let interacoesEgeAtiv: { tipo: string; dataInteracao: Date | null; gerouOportunidade: boolean | null; servicoOportunidade: string | null; clienteEgeId: string | null; nomeCliente: string | null }[] = []
  try {
    interacoesEgeAtiv = await db
      .select({
        tipo: interacoesEge.tipo,
        dataInteracao: interacoesEge.dataInteracao,
        gerouOportunidade: interacoesEge.gerouOportunidade,
        servicoOportunidade: interacoesEge.servicoOportunidade,
        clienteEgeId: interacoesEge.clienteEgeId,
        nomeCliente: clientesEge.cliente,
      })
      .from(interacoesEge)
      .leftJoin(clientesEge, eq(interacoesEge.clienteEgeId, clientesEge.id))
      .where(drizzleSql`${interacoesEge.dataInteracao} >= ${inicioAno}::timestamptz`)
  } catch { /* tabela pode não existir */ }

  // Eventos CRM do ano (prospecao/proposta/reuniao por mudança de status)
  type CrmEventoRow = { tipo: string; createdAt: Date | null; contatoId: string | null; canal: string | null; empresa: string | null; nome: string | null; gerouOportunidade: boolean | null; servicoOportunidade: string | null }
  let eventosCrm: CrmEventoRow[] = []
  try {
    eventosCrm = await db
      .select({
        tipo: crmEventos.tipo,
        createdAt: crmEventos.createdAt,
        contatoId: crmEventos.contatoId,
        canal: contatos.canal,
        empresa: contatos.empresa,
        nome: contatos.nome,
        gerouOportunidade: contatos.gerouOportunidade,
        servicoOportunidade: contatos.servicoOportunidade,
      })
      .from(crmEventos)
      .leftJoin(contatos, eq(crmEventos.contatoId, contatos.id))
      .where(drizzleSql`EXTRACT(YEAR FROM ${crmEventos.createdAt}) = ${anoAtual}`)
  } catch { /* tabela pode não existir */ }

  // Mapeia tipo de evento CRM → tipo de interação para o gráfico
  function eventoParaTipo(tipo: string, canal: string | null): string {
    if (tipo === 'proposta') return 'Proposta'
    if (tipo === 'reuniao') return 'Reunião'
    // prospecao → usa o canal do contato
    return canal ?? 'Outro'
  }

  const atividadeItens: AtividadeItem[] = [
    // Logs detalhados de interação (Ligação/WhatsApp/Email registrados manualmente)
    ...interacoesCrm.map(i => ({
      tipo: i.tipo,
      data: toBrDate(i.dataInteracao),
      fonte: 'crm' as const,
    })),
    // Eventos de status CRM (prospecao/proposta/reuniao)
    ...eventosCrm.map(i => ({
      tipo: eventoParaTipo(i.tipo, i.canal),
      data: toBrDate(i.createdAt),
      fonte: 'crm' as const,
    })),
    ...interacoesEgeAtiv.map(i => ({
      tipo: i.tipo,
      data: toBrDate(i.dataInteracao as unknown as string | null),
      fonte: 'ege' as const,
    })),
  ]

  // Contatos CRM marcados como oportunidade no formulário (sem evento associado no sistema)
  const contatosCrmOportunidade = await db
    .select({
      id: contatos.id,
      nome: contatos.nome,
      empresa: contatos.empresa,
      servicoOportunidade: contatos.servicoOportunidade,
      updatedAt: contatos.updatedAt,
    })
    .from(contatos)
    .where(eq(contatos.gerouOportunidade, true))

  // IDs que já aparecem via eventosCrm (para evitar duplicata)
  const idsComEvento = new Set(eventosCrm.map(e => e.contatoId).filter(Boolean))

  // EGE: todas as interações são "contatos", gerouOportunidade=true são oportunidades
  // CRM: eventos de status são a base de contatos; oportunidade vem do flag do contato ou da interação manual
  const conversaoItens: ConversaoItem[] = [
    ...interacoesEgeAtiv.map(i => ({
      data: toBrDate(i.dataInteracao as unknown as string | null),
      gerouOportunidade: i.gerouOportunidade ?? false,
      fonte: 'ege' as const,
      clienteNome: i.nomeCliente ?? undefined,
      clienteId: i.clienteEgeId ?? undefined,
      servico: i.servicoOportunidade ?? undefined,
    })),
    // Eventos CRM → oportunidade se o contato foi marcado como oportunidade (via FormContato)
    ...eventosCrm.map(i => ({
      data: toBrDate(i.createdAt),
      gerouOportunidade: i.gerouOportunidade ?? false,
      fonte: 'crm' as const,
      clienteNome: (i.gerouOportunidade) ? (i.empresa ?? i.nome ?? undefined) : undefined,
      clienteId: i.contatoId ?? undefined,
      servico: i.gerouOportunidade ? (i.servicoOportunidade ?? undefined) : undefined,
    })),
    // Logs manuais CRM — oportunidade se flag manual OU se tipo é Proposta/Reunião
    ...interacoesCrm.map(i => {
      const autoOport = i.tipo === 'Proposta' || i.tipo === 'Reunião'
      const gerou = (i.gerouOportunidade ?? false) || autoOport
      return {
        data: toBrDate(i.dataInteracao),
        gerouOportunidade: gerou,
        fonte: 'crm' as const,
        clienteNome: gerou ? (i.empresaContato ?? i.nomeContato ?? undefined) : undefined,
        clienteId: i.contatoId ?? undefined,
        servico: i.servicoOportunidade ?? undefined,
        tipoInteracao: autoOport ? i.tipo : undefined,
      }
    }),
    // Contatos marcados como oportunidade no FormContato mas SEM evento CRM (ex: adicionados direto)
    ...contatosCrmOportunidade
      .filter(c => !idsComEvento.has(c.id))
      .map(c => ({
        data: toBrDate(c.updatedAt),
        gerouOportunidade: true,
        fonte: 'crm' as const,
        clienteNome: c.empresa ?? c.nome ?? undefined,
        clienteId: c.id,
        servico: c.servicoOportunidade ?? undefined,
      })),
  ]

  // Busca a última interação de cada contato nas listas de follow-up
  const todosIds = [...fuHoje, ...fu7dias, ...fuVencidos].map((c) => c.id)
  const ultimasInter = todosIds.length > 0
    ? await db.select({
        contatoId: interacoes.contatoId,
        tipo: interacoes.tipo,
        descricao: interacoes.descricao,
        dataInteracao: interacoes.dataInteracao,
      }).from(interacoes)
        .where(inArray(interacoes.contatoId, [...new Set(todosIds)]))
        .orderBy(desc(interacoes.dataInteracao))
    : []

  // Mapa: contatoId → texto da última interação
  const ultimaInterMap: Record<string, string> = {}
  for (const i of ultimasInter) {
    if (!i.contatoId || ultimaInterMap[i.contatoId]) continue
    const dataStr = i.dataInteracao
      ? new Date(i.dataInteracao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })
      : ''
    ultimaInterMap[i.contatoId] = [dataStr, i.tipo, i.descricao].filter(Boolean).join(' — ')
  }

  // ── ANÁLISE DE PROPOSTAS ─────────────────────────────────────────────────
  let propostasData: PropostasData = { rawDeals: [], colunas: [] }
  // Auto-computed gauge actuals (computed below if deals exist)
  let autoVendas = v        // fallback to metas manual values
  let autoPipeline = p
  let autoPropostasQtd = rpr
  let autoPropostasValor = rprV
  let autoProspeccoes = rprosp + egeInteracoesMes
  let autoReunioes = rreu + egeReunioesMes

  try {
    // Busca todos os deals da organização com cidade e serviço do contato
    const dealsRows = await db.select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      status: deals.status,
      temperatura: deals.temperatura,
      lossReason: deals.lossReason,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      contatoId: deals.contatoId,
      cidadeContato: contatos.cidade,
      servicoContato: contatos.servicoOportunidade,
    }).from(deals)
      .leftJoin(contatos, eq(deals.contatoId, contatos.id))
      .where(eq(deals.organizationId, user.organizationId))

    // Busca colunas de temperatura (exceto sistema=false → apenas open cols)
    const colunasRows = await db.select({
      id: dealColunas.id,
      nome: dealColunas.nome,
      cor: dealColunas.cor,
      slug: dealColunas.slug,
      ordem: dealColunas.ordem,
    }).from(dealColunas)
      .where(eq(dealColunas.organizationId, user.organizationId))

    // ── Auto-computar reais dos gauges a partir dos dados reais ─────────────
    // Vendas = won deals com updatedAt no(s) mês(es) selecionado(s) do ano
    const wonPeriodo = dealsRows.filter(d => {
      if (d.status !== 'won' || !d.updatedAt) return false
      const dt = new Date(d.updatedAt)
      return dt.getFullYear() === ano && mesesSelecionados.includes(dt.getMonth() + 1)
    })
    autoVendas = wonPeriodo.reduce((s, d) => s + (d.value ? Number(d.value) : 0), 0)

    // Pipeline = open deals atuais (snapshot, sem filtro de período)
    const openDeals = dealsRows.filter(d => d.status === 'open')
    autoPipeline = openDeals.reduce((s, d) => s + (d.value ? Number(d.value) : 0), 0)

    // Propostas = deals criados no período
    const criadasPeriodo = dealsRows.filter(d => {
      if (!d.createdAt) return false
      const dt = new Date(d.createdAt)
      return dt.getFullYear() === ano && mesesSelecionados.includes(dt.getMonth() + 1)
    })
    autoPropostasQtd = criadasPeriodo.length
    autoPropostasValor = criadasPeriodo.reduce((s, d) => s + (d.value ? Number(d.value) : 0), 0)

    // Prospecções e Reuniões = interacoes do período (CRM) + EGE
    const interPeriodo = interacoesCrm.filter(i => {
      if (!i.dataInteracao) return false
      const dt = new Date(i.dataInteracao)
      return dt.getFullYear() === ano && mesesSelecionados.includes(dt.getMonth() + 1)
    })
    autoProspeccoes = interPeriodo.length + egeInteracoesMes
    autoReunioes = interPeriodo.filter(i => i.tipo === 'Reunião').length + egeReunioesMes

    // ── Serializar dados brutos para o componente cliente ───────────────────
    const rawDeals: RawDeal[] = dealsRows.map(d => ({
      id: d.id,
      title: d.title,
      value: d.value ? Number(d.value) : null,
      status: d.status ?? 'open',
      temperatura: d.temperatura ?? null,
      lossReason: d.lossReason ?? null,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
      cidadeContato: d.cidadeContato ?? null,
      servicoContato: d.servicoContato ?? null,
    }))

    const colunas: DealColunaMeta[] = colunasRows
      .filter(c => c.slug !== 'perdida' && c.slug !== 'ganho')
      .map(c => ({ slug: c.slug, nome: c.nome, cor: c.cor, ordem: c.ordem }))

    propostasData = { rawDeals, colunas }
  } catch { /* deals pode não existir ainda */ }

  const labelMeses = mesesSelecionados.length === 1
    ? new Date(ano, mesesSelecionados[0] - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : `${mesesSelecionados.length} meses — ${ano}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B4F8A]">Dashboard</h1>
        <span className="text-sm text-gray-500 capitalize">{labelMeses}</span>
      </div>

      <Suspense fallback={null}>
        <DashboardFilters defaultMes={mesAtual} defaultAno={anoAtual} />
      </Suspense>

      <DashboardPropostas data={propostasData} />

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-1">% Atingido da Meta</h2>
        <p className="text-[11px] text-gray-400 mb-4">Calculado automaticamente a partir dos dados reais do período selecionado</p>
        <div className="flex flex-wrap gap-6 justify-around">
          <GaugeChart label="Vendas" pct={pct(autoVendas, mv)} tooltip={`${fmtBRL(autoVendas)} de ${fmtBRL(mv)}`} />
          <GaugeChart label="Pipeline" pct={pct(autoPipeline, mp)} tooltip={`${fmtBRL(autoPipeline)} de ${fmtBRL(mp)}`} sublabel="atual" />
          <GaugeChart
            label="Propostas"
            pct={pct(autoPropostasQtd, mpr)}
            tooltip={`${autoPropostasQtd} criadas · ${fmtBRL(autoPropostasValor)} de ${fmtBRL(mprV)}`}
            sublabel={`${autoPropostasQtd} de ${mpr}`}
          />
          <GaugeChart
            label="Prospecções"
            pct={pct(autoProspeccoes, mprosp)}
            tooltip={`${autoProspeccoes} interações de ${mprosp} meta`}
            sublabel={`${autoProspeccoes} total`}
          />
          <GaugeChart
            label="Reuniões"
            pct={pct(autoReunioes, mreu)}
            tooltip={`${autoReunioes} reuniões de ${mreu} meta`}
            sublabel={`${autoReunioes} de ${mreu}`}
          />
        </div>
      </div>

      <GraficoEvolucao dados={metasTodosOsMeses} />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GraficoAtividade itens={atividadeItens} hoje={hoje} />
        </div>
        <GraficoConversao itens={conversaoItens} hoje={hoje} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Follow-ups Hoje</h2>
            <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">{fuHoje.length + egeHoje.length}</span>
          </div>
          {fuHoje.length === 0 && egeHoje.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum follow-up para hoje.</p>
          ) : (
            <ul className="space-y-0.5">
              {fuHoje.map((c) => (
                <FollowupItem key={c.id} id={c.id} nome={c.nome} empresa={c.empresa} telefone={c.telefone} email={c.email} status={c.status} historico={c.historico} ultimaInteracao={ultimaInterMap[c.id] ?? null} />
              ))}
              {egeHoje.map((c) => (
                <FollowupItem key={'ege-' + c.id} id={c.id} nome={c.nome} empresa={c.localidade} proximaAtividade={c.proximaAtividade} ultimaInteracao={c.ultimaInteracao} fonte="ege" />
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Próximos 7 dias</h2>
            <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">{fu7dias.length + ege7dias.length}</span>
          </div>
          {fu7dias.length === 0 && ege7dias.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum follow-up nos próximos 7 dias.</p>
          ) : (
            <ul className="space-y-0.5">
              {fu7dias.map((c) => (
                <FollowupItem key={c.id} id={c.id} nome={c.nome} empresa={c.empresa} telefone={c.telefone} email={c.email} status={c.status} historico={c.historico} proximaAtividade={c.proximaAtividade} ultimaInteracao={ultimaInterMap[c.id] ?? null} />
              ))}
              {ege7dias.map((c) => (
                <FollowupItem key={'ege-' + c.id} id={c.id} nome={c.nome} empresa={c.localidade} proximaAtividade={c.proximaAtividade} ultimaInteracao={c.ultimaInteracao} fonte="ege" />
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Follow-ups Vencidos</h2>
            <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">{fuVencidos.length + egeVencidos.length}</span>
          </div>
          {fuVencidos.length === 0 && egeVencidos.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum follow-up vencido.</p>
          ) : (
            <ul className="space-y-0.5">
              {fuVencidos.map((c) => (
                <FollowupItem key={c.id} id={c.id} nome={c.nome} empresa={c.empresa} telefone={c.telefone} email={c.email} status={c.status} historico={c.historico} proximaAtividade={c.proximaAtividade} ultimaInteracao={ultimaInterMap[c.id] ?? null} />
              ))}
              {egeVencidos.map((c) => (
                <FollowupItem key={'ege-' + c.id} id={c.id} nome={c.nome} empresa={c.localidade} proximaAtividade={c.proximaAtividade} ultimaInteracao={c.ultimaInteracao} fonte="ege" />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Dashboard] erro:', msg)
    return (
      <div className="p-8">
        <h1 className="text-red-600 font-bold text-lg mb-2">Erro ao carregar dashboard</h1>
        <pre className="bg-red-50 border border-red-200 rounded p-4 text-xs text-red-800 whitespace-pre-wrap">{msg}</pre>
        <p className="mt-4 text-sm text-gray-500">Envie esta mensagem para o suporte.</p>
      </div>
    )
  }
}
