'use server'

import { db } from '@/lib/db'
import { keyAccounts, kaStakeholders, kaVisitas, kaPenetracao } from '@/lib/schema'
import { eq, desc, max } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { calcularHealthScore } from '@/lib/ka-health'

// Recalcula e persiste o health score de uma KA
async function recalcularHealth(kaId: string) {
  try {
    const stakeholders = await db.select().from(kaStakeholders).where(eq(kaStakeholders.keyAccountId, kaId))
    const [ultimaVisita] = await db
      .select({ data: max(kaVisitas.data) })
      .from(kaVisitas)
      .where(eq(kaVisitas.keyAccountId, kaId))
    const visitas = await db.select().from(kaVisitas).where(eq(kaVisitas.keyAccountId, kaId))
    const [ka] = await db.select().from(keyAccounts).where(eq(keyAccounts.id, kaId))
    if (!ka) return

    const result = calcularHealthScore({
      stakeholders,
      ultimaVisita: ultimaVisita?.data ?? null,
      totalVisitas: visitas.length,
      temProximaAcao: !!ka.proximaAcao,
      temOportunidadesAbertas: false, // integrar com propostas futuramente
      temServicosPotencial: (ka.servicosPotencial?.length ?? 0) > 0,
    })

    await db.update(keyAccounts).set({
      healthScore: result.score,
      healthStatus: result.status,
    }).where(eq(keyAccounts.id, kaId))
  } catch {
    // não bloqueia a operação principal
  }
}

// ── KEY ACCOUNTS ──────────────────────────────

export async function salvarKeyAccount(fd: FormData) {
  try {
    const id = fd.get('id') as string
    const servicosContratados = fd.getAll('servicosContratados') as string[]
    const servicosPotencial = fd.getAll('servicosPotencial') as string[]

    const data = {
      nome: (fd.get('nome') as string) || '',
      cnpj: (fd.get('cnpj') as string) || null,
      segmento: (fd.get('segmento') as string) || null,
      cidade: (fd.get('cidade') as string) || null,
      estado: (fd.get('estado') as string) || null,
      site: (fd.get('site') as string) || null,
      observacoes: (fd.get('observacoes') as string) || null,
      status: (fd.get('status') as string) || 'Em Desenvolvimento',
      prioridade: (fd.get('prioridade') as string) || 'MEDIA',
      potencialEstimado: (fd.get('potencialEstimado') as string) || null,
      receitaAnual: (fd.get('receitaAnual') as string) || null,
      servicosContratados: servicosContratados.filter(Boolean),
      servicosPotencial: servicosPotencial.filter(Boolean),
      updatedAt: new Date(),
    }

    let savedId = id
    if (id) {
      await db.update(keyAccounts).set(data).where(eq(keyAccounts.id, id))
    } else {
      const [novo] = await db.insert(keyAccounts).values(data).returning({ id: keyAccounts.id })
      savedId = novo.id
    }

    await recalcularHealth(savedId)
    revalidatePath('/key-accounts')
    revalidatePath(`/key-accounts/${savedId}`)
    return { success: true, id: savedId }
  } catch {
    return { success: false }
  }
}

export async function excluirKeyAccount(id: string) {
  await db.update(keyAccounts).set({ archivedAt: new Date() }).where(eq(keyAccounts.id, id))
  revalidatePath('/key-accounts')
}

export async function salvarPlanoAcao(fd: FormData) {
  try {
    const id = fd.get('id') as string
    await db.update(keyAccounts).set({
      plano30d: (fd.get('plano30d') as string) || null,
      plano90d: (fd.get('plano90d') as string) || null,
      barreiras: (fd.get('barreiras') as string) || null,
      estrategia: (fd.get('estrategia') as string) || null,
      estrategiaExpansao: (fd.get('estrategiaExpansao') as string) || null,
      planoAtualizadoEm: new Date(),
      updatedAt: new Date(),
    }).where(eq(keyAccounts.id, id))
    revalidatePath(`/key-accounts/${id}`)
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function salvarProximaAcao(fd: FormData) {
  try {
    const id = fd.get('id') as string
    const proximaAcao = (fd.get('proximaAcao') as string) || null
    await db.update(keyAccounts).set({
      proximaAcao,
      proximaAcaoData: (fd.get('proximaAcaoData') as string) || null,
      proximaAcaoResponsavel: (fd.get('proximaAcaoResponsavel') as string) || null,
      updatedAt: new Date(),
    }).where(eq(keyAccounts.id, id))
    await recalcularHealth(id)
    revalidatePath(`/key-accounts/${id}`)
    return { success: true }
  } catch {
    return { success: false }
  }
}

// ── STAKEHOLDERS ──────────────────────────────

export async function salvarStakeholder(fd: FormData) {
  try {
    const id = fd.get('id') as string
    const kaId = fd.get('keyAccountId') as string
    const data = {
      keyAccountId: kaId,
      nome: (fd.get('nome') as string) || '',
      cargo: (fd.get('cargo') as string) || null,
      departamento: (fd.get('departamento') as string) || null,
      email: (fd.get('email') as string) || null,
      telefone: (fd.get('telefone') as string) || null,
      linkedin: (fd.get('linkedin') as string) || null,
      nivelPoder: (fd.get('nivelPoder') as string) || 'INFLUENCIADOR_TECNICO',
      posicionamento: (fd.get('posicionamento') as string) || 'NEUTRO',
      nivelRelacionamento: (fd.get('nivelRelacionamento') as string) || 'FRIO',
      qualificacaoStatus: (fd.get('qualificacaoStatus') as string) || 'QUALIFICADO',
      ultimaInteracao: (fd.get('ultimaInteracao') as string) || null,
      proximaAcao: (fd.get('proximaAcao') as string) || null,
      observacoes: (fd.get('observacoes') as string) || null,
      updatedAt: new Date(),
    }

    if (id) {
      await db.update(kaStakeholders).set(data).where(eq(kaStakeholders.id, id))
    } else {
      await db.insert(kaStakeholders).values(data)
    }

    await recalcularHealth(kaId)
    revalidatePath(`/key-accounts/${kaId}`)
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function excluirStakeholder(id: string, keyAccountId: string) {
  await db.delete(kaStakeholders).where(eq(kaStakeholders.id, id))
  await recalcularHealth(keyAccountId)
  revalidatePath(`/key-accounts/${keyAccountId}`)
}

// ── VISITAS ───────────────────────────────────

export async function salvarVisita(fd: FormData) {
  try {
    const id = fd.get('id') as string
    const keyAccountId = fd.get('keyAccountId') as string
    const participantes = fd.getAll('participantes') as string[]

    const data = {
      keyAccountId,
      data: (fd.get('data') as string) || new Date().toISOString().split('T')[0],
      tipo: (fd.get('tipo') as string) || 'Visita Presencial',
      participantes: participantes.filter(Boolean),
      objetivo: (fd.get('objetivo') as string) || null,
      resultado: (fd.get('resultado') as string) || null,
      proximosPassos: (fd.get('proximosPassos') as string) || null,
      nivelAvanco: (fd.get('nivelAvanco') as string) || null,
      progressoNivel: (fd.get('progressoNivel') as string) || null,
    }

    if (id) {
      await db.update(kaVisitas).set(data).where(eq(kaVisitas.id, id))
    } else {
      await db.insert(kaVisitas).values(data)
    }

    await recalcularHealth(keyAccountId)
    revalidatePath(`/key-accounts/${keyAccountId}`)
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function excluirVisita(id: string, keyAccountId: string) {
  await db.delete(kaVisitas).where(eq(kaVisitas.id, id))
  await recalcularHealth(keyAccountId)
  revalidatePath(`/key-accounts/${keyAccountId}`)
}

// ── PENETRAÇÃO ────────────────────────────────

export async function salvarPenetracao(fd: FormData) {
  try {
    const kaId = fd.get('keyAccountId') as string
    const departamento = fd.get('departamento') as string
    const status = (fd.get('status') as string) || 'Não iniciado'
    const responsavel = (fd.get('responsavel') as string) || null
    const prazo = (fd.get('prazo') as string) || null
    const observacoes = (fd.get('observacoes') as string) || null

    // Upsert por (keyAccountId, departamento)
    const existing = await db
      .select()
      .from(kaPenetracao)
      .where(eq(kaPenetracao.keyAccountId, kaId))
    const found = existing.find(p => p.departamento === departamento)

    if (found) {
      await db.update(kaPenetracao).set({ status, responsavel, prazo, observacoes, updatedAt: new Date() })
        .where(eq(kaPenetracao.id, found.id))
    } else {
      await db.insert(kaPenetracao).values({ keyAccountId: kaId, departamento, status, responsavel, prazo, observacoes })
    }

    revalidatePath(`/key-accounts/${kaId}`)
    return { success: true }
  } catch {
    return { success: false }
  }
}
