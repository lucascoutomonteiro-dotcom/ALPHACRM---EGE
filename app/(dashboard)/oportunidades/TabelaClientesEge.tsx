'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronUp, Check, Plus, X, MessageSquare, Archive, Clock, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { differenceInDays, parseISO as parseISODate } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { atualizarClienteEge, registrarInteracaoEge, buscarInteracoesEge, criarClienteEge, editarInteracaoEge, excluirInteracaoEge, buscarKAMEge, salvarKAMPlano, salvarKAMStakeholder, excluirKAMStakeholder } from './actions'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const SERVICOS = [
  { campo: 'nr12AprRisco', label: 'NR-12 APR/Risco', grupo: 'NR-12' },
  { campo: 'nr12Procedimentos', label: 'NR-12 Procedimentos', grupo: 'NR-12' },
  { campo: 'nr12Manuais', label: 'NR-12 Manuais', grupo: 'NR-12' },
  { campo: 'nr12Treinamento', label: 'NR-12 Treinamento', grupo: 'NR-12' },
  { campo: 'nr12Conceituacao', label: 'NR-12 Conceituação', grupo: 'NR-12' },
  { campo: 'nr12Adequacao', label: 'NR-12 Adequação', grupo: 'NR-12' },
  { campo: 'cacaVazDeteccao', label: 'Caça Vaz. Detecção', grupo: 'Caça Vaz.' },
  { campo: 'cacaVazReparo', label: 'Caça Vaz. Reparo', grupo: 'Caça Vaz.' },
  { campo: 'termografia', label: 'Termografia', grupo: 'Outros' },
  { campo: 'terceirizacaoHh', label: 'Terceirização HH', grupo: 'Outros' },
  { campo: 'nr10PieLaudo', label: 'NR-10 PIE/Laudo', grupo: 'NR-10' },
  { campo: 'nr10Spda', label: 'NR-10 SPDA', grupo: 'NR-10' },
  { campo: 'nr10Instalacoes', label: 'NR-10 Instalações', grupo: 'NR-10' },
] as const

const SITUACAO_CORES: Record<string, { bg: string; text: string }> = {
  FEITO:     { bg: '#22C55E', text: 'text-white' },
  UPSELL:    { bg: '#FBBF24', text: 'text-white' },
  CROSS:     { bg: '#EF4444', text: 'text-white' },
  RENOVAR:   { bg: '#3B82F6', text: 'text-white' },
  VAZIO:     { bg: '#E5E7EB', text: 'text-gray-500' },
  TENTATIVA: { bg: '#E5E7EB', text: 'text-gray-500' },
}

const CICLO_STATUS = ['VAZIO', 'CROSS', 'UPSELL', 'RENOVAR', 'FEITO'] as const
const PODE_TENTATIVA = ['CROSS', 'UPSELL', 'RENOVAR']

const PRAZO_CORES: Record<string, string> = {
  '30d':    'bg-red-100 text-red-700 border border-red-200',
  '30-60d': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  '60-90d': 'bg-green-100 text-green-700 border border-green-200',
}

const CLASS_CORES: Record<string, { dot: string; badge: string }> = {
  OURO:   { dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  PRATA:  { dot: 'bg-gray-400',   badge: 'bg-gray-50 text-gray-600 border border-gray-200' },
  BRONZE: { dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border border-orange-200' },
}

const STATUS_ACAO = ['A iniciar', 'Em contato', 'Proposta enviada', 'Fechado']
const TIPOS_INTERACAO = ['Ligação', 'WhatsApp', 'E-mail', 'Reunião', 'Proposta', 'Outro']

const SERVICOS_PILAR_A = [
  'NR-12 APR/Risco',
  'NR-12 Procedimentos',
  'NR-12 Manuais',
  'NR-12 Treinamento',
  'NR-12 Conceituação',
  'NR-12 Adequação',
  'Caça Vaz. Detecção',
  'Caça Vaz. Reparo',
  'Termografia',
  'Terceirização HH',
  'NR-10 PIE/Laudo',
  'NR-10 SPDA',
  'NR-10 Instalações',
]

type ClienteEge = {
  id: string
  rank: number | null
  cliente: string
  proximoFollowUp?: string | null
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

function fmtBRL(v: number | string | null) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v ?? 0))
}

// ── Multiselect genérico ─────────────────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange }: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  function toggle(s: string) {
    onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s])
  }
  const display = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${selected.length} selecionados`
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 px-3 border rounded-md text-sm flex items-center gap-2 bg-white hover:bg-gray-50 min-w-[160px] justify-between"
      >
        <span className="truncate">{display}</span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-10 left-0 z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[200px] max-h-64 overflow-y-auto">
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => { onChange([]); setOpen(false) }}>
              <span className={`w-4 h-4 rounded border flex items-center justify-center ${selected.length === 0 ? 'bg-[#1B4F8A] border-[#1B4F8A]' : 'border-gray-300'}`}>
                {selected.length === 0 && <Check className="h-3 w-3 text-white" />}
              </span>
              Todos
            </button>
            {options.map(s => (
              <button key={s} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => toggle(s)}>
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(s) ? 'bg-[#1B4F8A] border-[#1B4F8A]' : 'border-gray-300'}`}>
                  {selected.includes(s) && <Check className="h-3 w-3 text-white" />}
                </span>
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Form de interação ─────────────────────────────────────────────────────────
function FormInteracaoEge({ clienteId, onClose }: { clienteId: string; onClose: () => void }) {
  const [tipo, setTipo] = useState('Ligação')
  const [descricao, setDescricao] = useState('')
  const [proximoPasso, setProximoPasso] = useState('')
  const [dataProximoPasso, setDataProximoPasso] = useState('')
  const [gerouOportunidade, setGerouOportunidade] = useState(false)
  const [servicoOportunidade, setServicoOportunidade] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) return
    setLoading(true)
    try {
      await registrarInteracaoEge(clienteId, { tipo, descricao, proximoPasso, dataProximoPasso, gerouOportunidade, servicoOportunidade: gerouOportunidade ? servicoOportunidade : undefined })
      toast.success('Interação registrada!')
      onClose()
    } catch {
      toast.error('Erro ao registrar interação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#1B4F8A]">Registrar Interação</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full h-8 border rounded text-sm px-2">
            {TIPOS_INTERACAO.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Próximo follow-up</label>
          <input type="date" value={dataProximoPasso} onChange={e => setDataProximoPasso(e.target.value)} className="w-full h-8 border rounded text-sm px-2" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Descrição *</label>
        <textarea
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          className="w-full border rounded text-sm px-2 py-1.5 resize-none"
          rows={2}
          placeholder="O que foi discutido..."
          required
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Próximo passo</label>
        <input type="text" value={proximoPasso} onChange={e => setProximoPasso(e.target.value)} className="w-full h-8 border rounded text-sm px-2" placeholder="Ação acordada..." />
      </div>
      {/* Gerou oportunidade */}
      <div className={`rounded-lg border transition-colors ${gerouOportunidade ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
        <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2">
          <input
            type="checkbox"
            checked={gerouOportunidade}
            onChange={e => { setGerouOportunidade(e.target.checked); if (!e.target.checked) setServicoOportunidade('') }}
            className="w-4 h-4 accent-green-600"
          />
          <div>
            <span className={`text-xs font-semibold ${gerouOportunidade ? 'text-green-700' : 'text-gray-600'}`}>
              Gerou oportunidade
            </span>
            <p className="text-[10px] text-gray-400 leading-tight">O cliente demonstrou interesse real (aceitou proposta, pediu orçamento, etc.)</p>
          </div>
        </label>
        {gerouOportunidade && (
          <div className="px-3 pb-3">
            <label className="text-xs text-green-700 font-medium mb-1 block">Serviço referente à oportunidade</label>
            <select
              value={servicoOportunidade}
              onChange={e => setServicoOportunidade(e.target.value)}
              className="w-full h-8 border border-green-200 rounded text-sm px-2 bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
            >
              <option value="">— Selecionar serviço —</option>
              {SERVICOS_PILAR_A.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1">Cancelar</button>
        <Button type="submit" disabled={loading} className="h-7 text-xs bg-[#1B4F8A] hover:bg-[#15407A]">
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

// ── Form de edição de interação ───────────────────────────────────────────────
function FormEditarInteracao({ interacao, onClose }: { interacao: Interacao; onClose: () => void }) {
  const [tipo, setTipo] = useState(interacao.tipo)
  const [descricao, setDescricao] = useState(interacao.descricao ?? '')
  const [proximoPasso, setProximoPasso] = useState(interacao.proximoPasso ?? '')
  const [dataProximoPasso, setDataProximoPasso] = useState(interacao.dataProximoPasso ?? '')
  const [gerouOportunidade, setGerouOportunidade] = useState(interacao.gerouOportunidade ?? false)
  const [servicoOportunidade, setServicoOportunidade] = useState(interacao.servicoOportunidade ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) return
    setLoading(true)
    try {
      await editarInteracaoEge(interacao.id, { tipo, descricao, proximoPasso, dataProximoPasso, gerouOportunidade, servicoOportunidade: gerouOportunidade ? servicoOportunidade : undefined })
      toast.success('Interação atualizada!')
      onClose()
    } catch {
      toast.error('Erro ao atualizar interação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2 mt-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-amber-700">Editar interação</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full h-7 border rounded text-xs px-2">
            {TIPOS_INTERACAO.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Próximo follow-up</label>
          <input type="date" value={dataProximoPasso} onChange={e => setDataProximoPasso(e.target.value)} className="w-full h-7 border rounded text-xs px-2" />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-gray-500 mb-0.5 block">Descrição *</label>
        <textarea value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full border rounded text-xs px-2 py-1 resize-none" rows={2} required />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 mb-0.5 block">Próximo passo</label>
        <input type="text" value={proximoPasso} onChange={e => setProximoPasso(e.target.value)} className="w-full h-7 border rounded text-xs px-2" />
      </div>
      <div className={`rounded border transition-colors ${gerouOportunidade ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
        <label className="flex items-center gap-2 cursor-pointer px-2 py-1.5">
          <input type="checkbox" checked={gerouOportunidade} onChange={e => { setGerouOportunidade(e.target.checked); if (!e.target.checked) setServicoOportunidade('') }} className="w-3.5 h-3.5 accent-green-600" />
          <span className={`text-xs font-medium ${gerouOportunidade ? 'text-green-700' : 'text-gray-600'}`}>Gerou oportunidade</span>
        </label>
        {gerouOportunidade && (
          <div className="px-2 pb-2">
            <select value={servicoOportunidade} onChange={e => setServicoOportunidade(e.target.value)} className="w-full h-7 border border-green-200 rounded text-xs px-2 bg-white">
              <option value="">— Selecionar serviço —</option>
              {SERVICOS_PILAR_A.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">Cancelar</button>
        <Button type="submit" disabled={loading} className="h-6 text-xs bg-amber-600 hover:bg-amber-700">
          {loading ? 'Salvando...' : 'Salvar edição'}
        </Button>
      </div>
    </form>
  )
}

// ── Form de novo cliente ──────────────────────────────────────────────────────
function FormNovoCliente({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [local, setLocal] = useState('')
  const [classificacao, setClassificacao] = useState('PRATA')
  const [statusAcao, setStatusAcao] = useState('A iniciar')
  const [contatoNome, setContatoNome] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !local.trim()) return
    setLoading(true)
    try {
      await criarClienteEge({ cliente: nome.trim().toUpperCase(), local: local.trim().toUpperCase(), classificacao, statusAcao, contatoNome: contatoNome || undefined })
      toast.success('Cliente criado!')
      onClose()
    } catch {
      toast.error('Erro ao criar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#1B4F8A]">Novo Cliente</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Empresa *</label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: EMPRESA LTDA" required className="h-9 text-sm uppercase" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Localidade * (Cidade - UF)</label>
            <Input value={local} onChange={e => setLocal(e.target.value)} placeholder="Ex: SÃO PAULO - SP" required className="h-9 text-sm uppercase" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Classificação</label>
            <select value={classificacao} onChange={e => setClassificacao(e.target.value)} className="w-full h-9 border rounded-md text-sm px-2">
              <option>OURO</option>
              <option>PRATA</option>
              <option>BRONZE</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select value={statusAcao} onChange={e => setStatusAcao(e.target.value)} className="w-full h-9 border rounded-md text-sm px-2">
              {STATUS_ACAO.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Nome do contato (opcional)</label>
            <Input value={contatoNome} onChange={e => setContatoNome(e.target.value)} placeholder="Ex: João Silva" className="h-9 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1">Cancelar</button>
          <Button type="submit" disabled={loading} className="bg-[#1B4F8A] hover:bg-[#15407A] text-sm">
            {loading ? 'Criando...' : 'Criar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Linha expandida ───────────────────────────────────────────────────────────
type Interacao = {
  id: string
  tipo: string
  descricao: string | null
  proximoPasso: string | null
  dataProximoPasso: string | null
  dataInteracao: Date | string | null
  gerouOportunidade?: boolean | null
  servicoOportunidade?: string | null
}

type KAStakeholder = {
  id: string
  nome: string
  cargo: string | null
  departamento: string | null
  email: string | null
  telefone: string | null
  nivelPoder: string
  posicionamento: string
  nivelRelacionamento: string | null
  qualificacaoStatus: string | null
}

type KAData = {
  ka: {
    plano30d: string | null; plano90d: string | null
    barreiras: string | null; estrategia: string | null
    estrategiaExpansao: string | null
    proximaAcao: string | null; proximaAcaoData: string | null
    proximaAcaoResponsavel: string | null
  }
  stakeholders: KAStakeholder[]
  penetracao: { departamento: string; status: string }[]
}

const NIVEIS_PODER = ['DECISOR', 'INFLUENCIADOR_TECNICO', 'INFLUENCIADOR_USUARIO', 'GUARDIAO']
const POSICIONAMENTOS = ['ALIADO', 'NEUTRO', 'BLOQUEADOR', 'DESCONHECIDO']
const NIVEIS_REL = ['QUENTE', 'MORNO', 'FRIO']

// ── Aba Contatos-chave ────────────────────────────────────────────────────────
function AbaContatos({ clienteId, stakeholders, onRefresh }: {
  clienteId: string
  stakeholders: KAStakeholder[]
  onRefresh: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<KAStakeholder | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSalvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData(e.currentTarget)
      await salvarKAMStakeholder(clienteId, fd)
      toast.success('Contato salvo!')
      setShowForm(false)
      setEditando(null)
      onRefresh()
    } catch { toast.error('Erro ao salvar contato') }
    finally { setLoading(false) }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Excluir este contato?')) return
    await excluirKAMStakeholder(id, clienteId)
    toast.success('Contato excluído')
    onRefresh()
  }

  const PODER_COR: Record<string, string> = {
    DECISOR: 'bg-purple-100 text-purple-700',
    INFLUENCIADOR_TECNICO: 'bg-blue-100 text-blue-700',
    INFLUENCIADOR_USUARIO: 'bg-sky-100 text-sky-700',
    GUARDIAO: 'bg-gray-100 text-gray-600',
  }
  const POS_COR: Record<string, string> = {
    ALIADO: 'bg-green-100 text-green-700',
    NEUTRO: 'bg-gray-100 text-gray-500',
    BLOQUEADOR: 'bg-red-100 text-red-700',
    DESCONHECIDO: 'bg-yellow-100 text-yellow-700',
  }

  const FormStakeholder = ({ stk }: { stk?: KAStakeholder }) => (
    <form onSubmit={handleSalvar} className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2 mt-2">
      {stk && <input type="hidden" name="id" value={stk.id} />}
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-[10px] text-gray-500 mb-0.5 block">Nome *</label>
          <input name="nome" defaultValue={stk?.nome} required className="w-full h-7 border rounded text-xs px-2" placeholder="Nome do contato" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Cargo</label>
          <input name="cargo" defaultValue={stk?.cargo ?? ''} className="w-full h-7 border rounded text-xs px-2" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Departamento</label>
          <input name="departamento" defaultValue={stk?.departamento ?? ''} className="w-full h-7 border rounded text-xs px-2" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">E-mail</label>
          <input name="email" defaultValue={stk?.email ?? ''} type="email" className="w-full h-7 border rounded text-xs px-2" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Telefone</label>
          <input name="telefone" defaultValue={stk?.telefone ?? ''} className="w-full h-7 border rounded text-xs px-2" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Nível de poder</label>
          <select name="nivelPoder" defaultValue={stk?.nivelPoder ?? 'INFLUENCIADOR_TECNICO'} className="w-full h-7 border rounded text-xs px-2">
            {NIVEIS_PODER.map(n => <option key={n} value={n}>{n.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Posicionamento</label>
          <select name="posicionamento" defaultValue={stk?.posicionamento ?? 'NEUTRO'} className="w-full h-7 border rounded text-xs px-2">
            {POSICIONAMENTOS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Relacionamento</label>
          <select name="nivelRelacionamento" defaultValue={stk?.nivelRelacionamento ?? 'FRIO'} className="w-full h-7 border rounded text-xs px-2">
            {NIVEIS_REL.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => { setShowForm(false); setEditando(null) }} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">Cancelar</button>
        <Button type="submit" disabled={loading} className="h-6 text-xs bg-[#1B4F8A] hover:bg-[#15407A]">{loading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contatos-chave ({stakeholders.length})</span>
        <button onClick={() => { setShowForm(true); setEditando(null) }} className="text-xs flex items-center gap-1 text-[#1B4F8A] hover:underline">
          <Plus className="h-3 w-3" /> Novo contato
        </button>
      </div>
      {showForm && !editando && <FormStakeholder />}
      {stakeholders.length === 0 && !showForm && (
        <div className="text-xs text-gray-400 py-4 text-center">Nenhum contato-chave mapeado</div>
      )}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {stakeholders.map(stk => (
          <div key={stk.id}>
            <div className="bg-white border rounded-lg p-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{stk.nome}</div>
                  {stk.cargo && <div className="text-gray-500">{stk.cargo}{stk.departamento ? ` · ${stk.departamento}` : ''}</div>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PODER_COR[stk.nivelPoder] ?? 'bg-gray-100 text-gray-600'}`}>{stk.nivelPoder.replace(/_/g, ' ')}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${POS_COR[stk.posicionamento] ?? 'bg-gray-100 text-gray-500'}`}>{stk.posicionamento}</span>
                    {stk.nivelRelacionamento && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{stk.nivelRelacionamento}</span>}
                  </div>
                  {(stk.email || stk.telefone) && (
                    <div className="text-gray-400 mt-1 space-x-2">
                      {stk.email && <span>{stk.email}</span>}
                      {stk.telefone && <span>{stk.telefone}</span>}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditando(editando?.id === stk.id ? null : stk)} className="text-gray-400 hover:text-amber-600 p-1 rounded transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleExcluir(stk.id)} className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
            {editando?.id === stk.id && <FormStakeholder stk={stk} />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Aba Plano ─────────────────────────────────────────────────────────────────
function AbaPlano({ clienteId, ka, onRefresh }: {
  clienteId: string
  ka: KAData['ka'] | null
  onRefresh: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSalvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData(e.currentTarget)
      await salvarKAMPlano(clienteId, fd)
      toast.success('Plano salvo!')
      setEditing(false)
      onRefresh()
    } catch { toast.error('Erro ao salvar plano') }
    finally { setLoading(false) }
  }

  if (!ka && !editing) {
    return (
      <div className="text-xs text-gray-400 py-4 text-center">
        <button onClick={() => setEditing(true)} className="text-[#1B4F8A] hover:underline flex items-center gap-1 mx-auto">
          <Plus className="h-3 w-3" /> Definir plano estratégico
        </button>
      </div>
    )
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plano Estratégico</span>
          <button onClick={() => setEditing(true)} className="text-xs text-[#1B4F8A] hover:underline flex items-center gap-1">
            <Pencil className="h-3 w-3" /> Editar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {ka?.plano30d && <Field label="Plano 30 dias" value={ka.plano30d} />}
          {ka?.plano90d && <Field label="Plano 90 dias" value={ka.plano90d} />}
          {ka?.barreiras && <Field label="Barreiras" value={ka.barreiras} />}
          {ka?.estrategia && <Field label="Estratégia" value={ka.estrategia} />}
          {ka?.estrategiaExpansao && <Field label="Expansão" value={ka.estrategiaExpansao} className="col-span-2" />}
        </div>
        {ka?.proximaAcao && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs">
            <div className="font-medium text-[#1B4F8A] mb-0.5">Próxima Ação</div>
            <div className="text-gray-700">{ka.proximaAcao}</div>
            {(ka.proximaAcaoData || ka.proximaAcaoResponsavel) && (
              <div className="text-gray-400 mt-1">
                {ka.proximaAcaoData && <span>{format(parseISO(ka.proximaAcaoData), 'dd/MM/yyyy', { locale: ptBR })}</span>}
                {ka.proximaAcaoResponsavel && <span className="ml-2">· {ka.proximaAcaoResponsavel}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Plano 30 dias</label>
          <textarea name="plano30d" defaultValue={ka?.plano30d ?? ''} rows={2} className="w-full border rounded text-xs px-2 py-1 resize-none" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Plano 90 dias</label>
          <textarea name="plano90d" defaultValue={ka?.plano90d ?? ''} rows={2} className="w-full border rounded text-xs px-2 py-1 resize-none" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Barreiras</label>
          <textarea name="barreiras" defaultValue={ka?.barreiras ?? ''} rows={2} className="w-full border rounded text-xs px-2 py-1 resize-none" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Estratégia</label>
          <textarea name="estrategia" defaultValue={ka?.estrategia ?? ''} rows={2} className="w-full border rounded text-xs px-2 py-1 resize-none" />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-gray-500 mb-0.5 block">Estratégia de Expansão</label>
          <textarea name="estrategiaExpansao" defaultValue={ka?.estrategiaExpansao ?? ''} rows={2} className="w-full border rounded text-xs px-2 py-1 resize-none" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Próxima Ação</label>
          <input name="proximaAcao" defaultValue={ka?.proximaAcao ?? ''} className="w-full h-7 border rounded text-xs px-2" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">Data da Próxima Ação</label>
          <input name="proximaAcaoData" type="date" defaultValue={ka?.proximaAcaoData ?? ''} className="w-full h-7 border rounded text-xs px-2" />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-gray-500 mb-0.5 block">Responsável</label>
          <input name="proximaAcaoResponsavel" defaultValue={ka?.proximaAcaoResponsavel ?? ''} className="w-full h-7 border rounded text-xs px-2" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">Cancelar</button>
        <Button type="submit" disabled={loading} className="h-6 text-xs bg-[#1B4F8A] hover:bg-[#15407A]">{loading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  )
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-gray-700">{value}</div>
    </div>
  )
}

function LinhaExpandida({ cliente }: { cliente: ClienteEge }) {
  const [activeTab, setActiveTab] = useState<'servicos' | 'interacoes' | 'contatos' | 'plano'>('interacoes')
  const [showForm, setShowForm] = useState(false)
  const [interacoes, setInteracoes] = useState<Interacao[] | null>(null)
  const [loadingInt, setLoadingInt] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [kamData, setKamData] = useState<KAData | null>(null)
  const [loadingKam, setLoadingKam] = useState(false)
  const [kamLoaded, setKamLoaded] = useState(false)

  const initialServicos = Object.fromEntries(
    SERVICOS.map(({ campo }) => [campo, (cliente[campo as keyof typeof cliente] as string) ?? 'VAZIO'])
  )
  const [servicos, setServicos] = useState<Record<string, string>>(initialServicos)

  async function carregarInteracoes() {
    setLoadingInt(true)
    try {
      const data = await buscarInteracoesEge(cliente.id)
      setInteracoes(data as Interacao[])
    } finally {
      setLoadingInt(false)
    }
  }

  async function carregarKAM() {
    if (kamLoaded) return
    setLoadingKam(true)
    try {
      const data = await buscarKAMEge(cliente.id)
      setKamData(data as KAData | null)
    } finally {
      setLoadingKam(false)
      setKamLoaded(true)
    }
  }

  async function recarregarKAM() {
    setKamLoaded(false)
    setLoadingKam(true)
    try {
      const data = await buscarKAMEge(cliente.id)
      setKamData(data as KAData | null)
    } finally {
      setLoadingKam(false)
      setKamLoaded(true)
    }
  }

  useEffect(() => { carregarInteracoes() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'contatos' || activeTab === 'plano') carregarKAM()
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFormClose() {
    setShowForm(false)
    carregarInteracoes()
  }

  async function handleExcluir(id: string) {
    if (!confirm('Excluir esta interação?')) return
    setExcluindoId(id)
    try {
      await excluirInteracaoEge(id)
      toast.success('Interação excluída')
      carregarInteracoes()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setExcluindoId(null)
    }
  }

  async function toggleServico(campo: string, valorAtual: string) {
    const cicloIdx = CICLO_STATUS.indexOf(valorAtual as typeof CICLO_STATUS[number])
    const novoValor = cicloIdx >= 0 ? CICLO_STATUS[(cicloIdx + 1) % CICLO_STATUS.length] : 'VAZIO'
    setServicos(prev => ({ ...prev, [campo]: novoValor }))
    await atualizarClienteEge(cliente.id, { [campo]: novoValor })
  }

  async function toggleTentativa(campo: string, valorAtual: string, e: React.MouseEvent) {
    e.stopPropagation()
    const novoValor = valorAtual === 'TENTATIVA' ? 'CROSS' : 'TENTATIVA'
    setServicos(prev => ({ ...prev, [campo]: novoValor }))
    await atualizarClienteEge(cliente.id, { [campo]: novoValor })
  }

  const TABS = [
    { id: 'interacoes', label: 'Interações' },
    { id: 'servicos', label: 'Serviços' },
    { id: 'contatos', label: 'Contatos-chave' },
    { id: 'plano', label: 'Plano' },
  ] as const

  return (
    <tr>
      <td colSpan={10} className="px-4 pb-4 pt-0 bg-gray-50">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-3">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1B4F8A] text-[#1B4F8A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Aba Interações */}
        {activeTab === 'interacoes' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Histórico de Interações</div>
              <button onClick={() => setShowForm(!showForm)} className="text-xs flex items-center gap-1 text-[#1B4F8A] hover:underline">
                <Plus className="h-3 w-3" /> Nova interação
              </button>
            </div>
            {showForm && <FormInteracaoEge clienteId={cliente.id} onClose={handleFormClose} />}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {loadingInt && <div className="text-xs text-gray-400 py-2">Carregando...</div>}
              {!loadingInt && interacoes?.length === 0 && (
                <div className="text-xs text-gray-400 py-4 text-center">
                  <MessageSquare className="h-6 w-6 mx-auto mb-1 opacity-40" />
                  Nenhuma interação registrada
                </div>
              )}
              {interacoes?.map(int => (
                <div key={int.id}>
                  <div className="bg-white border rounded-lg p-3 text-xs">
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-[#1B4F8A] shrink-0">{int.tipo}</span>
                        {int.gerouOportunidade && (
                          <span className="text-[9px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full shrink-0">Oportunidade</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-gray-400">
                          {int.dataInteracao ? format(new Date(int.dataInteracao), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : ''}
                        </span>
                        <button onClick={() => setEditandoId(editandoId === int.id ? null : int.id)} className="text-gray-400 hover:text-amber-600 hover:bg-amber-50 p-1 rounded transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleExcluir(int.id)} disabled={excluindoId === int.id} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    {int.descricao && <p className="text-gray-600 mb-1">{int.descricao}</p>}
                    {int.servicoOportunidade && <p className="text-[10px] text-green-600 font-medium mb-1">{int.servicoOportunidade}</p>}
                    {int.proximoPasso && (
                      <div className="text-gray-500 border-t pt-1 mt-1">
                        <span className="font-medium">Próximo: </span>{int.proximoPasso}
                        {int.dataProximoPasso && <span className="ml-1 text-[#1B4F8A] font-medium">({format(parseISO(int.dataProximoPasso), 'dd/MM', { locale: ptBR })})</span>}
                      </div>
                    )}
                  </div>
                  {editandoId === int.id && <FormEditarInteracao interacao={int} onClose={() => { setEditandoId(null); carregarInteracoes() }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aba Serviços */}
        {activeTab === 'servicos' && (
          <div>
            <div className="grid grid-cols-2 gap-1 max-w-lg">
              {SERVICOS.map(({ campo, label }) => {
                const val = servicos[campo] ?? 'VAZIO'
                const cor = SITUACAO_CORES[val] ?? SITUACAO_CORES.VAZIO
                const isTentativa = val === 'TENTATIVA'
                const podeTentativa = PODE_TENTATIVA.includes(val) || isTentativa
                return (
                  <div
                    key={campo}
                    className="relative flex items-center justify-between rounded px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: cor.bg }}
                    onClick={() => !isTentativa && toggleServico(campo, val)}
                  >
                    {isTentativa ? (
                      <>
                        <span className="text-xs text-gray-400 truncate line-through">{label}</span>
                        <button onClick={(e) => toggleTentativa(campo, val, e)} className="ml-1 shrink-0 text-gray-400 hover:text-gray-600"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <span className={`text-xs ${cor.text} truncate`}>{label}</span>
                        <div className="flex items-center gap-1 ml-1 shrink-0">
                          <span className={`text-xs font-bold ${cor.text}`}>{val}</span>
                          {podeTentativa && (
                            <button onClick={(e) => toggleTentativa(campo, val, e)} className="text-white/70 hover:text-white transition-colors"><CheckCircle2 className="h-3 w-3" /></button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-1.5 text-xs text-gray-400">Clique na célula para ciclar · ✓ marca tentativa</div>
            {cliente.acao30d && (
              <div className="mt-2 text-xs bg-white border rounded p-2 text-gray-600">
                <span className="font-medium text-gray-700">Ação prioritária: </span>{cliente.acao30d}
              </div>
            )}
          </div>
        )}

        {/* Aba Contatos-chave */}
        {activeTab === 'contatos' && (
          loadingKam
            ? <div className="text-xs text-gray-400 py-4 text-center">Carregando...</div>
            : <AbaContatos clienteId={cliente.id} stakeholders={kamData?.stakeholders ?? []} onRefresh={recarregarKAM} />
        )}

        {/* Aba Plano */}
        {activeTab === 'plano' && (
          loadingKam
            ? <div className="text-xs text-gray-400 py-4 text-center">Carregando...</div>
            : <AbaPlano clienteId={cliente.id} ka={kamData?.ka ?? null} onRefresh={recarregarKAM} />
        )}
      </td>
    </tr>
  )
}

// ── Linha da tabela ───────────────────────────────────────────────────────────
function ClienteRow({ cliente, autoExpand }: { cliente: ClienteEge; autoExpand?: boolean }) {
  const [expanded, setExpanded] = useState(autoExpand ?? false)
  const rowRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    if (autoExpand && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [autoExpand])
  const [status, setStatus] = useState(cliente.statusAcao ?? 'A iniciar')

  async function handleStatus(val: string | null) {
    if (!val) return
    setStatus(val)
    await atualizarClienteEge(cliente.id, { statusAcao: val })
    toast.success('Status atualizado!')
  }

  const cl = cliente.classificacao ?? 'BRONZE'
  const clCor = CLASS_CORES[cl] ?? CLASS_CORES.BRONZE
  const prazoCor = cliente.prazoUrgencia ? (PRAZO_CORES[cliente.prazoUrgencia] ?? '') : ''

  // contar CROSS/UPSELL/RENOVAR
  const opAbertasLabel = SERVICOS.reduce((acc, { campo }) => {
    const v = (cliente[campo as keyof typeof cliente] as string) ?? 'VAZIO'
    if (v === 'CROSS' || v === 'UPSELL' || v === 'RENOVAR') acc++
    return acc
  }, 0)

  return (
    <>
      <tr ref={rowRef} className={`border-b hover:bg-gray-50 transition-colors ${expanded ? 'bg-blue-50/30' : ''} ${autoExpand ? 'ring-2 ring-inset ring-[#1B4F8A]/30' : ''}`}>
        <td className="px-3 py-3 text-center text-xs text-gray-400 w-10">{cliente.rank}</td>
        <td className="px-3 py-3">
          <div className="font-medium text-sm text-gray-900">{cliente.cliente}</div>
          <div className="text-xs text-gray-400">{cliente.local}</div>
        </td>
        <td className="px-3 py-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${clCor.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${clCor.dot}`} />
            {cl}
          </span>
        </td>
        <td className="px-3 py-3">
          {cliente.prazoUrgencia
            ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${prazoCor}`}>{cliente.prazoUrgencia}</span>
            : <span className="text-gray-300 text-xs">—</span>}
        </td>
        <td className="px-3 py-3 text-center">
          <span className="text-sm font-bold text-[#1B4F8A]">{opAbertasLabel}</span>
          <div className="text-xs text-gray-400">abertas</div>
        </td>
        <td className="px-3 py-3 text-sm font-semibold text-[#1B4F8A]">{fmtBRL(cliente.potencialTotal)}</td>
        <td className="px-3 py-3 min-w-[150px]">
          <Select value={status} onValueChange={handleStatus}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ACAO.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </td>
        <td className="px-3 py-3 text-center min-w-[80px]">
          <FollowUpBadge data={cliente.proximoFollowUp} />
        </td>
        <td className="px-3 py-3 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-[#1B4F8A] transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
      </tr>
      {expanded && <LinhaExpandida cliente={cliente} />}
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
function FollowUpBadge({ data }: { data: string | null | undefined }) {
  if (!data) return null
  try {
    const hoje = new Date(); hoje.setHours(0,0,0,0)
    const diff = differenceInDays(parseISODate(data), hoje)
    if (diff < 0) return <span className="text-xs font-semibold text-red-600">{Math.abs(diff)}d VEN.</span>
    if (diff === 0) return <span className="text-xs font-semibold text-red-600">HOJE</span>
    if (diff <= 7) return <span className="text-xs font-semibold text-orange-500">+{diff}d</span>
    return <span className="text-xs text-gray-400">+{diff}d</span>
  } catch { return null }
}

export function TabelaClientesEge({ clientes }: { clientes: ClienteEge[] }) {
  const searchParams = useSearchParams()
  const clienteDestaque = searchParams.get('cliente')

  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroClass, setFiltroClass] = useState<string[]>([])
  const [filtroStatus, setFiltroStatus] = useState<string[]>([])
  const [filtroPrazo, setFiltroPrazo] = useState<string[]>([])
  const [filtroServico, setFiltroServico] = useState<string[]>([])
  const [filtroSituacao, setFiltroSituacao] = useState<string[]>([])
  const [filtroFollowUp, setFiltroFollowUp] = useState('')

  const SERVICO_GRUPOS = ['NR-12', 'NR-10', 'Caça Vaz.', 'Termografia', 'Terceirização HH']
  const SITUACOES = ['CROSS', 'UPSELL', 'RENOVAR', 'FEITO', 'VAZIO']

  const hoje = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const filtrados = useMemo(() => {
    return clientes.filter(c => {
      if (busca) {
        const q = busca.toLowerCase()
        if (!c.cliente.toLowerCase().includes(q) &&
            !(c.local ?? '').toLowerCase().includes(q) &&
            !(c.contatoNome ?? '').toLowerCase().includes(q)) return false
      }
      if (filtroClass.length > 0 && !filtroClass.includes(c.classificacao ?? '')) return false
      if (filtroStatus.length > 0 && !filtroStatus.includes(c.statusAcao ?? 'A iniciar')) return false
      if (filtroPrazo.length > 0 && !filtroPrazo.includes(c.prazoUrgencia ?? '')) return false

      if (filtroFollowUp && c.proximoFollowUp) {
        try {
          const diff = differenceInDays(parseISODate(c.proximoFollowUp), hoje)
          if (filtroFollowUp === 'hoje' && diff !== 0) return false
          if (filtroFollowUp === 'vencido' && diff >= 0) return false
          if (filtroFollowUp === '7d' && (diff < 0 || diff > 7)) return false
          if (filtroFollowUp === '30d' && (diff < 0 || diff > 30)) return false
        } catch { return false }
      } else if (filtroFollowUp) {
        return false
      }

      if (filtroServico.length > 0 || filtroSituacao.length > 0) {
        const servicosFiltrados = SERVICOS.filter(s => {
          if (filtroServico.length === 0) return true
          return filtroServico.some(fg => s.grupo === fg || s.label.includes(fg))
        })
        const match = servicosFiltrados.some(({ campo }) => {
          const val = (c[campo as keyof typeof c] as string) ?? 'VAZIO'
          if (filtroSituacao.length > 0) return filtroSituacao.includes(val)
          return val !== 'VAZIO'
        })
        if (!match) return false
      }

      return true
    })
  }, [clientes, busca, filtroClass, filtroStatus, filtroPrazo, filtroServico, filtroSituacao, filtroFollowUp, hoje])

  const hasFilters = busca || filtroClass.length > 0 || filtroStatus.length > 0 || filtroPrazo.length > 0 || filtroServico.length > 0 || filtroSituacao.length > 0 || filtroFollowUp

  function limparFiltros() {
    setBusca('')
    setFiltroClass([])
    setFiltroStatus([])
    setFiltroPrazo([])
    setFiltroServico([])
    setFiltroSituacao([])
    setFiltroFollowUp('')
  }

  // Agrupar por classificação
  const grupos = [
    { label: 'OURO', clientes: filtrados.filter(c => c.classificacao === 'OURO') },
    { label: 'PRATA', clientes: filtrados.filter(c => c.classificacao === 'PRATA') },
    { label: 'BRONZE', clientes: filtrados.filter(c => c.classificacao === 'BRONZE') },
  ]

  return (
    <div className="space-y-4">
      {showNovoCliente && <FormNovoCliente onClose={() => setShowNovoCliente(false)} />}
      {/* Filtros */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar cliente, cidade, contato..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="h-9 w-64 text-sm"
          />
          <MultiSelect label="Classificação" options={['OURO', 'PRATA', 'BRONZE']} selected={filtroClass} onChange={setFiltroClass} />
          <MultiSelect label="Status" options={STATUS_ACAO} selected={filtroStatus} onChange={setFiltroStatus} />
          <MultiSelect label="Prazo" options={['30d', '30-60d', '60-90d']} selected={filtroPrazo} onChange={setFiltroPrazo} />
          <MultiSelect label="Serviço" options={SERVICO_GRUPOS} selected={filtroServico} onChange={setFiltroServico} />
          <MultiSelect label="Situação" options={SITUACOES} selected={filtroSituacao} onChange={setFiltroSituacao} />
          <select
            value={filtroFollowUp}
            onChange={e => setFiltroFollowUp(e.target.value)}
            className="h-9 px-3 border rounded-md text-sm bg-white hover:bg-gray-50 text-gray-700"
          >
            <option value="">Follow-up (todos)</option>
            <option value="vencido">Vencidos</option>
            <option value="hoje">Hoje</option>
            <option value="7d">Próximos 7 dias</option>
            <option value="30d">Próximos 30 dias</option>
          </select>
          {hasFilters && (
            <button onClick={limparFiltros} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowNovoCliente(true)}
              className="flex items-center gap-1.5 text-xs text-white bg-[#1B4F8A] hover:bg-[#15407A] px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Novo Cliente
            </button>
            <a href="/oportunidades/inativos" className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <Archive className="h-3.5 w-3.5" /> Propostas Inativas
            </a>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Exibindo <span className="font-semibold text-gray-600">{filtrados.length}</span> de <span className="font-semibold text-gray-600">{clientes.length}</span> clientes
        </div>
      </div>

      {/* Tabela por grupo */}
      {grupos.map(({ label, clientes: grupo }) => {
        if (grupo.length === 0) return null
        const clCor = CLASS_CORES[label]
        return (
          <div key={label} className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
              <div className={`w-2.5 h-2.5 rounded-full ${clCor.dot}`} />
              <span className="font-semibold text-sm">{label}</span>
              <span className="text-xs text-gray-400">— {grupo.length} clientes</span>
              <span className="ml-auto text-xs font-semibold text-[#1B4F8A]">
                {fmtBRL(grupo.reduce((s, c) => s + Number(c.potencialTotal ?? 0), 0))}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium w-10">#</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium">Cliente</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium">Class.</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium">Prazo</th>
                    <th className="px-3 py-2 text-center text-xs text-gray-400 font-medium">Oport.</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium">Potencial</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium">Status Ação</th>
                    <th className="px-3 py-2 text-center text-xs text-gray-400 font-medium flex items-center gap-1"><Clock className="h-3 w-3"/>Follow-up</th>
                    <th className="px-3 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {grupo.map(c => <ClienteRow key={c.id} cliente={c} autoExpand={c.id === clienteDestaque} />)}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {filtrados.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-12">Nenhum cliente encontrado com os filtros aplicados.</div>
      )}
    </div>
  )
}
