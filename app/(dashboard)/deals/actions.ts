'use server'

import { db } from '@/lib/db'
import { deals, stages, pipelines } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { logEvent } from '@/lib/timeline'

export type DealInput = {
  title: string
  value?: number | null
  probability?: number | null
  pipelineId?: string | null
  stageId?: string | null
  contatoId?: string | null
  accountId?: string | null
  responsavelId?: string | null
  expectedCloseDate?: string | null
  description?: string | null
}

export async function criarDeal(input: DealInput) {
  const user = await requireAuth()
  const [deal] = await db.insert(deals).values({
    organizationId: user.organizationId,
    title: input.title,
    value: input.value ? String(input.value) : null,
    probability: input.probability ?? 0,
    pipelineId: input.pipelineId || null,
    stageId: input.stageId || null,
    contatoId: input.contatoId || null,
    accountId: input.accountId || null,
    responsavelId: input.responsavelId || null,
    expectedCloseDate: input.expectedCloseDate || null,
    description: input.description || null,
    status: 'open',
  }).returning({ id: deals.id })
  await logEvent({
    organizationId: user.organizationId,
    entityType: 'deal',
    entityId: deal.id,
    eventType: 'created',
    title: `Deal "${input.title}" criado`,
    userId: user.id,
  })
  revalidatePath('/deals')
}

export async function editarDeal(id: string, input: DealInput) {
  await requireAuth()
  await db.update(deals).set({
    title: input.title,
    value: input.value ? String(input.value) : null,
    probability: input.probability ?? 0,
    pipelineId: input.pipelineId || null,
    stageId: input.stageId || null,
    contatoId: input.contatoId || null,
    accountId: input.accountId || null,
    responsavelId: input.responsavelId || null,
    expectedCloseDate: input.expectedCloseDate || null,
    description: input.description || null,
    updatedAt: new Date(),
  }).where(eq(deals.id, id))
  revalidatePath('/deals')
}

export async function moverDealStage(dealId: string, stageId: string) {
  await requireAuth()
  await db.update(deals).set({
    stageId,
    updatedAt: new Date(),
  }).where(eq(deals.id, dealId))
  revalidatePath('/deals')
}

export async function fecharDeal(id: string, won: boolean, lossReason?: string) {
  const user = await requireAuth()
  const [deal] = await db.select({ title: deals.title }).from(deals).where(eq(deals.id, id))
  await db.update(deals).set({
    status: won ? 'won' : 'lost',
    lossReason: won ? null : (lossReason || null),
    updatedAt: new Date(),
  }).where(eq(deals.id, id))
  await logEvent({
    organizationId: user.organizationId,
    entityType: 'deal',
    entityId: id,
    eventType: won ? 'deal_won' : 'deal_lost',
    title: won ? `Deal "${deal?.title}" marcado como Ganho` : `Deal "${deal?.title}" marcado como Perdido`,
    description: !won && lossReason ? `Motivo: ${lossReason}` : undefined,
    userId: user.id,
  })
  revalidatePath('/deals')
}

export async function excluirDeal(id: string) {
  await requireAuth()
  await db.delete(deals).where(eq(deals.id, id))
  revalidatePath('/deals')
}
