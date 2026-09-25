'use server'

import { db } from '@/lib/db'
import { crmColunas, contatos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function listarColunas() {
  return db.select().from(crmColunas).orderBy(crmColunas.ordem)
}

export async function criarColuna(fd: FormData) {
  const nome = (fd.get('nome') as string).trim()
  const cor = (fd.get('cor') as string) || '#9CA3AF'
  if (!nome) return { success: false, error: 'Nome obrigatório' }
  try {
    const todas = await db.select({ ordem: crmColunas.ordem }).from(crmColunas).orderBy(crmColunas.ordem)
    const maxOrdem = todas.length ? Math.max(...todas.map((c) => c.ordem)) : -1
    await db.insert(crmColunas).values({ nome, cor, ordem: maxOrdem + 1, sistema: false })
    revalidatePath('/crm')
    return { success: true }
  } catch {
    return { success: false, error: 'Nome já existe' }
  }
}

export async function editarColuna(id: string, fd: FormData) {
  const novoNome = (fd.get('nome') as string).trim()
  const cor = (fd.get('cor') as string) || '#9CA3AF'
  if (!novoNome) return { success: false, error: 'Nome obrigatório' }
  try {
    const [atual] = await db.select({ nome: crmColunas.nome, sistema: crmColunas.sistema }).from(crmColunas).where(eq(crmColunas.id, id))
    if (!atual) return { success: false, error: 'Coluna não encontrada' }
    const nomeAnterior = atual.nome
    await db.update(crmColunas).set({ nome: novoNome, cor }).where(eq(crmColunas.id, id))
    // Atualiza contatos se nome mudou
    if (nomeAnterior !== novoNome) {
      await db.update(contatos).set({ status: novoNome }).where(eq(contatos.status, nomeAnterior))
    }
    revalidatePath('/crm')
    return { success: true }
  } catch {
    return { success: false, error: 'Nome já existe' }
  }
}

export async function excluirColuna(id: string) {
  const [col] = await db.select().from(crmColunas).where(eq(crmColunas.id, id))
  if (!col) return { success: false, error: 'Coluna não encontrada' }
  if (col.sistema) return { success: false, error: 'Coluna do sistema não pode ser excluída' }
  const [comContatos] = await db.select({ id: contatos.id }).from(contatos).where(eq(contatos.status, col.nome)).limit(1)
  if (comContatos) return { success: false, error: `Existem contatos em "${col.nome}". Mova-os antes de excluir.` }
  await db.delete(crmColunas).where(eq(crmColunas.id, id))
  revalidatePath('/crm')
  return { success: true }
}

export async function reordenarColunas(ids: string[]) {
  await Promise.all(ids.map((id, i) => db.update(crmColunas).set({ ordem: i }).where(eq(crmColunas.id, id))))
  revalidatePath('/crm')
  return { success: true }
}
