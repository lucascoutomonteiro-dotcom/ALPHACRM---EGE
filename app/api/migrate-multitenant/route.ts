import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = 'force-dynamic'

export async function GET() {
  const log: string[] = []

  try {
    // ── 1. Criar tabela organizations ────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        legal_name TEXT,
        document TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        logo TEXT,
        timezone TEXT DEFAULT 'America/Sao_Paulo',
        locale TEXT DEFAULT 'pt-BR',
        currency TEXT DEFAULT 'BRL',
        status TEXT DEFAULT 'active',
        plan TEXT DEFAULT 'STARTER',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `
    log.push('✅ organizations criada')

    // ── 2. Inserir organização padrão (EGE Soluções) ─────────────────────────
    const existing = await sql`SELECT id FROM organizations WHERE slug = 'ege-solucoes' LIMIT 1`
    let orgId: string

    if (existing.length > 0) {
      orgId = existing[0].id as string
      log.push(`ℹ️  Organização padrão já existe: ${orgId}`)
    } else {
      const inserted = await sql`
        INSERT INTO organizations (name, slug, legal_name, status, plan)
        VALUES ('EGE Soluções', 'ege-solucoes', 'EGE Soluções LTDA - EPP', 'active', 'BUSINESS')
        RETURNING id
      `
      orgId = inserted[0].id as string
      log.push(`✅ Organização padrão criada: ${orgId}`)
    }

    // ── 3. Adicionar colunas a users ─────────────────────────────────────────
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'VIEWER'`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo TEXT`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone TEXT`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`
    log.push('✅ Colunas adicionadas a users')

    // ── 4. Backfill organization_id em users ─────────────────────────────────
    await sql`UPDATE users SET organization_id = ${orgId} WHERE organization_id IS NULL`
    log.push('✅ Backfill users.organization_id')

    // ── 5. Mapear perfil → role ───────────────────────────────────────────────
    await sql`UPDATE users SET role = 'ADMIN'  WHERE perfil = 'admin'  AND role = 'VIEWER'`
    await sql`UPDATE users SET role = 'VIEWER' WHERE perfil = 'viewer' AND role = 'VIEWER'`
    log.push('✅ Mapeamento perfil → role concluído')

    // ── 6. Criar tabela teams ─────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        name TEXT NOT NULL,
        manager_id UUID REFERENCES users(id),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `
    log.push('✅ teams criada')

    // ── 7. Criar tabela team_members ──────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (team_id, user_id)
      )
    `
    log.push('✅ team_members criada')

    // ── 8. Adicionar organization_id em tabelas de negócio ───────────────────
    const alterTabelas = [
      [`ALTER TABLE contatos ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`, `UPDATE contatos SET organization_id = '${orgId}' WHERE organization_id IS NULL`, 'contatos'],
      [`ALTER TABLE clientes_ege ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`, `UPDATE clientes_ege SET organization_id = '${orgId}' WHERE organization_id IS NULL`, 'clientes_ege'],
      [`ALTER TABLE oportunidades_bc ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`, `UPDATE oportunidades_bc SET organization_id = '${orgId}' WHERE organization_id IS NULL`, 'oportunidades_bc'],
      [`ALTER TABLE metas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`, `UPDATE metas SET organization_id = '${orgId}' WHERE organization_id IS NULL`, 'metas'],
      [`ALTER TABLE crm_colunas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`, `UPDATE crm_colunas SET organization_id = '${orgId}' WHERE organization_id IS NULL`, 'crm_colunas'],
      [`ALTER TABLE propostas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`, `UPDATE propostas SET organization_id = '${orgId}' WHERE organization_id IS NULL`, 'propostas'],
      [`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`, `UPDATE key_accounts SET organization_id = '${orgId}' WHERE organization_id IS NULL`, 'key_accounts'],
      [`ALTER TABLE planos_acao ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`, `UPDATE planos_acao SET organization_id = '${orgId}' WHERE organization_id IS NULL`, 'planos_acao'],
      [`ALTER TABLE interacoes_ege ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`, `UPDATE interacoes_ege SET organization_id = '${orgId}' WHERE organization_id IS NULL`, 'interacoes_ege'],
    ] as [string, string, string][]

    for (const [alterSql, updateSql, nome] of alterTabelas) {
      try {
        await sql.unsafe(alterSql)
        await sql.unsafe(updateSql)
        log.push(`✅ ${nome}.organization_id adicionado e preenchido`)
      } catch (err) {
        log.push(`⚠️  ${nome}: ${String(err)}`)
      }
    }

    // ── 9. Índices ────────────────────────────────────────────────────────────
    const indices = [
      `CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id)`,
      `CREATE INDEX IF NOT EXISTS idx_contatos_org ON contatos(organization_id)`,
      `CREATE INDEX IF NOT EXISTS idx_clientes_ege_org ON clientes_ege(organization_id)`,
      `CREATE INDEX IF NOT EXISTS idx_oportunidades_bc_org ON oportunidades_bc(organization_id)`,
      `CREATE INDEX IF NOT EXISTS idx_metas_org ON metas(organization_id)`,
      `CREATE INDEX IF NOT EXISTS idx_key_accounts_org ON key_accounts(organization_id)`,
      `CREATE INDEX IF NOT EXISTS idx_planos_acao_org ON planos_acao(organization_id)`,
      `CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id)`,
      `CREATE INDEX IF NOT EXISTS idx_interacoes_ege_org ON interacoes_ege(organization_id)`,
    ]

    for (const idx of indices) {
      try {
        await sql.unsafe(idx)
      } catch { /* índice pode já existir */ }
    }
    log.push('✅ Índices criados')

    // ── 10. Resultado final ───────────────────────────────────────────────────
    const [userCount] = await sql`SELECT count(*) as total FROM users`
    const [orgCount] = await sql`SELECT count(*) as total FROM organizations`

    return NextResponse.json({
      ok: true,
      organizationId: orgId,
      resumo: {
        organizations: orgCount.total,
        users: userCount.total,
      },
      log,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), log }, { status: 500 })
  }
}
