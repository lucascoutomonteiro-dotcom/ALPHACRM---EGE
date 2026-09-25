'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { salvarContato, deletarContato } from '@/app/(dashboard)/crm/actions'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { CANAIS, ORIGENS, SERVICOS_PORTFOLIO, TIPOS_CLIENTE } from '@/lib/constants'

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
  historico: string | null
  segmento: string | null
  valorEstimado: string | null
  probabilidade: number | null
}

interface FormContatoProps {
  open: boolean
  onClose: () => void
  contato?: Contato | null
}

export function FormContato({ open, onClose, contato, statusOpcoes }: FormContatoProps & { statusOpcoes?: string[] }) {
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [status, setStatus] = useState(contato?.status ?? 'Nunca Contatado')
  const [canal, setCanal] = useState(contato?.canal ?? '')
  const [origem, setOrigem] = useState(contato?.origem ?? '')
  const [tipoCliente, setTipoCliente] = useState((contato as { tipoCliente?: string } | null | undefined)?.tipoCliente ?? '')
  const handleTipoCliente = (v: string | null) => { setTipoCliente(v ?? '') }
  const [gerouOportunidade, setGerouOportunidade] = useState((contato as { gerouOportunidade?: boolean } | null | undefined)?.gerouOportunidade ?? false)
  const [servicoOportunidade, setServico] = useState((contato as { servicoOportunidade?: string } | null | undefined)?.servicoOportunidade ?? '')
  const handleServico = (v: string | null) => { if (v) setServico(v) }

  const handleStatus = (v: string | null) => { if (v) setStatus(v) }
  const handleCanal = (v: string | null) => { if (v) setCanal(v) }
  const handleOrigem = (v: string | null) => { if (v) setOrigem(v) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('status', status)
    fd.set('canal', canal)
    fd.set('origem', origem)
    fd.set('tipoCliente', tipoCliente)
    fd.set('gerouOportunidade', String(gerouOportunidade))
    fd.set('servicoOportunidade', servicoOportunidade)
    const result = await salvarContato(fd)
    setLoading(false)
    if (result.success) {
      toast.success(contato ? 'Contato atualizado!' : 'Contato criado!')
      onClose()
    } else {
      toast.error('Erro ao salvar contato.')
    }
  }

  async function handleDelete() {
    if (!contato?.id) return
    setLoading(true)
    await deletarContato(contato.id)
    toast.success('Contato excluído.')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contato ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={contato?.id ?? ''} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input name="nome" defaultValue={contato?.nome ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>Empresa</Label>
              <Input name="empresa" defaultValue={contato?.empresa ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>Cargo</Label>
              <Input name="cargo" defaultValue={contato?.cargo ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>Cidade</Label>
              <Input name="cidade" defaultValue={contato?.cidade ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input name="telefone" defaultValue={contato?.telefone ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input name="email" defaultValue={contato?.email ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={handleStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(statusOpcoes ?? ['Nunca Contatado','1o Contato Feito','Follow-up Agendado','Elaborar Proposta','Proposta Enviada','Reunião/Visita','Demanda Lucas','Fechado Ganho','Fechado Perdido','Inativo']).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Canal</Label>
              <Select value={canal} onValueChange={handleCanal}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Origem</Label>
              <Select value={origem} onValueChange={handleOrigem}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tipo de cliente</Label>
              <Select value={tipoCliente} onValueChange={handleTipoCliente}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {TIPOS_CLIENTE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Próximo Follow-up</Label>
              <Input type="date" name="proximaAtividade" defaultValue={contato?.proximaAtividade ?? ''} />
            </div>
            <div className="space-y-1">
              <Label>Valor Estimado (R$)</Label>
              <Input name="valorEstimado" defaultValue={contato?.valorEstimado ?? ''} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Probabilidade (%)</Label>
              <Input name="probabilidade" type="number" min="0" max="100" defaultValue={contato?.probabilidade ?? ''} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Histórico / Observações</Label>
            <Textarea name="historico" defaultValue={contato?.historico ?? ''} rows={3} />
          </div>

          {/* Oportunidade */}
          <div className="space-y-2 rounded-lg border border-dashed border-gray-200 p-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={gerouOportunidade}
                onChange={e => setGerouOportunidade(e.target.checked)}
                className="rounded border-gray-300 text-[#1B4F8A] focus:ring-[#1B4F8A]"
              />
              <span className="text-sm font-medium text-gray-700">Gerou oportunidade?</span>
            </label>
            {gerouOportunidade && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Serviço da oportunidade</Label>
                <Select value={servicoOportunidade} onValueChange={handleServico}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Selecionar serviço" /></SelectTrigger>
                  <SelectContent>
                    {SERVICOS_PORTFOLIO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            {contato?.id && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Confirmar exclusão?</span>
                  <Button type="button" size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>Sim, excluir</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Não</Button>
                </div>
              ) : (
                <Button type="button" size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
              )
            )}
            {!contato?.id && <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B4F8A] hover:bg-[#163f70]" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
