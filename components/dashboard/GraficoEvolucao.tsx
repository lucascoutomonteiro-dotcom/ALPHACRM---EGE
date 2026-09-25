'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type MetaMes = {
  mes: number
  ano: number
  realizadoVendas: string | null
  faturamentoNecessario: string | null
  realizadoEbitda: string | null
  metaEbitda: string | null
  realizadoPipeline: string | null
  pipelineNecessario: string | null
  realizadoPropostas: number | null
  metaPropostas: number | null
  realizadoProspeccoes: number | null
  metaProspeccoes: number | null
  realizadoReunioes: number | null
  metaReunioes: number | null
}

type Grupo = {
  id: string
  label: string
  tipo: 'moeda' | 'numero'
  metaKey: keyof MetaMes
  realizadoKey: keyof MetaMes
  corMeta: string
  corRealizado: string
}

const GRUPOS: Grupo[] = [
  { id: 'vendas',      label: 'Vendas',        tipo: 'moeda',  metaKey: 'faturamentoNecessario', realizadoKey: 'realizadoVendas',      corMeta: '#93C5FD', corRealizado: '#1B4F8A' },
  { id: 'ebitda',      label: 'EBITDA',        tipo: 'moeda',  metaKey: 'metaEbitda',            realizadoKey: 'realizadoEbitda',      corMeta: '#6EE7B7', corRealizado: '#059669' },
  { id: 'pipeline',    label: 'Pipeline',      tipo: 'moeda',  metaKey: 'pipelineNecessario',    realizadoKey: 'realizadoPipeline',    corMeta: '#FCD34D', corRealizado: '#D97706' },
  { id: 'propostas',   label: 'Propostas',     tipo: 'numero', metaKey: 'metaPropostas',         realizadoKey: 'realizadoPropostas',   corMeta: '#C4B5FD', corRealizado: '#7C3AED' },
  { id: 'prospeccoes', label: 'Prospecções',   tipo: 'numero', metaKey: 'metaProspeccoes',       realizadoKey: 'realizadoProspeccoes', corMeta: '#FCA5A5', corRealizado: '#DC2626' },
  { id: 'reunioes',    label: 'Reuniões',      tipo: 'numero', metaKey: 'metaReunioes',          realizadoKey: 'realizadoReunioes',    corMeta: '#86EFAC', corRealizado: '#16A34A' },
]

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmt(valor: number, tipo: 'moeda' | 'numero') {
  if (tipo === 'moeda') {
    if (valor >= 1_000_000) return `R$${(valor / 1_000_000).toFixed(1)}M`
    if (valor >= 1_000) return `R$${(valor / 1_000).toFixed(0)}k`
    return `R$${valor}`
  }
  return String(valor)
}

function fmtTooltip(valor: number, tipo: 'moeda' | 'numero') {
  if (tipo === 'moeda') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor)
  }
  return String(valor)
}

// CustomTooltip — mostra todos os grupos selecionados
function CustomTooltip({ active, payload, label, gruposSelecionados }: {
  active?: boolean
  payload?: { name: string; value: number; fill: string }[]
  label?: string
  gruposSelecionados: Grupo[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry) => {
        const isMeta = entry.name.startsWith('Meta')
        const tipo = gruposSelecionados.find(g =>
          entry.name === `Meta ${g.label}` || entry.name === `Real. ${g.label}`
        )?.tipo ?? 'numero'
        return (
          <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: entry.fill }} />
              <span className={isMeta ? 'text-gray-400' : 'text-gray-700'}>{entry.name}</span>
            </span>
            <span className={`font-semibold ${isMeta ? 'text-gray-400' : 'text-gray-800'}`}>
              {fmtTooltip(entry.value, tipo)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function GraficoEvolucao({ dados }: { dados: MetaMes[] }) {
  const [selecionados, setSelecionados] = useState<string[]>(['vendas'])

  function toggle(id: string) {
    setSelecionados(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) : [...prev, id]
    )
  }

  const gruposSelecionados = GRUPOS.filter(g => selecionados.includes(g.id))

  // Determina se todos os grupos selecionados são do mesmo tipo (para usar um único eixo Y)
  const tiposUnicos = [...new Set(gruposSelecionados.map(g => g.tipo))]
  const tipoMisto = tiposUnicos.length > 1

  const chartData = useMemo(() => {
    // Garante todos os 12 meses no eixo X, preenchendo com 0 onde não há dado
    return Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1
      const d = dados.find(x => x.mes === mes)
      const ponto: Record<string, number | string> = { mes: MESES_LABEL[i] }
      for (const g of gruposSelecionados) {
        const meta = Number(d?.[g.metaKey] ?? 0)
        const real = Number(d?.[g.realizadoKey] ?? 0)
        ponto[`Meta ${g.label}`] = meta
        ponto[`Real. ${g.label}`] = real
      }
      return ponto
    })
  }, [dados, gruposSelecionados])

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-600">Evolução Mensal — Meta × Realizado</h2>
        <div className="flex flex-wrap gap-2">
          {GRUPOS.map(g => (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                selecionados.includes(g.id)
                  ? 'text-white font-semibold shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
              style={selecionados.includes(g.id) ? { background: g.corRealizado, borderColor: g.corRealizado } : {}}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {tipoMisto && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
          Grupos com escalas diferentes selecionados — valores em unidades distintas (R$ e qtd).
        </p>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} barCategoryGap="30%" barGap={2}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => {
              const tipo = tipoMisto ? 'numero' : (gruposSelecionados[0]?.tipo ?? 'numero')
              return fmt(v, tipo)
            }}
            width={60}
          />
          <Tooltip content={<CustomTooltip gruposSelecionados={gruposSelecionados} />} />
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          />
          {gruposSelecionados.map(g => (
            <>
              <Bar
                key={`meta-${g.id}`}
                dataKey={`Meta ${g.label}`}
                fill={g.corMeta}
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                key={`real-${g.id}`}
                dataKey={`Real. ${g.label}`}
                fill={g.corRealizado}
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              />
            </>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
