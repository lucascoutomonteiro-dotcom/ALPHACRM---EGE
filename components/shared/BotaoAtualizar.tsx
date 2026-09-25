'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function BotaoAtualizar() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function atualizar() {
    setLoading(true)
    router.refresh()
    setTimeout(() => {
      setLoading(false)
      toast.success('Dados atualizados')
    }, 800)
  }

  return (
    <Button variant="outline" size="sm" onClick={atualizar} disabled={loading} className="gap-1.5">
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Atualizando...' : 'Atualizar'}
    </Button>
  )
}
