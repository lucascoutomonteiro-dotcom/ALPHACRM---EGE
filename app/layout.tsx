import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'EGE CRM — Pilar A',
  description: 'Sistema Comercial EGE Soluções Industriais',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#F2F5FA] text-[#1A1A2E] antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
