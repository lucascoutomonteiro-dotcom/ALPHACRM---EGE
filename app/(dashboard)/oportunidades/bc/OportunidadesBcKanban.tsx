'use client'

import { useState } from 'react'
import { atualizarOportunidadeBc, excluirOportunidadeBc } from '../actions'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

const STATUS_BC = ['A prospectar', 'Em contato', 'Proposta enviada', 'Convertido']

const STATUS_CORES: Record<string, { col: string; badge: string }> = {
  'A prospectar': { col: 'bg-gray-50',   badge: 'bg-gray-100 text-gray-700' },
  'Em contato':   { col: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700' },
  'Proposta enviada': { col: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' },
  'Convertido':   { col: 'bg-green-50',  badge: 'bg-green-100 text-green-700' },
}

const POTENCIAL_CORES: Record<string, string> = {
  URGENTE: 'bg-red-100 text-red-700 font-semibold',
  Alto:    'bg-orange-100 text-orange-700',
  Medio:   'bg-yellow-100 text-yellow-700',
  Baixo:   'bg-gray-100 text-gray-600',
}

interface Oportunidade {
  id: string
  cliente: string
  pilaresAtuais: string | null
  segmento: string | null
  ticketEstimado: string | null
  servicosPrioritarios: string[] | null
  potencialCross: string | null
  status: string | null
  observacoes: string | null
}

function fmtBRL(v: string | null) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v ?? 0))
}

export function OportunidadesBcKanban({ lista }: { lista: Oportunidade[] }) {
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deletandoIds, setDeletandoIds] = useState<string[]>([])

  function getStatus(o: Oportunidade) {
    return localStatus[o.id] ?? o.status ?? 'A prospectar'
  }

  async function handleDelete(id: string) {
    setDeletandoIds((prev) => [...prev, id])
    setConfirmDelete(null)
    await excluirOportunidadeBc(id)
    toast.success('Oportunidade excluída.')
  }

  async function handleDrop(targetStatus: string) {
    if (!draggingId) return
    const prev = getStatus(lista.find((o) => o.id === draggingId)!)
    if (prev === targetStatus) { setDraggingId(null); setDragOverStatus(null); return }
    setLocalStatus((s) => ({ ...s, [draggingId]: targetStatus }))
    setDraggingId(null)
    setDragOverStatus(null)
    await atualizarOportunidadeBc(draggingId, { status: targetStatus })
    toast.success('Status atualizado!')
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: STATUS_BC.length * 280 }}>
        {STATUS_BC.map((status) => {
          const grupo = lista.filter((o) => getStatus(o) === status)
          const cores = STATUS_CORES[status]
          const isDragOver = dragOverStatus === status
          return (
            <div
              key={status}
              className={`flex-shrink-0 w-64 rounded-xl p-3 space-y-2 transition-colors ${cores.col} ${isDragOver ? 'ring-2 ring-[#1B4F8A] ring-opacity-40' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status) }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={() => handleDrop(status)}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${cores.badge}`}>{status}</span>
                <span className="text-xs text-gray-400">{grupo.length}</span>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {grupo.map((o) => (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={() => setDraggingId(o.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverStatus(null) }}
                    className={`bg-white border rounded-lg p-3 shadow-sm space-y-2 cursor-grab active:cursor-grabbing hover:border-[#1B4F8A] transition-colors ${draggingId === o.id ? 'opacity-40' : ''} ${deletandoIds.includes(o.id) ? 'hidden' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-sm leading-snug">{o.cliente}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {o.potencialCross && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${POTENCIAL_CORES[o.potencialCross] ?? 'bg-gray-100 text-gray-600'}`}>{o.potencialCross}</span>
                        )}
                        {confirmDelete === o.id ? (
                          <>
                            <button onClick={() => handleDelete(o.id)} className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200 text-xs font-semibold">Sim</button>
                            <button onClick={() => setConfirmDelete(null)} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs">Não</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(o.id)} className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500" title="Excluir">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {o.segmento && <p className="text-xs text-gray-500">{o.segmento}</p>}
                    {o.ticketEstimado && Number(o.ticketEstimado) > 0 && (
                      <p className="text-xs font-medium text-[#1B4F8A]">{fmtBRL(o.ticketEstimado)}</p>
                    )}
                    {o.servicosPrioritarios && o.servicosPrioritarios.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {o.servicosPrioritarios.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                        {o.servicosPrioritarios.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{o.servicosPrioritarios.length - 3}</span>
                        )}
                      </div>
                    )}
                    {o.pilaresAtuais && (
                      <p className="text-[10px] text-gray-400">Pilares: {o.pilaresAtuais}</p>
                    )}
                  </div>
                ))}
                {grupo.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">Solte aqui</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
