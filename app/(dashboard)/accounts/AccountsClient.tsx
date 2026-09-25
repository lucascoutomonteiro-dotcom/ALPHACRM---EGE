'use client'

import { useState, useTransition } from 'react'
import { criarAccount, editarAccount, excluirAccount, type AccountInput } from './actions'
import { Building2, Plus, Search, Phone, Mail, Globe, MapPin, Edit2, Trash2, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Account = {
  id: string
  nome: string
  cnpj: string | null
  segmento: string | null
  cidade: string | null
  estado: string | null
  website: string | null
  telefone: string | null
  email: string | null
  status: string | null
  potencialEstimado: string | null
  origem: string | null
  observacoes: string | null
  responsavelId: string | null
  totalContatos: number
}

const STATUS_OPTS = ['Ativo', 'Prospecto', 'Inativo']
const SEGMENTOS = ['Indústria', 'Comércio', 'Serviços', 'Agronegócio', 'Construção', 'Saúde', 'Educação', 'Governo', 'Outros']
const ORIGENS = ['Indicação', 'Prospecção ativa', 'Inbound', 'Evento', 'LinkedIn', 'WhatsApp', 'Outros']

function statusColor(s: string | null) {
  if (s === 'Ativo') return 'bg-green-100 text-green-700'
  if (s === 'Prospecto') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-500'
}

function fmtBRL(v: string | null) {
  if (!v) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))
}

// ── Formulário ────────────────────────────────────────────────────────────────
function AccountForm({ account, onClose }: { account?: Account; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<AccountInput>({
    nome: account?.nome ?? '',
    cnpj: account?.cnpj ?? '',
    segmento: account?.segmento ?? '',
    cidade: account?.cidade ?? '',
    estado: account?.estado ?? '',
    website: account?.website ?? '',
    telefone: account?.telefone ?? '',
    email: account?.email ?? '',
    status: account?.status ?? 'Ativo',
    potencialEstimado: account?.potencialEstimado ?? '',
    origem: account?.origem ?? '',
    observacoes: account?.observacoes ?? '',
  })

  function set(k: keyof AccountInput, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    startTransition(async () => {
      if (account) {
        await editarAccount(account.id, form)
      } else {
        await criarAccount(form)
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-[#1B4F8A]">{account ? 'Editar Account' : 'Nova Account'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome da empresa *</label>
              <input value={form.nome} onChange={e => set('nome', e.target.value)} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ</label>
              <input value={form.cnpj} onChange={e => set('cnpj', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label>
              <select value={form.segmento} onChange={e => set('segmento', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                <option value="">Selecione</option>
                {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
              <input value={form.cidade} onChange={e => set('cidade', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <input value={form.estado} onChange={e => set('estado', e.target.value)} maxLength={2} placeholder="SP"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input value={form.telefone} onChange={e => set('telefone', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
              <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Potencial estimado (R$)</label>
              <input type="number" value={form.potencialEstimado} onChange={e => set('potencialEstimado', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Origem</label>
              <select value={form.origem} onChange={e => set('origem', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                <option value="">Selecione</option>
                {ORIGENS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button type="submit" disabled={pending}
              className="px-5 py-2 bg-[#1B4F8A] text-white text-sm rounded-lg hover:bg-[#163f70] disabled:opacity-50">
              {pending ? 'Salvando...' : account ? 'Salvar alterações' : 'Criar account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Lista principal ───────────────────────────────────────────────────────────
export function AccountsClient({ accounts: initial }: { accounts: Account[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroSeg, setFiltroSeg] = useState('Todos')
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<Account | undefined>()
  const [deletando, setDeletando] = useState<Account | null>(null)
  const [pending, startTransition] = useTransition()

  const filtrados = initial.filter(a => {
    const q = busca.toLowerCase()
    const matchBusca = !q || a.nome.toLowerCase().includes(q) || (a.cidade ?? '').toLowerCase().includes(q) || (a.cnpj ?? '').includes(q)
    const matchStatus = filtroStatus === 'Todos' || a.status === filtroStatus
    const matchSeg = filtroSeg === 'Todos' || a.segmento === filtroSeg
    return matchBusca && matchStatus && matchSeg
  })

  function handleDelete(a: Account) {
    setDeletando(a)
  }

  function confirmDelete() {
    if (!deletando) return
    startTransition(async () => {
      await excluirAccount(deletando.id)
      setDeletando(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4F8A]">Empresas</h1>
          <p className="text-sm text-gray-500">{initial.length} empresas cadastradas</p>
        </div>
        <button onClick={() => { setEditando(undefined); setFormOpen(true) }}
          className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#163f70]">
          <Plus className="h-4 w-4" /> Nova Account
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar empresa, cidade, CNPJ..."
            className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
          <option>Todos</option>
          {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filtroSeg} onChange={e => setFiltroSeg(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
          <option>Todos</option>
          {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid de cards */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhuma account encontrada.</p>
          <button onClick={() => { setEditando(undefined); setFormOpen(true) }}
            className="mt-4 text-[#1B4F8A] text-sm hover:underline">Criar primeira account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map(a => (
            <div key={a.id} className="bg-white rounded-xl border hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/accounts/${a.id}`} className="font-semibold text-[#1A1A2E] hover:text-[#1B4F8A] truncate block">
                      {a.nome}
                    </Link>
                    {a.segmento && <p className="text-xs text-gray-500 mt-0.5">{a.segmento}</p>}
                  </div>
                  <span className={`ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(a.status)}`}>
                    {a.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-500 mb-3">
                  {(a.cidade || a.estado) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{[a.cidade, a.estado].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {a.telefone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />{a.telefone}
                    </div>
                  )}
                  {a.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /><span className="truncate">{a.email}</span>
                    </div>
                  )}
                  {a.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <a href={a.website.startsWith('http') ? a.website : `https://${a.website}`} target="_blank" rel="noopener noreferrer"
                        className="truncate hover:text-[#1B4F8A]">{a.website.replace(/^https?:\/\//, '')}</a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{a.totalContatos} contato{a.totalContatos !== 1 ? 's' : ''}</span>
                    {a.potencialEstimado && <span className="text-[#1B4F8A] font-medium">{fmtBRL(a.potencialEstimado)}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditando(a); setFormOpen(true) }}
                      className="p-1.5 text-gray-400 hover:text-[#1B4F8A] rounded-md hover:bg-blue-50">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(a)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Link href={`/accounts/${a.id}`}
                      className="p-1.5 text-gray-400 hover:text-[#1B4F8A] rounded-md hover:bg-blue-50">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <AccountForm
          account={editando}
          onClose={() => { setFormOpen(false); setEditando(undefined); router.refresh() }}
        />
      )}

      {deletando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold mb-2">Excluir account?</h3>
            <p className="text-sm text-gray-500 mb-4">
              "<strong>{deletando.nome}</strong>" será removida. Os contatos vinculados serão desvinculados mas não excluídos.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletando(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={confirmDelete} disabled={pending}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50">
                {pending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
