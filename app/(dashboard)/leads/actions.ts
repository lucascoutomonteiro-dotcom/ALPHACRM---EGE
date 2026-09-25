'use server'

import { db } from '@/lib/db'
import { leads, contatos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { logEvent } from '@/lib/timeline'

export type LeadInput = {
  nome: string
  email?: string
  telefone?: string
  empresa?: string
  cargo?: string
  origem?: string
  status?: string
  score?: number
  responsavelId?: string
  observacoes?: string
}

export async function criarLead(input: LeadInput) {
  const user = await requireAuth()
  await db.insert(leads).values({
    organizationId: user.organizationId,
    nome: input.nome,
    email: input.email || null,
    telefone: input.telefone || null,
    empresa: input.empresa || null,
    cargo: input.cargo || null,
    origem: input.origem || null,
    status: input.status || 'Novo',
    score: input.score ?? 0,
    responsavelId: input.responsavelId || null,
    observacoes: input.observacoes || null,
  })
  revalidatePath('/leads')
}

export async function editarLead(id: string, input: LeadInput) {
  await requireAuth()
  await db.update(leads).set({
    nome: input.nome,
    email: input.email || null,
    telefone: input.telefone || null,
    empresa: input.empresa || null,
    cargo: input.cargo || null,
    origem: input.origem || null,
    status: input.status || 'Novo',
    score: input.score ?? 0,
    responsavelId: input.responsavelId || null,
    observacoes: input.observacoes || null,
    updatedAt: new Date(),
  }).where(eq(leads.id, id))
  revalidatePath('/leads')
}

export async function excluirLead(id: string) {
  await requireAuth()
  await db.delete(leads).where(eq(leads.id, id))
  revalidatePath('/leads')
}

export async function converterLead(id: string) {
  const user = await requireAuth()

  const [lead] = await db.select({
    id: leads.id,
    nome: leads.nome,
    email: leads.email,
    telefone: leads.telefone,
    empresa: leads.empresa,
    cargo: leads.cargo,
    origem: leads.origem,
    responsavelId: leads.responsavelId,
  }).from(leads).where(eq(leads.id, id))

  if (!lead) throw new Error('Lead não encontrado')

  // Cria contato no CRM
  const [novoContato] = await db.insert(contatos).values({
    organizationId: user.organizationId,
    nome: lead.nome,
    email: lead.email,
    telefone: lead.telefone,
    empresa: lead.empresa,
    cargo: lead.cargo,
    origem: lead.origem,
    responsavelId: lead.responsavelId,
    status: 'Prospecção',
  }).returning({ id: contatos.id })

  // Marca lead como convertido
  await db.update(leads).set({
    status: 'Convertido',
    contatoId: novoContato.id,
    convertidoEm: new Date(),
    updatedAt: new Date(),
  }).where(eq(leads.id, id))

  await logEvent({
    organizationId: user.organizationId,
    entityType: 'lead',
    entityId: id,
    eventType: 'lead_converted',
    title: `Lead "${lead.nome}" convertido em contato`,
    userId: user.id,
  })
  await logEvent({
    organizationId: user.organizationId,
    entityType: 'contato',
    entityId: novoContato.id,
    eventType: 'created',
    title: `Contato criado a partir do lead "${lead.nome}"`,
    userId: user.id,
  })

  revalidatePath('/leads')
  revalidatePath('/crm')
  return novoContato.id
}
