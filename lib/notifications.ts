import { db } from './db'
import { activities, deals, contatos } from './schema'
import { eq, and, lt, lte, isNull, or } from 'drizzle-orm'
import type { Notification } from '@/components/shared/NotificationToast'

export async function getNotifications(organizationId: string): Promise<Notification[]> {
  const notifications: Notification[] = []
  const today = new Date().toISOString().slice(0, 10)

  try {
    // Atividades planejadas atrasadas (status=planned e data < hoje)
    const overdueActivities = await db.select({
      id: activities.id,
      title: activities.title,
      date: activities.date,
      contatoId: activities.contatoId,
    }).from(activities)
      .where(and(
        eq(activities.organizationId, organizationId),
        eq(activities.status, 'planned'),
        lt(activities.date, new Date()),
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
        title: `${stalledDeals.length} deal${stalledDeals.length > 1 ? 's' : ''} parado${stalledDeals.length > 1 ? 's' : ''} há 30+ dias`,
        description: stalledDeals.slice(0, 2).map(d => d.title).join(', ') + (stalledDeals.length > 2 ? '...' : ''),
        href: '/deals',
      })
    }
  } catch { /* ignora */ }

  try {
    // Contatos com próxima atividade para hoje
    const todayContatos = await db.select({
      id: contatos.id,
      nome: contatos.nome,
      proximaAtividade: contatos.proximaAtividade,
    }).from(contatos)
      .where(and(
        eq(contatos.organizationId, organizationId),
        eq(contatos.proximaAtividade, today),
      ))

    if (todayContatos.length > 0) {
      notifications.push({
        id: 'today-followups',
        type: 'today',
        title: `${todayContatos.length} follow-up${todayContatos.length > 1 ? 's' : ''} para hoje`,
        description: todayContatos.slice(0, 2).map(c => c.nome).join(', ') + (todayContatos.length > 2 ? '...' : ''),
        href: '/crm',
      })
    }
  } catch { /* ignora */ }

  return notifications
}
