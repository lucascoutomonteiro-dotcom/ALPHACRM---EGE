'use server'

import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { auth } from '@/auth'

async function requireAdmin() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== 'admin') throw new Error('Sem permissão')
}

export async function criarUsuario(fd: FormData) {
  await requireAdmin()
  try {
    const senhaHash = await bcrypt.hash(fd.get('senha') as string, 10)
    await db.insert(users).values({
      nome: fd.get('nome') as string,
      email: fd.get('email') as string,
      senhaHash,
      perfil: fd.get('perfil') as string,
    })
    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch {
    return { success: false, error: 'E-mail já em uso ou dados inválidos.' }
  }
}

export async function editarUsuario(id: string, fd: FormData) {
  await requireAdmin()
  try {
    const updates: Record<string, string> = {
      nome: fd.get('nome') as string,
      email: fd.get('email') as string,
    }
    const novaSenha = fd.get('novaSenha') as string
    if (novaSenha?.trim()) {
      const senhaHash = await bcrypt.hash(novaSenha, 10)
      await db.update(users).set({ ...updates, senhaHash }).where(eq(users.id, id))
    } else {
      await db.update(users).set(updates).where(eq(users.id, id))
    }
    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch {
    return { success: false, error: 'E-mail já em uso ou dados inválidos.' }
  }
}

export async function atualizarPerfil(id: string, perfil: string) {
  await requireAdmin()
  await db.update(users).set({ perfil }).where(eq(users.id, id))
  revalidatePath('/admin/usuarios')
}

export async function toggleAtivo(id: string, ativo: boolean) {
  await requireAdmin()
  await db.update(users).set({ ativo }).where(eq(users.id, id))
  revalidatePath('/admin/usuarios')
}

export async function deletarUsuario(id: string) {
  await requireAdmin()
  await db.delete(users).where(eq(users.id, id))
  revalidatePath('/admin/usuarios')
}

export async function redefinirSenha(id: string, novaSenha: string) {
  await requireAdmin()
  const senhaHash = await bcrypt.hash(novaSenha, 10)
  await db.update(users).set({ senhaHash }).where(eq(users.id, id))
  revalidatePath('/admin/usuarios')
}
