'use client'

import { useState } from 'react'
import { LayoutList, Kanban } from 'lucide-react'
import { OportunidadesBcKanban } from './OportunidadesBcKanban'

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

export function BcViewToggle({ lista, tableContent }: { lista: Oportunidade[]; tableContent: React.ReactNode }) {
  const [view, setView] = useState<'lista' | 'kanban'>('kanban')

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setView('lista')} className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${view === 'lista' ? 'bg-white shadow-sm text-[#1B4F8A]' : 'text-gray-500 hover:text-gray-700'}`}>
            <LayoutList className="h-3.5 w-3.5" /> Lista
          </button>
          <button onClick={() => setView('kanban')} className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-[#1B4F8A]' : 'text-gray-500 hover:text-gray-700'}`}>
            <Kanban className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>
      </div>
      {view === 'lista' ? tableContent : <OportunidadesBcKanban lista={lista} />}
    </div>
  )
}
