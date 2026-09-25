'use server'

import { db } from '@/lib/db'
import { clientesEge, oportunidadesBc, interacoesEge, keyAccounts, kaStakeholders, kaPenetracao } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { calcularHealthScore } from '@/lib/ka-health'
import { max } from 'drizzle-orm'

export async function atualizarClienteEge(id: string, data: Partial<typeof clientesEge.$inferInsert>) {
  await db.update(clientesEge).set({ ...data, updatedAt: new Date() }).where(eq(clientesEge.id, id))
  revalidatePath('/oportunidades')
}

export async function criarClienteEge(data: {
  cliente: string
  local: string
  classificacao: string
  statusAcao: string
  contatoNome?: string
}) {
  await db.insert(clientesEge).values({
    cliente: data.cliente,
    local: data.local,
    classificacao: data.classificacao,
    statusAcao: data.statusAcao,
    contatoNome: data.contatoNome ?? null,
    updatedAt: new Date(),
  })
  revalidatePath('/oportunidades')
}

export async function registrarInteracaoEge(clienteEgeId: string, data: {
  tipo: string
  descricao: string
  proximoPasso?: string
  dataProximoPasso?: string
  gerouOportunidade?: boolean
  servicoOportunidade?: string
}) {
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id
  await db.insert(interacoesEge).values({
    clienteEgeId,
    tipo: data.tipo,
    descricao: data.descricao,
    proximoPasso: data.proximoPasso ?? null,
    dataProximoPasso: data.dataProximoPasso ?? null,
    usuarioId: userId ?? null,
    gerouOportunidade: data.gerouOportunidade ?? false,
    servicoOportunidade: data.servicoOportunidade ?? null,
  })
  revalidatePath('/oportunidades')
  // Atualiza dashboard — interações EGE afetam gráfico de atividade e conversão
  revalidatePath('/')
}

export async function buscarInteracoesEge(clienteEgeId: string) {
  return db.select().from(interacoesEge)
    .where(eq(interacoesEge.clienteEgeId, clienteEgeId))
    .orderBy(desc(interacoesEge.dataInteracao))
}

export async function editarInteracaoEge(id: string, data: {
  tipo: string
  descricao: string
  proximoPasso?: string
  dataProximoPasso?: string
  gerouOportunidade?: boolean
  servicoOportunidade?: string
}) {
  await db.update(interacoesEge).set({
    tipo: data.tipo,
    descricao: data.descricao,
    proximoPasso: data.proximoPasso ?? null,
    dataProximoPasso: data.dataProximoPasso ?? null,
    gerouOportunidade: data.gerouOportunidade ?? false,
    servicoOportunidade: data.servicoOportunidade ?? null,
  }).where(eq(interacoesEge.id, id))
  revalidatePath('/oportunidades')
  revalidatePath('/')
}

export async function excluirInteracaoEge(id: string) {
  await db.delete(interacoesEge).where(eq(interacoesEge.id, id))
  revalidatePath('/oportunidades')
  revalidatePath('/')
}

// ── KAM integrado às Oportunidades ───────────────────────────────────────────

async function getOrCreateKAId(clienteEgeId: string): Promise<string> {
  const [ka] = await db.select({ id: keyAccounts.id }).from(keyAccounts).where(eq(keyAccounts.clienteEgeId, clienteEgeId))
  if (ka) return ka.id
  const [c] = await db.select({ nome: clientesEge.cliente }).from(clientesEge).where(eq(clientesEge.id, clienteEgeId))
  const [novo] = await db.insert(keyAccounts).values({
    clienteEgeId,
    nome: c?.nome ?? 'Sem nome',
    status: 'Ativa',
    prioridade: 'MEDIA',
  }).returning({ id: keyAccounts.id })
  return novo.id
}

async function recalcularHealthKA(kaId: string) {
  try {
    const stks = await db.select().from(kaStakeholders).where(eq(kaStakeholders.keyAccountId, kaId))
    const [uv] = await db.select({ data: max(interacoesEge.dataProximoPasso) }).from(interacoesEge)
      .where(eq(interacoesEge.clienteEgeId,
        (await db.select({ cid: keyAccounts.clienteEgeId }).from(keyAccounts).where(eq(keyAccounts.id, kaId)))[0]?.cid ?? ''
      ))
    const [ka] = await db.select().from(keyAccounts).where(eq(keyAccounts.id, kaId))
    if (!ka) return
    const result = calcularHealthScore({
      stakeholders: stks.map(s => ({
        nivelPoder: s.nivelPoder, posicionamento: s.posicionamento,
        nivelRelacionamento: s.nivelRelacionamento ?? null,
        qualificacaoStatus: s.qualificacaoStatus ?? 'PENDENTE',
        departamento: s.departamento ?? null,
      })),
      ultimaVisita: uv?.data ?? null,
      totalVisitas: 0,
      temProximaAcao: !!ka.proximaAcao,
      temOportunidadesAbertas: false,
      temServicosPotencial: (ka.servicosPotencial?.length ?? 0) > 0,
    })
    await db.update(keyAccounts).set({ healthScore: result.score, healthStatus: result.status }).where(eq(keyAccounts.id, kaId))
  } catch { /* não bloqueia */ }
}

export async function buscarKAMEge(clienteEgeId: string) {
  const [ka] = await db.select().from(keyAccounts).where(eq(keyAccounts.clienteEgeId, clienteEgeId))
  if (!ka) return null
  const stakeholders = await db.select().from(kaStakeholders).where(eq(kaStakeholders.keyAccountId, ka.id))
    .orderBy(desc(kaStakeholders.updatedAt))
  const penetracao = await db.select().from(kaPenetracao).where(eq(kaPenetracao.keyAccountId, ka.id))
  return { ka, stakeholders, penetracao }
}

export async function salvarKAMPlano(clienteEgeId: string, fd: FormData) {
  try {
    const kaId = await getOrCreateKAId(clienteEgeId)
    await db.update(keyAccounts).set({
      plano30d: (fd.get('plano30d') as string) || null,
      plano90d: (fd.get('plano90d') as string) || null,
      barreiras: (fd.get('barreiras') as string) || null,
      estrategia: (fd.get('estrategia') as string) || null,
      estrategiaExpansao: (fd.get('estrategiaExpansao') as string) || null,
      proximaAcao: (fd.get('proximaAcao') as string) || null,
      proximaAcaoData: (fd.get('proximaAcaoData') as string) || null,
      proximaAcaoResponsavel: (fd.get('proximaAcaoResponsavel') as string) || null,
      updatedAt: new Date(),
    }).where(eq(keyAccounts.id, kaId))
    revalidatePath('/oportunidades')
    revalidatePath('/key-accounts')
    return { success: true }
  } catch { return { success: false } }
}

export async function salvarKAMStakeholder(clienteEgeId: string, fd: FormData) {
  try {
    const kaId = await getOrCreateKAId(clienteEgeId)
    const id = fd.get('id') as string
    const data = {
      keyAccountId: kaId,
      nome: (fd.get('nome') as string) || '',
      cargo: (fd.get('cargo') as string) || null,
      departamento: (fd.get('departamento') as string) || null,
      email: (fd.get('email') as string) || null,
      telefone: (fd.get('telefone') as string) || null,
      nivelPoder: (fd.get('nivelPoder') as string) || 'INFLUENCIADOR_TECNICO',
      posicionamento: (fd.get('posicionamento') as string) || 'NEUTRO',
      nivelRelacionamento: (fd.get('nivelRelacionamento') as string) || 'FRIO',
      qualificacaoStatus: (fd.get('qualificacaoStatus') as string) || 'QUALIFICADO',
      updatedAt: new Date(),
    }
    if (id) await db.update(kaStakeholders).set(data).where(eq(kaStakeholders.id, id))
    else await db.insert(kaStakeholders).values(data)
    await recalcularHealthKA(kaId)
    revalidatePath('/oportunidades')
    return { success: true }
  } catch { return { success: false } }
}

export async function excluirKAMStakeholder(stakeholderId: string, clienteEgeId: string) {
  await db.delete(kaStakeholders).where(eq(kaStakeholders.id, stakeholderId))
  const [ka] = await db.select({ id: keyAccounts.id }).from(keyAccounts).where(eq(keyAccounts.clienteEgeId, clienteEgeId))
  if (ka) await recalcularHealthKA(ka.id)
  revalidatePath('/oportunidades')
}

export async function ciclarKAMCobertura(clienteEgeId: string, departamento: string, novoStatus: string) {
  try {
    const kaId = await getOrCreateKAId(clienteEgeId)
    const existing = (await db.select().from(kaPenetracao).where(eq(kaPenetracao.keyAccountId, kaId)))
      .find(p => p.departamento === departamento)
    if (existing) {
      await db.update(kaPenetracao).set({ status: novoStatus, updatedAt: new Date() }).where(eq(kaPenetracao.id, existing.id))
    } else {
      await db.insert(kaPenetracao).values({ keyAccountId: kaId, departamento, status: novoStatus })
    }
    revalidatePath('/oportunidades')
    return { success: true }
  } catch { return { success: false } }
}

export async function atualizarOportunidadeBc(id: string, data: Partial<typeof oportunidadesBc.$inferInsert>) {
  await db.update(oportunidadesBc).set(data).where(eq(oportunidadesBc.id, id))
  revalidatePath('/oportunidades/bc')
}

export async function excluirOportunidadeBc(id: string) {
  await db.delete(oportunidadesBc).where(eq(oportunidadesBc.id, id))
  revalidatePath('/oportunidades/bc')
}
