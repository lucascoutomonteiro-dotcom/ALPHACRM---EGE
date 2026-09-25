'use server'

import { db } from '@/lib/db'
import { activities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { logEvent } from '@/lib/timeline'

export type ActivityInput = {
  type: string
  title: string
  description?: string | null
  date: string
  durationMinutes?: number | null
  status?: string
  contatoId?: string | null
  dealId?: string | null
  leadId?: string | null
  responsavelId?: string | null
  proximoPasso?: string | null
  dataProximoPasso?: string | null
}

export async function criarActivity(input: ActivityInput) {
  const user = await requireAuth()
  const [activity] = await db.insert(activities).values({
    organizationId: user.organizationId,
    type: input.type,
    title: input.title,
    description: input.description || null,
    date: new Date(input.date),
    durationMinutes: input.durationMinutes || null,
    status: input.status || 'done',
    contatoId: input.contatoId || null,
    dealId: input.dealId || null,
    leadId: input.leadId || null,
    responsavelId: input.responsavelId || null,
    proximoPasso: input.proximoPasso || null,
    dataProximoPasso: input.dataProximoPasso || null,
  }).returning({ id: activities.id })

  if (input.contatoId) {
    await logEvent({
      organizationId: user.organizationId,
      entityType: 'contato',
      entityId: input.contatoId,
      eventType: 'activity_logged',
      title: `${input.type}: ${input.title}`,
      description: input.description || undefined,
      userId: user.id,
    })
  }
  if (input.dealId) {
    await logEvent({
      organizationId: user.organizationId,
      entityType: 'deal',
      entityId: input.dealId,
      eventType: 'activity_logged',
      title: `${input.type}: ${input.title}`,
      description: input.description || undefined,
      userId: user.id,
    })
  }
  revalidatePath('/activities')
}

export async function editarActivity(id: string, input: ActivityInput) {
  await requireAuth()
  await db.update(activities).set({
    type: input.type,
    title: input.title,
    description: input.description || null,
    date: new Date(input.date),
    durationMinutes: input.durationMinutes || null,
    status: input.status || 'done',
    contatoId: input.contatoId || null,
    dealId: input.dealId || null,
    leadId: input.leadId || null,
    responsavelId: input.responsavelId || null,
    proximoPasso: input.proximoPasso || null,
    dataProximoPasso: input.dataProximoPasso || null,
    updatedAt: new Date(),
  }).where(eq(activities.id, id))
  revalidatePath('/activities')
}

export async function excluirActivity(id: string) {
  await requireAuth()
  await db.delete(activities).where(eq(activities.id, id))
  revalidatePath('/activities')
}
