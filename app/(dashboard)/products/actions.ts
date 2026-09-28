'use server'

import { db } from '@/lib/db'
import { products, dealProducts } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export type ProductInput = {
  name: string
  description?: string | null
  category?: string | null
  price?: number | null
  unit?: string
  active?: boolean
}

export async function criarProduct(input: ProductInput) {
  const user = await requireAuth()
  await db.insert(products).values({
    organizationId: user.organizationId,
    name: input.name,
    description: input.description || null,
    category: input.category || null,
    price: input.price ? String(input.price) : null,
    unit: input.unit || 'unidade',
    active: input.active ?? true,
  })
  revalidatePath('/products')
}

export async function editarProduct(id: string, input: ProductInput) {
  await requireAuth()
  await db.update(products).set({
    name: input.name,
    description: input.description || null,
    category: input.category || null,
    price: input.price ? String(input.price) : null,
    unit: input.unit || 'unidade',
    active: input.active ?? true,
    updatedAt: new Date(),
  }).where(eq(products.id, id))
  revalidatePath('/products')
}

export async function excluirProduct(id: string) {
  await requireAuth()
  await db.delete(products).where(eq(products.id, id))
  revalidatePath('/products')
}

export type DealProductInput = {
  dealId: string
  productId: string
  quantity?: number
  unitPrice?: number | null
  discount?: number
}

export async function adicionarProdutoAoDeal(input: DealProductInput) {
  await requireAuth()
  await db.insert(dealProducts).values({
    dealId: input.dealId,
    productId: input.productId,
    quantity: String(input.quantity ?? 1),
    unitPrice: input.unitPrice ? String(input.unitPrice) : null,
    discount: String(input.discount ?? 0),
  })
  revalidatePath('/deals')
}

export async function removerProdutoDoDeal(id: string) {
  await requireAuth()
  await db.delete(dealProducts).where(eq(dealProducts.id, id))
  revalidatePath('/deals')
}
