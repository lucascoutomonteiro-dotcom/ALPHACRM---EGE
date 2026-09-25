import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = 'force-dynamic'

// Status do CRM legado → stages do pipeline com probabilidade e cor
const STAGES_PADRAO = [
  { name: 'Nunca Contatado',    order: 0,  probability: 0,  color: '#9CA3AF', isWon: false, isLost: false },
  { name: '1o Contato Feito',   order: 1,  probability: 10, color: '#60A5FA', isWon: false, isLost: false },
  { name: 'Follow-up Agendado', order: 2,  probability: 20, color: '#FBBF24', isWon: false, isLost: false },
  { name: 'Elaborar Proposta',  order: 3,  probability: 40, color: '#A855F7', isWon: false, isLost: false },
  { name: 'Proposta Enviada',   order: 4,  probability: 60, color: '#1B4F8A', isWon: false, isLost: false },
  { name: 'Reunião/Visita',     order: 5,  probability: 75, color: '#15803D', isWon: false, isLost: false },
  { name: 'Demanda Lucas',      order: 6,  probability: 50, color: '#0EA5E9', isWon: false, isLost: false },
  { name: 'Fechado Ganho',      order: 7,  probability: 100, color: '#22C55E', isWon: true,  isLost: false },
  { name: 'Fechado Perdido',    order: 8,  probability: 0,  color: '#EF4444', isWon: false, isLost: true  },
  { name: 'Inativo',            order: 9,  probability: 0,  color: '#6B7280', isWon: false, isLost: false },
]

export async function GET() {
  const log: string[] = []

  try {
    // ── 1. Criar tabela pipelines ─────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS pipelines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        name TEXT NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `
    log.push('✅ pipelines criada')

    // ── 2. Criar tabela stages ────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS stages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id),
        name TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        probability INTEGER DEFAULT 0,
        color TEXT DEFAULT '#9CA3AF',
        description TEXT,
        is_won BOOLEAN DEFAULT false,
        is_lost BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `
    log.push('✅ stages criada')

    // ── 3. Buscar org padrão ──────────────────────────────────────────────────
    const [org] = await sql`SELECT id FROM organizations WHERE slug = 'ege-solucoes' LIMIT 1`
    if (!org) {
      return NextResponse.json({ ok: false, error: 'Organização padrão não encontrada. Execute /api/migrate-multitenant primeiro.' }, { status: 400 })
    }
    const orgId = org.id as string

    // ── 4. Criar pipeline padrão se não existir ───────────────────────────────
    const existing = await sql`SELECT id FROM pipelines WHERE organization_id = ${orgId} AND is_default = true LIMIT 1`
    let pipelineId: string

    if (existing.length > 0) {
      pipelineId = existing[0].id as string
      log.push(`ℹ️  Pipeline padrão já existe: ${pipelineId}`)
    } else {
      const [p] = await sql`
        INSERT INTO pipelines (organization_id, name, description, is_default, active)
        VALUES (${orgId}, 'Pipeline Comercial', 'Pipeline principal de vendas', true, true)
        RETURNING id
      `
      pipelineId = p.id as string
      log.push(`✅ Pipeline padrão criado: ${pipelineId}`)
    }

    // ── 5. Criar stages a partir dos status legados ───────────────────────────
    const existingStages = await sql`SELECT name FROM stages WHERE pipeline_id = ${pipelineId}`
    const existingNames = new Set(existingStages.map((s) => (s as { name: string }).name))

    let stagesCreated = 0
    for (const stage of STAGES_PADRAO) {
      if (existingNames.has(stage.name)) continue
      await sql`
        INSERT INTO stages (pipeline_id, organization_id, name, "order", probability, color, is_won, is_lost)
        VALUES (${pipelineId}, ${orgId}, ${stage.name}, ${stage.order}, ${stage.probability}, ${stage.color}, ${stage.isWon}, ${stage.isLost})
      `
      stagesCreated++
    }
    log.push(`✅ ${stagesCreated} stages criadas (${existingNames.size} já existiam)`)

    // ── 6. Índices ────────────────────────────────────────────────────────────
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_pipelines_org ON pipelines(organization_id)`)
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_stages_pipeline ON stages(pipeline_id)`)
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_stages_org ON stages(organization_id)`)
    log.push('✅ Índices criados')

    // ── 7. Resumo ─────────────────────────────────────────────────────────────
    const [totalStages] = await sql`SELECT count(*) as total FROM stages WHERE pipeline_id = ${pipelineId}`

    return NextResponse.json({
      ok: true,
      pipelineId,
      totalStages: totalStages.total,
      log,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), log }, { status: 500 })
  }
}
