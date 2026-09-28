import { db } from './db'
import { activities, deals, contatos } from './schema'
import { eq, and, lt, lte } from 'drizzle-orm'
import type { Notification } from '@/components/shared/NotificationToast'

export async function getNotifications(organizationId: string): Promise<Notification[]> {
  const notifications: Notification[] = []
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()

  try {
    // Atividades planejadas com data passada (atrasadas)
    const overdueActivities = await db.select({
      id: activities.id,
      title: activities.title,
    }).from(activities)
      .where(and(
        eq(activities.organizationId, organizationId),
        eq(activities.status, 'planned'),
        lt(activities.date, now),
      ))

    if (overdueActivities.length > 0) {
      notifications.push({
        id: 'overdue-activities',
        type: 'overdue',
        title: `${overdueActivities.length} atividade${overdueActivities.length > 1 ? 's' : ''} atrasada${overdueActivities.length > 1 ? 's' : ''}`,
        description: overdueActivities.slice(0, 2).map(a => a.title).join(', ') + (overdueActivities.length > 2 ? '...' : ''),
        href: '/activities',
      })
    }
  } catch { /* ignora */ }

  try {
    // Próximo passo de atividades vencido (dataProximoPasso < hoje)
    const overdueFollowUps = await db.select({
      id: activities.id,
      title: activities.title,
      dataProximoPasso: activities.dataProximoPasso,
    }).from(activities)
      .where(and(
        eq(activities.organizationId, organizationId),
        lt(activities.dataProximoPasso, today),
      ))

    if (overdueFollowUps.length > 0) {
      notifications.push({
        id: 'overdue-followups',
        type: 'overdue',
        title: `${overdueFollowUps.length} próximo passo${overdueFollowUps.length > 1 ? 's' : ''} atrasado${overdueFollowUps.length > 1 ? 's' : ''}`,
        description: overdueFollowUps.slice(0, 2).map(a => a.title).join(', ') + (overdueFollowUps.length > 2 ? '...' : ''),
        href: '/activities',
      })
    }
  } catch { /* ignora */ }

  try {
    // Próximo passo vencendo hoje
    const todayFollowUps = await db.select({
      id: activities.id,
      title: activities.title,
    }).from(activities)
      .where(and(
        eq(activities.organizationId, organizationId),
        eq(activities.dataProximoPasso, today),
      ))

    if (todayFollowUps.length > 0) {
      notifications.push({
        id: 'today-followups',
        type: 'today',
        title: `${todayFollowUps.length} follow-up${todayFollowUps.length > 1 ? 's' : ''} para hoje`,
        description: todayFollowUps.slice(0, 2).map(a => a.title).join(', ') + (todayFollowUps.length > 2 ? '...' : ''),
        href: '/activities',
      })
    }
  } catch { /* ignora */ }

  try {
    // Contatos com próxima atividade para hoje
    const todayContatos = await db.select({
      id: contatos.id,
      nome: contatos.nome,
    }).from(contatos)
      .where(and(
        eq(contatos.organizationId, organizationId),
        eq(contatos.proximaAtividade, today),
      ))

    if (todayContatos.length > 0) {
      notifications.push({
        id: 'today-contatos',
        type: 'today',
        title: `${todayContatos.length} contato${todayContatos.length > 1 ? 's' : ''} com follow-up hoje`,
        description: todayContatos.slice(0, 2).map(c => c.nome).join(', ') + (todayContatos.length > 2 ? '...' : ''),
        href: '/crm',
      })
    }
  } catch { /* ignora */ }

  try {
    // Deals abertos há mais de 30 dias sem atualização
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const stalledDeals = await db.select({
      id: deals.id,
      title: deals.title,
    }).from(deals)
      .where(and(
        eq(deals.organizationId, organizationId),
        eq(deals.status, 'open'),
        lt(deals.updatedAt, thirtyDaysAgo),
      ))

    if (stalledDeals.length > 0) {
      notifications.push({
        id: 'stalled-deals',
        type: 'stalled',
        title: `${stalledDeals.length} proposta${stalledDeals.length > 1 ? 's' : ''} parada${stalledDeals.length > 1 ? 's' : ''} há 30+ dias`,
        description: stalledDeals.slice(0, 2).map(d => d.title).join(', ') + (stalledDeals.length > 2 ? '...' : ''),
        href: '/deals',
      })
    }
  } catch { /* ignora */ }

  return notifications
}
