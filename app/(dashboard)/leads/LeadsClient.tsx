'use client'

import { useState, useTransition } from 'react'
import { criarLead, editarLead, excluirLead, converterLead, type LeadInput } from './actions'
import { UserPlus, Search, Star, Phone, Mail, Building2, Edit2, Trash2, X, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Lead = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  empresa: string | null
  cargo: string | null
  origem: string | null
  status: string | null
  score: number | null
  responsavelId: string | null
  observacoes: string | null
  contatoId: string | null
  createdAt: Date | string | null
}

const STATUS_OPTS = ['Novo', 'Contatado', 'Qualificado', 'Descartado', 'Convertido']
const ORIGENS = ['LinkedIn', 'Indicação', 'Site', 'Evento', 'Prospecção ativa', 'WhatsApp', 'Cold call', 'Outros']

const STATUS_STYLE: Record<string, string> = {
  'Novo': 'bg-blue-100 text-blue-700',
  'Contatado': 'bg-yellow-100 text-yellow-700',
  'Qualificado': 'bg-green-100 text-green-700',
  'Descartado': 'bg-gray-100 text-gray-500',
  'Convertido': 'bg-purple-100 text-purple-700',
}

function ScoreStars({ score }: { score: number | null }) {
  const s = Math.min(5, Math.max(0, score ?? 0))
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

function LeadForm({ lead, onClose }: { lead?: Lead; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [form, setForm] = useState<LeadInput>({
    nome: lead?.nome ?? '',
    email: lead?.email ?? '',
    telefone: lead?.telefone ?? '',
    empresa: lead?.empresa ?? '',
    cargo: lead?.cargo ?? '',
    origem: lead?.origem ?? '',
    status: lead?.status ?? 'Novo',
    score: lead?.score ?? 0,
    observacoes: lead?.observacoes ?? '',
  })

  const set = (k: keyof LeadInput, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (lead) await editarLead(lead.id, form)
      else await criarLead(form)
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-[#1A1A2E]">{lead ? 'Editar Lead' : 'Novo Lead'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Nome *</label>
              <input required value={form.nome} onChange={e => set('nome', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">E-mail</label>
              <input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Telefone</label>
              <input value={form.telefone ?? ''} onChange={e => set('telefone', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Empresa</label>
              <input value={form.empresa ?? ''} onChange={e => set('empresa', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Cargo</label>
              <input value={form.cargo ?? ''} onChange={e => set('cargo', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Origem</label>
              <select value={form.origem ?? ''} onChange={e => set('origem', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                <option value="">—</option>
                {ORIGENS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select value={form.status ?? 'Novo'} onChange={e => set('status', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Score (0–5)</label>
              <input type="number" min={0} max={5} value={form.score ?? 0}
                onChange={e => set('score', Number(e.target.value))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Observações</label>
              <textarea rows={2} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={pending}
              className="flex-1 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#163f70] disabled:opacity-50">
              {pending ? 'Salvando...' : lead ? 'Salvar' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function LeadsClient({ leads: initial }: { leads: Lead[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [converting, setConverting] = useState<Lead | null>(null)
  const [deleting, setDeleting] = useState<Lead | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = initial.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || [l.nome, l.email, l.empresa, l.cargo, l.origem]
      .some(v => v?.toLowerCase().includes(q))
    const matchStatus = !filterStatus || l.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = STATUS_OPTS.reduce((acc, s) => {
    acc[s] = initial.filter(l => l.status === s).length
    return acc
  }, {} as Record<string, number>)

  function doDelete(lead: Lead) {
    startTransition(async () => {
      await excluirLead(lead.id)
      setDeleting(null)
      router.refresh()
    })
  }

  function doConverter(lead: Lead) {
    startTransition(async () => {
      const contatoId = await converterLead(lead.id)
      setConverting(null)
      router.refresh()
      router.push(`/crm/${contatoId}`)
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4F8A]">Leads</h1>
          <p className="text-sm text-gray-500">{initial.length} leads cadastrados</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#163f70]">
          <UserPlus className="h-4 w-4" /> Novo Lead
        </button>
      </div>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterStatus('')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!filterStatus ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B4F8A]'}`}>
          Todos ({initial.length})
        </button>
        {STATUS_OPTS.map(s => (
          <button key={s} onClick={() => setFilterStatus(s === filterStatus ? '' : s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B4F8A]'}`}>
            {s} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, empresa, e-mail..."
          className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {initial.length === 0 ? 'Nenhum lead ainda. Clique em "Novo Lead" para começar.' : 'Nenhum lead encontrado.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => (
            <div key={lead.id}
              className="bg-white rounded-xl border px-4 py-3 flex items-center gap-4 hover:shadow-sm transition-shadow">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[#1A1A2E] truncate">{lead.nome}</span>
                  {lead.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[lead.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {lead.status}
                    </span>
                  )}
                  {lead.status === 'Convertido' && lead.contatoId && (
                    <Link href={`/crm/${lead.contatoId}`}
                      className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Ver no CRM
                    </Link>
                  )}
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                  {lead.empresa && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.empresa}</span>}
                  {lead.cargo && <span>{lead.cargo}</span>}
                  {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                  {lead.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telefone}</span>}
                  {lead.origem && <span className="text-gray-400">via {lead.origem}</span>}
                </div>
                <div className="mt-1">
                  <ScoreStars score={lead.score} />
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 shrink-0">
                {lead.status !== 'Convertido' && lead.status !== 'Descartado' && (
                  <button onClick={() => setConverting(lead)}
                    className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg"
                    title="Converter para Contato">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setEditing(lead)}
                  className="p-1.5 text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 rounded-lg">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleting(lead)}
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
        <LeadForm lead={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null) }} />
      )}

      {/* Confirmar conversão */}
      {converting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A2E]">Converter para Contato</h3>
                <p className="text-xs text-gray-500">Esta ação cria o contato no CRM</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              O lead <strong>{converting.nome}</strong> será convertido em contato no CRM e ficará disponível no pipeline.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConverting(null)}
                className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => doConverter(converting)} disabled={pending}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {pending ? 'Convertendo...' : 'Converter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-[#1A1A2E] mb-2">Excluir lead?</h3>
            <p className="text-sm text-gray-600 mb-5">
              <strong>{deleting.nome}</strong> será removido permanentemente.
            </p>
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
