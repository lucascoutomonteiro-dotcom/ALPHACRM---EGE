import { db } from '@/lib/db'
import { leads } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { LeadsClient } from './LeadsClient'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const user = await requireAuth()
  const rows = await db.select({
    id: leads.id,
    nome: leads.nome,
    email: leads.email,
    telefone: leads.telefone,
    empresa: leads.empresa,
    cargo: leads.cargo,
    origem: leads.origem,
    status: leads.status,
    score: leads.score,
    responsavelId: leads.responsavelId,
    observacoes: leads.observacoes,
    contatoId: leads.contatoId,
    createdAt: leads.createdAt,
  }).from(leads).where(eq(leads.organizationId, user.organizationId)).orderBy(leads.createdAt)

  return <LeadsClient leads={rows} />
}
