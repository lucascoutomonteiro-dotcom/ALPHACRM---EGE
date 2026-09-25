'use client'

import { signOut } from 'next-auth/react'
import { BotaoAtualizar } from './BotaoAtualizar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut } from 'lucide-react'

interface HeaderProps {
  userName?: string | null
  userRole?: string | null
}

export function Header({ userName, userRole }: HeaderProps) {
  const initials = userName
    ? userName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??'

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <BotaoAtualizar />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-50 transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#1B4F8A] text-white text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="text-sm font-medium leading-tight">{userName}</div>
              <div className="text-xs text-gray-500 capitalize">{userRole}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="text-red-600 cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
