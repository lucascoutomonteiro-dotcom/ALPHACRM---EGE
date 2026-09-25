'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { atualizarOportunidadeBc } from '../actions'
import { toast } from 'sonner'

const STATUS_BC = ['A prospectar', 'Em contato', 'Proposta enviada', 'Convertido']
const POTENCIAL_CORES: Record<string, string> = {
  URGENTE: 'bg-red-100 text-red-700 font-semibold',
  Alto: 'bg-orange-100 text-orange-700',
  Medio: 'bg-yellow-100 text-yellow-700',
  Baixo: 'bg-gray-100 text-gray-600',
}

interface OportunidadeBcRowProps {
  oportunidade: {
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
}

export function OportunidadeBcRow({ oportunidade: o }: OportunidadeBcRowProps) {
  const [status, setStatus] = useState(o.status ?? 'A prospectar')

  async function handleStatus(val: string | null) {
    if (!val) return
    setStatus(val)
    await atualizarOportunidadeBc(o.id, { status: val })
    toast.success('Status atualizado!')
  }

  const fmtBRL = (v: string | null) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v ?? 0))

  const potClass = o.potencialCross ? POTENCIAL_CORES[o.potencialCross] ?? '' : ''

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">{o.cliente}</td>
      <td className="px-4 py-3 text-gray-500">{o.pilaresAtuais}</td>
      <td className="px-4 py-3 text-gray-500 text-xs">{o.segmento}</td>
      <td className="px-4 py-3 text-right">{fmtBRL(o.ticketEstimado)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {(o.servicosPrioritarios ?? []).map((s) => (
            <span key={s} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s}</span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${potClass}`}>{o.potencialCross}</span>
      </td>
      <td className="px-4 py-3 w-40">
        <Select value={status} onValueChange={handleStatus}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_BC.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
    </tr>
  )
}
