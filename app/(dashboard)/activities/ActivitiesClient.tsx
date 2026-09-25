'use client'

import { useState, useTransition } from 'react'
import { criarActivity, editarActivity, excluirActivity, type ActivityInput } from './actions'
import { Plus, Phone, Users, MapPin, Mail, MessageCircle, CheckSquare, FileText, Edit2, Trash2, X, Clock, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Activity = {
  id: string
  type: string
  title: string
  description: string | null
  date: Date | string | null
  durationMinutes: number | null
  status: string | null
  contatoId: string | null
  dealId: string | null
  leadId: string | null
  responsavelId: string | null
  proximoPasso: string | null
  dataProximoPasso: string | null
}

const TIPOS = ['CALL', 'MEETING', 'VISIT', 'EMAIL', 'WHATSAPP', 'TASK', 'NOTE'] as const

const TIPO_ICON: Record<string, React.ReactNode> = {
  CALL: <Phone className="h-4 w-4" />,
  MEETING: <Users className="h-4 w-4" />,
  VISIT: <MapPin className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  WHATSAPP: <MessageCircle className="h-4 w-4" />,
  TASK: <CheckSquare className="h-4 w-4" />,
  NOTE: <FileText className="h-4 w-4" />,
}

const TIPO_LABEL: Record<string, string> = {
  CALL: 'Ligação', MEETING: 'Reunião', VISIT: 'Visita',
  EMAIL: 'E-mail', WHATSAPP: 'WhatsApp', TASK: 'Tarefa', NOTE: 'Nota',
}

const TIPO_COLOR: Record<string, string> = {
  CALL: 'bg-blue-100 text-blue-600',
  MEETING: 'bg-purple-100 text-purple-600',
  VISIT: 'bg-green-100 text-green-600',
  EMAIL: 'bg-yellow-100 text-yellow-700',
  WHATSAPP: 'bg-emerald-100 text-emerald-600',
  TASK: 'bg-orange-100 text-orange-600',
  NOTE: 'bg-gray-100 text-gray-600',
}

const STATUS_OPTS = ['done', 'planned', 'cancelled']
const STATUS_LABEL: Record<string, string> = { done: 'Realizado', planned: 'Planejado', cancelled: 'Cancelado' }
const STATUS_COLOR: Record<string, string> = {
  done: 'bg-green-100 text-green-700',
  planned: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

function fmtDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toInputDate(d: Date | string | null) {
  if (!d) return ''
  const dt = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function ActivityForm({ activity, onClose }: { activity?: Activity; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const now = toInputDate(new Date())
  const [form, setForm] = useState<ActivityInput>({
    type: activity?.type ?? 'CALL',
    title: activity?.title ?? '',
    description: activity?.description ?? '',
    date: activity?.date ? toInputDate(activity.date) : now,
    durationMinutes: activity?.durationMinutes ?? null,
    status: activity?.status ?? 'done',
    proximoPasso: activity?.proximoPasso ?? '',
    dataProximoPasso: activity?.dataProximoPasso ?? '',
  })

  const set = (k: keyof ActivityInput, v: string | number | null) => setForm(f => ({ ...f, [k]: v }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (activity) await editarActivity(activity.id, form)
      else await criarActivity(form)
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-[#1A1A2E]">{activity ? 'Editar Atividade' : 'Nova Atividade'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          {/* Tipo */}
          <div>
            <label className="text-xs font-medium text-gray-600">Tipo</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {TIPOS.map(t => (
                <button key={t} type="button"
                  onClick={() => set('type', t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.type === t ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B4F8A]'}`}>
                  {TIPO_ICON[t]}{TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Título *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Data e hora *</label>
              <input required type="datetime-local" value={form.date as string}
                onChange={e => set('date', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Duração (min)</label>
              <input type="number" min={0} value={form.durationMinutes ?? ''}
                onChange={e => set('durationMinutes', e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select value={form.status ?? 'done'} onChange={e => set('status', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Descrição / Notas</label>
              <textarea rows={3} value={form.description ?? ''} onChange={e => set('description', e.target.value || null)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 resize-none" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Próximo passo</label>
              <input value={form.proximoPasso ?? ''} onChange={e => set('proximoPasso', e.target.value || null)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Data próximo passo</label>
              <input type="date" value={form.dataProximoPasso ?? ''}
                onChange={e => set('dataProximoPasso', e.target.value || null)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={pending}
              className="flex-1 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#163f70] disabled:opacity-50">
              {pending ? 'Salvando...' : activity ? 'Salvar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ActivitiesClient({ activities: initial }: { activities: Activity[] }) {
  const router = useRouter()
  const [filterTipo, setFilterTipo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [deleting, setDeleting] = useState<Activity | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = initial.filter(a => {
    const matchTipo = !filterTipo || a.type === filterTipo
    const matchStatus = !filterStatus || a.status === filterStatus
    return matchTipo && matchStatus
  })

  function doDelete(a: Activity) {
    startTransition(async () => {
      await excluirActivity(a.id)
      setDeleting(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4F8A]">Atividades</h1>
          <p className="text-sm text-gray-500">{initial.length} registradas</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#163f70]">
          <Plus className="h-4 w-4" /> Registrar
        </button>
      </div>

      {/* Filtros tipo */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterTipo('')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!filterTipo ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B4F8A]'}`}>
          Todos
        </button>
        {TIPOS.map(t => (
          <button key={t} onClick={() => setFilterTipo(t === filterTipo ? '' : t)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterTipo === t ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B4F8A]'}`}>
            {TIPO_ICON[t]}{TIPO_LABEL[t]}
          </button>
        ))}
      </div>

      {/* Filtros status */}
      <div className="flex gap-2">
        {STATUS_OPTS.map(s => (
          <button key={s} onClick={() => setFilterStatus(s === filterStatus ? '' : s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B4F8A]'}`}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {initial.length === 0 ? 'Nenhuma atividade ainda. Clique em "Registrar" para começar.' : 'Nenhuma atividade encontrada.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} className="bg-white rounded-xl border px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-shadow">
              {/* Ícone tipo */}
              <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${TIPO_COLOR[a.type] ?? 'bg-gray-100 text-gray-500'}`}>
                {TIPO_ICON[a.type]}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[#1A1A2E]">{a.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[a.status ?? 'done']}`}>
                    {STATUS_LABEL[a.status ?? 'done']}
                  </span>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                  <span>{fmtDate(a.date)}</span>
                  {a.durationMinutes && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.durationMinutes}min</span>
                  )}
                </div>
                {a.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.description}</p>
                )}
                {a.proximoPasso && (
                  <div className="mt-1 text-xs text-[#1B4F8A] flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    <span className="font-medium">Próximo:</span> {a.proximoPasso}
                    {a.dataProximoPasso && ` — ${new Date(a.dataProximoPasso).toLocaleDateString('pt-BR')}`}
                  </div>
                )}
              </div>
              {/* Ações */}
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing(a)}
                  className="p-1.5 text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 rounded-lg">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleting(a)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
      {(showForm || editing) && (
        <ActivityForm activity={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null) }} />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-[#1A1A2E] mb-2">Excluir atividade?</h3>
            <p className="text-sm text-gray-600 mb-5"><strong>{deleting.title}</strong> será removida.</p>
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
