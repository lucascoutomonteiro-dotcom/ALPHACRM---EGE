import { db } from '@/lib/db'
import { contatos, users, crmColunas, clientesEge, interacoesEge } from '@/lib/schema'
import { auth } from '@/auth'
import { eq, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { TabelaContatos } from '@/components/crm/TabelaContatos'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function CRMPage() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const userId = (session?.user as { id?: string })?.id ?? ''

  // Seleciona apenas as colunas usadas na tabela — exclui cnpj, numeroProposta, servicoInteresse, etc.
  const campos = {
    id: contatos.id,
    nome: contatos.nome,
    empresa: contatos.empresa,
    cidade: contatos.cidade,
    cargo: contatos.cargo,
    telefone: contatos.telefone,
    email: contatos.email,
    canal: contatos.canal,
    origem: contatos.origem,
    status: contatos.status,
    proximaAtividade: contatos.proximaAtividade,
    ultimaInteracao: contatos.ultimaInteracao,
    historico: contatos.historico,
    segmento: contatos.segmento,
    valorEstimado: contatos.valorEstimado,
    probabilidade: contatos.probabilidade,
    urgente: contatos.urgente,
    tipoCliente: contatos.tipoCliente,
  }

  let lista
  if (role === 'sdr') {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, session?.user?.email ?? ''))
    lista = user ? await db.select(campos).from(contatos).where(eq(contatos.responsavelId, user.id)) : []
  } else {
    lista = await db.select(campos).from(contatos)
  }

  const colunas = await db.select({
    id: crmColunas.id,
    nome: crmColunas.nome,
    cor: crmColunas.cor,
    ordem: crmColunas.ordem,
    sistema: crmColunas.sistema,
  }).from(crmColunas).orderBy(crmColunas.ordem)

  // Follow-ups agendados em Oportunidades (interacoesEge com dataProximoPasso)
  let egeFollowups: { id: string; nome: string; localidade: string | null; proximaAtividade: string; ultimaInteracao: string | null }[] = []
  try {
    const rows = await db
      .select({
        id: clientesEge.id,
        nome: clientesEge.cliente,
        localidade: clientesEge.local,
        proximaAtividade: interacoesEge.dataProximoPasso,
        dataInteracao: interacoesEge.dataInteracao,
        tipo: interacoesEge.tipo,
        descricao: interacoesEge.descricao,
      })
      .from(interacoesEge)
      .innerJoin(clientesEge, eq(interacoesEge.clienteEgeId, clientesEge.id))
      .where(sql`${interacoesEge.dataProximoPasso} IS NOT NULL`)
      .orderBy(desc(interacoesEge.dataInteracao))

    const visto = new Set<string>()
    for (const r of rows) {
      if (!visto.has(r.id) && r.proximaAtividade) {
        visto.add(r.id)
        egeFollowups.push({
          id: r.id,
          nome: r.nome,
          localidade: r.localidade,
          proximaAtividade: r.proximaAtividade as string,
          ultimaInteracao: r.dataInteracao
            ? `${new Date(r.dataInteracao as unknown as string).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })} — ${r.tipo}${r.descricao ? ': ' + r.descricao : ''}`
            : null,
        })
      }
    }
  } catch { /* interacoes_ege pode não existir */ }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1B4F8A]">CRM — Prospecção</h1>
      <Suspense fallback={null}>
        <TabelaContatos
          contatos={lista as Parameters<typeof TabelaContatos>[0]['contatos']}
          userId={userId}
          colunas={colunas}
          egeFollowups={egeFollowups}
        />
      </Suspense>
    </div>
  )
}
