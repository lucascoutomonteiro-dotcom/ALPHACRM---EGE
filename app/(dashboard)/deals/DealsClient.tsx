'use client'

import { useState, useTransition } from 'react'
import { criarDeal, editarDeal, excluirDeal, fecharDeal, type DealInput } from './actions'
import { atualizarTemperatura } from './colunas-actions'
import { GerenciarColunasDeal } from '@/components/deals/GerenciarColunasDeal'
import { Plus, Edit2, Trash2, X, Trophy, XCircle, DollarSign, Calendar, ChevronRight, LayoutGrid, List, Flame } from 'lucide-react'
import { useRouter } from 'next/navigation'

type DealColuna = { id: string; nome: string; cor: string; ordem: number; sistema: boolean | null; slug: string | null }
type Contato = { id: string; nome: string | null }
type Deal = {
  id: string
  title: string
  value: string | null
  probability: number | null
  contatoId: string | null
  status: string | null
  temperatura: string | null
  expectedCloseDate: string | null
  lossReason: string | null
  description: string | null
  createdAt: Date | string | null
}

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
}
const STATUS_LABEL: Record<string, string> = { open: 'Aberto', won: 'Ganho', lost: 'Perdido' }

const MOTIVOS_PERDA = ['Preço', 'Escopo', 'Prazo', 'Outros']

function fmt(value: string | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

// ─── DealForm (simplificado — sem pipeline/stage) ─────────────────────────────
function DealForm({ deal, contatos, onClose }: {
  deal?: Deal
  contatos: Contato[]
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [form, setForm] = useState<DealInput>({
    title: deal?.title ?? '',
    value: deal?.value ? Number(deal.value) : null,
    probability: deal?.probability ?? 0,
    contatoId: deal?.contatoId ?? null,
    expectedCloseDate: deal?.expectedCloseDate ?? null,
    description: deal?.description ?? null,
  })
  const set = (k: keyof DealInput, v: string | number | null) => setForm(f => ({ ...f, [k]: v }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (deal) await editarDeal(deal.id, form)
      else await criarDeal(form)
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-[#1A1A2E]">{deal ? 'Editar Proposta' : 'Nova Proposta'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Título *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Valor (R$)</label>
              <input type="number" min={0} step={0.01} value={form.value ?? ''}
                onChange={e => set('value', e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Probabilidade (%)</label>
              <input type="number" min={0} max={100} value={form.probability ?? 0}
                onChange={e => set('probability', Number(e.target.value))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
          </div>
          {contatos.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-600">Contato</label>
              <select value={form.contatoId ?? ''} onChange={e => set('contatoId', e.target.value || null)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                <option value="">—</option>
                {contatos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600">Previsão de fechamento</label>
            <input type="date" value={form.expectedCloseDate ?? ''}
              onChange={e => set('expectedCloseDate', e.target.value || null)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Descrição</label>
            <textarea rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value || null)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={pending}
              className="flex-1 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#163f70] disabled:opacity-50">
              {pending ? 'Salvando...' : deal ? 'Salvar' : 'Criar Proposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── TemperaturaKanban ─────────────────────────────────────────────────────────
function TemperaturaKanban({ deals, colunas, onEdit, onDelete, onPerdida, onGanho, onReabrir }: {
  deals: Deal[]
  colunas: DealColuna[]
  onEdit: (d: Deal) => void
  onDelete: (d: Deal) => void
  onPerdida: (d: Deal) => void
  onGanho: (d: Deal) => void
  onReabrir: (d: Deal, paraSlug: string) => void
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [dragging, setDragging] = useState<string | null>(null)

  function getDealColuna(deal: Deal, col: DealColuna): boolean {
    if (col.slug === 'perdida') return deal.status === 'lost'
    if (col.slug === 'ganho')   return deal.status === 'won'
    if (deal.status !== 'open') return false
    // temperatura matches slug (sistema) or column id (custom)
    const temp = deal.temperatura ?? 'morno'
    return temp === (col.slug ?? col.id)
  }

  function onDrop(coluna: DealColuna) {
    if (!dragging) return
    const deal = deals.find(d => d.id === dragging)
    if (!deal) return
    setDragging(null)

    if (coluna.slug === 'perdida') {
      if (deal.status === 'won') { onReabrir(deal, 'perdida'); return }
      if (deal.status !== 'lost') { onPerdida(deal); return }
      return
    }
    if (coluna.slug === 'ganho') {
      if (deal.status === 'lost') { onReabrir(deal, 'ganho'); return }
      if (deal.status !== 'won') { onGanho(deal); return }
      return
    }
    // Moving to open column
    const newTemp = coluna.slug ?? coluna.id
    if (deal.status === 'open' && deal.temperatura === newTemp) return
    startTransition(async () => {
      await atualizarTemperatura(deal.id, newTemp)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {colunas.map(col => {
        const colDeals = deals.filter(d => getDealColuna(d, col))
        const total = colDeals.reduce((s, d) => s + (d.value ? Number(d.value) : 0), 0)
        const isPerdida = col.slug === 'perdida'
        const isGanho = col.slug === 'ganho'

        return (
          <div key={col.id}
            className="flex-shrink-0 w-64 bg-gray-50 rounded-xl p-3"
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(col)}>
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: col.cor }} />
              <span className="text-xs font-semibold text-gray-700 flex-1 truncate">{col.nome}</span>
              <span className="text-xs text-gray-400 shrink-0">{colDeals.length}</span>
            </div>
            {total > 0 && (
              <div className="text-xs font-medium text-gray-500 mb-2">{fmt(String(total))}</div>
            )}

            {/* Cards */}
            <div className="space-y-2">
              {colDeals.map(deal => {
                const isOverdue = deal.status === 'open' && deal.expectedCloseDate && deal.expectedCloseDate < new Date().toISOString().slice(0, 10)
                return (
                  <div key={deal.id}
                    draggable={!isPerdida && !isGanho}
                    onDragStart={() => !isPerdida && !isGanho && setDragging(deal.id)}
                    onDragEnd={() => setDragging(null)}
                    className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow ${
                      dragging === deal.id ? 'opacity-40' : ''
                    } ${isOverdue ? 'border-orange-200' : ''} ${
                      isPerdida || isGanho ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}>
                    <div className="font-medium text-xs text-[#1A1A2E] mb-1 leading-snug">{deal.title}</div>
                    {deal.value && (
                      <div className="text-xs font-semibold text-[#1B4F8A] flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />{fmt(deal.value)}
                      </div>
                    )}
                    {deal.expectedCloseDate && (
                      <div className={`text-xs flex items-center gap-1 mt-0.5 ${isOverdue ? 'text-orange-500' : 'text-gray-400'}`}>
                        <Calendar className="h-3 w-3" />
                        {new Date(deal.expectedCloseDate).toLocaleDateString('pt-BR')}
                        {isOverdue && <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded">atrasado</span>}
                      </div>
                    )}
                    {deal.probability != null && deal.probability > 0 && deal.status === 'open' && (
                      <div className="mt-1.5">
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1B4F8A] rounded-full" style={{ width: `${deal.probability}%` }} />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{deal.probability}%</div>
                      </div>
                    )}
                    {isPerdida && deal.lossReason && (
                      <p className="text-[10px] text-red-400 mt-1 italic">{deal.lossReason}</p>
                    )}
                    <div className="flex gap-1 mt-2 pt-2 border-t">
                      {deal.status === 'open' && (
                        <>
                          <button onClick={() => onGanho(deal)} className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded" title="Ganho">
                            <Trophy className="h-3 w-3" />
                          </button>
                          <button onClick={() => onPerdida(deal)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Perdido">
                            <XCircle className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      {(isPerdida || isGanho) && (
                        <button onClick={() => onReabrir(deal, 'morno')} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded text-[10px]" title="Reabrir">
                          ↩
                        </button>
                      )}
                      <button onClick={() => onEdit(deal)} className="p-1 text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 rounded">
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button onClick={() => onDelete(deal)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Modal motivo de perda ─────────────────────────────────────────────────────
function ModalPerdida({ deal, onConfirm, onCancel, pending }: {
  deal: Deal
  onConfirm: (motivo: string) => void
  onCancel: () => void
  pending: boolean
}) {
  const [motivo, setMotivo] = useState(MOTIVOS_PERDA[0])
  const [outro, setOutro] = useState('')

  const motivoFinal = motivo === 'Outros' ? (outro.trim() || 'Outros') : motivo

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center mb-4">
          <XCircle className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="font-bold text-[#1A1A2E] mb-1">Marcar como Perdido</h3>
        <p className="text-sm text-gray-500 mb-4"><strong>{deal.title}</strong></p>

        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-gray-600">Motivo da perda</p>
          {MOTIVOS_PERDA.map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="motivo" value={m} checked={motivo === m} onChange={() => setMotivo(m)}
                className="accent-[#1B4F8A]" />
              <span className="text-sm text-gray-700">{m}</span>
            </label>
          ))}
          {motivo === 'Outros' && (
            <input value={outro} onChange={e => setOutro(e.target.value)}
              placeholder="Descreva o motivo..."
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-red-200" />
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onConfirm(motivoFinal)} disabled={pending}
            className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
            {pending ? 'Salvando...' : 'Confirmar perda'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DealsClient ───────────────────────────────────────────────────────────────
export function DealsClient({ deals: initial, colunas, contatos }: {
  deals: Deal[]
  colunas: DealColuna[]
  contatos: Contato[]
}) {
  const router = useRouter()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Deal | null>(null)
  const [deleting, setDeleting] = useState<Deal | null>(null)
  const [perdidaDeal, setPerdidaDeal] = useState<Deal | null>(null)
  const [ganhandoDeal, setGanhandoDeal] = useState<Deal | null>(null)
  const [pending, startTransition] = useTransition()

  const totalOpen = initial.filter(d => d.status === 'open').reduce((s, d) => s + (d.value ? Number(d.value) : 0), 0)
  const totalWon  = initial.filter(d => d.status === 'won').reduce((s, d) => s + (d.value ? Number(d.value) : 0), 0)

  function handlePerdida(motivo: string) {
    if (!perdidaDeal) return
    startTransition(async () => {
      await fecharDeal(perdidaDeal.id, false, motivo)
      setPerdidaDeal(null)
      router.refresh()
    })
  }

  function handleGanho() {
    if (!ganhandoDeal) return
    startTransition(async () => {
      await fecharDeal(ganhandoDeal.id, true)
      setGanhandoDeal(null)
      router.refresh()
    })
  }

  function handleReabrir(deal: Deal, paraSlug: string) {
    startTransition(async () => {
      await atualizarTemperatura(deal.id, paraSlug === 'perdida' ? 'morno' : paraSlug === 'ganho' ? 'morno' : paraSlug)
      router.refresh()
    })
  }

  function doDelete(deal: Deal) {
    startTransition(async () => {
      await excluirDeal(deal.id)
      setDeleting(null)
      router.refresh()
    })
  }

  // Temperatura label for list view
  const tempLabel: Record<string, { label: string; style: string }> = {}
  colunas.forEach(c => {
    const key = c.slug ?? c.id
    tempLabel[key] = { label: c.nome, style: '' }
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4F8A]">Propostas</h1>
          <p className="text-sm text-gray-500">{initial.length} proposta{initial.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GerenciarColunasDeal colunas={colunas} />
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setView('kanban')}
              className={`p-2 ${view === 'kanban' ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#163f70]">
            <Plus className="h-4 w-4" /> Nova Proposta
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-3">
          <div className="text-xs text-gray-500">Em aberto</div>
          <div className="text-lg font-bold text-[#1B4F8A]">{fmt(String(totalOpen))}</div>
          <div className="text-xs text-gray-400">{initial.filter(d => d.status === 'open').length} propostas</div>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <div className="text-xs text-gray-500">Ganhos</div>
          <div className="text-lg font-bold text-green-600">{fmt(String(totalWon))}</div>
          <div className="text-xs text-gray-400">{initial.filter(d => d.status === 'won').length} propostas</div>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <div className="text-xs text-gray-500">Perdidos</div>
          <div className="text-lg font-bold text-red-500">
            {initial.filter(d => d.status === 'lost').length} propostas
          </div>
        </div>
      </div>

      {/* Kanban ou Lista */}
      {view === 'kanban' ? (
        <TemperaturaKanban
          deals={initial}
          colunas={colunas}
          onEdit={setEditing}
          onDelete={setDeleting}
          onPerdida={d => setPerdidaDeal(d)}
          onGanho={d => setGanhandoDeal(d)}
          onReabrir={handleReabrir}
        />
      ) : (
        <div className="space-y-2">
          {initial.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhuma proposta ainda.</div>
          ) : initial.map(deal => {
            const tempKey = deal.temperatura ?? 'morno'
            const tempInfo = tempLabel[tempKey]
            const col = colunas.find(c => (c.slug ?? c.id) === tempKey)
            return (
              <div key={deal.id} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-4 hover:shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#1A1A2E]">{deal.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[deal.status ?? 'open'] ?? ''}`}>
                      {STATUS_LABEL[deal.status ?? 'open']}
                    </span>
                    {deal.status === 'open' && col && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                        style={{ backgroundColor: col.cor }}>
                        {col.nome}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    {deal.value && <span className="font-medium text-[#1B4F8A]">{fmt(deal.value)}</span>}
                    {deal.probability != null && deal.probability > 0 && <span>{deal.probability}%</span>}
                    {deal.expectedCloseDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(deal.expectedCloseDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {deal.lossReason && <span className="text-red-400 italic">{deal.lossReason}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {deal.status === 'open' && (<>
                    <button onClick={() => setGanhandoDeal(deal)}
                      className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg" title="Ganho">
                      <Trophy className="h-4 w-4" />
                    </button>
                    <button onClick={() => setPerdidaDeal(deal)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Perdido">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </>)}
                  <button onClick={() => setEditing(deal)} className="p-1.5 text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 rounded-lg">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(deal)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal form */}
      {(showForm || editing) && (
        <DealForm
          deal={editing ?? undefined}
          contatos={contatos}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* Modal — Marcar como Perdido */}
      {perdidaDeal && (
        <ModalPerdida
          deal={perdidaDeal}
          onConfirm={handlePerdida}
          onCancel={() => setPerdidaDeal(null)}
          pending={pending}
        />
      )}

      {/* Modal — Marcar como Ganho */}
      {ganhandoDeal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center mb-4">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-bold text-[#1A1A2E] mb-1">Marcar como Ganho</h3>
            <p className="text-sm text-gray-500 mb-6"><strong>{ganhandoDeal.title}</strong></p>
            <div className="flex gap-2">
              <button onClick={() => setGanhandoDeal(null)}
                className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleGanho} disabled={pending}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {pending ? 'Salvando...' : '🎉 Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Excluir */}
      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-[#1A1A2E] mb-2">Excluir proposta?</h3>
            <p className="text-sm text-gray-600 mb-5"><strong>{deleting.title}</strong> será removida permanentemente.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => doDelete(deleting)} disabled={pending}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {pending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
