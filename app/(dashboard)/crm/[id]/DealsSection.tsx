'use client'

import { useState } from 'react'
import { Handshake, ChevronDown, ChevronRight, Plus, Trophy, XCircle, Clock, Package } from 'lucide-react'
import Link from 'next/link'

type Produto = {
  productName: string | null
  quantity: string | null
  unitPrice: string | null
}

type Deal = {
  id: string
  title: string
  value: string | null
  status: string | null
  probability: number | null
  expectedCloseDate: string | null
  lossReason: string | null
  description: string | null
  stageName: string | null
  createdAt: Date | null
  produtos: Produto[]
}

function fmt(v: string | null) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))
}

function StatusIcon({ status }: { status: string | null }) {
  if (status === 'won') return <Trophy className="h-4 w-4 text-green-500" />
  if (status === 'lost') return <XCircle className="h-4 w-4 text-red-400" />
  return <Clock className="h-4 w-4 text-blue-400" />
}

function StatusLabel({ status }: { status: string | null }) {
  if (status === 'won') return <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Ganho</span>
  if (status === 'lost') return <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Perdido</span>
  return <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Em aberto</span>
}

function DealCard({ deal }: { deal: Deal }) {
  const [expanded, setExpanded] = useState(false)
  const isOverdue = deal.status === 'open' && deal.expectedCloseDate && deal.expectedCloseDate < new Date().toISOString().slice(0, 10)

  return (
    <div className={`border rounded-xl overflow-hidden ${deal.status === 'won' ? 'border-green-200' : deal.status === 'lost' ? 'border-red-100' : isOverdue ? 'border-orange-200' : 'border-gray-200'}`}>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
        <StatusIcon status={deal.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-[#1A1A2E] truncate">{deal.title}</span>
            <StatusLabel status={deal.status} />
            {isOverdue && <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Atrasado</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
            {deal.stageName && <span>{deal.stageName}</span>}
            {deal.expectedCloseDate && <span>Fecha: {new Date(deal.expectedCloseDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
            {deal.probability != null && deal.status === 'open' && <span>{deal.probability}% prob.</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-sm text-[#1B4F8A]">{fmt(deal.value)}</div>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t px-4 py-3 bg-gray-50 space-y-3">
          {deal.description && (
            <p className="text-xs text-gray-600">{deal.description}</p>
          )}
          {deal.lossReason && (
            <p className="text-xs text-red-500"><strong>Motivo da perda:</strong> {deal.lossReason}</p>
          )}
          {deal.produtos.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1.5">
                <Package className="h-3 w-3" /> Produtos / Serviços
              </div>
              <div className="space-y-1">
                {deal.produtos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border">
                    <span className="text-gray-700">{p.productName ?? '—'}</span>
                    <div className="flex items-center gap-3 text-gray-400">
                      <span>Qtd: {p.quantity ?? '1'}</span>
                      <span className="font-medium text-gray-600">{fmt(p.unitPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {deal.produtos.length === 0 && (
            <p className="text-xs text-gray-400 italic">Nenhum produto vinculado</p>
          )}
          <div className="pt-1">
            <Link href={`/deals`}
              className="text-xs text-[#1B4F8A] hover:underline font-medium">
              Ver no kanban de deals →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export function DealsSection({ deals, contatoId }: { deals: Deal[]; contatoId: string }) {
  const [open, setOpen] = useState(true)

  const totalAberto = deals.filter(d => d.status === 'open').reduce((s, d) => s + Number(d.value ?? 0), 0)
  const totalGanho = deals.filter(d => d.status === 'won').reduce((s, d) => s + Number(d.value ?? 0), 0)

  return (
    <div className="bg-white rounded-xl border">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors rounded-xl">
        <div className="flex items-center gap-2">
          <Handshake className="h-4 w-4 text-[#1B4F8A]" />
          <span className="font-semibold text-sm text-[#1A1A2E]">Deals / Propostas</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{deals.length}</span>
        </div>
        <div className="flex items-center gap-4">
          {totalAberto > 0 && (
            <span className="text-xs text-blue-600 font-medium">
              Em aberto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAberto)}
            </span>
          )}
          {totalGanho > 0 && (
            <span className="text-xs text-green-600 font-medium">
              Ganho: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGanho)}
            </span>
          )}
          {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-6 pb-5 space-y-2">
          {deals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum deal vinculado ainda.</p>
          ) : (
            deals.map(d => <DealCard key={d.id} deal={d} />)
          )}
          <Link href={`/deals?contato=${contatoId}`}
            className="flex items-center gap-1.5 text-xs text-[#1B4F8A] font-medium hover:underline mt-2">
            <Plus className="h-3.5 w-3.5" /> Novo deal para este contato
          </Link>
        </div>
      )}
    </div>
  )
}
