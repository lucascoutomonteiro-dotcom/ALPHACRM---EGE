'use client'

import { useState, useTransition } from 'react'
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, GripVertical, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  criarPipeline, atualizarPipeline, excluirPipeline,
  criarStage, atualizarStage, excluirStage, reordenarStages,
} from './actions'

type Pipeline = {
  id: string; name: string; description: string | null
  isDefault: boolean | null; active: boolean | null; createdAt: Date | null
}

type Stage = {
  id: string; pipelineId: string; name: string; order: number | null
  probability: number | null; color: string | null
  isWon: boolean | null; isLost: boolean | null; active: boolean | null
}

const CORES_PRESET = [
  '#9CA3AF','#60A5FA','#FBBF24','#A855F7',
  '#1B4F8A','#15803D','#0EA5E9','#22C55E','#EF4444','#F97316',
]

function StageRow({ stage, onEdit, onDelete, dragHandleProps }: {
  stage: Stage
  onEdit: (s: Stage) => void
  onDelete: (id: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}) {
  return (
    <div className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2 group">
      <span {...dragHandleProps} className="text-gray-300 cursor-grab hover:text-gray-400">
        <GripVertical className="h-4 w-4" />
      </span>
      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: stage.color ?? '#9CA3AF' }} />
      <span className="text-sm flex-1 font-medium text-gray-800">{stage.name}</span>
      <span className="text-xs text-gray-400 w-12 text-right">{stage.probability ?? 0}%</span>
      {stage.isWon && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Ganho</span>}
      {stage.isLost && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">Perdido</span>}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(stage)} className="p-1 text-gray-400 hover:text-amber-600 rounded"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={() => onDelete(stage.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  )
}

function FormStage({ pipelineId, stage, onClose }: { pipelineId: string; stage?: Stage; onClose: () => void }) {
  const [cor, setCor] = useState(stage?.color ?? '#9CA3AF')
  const [pending, start] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('color', cor)
    start(async () => {
      try {
        if (stage) await atualizarStage(stage.id, fd)
        else await criarStage(pipelineId, fd)
        toast.success(stage ? 'Etapa atualizada' : 'Etapa criada')
        onClose()
      } catch (err) { toast.error(String(err)) }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-3 mt-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-[10px] text-gray-500 mb-0.5 block">Nome da etapa *</label>
          <Input name="name" defaultValue={stage?.name} required className="h-7 text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Probabilidade (%)</label>
          <Input name="probability" type="number" min="0" max="100" defaultValue={stage?.probability ?? 0} className="h-7 text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Cor</label>
          <div className="flex flex-wrap gap-1">
            {CORES_PRESET.map(c => (
              <button type="button" key={c} onClick={() => setCor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${cor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="col-span-2 flex gap-4">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" name="isWon" value="true" defaultChecked={stage?.isWon ?? false} className="w-3.5 h-3.5 accent-green-600" />
            Etapa de ganho
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" name="isLost" value="true" defaultChecked={stage?.isLost ?? false} className="w-3.5 h-3.5 accent-red-600" />
            Etapa de perda
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">Cancelar</button>
        <Button type="submit" disabled={pending} className="h-6 text-xs bg-[#1B4F8A] hover:bg-[#15407A]">
          {pending ? 'Salvando...' : stage ? 'Salvar' : 'Criar etapa'}
        </Button>
      </div>
    </form>
  )
}

function PipelineCard({ pipeline, stages }: { pipeline: Pipeline; stages: Stage[] }) {
  const [expanded, setExpanded] = useState(pipeline.isDefault ?? false)
  const [showFormStage, setShowFormStage] = useState(false)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [editingPipeline, setEditingPipeline] = useState(false)
  const [pending, start] = useTransition()

  async function handleDeleteStage(id: string) {
    if (!confirm('Excluir esta etapa?')) return
    start(async () => {
      try { await excluirStage(id); toast.success('Etapa excluída') }
      catch (err) { toast.error(String(err)) }
    })
  }

  async function handleDeletePipeline() {
    if (!confirm(`Excluir pipeline "${pipeline.name}"? Isso também exclui todas as etapas.`)) return
    start(async () => {
      try { await excluirPipeline(pipeline.id); toast.success('Pipeline excluído') }
      catch (err) { toast.error(String(err)) }
    })
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{pipeline.name}</h3>
            {pipeline.isDefault && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">Padrão</span>
            )}
            {!pipeline.active && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium shrink-0">Inativo</span>
            )}
          </div>
          {pipeline.description && <p className="text-xs text-gray-400 mt-0.5">{pipeline.description}</p>}
        </div>
        <span className="text-xs text-gray-400 shrink-0">{stages.length} etapa{stages.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditingPipeline(!editingPipeline)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded transition-colors"><Pencil className="h-4 w-4" /></button>
          {!pipeline.isDefault && (
            <button onClick={handleDeletePipeline} disabled={pending} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"><Trash2 className="h-4 w-4" /></button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {editingPipeline && (
        <div className="px-4 py-3 border-b bg-amber-50">
          <form action={async (fd) => {
            try { await atualizarPipeline(pipeline.id, fd); toast.success('Pipeline atualizado'); setEditingPipeline(false) }
            catch (err) { toast.error(String(err)) }
          }} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 mb-0.5 block">Nome</label>
              <Input name="name" defaultValue={pipeline.name} required className="h-7 text-xs" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 mb-0.5 block">Descrição</label>
              <Input name="description" defaultValue={pipeline.description ?? ''} className="h-7 text-xs" />
            </div>
            <Button type="submit" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 shrink-0"><Check className="h-3.5 w-3.5" /></Button>
            <button type="button" onClick={() => setEditingPipeline(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </form>
        </div>
      )}

      {expanded && (
        <div className="px-4 py-3 space-y-2">
          {stages.length === 0 && !showFormStage && (
            <p className="text-xs text-gray-400 text-center py-2">Nenhuma etapa configurada</p>
          )}
          {stages.map(s => (
            <div key={s.id}>
              {editingStage?.id === s.id ? (
                <FormStage pipelineId={pipeline.id} stage={s} onClose={() => setEditingStage(null)} />
              ) : (
                <StageRow stage={s} onEdit={setEditingStage} onDelete={handleDeleteStage} />
              )}
            </div>
          ))}
          {showFormStage && !editingStage && (
            <FormStage pipelineId={pipeline.id} onClose={() => setShowFormStage(false)} />
          )}
          {!showFormStage && !editingStage && (
            <button onClick={() => setShowFormStage(true)} className="flex items-center gap-1.5 text-xs text-[#1B4F8A] hover:underline mt-1">
              <Plus className="h-3.5 w-3.5" /> Adicionar etapa
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function PipelinesClient({ pipelines: lista, stagesPorPipeline }: {
  pipelines: Pipeline[]
  stagesPorPipeline: Record<string, Stage[]>
}) {
  const [showFormPipeline, setShowFormPipeline] = useState(false)
  const [pending, start] = useTransition()

  async function handleCriarPipeline(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      try { await criarPipeline(fd); toast.success('Pipeline criado'); setShowFormPipeline(false) }
      catch (err) { toast.error(String(err)) }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowFormPipeline(!showFormPipeline)} className="bg-[#1B4F8A] hover:bg-[#15407A] text-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Novo Pipeline
        </Button>
      </div>

      {showFormPipeline && (
        <form onSubmit={handleCriarPipeline} className="bg-white rounded-xl border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Novo pipeline</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nome *</label>
              <Input name="name" required placeholder="Ex: Pipeline Enterprise" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
              <Input name="description" placeholder="Opcional" className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowFormPipeline(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1">Cancelar</button>
            <Button type="submit" disabled={pending} className="bg-[#1B4F8A] hover:bg-[#15407A] text-sm">
              {pending ? 'Criando...' : 'Criar pipeline'}
            </Button>
          </div>
        </form>
      )}

      {lista.length === 0 && !showFormPipeline && (
        <div className="text-center text-gray-400 text-sm py-12 bg-white rounded-xl border">
          Nenhum pipeline configurado. Execute <code className="text-xs bg-gray-100 px-1 rounded">/api/migrate-pipelines</code> para importar os status existentes.
        </div>
      )}

      {lista.map(p => (
        <PipelineCard key={p.id} pipeline={p} stages={stagesPorPipeline[p.id] ?? []} />
      ))}
    </div>
  )
}
