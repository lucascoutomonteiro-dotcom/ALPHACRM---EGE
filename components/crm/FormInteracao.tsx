'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { registrarInteracao } from '@/app/(dashboard)/crm/actions'
import { toast } from 'sonner'
import { TIPOS_INTERACAO, SERVICOS_PORTFOLIO } from '@/lib/constants'

interface FormInteracaoProps {
  open: boolean
  onClose: () => void
  contatoId: string
  userId: string
}

export function FormInteracao({ open, onClose, contatoId, userId }: FormInteracaoProps) {
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState('')
  const [gerouOportunidade, setGerouOportunidade] = useState(false)
  const [servicoOportunidade, setServico] = useState('')
  const handleServico = (v: string | null) => { if (v) setServico(v) }
  const handleTipo = (v: string | null) => { if (v) setTipo(v) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('tipo', tipo)
    fd.set('contatoId', contatoId)
    fd.set('usuarioId', userId)
    fd.set('gerouOportunidade', String(gerouOportunidade))
    fd.set('servicoOportunidade', servicoOportunidade)
    const result = await registrarInteracao(fd)
    setLoading(false)
    if (result.success) {
      toast.success('Interação registrada!')
      onClose()
    } else {
      toast.error('Erro ao registrar.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Interação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={handleTipo}>
              <SelectTrigger><SelectValue placeholder="Selecionar tipo" /></SelectTrigger>
              <SelectContent>
                {TIPOS_INTERACAO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>O que foi discutido</Label>
            <Textarea name="descricao" rows={3} placeholder="Descreva a interação..." />
          </div>
          <div className="space-y-1">
            <Label>Próximo passo</Label>
            <Input name="proximoPasso" placeholder="Ex: Enviar proposta, ligar na sexta..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Data do próximo passo</Label>
              <Input type="date" name="dataProximoPasso" />
            </div>
            <div className="space-y-1">
              <Label>Atualizar follow-up para</Label>
              <Input type="date" name="proximaAtividade" />
            </div>
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-[#1B4F8A] hover:bg-[#163f70]" disabled={loading || !tipo}>
              {loading ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
