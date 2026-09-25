'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Edit, Trash2, Plus, ExternalLink, Mail, Phone,
  Link2, AlertTriangle, Activity, Target, Shield, TrendingUp,
  CheckCircle, Clock, Users
} from 'lucide-react'
import {
  excluirKeyAccount, excluirStakeholder, excluirVisita,
  salvarPlanoAcao, salvarProximaAcao, salvarPenetracao
} from '@/app/(dashboard)/key-accounts/actions'
import { FormKeyAccount } from './FormKeyAccount'
import { FormStakeholder } from './FormStakeholder'
import { FormVisita } from './FormVisita'
import { calcularHealthScore, calcularCompletude } from '@/lib/ka-health'

const TABS = [
  { id: 'visao', label: 'Visão Geral' },
  { id: 'stakeholders', label: 'Stakeholders' },
  { id: 'visitas', label: 'Histórico' },
  { id: 'estrategia', label: 'Estratégia' },
  { id: 'penetracao', label: 'Cobertura' },
]

const PODER_LABEL: Record<string, string> = {
  DECISOR_FINAL: 'Decisor Final',
  INFLUENCIADOR_TECNICO: 'Influenciador Técnico',
  COMPRADOR: 'Comprador',
  USUARIO_FINAL: 'Usuário Final',
}
const PODER_COR: Record<string, string> = {
  DECISOR_FINAL: 'bg-red-100 text-red-700',
  INFLUENCIADOR_TECNICO: 'bg-blue-100 text-blue-700',
  COMPRADOR: 'bg-purple-100 text-purple-700',
  USUARIO_FINAL: 'bg-gray-100 text-gray-600',
  // legado
  'Alto': 'bg-red-100 text-red-700',
  'Médio': 'bg-yellow-100 text-yellow-700',
  'Baixo': 'bg-gray-100 text-gray-600',
}
const POSIC_LABEL: Record<string, string> = {
  PROMOTOR: 'Promotor', NEUTRO: 'Neutro',
  DETRATOR: 'Detrator', BLOQUEADOR: 'Bloqueador',
  'Favorável': 'Favorável', 'Neutro': 'Neutro',
  'Desfavorável': 'Desfavorável',
}
const POSIC_COR: Record<string, string> = {
  PROMOTOR: 'bg-emerald-100 text-emerald-700',
  'Favorável': 'bg-emerald-100 text-emerald-700',
  NEUTRO: 'bg-gray-100 text-gray-600', 'Neutro': 'bg-gray-100 text-gray-600',
  DETRATOR: 'bg-orange-100 text-orange-700', 'Desfavorável': 'bg-orange-100 text-orange-700',
  BLOQUEADOR: 'bg-red-100 text-red-700',
}
const REL_COR: Record<string, string> = {
  ESTRATEGICO: 'text-emerald-600 font-semibold', QUENTE: 'text-blue-600',
  MORNO: 'text-yellow-600', FRIO: 'text-gray-400',
  'Forte': 'text-emerald-600 font-semibold', 'Médio': 'text-yellow-600',
  'Fraco': 'text-gray-400', 'Novo': 'text-gray-400',
}
const AVANCO_COR: Record<string, string> = {
  'Prospecção': 'bg-gray-100 text-gray-600', 'Qualificação': 'bg-blue-100 text-blue-700',
  'Proposta': 'bg-purple-100 text-purple-700', 'Negociação': 'bg-yellow-100 text-yellow-700',
  'Fechado – Ganho': 'bg-emerald-100 text-emerald-700', 'Fechado – Perdido': 'bg-red-100 text-red-700',
}
const PROGRESSO_COR: Record<string, string> = {
  AVANCOU: 'text-emerald-600', MANTEVE: 'text-gray-500', RETROCEDEU: 'text-red-500',
}
const PROGRESSO_ICON: Record<string, string> = {
  AVANCOU: '↑', MANTEVE: '→', RETROCEDEU: '↓',
}

const DEPARTAMENTOS = ['Manutenção', 'Engenharia', 'Compras', 'Diretoria', 'Segurança', 'TI', 'Financeiro', 'Operações']

type KAConta = {
  id: string; nome: string; cnpj?: string | null; segmento?: string | null
  cidade?: string | null; estado?: string | null; site?: string | null
  observacoes?: string | null; status: string; prioridade: string
  potencialEstimado?: string | null; receitaAnual?: string | null
  healthScore?: number | null; healthStatus?: string | null
  servicosContratados?: string[] | null; servicosPotencial?: string[] | null
  plano30d?: string | null; plano90d?: string | null
  barreiras?: string | null; estrategia?: string | null
  estrategiaExpansao?: string | null
  proximaAcao?: string | null; proximaAcaoData?: string | null
  proximaAcaoResponsavel?: string | null
  planoAtualizadoEm?: Date | null; updatedAt?: Date | null
}
type KAStakeholder = {
  id: string; keyAccountId: string; nome: string; cargo?: string | null
  departamento?: string | null; email?: string | null; telefone?: string | null
  linkedin?: string | null; nivelPoder: string; posicionamento: string
  nivelRelacionamento?: string | null; qualificacaoStatus: string
  ultimaInteracao?: string | null; proximaAcao?: string | null; observacoes?: string | null
}
type KAVisita = {
  id: string; keyAccountId: string; data: string; tipo: string
  participantes?: string[] | null; objetivo?: string | null
  resultado?: string | null; proximosPassos?: string | null
  nivelAvanco?: string | null; progressoNivel?: string | null
}
type KAPenetracao = {
  id: string; keyAccountId: string; departamento: string
  status: string; responsavel?: string | null; prazo?: string | null
}

interface Props {
  conta: KAConta
  stakeholders: KAStakeholder[]
  visitas: KAVisita[]
  penetracao: KAPenetracao[]
  tabInicial: string
}

export function KADetail({ conta, stakeholders, visitas, penetracao, tabInicial }: Props) {
  const [tab, setTab] = useState(tabInicial)
  const [editConta, setEditConta] = useState(false)
  const [editSt, setEditSt] = useState<KAStakeholder | null>(null)
  const [newSt, setNewSt] = useState(false)
  const [editVis, setEditVis] = useState<KAVisita | null>(null)
  const [newVis, setNewVis] = useState(false)
  const [pending, startPending] = useTransition()

  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())

  // Recalcular health no cliente para exibição imediata
  const [ultimaVisita] = visitas.slice(0, 1)
  const healthResult = calcularHealthScore({
    stakeholders: stakeholders.map(s => ({
      nivelPoder: s.nivelPoder,
      posicionamento: s.posicionamento,
      nivelRelacionamento: s.nivelRelacionamento ?? null,
      qualificacaoStatus: s.qualificacaoStatus ?? 'PENDENTE',
      departamento: s.departamento ?? null,
    })),
    ultimaVisita: ultimaVisita?.data ?? null,
    totalVisitas: visitas.length,
    temProximaAcao: !!conta.proximaAcao,
    temOportunidadesAbertas: false,
    temServicosPotencial: (conta.servicosPotencial?.length ?? 0) > 0,
  })
  const completude = calcularCompletude(conta, stakeholders, visitas)

  const fmtData = (d: string | null | undefined) => {
    if (!d) return '—'
    const [y, m, dd] = d.slice(0, 10).split('-')
    return `${dd}/${m}/${y}`
  }
  const fmtBRL = (v: string | null | undefined) => {
    if (!v || Number(v) === 0) return null
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))
  }

  const handleDeleteConta = () => {
    if (!confirm(`Arquivar "${conta.nome}"? A conta será ocultada mas não excluída.`)) return
    startPending(async () => { await excluirKeyAccount(conta.id) })
  }

  const scoreColor = healthResult.score >= 80 ? 'text-emerald-600' : healthResult.score >= 60 ? 'text-yellow-600' : 'text-red-600'
  const scoreBarColor = healthResult.score >= 80 ? 'bg-emerald-500' : healthResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/key-accounts" className="mt-0.5 text-gray-400 hover:text-[#1B4F8A] shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[#1B4F8A] truncate">{conta.nome}</h1>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              conta.status === 'Ativa' ? 'bg-emerald-100 text-emerald-700'
              : conta.status === 'Em Desenvolvimento' ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-500'}`}>
              {conta.status}
            </span>
            {conta.prioridade === 'CRITICA' && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">CRÍTICA</span>}
            {conta.prioridade === 'ALTA' && <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">ALTA</span>}
          </div>
          {conta.segmento && (
            <p className="text-sm text-gray-400 mt-0.5">
              {conta.segmento}{conta.cidade ? ` · ${conta.cidade}/${conta.estado ?? ''}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditConta(true)} className="p-1.5 rounded text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={handleDeleteConta} disabled={pending}
            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Health Score + Completude */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
          <div className="text-center">
            <p className={`text-4xl font-bold tabular-nums ${scoreColor}`}>{healthResult.score}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Health Score</p>
          </div>
          <div className="flex-1 space-y-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${scoreBarColor}`} style={{ width: `${healthResult.score}%` }} />
            </div>
            <p className={`text-xs font-semibold ${scoreColor}`}>
              {healthResult.status === 'SAUDAVEL' ? '🟢 Saudável' : healthResult.status === 'ATENCAO' ? '🟡 Atenção' : '🔴 Crítica'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">Completude da conta</p>
            <p className="text-sm font-bold text-[#1B4F8A]">{completude}%</p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#4A90D9] rounded-full" style={{ width: `${completude}%` }} />
          </div>
          {completude < 100 && (
            <p className="text-[10px] text-gray-400 mt-1.5">Continue preenchendo para melhorar o score</p>
          )}
        </div>

        <div className="bg-white rounded-xl border p-4">
          {conta.proximaAcao ? (
            <>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Próxima Ação</p>
              <p className="text-sm font-medium text-gray-800 leading-snug">{conta.proximaAcao}</p>
              {conta.proximaAcaoData && (
                <p className="text-xs text-[#1B4F8A] mt-1">📅 {fmtData(conta.proximaAcaoData)}</p>
              )}
              {conta.proximaAcaoResponsavel && (
                <p className="text-xs text-gray-400">👤 {conta.proximaAcaoResponsavel}</p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <p className="text-xs text-gray-400">Sem próxima ação definida</p>
              <ProximaAcaoQuick kaId={conta.id} />
            </div>
          )}
        </div>
      </div>

      {/* Alertas de risco */}
      {healthResult.riscos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {healthResult.riscos.map(r => (
            <span key={r.codigo} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
              r.nivel === 'ALTO' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
              {r.nivel === 'ALTO' ? '🔴' : '🟡'} {r.descricao}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.id ? 'border-[#1B4F8A] text-[#1B4F8A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Visão Geral ── */}
      {tab === 'visao' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Informações</h3>
            <dl className="space-y-2 text-sm">
              {conta.cnpj && <Row label="CNPJ" value={conta.cnpj} />}
              {conta.receitaAnual && Number(conta.receitaAnual) > 0 && <Row label="Receita anual" value={fmtBRL(conta.receitaAnual)!} />}
              {conta.potencialEstimado && Number(conta.potencialEstimado) > 0 && <Row label="Potencial estimado" value={fmtBRL(conta.potencialEstimado)!} />}
              {conta.site && (
                <div className="flex justify-between items-center">
                  <dt className="text-gray-500">Site</dt>
                  <dd>
                    <a href={conta.site} target="_blank" rel="noopener" className="text-[#1B4F8A] hover:underline flex items-center gap-1 text-xs">
                      Acessar <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Portfólio de Serviços</h3>
              {conta.servicosContratados && conta.servicosPotencial && (
                <p className="text-[10px] text-gray-400">
                  {conta.servicosContratados.length} realizado{conta.servicosContratados.length !== 1 ? 's' : ''} · {conta.servicosPotencial.length} potencial
                </p>
              )}
            </div>

            {(!conta.servicosContratados || conta.servicosContratados.length === 0) && (!conta.servicosPotencial || conta.servicosPotencial.length === 0) && (
              <p className="text-xs text-gray-400">Nenhum serviço mapeado</p>
            )}

            {conta.servicosContratados && conta.servicosContratados.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-xs font-medium text-emerald-700">Já realizados / contratados</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {conta.servicosContratados.map(s => (
                    <span key={s} className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-medium px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {conta.servicosPotencial && conta.servicosPotencial.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <p className="text-xs font-medium text-blue-600">Potencial de expansão</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {conta.servicosPotencial.map(s => (
                    <span key={s} className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resumo stakeholders */}
          {stakeholders.length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Mapa de Contatos</h3>
              <div className="flex gap-4 text-center">
                {[
                  { label: 'Decisores', val: stakeholders.filter(s => s.nivelPoder === 'DECISOR_FINAL').length },
                  { label: 'Promotores', val: stakeholders.filter(s => s.posicionamento === 'PROMOTOR').length },
                  { label: 'Detratores', val: stakeholders.filter(s => s.posicionamento === 'DETRATOR' || s.posicionamento === 'BLOQUEADOR').length },
                  { label: 'Pendentes', val: stakeholders.filter(s => s.qualificacaoStatus === 'PENDENTE').length },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-xl font-bold text-gray-800">{val}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Últimas visitas */}
          {visitas.length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Últimas Interações</h3>
              <div className="space-y-2">
                {visitas.slice(0, 3).map(v => (
                  <div key={v.id} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-gray-400 tabular-nums shrink-0">{fmtData(v.data)}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">{v.tipo}</span>
                    {v.progressoNivel && (
                      <span className={`text-xs font-bold shrink-0 ${PROGRESSO_COR[v.progressoNivel]}`}>
                        {PROGRESSO_ICON[v.progressoNivel]}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 truncate">{v.objetivo ?? v.resultado ?? ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {conta.observacoes && (
            <div className="md:col-span-2 bg-white rounded-xl border p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Observações</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{conta.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Stakeholders ── */}
      {tab === 'stakeholders' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setNewSt(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4F8A] text-white text-sm rounded-lg hover:bg-[#163f70]">
              <Plus className="h-4 w-4" /> Novo Stakeholder
            </button>
          </div>

          {stakeholders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhum stakeholder mapeado</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stakeholders.map(st => (
                <div key={st.id} className={`bg-white rounded-xl border p-4 ${st.qualificacaoStatus === 'PENDENTE' ? 'border-amber-200 bg-amber-50/20' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {st.qualificacaoStatus === 'PENDENTE' && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded">Não qualificado</span>
                        )}
                        <p className="font-semibold text-sm text-gray-900">{st.nome}</p>
                      </div>
                      {st.cargo && <p className="text-xs text-gray-400">{st.cargo}{st.departamento ? ` · ${st.departamento}` : ''}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditSt(st)} className="p-1 text-gray-300 hover:text-[#1B4F8A]"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { if (confirm(`Excluir ${st.nome}?`)) startPending(() => excluirStakeholder(st.id, conta.id)) }}
                        className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PODER_COR[st.nivelPoder] ?? 'bg-gray-100 text-gray-500'}`}>
                      {PODER_LABEL[st.nivelPoder] ?? st.nivelPoder}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${POSIC_COR[st.posicionamento] ?? 'bg-gray-100 text-gray-500'}`}>
                      {POSIC_LABEL[st.posicionamento] ?? st.posicionamento}
                    </span>
                    {st.nivelRelacionamento && (
                      <span className={`text-[10px] ${REL_COR[st.nivelRelacionamento] ?? 'text-gray-400'}`}>
                        Rel. {st.nivelRelacionamento.charAt(0) + st.nivelRelacionamento.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    {st.email && <a href={`mailto:${st.email}`} className="hover:text-[#1B4F8A]"><Mail className="h-3.5 w-3.5" /></a>}
                    {st.telefone && <a href={`tel:${st.telefone}`} className="hover:text-[#1B4F8A]"><Phone className="h-3.5 w-3.5" /></a>}
                    {st.linkedin && <a href={st.linkedin} target="_blank" rel="noopener" className="hover:text-[#1B4F8A]"><Link2 className="h-3.5 w-3.5" /></a>}
                    {st.ultimaInteracao && <span>Última: {fmtData(st.ultimaInteracao)}</span>}
                  </div>

                  {st.proximaAcao && (
                    <p className="mt-2 text-xs text-[#1B4F8A] bg-blue-50 rounded px-2 py-1">→ {st.proximaAcao}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Histórico ── */}
      {tab === 'visitas' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setNewVis(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4F8A] text-white text-sm rounded-lg hover:bg-[#163f70]">
              <Plus className="h-4 w-4" /> Novo Registro
            </button>
          </div>

          {visitas.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhuma visita registrada</div>
          ) : (
            <div className="space-y-3">
              {visitas.map(v => (
                <div key={v.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{fmtData(v.data)}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{v.tipo}</span>
                      {v.nivelAvanco && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${AVANCO_COR[v.nivelAvanco] ?? 'bg-gray-100 text-gray-500'}`}>
                          {v.nivelAvanco}
                        </span>
                      )}
                      {v.progressoNivel && (
                        <span className={`text-xs font-bold ${PROGRESSO_COR[v.progressoNivel]}`}>
                          {PROGRESSO_ICON[v.progressoNivel]} {v.progressoNivel.charAt(0) + v.progressoNivel.slice(1).toLowerCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditVis(v)} className="p-1 text-gray-300 hover:text-[#1B4F8A]"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { if (confirm('Excluir?')) startPending(() => excluirVisita(v.id, conta.id)) }}
                        className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>

                  {v.participantes && v.participantes.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1.5">Participantes: {v.participantes.join(', ')}</p>
                  )}
                  {v.objetivo && <div className="mt-2"><p className="text-[10px] font-medium text-gray-400 uppercase">Objetivo</p><p className="text-xs text-gray-700">{v.objetivo}</p></div>}
                  {v.resultado && <div className="mt-2"><p className="text-[10px] font-medium text-gray-400 uppercase">Resultado</p><p className="text-xs text-gray-700 whitespace-pre-wrap">{v.resultado}</p></div>}
                  {v.proximosPassos && (
                    <div className="mt-2 bg-blue-50 rounded px-2 py-1.5">
                      <p className="text-[10px] font-medium text-[#1B4F8A] uppercase mb-0.5">Próximos passos</p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{v.proximosPassos}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Estratégia ── */}
      {tab === 'estrategia' && (
        <PlanoEstrategico conta={conta} />
      )}

      {/* ── Tab: Cobertura ── */}
      {tab === 'penetracao' && (
        <PenetracaoTab kaId={conta.id} penetracao={penetracao} />
      )}

      {/* Modais */}
      <FormKeyAccount open={editConta} onClose={() => setEditConta(false)} conta={conta} />
      <FormStakeholder open={newSt} onClose={() => setNewSt(false)} keyAccountId={conta.id} />
      {editSt && <FormStakeholder open={true} onClose={() => setEditSt(null)} keyAccountId={conta.id} stakeholder={editSt} />}
      <FormVisita open={newVis} onClose={() => setNewVis(false)} keyAccountId={conta.id} hoje={hoje} />
      {editVis && <FormVisita open={true} onClose={() => setEditVis(null)} keyAccountId={conta.id} visita={editVis} hoje={hoje} />}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800 text-right">{value}</dd>
    </div>
  )
}

function ProximaAcaoQuick({ kaId }: { kaId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startT] = useTransition()
  const ref = useRef<HTMLFormElement>(null)
  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-[#1B4F8A] hover:underline">+ Definir ação</button>
  )
  return (
    <form ref={ref} className="w-full space-y-1.5 mt-1" onSubmit={e => {
      e.preventDefault()
      const fd = new FormData(ref.current!)
      startT(async () => { await salvarProximaAcao(fd); setOpen(false) })
    }}>
      <input type="hidden" name="id" value={kaId} />
      <input name="proximaAcao" placeholder="Descreva a ação…" required
        className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
      <div className="flex gap-1">
        <input name="proximaAcaoData" type="date"
          className="flex-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]" />
        <button type="submit" disabled={pending}
          className="px-2 py-1 bg-[#1B4F8A] text-white text-xs rounded hover:bg-[#163f70]">Salvar</button>
      </div>
    </form>
  )
}

function PlanoEstrategico({ conta }: { conta: KAConta }) {
  const [edit, setEdit] = useState(false)
  const [pending, startT] = useTransition()
  const ref = useRef<HTMLFormElement>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(ref.current!)
    startT(async () => { await salvarPlanoAcao(fd); setEdit(false) })
  }

  if (edit) return (
    <form ref={ref} onSubmit={handleSave} className="space-y-4">
      <input type="hidden" name="id" value={conta.id} />
      {[
        { name: 'plano30d', label: 'Ações para os próximos 30 dias', value: conta.plano30d },
        { name: 'plano90d', label: 'Visão para os próximos 90 dias', value: conta.plano90d },
        { name: 'barreiras', label: 'Barreiras identificadas', value: conta.barreiras },
        { name: 'estrategia', label: 'Estratégia de relacionamento', value: conta.estrategia },
        { name: 'estrategiaExpansao', label: 'Estratégia de expansão / cross-sell', value: conta.estrategiaExpansao },
      ].map(f => (
        <div key={f.name} className="bg-white rounded-xl border p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{f.label}</label>
          <textarea name={f.name} rows={3} defaultValue={f.value ?? ''}
            className="w-full text-sm resize-none focus:outline-none rounded px-1 py-0.5" />
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEdit(false)} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
        <button type="submit" disabled={pending}
          className="px-4 py-2 bg-[#1B4F8A] text-white text-sm rounded-lg disabled:opacity-50">
          {pending ? 'Salvando…' : 'Salvar plano'}
        </button>
      </div>
    </form>
  )

  const empty = !conta.plano30d && !conta.plano90d && !conta.barreiras && !conta.estrategia && !conta.estrategiaExpansao
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEdit(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1B4F8A] text-[#1B4F8A] text-sm rounded-lg hover:bg-blue-50">
          <Edit className="h-4 w-4" /> Editar plano
        </button>
      </div>
      {empty ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Nenhum plano definido
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'Ações 30 dias', value: conta.plano30d, color: 'border-l-blue-400' },
            { label: 'Visão 90 dias', value: conta.plano90d, color: 'border-l-purple-400' },
            { label: 'Barreiras', value: conta.barreiras, color: 'border-l-red-400' },
            { label: 'Estratégia', value: conta.estrategia, color: 'border-l-emerald-400' },
            { label: 'Expansão / Cross-sell', value: conta.estrategiaExpansao, color: 'border-l-yellow-400' },
          ].filter(({ value }) => value).map(({ label, value, color }) => (
            <div key={label} className={`bg-white rounded-xl border-l-4 border ${color} p-4`}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PenetracaoTab({ kaId, penetracao }: { kaId: string; penetracao: KAPenetracao[] }) {
  const [pending, startT] = useTransition()

  const statusMap: Record<string, { label: string; cor: string }> = {
    'Não iniciado':       { label: '✗', cor: 'bg-gray-100 text-gray-400' },
    'Em progresso':      { label: '~', cor: 'bg-yellow-100 text-yellow-700' },
    'Relacionamento ativo': { label: '✓', cor: 'bg-emerald-100 text-emerald-700' },
  }

  const penMap = Object.fromEntries(penetracao.map(p => [p.departamento, p]))
  const ativos = DEPARTAMENTOS.filter(d => penMap[d]?.status === 'Relacionamento ativo').length
  const pct = Math.round((ativos / DEPARTAMENTOS.length) * 100)

  const ciclar = (depto: string) => {
    const atual = penMap[depto]?.status ?? 'Não iniciado'
    const ordem = ['Não iniciado', 'Em progresso', 'Relacionamento ativo']
    const proximo = ordem[(ordem.indexOf(atual) + 1) % ordem.length]
    const fd = new FormData()
    fd.set('keyAccountId', kaId)
    fd.set('departamento', depto)
    fd.set('status', proximo)
    startT(async () => { await salvarPenetracao(fd) })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Cobertura por departamento</p>
            <p className="text-xs text-gray-400">{ativos} de {DEPARTAMENTOS.length} departamentos com relacionamento ativo</p>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
            {pct}%
          </p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DEPARTAMENTOS.map(d => {
            const p = penMap[d]
            const status = p?.status ?? 'Não iniciado'
            const s = statusMap[status]
            return (
              <button key={d} onClick={() => ciclar(d)} disabled={pending}
                className={`rounded-lg border px-3 py-2.5 text-left text-xs transition-all hover:border-[#4A90D9] ${pending ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">{d}</span>
                  <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${s.cor}`}>{s.label}</span>
                </div>
                <p className="text-[10px] text-gray-400">{status}</p>
              </button>
            )
          })}
        </div>
        <p className="text-[10px] text-gray-400 mt-3">Clique em cada departamento para ciclar o status</p>
      </div>
    </div>
  )
}
