import { db } from '@/lib/db'
import { pipelines, stages } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { PipelinesClient } from './PipelinesClient'

export const dynamic = 'force-dynamic'

export default async function PipelinesPage() {
  const session = await auth()
  const user = session?.user as { role?: string; organizationId?: string } | undefined

  if (!user?.organizationId) redirect('/login')
  if (!['ADMIN', 'OWNER'].includes(user.role ?? '')) redirect('/')

  const lista = await db.select().from(pipelines)
    .where(eq(pipelines.organizationId, user.organizationId))
    .orderBy(pipelines.createdAt)

  const stagesAll = await db.select().from(stages)
    .where(eq(stages.organizationId, user.organizationId))
    .orderBy(asc(stages.order))

  const stagesPorPipeline = stagesAll.reduce<Record<string, typeof stagesAll>>((acc, s) => {
    if (!acc[s.pipelineId]) acc[s.pipelineId] = []
    acc[s.pipelineId].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4F8A]">Pipelines</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure os funis e etapas do processo comercial</p>
      </div>
      <PipelinesClient pipelines={lista} stagesPorPipeline={stagesPorPipeline} />
    </div>
  )
}
