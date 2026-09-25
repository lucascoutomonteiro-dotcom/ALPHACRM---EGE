import { db } from '@/lib/db'
import { accounts, contatos } from '@/lib/schema'
import { eq, isNotNull } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { AccountsClient } from './AccountsClient'

export const dynamic = 'force-dynamic'

export default async function AccountsPage() {
  const user = await requireAuth()

  const rows = await db.select({
    id: accounts.id,
    nome: accounts.nome,
    cnpj: accounts.cnpj,
    segmento: accounts.segmento,
    cidade: accounts.cidade,
    estado: accounts.estado,
    website: accounts.website,
    telefone: accounts.telefone,
    email: accounts.email,
    status: accounts.status,
    potencialEstimado: accounts.potencialEstimado,
    origem: accounts.origem,
    observacoes: accounts.observacoes,
    responsavelId: accounts.responsavelId,
  }).from(accounts).where(eq(accounts.organizationId, user.organizationId)).orderBy(accounts.nome)

  const contatosComEmpresa = await db.select({
    empresaId: contatos.empresaId,
  }).from(contatos).where(isNotNull(contatos.empresaId))

  const countMap: Record<string, number> = {}
  for (const c of contatosComEmpresa) {
    if (c.empresaId) countMap[c.empresaId] = (countMap[c.empresaId] ?? 0) + 1
  }

  const rowsComCount = rows.map(r => ({ ...r, totalContatos: countMap[r.id] ?? 0 }))

  return <AccountsClient accounts={rowsComCount} />
}
