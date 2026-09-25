'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormContato } from '@/components/crm/FormContato'
import { FormInteracao } from '@/components/crm/FormInteracao'
import { Edit, MessageSquare } from 'lucide-react'

interface DetalheContatoClientProps {
  contato: {
    id: string
    nome: string | null
    empresa: string | null
    cidade: string | null
    cargo: string | null
    telefone: string | null
    email: string | null
    canal: string | null
    origem: string | null
    status: string
    proximaAtividade: string | null
    historico: string | null
    segmento: string | null
    valorEstimado: string | null
    probabilidade: number | null
  }
  userId: string
}

export function DetalheContatoClient({ contato, userId }: DetalheContatoClientProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [interacaoOpen, setInteracaoOpen] = useState(false)

  return (
    <div className="flex gap-2 mt-4">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Edit className="h-4 w-4 mr-1" /> Editar
      </Button>
      <Button variant="outline" size="sm" onClick={() => setInteracaoOpen(true)}>
        <MessageSquare className="h-4 w-4 mr-1" /> Registrar Interação
      </Button>
      <FormContato open={editOpen} onClose={() => setEditOpen(false)} contato={contato} />
      <FormInteracao open={interacaoOpen} onClose={() => setInteracaoOpen(false)} contatoId={contato.id} userId={userId} />
    </div>
  )
}
