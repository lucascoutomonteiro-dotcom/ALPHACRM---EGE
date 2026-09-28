'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Target,
  ClipboardList,
  Settings,
  Star,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  UserPlus,
  Handshake,
  Activity,
  Package,
  Sliders,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm', label: 'CRM', icon: Users },
  { href: '/leads', label: 'Leads', icon: UserPlus },
  { href: '/deals', label: 'Deals', icon: Handshake },
  { href: '/activities', label: 'Atividades', icon: Activity },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/accounts', label: 'Empresas', icon: Briefcase },
  { href: '/oportunidades', label: 'Oportunidades', icon: Building2 },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/plano', label: 'Plano de Ação', icon: ClipboardList },
  { href: '/key-accounts', label: 'Key Accounts', icon: Star },
  { href: '/admin/pipelines', label: 'Pipelines', icon: GitBranch },
  { href: '/admin/campos', label: 'Campos', icon: Sliders },
  { href: '/admin/usuarios', label: 'Usuários', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-[#1B4F8A] text-white transition-all duration-200 shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className={cn('flex items-center h-16 px-4 border-b border-white/10', collapsed ? 'justify-center' : 'gap-2')}>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm leading-tight">AlphaCRM</div>
            <div className="text-xs text-white/60">Gestão Comercial</div>
          </div>
        )}
        {collapsed && <div className="font-bold text-lg">α</div>}
      </div>

      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active ? 'bg-white/20 font-medium' : 'hover:bg-white/10',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4F8A] border border-white/20 text-white hover:bg-[#163f70]"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}
