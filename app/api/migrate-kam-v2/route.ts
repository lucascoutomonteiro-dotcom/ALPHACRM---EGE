import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  const log: string[] = []

  try {
    // ── 1. ALTER key_accounts ─────────────────────────────────────
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS cliente_ege_id UUID REFERENCES clientes_ege(id)`
    log.push('✓ key_accounts.cliente_ege_id')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS contato_id UUID REFERENCES contatos(id)`
    log.push('✓ key_accounts.contato_id')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS prioridade TEXT NOT NULL DEFAULT 'MEDIA'`
    log.push('✓ key_accounts.prioridade')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS health_score INTEGER`
    log.push('✓ key_accounts.health_score')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS health_status TEXT`
    log.push('✓ key_accounts.health_status')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS receita_anual NUMERIC(12,2)`
    log.push('✓ key_accounts.receita_anual')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS proxima_acao TEXT`
    log.push('✓ key_accounts.proxima_acao')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS proxima_acao_data DATE`
    log.push('✓ key_accounts.proxima_acao_data')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS proxima_acao_responsavel TEXT`
    log.push('✓ key_accounts.proxima_acao_responsavel')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS estrategia_expansao TEXT`
    log.push('✓ key_accounts.estrategia_expansao')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id)`
    log.push('✓ key_accounts.created_by')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id)`
    log.push('✓ key_accounts.updated_by')
    await sql`ALTER TABLE key_accounts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ`
    log.push('✓ key_accounts.archived_at')

    // ── 2. ALTER ka_stakeholders ──────────────────────────────────
    await sql`ALTER TABLE ka_stakeholders ADD COLUMN IF NOT EXISTS contato_id UUID REFERENCES contatos(id)`
    log.push('✓ ka_stakeholders.contato_id')
    await sql`ALTER TABLE ka_stakeholders ADD COLUMN IF NOT EXISTS qualificacao_status TEXT NOT NULL DEFAULT 'PENDENTE'`
    log.push('✓ ka_stakeholders.qualificacao_status')
    await sql`ALTER TABLE ka_stakeholders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id)`
    log.push('✓ ka_stakeholders.created_by')

    // ── 3. ALTER ka_visitas ───────────────────────────────────────
    await sql`ALTER TABLE ka_visitas ADD COLUMN IF NOT EXISTS progresso_nivel TEXT`
    log.push('✓ ka_visitas.progresso_nivel')
    await sql`ALTER TABLE ka_visitas ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES users(id)`
    log.push('✓ ka_visitas.criado_por')

    // ── 4. CREATE ka_penetracao ───────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS ka_penetracao (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key_account_id UUID NOT NULL REFERENCES key_accounts(id) ON DELETE CASCADE,
        departamento TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Não iniciado',
        responsavel TEXT,
        prazo DATE,
        observacoes TEXT,
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(key_account_id, departamento)
      )
    `
    log.push('✓ tabela ka_penetracao criada')

    // ── 5. IMPORTAR clientes_ege → key_accounts ───────────────────
    const clientes = await sql`
      SELECT id, cliente, local, potencial_total, status_acao,
             nr12_apr_risco, nr12_procedimentos, nr12_manuais, nr12_treinamento,
             nr12_conceituacao, nr12_adequacao, caca_vaz_deteccao, caca_vaz_reparo,
             termografia, terceirizacao_hh, nr10_pie_laudo, nr10_spda, nr10_instalacoes
      FROM clientes_ege
      ORDER BY rank
    `

    const servicoCols = [
      { col: 'nr12_apr_risco',      nome: 'NR-12 APR/Risco' },
      { col: 'nr12_procedimentos',  nome: 'NR-12 Procedimentos' },
      { col: 'nr12_manuais',        nome: 'NR-12 Manuais' },
      { col: 'nr12_treinamento',    nome: 'NR-12 Treinamento' },
      { col: 'nr12_conceituacao',   nome: 'NR-12 Conceituação' },
      { col: 'nr12_adequacao',      nome: 'NR-12 Adequação' },
      { col: 'caca_vaz_deteccao',   nome: 'Caça Vazamento Detecção' },
      { col: 'caca_vaz_reparo',     nome: 'Caça Vazamento Reparo' },
      { col: 'termografia',         nome: 'Termografia' },
      { col: 'terceirizacao_hh',    nome: 'Terceirização HH' },
      { col: 'nr10_pie_laudo',      nome: 'NR-10 PIE/Laudo' },
      { col: 'nr10_spda',           nome: 'NR-10 SPDA' },
      { col: 'nr10_instalacoes',    nome: 'NR-10 Instalações' },
    ]

    const STATUS_CONTRATADO = ['VIGENTE', 'CONTRATADO', 'ATIVO', 'EXECUTANDO']
    const statusMap: Record<string, string> = {
      'Concluído': 'Ativa', 'Em andamento': 'Em Desenvolvimento',
      'A iniciar': 'Em Desenvolvimento', 'Pausado': 'Inativa',
    }

    let importados = 0
    let duplicados = 0

    for (const c of clientes) {
      const exists = await sql`SELECT id FROM key_accounts WHERE cliente_ege_id = ${c.id}`
      if (exists.length > 0) { duplicados++; continue }

      const servicosContratados: string[] = []
      const servicosPotencial: string[] = []
      for (const { col, nome } of servicoCols) {
        const val = String((c as Record<string, unknown>)[col] ?? '').toUpperCase().trim()
        if (!val || val === 'VAZIO') continue
        if (STATUS_CONTRATADO.includes(val)) servicosContratados.push(nome)
        else servicosPotencial.push(nome)
      }

      const localParts = (c.local ?? '').split('/')
      const cidade = localParts[0]?.trim() || null
      const estado = localParts[1]?.trim() || null
      const status = statusMap[c.status_acao as string] ?? 'Em Desenvolvimento'

      await sql`
        INSERT INTO key_accounts (
          cliente_ege_id, nome, cidade, estado, status, prioridade,
          potencial_estimado, servicos_contratados, servicos_potencial,
          created_at, updated_at
        ) VALUES (
          ${c.id}, ${c.cliente}, ${cidade}, ${estado}, ${status}, 'MEDIA',
          ${c.potencial_total || null},
          ${servicosContratados.length > 0 ? servicosContratados : null},
          ${servicosPotencial.length > 0 ? servicosPotencial : null},
          now(), now()
        )
      `
      importados++
    }

    log.push(`✓ Importados ${importados} clientes (${duplicados} já existiam)`)

    return NextResponse.json({ ok: true, log, importados, duplicados })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg, log }, { status: 500 })
  }
}
