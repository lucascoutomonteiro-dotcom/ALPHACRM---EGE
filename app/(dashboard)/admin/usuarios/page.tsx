import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { UsuariosClient } from './UsuariosClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsuariosPage() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== 'admin') redirect('/')

  const lista = await db.select({
    id: users.id,
    nome: users.nome,
    email: users.email,
    perfil: users.perfil,
    ativo: users.ativo,
    ultimoAcesso: users.ultimoAcesso,
  }).from(users).orderBy(users.nome)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1B4F8A]">Usuários</h1>
      <UsuariosClient usuarios={lista as Parameters<typeof UsuariosClient>[0]['usuarios']} />
    </div>
  )
}
