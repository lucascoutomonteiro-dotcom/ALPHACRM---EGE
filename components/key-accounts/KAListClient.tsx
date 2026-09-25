'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Building2, Users, Calendar, ChevronRight, AlertTriangle, TrendingUp, Search, X, Trash2, LayoutList, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormKeyAccount } from './FormKeyAccount'
import { excluirKeyAccount } from '@/app/(dashboard)/key-accounts/actions'

const STATUS_CORES: Record<string, string> = {
  'Ativa':              'bg-emerald-100 text-emerald-700',
  'Em Desenvolvimento': 'bg-blue-100 text-blue-700',
  'Inativa':            'bg-gray-100 text-gray-500',
}

const HEALTH_CORES: Record<string, { badge: string; dot: string }> = {
  SAUDAVEL: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  ATENCAO:  { badge: 'bg-yellow-100 text-yellow-700',   dot: 'bg-yellow-500' },
  CRITICA:  { badge: 'bg-red-100 text-red-700',         dot: 'bg-red-500' },
}

const PRIORIDADE_CORES: Record<string, string> = {
  CRITICA: 'text-red-600',
  ALTA:    'text-orange-500',
  MEDIA:   'text-blue-500',
  BAIXA:   'text-gray-400',
}

interface KAConta {
  id: string
  nome: string
  segmento: string | null
  cidade: string | null
  estado: string | null
  status: string
  prioridade: string
  potencialEstimado: string | null
  receitaAnual: string | null
  healthScore: number | null
  healthStatus: string | null
  proximaAcao: string | null
  proximaAcaoData: string | null
  proximaAcaoResponsavel: string | null
  updatedAt: Date | null
  totalStakeholders: number
  ultimaVisita: string | null
}

interface Props {
  lista: KAConta[]
  hoje: string
  stats: {
    total: number; totalAtivas: number; totalContatos: number
    semVisitaRecente: number; semProximaAcao: number
    saudaveis: number; atencao: number; criticas: number; potencialTotal: number
  }
}

export function KAListClient({ lista, hoje, stats }: Props) {
  const [view, setView] = useState<'lista' | 'acoes'>('lista')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroHealth, setFiltroHealth] = useState<string>('todos')
  const [filtroSeg, setFiltroSeg] = useState<string>('todos')
  const [formOpen, setFormOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pending, startPending] = useTransition()

  const limite30d = new Date()
  limite30d.setDate(limite30d.getDate() - 30)
  const limite30dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(limite30d)

  const segmentos = useMemo(() => {
    const s = new Set(lista.map(c => c.segmento).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [lista])

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return lista.filter(c => {
      if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false
      if (filtroHealth !== 'todos' && (c.healthStatus ?? 'CRITICA') !== filtroHealth) return false
      if (filtroSeg !== 'todos' && c.segmento !== filtroSeg) return false
      if (termo && !c.nome.toLowerCase().includes(termo) &&
          !(c.segmento ?? '').toLowerCase().includes(termo) &&
          !(c.cidade ?? '').toLowerCase().includes(termo)) return false
      return true
    })
  }, [lista, filtroStatus, filtroHealth, filtroSeg, busca])

  const handleExcluir = (c: KAConta, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Arquivar "${c.nome}"? A conta será ocultada mas não excluída.`)) return
    setDeletingId(c.id)
    startPending(async () => {
      await excluirKeyAccount(c.id)
      setDeletingId(null)
    })
  }

  const fmtBRL = (v: string | null) => {
    if (!v || Number(v) === 0) return null
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))
  }

  const fmtData = (d: string | null) => {
    if (!d) return null
    const [y, m, dd] = d.slice(0, 10).split('-')
    return `${dd}/${m}/${y}`
  }

  const semVisita = (c: KAConta) => c.status === 'Ativa' && (!c.ultimaVisita || c.ultimaVisita < limite30dStr)

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => setView('lista')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === 'lista' ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <LayoutList className="h-3.5 w-3.5" /> Contas
          </button>
          <button onClick={() => setView('acoes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === 'acoes' ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <CalendarClock className="h-3.5 w-3.5" /> Ações Agendadas
          </button>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-[#1B4F8A] hover:bg-[#163f70] text-sm gap-1.5">
          <Plus className="h-4 w-4" /> Nova Conta
        </Button>
      </div>

      {view === 'acoes' ? (
        <AcoesAgendadas lista={lista} hoje={hoje} />
      ) : (
        <>
          {/* Busca + Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Campo de busca */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar conta…"
                className="w-full pl-8 pr-7 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] bg-white"
              />
              {busca && (
                <button onClick={() => setBusca('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filtro status */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {['todos', 'Ativa', 'Em Desenvolvimento', 'Inativa'].map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${filtroStatus === s ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {s === 'todos' ? 'Todos' : s}
                </button>
              ))}
            </div>

            {/* Filtro saúde */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[
                { v: 'todos', l: 'Saúde' },
                { v: 'SAUDAVEL', l: '🟢' },
                { v: 'ATENCAO', l: '🟡' },
                { v: 'CRITICA', l: '🔴' },
              ].map(({ v, l }) => (
                <button key={v} onClick={() => setFiltroHealth(v)}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${filtroHealth === v ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {l}
                </button>
              ))}
            </div>

            {segmentos.length > 0 && (
              <select value={filtroSeg} onChange={e => setFiltroSeg(e.target.value)}
                className="text-xs border rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                <option value="todos">Todos os segmentos</option>
                {segmentos.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            {(busca || filtroStatus !== 'todos' || filtroHealth !== 'todos' || filtroSeg !== 'todos') && (
              <span className="text-xs text-gray-400">{filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Building2 className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma conta encontrada</p>
              {busca ? (
                <button onClick={() => setBusca('')} className="mt-2 text-xs text-[#1B4F8A] hover:underline">Limpar busca</button>
              ) : (
                <button onClick={() => setFormOpen(true)} className="mt-3 text-xs text-[#1B4F8A] hover:underline">Criar primeira Key Account</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtradas.map(c => {
                const health = c.healthStatus ? HEALTH_CORES[c.healthStatus] : HEALTH_CORES.CRITICA
                const score = c.healthScore ?? 0
                const excluindo = deletingId === c.id
                return (
                  <div key={c.id} className={`group relative bg-white rounded-xl border hover:border-[#4A90D9] hover:shadow-md transition-all ${excluindo ? 'opacity-40' : ''}`}>
                    <Link href={`/key-accounts/${c.id}`} className="flex flex-col gap-3 p-4 h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {semVisita(c) && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label="Sem visita recente" />
                            )}
                            {c.prioridade === 'CRITICA' && (
                              <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded">CRÍTICA</span>
                            )}
                            {c.prioridade === 'ALTA' && (
                              <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1 rounded">ALTA</span>
                            )}
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-[#1B4F8A]">{c.nome}</h3>
                          </div>
                          {c.segmento && <p className="text-xs text-gray-400 mt-0.5">{c.segmento}</p>}
                          {(c.cidade || c.estado) && (
                            <p className="text-xs text-gray-400">{[c.cidade, c.estado].filter(Boolean).join(' — ')}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CORES[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {c.status}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#4A90D9] mt-1" />
                        </div>
                      </div>

                      {/* Health Score */}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${health.dot}`} />
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${
                          score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>{score}</span>
                      </div>

                      {/* Próxima ação */}
                      {c.proximaAcao && (
                        <p className="text-xs text-[#1B4F8A] bg-blue-50 rounded px-2 py-1 truncate">
                          → {c.proximaAcao}{c.proximaAcaoData ? ` · ${fmtData(c.proximaAcaoData)}` : ''}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 border-t pt-2.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />{c.totalStakeholders}
                        </span>
                        {c.ultimaVisita
                          ? <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtData(c.ultimaVisita)}</span>
                          : <span className="text-gray-300 text-[11px]">Sem visitas</span>
                        }
                        {c.potencialEstimado && Number(c.potencialEstimado) > 0 && (
                          <span className="ml-auto flex items-center gap-0.5 text-[#1B4F8A] font-semibold">
                            <TrendingUp className="h-3 w-3" />{fmtBRL(c.potencialEstimado)}
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Botão excluir — aparece no hover */}
                    <button
                      onClick={e => handleExcluir(c, e)}
                      disabled={pending}
                      title="Arquivar conta"
                      className="absolute top-2 right-2 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <FormKeyAccount open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  )
}

// ── Painel de Ações Agendadas ─────────────────────────────────────────────────

type FiltroAcoes = 'hoje' | '7d' | 'mes' | 'custom'

function AcoesAgendadas({ lista, hoje }: { lista: KAConta[]; hoje: string }) {
  const [filtro, setFiltro] = useState<FiltroAcoes>('7d')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')

  const { inicio, fim } = useMemo(() => {
    if (filtro === 'custom') return { inicio: de || hoje, fim: ate || hoje }
    const base = new Date(hoje + 'T00:00:00')
    if (filtro === 'hoje') return { inicio: hoje, fim: hoje }
    if (filtro === '7d') {
      const f = new Date(base); f.setDate(f.getDate() + 7)
      return { inicio: hoje, fim: f.toISOString().split('T')[0] }
    }
    const f = new Date(base); f.setDate(f.getDate() + 30)
    return { inicio: hoje, fim: f.toISOString().split('T')[0] }
  }, [filtro, de, ate, hoje])

  const comAcao = useMemo(() => {
    return lista
      .filter(c => c.proximaAcao && c.proximaAcaoData)
      .filter(c => { const d = c.proximaAcaoData!; return d >= inicio && d <= fim })
      .sort((a, b) => (a.proximaAcaoData! > b.proximaAcaoData! ? 1 : -1))
  }, [lista, inicio, fim])

  const porData = useMemo(() => {
    const map: Record<string, KAConta[]> = {}
    for (const c of comAcao) {
      const d = c.proximaAcaoData!
      if (!map[d]) map[d] = []
      map[d].push(c)
    }
    return map
  }, [comAcao])

  const fmtDataLonga = (d: string) => {
    const [y, m, dd] = d.split('-')
    const dt = new Date(Number(y), Number(m) - 1, Number(dd))
    return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const corBg = (d: string) => {
    if (d < hoje) return 'bg-red-50 border-red-200'
    if (d === hoje) return 'bg-amber-50 border-amber-200'
    return 'bg-white border-gray-200'
  }
  const corDot = (d: string) => {
    if (d < hoje) return 'bg-red-500'
    if (d === hoje) return 'bg-amber-500'
    return 'bg-blue-400'
  }

  const semAcao = lista.filter(c => c.status === 'Ativa' && (!c.proximaAcao || !c.proximaAcaoData))

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {([
            { v: 'hoje', l: 'Hoje' },
            { v: '7d',   l: '7 dias' },
            { v: 'mes',  l: '30 dias' },
            { v: 'custom', l: 'Período' },
          ] as { v: FiltroAcoes; l: string }[]).map(({ v, l }) => (
            <button key={v} onClick={() => setFiltro(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filtro === v ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>
        {filtro === 'custom' && (
          <div className="flex items-center gap-1.5">
            <input type="date" value={de} onChange={e => setDe(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            <span className="text-xs text-gray-400">até</span>
            <input type="date" value={ate} onChange={e => setAte(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
          </div>
        )}
        <span className="text-xs text-gray-400">{comAcao.length} ação{comAcao.length !== 1 ? 'ões' : ''} no período</span>
      </div>

      {comAcao.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma ação agendada no período</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(porData).map(([data, contas]) => (
            <div key={data}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${corDot(data)}`} />
                <p className="text-xs font-semibold text-gray-600 capitalize">{fmtDataLonga(data)}</p>
                {data < hoje && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">ATRASADO</span>}
                {data === hoje && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">HOJE</span>}
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-2 pl-4">
                {contas.map(c => (
                  <Link key={c.id} href={`/key-accounts/${c.id}`}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 hover:shadow-sm transition-shadow ${corBg(data)}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900 truncate">{c.nome}</p>
                        {c.proximaAcaoResponsavel && (
                          <span className="text-[10px] text-gray-500 bg-white/80 border px-1.5 py-0.5 rounded">👤 {c.proximaAcaoResponsavel}</span>
                        )}
                        {c.healthScore !== null && (
                          <span className={`text-[10px] font-bold tabular-nums ${
                            (c.healthScore ?? 0) >= 80 ? 'text-emerald-600' : (c.healthScore ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>H:{c.healthScore}</span>
                        )}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CORES[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 text-gray-600 truncate">{c.proximaAcao}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {semAcao.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <span className="font-semibold">{semAcao.length} conta{semAcao.length > 1 ? 's ativas' : ' ativa'}</span> sem próxima ação definida:{' '}
            {semAcao.slice(0, 3).map(c => c.nome).join(', ')}{semAcao.length > 3 ? ` e mais ${semAcao.length - 3}…` : ''}
          </p>
        </div>
      )}
    </div>
  )
}
