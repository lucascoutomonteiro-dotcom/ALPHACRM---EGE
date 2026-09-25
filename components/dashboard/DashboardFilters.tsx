'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface DashboardFiltersProps {
  defaultMes: number
  defaultAno: number
}

export function DashboardFilters({ defaultMes, defaultAno }: DashboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const mesesParam = searchParams.get('meses')
  const anoParam = searchParams.get('ano')

  const [selectedMeses, setSelectedMeses] = useState<number[]>(
    mesesParam ? mesesParam.split(',').map(Number).filter((n) => n >= 1 && n <= 12) : [defaultMes]
  )
  const [ano, setAno] = useState(anoParam ? Number(anoParam) : defaultAno)

  function navigate(meses: number[], novoAno: number) {
    const params = new URLSearchParams()
    params.set('meses', meses.join(','))
    params.set('ano', String(novoAno))
    startTransition(() => router.push(`/?${params.toString()}`))
  }

  function toggleMes(m: number) {
    const next = selectedMeses.includes(m)
      ? selectedMeses.filter((x) => x !== m)
      : [...selectedMeses, m].sort((a, b) => a - b)
    if (next.length === 0) return
    setSelectedMeses(next)
    navigate(next, ano)
  }

  function changeAno(delta: number) {
    const novoAno = ano + delta
    setAno(novoAno)
    navigate(selectedMeses, novoAno)
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 bg-white rounded-xl border px-4 py-3 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => changeAno(-1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-[#1B4F8A] hover:bg-gray-100 rounded transition-colors text-base">‹</button>
        <span className="font-bold text-sm text-[#1B4F8A] w-12 text-center">{ano}</span>
        <button onClick={() => changeAno(1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-[#1B4F8A] hover:bg-gray-100 rounded transition-colors text-base">›</button>
      </div>
      <div className="flex flex-wrap gap-1">
        {MESES_LABEL.map((label, i) => {
          const m = i + 1
          const active = selectedMeses.includes(m)
          return (
            <button
              key={m}
              onClick={() => toggleMes(m)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                active
                  ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                  : 'text-gray-500 border-gray-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A]'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
      {selectedMeses.length > 1 && (
        <span className="text-xs text-gray-400 italic">Somando {selectedMeses.length} meses</span>
      )}
    </div>
  )
}
