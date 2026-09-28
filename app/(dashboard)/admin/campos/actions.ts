'use server'

import { db } from '@/lib/db'
import { customFields, customFieldValues } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export type CustomFieldInput = {
  entityType: 'contato' | 'deal' | 'lead'
  label: string
  fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean'
  options?: string[] | null
  required?: boolean
  position?: number
}

export async function criarCampo(input: CustomFieldInput) {
  const user = await requireAuth()
  await db.insert(customFields).values({
    organizationId: user.organizationId,
    entityType: input.entityType,
    label: input.label,
    fieldType: input.fieldType,
    options: input.options ? JSON.stringify(input.options) : null,
    required: input.required ?? false,
    active: true,
    position: input.position ?? 0,
  })
  revalidatePath('/admin/campos')
}

export async function editarCampo(id: string, input: CustomFieldInput) {
  await requireAuth()
  await db.update(customFields).set({
    entityType: input.entityType,
    label: input.label,
    fieldType: input.fieldType,
    options: input.options ? JSON.stringify(input.options) : null,
    required: input.required ?? false,
    position: input.position ?? 0,
    updatedAt: new Date(),
  }).where(eq(customFields.id, id))
  revalidatePath('/admin/campos')
}

export async function toggleCampoAtivo(id: string, active: boolean) {
  await requireAuth()
  await db.update(customFields).set({ active, updatedAt: new Date() }).where(eq(customFields.id, id))
  revalidatePath('/admin/campos')
}

export async function excluirCampo(id: string) {
  await requireAuth()
  await db.delete(customFields).where(eq(customFields.id, id))
  revalidatePath('/admin/campos')
}

export async function salvarValorCampo(fieldId: string, entityType: string, entityId: string, value: string | null) {
  const user = await requireAuth()
  const existing = await db.select({ id: customFieldValues.id })
    .from(customFieldValues)
    .where(and(
      eq(customFieldValues.fieldId, fieldId),
      eq(customFieldValues.entityId, entityId),
    ))

  if (existing.length > 0) {
    await db.update(customFieldValues).set({ value, updatedAt: new Date() })
      .where(eq(customFieldValues.id, existing[0].id))
  } else {
    await db.insert(customFieldValues).values({
      organizationId: user.organizationId,
      fieldId,
      entityType,
      entityId,
      value,
    })
  }
}
