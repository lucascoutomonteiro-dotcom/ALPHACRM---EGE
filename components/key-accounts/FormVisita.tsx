'use client'

import { useRef, useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { salvarVisita } from '@/app/(dashboard)/key-accounts/actions'

const TIPOS = ['Visita Presencial', 'Reunião Online', 'Ligação', 'Evento', 'Workshop', 'Outro']
const NIVEL_AVANCO = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado – Ganho', 'Fechado – Perdido']
const PROGRESSO = [{ v: 'AVANCOU', l: '↑ Avançou' }, { v: 'MANTEVE', l: '→ Manteve' }, { v: 'RETROCEDEU', l: '↓ Retrocedeu' }]

interface Visita {
  id: string
  keyAccountId: string
  data: string
  tipo: string
  participantes?: string[] | null
  objetivo?: string | null
  resultado?: string | null
  proximosPassos?: string | null
  nivelAvanco?: string | null
  progressoNivel?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  keyAccountId: string
  visita?: Visita
  hoje: string
}

export function FormVisita({ open, onClose, keyAccountId, visita, hoje }: Props) {
  const ref = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [participantes, setParticipantes] = useState<string[]>(visita?.participantes ?? [''])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(ref.current!)
    // replace array field with current state
    fd.delete('participantes')
    participantes.filter(Boolean).forEach(p => fd.append('participantes', p))

    startTransition(async () => {
      const res = await salvarVisita(fd)
      if (res.success) onClose()
      else setErro('Erro ao salvar.')
    })
  }

  const addPart = () => setParticipantes(p => [...p, ''])
  const updatePart = (i: number, v: string) => setParticipantes(p => p.map((x, idx) => idx === i ? v : x))
  const removePart = (i: number) => setParticipantes(p => p.filter((_, idx) => idx !== i))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{visita ? 'Editar Registro' : 'Novo Registro'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>

        <form ref={ref} onSubmit={handleSubmit} className="p-5 space-y-4">
          {visita && <input type="hidden" name="id" value={visita.id} />}
          <input type="hidden" name="keyAccountId" value={keyAccountId} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
              <input required name="data" type="date" defaultValue={visita?.data ?? hoje}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
              <select required name="tipo" defaultValue={visita?.tipo ?? 'Visita Presencial'}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nível de avanço</label>
              <select name="nivelAvanco" defaultValue={visita?.nivelAvanco ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                <option value="">Não informado</option>
                {NIVEL_AVANCO.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Progresso da conta</label>
              <select name="progressoNivel" defaultValue={visita?.progressoNivel ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                <option value="">Não informado</option>
                {PROGRESSO.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo</label>
              <input name="objetivo" defaultValue={visita?.objetivo ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Resultado / O que aconteceu</label>
              <textarea name="resultado" rows={3} defaultValue={visita?.resultado ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Próximos passos</label>
              <textarea name="proximosPassos" rows={2} defaultValue={visita?.proximosPassos ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">Participantes</label>
                <button type="button" onClick={addPart} className="text-xs text-[#1B4F8A] hover:underline">+ Adicionar</button>
              </div>
              <div className="space-y-1.5">
                {participantes.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={p} onChange={e => updatePart(i, e.target.value)} placeholder="Nome do participante"
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
                    {participantes.length > 1 && (
                      <button type="button" onClick={() => removePart(i)} className="text-gray-300 hover:text-red-400">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {erro && <p className="text-xs text-red-500">{erro}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
            <button type="submit" disabled={pending}
              className="px-4 py-2 bg-[#1B4F8A] text-white text-sm rounded-lg hover:bg-[#163f70] disabled:opacity-50">
              {pending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
