import { db } from './db'
import { timelineEvents } from './schema'

type TimelineInput = {
  organizationId: string
  entityType: 'contato' | 'deal' | 'lead' | 'account'
  entityId: string
  eventType: string
  title: string
  description?: string
  metadata?: Record<string, unknown>
  userId?: string
}

export async function logEvent(input: TimelineInput) {
  try {
    await db.insert(timelineEvents).values({
      organizationId: input.organizationId,
      entityType: input.entityType,
      entityId: input.entityId,
      eventType: input.eventType,
      title: input.title,
      description: input.description || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      userId: input.userId || null,
    })
  } catch {
    // Não deixar falha de log quebrar a action principal
  }
}
