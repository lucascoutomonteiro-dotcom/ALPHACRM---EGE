'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, Clock } from 'lucide-react'

interface FollowupItemProps {
  id: string
  nome: string | null
  empresa: string | null
  telefone?: string | null
  email?: string | null
  status?: string | null
  historico?: string | null
  proximaAtividade?: string | null
  ultimaInteracao?: string | null
  fonte?: 'crm' | 'ege'
}

const STATUS_CORES: Record<string, string> = {
  'Em Andamento': 'bg-orange-100 text-orange-700',
  'Proposta Enviada': 'bg-blue-100 text-blue-700',
  'Follow-up Agendado': 'bg-yellow-100 text-yellow-700',
  'Reunião/Visita': 'bg-green-100 text-green-700',
  'Elaborar Proposta': 'bg-purple-100 text-purple-700',
}

export function FollowupItem({ id, nome, empresa, telefone, email, status, historico, proximaAtividade, ultimaInteracao, fonte = 'crm' }: FollowupItemProps) {
  const [open, setOpen] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleMouseEnter() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setOpen(true)
  }

  function handleMouseLeave() {
    hideTimer.current = setTimeout(() => setOpen(false), 200)
  }

  return (
    <li className="relative">
      <div
        className="flex items-center justify-between text-sm py-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-1.5 truncate max-w-[60%]">
          {fonte === 'ege' && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#1B4F8A] text-white tracking-wide">EGE</span>
          )}
          <Link href={fonte === 'ege' ? `/oportunidades?cliente=${id}` : `/crm/${id}`} className="text-[#1B4F8A] hover:underline font-medium truncate">
            {nome || '—'}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {proximaAtividade && (
            <span className="text-xs text-gray-400">{new Date(proximaAtividade + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
          )}
          <span className="text-gray-400 text-xs truncate max-w-[100px]">{empresa}</span>
        </div>
      </div>

      {open && (
        <div
          className="absolute z-50 left-0 top-full mt-1 bg-white border rounded-xl shadow-lg p-3 w-80 text-xs space-y-2 max-h-96 overflow-y-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="font-semibold text-sm text-[#1B4F8A]">{nome}</div>
          {empresa && <div className="text-gray-600">{empresa}</div>}
          {status && (
            <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>
          )}
          <div className="space-y-1 border-t pt-2">
            {telefone && (
              <a href={`tel:${telefone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-[#1B4F8A]">
                <Phone className="h-3 w-3 text-gray-400" /> {telefone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-gray-600 hover:text-[#1B4F8A]">
                <Mail className="h-3 w-3 text-gray-400" /> {email}
              </a>
            )}
          </div>
          {ultimaInteracao && (
            <div className="border-t pt-2">
              <div className="flex items-center gap-1 text-gray-400 mb-1"><Clock className="h-3 w-3" /> Última interação</div>
              <p className="text-gray-600 whitespace-pre-wrap">{ultimaInteracao}</p>
            </div>
          )}
          {!ultimaInteracao && historico && (
            <div className="border-t pt-2">
              <div className="flex items-center gap-1 text-gray-400 mb-1"><Clock className="h-3 w-3" /> Último histórico</div>
              <p className="text-gray-600 whitespace-pre-wrap">{historico}</p>
            </div>
          )}
          <Link href={fonte === 'ege' ? `/oportunidades?cliente=${id}` : `/crm/${id}`} className="block text-center text-xs text-[#1B4F8A] hover:underline border-t pt-2 font-medium">
            {fonte === 'ege' ? 'Ver em Oportunidades →' : 'Ver ficha completa →'}
          </Link>
        </div>
      )}
    </li>
  )
}
