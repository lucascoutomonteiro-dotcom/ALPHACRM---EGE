import { db } from '@/lib/db'
import { clientesEge, interacoesEge } from '@/lib/schema'
import { TabelaClientesEge } from './TabelaClientesEge'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function OportunidadesPage() {
  const clientes = await db.select({
    id: clientesEge.id,
    rank: clientesEge.rank,
    cliente: clientesEge.cliente,
    local: clientesEge.local,
    contatoNome: clientesEge.contatoNome,
    classificacao: clientesEge.classificacao,
    numOportunidades: clientesEge.numOportunidades,
    potencialTotal: clientesEge.potencialTotal,
    prazoUrgencia: clientesEge.prazoUrgencia,
    acao30d: clientesEge.acao30d,
    statusAcao: clientesEge.statusAcao,
    nr12AprRisco: clientesEge.nr12AprRisco,
    nr12Procedimentos: clientesEge.nr12Procedimentos,
    nr12Manuais: clientesEge.nr12Manuais,
    nr12Treinamento: clientesEge.nr12Treinamento,
    nr12Conceituacao: clientesEge.nr12Conceituacao,
    nr12Adequacao: clientesEge.nr12Adequacao,
    cacaVazDeteccao: clientesEge.cacaVazDeteccao,
    cacaVazReparo: clientesEge.cacaVazReparo,
    termografia: clientesEge.termografia,
    terceirizacaoHh: clientesEge.terceirizacaoHh,
    nr10PieLaudo: clientesEge.nr10PieLaudo,
    nr10Spda: clientesEge.nr10Spda,
    nr10Instalacoes: clientesEge.nr10Instalacoes,
  }).from(clientesEge).orderBy(clientesEge.rank)

  const followUpMap: Record<string, string> = {}
  try {
    const followUps = await db.execute(sql`
      SELECT cliente_ege_id, MIN(data_proximo_passo) as proximo_follow_up
      FROM interacoes_ege
      WHERE data_proximo_passo IS NOT NULL
      GROUP BY cliente_ege_id
    `)
    for (const row of followUps as unknown as { cliente_ege_id: string; proximo_follow_up: string }[]) {
      followUpMap[row.cliente_ege_id] = row.proximo_follow_up
    }
  } catch {
    // tabela interacoes_ege ainda não existe — segue sem follow-ups
  }

  const clientesComFollowUp = clientes.map(c => ({
    ...c,
    proximoFollowUp: followUpMap[c.id] ?? null,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B4F8A]">Base EGE — {clientes.length} Clientes Ativos</h1>
        <a href="/oportunidades/bc" className="text-sm text-[#1B4F8A] hover:underline">
          → Cross-sell B/C (37 clientes)
        </a>
      </div>
      <TabelaClientesEge clientes={clientesComFollowUp as Parameters<typeof TabelaClientesEge>[0]['clientes']} />
    </div>
  )
}
