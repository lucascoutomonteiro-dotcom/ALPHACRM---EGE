import { pgTable, uuid, text, integer, numeric, boolean, date, timestamp, unique, pgEnum } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ──────────────────────────────────────────────
// MULTITENANCY — FASE 1
// ──────────────────────────────────────────────

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  legalName: text('legal_name'),
  document: text('document'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  logo: text('logo'),
  timezone: text('timezone').default('America/Sao_Paulo'),
  locale: text('locale').default('pt-BR'),
  currency: text('currency').default('BRL'),
  status: text('status').default('active'), // active | suspended | cancelled
  plan: text('plan').default('STARTER'),    // FREE | STARTER | PRO | BUSINESS | ENTERPRISE
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  nome: text('nome').notNull(),
  email: text('email').unique().notNull(),
  senhaHash: text('senha_hash').notNull(),
  // perfil mantido para retrocompatibilidade — usar role para novas funcionalidades
  perfil: text('perfil').notNull().default('viewer'),
  // OWNER | ADMIN | MANAGER | SELLER | SDR | VIEWER
  role: text('role').notNull().default('VIEWER'),
  cargo: text('cargo'),
  telefone: text('telefone'),
  avatar: text('avatar'),
  ativo: boolean('ativo').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  ultimoAcesso: timestamp('ultimo_acesso', { withTimezone: true }),
})

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  managerId: uuid('manager_id').references(() => users.id),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

export const teamMembers = pgTable('team_members', {
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [unique().on(t.teamId, t.userId)])

export const contatos = pgTable('contatos', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  nome: text('nome'),
  empresa: text('empresa'),
  cidade: text('cidade'),
  cnpj: text('cnpj'),
  cargo: text('cargo'),
  telefone: text('telefone'),
  email: text('email'),
  origem: text('origem'),
  canal: text('canal'),
  dataPrimeiroContato: date('data_primeiro_contato'),
  status: text('status').notNull().default('Nunca Contatado'),
  proximaAtividade: date('proxima_atividade'),
  ultimaInteracao: date('ultima_interacao'),
  historico: text('historico'),
  segmento: text('segmento'),
  servicoInteresse: text('servico_interesse').array(),
  valorEstimado: numeric('valor_estimado', { precision: 12, scale: 2 }),
  numeroProposta: text('numero_proposta'),
  probabilidade: integer('probabilidade'),
  urgente: boolean('urgente').default(false),
  tipoCliente: text('tipo_cliente'),
  gerouOportunidade: boolean('gerou_oportunidade').default(false),
  servicoOportunidade: text('servico_oportunidade'),
  responsavelId: uuid('responsavel_id').references(() => users.id),
  accountId: uuid('account_id'),
  empresaId: uuid('empresa_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

export const interacoes = pgTable('interacoes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  contatoId: uuid('contato_id').references(() => contatos.id, { onDelete: 'cascade' }),
  dataInteracao: timestamp('data_interacao', { withTimezone: true }).default(sql`now()`),
  tipo: text('tipo').notNull(),
  descricao: text('descricao'),
  proximoPasso: text('proximo_passo'),
  dataProximoPasso: date('data_proximo_passo'),
  usuarioId: uuid('usuario_id').references(() => users.id),
  gerouOportunidade: boolean('gerou_oportunidade').default(false),
  servicoOportunidade: text('servico_oportunidade'),
})

export const clientesEge = pgTable('clientes_ege', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  rank: integer('rank'),
  cliente: text('cliente').notNull(),
  local: text('local'),
  contatoNome: text('contato_nome'),
  classificacao: text('classificacao'),
  nr12AprRisco: text('nr12_apr_risco').default('VAZIO'),
  nr12Procedimentos: text('nr12_procedimentos').default('VAZIO'),
  nr12Manuais: text('nr12_manuais').default('VAZIO'),
  nr12Treinamento: text('nr12_treinamento').default('VAZIO'),
  nr12Conceituacao: text('nr12_conceituacao').default('VAZIO'),
  nr12Adequacao: text('nr12_adequacao').default('VAZIO'),
  cacaVazDeteccao: text('caca_vaz_deteccao').default('VAZIO'),
  cacaVazReparo: text('caca_vaz_reparo').default('VAZIO'),
  termografia: text('termografia').default('VAZIO'),
  terceirizacaoHh: text('terceirizacao_hh').default('VAZIO'),
  nr10PieLaudo: text('nr10_pie_laudo').default('VAZIO'),
  nr10Spda: text('nr10_spda').default('VAZIO'),
  nr10Instalacoes: text('nr10_instalacoes').default('VAZIO'),
  numOportunidades: integer('num_oportunidades').default(0),
  potencialTotal: numeric('potencial_total', { precision: 12, scale: 2 }),
  prazoUrgencia: text('prazo_urgencia'),
  acao30d: text('acao_30d'),
  statusAcao: text('status_acao').default('A iniciar'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

export const oportunidadesBc = pgTable('oportunidades_bc', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  cliente: text('cliente').notNull(),
  pilaresAtuais: text('pilares_atuais'),
  segmento: text('segmento'),
  ticketEstimado: numeric('ticket_estimado', { precision: 12, scale: 2 }),
  servicosPrioritarios: text('servicos_prioritarios').array(),
  potencialCross: text('potencial_cross'),
  status: text('status').default('A prospectar'),
  responsavelId: uuid('responsavel_id').references(() => users.id),
  observacoes: text('observacoes'),
})

export const metas = pgTable('metas', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  mes: integer('mes').notNull(),
  ano: integer('ano').notNull(),
  metaEbitda: numeric('meta_ebitda', { precision: 12, scale: 2 }),
  faturamentoNecessario: numeric('faturamento_necessario', { precision: 12, scale: 2 }),
  pipelineNecessario: numeric('pipeline_necessario', { precision: 12, scale: 2 }),
  metaContratos: integer('meta_contratos'),
  metaPropostas: integer('meta_propostas'),
  metaPropostasValor: numeric('meta_propostas_valor', { precision: 12, scale: 2 }),
  metaProspeccoes: integer('meta_prospeccoes'),
  metaReunioes: integer('meta_reunioes'),
  realizadoVendas: numeric('realizado_vendas', { precision: 12, scale: 2 }).default('0'),
  realizadoEbitda: numeric('realizado_ebitda', { precision: 12, scale: 2 }).default('0'),
  realizadoPipeline: numeric('realizado_pipeline', { precision: 12, scale: 2 }).default('0'),
  realizadoPipelineQtd: integer('realizado_pipeline_qtd').default(0),
  realizadoPropostas: integer('realizado_propostas').default(0),
  realizadoPropostasValor: numeric('realizado_propostas_valor', { precision: 12, scale: 2 }).default('0'),
  realizadoProspeccoes: integer('realizado_prospeccoes').default(0),
  realizadoReunioes: integer('realizado_reunioes').default(0),
  contratosFechados: integer('contratos_fechados').default(0),
}, (t) => [unique().on(t.mes, t.ano)])

export const crmColunas = pgTable('crm_colunas', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  nome: text('nome').notNull().unique(),
  cor: text('cor').notNull().default('#9CA3AF'),
  ordem: integer('ordem').notNull().default(0),
  sistema: boolean('sistema').default(false), // colunas protegidas não podem ser renomeadas/excluídas
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

export const crmEventos = pgTable('crm_eventos', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  contatoId: uuid('contato_id').references(() => contatos.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(), // 'prospecao' | 'proposta' | 'reuniao'
  mes: integer('mes').notNull(),
  ano: integer('ano').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
}, (t) => [unique().on(t.contatoId, t.tipo, t.mes, t.ano)])

export const propostas = pgTable('propostas', {
  id: text('id').primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  nomeProposta: text('nome_proposta'),
  pilar: text('pilar'),
  cliente: text('cliente'),
  localidade: text('localidade'),
  situacao: text('situacao'),
  temperatura: text('temperatura'),
  responsavel: text('responsavel'),
  fonte: text('fonte'),
  contato: text('contato'),
  valorPc: numeric('valor_pc', { precision: 14, scale: 2 }),
  dataCriacao: date('data_criacao'),
  prazoEnvio: date('prazo_envio'),
  dataEnviada: date('data_enviada'),
  prazoFollowUp: date('prazo_follow_up'),
  fupAtrasado: boolean('fup_atrasado').default(false),
  ultimaAcaoFup: text('ultima_acao_fup'),
  fupsRealizados: integer('fups_realizados').default(0),
  previsaoFechamento: date('previsao_fechamento'),
  nivelDor: text('nivel_dor'),
  score: integer('score'),
  escopo: text('escopo'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

// ──────────────────────────────────────────────
// KEY ACCOUNT MANAGEMENT
// ──────────────────────────────────────────────

export const keyAccounts = pgTable('key_accounts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  // Vínculos com entidades existentes (nunca duplicar)
  clienteEgeId: uuid('cliente_ege_id').references(() => clientesEge.id),
  contatoId: uuid('contato_id').references(() => contatos.id),
  // Dados da conta
  nome: text('nome').notNull(),
  cnpj: text('cnpj'),
  segmento: text('segmento'),
  cidade: text('cidade'),
  estado: text('estado'),
  site: text('site'),
  observacoes: text('observacoes'),
  status: text('status').notNull().default('Em Desenvolvimento'), // Ativa | Em Desenvolvimento | Inativa
  prioridade: text('prioridade').notNull().default('MEDIA'), // BAIXA | MEDIA | ALTA | CRITICA
  // Financeiro
  potencialEstimado: numeric('potencial_estimado', { precision: 12, scale: 2 }),
  receitaAnual: numeric('receita_anual', { precision: 12, scale: 2 }),
  // Serviços
  servicosContratados: text('servicos_contratados').array(),
  servicosPotencial: text('servicos_potencial').array(),
  // Health Score (calculado automaticamente)
  healthScore: integer('health_score'),
  healthStatus: text('health_status'), // SAUDAVEL | ATENCAO | CRITICA
  // Próxima ação
  proximaAcao: text('proxima_acao'),
  proximaAcaoData: date('proxima_acao_data'),
  proximaAcaoResponsavel: text('proxima_acao_responsavel'),
  // Plano estratégico
  plano30d: text('plano_30d'),
  plano90d: text('plano_90d'),
  barreiras: text('barreiras'),
  estrategia: text('estrategia'),
  estrategiaExpansao: text('estrategia_expansao'),
  planoAtualizadoEm: timestamp('plano_atualizado_em', { withTimezone: true }),
  // Auditoria
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

export const kaStakeholders = pgTable('ka_stakeholders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  keyAccountId: uuid('key_account_id').references(() => keyAccounts.id, { onDelete: 'cascade' }).notNull(),
  contatoId: uuid('contato_id').references(() => contatos.id), // vínculo com contato existente
  nome: text('nome').notNull(),
  cargo: text('cargo'),
  // Departamento: MANUTENCAO | ENGENHARIA | COMPRAS | DIRETORIA | SEGURANCA | TI | FINANCEIRO | OPERACOES | OUTRO
  departamento: text('departamento'),
  email: text('email'),
  telefone: text('telefone'),
  linkedin: text('linkedin'),
  // Poder: DECISOR_FINAL | INFLUENCIADOR_TECNICO | COMPRADOR | USUARIO_FINAL
  nivelPoder: text('nivel_poder').notNull().default('INFLUENCIADOR_TECNICO'),
  // Posicionamento: PROMOTOR | NEUTRO | DETRATOR | BLOQUEADOR
  posicionamento: text('posicionamento').notNull().default('NEUTRO'),
  // Relacionamento: FRIO | MORNO | QUENTE | ESTRATEGICO
  nivelRelacionamento: text('nivel_relacionamento').default('FRIO'),
  // Qualificação: PENDENTE | QUALIFICADO
  qualificacaoStatus: text('qualificacao_status').notNull().default('PENDENTE'),
  ultimaInteracao: date('ultima_interacao'),
  proximaAcao: text('proxima_acao'),
  observacoes: text('observacoes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

export const kaVisitas = pgTable('ka_visitas', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  keyAccountId: uuid('key_account_id').references(() => keyAccounts.id, { onDelete: 'cascade' }).notNull(),
  data: date('data').notNull(),
  // Tipo: Visita Presencial | Reunião Online | Ligação | Evento | Workshop | Outro
  tipo: text('tipo').notNull(),
  participantes: text('participantes').array(), // nomes livres (retrocompat)
  objetivo: text('objetivo'),
  resultado: text('resultado'),
  proximosPassos: text('proximos_passos'),
  nivelAvanco: text('nivel_avanco'),
  // Progresso: RETROCEDEU | MANTEVE | AVANCOU
  progressoNivel: text('progresso_nivel'),
  criadoPor: uuid('criado_por').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

// Penetração por departamento dentro da conta
export const kaPenetracao = pgTable('ka_penetracao', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  keyAccountId: uuid('key_account_id').references(() => keyAccounts.id, { onDelete: 'cascade' }).notNull(),
  departamento: text('departamento').notNull(),
  status: text('status').notNull().default('Não iniciado'), // Não iniciado | Em progresso | Relacionamento ativo
  responsavel: text('responsavel'),
  prazo: date('prazo'),
  observacoes: text('observacoes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

export const interacoesEge = pgTable('interacoes_ege', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clienteEgeId: uuid('cliente_ege_id').references(() => clientesEge.id, { onDelete: 'cascade' }),
  dataInteracao: timestamp('data_interacao', { withTimezone: true }).default(sql`now()`),
  tipo: text('tipo').notNull(),
  descricao: text('descricao'),
  proximoPasso: text('proximo_passo'),
  dataProximoPasso: date('data_proximo_passo'),
  usuarioId: uuid('usuario_id').references(() => users.id),
  gerouOportunidade: boolean('gerou_oportunidade').default(false),
  servicoOportunidade: text('servico_oportunidade'),
})

// ──────────────────────────────────────────────
// PIPELINES E STAGES — FASE 2
// ──────────────────────────────────────────────

export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

export const stages = pgTable('stages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
  probability: integer('probability').default(0), // 0-100
  color: text('color').default('#9CA3AF'),
  description: text('description'),
  isWon: boolean('is_won').default(false),   // etapa "Fechado Ganho"
  isLost: boolean('is_lost').default(false), // etapa "Fechado Perdido"
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

export const planosAcao = pgTable('planos_acao', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  frente: text('frente'),
  oQue: text('o_que'),
  porQue: text('por_que'),
  quem: text('quem'),
  quando: text('quando'),
  dataLimite: date('data_limite'),
  onde: text('onde'),
  como: text('como'),
  kpi: text('kpi'),
  status: text('status').default('A INICIAR'),
  prazo: text('prazo'),
  observacao: text('observacao'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

// ──────────────────────────────────────────────
// FASE 4 — LEADS
// ──────────────────────────────────────────────

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  nome: text('nome').notNull(),
  email: text('email'),
  telefone: text('telefone'),
  empresa: text('empresa'),
  cargo: text('cargo'),
  origem: text('origem'),
  status: text('status').default('Novo'),
  score: integer('score').default(0),
  responsavelId: uuid('responsavel_id').references(() => users.id),
  observacoes: text('observacoes'),
  contatoId: uuid('contato_id'),
  convertidoEm: timestamp('convertido_em', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

// ──────────────────────────────────────────────
// FASE 7 — TIMELINE / AUDIT LOG
// ──────────────────────────────────────────────

export const timelineEvents = pgTable('timeline_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  entityType: text('entity_type').notNull(), // contato | deal | lead | account
  entityId: uuid('entity_id').notNull(),
  eventType: text('event_type').notNull(), // created | status_changed | deal_won | deal_lost | lead_converted | activity_logged | note_added | stage_moved
  title: text('title').notNull(),
  description: text('description'),
  metadata: text('metadata'), // JSON string com dados extras
  userId: uuid('user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

// ──────────────────────────────────────────────
// FASE 6 — ACTIVITIES (unificada)
// ──────────────────────────────────────────────

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  type: text('type').notNull(), // CALL | MEETING | VISIT | EMAIL | WHATSAPP | TASK | NOTE
  title: text('title').notNull(),
  description: text('description'),
  date: timestamp('date', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes'),
  status: text('status').default('done'), // planned | done | cancelled
  contatoId: uuid('contato_id').references(() => contatos.id),
  dealId: uuid('deal_id'),
  leadId: uuid('lead_id'),
  responsavelId: uuid('responsavel_id').references(() => users.id),
  proximoPasso: text('proximo_passo'),
  dataProximoPasso: date('data_proximo_passo'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

// ──────────────────────────────────────────────
// FASE 5 — DEALS
// ──────────────────────────────────────────────

export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  title: text('title').notNull(),
  value: numeric('value', { precision: 14, scale: 2 }),
  probability: integer('probability').default(0),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id),
  stageId: uuid('stage_id').references(() => stages.id),
  contatoId: uuid('contato_id').references(() => contatos.id),
  accountId: uuid('account_id'),
  responsavelId: uuid('responsavel_id').references(() => users.id),
  status: text('status').default('open'), // open | won | lost
  expectedCloseDate: date('expected_close_date'),
  lossReason: text('loss_reason'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

// ──────────────────────────────────────────────
// FASE 3 — ACCOUNTS (empresas/clientes)
// ──────────────────────────────────────────────

export const accounts = pgTable('empresas', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').references(() => organizations.id),
  nome: text('nome').notNull(),
  cnpj: text('cnpj'),
  segmento: text('segmento'),
  cidade: text('cidade'),
  estado: text('estado'),
  website: text('website'),
  telefone: text('telefone'),
  email: text('email'),
  responsavelId: uuid('responsavel_id').references(() => users.id),
  status: text('status').default('Ativo'),
  potencialEstimado: numeric('potencial_estimado', { precision: 14, scale: 2 }),
  origem: text('origem'),
  observacoes: text('observacoes'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})
