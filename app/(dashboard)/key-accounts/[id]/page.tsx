import { db } from '@/lib/db'
import { keyAccounts, kaStakeholders, kaVisitas, kaPenetracao } from '@/lib/schema'
import { eq, desc, isNull } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { KADetail } from '@/components/key-accounts/KADetail'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function KeyAccountDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab } = await searchParams

  const [conta] = await db
    .select()
    .from(keyAccounts)
    .where(eq(keyAccounts.id, id))

  if (!conta || conta.archivedAt) notFound()

  const [stakeholders, visitas, penetracao] = await Promise.all([
    db.select().from(kaStakeholders).where(eq(kaStakeholders.keyAccountId, id)).orderBy(kaStakeholders.nome),
    db.select().from(kaVisitas).where(eq(kaVisitas.keyAccountId, id)).orderBy(desc(kaVisitas.data)),
    db.select().from(kaPenetracao).where(eq(kaPenetracao.keyAccountId, id)),
  ])

  return (
    <KADetail
      conta={conta}
      stakeholders={stakeholders}
      visitas={visitas}
      penetracao={penetracao}
      tabInicial={tab ?? 'visao'}
    />
  )
}
