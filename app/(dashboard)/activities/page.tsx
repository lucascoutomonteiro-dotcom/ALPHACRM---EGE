import { db } from '@/lib/db'
import { activities } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { ActivitiesClient } from './ActivitiesClient'

export const dynamic = 'force-dynamic'

export default async function ActivitiesPage() {
  const user = await requireAuth()

  try {
    const rows = await db.select({
      id: activities.id,
      type: activities.type,
      title: activities.title,
      description: activities.description,
      date: activities.date,
      durationMinutes: activities.durationMinutes,
      status: activities.status,
      contatoId: activities.contatoId,
      dealId: activities.dealId,
      leadId: activities.leadId,
      responsavelId: activities.responsavelId,
      proximoPasso: activities.proximoPasso,
      dataProximoPasso: activities.dataProximoPasso,
    }).from(activities)
      .where(eq(activities.organizationId, user.organizationId))
      .orderBy(desc(activities.date))

    return <ActivitiesClient activities={rows} />
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return <div className="p-6 bg-red-50 text-red-700 rounded-xl text-sm font-mono whitespace-pre-wrap">{msg}</div>
  }
}
