'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Check, ChevronDown, X, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Proposta = {
  id: string
  nomeProposta: string | null
  pilar: string | null
  cliente: string | null
  localidade: string | null
  situacao: string | null
  temperatura: string | null
  responsavel: string | null
  contato: string | null
  valorPc: string | null
  dataCriacao: string | null
  prazoFollowUp: string | null
  score: number | null
  escopo: string | null
  nivelDor: string | null
}

function fmtBRL(v: string | null) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))
}
function fmtData(v: string | null) {
  if (!v) return '—'
  try { return format(parseISO(v), 'dd/MM/yyyy', { locale: ptBR }) } catch { return v }
}

const SERVICO_KEYWORDS: Record<string, string[]> = {
  'NR-12 Adequação':    ['ADEQUA', 'NR 12', 'NR12'],
  'NR-12 APR/Risco':    ['APR', 'RISCO', 'ANALISE DE RISCO'],
  'NR-12 Procedimentos':['PROCEDIMENTO', 'INSTRUCAO', 'INSTRUÇÃO'],
  'NR-12 Treinamento':  ['TREINAMENTO', 'CAPACITA', 'CURSO'],
  'NR-12 Manuais':      ['MANUAL', 'LIVRO'],
  'Caça Vazamento':     ['VAZAMENTO', 'CACA VAZ'],
  'Termografia':        ['TERMOGRAF'],
  'Terceirização HH':   ['TERCEIRIZ', 'MAO DE OBRA', 'MÃO DE OBRA', 'TÉCNICO', 'TECNICO', 'ELETRICISTA'],
  'NR-10 PIE/Laudo':    ['NR 10', 'NR10', 'PIE', 'SPDA', 'INSTALACAO ELETRICA'],
}

function detectarServico(escopo: string | null, nome: string | null): string {
  const t = `${escopo ?? ''} ${nome ?? ''}`.toUpperCase()
  for (const [servico, keys] of Object.entries(SERVICO_KEYWORDS)) {
    if (keys.some(k => t.includes(k))) return servico
  }
  return 'Outros'
}

function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  function toggle(s: string) { onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]) }
  const display = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${selected.length} selecionados`
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="h-9 px-3 border rounded-md text-sm flex items-center gap-2 bg-white hover:bg-gray-50 min-w-[150px] justify-between">
        <span className="truncate">{display}</span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-10 left-0 z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[200px] max-h-64 overflow-y-auto">
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => { onChange([]); setOpen(false) }}>
              <span className={`w-4 h-4 rounded border flex items-center justify-center ${selected.length === 0 ? 'bg-[#1B4F8A] border-[#1B4F8A]' : 'border-gray-300'}`}>
                {selected.length === 0 && <Check className="h-3 w-3 text-white" />}
              </span>
              Todos
            </button>
            {options.map(s => (
              <button key={s} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => toggle(s)}>
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(s) ? 'bg-[#1B4F8A] border-[#1B4F8A]' : 'border-gray-300'}`}>
                  {selected.includes(s) && <Check className="h-3 w-3 text-white" />}
                </span>
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function TabelaInativos({ propostas }: { propostas: Proposta[] }) {
  const [busca, setBusca] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState<string[]>([])
  const [filtroServico, setFiltroServico] = useState<string[]>([])
  const [filtroTemperatura, setFiltroTemperatura] = useState<string[]>([])
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  const comServico = useMemo(() => propostas.map(p => ({ ...p, servico: detectarServico(p.escopo, p.nomeProposta) })), [propostas])

  const servicos = useMemo(() => [...new Set(comServico.map(p => p.servico))].sort(), [comServico])
  const temperaturas = useMemo(() => [...new Set(propostas.map(p => p.temperatura).filter(Boolean))].sort() as string[], [propostas])

  const filtradas = useMemo(() => {
    return comServico.filter(p => {
      if (busca) {
        const q = busca.toLowerCase()
        if (!(p.cliente ?? '').toLowerCase().includes(q) &&
            !(p.nomeProposta ?? '').toLowerCase().includes(q) &&
            !(p.localidade ?? '').toLowerCase().includes(q)) return false
      }
      if (filtroSituacao.length > 0 && !filtroSituacao.includes(p.situacao ?? '')) return false
      if (filtroServico.length > 0 && !filtroServico.includes(p.servico)) return false
      if (filtroTemperatura.length > 0 && !filtroTemperatura.includes(p.temperatura ?? '')) return false
      if (dataInicio && p.dataCriacao && p.dataCriacao < dataInicio) return false
      if (dataFim && p.dataCriacao && p.dataCriacao > dataFim) return false
      return true
    })
  }, [comServico, busca, filtroSituacao, filtroServico, filtroTemperatura, dataInicio, dataFim])

  // Agrupar por cliente
  const porCliente = useMemo(() => {
    const mapa: Record<string, typeof filtradas> = {}
    filtradas.forEach(p => {
      const c = p.cliente ?? 'Sem cliente'
      if (!mapa[c]) mapa[c] = []
      mapa[c].push(p)
    })
    return Object.entries(mapa).sort((a, b) => b[1].length - a[1].length)
  }, [filtradas])

  const hasFilters = busca || filtroSituacao.length > 0 || filtroServico.length > 0 || filtroTemperatura.length > 0 || dataInicio || dataFim
  const totalValor = filtradas.reduce((s, p) => s + Number(p.valorPc ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Alerta */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>{propostas.length} propostas inativas</strong> — muitas são renovações (NR-12, NR-10, Caça Vazamentos) onde o prazo já venceu e você pode entrar novamente na concorrência. Filtre por serviço para identificar oportunidades.
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Buscar cliente, proposta..." value={busca} onChange={e => setBusca(e.target.value)} className="h-9 w-64 text-sm" />
          <MultiSelect label="Situação" options={['Rejeitada', 'Declinada']} selected={filtroSituacao} onChange={setFiltroSituacao} />
          <MultiSelect label="Serviço" options={servicos} selected={filtroServico} onChange={setFiltroServico} />
          <MultiSelect label="Temperatura" options={temperaturas} selected={filtroTemperatura} onChange={setFiltroTemperatura} />
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">De</span>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-9 px-2 border rounded-md text-sm bg-white" />
            <span className="text-xs text-gray-400">até</span>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-9 px-2 border rounded-md text-sm bg-white" />
          </div>
          {hasFilters && (
            <button onClick={() => { setBusca(''); setFiltroSituacao([]); setFiltroServico([]); setFiltroTemperatura([]); setDataInicio(''); setDataFim('') }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span><span className="font-semibold text-gray-600">{filtradas.length}</span> propostas de <span className="font-semibold text-gray-600">{propostas.length}</span></span>
          <span><span className="font-semibold text-gray-600">{porCliente.length}</span> clientes</span>
          {totalValor > 0 && <span>Valor total: <span className="font-semibold text-[#1B4F8A]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValor)}</span></span>}
        </div>
      </div>

      {/* Tabela agrupada por cliente */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-2.5 text-left text-xs text-gray-400 font-medium">Cliente / Proposta</th>
              <th className="px-3 py-2.5 text-left text-xs text-gray-400 font-medium">Serviço</th>
              <th className="px-3 py-2.5 text-left text-xs text-gray-400 font-medium">Situação</th>
              <th className="px-3 py-2.5 text-left text-xs text-gray-400 font-medium">Temperatura</th>
              <th className="px-3 py-2.5 text-right text-xs text-gray-400 font-medium">Valor</th>
              <th className="px-3 py-2.5 text-left text-xs text-gray-400 font-medium">Data</th>
              <th className="px-3 py-2.5 text-left text-xs text-gray-400 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {porCliente.map(([cliente, propsCliente]) => (
              <>
                {/* Cabeçalho do cliente */}
                <tr
                  key={`h-${cliente}`}
                  className="bg-[#1B4F8A]/5 border-y border-[#1B4F8A]/10 cursor-pointer hover:bg-[#1B4F8A]/10"
                  onClick={() => setExpandido(expandido === cliente ? null : cliente)}
                >
                  <td className="px-4 py-2" colSpan={7}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1B4F8A] text-sm">{cliente}</span>
                        <span className="text-xs bg-[#1B4F8A]/10 text-[#1B4F8A] px-2 py-0.5 rounded-full">
                          {propsCliente.length} proposta{propsCliente.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-400">{[...new Set(propsCliente.map(p => p.servico))].join(' · ')}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#1B4F8A]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
                          propsCliente.reduce((s, p) => s + Number(p.valorPc ?? 0), 0)
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
                {/* Propostas do cliente (expand) */}
                {(expandido === cliente || porCliente.length <= 10) && propsCliente.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2.5 pl-8">
                      <div className="text-xs text-gray-700 font-medium line-clamp-1">{p.nomeProposta}</div>
                      {p.escopo && <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{p.escopo.replace(/^Escopo:\s*/i,'').substring(0,100)}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p.servico}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.situacao === 'Rejeitada' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {p.situacao}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{p.temperatura || '—'}</td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700">{fmtBRL(p.valorPc)}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{fmtData(p.dataCriacao)}</td>
                    <td className="px-3 py-2.5 text-xs text-center">
                      {p.score != null ? (
                        <span className={`font-bold ${p.score >= 8 ? 'text-green-600' : p.score >= 5 ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {p.score}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </>
            ))}
            {porCliente.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-400 text-sm py-12">Nenhuma proposta encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
