import { db } from '@/lib/db'
import { planosAcao } from '@/lib/schema'
import { PlanoPageClient } from './PlanoPageClient'

export const dynamic = 'force-dynamic'

export default async function PlanoPage() {
  const acoes = await db.select({
    id: planosAcao.id,
    frente: planosAcao.frente,
    oQue: planosAcao.oQue,
    porQue: planosAcao.porQue,
    quem: planosAcao.quem,
    quando: planosAcao.quando,
    dataLimite: planosAcao.dataLimite,
    onde: planosAcao.onde,
    como: planosAcao.como,
    kpi: planosAcao.kpi,
    status: planosAcao.status,
    prazo: planosAcao.prazo,
    observacao: planosAcao.observacao,
  }).from(planosAcao).orderBy(planosAcao.prazo, planosAcao.frente)
  return <PlanoPageClient acoes={acoes as Parameters<typeof PlanoPageClient>[0]['acoes']} />
}
