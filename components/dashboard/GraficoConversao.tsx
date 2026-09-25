'use client'

import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export type ConversaoItem = {
  data: string   // YYYY-MM-DD
  gerouOportunidade: boolean
  fonte: 'crm' | 'ege'
  clienteNome?: string
  clienteId?: string
  servico?: string
  tipoInteracao?: string
}

type Periodo = 'hoje' | 'semana' | 'mes' | 'custom'
type Fonte = 'todos' | 'crm' | 'ege'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function addDays(base: string, days: number) {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border rounded-xl shadow-lg px-3 py-2 text-xs">
      <span className="font-semibold text-gray-700">{payload[0].name}: </span>
      <span className="text-gray-800">{payload[0].value}</span>
    </div>
  )
}

export function GraficoConversao({ itens, hoje }: { itens: ConversaoItem[]; hoje: string }) {
  const mesAtual = Number(hoje.slice(5, 7))
  const anoAtual = Number(hoje.slice(0, 4))

  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual)
  const [dataInicio, setDataInicio] = useState(hoje.slice(0, 7) + '-01')
  const [dataFim, setDataFim] = useState(hoje)
  const [showClientes, setShowClientes] = useState(false)
  const [fonte, setFonte] = useState<Fonte>('todos')

  const mesesDisponiveis = useMemo(() => {
    const set = new Set<number>()
    for (const i of itens) set.add(Number(i.data.slice(5, 7)))
    set.add(mesAtual)
    return Array.from(set).sort((a, b) => a - b)
  }, [itens, mesAtual])

  const filtrados = useMemo(() => {
    let base = itens
    if (fonte !== 'todos') base = base.filter(i => i.fonte === fonte)
    if (periodo === 'hoje') return base.filter(i => i.data === hoje)
    if (periodo === 'semana') {
      const ini = addDays(hoje, -6)
      return base.filter(i => i.data >= ini && i.data <= hoje)
    }
    if (periodo === 'mes') {
      const prefixo = `${anoAtual}-${String(mesSelecionado).padStart(2, '0')}`
      return base.filter(i => i.data.startsWith(prefixo))
    }
    return base.filter(i => i.data >= dataInicio && i.data <= dataFim)
  }, [itens, periodo, hoje, mesSelecionado, anoAtual, dataInicio, dataFim, fonte])

  const contatos = filtrados.length
  const oportunidades = filtrados.filter(i => i.gerouOportunidade).length
  const taxa = contatos > 0 ? Math.round((oportunidades / contatos) * 100) : 0

  const clientesOportunidade = useMemo(() => {
    return filtrados.filter(i => i.gerouOportunidade)
  }, [filtrados])

  // Evolução mensal para o modo "mes"
  const evol = useMemo(() => {
    return mesesDisponiveis.map(m => {
      const pref = `${anoAtual}-${String(m).padStart(2, '0')}`
      const f = itens.filter(i => i.data.startsWith(pref))
      const c = f.length
      const o = f.filter(i => i.gerouOportunidade).length
      return { mes: m, contatos: c, oportunidades: o, taxa: c > 0 ? Math.round((o / c) * 100) : 0 }
    })
  }, [itens, anoAtual, mesesDisponiveis])

  const semResultado = Math.max(0, contatos - oportunidades)
  const pieData = [
    { name: 'Oportunidades', value: oportunidades },
    { name: 'Sem resultado', value: semResultado },
  ]
  const taxaColor = taxa >= 30 ? '#22C55E' : taxa >= 15 ? '#FBBF24' : oportunidades > 0 ? '#EF4444' : '#D1D5DB'

  const labelPeriodo = periodo === 'hoje' ? 'hoje'
    : periodo === 'semana' ? 'últimos 7 dias'
    : periodo === 'mes' ? `${MESES_LABEL[mesSelecionado - 1]}/${anoAtual}`
    : `${dataInicio} → ${dataFim}`

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-600">Taxa de Conversão</h2>
          <p className="text-xs text-gray-400 mt-0.5">Contatos que geraram oportunidade real</p>
        </div>

        {/* Controles de período */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Filtro de fonte */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['todos', 'crm', 'ege'] as Fonte[]).map(f => (
              <button
                key={f}
                onClick={() => setFonte(f)}
                className={`px-2 py-1 text-xs font-medium transition-colors ${fonte === f ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {f === 'todos' ? 'Todos' : f === 'crm' ? 'CRM' : 'Oport.'}
              </button>
            ))}
          </div>

          {(['hoje', 'semana', 'mes', 'custom'] as Periodo[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${periodo === p ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
              {p === 'hoje' ? 'Hoje' : p === 'semana' ? '7 dias' : p === 'mes' ? 'Mês' : 'Período'}
            </button>
          ))}
          {periodo === 'mes' && (
            <select
              value={mesSelecionado}
              onChange={e => setMesSelecionado(Number(e.target.value))}
              className="text-xs border rounded-lg px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
            >
              {mesesDisponiveis.map(m => (
                <option key={m} value={m}>{MESES_LABEL[m - 1]}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Custom date range */}
      {periodo === 'custom' && (
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-xs text-gray-500">De</span>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
          <span className="text-xs text-gray-500">até</span>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" max={hoje} />
        </div>
      )}

      {/* Pizza + números */}
      <div className="flex items-center gap-6">
        <div className="relative shrink-0" style={{ width: 148, height: 148 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={70}
                startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                <Cell fill={taxaColor} />
                <Cell fill="#F3F4F6" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold" style={{ color: taxaColor }}>{taxa}%</span>
            <span className="text-[10px] text-gray-400">conversão</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-center">
              <div className="text-2xl font-bold text-gray-800">{contatos}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">contatos</div>
            </div>
            <div className="rounded-lg px-3 py-2.5 text-center" style={{ backgroundColor: taxaColor + '18' }}>
              <div className="text-2xl font-bold" style={{ color: taxaColor }}>{oportunidades}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">oportunidades</div>
            </div>
          </div>

          {/* Evolução mensal — só no modo "mes" */}
          {periodo === 'mes' && evol.length > 1 && (
            <div>
              <div className="text-[9px] text-gray-400 mb-1 uppercase tracking-wide">Evolução mensal</div>
              <div className="flex items-end gap-1">
                {evol.map(e => {
                  const h = Math.max(4, Math.round((e.taxa / 100) * 40))
                  const cor = e.taxa >= 30 ? '#22C55E' : e.taxa >= 15 ? '#FBBF24' : e.oportunidades > 0 ? '#EF4444' : '#D1D5DB'
                  const isSel = e.mes === mesSelecionado
                  return (
                    <button key={e.mes} onClick={() => setMesSelecionado(e.mes)}
                      className={`flex flex-col items-center gap-0.5 group`}
                      title={`${MESES_LABEL[e.mes - 1]}: ${e.taxa}% (${e.oportunidades}/${e.contatos})`}>
                      <div className={`w-5 rounded-t transition-all ${isSel ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-60 group-hover:opacity-100'}`}
                        style={{ height: h, backgroundColor: cor }} />
                      <span className={`text-[9px] ${isSel ? 'font-bold text-gray-700' : 'text-gray-400'}`}>
                        {MESES_LABEL[e.mes - 1].slice(0, 1)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de clientes que geraram oportunidade */}
      {oportunidades > 0 && (
        <div className="border-t pt-3">
          <button
            onClick={() => setShowClientes(!showClientes)}
            className="flex items-center gap-1.5 text-xs text-[#1B4F8A] font-medium hover:underline w-full text-left"
          >
            {showClientes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {`Ver ${clientesOportunidade.length} oportunidade${clientesOportunidade.length !== 1 ? 's' : ''} — ${labelPeriodo}`}
          </button>

          {showClientes && (
            <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {clientesOportunidade.length > 0 ? clientesOportunidade.map((item, idx) => {
                const href = item.clienteId
                  ? (item.fonte === 'crm' ? `/crm/${item.clienteId}` : `/oportunidades`)
                  : null
                const inner = (
                  <>
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className={`font-medium ${item.clienteNome ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                        {item.clienteNome ?? 'Cliente não identificado'}
                      </span>
                      {(item.tipoInteracao || item.servico) && (
                        <span className="text-[10px] text-[#1B4F8A] font-medium">
                          {[item.tipoInteracao, item.servico].filter(Boolean).join(' — ')}
                        </span>
                      )}
                      {href && <ExternalLink className="h-3 w-3 text-gray-300 shrink-0" />}
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.fonte === 'crm' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.fonte === 'crm' ? 'CRM' : 'Oport.'}
                    </span>
                  </>
                )
                return href ? (
                  <li key={idx}>
                    <Link href={href} className="flex items-center justify-between gap-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
                      {inner}
                    </Link>
                  </li>
                ) : (
                  <li key={idx} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                    {inner}
                  </li>
                )
              }) : (
                <li className="text-xs text-gray-400 py-2 text-center">
                  {oportunidades} oportunidade{oportunidades !== 1 ? 's' : ''} sem cliente identificado
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
