import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/schema'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function main() {
  console.log('🌱 Iniciando seed...')

  // Usuários iniciais
  const senha = await bcrypt.hash('EGE@2026', 10)
  await db.insert(schema.users).values([
    { nome: 'Lucas Couto', email: 'lucas.couto@egesolucoes.com.br', senhaHash: senha, perfil: 'admin' },
    { nome: 'Oscar', email: 'oscar@egesolucoes.com.br', senhaHash: senha, perfil: 'admin' },
  ]).onConflictDoNothing()

  // Meta Jun/2026
  await db.insert(schema.metas).values({
    mes: 6, ano: 2026,
    metaEbitda: '80000',
    faturamentoNecessario: '200000',
    pipelineNecessario: '600000',
    metaPropostas: 10,
    metaProspeccoes: 100,
    realizadoVendas: '0',
    realizadoEbitda: '0',
    realizadoPipeline: '0',
    realizadoPropostas: 0,
    realizadoProspeccoes: 0,
  }).onConflictDoNothing()

  // Clientes EGE — amostra para teste
  await db.insert(schema.clientesEge).values([
    { rank: 1, cliente: 'Empresa Alpha Ltda', local: 'São Paulo/SP', contatoNome: 'João Silva', classificacao: 'OURO', nr12AprRisco: 'FEITO', nr12Procedimentos: 'UPSELL', nr12Manuais: 'CROSS', nr12Treinamento: 'VAZIO', nr12Conceituacao: 'VAZIO', nr12Adequacao: 'CROSS', cacaVazDeteccao: 'VAZIO', cacaVazReparo: 'VAZIO', termografia: 'FEITO', terceirizacaoHh: 'VAZIO', nr10PieLaudo: 'RENOVAR', nr10Spda: 'VAZIO', nr10Instalacoes: 'CROSS', numOportunidades: 5, potencialTotal: '85000', prazoUrgencia: '30d', acao30d: 'Apresentar proposta NR-12 Adequação e NR-10', statusAcao: 'Em contato' },
    { rank: 2, cliente: 'Beta Indústrias S.A.', local: 'Campinas/SP', contatoNome: 'Maria Santos', classificacao: 'OURO', nr12AprRisco: 'FEITO', nr12Procedimentos: 'FEITO', nr12Manuais: 'FEITO', nr12Treinamento: 'UPSELL', nr12Conceituacao: 'VAZIO', nr12Adequacao: 'VAZIO', cacaVazDeteccao: 'CROSS', cacaVazReparo: 'CROSS', termografia: 'VAZIO', terceirizacaoHh: 'CROSS', nr10PieLaudo: 'VAZIO', nr10Spda: 'VAZIO', nr10Instalacoes: 'VAZIO', numOportunidades: 4, potencialTotal: '72000', prazoUrgencia: '30-60d', acao30d: 'Oferecer Caça Vazamento e Terceirização', statusAcao: 'A iniciar' },
    { rank: 3, cliente: 'Gama Processos Ltda', local: 'Jundiaí/SP', contatoNome: 'Carlos Lima', classificacao: 'PRATA', nr12AprRisco: 'FEITO', nr12Procedimentos: 'FEITO', nr12Manuais: 'CROSS', nr12Treinamento: 'VAZIO', nr12Conceituacao: 'VAZIO', nr12Adequacao: 'VAZIO', cacaVazDeteccao: 'VAZIO', cacaVazReparo: 'VAZIO', termografia: 'CROSS', terceirizacaoHh: 'VAZIO', nr10PieLaudo: 'CROSS', nr10Spda: 'VAZIO', nr10Instalacoes: 'VAZIO', numOportunidades: 3, potencialTotal: '45000', prazoUrgencia: '60-90d', acao30d: 'Levantar necessidade NR-10 e Termografia', statusAcao: 'A iniciar' },
    { rank: 4, cliente: 'Delta Tech S.A.', local: 'Sorocaba/SP', contatoNome: 'Ana Oliveira', classificacao: 'BRONZE', nr12AprRisco: 'VAZIO', nr12Procedimentos: 'VAZIO', nr12Manuais: 'VAZIO', nr12Treinamento: 'VAZIO', nr12Conceituacao: 'CROSS', nr12Adequacao: 'CROSS', cacaVazDeteccao: 'VAZIO', cacaVazReparo: 'VAZIO', termografia: 'VAZIO', terceirizacaoHh: 'VAZIO', nr10PieLaudo: 'VAZIO', nr10Spda: 'VAZIO', nr10Instalacoes: 'VAZIO', numOportunidades: 2, potencialTotal: '25000', prazoUrgencia: '30-60d', acao30d: 'Iniciar prospecção NR-12', statusAcao: 'A iniciar' },
  ]).onConflictDoNothing()

  // Oportunidades B/C
  await db.insert(schema.oportunidadesBc).values([
    { cliente: 'Epsilon Ltda', pilaresAtuais: 'B', segmento: 'Metalurgia', ticketEstimado: '35000', servicosPrioritarios: ['NR-12', 'Termografia'], potencialCross: 'URGENTE', status: 'A prospectar' },
    { cliente: 'Zeta Componentes', pilaresAtuais: 'C', segmento: 'Autopeças', ticketEstimado: '28000', servicosPrioritarios: ['NR-10', 'Caça Vazamento'], potencialCross: 'Alto', status: 'A prospectar' },
    { cliente: 'Eta Sistemas', pilaresAtuais: 'BC', segmento: 'Químico', ticketEstimado: '55000', servicosPrioritarios: ['NR-12', 'NR-10', 'Terceirização HH'], potencialCross: 'URGENTE', status: 'Em contato' },
  ]).onConflictDoNothing()

  // Plano de ação
  await db.insert(schema.planosAcao).values([
    { frente: 'F1', oQue: 'Estruturar processo de prospecção SDR', porQue: 'Ampliar base de leads qualificados', quem: 'Lucas + SDR', quando: 'Julho/2026', onde: 'CRM', como: 'Definir cadência, scripts e metas semanais de abordagem', kpi: '50 novos contatos/semana', prazo: 'CURTO', status: 'EM ANDAMENTO' },
    { frente: 'F2', oQue: 'Cross-sell NR-10 para clientes OURO', porQue: 'Clientes OURO sem NR-10 = oportunidade de R$100k+', quem: 'Lucas', quando: 'Julho-Agosto/2026', onde: 'Visitas e videoconferências', como: 'Mapear cada cliente, preparar proposta personalizada', kpi: '5 propostas NR-10 enviadas', prazo: 'CURTO', status: 'A INICIAR' },
    { frente: 'F3', oQue: 'Implantar rotina de follow-up semanal', porQue: 'Reduzir leads perdidos por falta de contato', quem: 'Todo time comercial', quando: 'Contínuo', onde: 'CRM', como: 'Revisão segunda-feira dos follow-ups vencidos, redistribuição', kpi: 'Zero follow-up vencido >7 dias', prazo: 'CURTO', status: 'A INICIAR' },
    { frente: 'F4', oQue: 'Desenvolver proposta terceirização HH', porQue: 'Alta demanda, baixa oferta concorrente', quem: 'Oscar + Lucas', quando: 'Agosto/2026', onde: 'Escritório', como: 'Criar modelo de proposta, definir escopo e precificação', kpi: 'Modelo aprovado + 3 propostas enviadas', prazo: 'MEDIO', status: 'A INICIAR' },
    { frente: 'F5', oQue: 'Parceria com fabricantes de máquinas', porQue: 'Canal de indicação com alto potencial', quem: 'Lucas', quando: 'Set-Out/2026', onde: 'Visitas e feiras', como: 'Mapear 10 fabricantes regionais, propor acordo de indicação', kpi: '3 parcerias firmadas', prazo: 'MEDIO', status: 'A INICIAR' },
    { frente: 'F6', oQue: 'Certificação ISO para equipe técnica', porQue: 'Diferencial competitivo para grandes contratos', quem: 'RH + técnicos', quando: 'Out-Dez/2026', onde: 'Externa', como: 'Contratar treinamento certificado para 4 técnicos', kpi: '4 técnicos certificados', prazo: 'LONGO', status: 'A INICIAR' },
  ]).onConflictDoNothing()

  // Contatos de exemplo
  await db.insert(schema.contatos).values([
    { nome: 'Roberto Mendes', empresa: 'Omega Industrial', cidade: 'São Paulo', cargo: 'Gerente de Manutenção', telefone: '(11) 99999-1234', email: 'roberto@omega.com.br', canal: 'WhatsApp', origem: 'Base Lucas', status: 'Em Andamento', segmento: 'Metalurgia', dataPrimeiroContato: '2026-05-10', proximaAtividade: '2026-06-20' },
    { nome: 'Fernanda Costa', empresa: 'Sigma Equipamentos', cidade: 'Campinas', cargo: 'Diretora de Operações', telefone: '(19) 98888-5678', email: 'fernanda@sigma.com.br', canal: 'LinkedIn', origem: 'Indicação', status: 'Proposta Enviada', segmento: 'Químico', dataPrimeiroContato: '2026-04-15', proximaAtividade: '2026-06-18' },
    { nome: 'Paulo Vieira', empresa: 'Lambda Automação', cidade: 'Jundiaí', cargo: 'Engenheiro de Segurança', telefone: '(11) 97777-9012', email: 'paulo@lambda.com.br', canal: 'E-mail', origem: 'Base EGE', status: 'Follow-up Agendado', segmento: 'Autopeças', dataPrimeiroContato: '2026-06-01', proximaAtividade: '2026-06-19' },
  ]).onConflictDoNothing()

  console.log('✅ Seed concluído!')
}

main().catch(console.error)
