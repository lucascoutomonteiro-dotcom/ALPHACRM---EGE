import { db } from '@/lib/db'
import { deals } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { DealsClient } from './DealsClient'
import { getDealColunas } from './colunas-actions'

export const dynamic = 'force-dynamic'

export default async function DealsPage() {
  const user = await requireAuth()

  try {
    const rows = await db.select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      probability: deals.probability,
      contatoId: deals.contatoId,
      status: deals.status,
      temperatura: deals.temperatura,
      expectedCloseDate: deals.expectedCloseDate,
      lossReason: deals.lossReason,
      description: deals.description,
      createdAt: deals.createdAt,
    }).from(deals).where(eq(deals.organizationId, user.organizationId))

    const colunas = await getDealColunas(user.organizationId)

    const contatoRows: { id: string; nome: string | null }[] = []

    return (
      <DealsClient
        deals={rows}
        colunas={colunas}
        contatos={contatoRows}
      />
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return <div className="p-6 bg-red-50 text-red-700 rounded-xl text-sm font-mono whitespace-pre-wrap">{msg}</div>
  }
}
