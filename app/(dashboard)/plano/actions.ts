'use server'

import { db } from '@/lib/db'
import { planosAcao } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function atualizarStatusPlano(id: string, status: string) {
  await db.update(planosAcao).set({ status, updatedAt: new Date() }).where(eq(planosAcao.id, id))
  revalidatePath('/plano')
}

export async function moverPrazoAcao(id: string, prazo: string) {
  await db.update(planosAcao).set({ prazo, updatedAt: new Date() }).where(eq(planosAcao.id, id))
  revalidatePath('/plano')
}

export async function excluirAcao(id: string) {
  await db.delete(planosAcao).where(eq(planosAcao.id, id))
  revalidatePath('/plano')
}

export async function salvarAcao(fd: FormData) {
  try {
    const id = fd.get('id') as string
    const novaObservacao = (fd.get('novaObservacao') as string)?.trim() || null

    // Calcula observação final: prepende nova (com data) ao histórico existente
    let observacaoFinal: string | null = null
    if (novaObservacao) {
      const dataStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })
      const existente = (fd.get('observacaoAtual') as string) || null
      observacaoFinal = existente
        ? `[${dataStr}] ${novaObservacao}\n---\n${existente}`
        : `[${dataStr}] ${novaObservacao}`
    } else {
      // Mantém observação atual se não foi adicionada nova
      observacaoFinal = (fd.get('observacaoAtual') as string) || null
    }

    const data = {
      frente: (fd.get('frente') as string) || null,
      oQue: (fd.get('oQue') as string) || null,
      porQue: (fd.get('porQue') as string) || null,
      quem: (fd.get('quem') as string) || null,
      quando: (fd.get('quando') as string) || null,
      dataLimite: (fd.get('dataLimite') as string) || null,
      onde: (fd.get('onde') as string) || null,
      como: (fd.get('como') as string) || null,
      kpi: (fd.get('kpi') as string) || null,
      status: (fd.get('status') as string) || 'A INICIAR',
      prazo: (fd.get('prazo') as string) || null,
      observacao: observacaoFinal,
      updatedAt: new Date(),
    }
    if (id) {
      await db.update(planosAcao).set(data).where(eq(planosAcao.id, id))
    } else {
      await db.insert(planosAcao).values(data)
    }
    revalidatePath('/plano')
    return { success: true }
  } catch {
    return { success: false }
  }
}
