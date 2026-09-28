import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { ProductsClient } from './ProductsClient'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const user = await requireAuth()

  try {
    const rows = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      category: products.category,
      price: products.price,
      unit: products.unit,
      active: products.active,
    }).from(products)
      .where(eq(products.organizationId, user.organizationId))

    return <ProductsClient products={rows} />
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return <div className="p-6 bg-red-50 text-red-700 rounded-xl text-sm font-mono whitespace-pre-wrap">{msg}</div>
  }
}
