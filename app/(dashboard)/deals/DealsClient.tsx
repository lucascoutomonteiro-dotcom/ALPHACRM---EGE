'use client'

import { useState, useTransition } from 'react'
import { criarDeal, editarDeal, excluirDeal, moverDealStage, fecharDeal, type DealInput } from './actions'
import { Plus, Edit2, Trash2, X, Trophy, XCircle, DollarSign, Calendar, ChevronRight, LayoutGrid, List } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Stage = { id: string; name: string; order: number; color: string | null; isWon: boolean | null; isLost: boolean | null; probability: number | null }
type Pipeline = { id: string; name: string }
type Contato = { id: string; nome: string | null }
type Deal = {
  id: string
  title: string
  value: string | null
  probability: number | null
  pipelineId: string | null
  stageId: string | null
  contatoId: string | null
  accountId: string | null
  responsavelId: string | null
  status: string | null
  expectedCloseDate: string | null
  description: string | null
  createdAt: Date | string | null
}

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<string, string> = { open: 'Aberto', won: 'Ganho', lost: 'Perdido' }

function fmt(value: string | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

function DealForm({ deal, pipelines, stages, contatos, onClose }: {
  deal?: Deal
  pipelines: Pipeline[]
  stages: Stage[]
  contatos: Contato[]
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [selectedPipeline, setSelectedPipeline] = useState(deal?.pipelineId ?? pipelines[0]?.id ?? '')
  const [form, setForm] = useState<DealInput>({
    title: deal?.title ?? '',
    value: deal?.value ? Number(deal.value) : null,
    probability: deal?.probability ?? 0,
    pipelineId: deal?.pipelineId ?? pipelines[0]?.id ?? null,
    stageId: deal?.stageId ?? null,
    contatoId: deal?.contatoId ?? null,
    expectedCloseDate: deal?.expectedCloseDate ?? null,
    description: deal?.description ?? null,
  })

  const filteredStages = stages.filter(s => s.id === s.id && (!selectedPipeline || true))
    .sort((a, b) => a.order - b.order)

  const set = (k: keyof DealInput, v: string | number | null) => setForm(f => ({ ...f, [k]: v }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (deal) await editarDeal(deal.id, { ...form, pipelineId: selectedPipeline })
      else await criarDeal({ ...form, pipelineId: selectedPipeline })
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-[#1A1A2E]">{deal ? 'Editar Deal' : 'Novo Deal'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Título *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
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
            {pipelines.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600">Pipeline</label>
                <select value={selectedPipeline} onChange={e => { setSelectedPipeline(e.target.value); set('stageId', null) }}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                  {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            {filteredStages.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600">Etapa</label>
                <select value={form.stageId ?? ''} onChange={e => set('stageId', e.target.value || null)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                  <option value="">—</option>
                  {filteredStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {contatos.length > 0 && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Contato</label>
                <select value={form.contatoId ?? ''} onChange={e => set('contatoId', e.target.value || null)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                  <option value="">—</option>
                  {contatos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Previsão de fechamento</label>
              <input type="date" value={form.expectedCloseDate ?? ''}
                onChange={e => set('expectedCloseDate', e.target.value || null)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Descrição</label>
              <textarea rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value || null)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={pending}
              className="flex-1 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#163f70] disabled:opacity-50">
              {pending ? 'Salvando...' : deal ? 'Salvar' : 'Criar Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function KanbanBoard({ deals, stages, stageMap, onEdit, onDelete, onClose: onCloseStage }: {
  deals: Deal[]
  stages: Stage[]
  stageMap: Map<string, Stage>
  onEdit: (d: Deal) => void
  onDelete: (d: Deal) => void
  onClose: (d: Deal, won: boolean) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dragging, setDragging] = useState<string | null>(null)

  const openDeals = deals.filter(d => d.status === 'open')

  function onDrop(stageId: string) {
    if (!dragging || dragging === stageId) return
    startTransition(async () => {
      await moverDealStage(dragging, stageId)
      setDragging(null)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stages.filter(s => !s.isLost).map(stage => {
        const stageDeals = openDeals.filter(d => d.stageId === stage.id)
        const total = stageDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0)
        return (
          <div key={stage.id}
            className="flex-shrink-0 w-64 bg-gray-50 rounded-xl p-3"
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(stage.id)}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color ?? '#9CA3AF' }} />
              <span className="text-xs font-semibold text-gray-700 flex-1">{stage.name}</span>
              <span className="text-xs text-gray-400">{stageDeals.length}</span>
            </div>
            {total > 0 && (
              <div className="text-xs text-gray-500 mb-2">{fmt(String(total))}</div>
            )}
            <div className="space-y-2">
              {stageDeals.map(deal => (
                <div key={deal.id}
                  draggable
                  onDragStart={() => setDragging(deal.id)}
                  onDragEnd={() => setDragging(null)}
                  className={`bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${dragging === deal.id ? 'opacity-50' : ''}`}>
                  <div className="font-medium text-xs text-[#1A1A2E] mb-1">{deal.title}</div>
                  {deal.value && (
                    <div className="text-xs font-semibold text-[#1B4F8A] flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />{fmt(deal.value)}
                    </div>
                  )}
                  {deal.expectedCloseDate && (
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(deal.expectedCloseDate).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {deal.probability != null && deal.probability > 0 && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1B4F8A] rounded-full" style={{ width: `${deal.probability}%` }} />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{deal.probability}%</div>
                    </div>
                  )}
                  <div className="flex gap-1 mt-2 pt-2 border-t">
                    <button onClick={() => onCloseStage(deal, true)}
                      className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded" title="Marcar como Ganho">
                      <Trophy className="h-3 w-3" />
                    </button>
                    <button onClick={() => onCloseStage(deal, false)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Marcar como Perdido">
                      <XCircle className="h-3 w-3" />
                    </button>
                    <button onClick={() => onEdit(deal)}
                      className="p-1 text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 rounded">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => onDelete(deal)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DealsClient({ deals: initial, pipelines, stages, contatos }: {
  deals: Deal[]
  pipelines: Pipeline[]
  stages: Stage[]
  contatos: Contato[]
}) {
  const router = useRouter()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Deal | null>(null)
  const [deleting, setDeleting] = useState<Deal | null>(null)
  const [closing, setClosing] = useState<{ deal: Deal; won: boolean } | null>(null)
  const [lossReason, setLossReason] = useState('')
  const [pending, startTransition] = useTransition()

  const stageMap = new Map(stages.map(s => [s.id, s]))

  const totalOpen = initial.filter(d => d.status === 'open').reduce((s, d) => s + (d.value ? Number(d.value) : 0), 0)
  const totalWon = initial.filter(d => d.status === 'won').reduce((s, d) => s + (d.value ? Number(d.value) : 0), 0)

  function doDelete(deal: Deal) {
    startTransition(async () => {
      await excluirDeal(deal.id)
      setDeleting(null)
      router.refresh()
    })
  }

  function doClose() {
    if (!closing) return
    startTransition(async () => {
      await fecharDeal(closing.deal.id, closing.won, lossReason)
      setClosing(null)
      setLossReason('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4F8A]">Deals</h1>
          <p className="text-sm text-gray-500">{initial.length} negócios</p>
        </div>
        <div className="flex items-center gap-2">
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
            <Plus className="h-4 w-4" /> Novo Deal
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-3">
          <div className="text-xs text-gray-500">Em aberto</div>
          <div className="text-lg font-bold text-[#1B4F8A]">{fmt(String(totalOpen))}</div>
          <div className="text-xs text-gray-400">{initial.filter(d => d.status === 'open').length} deals</div>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <div className="text-xs text-gray-500">Ganhos</div>
          <div className="text-lg font-bold text-green-600">{fmt(String(totalWon))}</div>
          <div className="text-xs text-gray-400">{initial.filter(d => d.status === 'won').length} deals</div>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <div className="text-xs text-gray-500">Perdidos</div>
          <div className="text-lg font-bold text-red-500">
            {initial.filter(d => d.status === 'lost').length} deals
          </div>
        </div>
      </div>

      {/* Kanban ou Lista */}
      {view === 'kanban' ? (
        stages.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Nenhum pipeline configurado. Crie um em <strong>Admin → Pipelines</strong>.
          </div>
        ) : (
          <KanbanBoard
            deals={initial}
            stages={stages}
            stageMap={stageMap}
            onEdit={setEditing}
            onDelete={setDeleting}
            onClose={(deal, won) => { setClosing({ deal, won }); setLossReason('') }}
          />
        )
      ) : (
        <div className="space-y-2">
          {initial.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhum deal ainda.</div>
          ) : initial.map(deal => (
            <div key={deal.id} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-4 hover:shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[#1A1A2E]">{deal.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[deal.status ?? 'open'] ?? ''}`}>
                    {STATUS_LABEL[deal.status ?? 'open']}
                  </span>
                  {deal.stageId && stageMap.get(deal.stageId) && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" />{stageMap.get(deal.stageId)?.name}
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
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {deal.status === 'open' && (<>
                  <button onClick={() => { setClosing({ deal, won: true }); setLossReason('') }}
                    className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg" title="Ganho">
                    <Trophy className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setClosing({ deal, won: false }); setLossReason('') }}
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
          ))}
        </div>
      )}

      {/* Modal form */}
      {(showForm || editing) && (
        <DealForm
          deal={editing ?? undefined}
          pipelines={pipelines}
          stages={stages}
          contatos={contatos}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* Confirmar fechar deal */}
      {closing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${closing.won ? 'bg-green-100' : 'bg-red-100'}`}>
              {closing.won ? <Trophy className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-500" />}
            </div>
            <h3 className="font-bold text-[#1A1A2E] mb-1">
              {closing.won ? 'Marcar como Ganho' : 'Marcar como Perdido'}
            </h3>
            <p className="text-sm text-gray-500 mb-4"><strong>{closing.deal.title}</strong></p>
            {!closing.won && (
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-600">Motivo da perda (opcional)</label>
                <input value={lossReason} onChange={e => setLossReason(e.target.value)}
                  placeholder="Ex: Preço, concorrente, sem budget..."
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setClosing(null)}
                className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={doClose} disabled={pending}
                className={`flex-1 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${closing.won ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                {pending ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-[#1A1A2E] mb-2">Excluir deal?</h3>
            <p className="text-sm text-gray-600 mb-5"><strong>{deleting.title}</strong> será removido permanentemente.</p>
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
