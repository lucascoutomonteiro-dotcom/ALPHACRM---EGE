export const STATUS_CONTATO = [
  'Nunca Contatado',
  '1o Contato Feito',
  'Follow-up Agendado',
  'Elaborar Proposta',
  'Proposta Enviada',
  'Reunião/Visita',
  'Demanda Lucas',
  'Fechado Ganho',
  'Fechado Perdido',
  'Inativo',
] as const

// Status que NÃO contam como "Em Andamento" no cabeçalho
export const STATUS_FORA_ANDAMENTO = ['Nunca Contatado', 'Proposta Enviada', 'Fechado Ganho', 'Fechado Perdido', 'Inativo', 'Demanda Lucas']

// Status que não disparam contadores de metas
export const STATUS_SEM_CONTAGEM = ['Demanda Lucas']

export const STATUS_CORES: Record<string, string> = {
  'Nunca Contatado': '#9CA3AF',
  '1o Contato Feito': '#60A5FA',
  'Follow-up Agendado': '#FBBF24',
  'Elaborar Proposta': '#A855F7',
  'Proposta Enviada': '#1B4F8A',
  'Reunião/Visita': '#15803D',
  'Demanda Lucas': '#0EA5E9',
  'Fechado Ganho': '#22C55E',
  'Fechado Perdido': '#EF4444',
  'Inativo': '#6B7280',
}

export const CANAIS = ['WhatsApp', 'Ligação', 'E-mail', 'LinkedIn']
export const ORIGENS = ['Base Lucas', 'Base EGE', 'Indicação', 'Técnico', 'Cogeração', 'Pré Vendas', 'Parceiro Comercial', 'Internet']
export const TIPOS_CLIENTE = ['Novo Cliente', 'Nova Unidade', 'Cliente EGE', 'Cliente Lucas']
export const TIPOS_INTERACAO = ['Ligação', 'WhatsApp', 'E-mail', 'LinkedIn', 'Reunião', 'Proposta', 'Contrato']
export const SERVICOS_PORTFOLIO = [
  'NR-12 APR/Risco', 'NR-12 Procedimentos', 'NR-12 Manuais', 'NR-12 Treinamento',
  'NR-12 Conceituação', 'NR-12 Adequação', 'Caça Vaz Detecção', 'Caça Vaz Reparo',
  'Termografia', 'Terceirização HH', 'NR-10 PIE/Laudo', 'NR-10 SPDA', 'NR-10 Instalações',
]
