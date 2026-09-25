import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header userName={session.user?.name} userRole={(session.user as { role?: string })?.role} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
