import { db } from '@/lib/db'
import { contatos, interacoes, timelineEvents, customFields, customFieldValues, deals, stages, dealProducts, products } from '@/lib/schema'
import { eq, desc, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { requireAuth } from '@/lib/session'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { DetalheContatoClient } from './DetalheContatoClient'
import { CustomFieldsPanel } from '@/components/shared/CustomFieldsPanel'
import { DealsSection } from './DealsSection'
import { Phone, Mail, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DetalheContatoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id ?? ''
  const user = await requireAuth()

  const [contato] = await db.select({
    id: contatos.id,
    nome: contatos.nome,
    empresa: contatos.empresa,
    cidade: contatos.cidade,
    cnpj: contatos.cnpj,
    cargo: contatos.cargo,
    telefone: contatos.telefone,
    email: contatos.email,
    origem: contatos.origem,
    canal: contatos.canal,
    dataPrimeiroContato: contatos.dataPrimeiroContato,
    status: contatos.status,
    proximaAtividade: contatos.proximaAtividade,
    ultimaInteracao: contatos.ultimaInteracao,
    historico: contatos.historico,
    segmento: contatos.segmento,
    servicoInteresse: contatos.servicoInteresse,
    valorEstimado: contatos.valorEstimado,
    numeroProposta: contatos.numeroProposta,
    probabilidade: contatos.probabilidade,
    urgente: contatos.urgente,
    tipoCliente: contatos.tipoCliente,
    gerouOportunidade: contatos.gerouOportunidade,
    servicoOportunidade: contatos.servicoOportunidade,
    responsavelId: contatos.responsavelId,
    createdAt: contatos.createdAt,
    updatedAt: contatos.updatedAt,
  }).from(contatos).where(eq(contatos.id, id))
  if (!contato) notFound()

  const historico = await db.select({
    id: interacoes.id,
    contatoId: interacoes.contatoId,
    dataInteracao: interacoes.dataInteracao,
    tipo: interacoes.tipo,
    descricao: interacoes.descricao,
    proximoPasso: interacoes.proximoPasso,
    dataProximoPasso: interacoes.dataProximoPasso,
    usuarioId: interacoes.usuarioId,
    gerouOportunidade: interacoes.gerouOportunidade,
    servicoOportunidade: interacoes.servicoOportunidade,
  }).from(interacoes)
    .where(eq(interacoes.contatoId, id))
    .orderBy(desc(interacoes.dataInteracao))

  const tlEvents = await db.select({
    id: timelineEvents.id,
    eventType: timelineEvents.eventType,
    title: timelineEvents.title,
    description: timelineEvents.description,
    createdAt: timelineEvents.createdAt,
  }).from(timelineEvents)
    .where(eq(timelineEvents.entityId, id))
    .orderBy(desc(timelineEvents.createdAt))

  const camposContato = await db.select({
    id: customFields.id,
    label: customFields.label,
    fieldType: customFields.fieldType,
    options: customFields.options,
    required: customFields.required,
  }).from(customFields)
    .where(and(
      eq(customFields.organizationId, user.organizationId),
      eq(customFields.entityType, 'contato'),
      eq(customFields.active, true),
    ))

  const valoresContato = camposContato.length > 0
    ? await db.select({
        fieldId: customFieldValues.fieldId,
        value: customFieldValues.value,
      }).from(customFieldValues)
        .where(eq(customFieldValues.entityId, id))
    : []

  const camposComValor = camposContato.map(c => ({
    ...c,
    value: valoresContato.find(v => v.fieldId === c.id)?.value ?? null,
  }))

  // Deals vinculados ao contato
  const dealsDoContato = await db.select({
    id: deals.id,
    title: deals.title,
    value: deals.value,
    status: deals.status,
    probability: deals.probability,
    expectedCloseDate: deals.expectedCloseDate,
    lossReason: deals.lossReason,
    description: deals.description,
    stageId: deals.stageId,
    createdAt: deals.createdAt,
    updatedAt: deals.updatedAt,
  }).from(deals)
    .where(eq(deals.contatoId, id))
    .orderBy(desc(deals.createdAt))

  // Stages da organização (mapa id → nome)
  const allStages = await db.select({ id: stages.id, name: stages.name }).from(stages)
  const stageMap = Object.fromEntries(allStages.map(s => [s.id, s.name]))

  // Produtos de cada deal — sequencial para compatibilidade com Neon HTTP
  const dealComProdutos: Record<string, { productName: string | null; quantity: string | null; unitPrice: string | null }[]> = {}
  for (const deal of dealsDoContato) {
    const prods = await db.select({
      productName: products.name,
      quantity: dealProducts.quantity,
      unitPrice: dealProducts.unitPrice,
    }).from(dealProducts)
      .where(eq(dealProducts.dealId, deal.id))
      .leftJoin(products, eq(dealProducts.productId, products.id))
    dealComProdutos[deal.id] = prods
  }

  const dealsEnriquecidos = dealsDoContato.map(d => ({
    ...d,
    stageName: d.stageId ? (stageMap[d.stageId] ?? null) : null,
    produtos: dealComProdutos[d.id] ?? [],
  }))

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">{contato.nome || 'Sem nome'}</h1>
            <p className="text-gray-500">{contato.cargo} {contato.cargo && contato.empresa ? '·' : ''} {contato.empresa}</p>
          </div>
          <StatusBadge status={contato.status} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {contato.telefone && (
            <a href={`tel:${contato.telefone}`} className="flex items-center gap-1 hover:text-[#1B4F8A]">
              <Phone className="h-4 w-4" />{contato.telefone}
            </a>
          )}
          {contato.email && (
            <a href={`mailto:${contato.email}`} className="flex items-center gap-1 hover:text-[#1B4F8A]">
              <Mail className="h-4 w-4" />{contato.email}
            </a>
          )}
          {contato.cidade && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />{contato.cidade}
            </span>
          )}
        </div>
        {contato.historico && (
          <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            {contato.historico}
          </div>
        )}
        <DetalheContatoClient contato={contato as Parameters<typeof DetalheContatoClient>[0]['contato']} userId={userId} />
      </div>

      {camposComValor.length > 0 && (
        <CustomFieldsPanel campos={camposComValor} entityType="contato" entityId={id} />
      )}

      <DealsSection deals={dealsEnriquecidos} contatoId={id} />

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4 text-sm">Linha do Tempo</h2>
        {tlEvents.length === 0 && historico.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma interação registrada.</p>
        ) : (
          <div className="space-y-0">
            {/* Eventos da nova timeline */}
            {tlEvents.map((e, i) => {
              const isLast = i === tlEvents.length - 1 && historico.length === 0
              const dotColor =
                e.eventType === 'deal_won' ? 'bg-green-500' :
                e.eventType === 'deal_lost' ? 'bg-red-400' :
                e.eventType === 'lead_converted' ? 'bg-purple-500' :
                e.eventType === 'activity_logged' ? 'bg-yellow-400' :
                'bg-[#1B4F8A]'
              return (
                <div key={e.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                    {!isLast && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                  </div>
                  <div className="pb-3 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-medium">{e.title}</span>
                      <span className="text-xs text-gray-400">
                        {e.createdAt ? new Date(e.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {e.description && <p className="text-gray-500 text-xs">{e.description}</p>}
                  </div>
                </div>
              )
            })}
            {/* Interações antigas */}
            {historico.map((h, i) => {
              const isLast = i === historico.length - 1
              return (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    {!isLast && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                  </div>
                  <div className="pb-3 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-600">{h.tipo}</span>
                      <span className="text-xs text-gray-400">
                        {h.dataInteracao ? new Date(h.dataInteracao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {h.descricao && <p className="text-gray-600">{h.descricao}</p>}
                    {h.proximoPasso && (
                      <p className="text-xs text-[#1B4F8A] mt-1">Próximo: {h.proximoPasso} {h.dataProximoPasso ? `(${h.dataProximoPasso})` : ''}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
