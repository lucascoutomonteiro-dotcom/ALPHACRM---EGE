// Pesos centralizados — ajuste aqui para calibrar sem mexer na lógica
export const KA_HEALTH_WEIGHTS = {
  decisorIdentificado:      20,
  promotorIdentificado:     15,
  diversidadeDepartamentos: 15,
  relacionamentoAtivo:      15,
  interacaoRecente:         10,
  oportunidadesAbertas:     10,
  potencialExpansao:        10,
  detrator:                -15,
  semProximaAcao:          -10,
  interacaoDesatualizada:  -10,
  concentracaoRelacionamento: -10,
} as const

export type HealthInput = {
  stakeholders: Array<{
    nivelPoder: string
    posicionamento: string
    nivelRelacionamento: string | null
    qualificacaoStatus: string
    departamento: string | null
  }>
  ultimaVisita: string | null  // YYYY-MM-DD
  totalVisitas: number
  temProximaAcao: boolean
  temOportunidadesAbertas: boolean
  temServicosPotencial: boolean
}

export type HealthResult = {
  score: number
  status: 'SAUDAVEL' | 'ATENCAO' | 'CRITICA'
  riscos: RiscoItem[]
  pontos: number
  detalhes: Record<string, number>
}

export type RiscoItem = {
  codigo: string
  nivel: 'ALTO' | 'MEDIO'
  descricao: string
}

const hoje = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())

function diasDesde(dataStr: string | null): number | null {
  if (!dataStr) return null
  const diff = new Date(hoje()).getTime() - new Date(dataStr).getTime()
  return Math.floor(diff / 86400000)
}

export function calcularHealthScore(input: HealthInput): HealthResult {
  const W = KA_HEALTH_WEIGHTS
  const detalhes: Record<string, number> = {}
  let pontos = 0
  const riscos: RiscoItem[] = []

  const qualificados = input.stakeholders.filter(s => s.qualificacaoStatus === 'QUALIFICADO')

  // +20 — decisor identificado
  const temDecisor = qualificados.some(s =>
    s.nivelPoder === 'DECISOR_FINAL' || s.nivelPoder === 'Decisor'
  )
  if (temDecisor) {
    pontos += W.decisorIdentificado
    detalhes['decisorIdentificado'] = W.decisorIdentificado
  } else {
    riscos.push({ codigo: 'SEM_DECISOR', nivel: 'ALTO', descricao: 'Nenhum decisor identificado' })
  }

  // +15 — promotor identificado
  const temPromotor = qualificados.some(s =>
    s.posicionamento === 'PROMOTOR' || s.posicionamento === 'Favorável'
  )
  if (temPromotor) {
    pontos += W.promotorIdentificado
    detalhes['promotorIdentificado'] = W.promotorIdentificado
  } else {
    riscos.push({ codigo: 'SEM_PROMOTOR', nivel: 'ALTO', descricao: 'Nenhum promotor identificado' })
  }

  // +15 — diversidade de departamentos
  const deptos = new Set(qualificados.map(s => s.departamento).filter(Boolean))
  if (deptos.size >= 3) {
    pontos += W.diversidadeDepartamentos
    detalhes['diversidadeDepartamentos'] = W.diversidadeDepartamentos
  } else if (deptos.size === 0) {
    riscos.push({ codigo: 'SEM_DEPARTAMENTO', nivel: 'MEDIO', descricao: 'Nenhum departamento mapeado' })
  }

  // +15 — relacionamento ativo (pelo menos 1 QUENTE ou ESTRATEGICO)
  const temRelAtivo = qualificados.some(s =>
    s.nivelRelacionamento === 'QUENTE' || s.nivelRelacionamento === 'ESTRATEGICO' ||
    s.nivelRelacionamento === 'Quente' || s.nivelRelacionamento === 'Forte'
  )
  if (temRelAtivo) {
    pontos += W.relacionamentoAtivo
    detalhes['relacionamentoAtivo'] = W.relacionamentoAtivo
  }

  // +10 — interação nos últimos 30 dias
  const diasUltimaVisita = diasDesde(input.ultimaVisita)
  if (diasUltimaVisita !== null && diasUltimaVisita <= 30) {
    pontos += W.interacaoRecente
    detalhes['interacaoRecente'] = W.interacaoRecente
  }

  // +10 — oportunidades abertas
  if (input.temOportunidadesAbertas) {
    pontos += W.oportunidadesAbertas
    detalhes['oportunidadesAbertas'] = W.oportunidadesAbertas
  }

  // +10 — potencial de expansão identificado
  if (input.temServicosPotencial) {
    pontos += W.potencialExpansao
    detalhes['potencialExpansao'] = W.potencialExpansao
  }

  // -15 — detrator identificado
  const temDetrator = qualificados.some(s =>
    s.posicionamento === 'DETRATOR' || s.posicionamento === 'BLOQUEADOR' || s.posicionamento === 'Desfavorável'
  )
  if (temDetrator) {
    pontos += W.detrator
    detalhes['detrator'] = W.detrator
    riscos.push({ codigo: 'DETRATOR', nivel: 'ALTO', descricao: 'Detrator ou bloqueador identificado' })
  }

  // -10 — sem próxima ação
  if (!input.temProximaAcao) {
    pontos += W.semProximaAcao
    detalhes['semProximaAcao'] = W.semProximaAcao
    riscos.push({ codigo: 'SEM_PROXIMA_ACAO', nivel: 'MEDIO', descricao: 'Sem próxima ação definida' })
  }

  // -10 — mais de 30 dias sem interação
  if (diasUltimaVisita !== null && diasUltimaVisita > 30) {
    pontos += W.interacaoDesatualizada
    detalhes['interacaoDesatualizada'] = W.interacaoDesatualizada
    riscos.push({ codigo: 'INTERACAO_DESATUALIZADA', nivel: 'MEDIO', descricao: `${diasUltimaVisita} dias sem visita ou reunião` })
  } else if (diasUltimaVisita === null && input.totalVisitas === 0) {
    pontos += W.interacaoDesatualizada
    detalhes['interacaoDesatualizada'] = W.interacaoDesatualizada
    riscos.push({ codigo: 'SEM_HISTORICO', nivel: 'MEDIO', descricao: 'Nenhum histórico de visitas' })
  }

  // -10 — concentração de relacionamento (>70% interações em 1 stakeholder)
  // Verificado externamente se necessário; aqui apenas 1 stakeholder total é risco
  if (qualificados.length === 1) {
    pontos += W.concentracaoRelacionamento
    detalhes['concentracaoRelacionamento'] = W.concentracaoRelacionamento
    riscos.push({ codigo: 'CONCENTRACAO_RELACIONAMENTO', nivel: 'MEDIO', descricao: 'Relacionamento concentrado em um único contato' })
  }

  // Risco: nenhum contato em Compras
  const temCompras = qualificados.some(s =>
    s.departamento === 'COMPRAS' || s.departamento === 'Compras'
  )
  if (qualificados.length > 0 && !temCompras) {
    riscos.push({ codigo: 'SEM_COMPRAS', nivel: 'MEDIO', descricao: 'Sem contato em Compras' })
  }

  // Risco: apenas 1 stakeholder total
  if (input.stakeholders.length <= 1 && input.stakeholders.length > 0) {
    riscos.push({ codigo: 'POUCOS_STAKEHOLDERS', nivel: 'MEDIO', descricao: 'Apenas um stakeholder cadastrado' })
  }

  const score = Math.max(0, Math.min(100, pontos))

  const status: HealthResult['status'] =
    score >= 80 ? 'SAUDAVEL' : score >= 60 ? 'ATENCAO' : 'CRITICA'

  return { score, status, riscos, pontos, detalhes }
}

// Percentual de completude da conta (0–100)
export function calcularCompletude(ka: {
  nome: string
  segmento?: string | null
  potencialEstimado?: string | null
  proximaAcao?: string | null
  plano30d?: string | null
  estrategia?: string | null
}, stakeholders: { qualificacaoStatus: string }[], visitas: unknown[]): number {
  const checks = [
    !!ka.nome,
    !!ka.segmento,
    !!ka.potencialEstimado && Number(ka.potencialEstimado) > 0,
    stakeholders.length > 0,
    stakeholders.some(s => s.qualificacaoStatus === 'QUALIFICADO'),
    stakeholders.some(s => (s as unknown as { nivelPoder: string }).nivelPoder === 'DECISOR_FINAL'),
    visitas.length > 0,
    !!ka.proximaAcao,
    !!ka.plano30d,
    !!ka.estrategia,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
