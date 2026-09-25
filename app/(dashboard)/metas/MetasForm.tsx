'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { salvarMeta } from './actions'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Meta {
  id?: string
  mes: number
  ano: number
  metaEbitda: string | null
  faturamentoNecessario: string | null
  pipelineNecessario: string | null
  metaPropostas: number | null
  metaPropostasValor: string | null
  metaProspeccoes: number | null
  metaReunioes: number | null
  metaContratos: number | null
  realizadoVendas: string | null
  realizadoEbitda: string | null
  realizadoPipeline: string | null
  realizadoPipelineQtd: number | null
  realizadoPropostas: number | null
  realizadoPropostasValor: string | null
  realizadoProspeccoes: number | null
  realizadoReunioes: number | null
  contratosFechados: number | null
}

interface MetasFormProps {
  meta: Meta | null
  selectedMes: number
  selectedAno: number
  role: string
  reunioesAutomaticas?: number
}

const MESES_NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// Formata valor do banco ("31089900.00") como "31.089.900,00" para exibir no input
function fmtMoeda(v: string | null): string {
  if (!v) return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtInt(v: number | null | undefined): string {
  if (v == null) return ''
  return String(v)
}

export function MetasForm({ meta, selectedMes, selectedAno, role, reunioesAutomaticas = 0 }: MetasFormProps) {
  const [tab, setTab] = useState<'metas' | 'realizado'>('metas')
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isAdmin = role === 'admin'

  function navegarMes(delta: number) {
    let mes = selectedMes + delta
    let ano = selectedAno
    if (mes < 1) { mes = 12; ano-- }
    if (mes > 12) { mes = 1; ano++ }
    startTransition(() => {
      router.push(`/metas?mes=${mes}&ano=${ano}`)
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    // Garante que mes/ano do formulário são do mês selecionado
    fd.set('mes', String(selectedMes))
    fd.set('ano', String(selectedAno))
    fd.set('tab', tab)
    const result = await salvarMeta(fd)
    setLoading(false)
    if (result.success) {
      toast.success('Salvo com sucesso!')
      router.refresh()
    } else {
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        {/* Navegação de mês */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navegarMes(-1)}
            disabled={isPending}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h2 className="font-semibold text-base min-w-[160px] text-center">
            {MESES_NOMES[selectedMes - 1]} de {selectedAno}
          </h2>
          <button
            type="button"
            onClick={() => navegarMes(+1)}
            disabled={isPending}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs Metas / Realizado */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setTab('metas')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${tab === 'metas' ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Metas
          </button>
          <button
            type="button"
            onClick={() => setTab('realizado')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${tab === 'realizado' ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Realizado
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="mes" value={selectedMes} />
        <input type="hidden" name="ano" value={selectedAno} />
        <input type="hidden" name="id" value={meta?.id ?? ''} />

        {tab === 'metas' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {isAdmin ? (
              <>
                <div className="space-y-1">
                  <Label>Faturamento Necessário (R$)</Label>
                  <Input name="faturamentoNecessario" defaultValue={fmtMoeda(meta?.faturamentoNecessario ?? null)} placeholder="350.000,00" />
                </div>
                <div className="space-y-1">
                  <Label>Meta EBITDA (R$)</Label>
                  <Input name="metaEbitda" defaultValue={fmtMoeda(meta?.metaEbitda ?? null)} placeholder="100.000,00" />
                </div>
                <div className="space-y-1">
                  <Label>Pipeline Necessário (R$)</Label>
                  <Input name="pipelineNecessario" defaultValue={fmtMoeda(meta?.pipelineNecessario ?? null)} placeholder="1.200.000,00" />
                </div>
                <div className="space-y-1">
                  <Label>Meta Propostas (qtd)</Label>
                  <Input name="metaPropostas" defaultValue={fmtInt(meta?.metaPropostas)} placeholder="5" />
                </div>
                <div className="space-y-1">
                  <Label>Meta Propostas (R$)</Label>
                  <Input name="metaPropostasValor" defaultValue={fmtMoeda(meta?.metaPropostasValor ?? null)} placeholder="500.000,00" />
                </div>
                <div className="space-y-1">
                  <Label>Meta Prospecções</Label>
                  <Input name="metaProspeccoes" defaultValue={fmtInt(meta?.metaProspeccoes)} placeholder="50" />
                </div>
                <div className="space-y-1">
                  <Label>Meta Reuniões/Visitas</Label>
                  <Input name="metaReunioes" defaultValue={fmtInt(meta?.metaReunioes)} placeholder="10" />
                </div>
                <div className="space-y-1">
                  <Label>Meta Contratos (qtd)</Label>
                  <Input name="metaContratos" defaultValue={fmtInt(meta?.metaContratos)} placeholder="3" />
                </div>
              </>
            ) : (
              <p className="col-span-3 text-sm text-gray-400">Apenas administradores podem editar as metas.</p>
            )}
          </div>
        )}

        {tab === 'realizado' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Vendas Realizadas (R$)</Label>
              <Input name="realizadoVendas" defaultValue={fmtMoeda(meta?.realizadoVendas ?? null)} placeholder="0,00" />
            </div>
            <div className="space-y-1">
              <Label>Contratos Fechados (qtd)</Label>
              <Input name="contratosFechados" defaultValue={fmtInt(meta?.contratosFechados)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>EBITDA Realizado (R$)</Label>
              <Input name="realizadoEbitda" defaultValue={fmtMoeda(meta?.realizadoEbitda ?? null)} placeholder="0,00" />
            </div>
            <div className="space-y-1">
              <Label>Pipeline Realizado (R$)</Label>
              <Input name="realizadoPipeline" defaultValue={fmtMoeda(meta?.realizadoPipeline ?? null)} placeholder="0,00" />
            </div>
            <div className="space-y-1">
              <Label>Pipeline Quente (qtd)</Label>
              <Input name="realizadoPipelineQtd" defaultValue={fmtInt(meta?.realizadoPipelineQtd)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Propostas Enviadas (R$)</Label>
              <Input name="realizadoPropostasValor" defaultValue={fmtMoeda(meta?.realizadoPropostasValor ?? null)} placeholder="0,00" />
            </div>
            <div className="space-y-1">
              <Label>Propostas Enviadas (qtd)</Label>
              <Input name="realizadoPropostas" defaultValue={fmtInt(meta?.realizadoPropostas)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Prospecções Realizadas</Label>
              <Input name="realizadoProspeccoes" defaultValue={fmtInt(meta?.realizadoProspeccoes)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                Reuniões/Visitas Realizadas
                {reunioesAutomaticas > 0 && (
                  <span className="text-xs font-normal text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {reunioesAutomaticas} no CRM
                  </span>
                )}
              </Label>
              <Input
                name="realizadoReunioes"
                defaultValue={fmtInt(meta?.realizadoReunioes ?? reunioesAutomaticas)}
                placeholder="0"
              />
            </div>
          </div>
        )}

        {(tab === 'realizado' || isAdmin) && (
          <div className="mt-4">
            <Button type="submit" className="bg-[#1B4F8A] hover:bg-[#163f70]" disabled={loading || isPending}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
