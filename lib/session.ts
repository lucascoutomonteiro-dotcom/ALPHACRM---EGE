import { auth } from '@/auth'

export type SessionUser = {
  id: string
  organizationId: string
  role: string
  name?: string | null
  email?: string | null
}

/**
 * Retorna o usuário autenticado com organizationId e role.
 * Lança erro se não autenticado ou se a sessão estiver incompleta.
 * Use em Server Actions e Route Handlers — nunca confie em dados do client.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await auth()
  const user = session?.user as (SessionUser & { id?: string }) | undefined

  if (!user?.id || !user?.organizationId) {
    throw new Error('Não autenticado')
  }

  return {
    id: user.id,
    organizationId: user.organizationId,
    role: user.role ?? 'VIEWER',
    name: user.name,
    email: user.email,
  }
}

export function canAccess(role: string, minimum: string): boolean {
  const HIERARQUIA = ['VIEWER', 'SDR', 'SELLER', 'MANAGER', 'ADMIN', 'OWNER']
  return HIERARQUIA.indexOf(role) >= HIERARQUIA.indexOf(minimum)
}
