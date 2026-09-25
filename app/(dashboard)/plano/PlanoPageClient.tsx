'use client'

import { useState, useEffect, useRef } from 'react'
import { PlanoAcaoList } from './PlanoAcaoList'
import { LayoutList, Kanban, Pencil, Check } from 'lucide-react'
import { moverPrazoAcao } from './actions'
import { toast } from 'sonner'
import { differenceInDays, parseISO } from 'date-fns'

const GRUPOS_DEFAULT = [
  { prazo: 'CURTO', label: 'Curto Prazo — Mês 1 a 3', border: 'border-green-400', bg: 'bg-green-50' },
  { prazo: 'MEDIO', label: 'Médio Prazo — Mês 4 a 6', border: 'border-yellow-400', bg: 'bg-yellow-50' },
  { prazo: 'LONGO', label: 'Longo Prazo — Mês 6 a 12', border: 'border-blue-400', bg: 'bg-blue-50' },
]

function GrupoLabel({ prazo, defaultLabel }: { prazo: string; defaultLabel: string }) {
  const storageKey = `plano-label-${prazo}`
  const [label, setLabel] = useState(defaultLabel)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) { setLabel(saved); setDraft(saved) }
  }, [storageKey])

  function startEdit() { setDraft(label); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0) }

  function save() {
    const trimmed = draft.trim() || defaultLabel
    setLabel(trimmed)
    localStorage.setItem(storageKey, trimmed)
    setEditing(false)
  }

  if (editing) return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        className="text-sm font-semibold bg-white border border-[#1B4F8A] rounded px-2 py-0.5 focus:outline-none w-64"
      />
      <button onClick={save} className="p-1 text-[#1B4F8A] hover:bg-white/50 rounded">
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  )

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="font-semibold text-sm">{label}</span>
      <button onClick={startEdit} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/50 text-gray-500">
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  )
}

type FilterType = 'todos' | 'hoje' | '7dias' | 'vencidos'

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

export function PlanoPageClient({ acoes }: { acoes: Acao[] }) {
  const [view, setView] = useState<'lista' | 'kanban'>('kanban')
  const [filter, setFilter] = useState<FilterType>('todos')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [globalDraggingId, setGlobalDraggingId] = useState<string | null>(null)
  const [dragOverPrazo, setDragOverPrazo] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('plano-view') as 'lista' | 'kanban' | null
    if (saved) setView(saved)
  }, [])

  function changeView(v: 'lista' | 'kanban') {
    setView(v)
    localStorage.setItem('plano-view', v)
  }

  function filterAcoes(lista: Acao[]) {
    let result = lista
    if (statusFilter !== 'todos') result = result.filter((a) => (a.status ?? 'A INICIAR') === statusFilter)
    if (filter === 'todos') return result
    const hojeDate = new Date(); hojeDate.setHours(0, 0, 0, 0)
    if (filter === 'hoje') return result.filter((a) => a.dataLimite && differenceInDays(parseISO(a.dataLimite), hojeDate) === 0)
    if (filter === 'vencidos') return result.filter((a) => a.dataLimite && differenceInDays(parseISO(a.dataLimite), hojeDate) < 0 && a.status !== 'CONCLUIDO')
    if (filter === '7dias') return result.filter((a) => { if (!a.dataLimite) return false; const d = differenceInDays(parseISO(a.dataLimite), hojeDate); return d >= 0 && d <= 7 })
    return result
  }

  function getDraggingPrazo() {
    if (!globalDraggingId) return null
    return acoes.find((a) => a.id === globalDraggingId)?.prazo ?? null
  }

  async function handleCrossGroupDrop(targetPrazo: string) {
    if (!globalDraggingId) return
    const sourcePrazo = getDraggingPrazo()
    setDragOverPrazo(null)
    if (!sourcePrazo || sourcePrazo === targetPrazo) { setGlobalDraggingId(null); return }
    await moverPrazoAcao(globalDraggingId, targetPrazo)
    setGlobalDraggingId(null)
    toast.success('Ação movida!')
  }

  const FILTER_LABELS: Record<FilterType, string> = {
    todos: 'Todas', hoje: 'Vence Hoje', '7dias': 'Próx. 7 dias', vencidos: 'Vencidas',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-[#1B4F8A]">Plano de Ação 5W2H</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro por status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border bg-white px-2 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
          >
            <option value="todos">Todos os status</option>
            <option value="A INICIAR">A Iniciar</option>
            <option value="EM ANDAMENTO">Em Andamento</option>
            <option value="EM REVISÃO">Em Revisão</option>
            <option value="EM APROVAÇÃO">Em Aprovação</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="BLOQUEADO">Bloqueado</option>
          </select>
          {/* Filtros por data */}
          <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
            {(['todos', 'hoje', '7dias', 'vencidos'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filter === f ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
            <button
              onClick={() => changeView('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${view === 'lista' ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutList className="h-4 w-4" /> Lista
            </button>
            <button
              onClick={() => changeView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-[#1B4F8A] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Kanban className="h-4 w-4" /> Kanban
            </button>
          </div>
        </div>
      </div>

      {GRUPOS_DEFAULT.map(({ prazo, label, border, bg }) => {
        const grupo = filterAcoes(acoes.filter((a) => a.prazo === prazo))
        const isCrossTarget = dragOverPrazo === prazo && getDraggingPrazo() !== prazo
        return (
          <div
            key={prazo}
            onDragOver={(e) => { e.preventDefault(); if (globalDraggingId && getDraggingPrazo() !== prazo) setDragOverPrazo(prazo) }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverPrazo(null) }}
            onDrop={() => handleCrossGroupDrop(prazo)}
            className={`rounded-xl transition-all ${isCrossTarget ? 'ring-2 ring-[#1B4F8A] ring-opacity-50' : ''}`}
          >
            <PlanoAcaoList
              prazo={prazo}
              labelNode={<GrupoLabel prazo={prazo} defaultLabel={label} />}
              border={border}
              bg={bg}
              acoes={grupo}
              view={view}
              onCardDragStart={setGlobalDraggingId}
              onCardDragEnd={() => setGlobalDraggingId(null)}
            />
          </div>
        )
      })}
    </div>
  )
}
