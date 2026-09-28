import { db } from '@/lib/db'
import { customFields } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { CamposClient } from './CamposClient'

export const dynamic = 'force-dynamic'

export default async function CamposPage() {
  const user = await requireAuth()

  try {
    const rows = await db.select({
      id: customFields.id,
      entityType: customFields.entityType,
      label: customFields.label,
      fieldType: customFields.fieldType,
      options: customFields.options,
      required: customFields.required,
      active: customFields.active,
      position: customFields.position,
    }).from(customFields)
      .where(eq(customFields.organizationId, user.organizationId))

    return <CamposClient fields={rows} />
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return <div className="p-6 bg-red-50 text-red-700 rounded-xl text-sm font-mono whitespace-pre-wrap">{msg}</div>
  }
}
