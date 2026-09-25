import { db } from '@/lib/db'
import { propostas } from '@/lib/schema'
import { eq, and, or, desc } from 'drizzle-orm'
import { TabelaInativos } from './TabelaInativos'

export const dynamic = 'force-dynamic'

export default async function InativosPage() {
  const rejeitadas = await db
    .select()
    .from(propostas)
    .where(and(eq(propostas.pilar, 'A'), or(eq(propostas.situacao, 'Rejeitada'), eq(propostas.situacao, 'Declinada'))))
    .orderBy(desc(propostas.dataCriacao))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4F8A]">Propostas Inativas — Reabertura</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Propostas rejeitadas/declinadas do Pilar A que podem ser reativadas (renovações, novos orçamentos)
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/oportunidades" className="text-sm text-[#1B4F8A] hover:underline">← Base EGE</a>
          <a href="/oportunidades/bc" className="text-sm text-[#1B4F8A] hover:underline">Cross-sell B/C</a>
        </div>
      </div>
      <TabelaInativos propostas={rejeitadas as Parameters<typeof TabelaInativos>[0]['propostas']} />
    </div>
  )
}
