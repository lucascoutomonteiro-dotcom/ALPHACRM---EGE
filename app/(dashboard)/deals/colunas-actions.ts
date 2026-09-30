'use server'

import { db } from '@/lib/db'
import { dealColunas, deals } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'

const DEFAULT_COLS = [
  { nome: 'Quente', cor: '#EF4444', ordem: 0, slug: 'quente' },
  { nome: 'Morno',  cor: '#FBBF24', ordem: 1, slug: 'morno'  },
  { nome: 'Fria',   cor: '#60A5FA', ordem: 2, slug: 'fria'   },
  { nome: 'Perdida',cor: '#6B7280', ordem: 3, slug: 'perdida' },
  { nome: 'Ganho',  cor: '#22C55E', ordem: 4, slug: 'ganho'  },
]

export async function getDealColunas(organizationId: string) {
  const rows = await db.select({
    id: dealColunas.id,
    nome: dealColunas.nome,
    cor: dealColunas.cor,
    ordem: dealColunas.ordem,
    sistema: dealColunas.sistema,
    slug: dealColunas.slug,
  }).from(dealColunas)
    .where(eq(dealColunas.organizationId, organizationId))

  // Se não há colunas, cria os defaults
  if (rows.length === 0) {
    for (const col of DEFAULT_COLS) {
      await db.insert(dealColunas).values({
        organizationId,
        nome: col.nome,
        cor: col.cor,
        ordem: col.ordem,
        sistema: true,
        slug: col.slug,
      })
    }
    return getDealColunas(organizationId)
  }

  return rows.sort((a, b) => a.ordem - b.ordem)
}

export async function criarDealColuna(fd: FormData) {
  const user = await requireAuth()
  const nome = (fd.get('nome') as string)?.trim()
  const cor = (fd.get('cor') as string) || '#9CA3AF'
  if (!nome) return { success: false, error: 'Nome obrigatório' }

  const existingRows = await db.select({ ordem: dealColunas.ordem })
    .from(dealColunas)
    .where(eq(dealColunas.organizationId, user.organizationId))

  // Insere antes da coluna Perdida (sistema, slug='perdida')
  const perdidaRow = await db.select({ ordem: dealColunas.ordem })
    .from(dealColunas)
    .where(and(
      eq(dealColunas.organizationId, user.organizationId),
      eq(dealColunas.slug, 'perdida'),
    ))

  const novaOrdem = perdidaRow.length > 0 ? perdidaRow[0].ordem : existingRows.length

  await db.insert(dealColunas).values({
    organizationId: user.organizationId,
    nome,
    cor,
    ordem: novaOrdem,
    sistema: false,
    slug: null,
  })

  revalidatePath('/deals')
  return { success: true }
}

export async function editarDealColuna(id: string, fd: FormData) {
  const user = await requireAuth()
  const nome = (fd.get('nome') as string)?.trim()
  const cor = (fd.get('cor') as string) || '#9CA3AF'
  if (!nome) return { success: false, error: 'Nome obrigatório' }

  await db.update(dealColunas).set({ nome, cor })
    .where(and(eq(dealColunas.id, id), eq(dealColunas.organizationId, user.organizationId)))

  revalidatePath('/deals')
  return { success: true }
}

export async function excluirDealColuna(id: string) {
  const user = await requireAuth()

  const [col] = await db.select({ sistema: dealColunas.sistema })
    .from(dealColunas)
    .where(and(eq(dealColunas.id, id), eq(dealColunas.organizationId, user.organizationId)))

  if (col?.sistema) return { success: false, error: 'Coluna de sistema não pode ser excluída' }

  // Move deals desta coluna para 'morno'
  await db.update(deals).set({ temperatura: 'morno' })
    .where(and(eq(deals.organizationId, user.organizationId), eq(deals.temperatura, id)))

  await db.delete(dealColunas)
    .where(and(eq(dealColunas.id, id), eq(dealColunas.organizationId, user.organizationId)))

  revalidatePath('/deals')
  return { success: true }
}

export async function reordenarDealColunas(ids: string[]) {
  const user = await requireAuth()
  for (let i = 0; i < ids.length; i++) {
    await db.update(dealColunas).set({ ordem: i })
      .where(and(eq(dealColunas.id, ids[i]), eq(dealColunas.organizationId, user.organizationId)))
  }
  revalidatePath('/deals')
}

export async function atualizarTemperatura(dealId: string, temperatura: string) {
  const user = await requireAuth()
  await db.update(deals).set({
    temperatura,
    status: 'open',
    lossReason: null,
    updatedAt: new Date(),
  }).where(and(eq(deals.id, dealId), eq(deals.organizationId, user.organizationId)))
  revalidatePath('/deals')
}
