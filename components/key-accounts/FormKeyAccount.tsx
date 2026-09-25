'use client'

import { useRef, useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { salvarKeyAccount } from '@/app/(dashboard)/key-accounts/actions'

const SERVICOS = [
  'Consultoria', 'Treinamento', 'Auditoria', 'Inspeção', 'Laudos', 'Calibração',
  'NR-12', 'NR-13', 'PPRA', 'PCMSO', 'LTCAT', 'PGR', 'PCMAT',
]

const STATUS_OPTS = ['Em Desenvolvimento', 'Ativa', 'Inativa']
const PRIORIDADE_OPTS = [
  { v: 'BAIXA', l: 'Baixa' }, { v: 'MEDIA', l: 'Média' },
  { v: 'ALTA', l: 'Alta' }, { v: 'CRITICA', l: 'Crítica' },
]
const SEGMENTOS = [
  'Indústria', 'Construção Civil', 'Mineração', 'Petróleo & Gás',
  'Alimentos & Bebidas', 'Logística', 'Saúde', 'Educação', 'Outro',
]

interface Props {
  open: boolean
  onClose: () => void
  conta?: {
    id: string
    nome: string
    cnpj?: string | null
    segmento?: string | null
    cidade?: string | null
    estado?: string | null
    site?: string | null
    observacoes?: string | null
    status: string
    potencialEstimado?: string | null
    servicosContratados?: string[] | null
    servicosPotencial?: string[] | null
  }
}

export function FormKeyAccount({ open, onClose, conta }: Props) {
  const ref = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(ref.current!)
    startTransition(async () => {
      const res = await salvarKeyAccount(fd)
      if (res.success) {
        onClose()
      } else {
        setErro('Erro ao salvar. Tente novamente.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{conta ? 'Editar Conta' : 'Nova Key Account'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>

        <form ref={ref} onSubmit={handleSubmit} className="p-5 space-y-4">
          {conta && <input type="hidden" name="id" value={conta.id} />}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome da empresa *</label>
              <input required name="nome" defaultValue={conta?.nome} placeholder="Ex: Empresa XYZ"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select name="status" defaultValue={conta?.status ?? 'Em Desenvolvimento'}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prioridade</label>
              <select name="prioridade" defaultValue={(conta as { prioridade?: string })?.prioridade ?? 'MEDIA'}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                {PRIORIDADE_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label>
              <select name="segmento" defaultValue={conta?.segmento ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                <option value="">Selecione…</option>
                {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
              <input name="cidade" defaultValue={conta?.cidade ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <input name="estado" defaultValue={conta?.estado ?? ''} maxLength={2} placeholder="SP"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] uppercase" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ</label>
              <input name="cnpj" defaultValue={conta?.cnpj ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Potencial estimado (R$)</label>
              <input name="potencialEstimado" type="number" min="0" step="1000"
                defaultValue={conta?.potencialEstimado ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Site</label>
              <input name="site" type="url" defaultValue={conta?.site ?? ''} placeholder="https://"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>
          </div>

          {/* Serviços */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">Serviços contratados</p>
            <div className="flex flex-wrap gap-1.5">
              {SERVICOS.map(s => {
                const checked = conta?.servicosContratados?.includes(s)
                return (
                  <label key={s} className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" name="servicosContratados" value={s} defaultChecked={checked}
                      className="h-3 w-3 accent-[#1B4F8A]" />
                    <span className="text-xs text-gray-600">{s}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">Serviços com potencial</p>
            <div className="flex flex-wrap gap-1.5">
              {SERVICOS.map(s => {
                const checked = conta?.servicosPotencial?.includes(s)
                return (
                  <label key={s} className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" name="servicosPotencial" value={s} defaultChecked={checked}
                      className="h-3 w-3 accent-[#4A90D9]" />
                    <span className="text-xs text-gray-600">{s}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
            <textarea name="observacoes" rows={2} defaultValue={conta?.observacoes ?? ''}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
          </div>

          {erro && <p className="text-xs text-red-500">{erro}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
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
