'use client'

import { useRef, useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { salvarStakeholder } from '@/app/(dashboard)/key-accounts/actions'

const NIVEL_PODER = [
  { v: 'DECISOR_FINAL', l: 'Decisor Final' },
  { v: 'INFLUENCIADOR_TECNICO', l: 'Influenciador Técnico' },
  { v: 'COMPRADOR', l: 'Comprador' },
  { v: 'USUARIO_FINAL', l: 'Usuário Final' },
]
const POSICIONAMENTO = [
  { v: 'PROMOTOR', l: 'Promotor' }, { v: 'NEUTRO', l: 'Neutro' },
  { v: 'DETRATOR', l: 'Detrator' }, { v: 'BLOQUEADOR', l: 'Bloqueador' },
]
const NIVEL_REL = [
  { v: 'FRIO', l: 'Frio' }, { v: 'MORNO', l: 'Morno' },
  { v: 'QUENTE', l: 'Quente' }, { v: 'ESTRATEGICO', l: 'Estratégico' },
]
const DEPARTAMENTOS = [
  { v: 'MANUTENCAO', l: 'Manutenção' }, { v: 'ENGENHARIA', l: 'Engenharia' },
  { v: 'COMPRAS', l: 'Compras' }, { v: 'DIRETORIA', l: 'Diretoria' },
  { v: 'SEGURANCA', l: 'Segurança' }, { v: 'TI', l: 'TI' },
  { v: 'FINANCEIRO', l: 'Financeiro' }, { v: 'OPERACOES', l: 'Operações' }, { v: 'OUTRO', l: 'Outro' },
]

interface Stakeholder {
  id: string
  keyAccountId: string
  nome: string
  cargo?: string | null
  departamento?: string | null
  email?: string | null
  telefone?: string | null
  linkedin?: string | null
  nivelPoder: string
  posicionamento: string
  nivelRelacionamento?: string | null
  qualificacaoStatus?: string | null
  ultimaInteracao?: string | null
  proximaAcao?: string | null
  observacoes?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  keyAccountId: string
  stakeholder?: Stakeholder
}

export function FormStakeholder({ open, onClose, keyAccountId, stakeholder }: Props) {
  const ref = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(ref.current!)
    startTransition(async () => {
      const res = await salvarStakeholder(fd)
      if (res.success) onClose()
      else setErro('Erro ao salvar.')
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{stakeholder ? 'Editar Stakeholder' : 'Novo Stakeholder'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>

        <form ref={ref} onSubmit={handleSubmit} className="p-5 space-y-4">
          {stakeholder && <input type="hidden" name="id" value={stakeholder.id} />}
          <input type="hidden" name="keyAccountId" value={keyAccountId} />

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input required name="nome" defaultValue={stakeholder?.nome}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
              <input name="cargo" defaultValue={stakeholder?.cargo ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
              <select name="departamento" defaultValue={stakeholder?.departamento ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                <option value="">Não informado</option>
                {DEPARTAMENTOS.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input name="email" type="email" defaultValue={stakeholder?.email ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input name="telefone" defaultValue={stakeholder?.telefone ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn</label>
              <input name="linkedin" defaultValue={stakeholder?.linkedin ?? ''} placeholder="https://linkedin.com/in/..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nível de poder *</label>
              <select required name="nivelPoder" defaultValue={stakeholder?.nivelPoder ?? 'INFLUENCIADOR_TECNICO'}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                {NIVEL_PODER.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Posicionamento *</label>
              <select required name="posicionamento" defaultValue={stakeholder?.posicionamento ?? 'NEUTRO'}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                {POSICIONAMENTO.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nível de relacionamento</label>
              <select name="nivelRelacionamento" defaultValue={stakeholder?.nivelRelacionamento ?? 'FRIO'}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                {NIVEL_REL.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Qualificação</label>
              <select name="qualificacaoStatus" defaultValue={stakeholder?.qualificacaoStatus ?? 'QUALIFICADO'}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]">
                <option value="QUALIFICADO">Qualificado</option>
                <option value="PENDENTE">Pendente (informações incompletas)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Última interação</label>
              <input name="ultimaInteracao" type="date" defaultValue={stakeholder?.ultimaInteracao ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Próxima ação</label>
              <input name="proximaAcao" defaultValue={stakeholder?.proximaAcao ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <textarea name="observacoes" rows={2} defaultValue={stakeholder?.observacoes ?? ''}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
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
