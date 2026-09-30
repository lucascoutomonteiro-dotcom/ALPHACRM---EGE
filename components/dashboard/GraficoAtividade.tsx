'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'

export type AtividadeItem = {
  tipo: string
  data: string // ISO date string (YYYY-MM-DD)
  fonte: 'crm' | 'ege'
}

type Periodo = 'hoje' | 'semana' | 'mes' | 'custom'

const TIPOS_COR: Record<string, string> = {
  'Ligação':  '#F97316',
  'WhatsApp': '#16A34A',
  'E-mail':   '#3B82F6',
  'Reunião':  '#7C3AED',
  'Proposta': '#0891B2',
  'Outro':    '#9CA3AF',
}

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const TIPOS_FIXOS = ['Ligação', 'WhatsApp', 'E-mail', 'Reunião', 'Proposta']

function addDays(base: string, days: number) {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: { payload: { tipo: string; crm: number; ege: number; total: number } }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border rounded-xl shadow-lg p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-gray-700 mb-2">{d.tipo}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">CRM</span>
          <span className="font-semibold text-gray-800">{d.crm}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Base de Clientes</span>
          <span className="font-semibold text-gray-800">{d.ege}</span>
        </div>
        <div className="flex justify-between gap-4 border-t pt-1 mt-1">
          <span className="text-gray-600 font-medium">Total</span>
          <span className="font-bold text-gray-900">{d.total}</span>
        </div>
      </div>
    </div>
  )
}

type Fonte = 'todos' | 'crm' | 'ege'

export function GraficoAtividade({ itens, hoje }: { itens: AtividadeItem[]; hoje: string }) {
  const mesAtual = Number(hoje.slice(5, 7))
  const anoAtual = Number(hoje.slice(0, 4))

  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual)
  const [dataInicio, setDataInicio] = useState(hoje.slice(0, 7) + '-01')
  const [dataFim, setDataFim] = useState(hoje)
  const [fonte, setFonte] = useState<Fonte>('todos')

  const mesesDisponiveis = useMemo(() => {
    const set = new Set<number>()
    for (const i of itens) {
      const m = Number(i.data.slice(5, 7))
      if (!isNaN(m)) set.add(m)
    }
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

  const total = filtrados.length
  const totalCrm = useMemo(() => filtrados.filter(i => i.fonte === 'crm').length, [filtrados])
  const totalEge = useMemo(() => filtrados.filter(i => i.fonte === 'ege').length, [filtrados])

  const chartData = useMemo(() => {
    const tipos = [...TIPOS_FIXOS, 'Outro']
    return tipos.map(tipo => {
      const grupo = filtrados.filter(i =>
        tipo === 'Outro' ? !TIPOS_FIXOS.includes(i.tipo) : i.tipo === tipo
      )
      const crm = grupo.filter(i => i.fonte === 'crm').length
      const ege = grupo.filter(i => i.fonte === 'ege').length
      return { tipo, crm, ege, total: crm + ege }
    }).filter(d => d.total > 0)
  }, [filtrados])

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-600">Atividade Comercial</h2>
          <p className="text-xs text-gray-400 mt-0.5">Interações do CRM + Oportunidades por canal</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2.5 py-1 rounded-full" title={`${totalCrm} CRM · ${totalEge} Oport.`}>
            {total} {total === 1 ? 'interação' : 'interações'}
          </span>

          {/* Filtro de fonte */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['todos', 'crm', 'ege'] as Fonte[]).map(f => (
              <button
                key={f}
                onClick={() => setFonte(f)}
                className={`px-2 py-1 text-xs font-medium transition-colors ${fonte === f ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {f === 'todos' ? 'Todos' : f === 'crm' ? 'CRM' : 'Base'}
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
            max={hoje}
            className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          Nenhuma interação registrada no período.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="35%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="tipo" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="crm" name="CRM" radius={[3, 3, 0, 0]} maxBarSize={32}>
                {chartData.map((entry) => (
                  <Cell key={`crm-${entry.tipo}`} fill={TIPOS_COR[entry.tipo] ?? '#9CA3AF'} />
                ))}
                <LabelList dataKey="crm" position="insideTop" style={{ fontSize: 10, fill: '#fff', fontWeight: 600 }} formatter={(v: unknown) => Number(v) > 0 ? String(v) : ''} />
              </Bar>
              <Bar dataKey="ege" name="Base de Clientes" radius={[3, 3, 0, 0]} maxBarSize={32}>
                {chartData.map((entry) => (
                  <Cell key={`ege-${entry.tipo}`} fill={TIPOS_COR[entry.tipo] ?? '#9CA3AF'} fillOpacity={0.45} />
                ))}
                <LabelList dataKey="ege" position="insideTop" style={{ fontSize: 10, fill: '#fff', fontWeight: 600 }} formatter={(v: unknown) => Number(v) > 0 ? String(v) : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#F97316] inline-block" /> Ligação</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#16A34A] inline-block" /> WhatsApp</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#3B82F6] inline-block" /> E-mail</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#7C3AED] inline-block" /> Reunião</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#0891B2] inline-block" /> Proposta</span>
            <span className="ml-auto flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-400 inline-block" /> CRM (cheio)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-400 opacity-50 inline-block" /> Base de Clientes (claro)</span>
            </span>
          </div>
        </>
      )}
    </div>
  )
}
