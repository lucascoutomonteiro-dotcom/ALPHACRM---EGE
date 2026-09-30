'use client'

import { useMemo, useState } from 'react'
import { Trophy, XCircle, Target, Clock, Flame, Zap, MapPin, Calendar } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export type RawDeal = {
  id: string
  title: string
  value: number | null
  status: string
  temperatura: string | null
  lossReason: string | null
  createdAt: string | null
  updatedAt: string | null
  cidadeContato: string | null
  servicoContato: string | null
}

export type DealColunaMeta = {
  slug: string | null
  nome: string
  cor: string
  ordem: number
}

export type PropostasData = {
  rawDeals: RawDeal[]
  colunas: DealColunaMeta[]
}

// ─── Filter types ─────────────────────────────────────────────────────────────
type FilterPeriod = 'hoje' | 'semana' | 'mes' | '6m' | '12m' | 'custom'

const FILTER_OPTS: { value: FilterPeriod; label: string }[] = [
  { value: 'hoje',   label: 'Hoje' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes',    label: 'Este mês' },
  { value: '6m',     label: 'Últimos 6 meses' },
  { value: '12m',    label: 'Últimos 12 meses' },
  { value: 'custom', label: 'Personalizado' },
]

function getRange(period: FilterPeriod, start: string, end: string): [Date, Date] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'hoje')   return [today, new Date()]
  if (period === 'semana') { const s = new Date(today); s.setDate(s.getDate() - 6); return [s, new Date()] }
  if (period === 'mes')    return [new Date(now.getFullYear(), now.getMonth(), 1), new Date()]
  if (period === '6m')     { const s = new Date(now); s.setMonth(s.getMonth() - 6); return [s, new Date()] }
  if (period === '12m')    { const s = new Date(now); s.setMonth(s.getMonth() - 12); return [s, new Date()] }
  return [new Date(start + 'T00:00:00'), new Date(end + 'T23:59:59')]
}

function getPeriodLabel(p: FilterPeriod, start: string, end: string) {
  if (p === 'hoje')   return 'Hoje'
  if (p === 'semana') return 'Esta semana'
  if (p === 'mes')    return 'Este mês'
  if (p === '6m')     return 'Últimos 6 meses'
  if (p === '12m')    return 'Últimos 12 meses'
  return `${new Date(start).toLocaleDateString('pt-BR')} – ${new Date(end).toLocaleDateString('pt-BR')}`
}

// ─── Section filter hook ──────────────────────────────────────────────────────
function useSF(def: FilterPeriod = '12m') {
  const [period, setPeriod] = useState<FilterPeriod>(def)
  const [start, setStart]   = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 12); return d.toISOString().slice(0, 10) })
  const [end, setEnd]       = useState(() => new Date().toISOString().slice(0, 10))
  const range = useMemo(() => getRange(period, start, end), [period, start, end])
  const label = getPeriodLabel(period, start, end)
  return { range, label, dp: { period, setPeriod, start, setStart, end, setEnd } }
}

type SFDp = ReturnType<typeof useSF>['dp']

function inRange(iso: string | null, [s, e]: [Date, Date]) {
  if (!iso) return false
  const d = new Date(iso)
  return d >= s && d <= e
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function FD({ dp }: { dp: SFDp }) {
  const { period, setPeriod, start, setStart, end, setEnd } = dp
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
      <select value={period} onChange={e => setPeriod(e.target.value as FilterPeriod)}
        className="text-xs border rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] cursor-pointer">
        {FILTER_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {period === 'custom' && (
        <>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
          <span className="text-xs text-gray-400">–</span>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
        </>
      )}
    </div>
  )
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function brl(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}
function pct(v: number) { return `${Math.round(v)}%` }
function fmtDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color, negative }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; negative?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border p-4 flex flex-col gap-2.5">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <div className={`text-xl font-bold leading-tight ${negative ? 'text-red-600' : 'text-[#1A1A2E]'}`}>{value}</div>
        {sub && <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">{sub}</div>}
      </div>
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</div>
    </div>
  )
}

// ─── Section header with filter ───────────────────────────────────────────────
function SHeader({ title, sub, dp }: { title: string; sub?: string; dp: SFDp }) {
  return (
    <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
      <div>
        <h3 className="text-sm font-bold text-[#1A1A2E]">{title}</h3>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <FD dp={dp} />
    </div>
  )
}

// ─── Horizontal bar ───────────────────────────────────────────────────────────
function HBar({ rank, label, value, valueLabel, max, color, sub }: {
  rank?: number; label: string; value: number; valueLabel: string; max: number; color: string; sub?: string
}) {
  const w = max > 0 ? Math.max((value / max) * 100, 3) : 0
  return (
    <div className="flex items-start gap-2">
      {rank != null && <span className="text-[10px] font-bold text-gray-300 w-4 pt-1 shrink-0">{rank}</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-gray-600 truncate">{label}</span>
          <span className="text-xs font-bold text-gray-800 shrink-0 ml-2">{valueLabel}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${w}%`, backgroundColor: color }} />
        </div>
        {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// ─── Donut ────────────────────────────────────────────────────────────────────
function Donut({ slices, size = 110 }: { slices: { label: string; value: number; color: string }[]; size?: number }) {
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="flex items-center justify-center h-28 text-xs text-gray-300">Sem dados</div>
  const r = 42, cx = 55, cy = 55, stroke = 18
  let angle = -Math.PI / 2
  const arcs = slices.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle)
    angle += sweep
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle)
    return { ...d, x1, y1, x2, y2, large: sweep > Math.PI ? 1 : 0, sweep }
  })
  return (
    <svg viewBox="0 0 110 110" width={size} height={size}>
      {arcs.map((a, i) => a.sweep < 0.01 ? null : (
        <path key={i} d={`M ${a.x1} ${a.y1} A ${r} ${r} 0 ${a.large} 1 ${a.x2} ${a.y2}`}
          fill="none" stroke={a.color} strokeWidth={stroke} />
      ))}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1A1A2E">{total}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill="#9CA3AF">total</text>
    </svg>
  )
}

const MOTIVO_COLORS = ['#EF4444', '#FBBF24', '#60A5FA', '#9CA3AF', '#A855F7', '#F97316']

// ─── Main component ───────────────────────────────────────────────────────────
export function DashboardPropostas({ data }: { data: PropostasData }) {
  const colunasMap = useMemo(() =>
    new Map(data.colunas.map(c => [c.slug ?? '', c])), [data.colunas])

  const sumVal = (arr: RawDeal[]) => arr.reduce((s, d) => s + (d.value ?? 0), 0)

  function cicloMedio(arr: RawDeal[]) {
    const v = arr.filter(d => d.createdAt && d.updatedAt)
    if (!v.length) return 0
    return Math.round(v.reduce((s, d) =>
      s + (new Date(d.updatedAt!).getTime() - new Date(d.createdAt!).getTime()) / 86400000, 0) / v.length)
  }

  // ── Per-section filters ───────────────────────────────────────────────────
  const kpiF    = useSF('12m')
  const servicoF = useSF('12m')
  const vendeF  = useSF('12m')
  const motivoF = useSF('12m')
  const perdaF  = useSF('12m')
  const tempF   = useSF('mes')
  const funilF  = useSF('12m')

  // ── KPI computed ─────────────────────────────────────────────────────────
  const kpiWon    = useMemo(() => data.rawDeals.filter(d => d.status === 'won'  && inRange(d.updatedAt, kpiF.range)), [data.rawDeals, kpiF.range])
  const kpiLost   = useMemo(() => data.rawDeals.filter(d => d.status === 'lost' && inRange(d.updatedAt, kpiF.range)), [data.rawDeals, kpiF.range])
  const kpiOpen   = useMemo(() => data.rawDeals.filter(d => d.status === 'open'), [data.rawDeals])
  const kpiAll    = useMemo(() => data.rawDeals.filter(d => inRange(d.createdAt, kpiF.range)), [data.rawDeals, kpiF.range])
  const kpiQuente = useMemo(() => kpiOpen.filter(d => d.temperatura === 'quente'), [kpiOpen])
  const kpiDecididas = kpiWon.length + kpiLost.length
  const kpiTaxa      = kpiDecididas > 0 ? (kpiWon.length / kpiDecididas) * 100 : 0
  const kpiTM        = kpiWon.length > 0 ? Math.round(sumVal(kpiWon) / kpiWon.length) : 0

  // ── Serviços vendidos ─────────────────────────────────────────────────────
  const servicoDeals  = useMemo(() => data.rawDeals.filter(d => d.status === 'won' && inRange(d.updatedAt, servicoF.range)), [data.rawDeals, servicoF.range])
  const servicosGanho = useMemo(() => {
    const m: Record<string, { valor: number; qtd: number }> = {}
    for (const d of servicoDeals) {
      const s = d.servicoContato?.trim(); if (!s) continue
      if (!m[s]) m[s] = { valor: 0, qtd: 0 }
      m[s].valor += d.value ?? 0; m[s].qtd++
    }
    return Object.entries(m).map(([servico, v]) => ({ servico, ...v })).sort((a, b) => b.valor - a.valor)
  }, [servicoDeals])

  // ── Onde Vendeu ───────────────────────────────────────────────────────────
  const vendeDeals  = useMemo(() => data.rawDeals.filter(d => d.status === 'won' && inRange(d.updatedAt, vendeF.range)), [data.rawDeals, vendeF.range])
  const regiaoGanho = useMemo(() => {
    const m: Record<string, { valor: number; qtd: number }> = {}
    for (const d of vendeDeals) {
      const c = d.cidadeContato?.trim(); if (!c) continue
      if (!m[c]) m[c] = { valor: 0, qtd: 0 }
      m[c].valor += d.value ?? 0; m[c].qtd++
    }
    return Object.entries(m).map(([cidade, v]) => ({ cidade, ...v })).sort((a, b) => b.valor - a.valor)
  }, [vendeDeals])

  // ── Motivos de perda ──────────────────────────────────────────────────────
  const motivoDeals = useMemo(() => data.rawDeals.filter(d => d.status === 'lost' && inRange(d.updatedAt, motivoF.range)), [data.rawDeals, motivoF.range])
  const motivosPerda = useMemo(() => {
    const m: Record<string, { qtd: number; valor: number }> = {}
    for (const d of motivoDeals) {
      const k = d.lossReason?.trim() || 'Não informado'
      if (!m[k]) m[k] = { qtd: 0, valor: 0 }
      m[k].qtd++; m[k].valor += d.value ?? 0
    }
    return Object.entries(m).map(([motivo, v]) => ({ motivo, ...v })).sort((a, b) => b.qtd - a.qtd)
  }, [motivoDeals])

  // ── Onde Perdeu ───────────────────────────────────────────────────────────
  const perdaDeals  = useMemo(() => data.rawDeals.filter(d => d.status === 'lost' && inRange(d.updatedAt, perdaF.range)), [data.rawDeals, perdaF.range])
  const regiaoPerda = useMemo(() => {
    const m: Record<string, { valor: number; qtd: number }> = {}
    for (const d of perdaDeals) {
      const c = d.cidadeContato?.trim(); if (!c) continue
      if (!m[c]) m[c] = { valor: 0, qtd: 0 }
      m[c].valor += d.value ?? 0; m[c].qtd++
    }
    return Object.entries(m).map(([cidade, v]) => ({ cidade, ...v })).sort((a, b) => b.valor - a.valor)
  }, [perdaDeals])

  // ── Pipeline por temperatura ──────────────────────────────────────────────
  const tempDeals = useMemo(() => data.rawDeals.filter(d => d.status === 'open' && inRange(d.createdAt, tempF.range)), [data.rawDeals, tempF.range])
  const porTemp   = useMemo(() => {
    const m: Record<string, { nome: string; cor: string; ordem: number; valor: number; qtd: number }> = {}
    for (const d of tempDeals) {
      const key = d.temperatura ?? 'morno'
      const col = colunasMap.get(key) ?? data.colunas[0]
      if (!col) continue
      if (!m[key]) m[key] = { nome: col.nome, cor: col.cor, ordem: col.ordem, valor: 0, qtd: 0 }
      m[key].valor += d.value ?? 0; m[key].qtd++
    }
    return Object.values(m).filter(t => t.qtd > 0).sort((a, b) => a.ordem - b.ordem)
  }, [tempDeals, colunasMap, data.colunas])

  // ── Funil ─────────────────────────────────────────────────────────────────
  const funilDeals = useMemo(() => data.rawDeals.filter(d => inRange(d.createdAt, funilF.range)), [data.rawDeals, funilF.range])
  const funilOpen  = useMemo(() => funilDeals.filter(d => d.status === 'open'), [funilDeals])
  const funilWon   = useMemo(() => funilDeals.filter(d => d.status === 'won'),  [funilDeals])
  const funilLost  = useMemo(() => funilDeals.filter(d => d.status === 'lost'), [funilDeals])
  const funil = useMemo(() => [
    { label: 'Criadas no período', qtd: funilDeals.length, valor: sumVal(funilDeals) },
    { label: 'Em negociação',      qtd: funilOpen.length,  valor: sumVal(funilOpen)  },
    { label: 'Ganhas',             qtd: funilWon.length,   valor: sumVal(funilWon)   },
  ], [funilDeals, funilOpen, funilWon])
  const funilTaxa = (funilWon.length + funilLost.length) > 0
    ? (funilWon.length / (funilWon.length + funilLost.length)) * 100 : 0

  // Maxes
  const maxGanho   = Math.max(...regiaoGanho.map(r => r.valor), 1)
  const maxPerda   = Math.max(...regiaoPerda.map(r => r.valor), 1)
  const maxMotivo  = Math.max(...motivosPerda.map(m => m.qtd), 1)
  const maxServico = Math.max(...servicosGanho.map(s => s.valor), 1)
  const maxTemp    = Math.max(...porTemp.map(t => t.valor), 1)
  const maxFunil   = funil[0]?.qtd || 1

  return (
    <div className="space-y-5">
      {/* ── Divisor ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B4F8A]/8 border border-[#1B4F8A]/20">
          <Target className="h-3.5 w-3.5 text-[#1B4F8A]" />
          <span className="text-xs font-semibold text-[#1B4F8A] uppercase tracking-wider">Análise de Propostas</span>
        </div>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border px-5 py-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Período dos indicadores</p>
          <FD dp={kpiF.dp} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard icon={<Trophy className="h-4 w-4 text-green-600" />}   color="bg-green-50"  label="Total Ganho"
            value={brl(sumVal(kpiWon))} sub={`${kpiWon.length} propostas · TM ${brl(kpiTM)}`} />
          <KPICard icon={<Flame className="h-4 w-4 text-orange-500" />}  color="bg-orange-50" label="Pipeline Quente"
            value={brl(sumVal(kpiQuente))} sub={`${kpiQuente.length} quentes · total: ${brl(sumVal(kpiOpen))}`} />
          <KPICard icon={<Zap className="h-4 w-4 text-yellow-500" />}    color="bg-yellow-50" label="Propostas Criadas"
            value={brl(sumVal(kpiAll))} sub={`${kpiAll.length} no período`} />
          <KPICard icon={<XCircle className="h-4 w-4 text-red-500" />}   color="bg-red-50"    label="Total Perdido"
            value={brl(sumVal(kpiLost))} sub={`${kpiLost.length} perdidas`} negative />
          <KPICard icon={<Target className="h-4 w-4 text-[#1B4F8A]" />} color="bg-blue-50"   label="Taxa de Conversão"
            value={pct(kpiTaxa)} sub={`${kpiWon.length} de ${kpiDecididas} decididas`} />
          <KPICard icon={<Clock className="h-4 w-4 text-cyan-600" />}    color="bg-cyan-50"   label="Ciclo de Venda"
            value={cicloMedio(kpiWon) > 0 ? `${cicloMedio(kpiWon)}d` : '—'}
            sub={cicloMedio(kpiLost) > 0 ? `${cicloMedio(kpiLost)}d até perda` : 'dias médios'} />
        </div>
      </div>

      {/* ── Linha 1: Serviços Vendidos (esq) + Onde Vendeu (dir) ─────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-5">
          <SHeader title="Serviços Vendidos" sub={`Valor ganho por serviço`} dp={servicoF.dp} />
          {servicosGanho.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-gray-300">
              <div className="text-center">
                <p>Nenhum serviço nos contatos vinculados às propostas</p>
                <p className="mt-1 text-[10px]">Preencha o campo "Serviço" no contato da proposta</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {servicosGanho.slice(0, 8).map((s, i) => (
                <HBar key={s.servico} rank={i + 1} label={s.servico}
                  value={s.valor} valueLabel={brl(s.valor)} max={maxServico} color="#1B4F8A"
                  sub={`${s.qtd} proposta${s.qtd !== 1 ? 's' : ''}`} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <SHeader title="Onde Vendeu" sub="Valor ganho por cidade" dp={vendeF.dp} />
          {regiaoGanho.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-xs text-gray-300 gap-2">
              <MapPin className="h-8 w-8" />
              <span>Nenhuma venda com cidade cadastrada</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {regiaoGanho.slice(0, 8).map((r, i) => (
                <HBar key={r.cidade} rank={i + 1} label={r.cidade}
                  value={r.valor} valueLabel={brl(r.valor)} max={maxGanho} color="#22C55E"
                  sub={`${r.qtd} proposta${r.qtd !== 1 ? 's' : ''}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Linha 2: Motivos de Perda (esq) + Onde Perdeu (dir) ──────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-5">
          <SHeader title="Motivos de Perda" sub={`${motivoDeals.length} perdida${motivoDeals.length !== 1 ? 's' : ''}`} dp={motivoF.dp} />
          {motivosPerda.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-gray-300">Nenhuma perda registrada</div>
          ) : (
            <div className="flex gap-5 items-start">
              <Donut slices={motivosPerda.map((m, i) => ({ label: m.motivo, value: m.qtd, color: MOTIVO_COLORS[i % MOTIVO_COLORS.length] }))} size={110} />
              <div className="flex-1 space-y-2.5 pt-1">
                {motivosPerda.map((m, i) => (
                  <HBar key={m.motivo} label={m.motivo}
                    value={m.qtd} valueLabel={`${m.qtd}× · ${brl(m.valor)}`}
                    max={maxMotivo} color={MOTIVO_COLORS[i % MOTIVO_COLORS.length]} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <SHeader title="Onde Perdeu" sub="Valor perdido por cidade" dp={perdaF.dp} />
          {regiaoPerda.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-xs text-gray-300 gap-2">
              <MapPin className="h-8 w-8" />
              <span>Nenhuma perda com cidade cadastrada</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {regiaoPerda.slice(0, 8).map((r, i) => (
                <HBar key={r.cidade} rank={i + 1} label={r.cidade}
                  value={r.valor} valueLabel={brl(r.valor)} max={maxPerda} color="#EF4444"
                  sub={`${r.qtd} proposta${r.qtd !== 1 ? 's' : ''}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Linha 3: Pipeline Temperatura (esq) + Funil (dir) ────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-5">
          <SHeader title="Pipeline por Temperatura" sub="Propostas abertas criadas no período" dp={tempF.dp} />
          {porTemp.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-gray-300">Sem propostas abertas no período</div>
          ) : (
            <div className="space-y-3">
              {porTemp.map(t => (
                <HBar key={t.nome} label={t.nome}
                  value={t.valor} valueLabel={brl(t.valor)} max={maxTemp} color={t.cor}
                  sub={`${t.qtd} proposta${t.qtd !== 1 ? 's' : ''}`} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <SHeader title="Funil de Conversão" sub="Proposta criadas no período" dp={funilF.dp} />
          <div className="space-y-2 mt-1">
            {funil.map((f, i) => {
              const w = Math.max((f.qtd / maxFunil) * 100, 8)
              const colors = ['#1B4F8A', '#3B82F6', '#22C55E']
              return (
                <div key={f.label}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 rounded-lg flex items-center px-3 text-white text-xs font-semibold shrink-0"
                      style={{ width: `${w}%`, minWidth: 56, backgroundColor: colors[i] }}>
                      {f.qtd}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{f.label}</div>
                    <div className="ml-auto text-xs font-bold text-gray-700 shrink-0">{brl(f.valor)}</div>
                  </div>
                  {i < funil.length - 1 && funil[i + 1].qtd > 0 && f.qtd > 0 && (
                    <div className="text-[10px] text-gray-400 ml-1 mb-1">
                      ↓ {Math.round((funil[i + 1].qtd / f.qtd) * 100)}% avançam
                    </div>
                  )}
                </div>
              )
            })}
            <div className="pt-2 border-t text-xs text-gray-500">
              Taxa de conversão: <span className="font-bold text-green-600">{pct(funilTaxa)}</span>
              <span className="text-gray-400 ml-1">das decididas</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Últimas ganhas + perdidas ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Últimas Ganhas */}
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-green-50 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="font-bold text-sm text-[#1A1A2E]">Últimas Ganhas</h3>
          </div>
          {(() => {
            const won = [...data.rawDeals.filter(d => d.status === 'won')]
              .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
              .slice(0, 6)
            return won.length === 0
              ? <p className="text-sm text-gray-400">Nenhuma proposta ganha.</p>
              : (
                <div className="space-y-2">
                  {won.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-green-50/50 border border-green-100">
                      <div className="h-7 w-7 rounded-lg bg-green-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#1A1A2E] truncate">{d.title}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                          {d.cidadeContato && <><MapPin className="h-2.5 w-2.5" />{d.cidadeContato}</>}
                          <span>{fmtDate(d.updatedAt)}</span>
                        </div>
                      </div>
                      {d.value != null && <div className="text-sm font-bold text-green-700 shrink-0">{brl(d.value)}</div>}
                    </div>
                  ))}
                </div>
              )
          })()}
        </div>

        {/* Últimas Perdidas */}
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <h3 className="font-bold text-sm text-[#1A1A2E]">Últimas Perdidas</h3>
          </div>
          {(() => {
            const lost = [...data.rawDeals.filter(d => d.status === 'lost')]
              .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
              .slice(0, 6)
            return lost.length === 0
              ? <p className="text-sm text-gray-400">Nenhuma proposta perdida.</p>
              : (
                <div className="space-y-2">
                  {lost.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50/40 border border-red-100">
                      <div className="h-7 w-7 rounded-lg bg-red-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#1A1A2E] truncate">{d.title}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                          {d.lossReason && <span className="px-1 py-0.5 bg-red-100 text-red-600 rounded text-[10px]">{d.lossReason}</span>}
                          {d.cidadeContato && <><MapPin className="h-2.5 w-2.5" />{d.cidadeContato}</>}
                          <span>{fmtDate(d.updatedAt)}</span>
                        </div>
                      </div>
                      {d.value != null && <div className="text-xs font-semibold text-red-500 shrink-0 line-through">{brl(d.value)}</div>}
                    </div>
                  ))}
                </div>
              )
          })()}
        </div>
      </div>
    </div>
  )
}
