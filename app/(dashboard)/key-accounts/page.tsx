import { db } from '@/lib/db'
import { keyAccounts, kaStakeholders, kaVisitas } from '@/lib/schema'
import { eq, sql, desc, isNull, isNotNull } from 'drizzle-orm'
import { KAListClient } from '@/components/key-accounts/KAListClient'

export const dynamic = 'force-dynamic'

export default async function KeyAccountsPage() {
  // Apenas contas não arquivadas
  const contas = await db
    .select({
      id: keyAccounts.id,
      nome: keyAccounts.nome,
      segmento: keyAccounts.segmento,
      cidade: keyAccounts.cidade,
      estado: keyAccounts.estado,
      status: keyAccounts.status,
      prioridade: keyAccounts.prioridade,
      potencialEstimado: keyAccounts.potencialEstimado,
      receitaAnual: keyAccounts.receitaAnual,
      healthScore: keyAccounts.healthScore,
      healthStatus: keyAccounts.healthStatus,
      proximaAcao: keyAccounts.proximaAcao,
      proximaAcaoData: keyAccounts.proximaAcaoData,
      proximaAcaoResponsavel: keyAccounts.proximaAcaoResponsavel,
      updatedAt: keyAccounts.updatedAt,
    })
    .from(keyAccounts)
    .where(isNull(keyAccounts.archivedAt))
    .orderBy(desc(keyAccounts.updatedAt))

  // Stakeholders por conta
  const stCount = await db
    .select({ kaId: kaStakeholders.keyAccountId, total: sql<number>`count(*)::int` })
    .from(kaStakeholders)
    .groupBy(kaStakeholders.keyAccountId)

  // Última visita por conta
  const ultimasVisitas = await db
    .select({ kaId: kaVisitas.keyAccountId, data: sql<string>`max(${kaVisitas.data})` })
    .from(kaVisitas)
    .groupBy(kaVisitas.keyAccountId)

  const stMap = Object.fromEntries(stCount.map(r => [r.kaId, r.total]))
  const visitaMap = Object.fromEntries(ultimasVisitas.map(r => [r.kaId, r.data]))

  const lista = contas.map(c => ({
    ...c,
    totalStakeholders: stMap[c.id] ?? 0,
    ultimaVisita: visitaMap[c.id] ?? null,
  }))

  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const limite30d = new Date()
  limite30d.setDate(limite30d.getDate() - 30)
  const limite30dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(limite30d)

  // KPIs dashboard
  const totalAtivas = lista.filter(c => c.status === 'Ativa').length
  const totalContatos = Object.values(stMap).reduce((s, v) => s + v, 0)
  const semVisitaRecente = lista.filter(c =>
    c.status === 'Ativa' && (!c.ultimaVisita || c.ultimaVisita < limite30dStr)
  ).length
  const semProximaAcao = lista.filter(c => c.status === 'Ativa' && !c.proximaAcao).length

  // Saúde
  const saudaveis = lista.filter(c => c.healthStatus === 'SAUDAVEL').length
  const atencao = lista.filter(c => c.healthStatus === 'ATENCAO').length
  const criticas = lista.filter(c => c.healthStatus === 'CRITICA' || (c.status === 'Ativa' && !c.healthStatus)).length

  // Potencial total
  const potencialTotal = lista.reduce((s, c) =>
    s + (c.potencialEstimado ? Number(c.potencialEstimado) : 0), 0)

  const stats = {
    total: lista.length, totalAtivas, totalContatos,
    semVisitaRecente, semProximaAcao,
    saudaveis, atencao, criticas, potencialTotal,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4F8A]">Key Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dashboard executivo · stakeholders, plano e ações por conta em <a href="/oportunidades" className="text-[#1B4F8A] hover:underline font-medium">Oportunidades →</a></p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard valor={lista.length} label="Contas cadastradas" cor="blue" />
        <KpiCard valor={totalAtivas} label="Ativas" cor="green" />
        <KpiCard valor={totalContatos} label="Stakeholders" cor="blue" />
        <KpiCard valor={semVisitaRecente} label="Sem visita 30 dias" cor={semVisitaRecente > 0 ? 'amber' : 'gray'} />
      </div>

      {/* Saúde + Potencial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Saúde das Contas</h3>
          <div className="flex gap-4">
            <SaudeItem valor={saudaveis} label="Saudáveis" cor="emerald" />
            <SaudeItem valor={atencao} label="Atenção" cor="yellow" />
            <SaudeItem valor={criticas} label="Críticas" cor="red" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Potencial Total</h3>
          <p className="text-2xl font-bold text-[#1B4F8A]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(potencialTotal)}
          </p>
          {semProximaAcao > 0 && (
            <p className="text-xs text-amber-600 mt-2">⚠ {semProximaAcao} conta{semProximaAcao > 1 ? 's' : ''} ativa{semProximaAcao > 1 ? 's' : ''} sem próxima ação</p>
          )}
        </div>
      </div>

      <KAListClient lista={lista} hoje={hoje} stats={stats} />
    </div>
  )
}

function KpiCard({ valor, label, cor }: { valor: number; label: string; cor: string }) {
  const cores: Record<string, string> = {
    blue: 'text-[#1B4F8A]', green: 'text-emerald-600',
    amber: 'text-amber-600', gray: 'text-gray-400',
  }
  return (
    <div className="bg-white rounded-xl border px-4 py-3">
      <div className={`text-2xl font-bold ${cores[cor] ?? cores.blue}`}>{valor}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function SaudeItem({ valor, label, cor }: { valor: number; label: string; cor: string }) {
  const cores: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
  }
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xl font-bold w-8 text-center rounded ${cores[cor]}`}>{valor}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
