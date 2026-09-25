'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { atualizarClienteEge } from './actions'
import { toast } from 'sonner'

const SITUACAO_CORES: Record<string, { bg: string; label: string }> = {
  FEITO: { bg: '#22C55E', label: 'text-white' },
  UPSELL: { bg: '#FBBF24', label: 'text-white' },
  CROSS: { bg: '#EF4444', label: 'text-white' },
  RENOVAR: { bg: '#3B82F6', label: 'text-white' },
  VAZIO: { bg: '#E5E7EB', label: 'text-gray-600' },
}

const PRAZO_CORES: Record<string, string> = {
  '30d': 'bg-red-100 text-red-700',
  '30-60d': 'bg-yellow-100 text-yellow-700',
  '60-90d': 'bg-green-100 text-green-700',
}

const STATUS_ACAO = ['A iniciar', 'Em contato', 'Proposta enviada', 'Fechado']

interface Servico {
  campo: string
  label: string
}

interface ClienteEgeCardProps {
  cliente: {
    id: string
    rank: number | null
    cliente: string
    local: string | null
    contatoNome: string | null
    classificacao: string | null
    numOportunidades: number | null
    potencialTotal: string | null
    prazoUrgencia: string | null
    acao30d: string | null
    statusAcao: string | null
    nr12AprRisco: string | null
    nr12Procedimentos: string | null
    nr12Manuais: string | null
    nr12Treinamento: string | null
    nr12Conceituacao: string | null
    nr12Adequacao: string | null
    cacaVazDeteccao: string | null
    cacaVazReparo: string | null
    termografia: string | null
    terceirizacaoHh: string | null
    nr10PieLaudo: string | null
    nr10Spda: string | null
    nr10Instalacoes: string | null
  }
  servicos: readonly Servico[]
  borderColor: string
}

function fmtBRL(v: number | string | null) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v ?? 0))
}

export function ClienteEgeCard({ cliente, servicos, borderColor }: ClienteEgeCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState(cliente.statusAcao ?? 'A iniciar')

  async function handleStatusChange(val: string | null) {
    if (!val) return
    setStatus(val)
    await atualizarClienteEge(cliente.id, { statusAcao: val })
    toast.success('Status atualizado!')
  }

  const prazoClass = cliente.prazoUrgencia ? PRAZO_CORES[cliente.prazoUrgencia] ?? '' : ''

  return (
    <div className={`bg-white rounded-xl border-l-4 ${borderColor} border border-l-4 p-4`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-sm">{cliente.cliente}</div>
          <div className="text-xs text-gray-400">{cliente.local} {cliente.contatoNome ? `· ${cliente.contatoNome}` : ''}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {cliente.prazoUrgencia && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${prazoClass}`}>{cliente.prazoUrgencia}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span>{cliente.numOportunidades ?? 0} oportunidades</span>
        <span className="font-semibold text-[#1B4F8A]">{fmtBRL(cliente.potencialTotal)}</span>
      </div>

      {cliente.acao30d && <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 mb-3">{cliente.acao30d}</div>}

      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-7 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_ACAO.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3">
          <div className="text-xs font-medium text-gray-500 mb-2">Matriz de Serviços</div>
          <div className="grid grid-cols-2 gap-1">
            {servicos.map(({ campo, label }) => {
              const val = (cliente[campo as keyof typeof cliente] as string) ?? 'VAZIO'
              const cor = SITUACAO_CORES[val] ?? SITUACAO_CORES.VAZIO
              return (
                <div key={campo} className="flex items-center justify-between rounded px-2 py-1" style={{ backgroundColor: cor.bg }}>
                  <span className={`text-xs ${cor.label} truncate`}>{label}</span>
                  <span className={`text-xs font-semibold ${cor.label} ml-1`}>{val}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
