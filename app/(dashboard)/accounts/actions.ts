'use server'

import { db } from '@/lib/db'
import { accounts, contatos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export type AccountInput = {
  nome: string
  cnpj?: string
  segmento?: string
  cidade?: string
  estado?: string
  website?: string
  telefone?: string
  email?: string
  status?: string
  potencialEstimado?: string
  origem?: string
  observacoes?: string
  responsavelId?: string
}

export async function criarAccount(input: AccountInput) {
  const user = await requireAuth()

  await db.insert(accounts).values({
    organizationId: user.organizationId,
    nome: input.nome,
    cnpj: input.cnpj || null,
    segmento: input.segmento || null,
    cidade: input.cidade || null,
    estado: input.estado || null,
    website: input.website || null,
    telefone: input.telefone || null,
    email: input.email || null,
    status: input.status || 'Ativo',
    potencialEstimado: input.potencialEstimado || null,
    origem: input.origem || null,
    observacoes: input.observacoes || null,
    responsavelId: input.responsavelId || null,
  })

  revalidatePath('/accounts')
}

export async function editarAccount(id: string, input: AccountInput) {
  await requireAuth()

  await db.update(accounts).set({
    nome: input.nome,
    cnpj: input.cnpj || null,
    segmento: input.segmento || null,
    cidade: input.cidade || null,
    estado: input.estado || null,
    website: input.website || null,
    telefone: input.telefone || null,
    email: input.email || null,
    status: input.status || 'Ativo',
    potencialEstimado: input.potencialEstimado || null,
    origem: input.origem || null,
    observacoes: input.observacoes || null,
    responsavelId: input.responsavelId || null,
    updatedAt: new Date(),
  }).where(eq(accounts.id, id))

  revalidatePath('/accounts')
  revalidatePath(`/accounts/${id}`)
}

export async function excluirAccount(id: string) {
  await requireAuth()
  await db.update(contatos).set({ empresaId: null }).where(eq(contatos.empresaId, id))
  await db.delete(accounts).where(eq(accounts.id, id))
  revalidatePath('/accounts')
}

export async function vincularContatoAccount(contatoId: string, accountId: string | null) {
  await requireAuth()
  await db.update(contatos).set({ empresaId: accountId }).where(eq(contatos.id, contatoId))
  revalidatePath(`/accounts/${accountId}`)
  revalidatePath('/crm')
}
