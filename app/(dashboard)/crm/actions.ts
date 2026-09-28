'use server'

import { db } from '@/lib/db'
import { contatos, interacoes, crmEventos, metas } from '@/lib/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/session'
import { STATUS_SEM_CONTAGEM } from '@/lib/constants'

// Incrementa contador em metas — ignora duplicata (unique constraint em crm_eventos)
async function incrementarMeta(
  contatoId: string,
  tipo: string,
  campo: 'realizadoProspeccoes' | 'realizadoPropostas' | 'realizadoReunioes',
  mes: number,
  ano: number
) {
  try {
    await db.insert(crmEventos).values({ contatoId, tipo, mes, ano })
    await db.insert(metas).values({ mes, ano, [campo]: 1 }).onConflictDoUpdate({
      target: [metas.mes, metas.ano],
      set: { [campo]: sql`${metas[campo]} + 1` },
    })
  } catch {
    // Conflito = já contabilizado neste mês → ignora
  }
}

function mesAnoAtual() {
  const agora = new Date()
  const mes = Number(agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'numeric' }))
  const ano = Number(agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric' }))
  return { mes, ano }
}

export async function salvarContato(fd: FormData) {
  try {
    const id = fd.get('id') as string
    const status = (fd.get('status') as string) || 'Nunca Contatado'
    const data = {
      nome: (fd.get('nome') as string) || null,
      empresa: (fd.get('empresa') as string) || null,
      cidade: (fd.get('cidade') as string) || null,
      cargo: (fd.get('cargo') as string) || null,
      telefone: (fd.get('telefone') as string) || null,
      email: (fd.get('email') as string) || null,
      canal: (fd.get('canal') as string) || null,
      origem: (fd.get('origem') as string) || null,
      status,
      proximaAtividade: (fd.get('proximaAtividade') as string) || null,
      historico: (fd.get('historico') as string) || null,
      segmento: (fd.get('segmento') as string) || null,
      valorEstimado: (fd.get('valorEstimado') as string) || null,
      probabilidade: fd.get('probabilidade') ? Number(fd.get('probabilidade')) : null,
      tipoCliente: (fd.get('tipoCliente') as string) || null,
      gerouOportunidade: fd.get('gerouOportunidade') === 'true',
      servicoOportunidade: (fd.get('servicoOportunidade') as string) || null,
      updatedAt: new Date(),
    }
    if (id) {
      await db.update(contatos).set(data).where(eq(contatos.id, id))
    } else {
      const [novo] = await db.insert(contatos).values({ ...data, dataPrimeiroContato: new Date().toISOString().split('T')[0] }).returning({ id: contatos.id })
      // Novo contato já em coluna ativa → conta prospecção + triggers
      if (novo && !STATUS_SEM_CONTAGEM.includes(status) && status !== 'Nunca Contatado') {
        const { mes, ano } = mesAnoAtual()
        await incrementarMeta(novo.id, 'prospecao', 'realizadoProspeccoes', mes, ano)
        if (status === 'Proposta Enviada') await incrementarMeta(novo.id, 'proposta', 'realizadoPropostas', mes, ano)
        if (status === 'Reunião/Visita') await incrementarMeta(novo.id, 'reuniao', 'realizadoReunioes', mes, ano)
      }
    }
    revalidatePath('/crm')
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function registrarInteracao(fd: FormData) {
  try {
    const contatoId = fd.get('contatoId') as string
    const tipo = fd.get('tipo') as string
    const descricao = (fd.get('descricao') as string) || null
    const proximoPasso = (fd.get('proximoPasso') as string) || null
    const dataProximoPasso = (fd.get('dataProximoPasso') as string) || null
    const proximaAtividade = (fd.get('proximaAtividade') as string) || null
    const usuarioId = (fd.get('usuarioId') as string) || null

    const gerouOportunidade = fd.get('gerouOportunidade') === 'true'
    const servicoOportunidade = (fd.get('servicoOportunidade') as string) || null
    await db.insert(interacoes).values({ contatoId, tipo, descricao, proximoPasso, dataProximoPasso, usuarioId, gerouOportunidade, servicoOportunidade })

    // Atualiza historico do contato com o resumo da última interação (para aparecer no balão do dashboard)
    const dataStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const resumo = [tipo, descricao].filter(Boolean).join(': ')
    const novoHistorico = `${dataStr} — ${resumo}${proximoPasso ? ` | Próx: ${proximoPasso}` : ''}`

    const contatoUpdate: Record<string, unknown> = {
      historico: novoHistorico,
      ultimaInteracao: new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    }
    if (proximaAtividade) contatoUpdate.proximaAtividade = proximaAtividade

    await db.update(contatos).set(contatoUpdate).where(eq(contatos.id, contatoId))

    revalidatePath(`/crm/${contatoId}`)
    // Revalida /crm para outros usuários verem a interação; '/' para atualizar follow-ups no dashboard
    revalidatePath('/crm')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function atualizarStatusContato(id: string, novoStatus: string) {
  try {
    // Busca status atual antes de atualizar
    const [atual] = await db.select({ status: contatos.status }).from(contatos).where(eq(contatos.id, id))
    const statusAnterior = atual?.status ?? 'Nunca Contatado'

    const STATUS_ZERA_FOLLOWUP = ['Proposta Enviada', 'Fechado Ganho', 'Fechado Perdido', 'Inativo']
    const zerarFollowup = STATUS_ZERA_FOLLOWUP.includes(novoStatus)
    await db.update(contatos).set({
      status: novoStatus,
      updatedAt: new Date(),
      ...(zerarFollowup ? { proximaAtividade: null } : {}),
    }).where(eq(contatos.id, id))

    // Só dispara contadores se o novo status não for "Demanda Lucas" nem "Nunca Contatado"
    if (!STATUS_SEM_CONTAGEM.includes(novoStatus)) {
      const { mes, ano } = mesAnoAtual()
      // Prospecção: saiu de "Nunca Contatado" para qualquer coluna ativa
      if (statusAnterior === 'Nunca Contatado') {
        await incrementarMeta(id, 'prospecao', 'realizadoProspeccoes', mes, ano)
      }
      // Proposta: entrou em "Proposta Enviada"
      if (novoStatus === 'Proposta Enviada' && statusAnterior !== 'Proposta Enviada') {
        await incrementarMeta(id, 'proposta', 'realizadoPropostas', mes, ano)
      }
      // Reunião/Visita: entrou em "Reunião/Visita"
      if (novoStatus === 'Reunião/Visita' && statusAnterior !== 'Reunião/Visita') {
        await incrementarMeta(id, 'reuniao', 'realizadoReunioes', mes, ano)
      }
    }

    revalidatePath('/crm')
    // Revalida dashboard só quando algo que afeta os contadores mudou
    const afetaMetas = statusAnterior === 'Nunca Contatado'
      || novoStatus === 'Proposta Enviada' || statusAnterior === 'Proposta Enviada'
      || novoStatus === 'Reunião/Visita'   || statusAnterior === 'Reunião/Visita'
    if (afetaMetas) revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function decrementarReuniao(contatoId: string) {
  try {
    const { mes, ano } = mesAnoAtual()
    // Remove o evento para permitir re-contagem futura
    await db.delete(crmEventos).where(
      and(
        eq(crmEventos.contatoId, contatoId),
        eq(crmEventos.tipo, 'reuniao'),
        eq(crmEventos.mes, mes),
        eq(crmEventos.ano, ano),
      )
    )
    // Decrementa o contador (mínimo 0)
    await db.update(metas).set({
      realizadoReunioes: sql`GREATEST(0, ${metas.realizadoReunioes} - 1)`,
    }).where(and(eq(metas.mes, mes), eq(metas.ano, ano)))
    revalidatePath('/')
  } catch { /* ignora */ }
}

export async function toggleUrgente(id: string, urgente: boolean) {
  // Sem revalidatePath — o optimistic update local já reflete a mudança na UI
  await db.update(contatos).set({ urgente, updatedAt: new Date() }).where(eq(contatos.id, id))
  return { success: true }
}

export async function deletarContato(id: string) {
  await db.delete(contatos).where(eq(contatos.id, id))
  revalidatePath('/crm')
}

export async function buscarInteracoesContato(contatoId: string) {
  await requireAuth()
  return db.select({
    id: interacoes.id,
    tipo: interacoes.tipo,
    descricao: interacoes.descricao,
    proximoPasso: interacoes.proximoPasso,
    dataProximoPasso: interacoes.dataProximoPasso,
    dataInteracao: interacoes.dataInteracao,
  }).from(interacoes)
    .where(eq(interacoes.contatoId, contatoId))
    .orderBy(desc(interacoes.dataInteracao))
    .limit(10)
}
