import { db } from '@/lib/db'
import { metas, crmEventos } from '@/lib/schema'
import { auth } from '@/auth'
import { and, desc, eq, count } from 'drizzle-orm'
import { MetasForm } from './MetasForm'

export const dynamic = 'force-dynamic'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmtBRL(v: number | string | null) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v ?? 0))
}

function num(v: number | null | undefined) {
  return (v ?? 0).toLocaleString('pt-BR')
}

function pct(r: number | string | null, m: number | string | null) {
  const rv = Number(r ?? 0), mv = Number(m ?? 0)
  return mv > 0 ? Math.round((rv / mv) * 100) : 0
}

function PctCell({ r, m }: { r: number | string | null; m: number | string | null }) {
  const p = pct(r, m)
  const color = p >= 100 ? '#22C55E' : p >= 70 ? '#3B82F6' : p >= 30 ? '#F59E0B' : '#EF4444'
  return <td className="px-3 py-3 text-right font-semibold text-xs" style={{ color }}>{p}%</td>
}

interface PageProps {
  searchParams: Promise<{ mes?: string; ano?: string }>
}

export default async function MetasPage({ searchParams }: PageProps) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role ?? 'viewer'

  const params = await searchParams
  const now = new Date()
  const selectedMes = Number(params?.mes ?? now.getMonth() + 1)
  const selectedAno = Number(params?.ano ?? now.getFullYear())

  const metasCols = {
    id: metas.id, mes: metas.mes, ano: metas.ano,
    metaEbitda: metas.metaEbitda, faturamentoNecessario: metas.faturamentoNecessario,
    pipelineNecessario: metas.pipelineNecessario, metaContratos: metas.metaContratos,
    metaPropostas: metas.metaPropostas, metaPropostasValor: metas.metaPropostasValor,
    metaProspeccoes: metas.metaProspeccoes, metaReunioes: metas.metaReunioes,
    realizadoVendas: metas.realizadoVendas, realizadoEbitda: metas.realizadoEbitda,
    realizadoPipeline: metas.realizadoPipeline, realizadoPipelineQtd: metas.realizadoPipelineQtd,
    realizadoPropostas: metas.realizadoPropostas, realizadoPropostasValor: metas.realizadoPropostasValor,
    realizadoProspeccoes: metas.realizadoProspeccoes, realizadoReunioes: metas.realizadoReunioes,
    contratosFechados: metas.contratosFechados,
  }

  const [metaSelecionada] = await db
    .select(metasCols)
    .from(metas)
    .where(and(eq(metas.mes, selectedMes), eq(metas.ano, selectedAno)))
    .limit(1)

  // Contagem automática de reuniões/visitas do CRM para o mês selecionado
  const [reunioesRow] = await db
    .select({ total: count() })
    .from(crmEventos)
    .where(and(eq(crmEventos.tipo, 'reuniao'), eq(crmEventos.mes, selectedMes), eq(crmEventos.ano, selectedAno)))

  const reunioesAutomaticas = reunioesRow?.total ?? 0

  const historico = await db.select(metasCols).from(metas).orderBy(desc(metas.ano), desc(metas.mes))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1B4F8A]">Metas</h1>

      {(role === 'admin' || role === 'closer') && (
        <MetasForm
          key={`${selectedMes}-${selectedAno}`}
          meta={metaSelecionada ?? null}
          selectedMes={selectedMes}
          selectedAno={selectedAno}
          role={role}
          reunioesAutomaticas={reunioesAutomaticas}
        />
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-sm">Histórico — Últimos 12 meses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm" style={{ minWidth: 1100 }}>
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 sticky left-0 bg-gray-50">Mês/Ano</th>
                <th className="text-right px-3 py-3 border-l">Meta Vendas</th>
                <th className="text-right px-3 py-3">Realizado</th>
                <th className="text-right px-3 py-3">%</th>
                <th className="text-right px-3 py-3 border-l">Meta EBITDA</th>
                <th className="text-right px-3 py-3">EBITDA Real.</th>
                <th className="text-right px-3 py-3">%</th>
                <th className="text-right px-3 py-3 border-l">Meta Pipeline</th>
                <th className="text-right px-3 py-3">Pipeline Real.</th>
                <th className="text-right px-3 py-3">%</th>
                <th className="text-right px-3 py-3 border-l">Meta Prop.</th>
                <th className="text-right px-3 py-3">Prop. Env.</th>
                <th className="text-right px-3 py-3">%</th>
                <th className="text-right px-3 py-3 border-l">Meta Prosp.</th>
                <th className="text-right px-3 py-3">Prosp. Real.</th>
                <th className="text-right px-3 py-3">%</th>
                <th className="text-right px-3 py-3 border-l">Contratos</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {historico.slice(0, 12).map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-gray-50 ${m.mes === selectedMes && m.ano === selectedAno ? 'bg-blue-50' : ''}`}
                >
                  <td className={`px-4 py-3 font-semibold sticky left-0 ${m.mes === selectedMes && m.ano === selectedAno ? 'bg-blue-50' : 'bg-white'}`}>
                    {MESES[m.mes - 1]}/{m.ano}
                  </td>
                  <td className="px-3 py-3 text-right border-l text-xs">{fmtBRL(m.faturamentoNecessario)}</td>
                  <td className="px-3 py-3 text-right text-xs">{fmtBRL(m.realizadoVendas)}</td>
                  <PctCell r={m.realizadoVendas} m={m.faturamentoNecessario} />
                  <td className="px-3 py-3 text-right border-l text-xs">{fmtBRL(m.metaEbitda)}</td>
                  <td className="px-3 py-3 text-right text-xs">{fmtBRL(m.realizadoEbitda)}</td>
                  <PctCell r={m.realizadoEbitda} m={m.metaEbitda} />
                  <td className="px-3 py-3 text-right border-l text-xs">{fmtBRL(m.pipelineNecessario)}</td>
                  <td className="px-3 py-3 text-right text-xs">{fmtBRL(m.realizadoPipeline)}</td>
                  <PctCell r={m.realizadoPipeline} m={m.pipelineNecessario} />
                  <td className="px-3 py-3 text-right border-l text-xs">{num(m.metaPropostas)}</td>
                  <td className="px-3 py-3 text-right text-xs">{num(m.realizadoPropostas)}</td>
                  <PctCell r={m.realizadoPropostas} m={m.metaPropostas} />
                  <td className="px-3 py-3 text-right border-l text-xs">{num(m.metaProspeccoes)}</td>
                  <td className="px-3 py-3 text-right text-xs">{num(m.realizadoProspeccoes)}</td>
                  <PctCell r={m.realizadoProspeccoes} m={m.metaProspeccoes} />
                  <td className="px-3 py-3 text-right border-l font-semibold text-xs">{num(m.contratosFechados)}</td>
                </tr>
              ))}
              {historico.length === 0 && (
                <tr><td colSpan={17} className="px-4 py-8 text-center text-gray-400">Nenhuma meta cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
