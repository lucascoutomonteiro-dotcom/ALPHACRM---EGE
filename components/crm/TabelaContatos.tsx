'use client'

import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender, ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { StatusBadge } from './StatusBadge'
import { FormContato } from './FormContato'
import { FormInteracao } from './FormInteracao'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Phone, Edit, MessageSquare, X, ChevronDown, Check, LayoutList, Kanban, Trash2 } from 'lucide-react'
import { STATUS_FORA_ANDAMENTO, CANAIS, ORIGENS } from '@/lib/constants'
import { GerenciarColunas } from './GerenciarColunas'
import { differenceInDays, parseISO } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { atualizarStatusContato, deletarContato, toggleUrgente, decrementarReuniao } from '@/app/(dashboard)/crm/actions'
import { toast } from 'sonner'

interface Contato {
  id: string
  nome: string | null
  empresa: string | null
  cidade: string | null
  cargo: string | null
  telefone: string | null
  email: string | null
  canal: string | null
  origem: string | null
  status: string
  proximaAtividade: string | null
  ultimaInteracao: string | null
  historico: string | null
  segmento: string | null
  valorEstimado: string | null
  probabilidade: number | null
  urgente: boolean | null
  tipoCliente?: string | null
}

function FollowupLabel({ data }: { data: string | null }) {
  if (!data) return null
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const diff = differenceInDays(parseISO(data), hoje)
  if (diff === 0) return <span className="text-red-600 font-semibold text-xs">Hoje</span>
  if (diff > 0) return <span className="text-blue-600 font-semibold text-xs">+{diff}d</span>
  return <span className="text-red-600 font-semibold text-xs">{Math.abs(diff)}d VEN.</span>
}

const CANAL_COLORS: Record<string, string> = {
  WhatsApp: 'bg-green-100 text-green-700',
  LinkedIn: 'bg-blue-100 text-blue-700',
  'Ligação': 'bg-orange-100 text-orange-700',
  'E-mail': 'bg-gray-100 text-gray-700',
}

const TIPO_CLIENTE_COLORS: Record<string, string> = {
  'Novo Cliente':   'bg-blue-50 text-blue-700 border border-blue-200',
  'Nova Unidade':   'bg-purple-50 text-purple-700 border border-purple-200',
  'Cliente EGE':    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Cliente Lucas':  'bg-amber-50 text-amber-700 border border-amber-200',
}

// ── Multi-select status ──────────────────────────────────────────────────────
function StatusMultiSelect({ selected, onChange, nomes }: { selected: string[]; onChange: (v: string[]) => void; nomes: string[] }) {
  const [open, setOpen] = useState(false)
  function toggle(s: string) {
    onChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s])
  }
  const label = selected.length === 0 ? 'todos os status' : selected.length === 1 ? selected[0] : `${selected.length} status`
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="h-9 px-3 border rounded-md text-sm flex items-center gap-2 bg-white hover:bg-gray-50 min-w-[180px] justify-between">
        <span className="truncate text-left">{label}</span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-10 left-0 z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[200px] max-h-72 overflow-y-auto">
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => { onChange([]); setOpen(false) }}>
              <span className={`w-4 h-4 rounded border flex items-center justify-center ${selected.length === 0 ? 'bg-[#1B4F8A] border-[#1B4F8A]' : 'border-gray-300'}`}>
                {selected.length === 0 && <Check className="h-3 w-3 text-white" />}
              </span>
              Todos os status
            </button>
            {nomes.map((s) => (
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

// ── Tooltip de histórico no ícone de interação ───────────────────────────────
function HistoricoTooltip({ historico }: { historico: string | null }) {
  const [show, setShow] = useState(false)
  if (!historico) return null
  return (
    <div className="relative inline-flex">
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="flex items-center">
        {show && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs rounded-lg p-2.5 w-64 shadow-xl whitespace-pre-wrap max-h-40 overflow-y-auto">
            {historico}
          </div>
        )}
      </div>
    </div>
  )
}

// ── COL_WIDTHS sem empresa (ela usa flex:1) ──────────────────────────────────
const COL_WIDTHS = { nome: 220, cidade: 120, canal: 120, status: 165, followup: 80, acoes: 80 }
const FIXED_TOTAL = Object.values(COL_WIDTHS).reduce((a, b) => a + b, 0) // 785

interface Coluna {
  id: string
  nome: string
  cor: string
  ordem: number
  sistema: boolean | null
}

interface EgeFollowup {
  id: string
  nome: string
  localidade: string | null
  proximaAtividade: string
  ultimaInteracao: string | null
}

interface TabelaContatosProps {
  contatos: Contato[]
  userId: string
  colunas: Coluna[]
  egeFollowups?: EgeFollowup[]
}

// Lê/escreve filtros no sessionStorage para persistir entre navegações
function ss(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return sessionStorage.getItem(key) ?? fallback
}
function ssSave(key: string, val: string) {
  if (typeof window !== 'undefined') sessionStorage.setItem(key, val)
}

export function TabelaContatos({ contatos: initialContatos, userId, colunas, egeFollowups = [] }: TabelaContatosProps) {
  const router = useRouter()

  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [canalFilter, setCanalFilter] = useState('todos')
  const [origemFilter, setOrigemFilter] = useState('todos')
  const [followupFilter, setFollowupFilter] = useState('todos')
  const [mesFilter, setMesFilter] = useState('todos')
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('kanban')

  // Restaura filtros do sessionStorage após hydration
  useEffect(() => {
    setGlobalFilter(ss('crm_q', ''))
    const s = ss('crm_status', '')
    setStatusFilter(s ? s.split('|') : [])
    setCanalFilter(ss('crm_canal', 'todos'))
    setOrigemFilter(ss('crm_origem', 'todos'))
    setFollowupFilter(ss('crm_followup', 'todos'))
    setMesFilter(ss('crm_mes', 'todos'))
    setViewMode(ss('crm_view', 'kanban') as 'lista' | 'kanban')
  }, [])

  const [editContato, setEditContato] = useState<Contato | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [interacaoContato, setInteracaoContato] = useState<Contato | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Drag state para kanban
  const [localUrgente, setLocalUrgente] = useState<Record<string, boolean>>({})
  const [deletandoId, setDeletandoId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)
  // Popup de confirmação de reunião realizada
  const [confirmarReuniaoId, setConfirmarReuniaoId] = useState<string | null>(null)
  const [confirmarReuniaoNome, setConfirmarReuniaoNome] = useState('')
  const [pendingDrop, setPendingDrop] = useState<{ id: string; targetStatus: string; prevStatus: string } | null>(null)
  const kanbanRef = useRef<HTMLDivElement>(null)
  const scrollbarRef = useRef<HTMLDivElement>(null)

  function syncFromKanban() {
    if (scrollbarRef.current && kanbanRef.current) scrollbarRef.current.scrollLeft = kanbanRef.current.scrollLeft
  }
  function syncFromScrollbar() {
    if (kanbanRef.current && scrollbarRef.current) kanbanRef.current.scrollLeft = scrollbarRef.current.scrollLeft
  }

  // Oculta "Demanda Lucas" do kanban, exceto quando está no filtro de status ativo
  const COLUNAS_OCULTAS_KANBAN = ['Demanda Lucas']
  const colunasKanban = colunas.filter((c) =>
    !COLUNAS_OCULTAS_KANBAN.includes(c.nome) || statusFilter.includes(c.nome)
  )

  function handleGlobalFilter(v: string) { setGlobalFilter(v); ssSave('crm_q', v) }
  function handleStatusFilter(v: string[]) { setStatusFilter(v); ssSave('crm_status', v.join('|')) }
  function handleCanalFilter(v: string) { setCanalFilter(v); ssSave('crm_canal', v) }
  function handleOrigemFilter(v: string) { setOrigemFilter(v); ssSave('crm_origem', v) }
  function handleFollowupFilter(v: string) { setFollowupFilter(v); ssSave('crm_followup', v) }
  function handleMesFilter(v: string) { setMesFilter(v); ssSave('crm_mes', v) }
  function handleViewMode(v: 'lista' | 'kanban') { setViewMode(v); ssSave('crm_view', v) }

  // Gera lista dos últimos 12 meses para o filtro
  const opcoesMes = useMemo(() => {
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
    const now = new Date()
    const lista: { value: string; label: string }[] = []
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      lista.push({ value: `${yyyy}-${mm}`, label: `${meses[d.getMonth()]} ${yyyy}` })
    }
    return lista
  }, [])

  const hoje = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()

  const filtered = useMemo(() => {
    let data = initialContatos
    if (globalFilter) {
      const q = globalFilter.toLowerCase()
      data = data.filter((c) => [c.nome, c.empresa, c.cidade, c.cargo, c.email].some((v) => v?.toLowerCase().includes(q)))
    }
    if (statusFilter.length > 0) data = data.filter((c) => statusFilter.includes(c.status))
    if (canalFilter !== 'todos') data = data.filter((c) => c.canal === canalFilter)
    if (origemFilter !== 'todos') data = data.filter((c) => c.origem === origemFilter)
    if (followupFilter === 'hoje') data = data.filter((c) => c.proximaAtividade === hoje)
    if (followupFilter === 'vencidos') data = data.filter((c) => c.proximaAtividade && c.proximaAtividade < hoje)
    if (followupFilter === '7dias') {
      const limit = new Date(); limit.setDate(limit.getDate() + 7)
      data = data.filter((c) => c.proximaAtividade && c.proximaAtividade >= hoje && c.proximaAtividade <= limit.toISOString().split('T')[0])
    }
    if (mesFilter !== 'todos') {
      // Filtra por mês/ano da última interação (yyyy-mm)
      data = data.filter((c) => c.ultimaInteracao && c.ultimaInteracao.startsWith(mesFilter))
    }
    return data
  }, [initialContatos, globalFilter, statusFilter, canalFilter, origemFilter, followupFilter, mesFilter, hoje])

  // Optimistic update para kanban
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({})

  function getStatus(c: Contato) {
    return localStatus[c.id] ?? c.status
  }

  // EGE follow-ups filtrados pelos filtros ativos (busca + follow-up date)
  const egeFiltered = useMemo(() => {
    let data = egeFollowups
    if (globalFilter) {
      const q = globalFilter.toLowerCase()
      data = data.filter((e) => e.nome?.toLowerCase().includes(q) || e.localidade?.toLowerCase().includes(q))
    }
    if (followupFilter === 'hoje') data = data.filter((e) => e.proximaAtividade === hoje)
    if (followupFilter === 'vencidos') data = data.filter((e) => e.proximaAtividade < hoje)
    if (followupFilter === '7dias') {
      const limit = new Date(); limit.setDate(limit.getDate() + 7)
      data = data.filter((e) => e.proximaAtividade >= hoje && e.proximaAtividade <= limit.toISOString().split('T')[0])
    }
    // Quando filtro de status ativo não inclui "Follow-up Agendado", ocultar EGE
    if (statusFilter.length > 0 && !statusFilter.includes('Follow-up Agendado')) data = []
    return data
  }, [egeFollowups, globalFilter, followupFilter, statusFilter, hoje])

  // Summary reativo — atualiza instantaneamente ao arrastar cards
  const summary = useMemo(() => {
    const total = initialContatos.length
    const semContato = initialContatos.filter((c) => getStatus(c) === 'Nunca Contatado').length
    const emAndamento = initialContatos.filter((c) => !STATUS_FORA_ANDAMENTO.includes(getStatus(c))).length + egeFollowups.length
    const followHoje = initialContatos.filter((c) => c.proximaAtividade === hoje).length + egeFollowups.filter((e) => e.proximaAtividade === hoje).length
    const oportunidades = initialContatos.filter((c) => getStatus(c) === 'Reunião/Visita').length
    const fechadosMes = initialContatos.filter((c) => getStatus(c) === 'Fechado Ganho').length
    return { total, semContato, emAndamento, followHoje, oportunidades, fechadosMes }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContatos, localStatus, hoje, egeFollowups])

  async function handleToggleUrgente(c: Contato) {
    const atual = localUrgente[c.id] ?? c.urgente ?? false
    setLocalUrgente((prev) => ({ ...prev, [c.id]: !atual }))
    await toggleUrgente(c.id, !atual)
  }

  async function handleDelete(id: string) {
    await deletarContato(id)
    setDeletandoId(null)
    router.refresh()
  }

  async function executarDrop(id: string, targetStatus: string, prevStatus: string, reuniaoRealizada?: boolean) {
    setLocalStatus((prev) => ({ ...prev, [id]: targetStatus }))
    const result = await atualizarStatusContato(id, targetStatus)
    if (!result.success) {
      setLocalStatus((prev) => { const n = { ...prev }; n[id] = prevStatus; return n })
      toast.error('Erro ao mover card.')
      return
    }
    if (reuniaoRealizada === false) {
      await decrementarReuniao(id)
    }
  }

  async function handleDrop(targetStatus: string) {
    if (!draggingId || !targetStatus) return
    const id = draggingId
    const prevStatus = localStatus[id] ?? initialContatos.find((c) => c.id === id)?.status ?? ''
    if (prevStatus === targetStatus) { setDraggingId(null); setDragOverStatus(null); return }
    setDraggingId(null)
    setDragOverStatus(null)

    // Saindo de Reunião/Visita → perguntar se a reunião foi realizada
    if (prevStatus === 'Reunião/Visita') {
      const contato = initialContatos.find((c) => c.id === id)
      setPendingDrop({ id, targetStatus, prevStatus })
      setConfirmarReuniaoNome(contato?.nome ?? '')
      setConfirmarReuniaoId(id)
      return
    }

    await executarDrop(id, targetStatus, prevStatus)
  }

  async function handleConfirmarReuniao(realizada: boolean) {
    if (!pendingDrop) return
    setConfirmarReuniaoId(null)
    await executarDrop(pendingDrop.id, pendingDrop.targetStatus, pendingDrop.prevStatus, realizada)
    setPendingDrop(null)
  }

  const columns: ColumnDef<Contato>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome / Contato',
      size: COL_WIDTHS.nome,
      cell: ({ row }) => (
        <div className="overflow-hidden">
          <Link href={`/crm/${row.original.id}`} className="font-medium text-[#1B4F8A] hover:underline text-sm truncate block">{row.original.nome || '—'}</Link>
          {row.original.telefone && (
            <a href={`tel:${row.original.telefone}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-0.5">
              <Phone className="h-3 w-3 shrink-0" /><span className="truncate">{row.original.telefone}</span>
            </a>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'empresa',
      header: 'Empresa',
      size: 0, // flex:1
      cell: ({ getValue }) => <span className="text-sm truncate block">{getValue() as string || '—'}</span>,
    },
    {
      accessorKey: 'cidade',
      header: 'Cidade',
      size: COL_WIDTHS.cidade,
      cell: ({ getValue }) => <span className="text-sm text-gray-500 truncate block">{getValue() as string || '—'}</span>,
    },
    {
      accessorKey: 'canal',
      header: 'Canal',
      size: COL_WIDTHS.canal,
      cell: ({ getValue }) => {
        const canal = getValue() as string
        return canal ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${CANAL_COLORS[canal] || 'bg-gray-100 text-gray-600'}`}>{canal}</span> : null
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: COL_WIDTHS.status,
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: 'proximaAtividade',
      header: 'Follow-up',
      size: COL_WIDTHS.followup,
      cell: ({ getValue }) => <FollowupLabel data={getValue() as string | null} />,
    },
    {
      id: 'acoes',
      header: '',
      size: COL_WIDTHS.acoes,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditContato(row.original); setFormOpen(true) }} className="p-1 hover:bg-gray-100 rounded" title="Editar">
            <Edit className="h-3.5 w-3.5 text-gray-400" />
          </button>
          <div className="relative group">
            <button onClick={() => setInteracaoContato(row.original)} className="p-1 hover:bg-gray-100 rounded" title="Registrar interação">
              <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {row.original.historico && (
              <div className="absolute bottom-7 right-0 z-50 bg-gray-900 text-white text-xs rounded-lg p-2.5 w-64 shadow-xl whitespace-pre-wrap max-h-40 overflow-y-auto hidden group-hover:block">
                {row.original.historico}
              </div>
            )}
          </div>
        </div>
      ),
    },
  ]

  const table = useReactTable({ data: filtered, columns, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel() })
  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 52,
    overscan: 10,
  })

  const hasFilters = statusFilter.length > 0 || canalFilter !== 'todos' || origemFilter !== 'todos' || followupFilter !== 'todos' || mesFilter !== 'todos' || globalFilter

  function clearFilters() {
    setGlobalFilter(''); setStatusFilter([]); setCanalFilter('todos'); setOrigemFilter('todos'); setFollowupFilter('todos'); setMesFilter('todos')
    ;['crm_q', 'crm_status', 'crm_canal', 'crm_origem', 'crm_followup', 'crm_mes'].forEach((k) => sessionStorage.removeItem(k))
  }

  const summaryCards = [
    { label: 'Total Base',    value: summary.total,        color: 'text-gray-700' },
    { label: 'Sem Contato',   value: summary.semContato,   color: 'text-gray-500' },
    { label: 'Em Andamento',  value: summary.emAndamento,  color: 'text-orange-600' },
    { label: 'Follow HOJE',   value: summary.followHoje,   color: 'text-red-600' },
    { label: 'Reunião/Visita', value: summary.oportunidades, color: 'text-green-700' },
    { label: 'Fechados/Mês',  value: summary.fechadosMes,  color: 'text-blue-700' },
  ]

  return (
    <div className="space-y-4">
      {/* Summary reativo */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {summaryCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString('pt-BR')}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar nome, empresa, cidade..." value={globalFilter} onChange={(e) => handleGlobalFilter(e.target.value)} className="max-w-xs" />
        <StatusMultiSelect selected={statusFilter} onChange={handleStatusFilter} nomes={colunas.map((c) => c.nome)} />
        <Select value={canalFilter} onValueChange={(v) => { if (v) handleCanalFilter(v) }}>
          <SelectTrigger className="w-36">
            {canalFilter === 'todos' ? <span className="text-gray-400 text-sm">Canal</span> : <SelectValue />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os canais</SelectItem>
            {CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={origemFilter} onValueChange={(v) => { if (v) handleOrigemFilter(v) }}>
          <SelectTrigger className="w-36">
            {origemFilter === 'todos' ? <span className="text-gray-400 text-sm">Origem</span> : <SelectValue />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as origens</SelectItem>
            {ORIGENS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={followupFilter} onValueChange={(v) => { if (v) handleFollowupFilter(v) }}>
          <SelectTrigger className="w-44">
            {followupFilter === 'todos' ? <span className="text-gray-400 text-sm">Follow-up</span> : <SelectValue />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="vencidos">Vencidos</SelectItem>
            <SelectItem value="7dias">Próximos 7 dias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={mesFilter} onValueChange={(v) => { if (v) handleMesFilter(v) }}>
          <SelectTrigger className="w-44">
            {mesFilter === 'todos' ? <span className="text-gray-400 text-sm">Mês de atividade</span> : <SelectValue />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os meses</SelectItem>
            {opcoesMes.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> Limpar
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <GerenciarColunas colunas={colunas} />
          <span className="text-sm text-gray-500">Exibindo {filtered.length} de {initialContatos.length} contatos</span>
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => handleViewMode('lista')} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'lista' ? 'bg-white shadow-sm text-[#1B4F8A]' : 'text-gray-500 hover:text-gray-700'}`}>
              <LayoutList className="h-3.5 w-3.5" /> Lista
            </button>
            <button onClick={() => handleViewMode('kanban')} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-[#1B4F8A]' : 'text-gray-500 hover:text-gray-700'}`}>
              <Kanban className="h-3.5 w-3.5" /> Kanban
            </button>
          </div>
          <Button size="sm" className="bg-[#1B4F8A] hover:bg-[#163f70]" onClick={() => { setEditContato(null); setFormOpen(true) }}>+ Novo Contato</Button>

        </div>
      </div>

      {/* ── Kanban ── */}
      {viewMode === 'kanban' && (
        <>
        <div ref={kanbanRef} className="overflow-x-hidden pb-2" onScroll={syncFromKanban}>
          <div className="flex gap-3" style={{ minWidth: colunasKanban.length * 220 }}>
            {colunasKanban.map((col) => {
              const status = col.nome
              const grupoRaw = filtered.filter((c) => getStatus(c) === status)
              const hojeDate = new Date(); hojeDate.setHours(0,0,0,0)
              const grupo = [...grupoRaw].sort((a, b) => {
                const aUrgente = localUrgente[a.id] ?? a.urgente ?? false
                const bUrgente = localUrgente[b.id] ?? b.urgente ?? false
                const aHoje = a.proximaAtividade ? differenceInDays(parseISO(String(a.proximaAtividade)), hojeDate) === 0 : false
                const bHoje = b.proximaAtividade ? differenceInDays(parseISO(String(b.proximaAtividade)), hojeDate) === 0 : false
                const aPrio = aUrgente ? 2 : aHoje ? 1 : 0
                const bPrio = bUrgente ? 2 : bHoje ? 1 : 0
                return bPrio - aPrio
              })
              const isDragOver = dragOverStatus === status
              return (
                <div
                  key={status}
                  className={`flex-shrink-0 w-52 space-y-2 rounded-lg p-2 transition-colors ${isDragOver ? 'bg-blue-50 ring-2 ring-[#1B4F8A] ring-opacity-30' : 'bg-gray-50'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status) }}
                  onDragLeave={() => setDragOverStatus(null)}
                  onDrop={() => handleDrop(status)}
                >
                  <div className="bg-white border rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-sm" style={{ borderLeftWidth: 3, borderLeftColor: col.cor }}>
                    <span className="text-xs font-semibold text-gray-700 truncate">{status}</span>
                    <span className="text-xs text-gray-400 ml-1 shrink-0 bg-gray-100 rounded-full px-1.5">
                      {grupo.length + (status === 'Follow-up Agendado' ? egeFiltered.length : 0)}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {grupo.map((c) => (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={() => setDraggingId(c.id)}
                        onDragEnd={() => { setDraggingId(null); setDragOverStatus(null) }}
                        className={`bg-white border rounded-lg p-3 shadow-sm space-y-1.5 hover:border-[#1B4F8A] transition-colors cursor-grab active:cursor-grabbing ${draggingId === c.id ? 'opacity-50' : ''} ${(localUrgente[c.id] ?? c.urgente) ? 'border-l-2 border-l-orange-400' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-start gap-1.5 flex-1 min-w-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleUrgente(c) }}
                              title={(localUrgente[c.id] ?? c.urgente) ? 'Urgente — clique para remover' : 'Marcar como urgente'}
                              className="mt-0.5 shrink-0"
                            >
                              <span className={`block w-2 h-2 rounded-full transition-colors ${(localUrgente[c.id] ?? c.urgente) ? 'bg-orange-400' : 'bg-gray-200 hover:bg-orange-200'}`} />
                            </button>
                            <Link href={`/crm/${c.id}`} className="font-medium text-sm text-[#1B4F8A] hover:underline leading-snug line-clamp-2">
                              {c.nome || '—'}
                            </Link>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={() => { setEditContato(c); setFormOpen(true) }} className="p-0.5 hover:bg-gray-100 rounded">
                              <Edit className="h-3 w-3 text-gray-400" />
                            </button>
                            <div className="relative group/tip">
                              <button onClick={() => setInteracaoContato(c)} className="p-0.5 hover:bg-gray-100 rounded">
                                <MessageSquare className="h-3 w-3 text-gray-400" />
                              </button>
                              {c.historico && (
                                <div className="absolute bottom-6 right-0 z-50 bg-gray-900 text-white text-xs rounded-lg p-2.5 w-60 shadow-xl whitespace-pre-wrap max-h-36 overflow-y-auto hidden group-hover/tip:block">
                                  {c.historico}
                                </div>
                              )}
                            </div>
                            <button onClick={() => setDeletandoId(c.id)} className="p-0.5 hover:bg-red-50 rounded">
                              <Trash2 className="h-3 w-3 text-red-300 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                        {c.empresa && <p className="text-xs text-gray-500 truncate">{c.empresa}</p>}
                        {(c.tipoCliente || c.origem) && (
                          <div className="flex flex-wrap gap-1">
                            {c.tipoCliente && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TIPO_CLIENTE_COLORS[c.tipoCliente] || 'bg-gray-100 text-gray-600'}`}>
                                {c.tipoCliente}
                              </span>
                            )}
                            {c.origem && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                                {c.origem}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-1">
                          {c.canal && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${CANAL_COLORS[c.canal] || 'bg-gray-100 text-gray-600'}`}>{c.canal}</span>
                          )}
                          <FollowupLabel data={c.proximaAtividade} />
                        </div>
                      </div>
                    ))}
                    {/* Cards EGE — não arrastáveis, apenas na coluna Follow-up Agendado */}
                    {status === 'Follow-up Agendado' && egeFiltered.map((e) => (
                      <Link
                        key={'ege-' + e.id}
                        href={`/oportunidades?cliente=${e.id}`}
                        className="block bg-white border border-[#1B4F8A]/20 rounded-lg p-3 shadow-sm space-y-1.5 hover:border-[#1B4F8A] transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#1B4F8A] text-white tracking-wide">EGE</span>
                          <span className="font-medium text-sm text-[#1B4F8A] leading-snug line-clamp-2">{e.nome || '—'}</span>
                        </div>
                        {e.localidade && <p className="text-xs text-gray-500 truncate">{e.localidade}</p>}
                        <div className="flex items-center justify-end">
                          <FollowupLabel data={e.proximaAtividade} />
                        </div>
                      </Link>
                    ))}
                    {grupo.length === 0 && (status !== 'Follow-up Agendado' || egeFiltered.length === 0) && (
                      <div className="text-xs text-gray-400 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">Solte aqui</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Scrollbar sticky no fundo da tela */}
        <div
          ref={scrollbarRef}
          className="sticky bottom-0 overflow-x-auto overflow-y-hidden bg-white/80 backdrop-blur-sm border-t border-gray-200 z-20"
          style={{ height: 14 }}
          onScroll={syncFromScrollbar}
        >
          <div style={{ minWidth: colunasKanban.length * 220, height: 1 }} />
        </div>
        </>
      )}

      {/* ── Lista (tabela virtual) ── */}
      {viewMode === 'lista' && (
        <div className="bg-white rounded-xl border overflow-auto" style={{ height: '600px' }}>
          <div className="flex flex-col h-full">
            {/* Sticky header — empresa usa flex:1 */}
            <div className="sticky top-0 bg-gray-50 z-10 flex border-b shrink-0">
              {table.getHeaderGroups()[0].headers.map((h) => {
                const isEmpresa = h.column.id === 'empresa'
                return (
                  <div
                    key={h.id}
                    className={`px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap overflow-hidden ${isEmpresa ? 'flex-1 min-w-[150px]' : 'shrink-0'}`}
                    style={isEmpresa ? undefined : { width: h.column.getSize() }}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </div>
                )
              })}
            </div>

            {/* Virtualised rows */}
            <div ref={tableContainerRef} className="flex-1 overflow-y-auto relative">
              <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <div
                      key={row.id}
                      className="absolute top-0 left-0 flex hover:bg-gray-50 border-b w-full"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isEmpresa = cell.column.id === 'empresa'
                        return (
                          <div
                            key={cell.id}
                            className={`px-4 py-3 overflow-hidden flex items-center ${isEmpresa ? 'flex-1 min-w-[150px]' : 'shrink-0'}`}
                            style={isEmpresa ? undefined : { width: cell.column.getSize() }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
              {rows.length === 0 && (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Nenhum contato encontrado.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EGE follow-ups na vista Lista */}
      {viewMode === 'lista' && egeFiltered.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-2">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#1B4F8A] text-white tracking-wide">EGE</span>
            <span className="text-xs font-semibold text-gray-600">Follow-ups de Oportunidades ({egeFiltered.length})</span>
          </div>
          {egeFiltered.map((e) => (
            <Link
              key={'ege-' + e.id}
              href={`/oportunidades?cliente=${e.id}`}
              className="flex items-center justify-between px-4 py-3 border-b hover:bg-gray-50 transition-colors last:border-b-0"
            >
              <div style={{ width: COL_WIDTHS.nome }} className="shrink-0 overflow-hidden">
                <span className="font-medium text-sm text-[#1B4F8A] truncate block">{e.nome || '—'}</span>
              </div>
              <div className="flex-1 min-w-[150px] overflow-hidden px-4">
                <span className="text-sm text-gray-500 truncate block">{e.localidade || '—'}</span>
              </div>
              <div style={{ width: COL_WIDTHS.cidade }} className="shrink-0 overflow-hidden" />
              <div style={{ width: COL_WIDTHS.canal }} className="shrink-0" />
              <div style={{ width: COL_WIDTHS.status }} className="shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">Follow-up Agendado</span>
              </div>
              <div style={{ width: COL_WIDTHS.followup }} className="shrink-0">
                <FollowupLabel data={e.proximaAtividade} />
              </div>
              <div style={{ width: COL_WIDTHS.acoes }} className="shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {confirmarReuniaoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-96 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <span className="text-green-700 text-lg">📅</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">A reunião foi realizada?</p>
                <p className="text-xs text-gray-500 mt-0.5">{confirmarReuniaoNome}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Se a reunião não aconteceu, ela será removida da contagem de reuniões do mês.</p>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => handleConfirmarReuniao(false)} className="text-red-600 border-red-200 hover:bg-red-50">
                Não foi realizada
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleConfirmarReuniao(true)}>
                Sim, foi realizada
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletandoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeletandoId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-80 space-y-4">
            <p className="text-sm font-medium text-gray-800">Excluir este contato?</p>
            <p className="text-xs text-gray-500">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setDeletandoId(null)}>Cancelar</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(deletandoId)}>Excluir</Button>
            </div>
          </div>
        </div>
      )}
      <FormContato key={editContato?.id ?? 'novo'} open={formOpen} onClose={() => { setFormOpen(false); router.refresh() }} contato={editContato} statusOpcoes={colunas.map((c) => c.nome)} />
      {interacaoContato && (
        <FormInteracao
          open={!!interacaoContato}
          onClose={() => setInteracaoContato(null)}
          contatoId={interacaoContato.id}
          userId={userId}
        />
      )}
    </div>
  )
}
