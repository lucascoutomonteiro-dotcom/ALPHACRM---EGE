import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const result = await db.select().from(users).where(eq(users.email, credentials.email as string))
        const user = result[0]
        if (!user || !user.ativo) return null
        const ok = await bcrypt.compare(credentials.password as string, user.senhaHash)
        if (!ok) return null
        await db.update(users).set({ ultimoAcesso: new Date() }).where(eq(users.id, user.id))
        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId ?? null,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role
        token.organizationId = (user as { organizationId: string | null }).organizationId
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        ;(session.user as { role?: string }).role = token.role as string
        ;(session.user as { organizationId?: string | null }).organizationId = token.organizationId as string | null
        ;(session.user as { id?: string }).id = token.sub as string
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
})
