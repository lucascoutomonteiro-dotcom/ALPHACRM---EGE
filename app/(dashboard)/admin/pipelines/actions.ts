'use server'

import { db } from '@/lib/db'
import { pipelines, stages } from '@/lib/schema'
import { eq, and, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAuth, canAccess } from '@/lib/session'

// ── Pipelines ─────────────────────────────────────────────────────────────────

export async function listarPipelines() {
  const { organizationId } = await requireAuth()
  return db.select().from(pipelines)
    .where(eq(pipelines.organizationId, organizationId))
    .orderBy(pipelines.createdAt)
}

export async function criarPipeline(fd: FormData) {
  const { organizationId, role } = await requireAuth()
  if (!canAccess(role, 'ADMIN')) throw new Error('Sem permissão')

  const name = (fd.get('name') as string)?.trim()
  if (!name) throw new Error('Nome obrigatório')

  const [p] = await db.insert(pipelines).values({
    organizationId,
    name,
    description: (fd.get('description') as string) || null,
    isDefault: fd.get('isDefault') === 'true',
  }).returning()

  revalidatePath('/admin/pipelines')
  return p
}

export async function atualizarPipeline(id: string, fd: FormData) {
  const { organizationId, role } = await requireAuth()
  if (!canAccess(role, 'ADMIN')) throw new Error('Sem permissão')

  await db.update(pipelines).set({
    name: (fd.get('name') as string)?.trim(),
    description: (fd.get('description') as string) || null,
    active: fd.get('active') !== 'false',
    updatedAt: new Date(),
  }).where(and(eq(pipelines.id, id), eq(pipelines.organizationId, organizationId)))

  revalidatePath('/admin/pipelines')
}

export async function excluirPipeline(id: string) {
  const { organizationId, role } = await requireAuth()
  if (!canAccess(role, 'ADMIN')) throw new Error('Sem permissão')

  // Não permite excluir o pipeline padrão
  const [p] = await db.select({ isDefault: pipelines.isDefault })
    .from(pipelines)
    .where(and(eq(pipelines.id, id), eq(pipelines.organizationId, organizationId)))

  if (p?.isDefault) throw new Error('O pipeline padrão não pode ser excluído')

  await db.delete(pipelines).where(and(eq(pipelines.id, id), eq(pipelines.organizationId, organizationId)))
  revalidatePath('/admin/pipelines')
}

// ── Stages ────────────────────────────────────────────────────────────────────

export async function listarStages(pipelineId: string) {
  const { organizationId } = await requireAuth()
  return db.select().from(stages)
    .where(and(eq(stages.pipelineId, pipelineId), eq(stages.organizationId, organizationId)))
    .orderBy(asc(stages.order))
}

export async function criarStage(pipelineId: string, fd: FormData) {
  const { organizationId, role } = await requireAuth()
  if (!canAccess(role, 'ADMIN')) throw new Error('Sem permissão')

  const name = (fd.get('name') as string)?.trim()
  if (!name) throw new Error('Nome obrigatório')

  // Próxima ordem
  const existentes = await db.select({ order: stages.order }).from(stages)
    .where(and(eq(stages.pipelineId, pipelineId), eq(stages.organizationId, organizationId)))
  const maxOrder = existentes.length > 0 ? Math.max(...existentes.map(s => s.order ?? 0)) : -1

  await db.insert(stages).values({
    pipelineId,
    organizationId,
    name,
    order: maxOrder + 1,
    probability: parseInt(fd.get('probability') as string) || 0,
    color: (fd.get('color') as string) || '#9CA3AF',
    description: (fd.get('description') as string) || null,
    isWon: fd.get('isWon') === 'true',
    isLost: fd.get('isLost') === 'true',
  })

  revalidatePath('/admin/pipelines')
}

export async function atualizarStage(id: string, fd: FormData) {
  const { organizationId, role } = await requireAuth()
  if (!canAccess(role, 'ADMIN')) throw new Error('Sem permissão')

  await db.update(stages).set({
    name: (fd.get('name') as string)?.trim(),
    probability: parseInt(fd.get('probability') as string) || 0,
    color: (fd.get('color') as string) || '#9CA3AF',
    description: (fd.get('description') as string) || null,
    isWon: fd.get('isWon') === 'true',
    isLost: fd.get('isLost') === 'true',
    active: fd.get('active') !== 'false',
    updatedAt: new Date(),
  }).where(and(eq(stages.id, id), eq(stages.organizationId, organizationId)))

  revalidatePath('/admin/pipelines')
}

export async function reordenarStages(pipelineId: string, ids: string[]) {
  const { organizationId, role } = await requireAuth()
  if (!canAccess(role, 'ADMIN')) throw new Error('Sem permissão')

  for (let i = 0; i < ids.length; i++) {
    await db.update(stages).set({ order: i, updatedAt: new Date() })
      .where(and(eq(stages.id, ids[i]), eq(stages.organizationId, organizationId)))
  }

  revalidatePath('/admin/pipelines')
}

export async function excluirStage(id: string) {
  const { organizationId, role } = await requireAuth()
  if (!canAccess(role, 'ADMIN')) throw new Error('Sem permissão')

  await db.delete(stages).where(and(eq(stages.id, id), eq(stages.organizationId, organizationId)))
  revalidatePath('/admin/pipelines')
}
