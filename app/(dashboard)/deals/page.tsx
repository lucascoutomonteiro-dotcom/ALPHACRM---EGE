import { db } from '@/lib/db'
import { deals, pipelines, stages } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { DealsClient } from './DealsClient'

export const dynamic = 'force-dynamic'

export default async function DealsPage() {
  const user = await requireAuth()

  try {
  const rows = await db.select({
    id: deals.id,
    title: deals.title,
    value: deals.value,
    probability: deals.probability,
    pipelineId: deals.pipelineId,
    stageId: deals.stageId,
    contatoId: deals.contatoId,
    accountId: deals.accountId,
    responsavelId: deals.responsavelId,
    status: deals.status,
    expectedCloseDate: deals.expectedCloseDate,
    description: deals.description,
    createdAt: deals.createdAt,
  }).from(deals).where(eq(deals.organizationId, user.organizationId))

  const pipelineRows = await db.select({
    id: pipelines.id,
    name: pipelines.name,
  }).from(pipelines).where(eq(pipelines.organizationId, user.organizationId))

  const stageRows = await db.select({
    id: stages.id,
    name: stages.name,
    order: stages.order,
    color: stages.color,
    isWon: stages.isWon,
    isLost: stages.isLost,
    probability: stages.probability,
  }).from(stages).where(eq(stages.organizationId, user.organizationId))

  const contatoRows: { id: string; nome: string | null }[] = []

  const sortedStages = stageRows.sort((a, b) => a.order - b.order)

  return (
    <DealsClient
      deals={rows}
      pipelines={pipelineRows}
      stages={sortedStages}
      contatos={contatoRows}
    />
  )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return <div className="p-6 bg-red-50 text-red-700 rounded-xl text-sm font-mono whitespace-pre-wrap">{msg}</div>
  }
}
