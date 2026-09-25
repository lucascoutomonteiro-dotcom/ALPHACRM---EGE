'use client'

import React from 'react'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { atualizarStatusPlano, salvarAcao, excluirAcao } from './actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Plus, ChevronDown, ChevronUp, Calendar, AlertCircle, Pencil, MessageSquare, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { differenceInDays, parseISO } from 'date-fns'

const STATUS_ACAO = ['A INICIAR', 'EM ANDAMENTO', 'EM REVISÃO', 'EM APROVAÇÃO', 'CONCLUIDO', 'BLOQUEADO']
const STATUS_KANBAN_ORDER = ['EM ANDAMENTO', 'A INICIAR', 'EM REVISÃO', 'EM APROVAÇÃO', 'CONCLUIDO', 'BLOQUEADO']

const STATUS_CORES: Record<string, { badge: string; select: string }> = {
  'A INICIAR':    { badge: 'bg-gray-100 text-gray-600 border-gray-200',    select: 'text-gray-600' },
  'EM ANDAMENTO': { badge: 'bg-blue-100 text-blue-700 border-blue-200',    select: 'text-blue-700' },
  'EM REVISÃO':   { badge: 'bg-purple-100 text-purple-700 border-purple-200', select: 'text-purple-700' },
  'EM APROVAÇÃO': { badge: 'bg-orange-100 text-orange-700 border-orange-200', select: 'text-orange-700' },
  'CONCLUIDO':    { badge: 'bg-green-100 text-green-700 border-green-200', select: 'text-green-700' },
  'BLOQUEADO':    { badge: 'bg-red-100 text-red-700 border-red-200',       select: 'text-red-700' },
}

interface Acao {
  id: string
  frente: string | null
  oQue: string | null
  porQue: string | null
  quem: string | null
  quando: string | null
  dataLimite: string | null
  onde: string | null
  como: string | null
  kpi: string | null
  status: string | null
  prazo: string | null
  observacao: string | null
}

function DataLimiteLabel({ data }: { data: string | null }) {
  if (!data) return null
  const diff = differenceInDays(parseISO(data), new Date())
  if (diff < 0) return (
    <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
      <AlertCircle className="h-3 w-3" />{Math.abs(diff)}d vencido
    </span>
  )
  if (diff === 0) return <span className="text-xs text-red-600 font-semibold">Vence hoje</span>
  if (diff <= 7) return <span className="text-xs text-orange-500 font-medium">+{diff}d</span>
  return (
    <span className="text-xs text-gray-400 flex items-center gap-1">
      <Calendar className="h-3 w-3" />
      {new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
    </span>
  )
}

// ─── List Delete Button ───────────────────────────────────────────────────────
function ListDeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirm, setConfirm] = useState(false)
  if (confirm) return (
    <div className="flex items-center gap-1">
      <button onClick={onConfirm} className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200 text-xs font-semibold">Sim</button>
      <button onClick={() => setConfirm(false)} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs">Não</button>
    </div>
  )
  return (
    <button onClick={() => setConfirm(true)} className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500" title="Excluir">
      <Trash2 className="h-4 w-4" />
    </button>
  )
}

// ─── Edit + Observação Dialog ────────────────────────────────────────────────
function EditAcaoDialog({
  open, onClose, acao, loading, onSalvar,
}: {
  open: boolean
  onClose: () => void
  acao: Acao | null
  loading: boolean
  onSalvar: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  if (!acao) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Ação</DialogTitle></DialogHeader>
        <form onSubmit={onSalvar} className="space-y-3">
          <input type="hidden" name="id" value={acao.id} />
          <input type="hidden" name="prazo" value={acao.prazo ?? ''} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>O QUE (Ação)</Label>
              <Input name="oQue" defaultValue={acao.oQue ?? ''} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>POR QUE (Justificativa)</Label>
              <Input name="porQue" defaultValue={acao.porQue ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>QUEM</Label>
              <Input name="quem" defaultValue={acao.quem ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>QUANDO</Label>
              <Input name="quando" defaultValue={acao.quando ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>Data Limite</Label>
              <Input name="dataLimite" type="date" defaultValue={acao.dataLimite ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>ONDE</Label>
              <Input name="onde" defaultValue={acao.onde ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>FRENTE</Label>
              <Input name="frente" defaultValue={acao.frente ?? ''} placeholder="F1" />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select name="status" defaultValue={acao.status ?? 'A INICIAR'} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                {STATUS_ACAO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>COMO</Label>
              <Textarea name="como" rows={2} defaultValue={acao.como ?? ''} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>KPI / QUANTO</Label>
              <Input name="kpi" defaultValue={acao.kpi ?? ''} />
            </div>
          </div>

          {/* Observação de evolução */}
          <div className="border-t pt-3 space-y-2">
            <Label className="flex items-center gap-1.5 text-[#1B4F8A] font-semibold">
              <MessageSquare className="h-4 w-4" /> Nova observação / Evolução
            </Label>
            {/* Campo oculto com o histórico existente */}
            <input type="hidden" name="observacaoAtual" value={acao.observacao ?? ''} />
            <Textarea
              name="novaObservacao"
              rows={3}
              defaultValue=""
              placeholder="Registre o progresso de hoje, bloqueios, próximos passos..."
              className="border-blue-200 focus:border-[#1B4F8A]"
            />
            {/* Histórico anterior — somente leitura */}
            {acao.observacao && (
              <div className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-500 max-h-36 overflow-y-auto">
                <p className="font-semibold text-gray-400 mb-1 uppercase tracking-wide text-[10px]">Histórico anterior</p>
                <p className="whitespace-pre-wrap">{acao.observacao}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-[#1B4F8A] hover:bg-[#163f70]" disabled={loading}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Nova Ação Dialog ─────────────────────────────────────────────────────────
function NovaAcaoDialog({ open, onClose, onSalvar, prazo, loading }: {
  open: boolean; onClose: () => void; onSalvar: (e: React.FormEvent<HTMLFormElement>) => void; prazo: string; loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nova Ação — {prazo}</DialogTitle></DialogHeader>
        <form onSubmit={onSalvar} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>O QUE</Label><Input name="oQue" /></div>
            <div className="space-y-1"><Label>POR QUE</Label><Input name="porQue" /></div>
            <div className="space-y-1"><Label>QUEM</Label><Input name="quem" /></div>
            <div className="space-y-1"><Label>QUANDO</Label><Input name="quando" /></div>
            <div className="space-y-1"><Label>Data Limite</Label><Input name="dataLimite" type="date" /></div>
            <div className="space-y-1"><Label>ONDE</Label><Input name="onde" /></div>
            <div className="space-y-1"><Label>FRENTE (F1-F6)</Label><Input name="frente" placeholder="F1" /></div>
          </div>
          <div className="space-y-1"><Label>COMO</Label><Textarea name="como" rows={2} /></div>
          <div className="space-y-1"><Label>KPI</Label><Input name="kpi" /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-[#1B4F8A] hover:bg-[#163f70]" disabled={loading}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({ a, onStatusChange, onEdit, onDelete }: {
  a: Acao
  onStatusChange: (id: string, s: string | null) => void
  onEdit: (a: Acao) => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const status = a.status ?? 'A INICIAR'
  const cores = STATUS_CORES[status] ?? STATUS_CORES['A INICIAR']
  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1">
          {a.frente && (
            <span className="text-xs bg-[#1B4F8A] text-white px-1.5 py-0.5 rounded-full shrink-0">{a.frente}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <DataLimiteLabel data={a.dataLimite} />
          <button onClick={() => onEdit(a)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-[#1B4F8A]" title="Editar">
            <Pencil className="h-3 w-3" />
          </button>
          {confirmDelete ? (
            <>
              <button onClick={() => onDelete(a.id)} className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 text-xs font-semibold">Sim</button>
              <button onClick={() => setConfirmDelete(false)} className="p-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs">Não</button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500" title="Excluir">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <p className="font-medium text-sm leading-snug">{a.oQue || 'Sem título'}</p>
      {a.porQue && <p className="text-xs text-gray-400 line-clamp-2">{a.porQue}</p>}
      {a.observacao && (
        <div className="text-xs bg-blue-50 border border-blue-100 rounded p-1.5 text-blue-700 line-clamp-2">
          <MessageSquare className="h-3 w-3 inline mr-1" />{a.observacao}
        </div>
      )}
      {a.quem && <p className="text-xs text-gray-500">👤 {a.quem}</p>}
      {a.dataLimite && (() => {
        const atrasado = differenceInDays(parseISO(a.dataLimite), new Date()) < 0 && status !== 'CONCLUIDO'
        const dataFmt = new Date(a.dataLimite + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        return (
          <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border', atrasado ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200')}>
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="font-semibold">Data Limite:</span> {dataFmt}
            {atrasado && <span className="ml-1">⚠</span>}
          </div>
        )
      })()}
      <Select value={status} onValueChange={(v) => onStatusChange(a.id, v)}>
        <SelectTrigger className={cn('h-6 text-xs border', cores.badge)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ACAO.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface PlanoAcaoListProps {
  prazo: string
  label?: string
  labelNode?: React.ReactNode
  border: string
  bg: string
  acoes: Acao[]
  view?: 'lista' | 'kanban'
  onCardDragStart?: (id: string) => void
  onCardDragEnd?: () => void
}

export function PlanoAcaoList({ prazo, label, labelNode, border, bg, acoes, view = 'lista', onCardDragStart, onCardDragEnd }: PlanoAcaoListProps) {
  const [expanded, setExpanded] = useState<string[]>([])
  const [novaAcaoOpen, setNovaAcaoOpen] = useState(false)
  const [editAcao, setEditAcao] = useState<Acao | null>(null)
  const [loading, setLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)
  const [deletandoIds, setDeletandoIds] = useState<string[]>([])

  function toggleExpand(id: string) {
    setExpanded((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  async function handleStatus(id: string, status: string | null) {
    if (!status) return
    await atualizarStatusPlano(id, status)
    toast.success('Status atualizado!')
  }

  async function handleSalvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    if (!fd.get('prazo')) fd.set('prazo', prazo)
    const result = await salvarAcao(fd)
    setLoading(false)
    if (result.success) {
      toast.success(fd.get('id') ? 'Ação atualizada!' : 'Ação criada!')
      setNovaAcaoOpen(false)
      setEditAcao(null)
    } else {
      toast.error('Erro ao salvar.')
    }
  }

  function getStatusLocal(a: Acao) {
    return localStatus[a.id] ?? a.status ?? 'A INICIAR'
  }

  async function handleDelete(id: string) {
    setDeletandoIds((prev) => [...prev, id])
    await excluirAcao(id)
    toast.success('Ação excluída.')
  }

  async function handleDrop(targetStatus: string) {
    if (!draggingId) return
    const prevAcao = acoes.find((a) => a.id === draggingId)
    const prev = prevAcao ? getStatusLocal(prevAcao) : 'A INICIAR'
    if (prev === targetStatus) { setDraggingId(null); setDragOverStatus(null); return }
    setLocalStatus((s) => ({ ...s, [draggingId]: targetStatus }))
    setDraggingId(null)
    setDragOverStatus(null)
    await atualizarStatusPlano(draggingId, targetStatus)
    toast.success('Status atualizado!')
  }

  // ── Kanban ──
  if (view === 'kanban') {
    return (
      <div className={cn('rounded-xl border-l-4', border)}>
        <div className={cn('px-5 py-3 rounded-tr-xl rounded-br-xl flex items-center justify-between', bg)}>
          <div className="flex items-center gap-2">{labelNode ?? <span className="font-semibold text-sm">{label}</span>}<span className="text-xs text-gray-500 font-normal">— {acoes.length} ações</span></div>
          <Button size="sm" variant="outline" onClick={() => setNovaAcaoOpen(true)} className="h-7">
            <Plus className="h-3.5 w-3.5 mr-1" /> Nova ação
          </Button>
        </div>
        <div className="overflow-x-auto"><div className="grid gap-3 p-4 bg-gray-50/50" style={{ gridTemplateColumns: `repeat(${STATUS_KANBAN_ORDER.length}, minmax(200px, 1fr))`, minWidth: STATUS_KANBAN_ORDER.length * 220 }}>
          {STATUS_KANBAN_ORDER.map((status) => {
            const grupo = acoes.filter((a) => getStatusLocal(a) === status)
            const cores = STATUS_CORES[status]
            const isDragOver = dragOverStatus === status
            return (
              <div
                key={status}
                className={cn('space-y-2 rounded-lg p-1 transition-colors', isDragOver ? 'ring-2 ring-[#1B4F8A] ring-opacity-40 bg-blue-50/50' : '')}
                onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status) }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={() => handleDrop(status)}
              >
                <div className={cn('text-xs font-semibold px-2 py-1 rounded-md border text-center', cores.badge)}>
                  {status} ({grupo.length})
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {grupo.map((a) => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={() => { setDraggingId(a.id); onCardDragStart?.(a.id) }}
                      onDragEnd={() => { setDraggingId(null); setDragOverStatus(null); onCardDragEnd?.() }}
                      className={draggingId === a.id ? 'opacity-40' : ''}
                    >
                      <KanbanCard a={a} onStatusChange={handleStatus} onEdit={setEditAcao} onDelete={handleDelete} />
                    </div>
                  ))}
                  {grupo.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">Solte aqui</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>
        <NovaAcaoDialog open={novaAcaoOpen} onClose={() => setNovaAcaoOpen(false)} onSalvar={handleSalvar} prazo={prazo} loading={loading} />
        <EditAcaoDialog open={!!editAcao} onClose={() => setEditAcao(null)} acao={editAcao} loading={loading} onSalvar={handleSalvar} />
      </div>
    )
  }

  // ── Lista ──
  return (
    <div className={cn('rounded-xl border-l-4 bg-white', border)}>
      <div className={cn('px-5 py-3 rounded-tr-xl rounded-br-xl flex items-center justify-between', bg)}>
        <div className="flex items-center gap-2">{labelNode ?? <span className="font-semibold text-sm">{label}</span>}<span className="text-xs text-gray-500 font-normal">— {acoes.length} ações</span></div>
        <Button size="sm" variant="outline" onClick={() => setNovaAcaoOpen(true)} className="h-7">
          <Plus className="h-3.5 w-3.5 mr-1" /> Nova ação
        </Button>
      </div>

      <div className="divide-y">
        {acoes.map((a) => {
          const status = a.status ?? 'A INICIAR'
          const cores = STATUS_CORES[status] ?? STATUS_CORES['A INICIAR']
          const isExpanded = expanded.includes(a.id)
          const isDeleting = deletandoIds.includes(a.id)
          if (isDeleting) return null
          return (
            <div key={a.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.frente && (
                      <span className="text-xs bg-[#1B4F8A] text-white px-2 py-0.5 rounded-full">{a.frente}</span>
                    )}
                    <span className="font-medium text-sm">{a.oQue || 'Sem título'}</span>
                    <DataLimiteLabel data={a.dataLimite} />
                  </div>
                  {a.porQue && <p className="text-xs text-gray-500 mt-0.5">{a.porQue}</p>}
                  {a.observacao && !isExpanded && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      <span className="line-clamp-1">{a.observacao}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border hidden sm:inline', cores.badge)}>
                    {status}
                  </span>
                  <Select value={status} onValueChange={(v) => handleStatus(a.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ACAO.map((s) => (
                        <SelectItem key={s} value={s} className={cn('text-xs', STATUS_CORES[s]?.select)}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button onClick={() => setEditAcao(a)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-[#1B4F8A]" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <ListDeleteButton onConfirm={() => handleDelete(a.id)} />
                  <button onClick={() => toggleExpand(a.id)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-lg p-3">
                    {a.quem && <div><span className="font-semibold text-gray-500">QUEM: </span>{a.quem}</div>}
                    {a.quando && <div><span className="font-semibold text-gray-500">QUANDO: </span>{a.quando}</div>}
                    {a.onde && <div><span className="font-semibold text-gray-500">ONDE: </span>{a.onde}</div>}
                    {a.como && <div className="col-span-2"><span className="font-semibold text-gray-500">COMO: </span>{a.como}</div>}
                    {a.kpi && <div className="col-span-2"><span className="font-semibold text-gray-500">KPI: </span>{a.kpi}</div>}
                  </div>
                  {a.observacao && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                      <p className="font-semibold flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3.5 w-3.5" /> Observação / Evolução
                      </p>
                      <p className="whitespace-pre-wrap">{a.observacao}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {acoes.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-gray-400">Nenhuma ação cadastrada.</div>
        )}
      </div>

      <NovaAcaoDialog open={novaAcaoOpen} onClose={() => setNovaAcaoOpen(false)} onSalvar={handleSalvar} prazo={prazo} loading={loading} />
      <EditAcaoDialog open={!!editAcao} onClose={() => setEditAcao(null)} acao={editAcao} loading={loading} onSalvar={handleSalvar} />
    </div>
  )
}
