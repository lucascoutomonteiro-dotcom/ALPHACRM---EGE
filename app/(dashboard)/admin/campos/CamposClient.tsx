'use client'

import { useState, useTransition } from 'react'
import { criarCampo, editarCampo, excluirCampo, toggleCampoAtivo, type CustomFieldInput } from './actions'
import { Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Field = {
  id: string
  entityType: string
  label: string
  fieldType: string
  options: string | null
  required: boolean | null
  active: boolean | null
  position: number | null
}

const ENTITY_LABELS: Record<string, string> = { contato: 'Contato', deal: 'Deal', lead: 'Lead' }
const FIELD_TYPE_LABELS: Record<string, string> = { text: 'Texto', number: 'Número', date: 'Data', select: 'Seleção', boolean: 'Sim/Não' }
const ENTITIES = ['contato', 'deal', 'lead'] as const

function CampoForm({ field, onClose }: { field?: Field; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [form, setForm] = useState<CustomFieldInput>({
    entityType: (field?.entityType as 'contato' | 'deal' | 'lead') ?? 'contato',
    label: field?.label ?? '',
    fieldType: (field?.fieldType as CustomFieldInput['fieldType']) ?? 'text',
    options: field?.options ? JSON.parse(field.options) : [],
    required: field?.required ?? false,
  })
  const [optionInput, setOptionInput] = useState('')

  const set = <K extends keyof CustomFieldInput>(k: K, v: CustomFieldInput[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  function addOption() {
    const val = optionInput.trim()
    if (!val) return
    set('options', [...(form.options ?? []), val])
    setOptionInput('')
  }

  function removeOption(i: number) {
    set('options', (form.options ?? []).filter((_, idx) => idx !== i))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (field) await editarCampo(field.id, form)
      else await criarCampo(form)
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-[#1A1A2E]">{field ? 'Editar Campo' : 'Novo Campo'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Entidade</label>
            <select value={form.entityType} onChange={e => set('entityType', e.target.value as 'contato' | 'deal' | 'lead')}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
              {ENTITIES.map(e => <option key={e} value={e}>{ENTITY_LABELS[e]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Nome do Campo *</label>
            <input required value={form.label} onChange={e => set('label', e.target.value)}
              placeholder="Ex: CPF, Segmento, Data de Contrato..."
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Tipo</label>
            <select value={form.fieldType} onChange={e => set('fieldType', e.target.value as CustomFieldInput['fieldType'])}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
              {Object.entries(FIELD_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {form.fieldType === 'select' && (
            <div>
              <label className="text-xs font-medium text-gray-600">Opções</label>
              <div className="flex gap-2 mt-1">
                <input value={optionInput} onChange={e => setOptionInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
                  placeholder="Digite e pressione Enter"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
                <button type="button" onClick={addOption}
                  className="px-3 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm">+</button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(form.options ?? []).map((opt, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                    {opt}
                    <button type="button" onClick={() => removeOption(i)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="required" checked={form.required ?? false}
              onChange={e => set('required', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#1B4F8A]" />
            <label htmlFor="required" className="text-sm text-gray-600">Campo obrigatório</label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={pending}
              className="flex-1 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#163f70] disabled:opacity-50">
              {pending ? 'Salvando...' : field ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CamposClient({ fields }: { fields: Field[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Field | null>(null)
  const [deleting, setDeleting] = useState<Field | null>(null)
  const [activeEntity, setActiveEntity] = useState<string>('contato')
  const [pending, startTransition] = useTransition()

  const filtered = fields.filter(f => f.entityType === activeEntity)

  function doToggle(f: Field) {
    startTransition(async () => {
      await toggleCampoAtivo(f.id, !f.active)
      router.refresh()
    })
  }

  function doDelete(f: Field) {
    startTransition(async () => {
      await excluirCampo(f.id)
      setDeleting(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4F8A]">Campos Personalizados</h1>
          <p className="text-sm text-gray-500">{fields.length} campos cadastrados</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#163f70]">
          <Plus className="h-4 w-4" /> Novo Campo
        </button>
      </div>

      <div className="flex gap-2">
        {ENTITIES.map(e => (
          <button key={e} onClick={() => setActiveEntity(e)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeEntity === e ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B4F8A]'}`}>
            {ENTITY_LABELS[e]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Nenhum campo para {ENTITY_LABELS[activeEntity]}. Clique em "Novo Campo" para começar.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(f => (
            <div key={f.id} className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${!f.active ? 'opacity-60' : ''}`}>
              <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[#1A1A2E]">{f.label}</span>
                  {f.required && <span className="text-xs text-red-500 font-medium">*obrigatório</span>}
                  {!f.active && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">inativo</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{FIELD_TYPE_LABELS[f.fieldType]}</span>
                  {f.fieldType === 'select' && f.options && (
                    <span className="text-xs text-gray-400">
                      ({JSON.parse(f.options).join(', ')})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => doToggle(f)} title={f.active ? 'Desativar' : 'Ativar'}>
                  {f.active
                    ? <ToggleRight className="h-5 w-5 text-green-500" />
                    : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                </button>
                <button onClick={() => setEditing(f)}
                  className="p-1.5 text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 rounded">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleting(f)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showForm || editing) && (
        <CampoForm field={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null) }} />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-[#1A1A2E] mb-2">Excluir campo?</h3>
            <p className="text-sm text-gray-600 mb-1"><strong>{deleting.label}</strong> será removido permanentemente.</p>
            <p className="text-xs text-red-600 mb-5">Todos os valores preenchidos também serão apagados.</p>
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
