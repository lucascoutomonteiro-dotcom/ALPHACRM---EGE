import { createRequire } from 'module'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const require = createRequire(import.meta.url)
const { Pool } = require('@neondatabase/serverless')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const DEFAULT_COLS = [
  { nome: 'Quente', cor: '#EF4444', ordem: 0, slug: 'quente' },
  { nome: 'Morno',  cor: '#FBBF24', ordem: 1, slug: 'morno'  },
  { nome: 'Fria',   cor: '#60A5FA', ordem: 2, slug: 'fria'   },
  { nome: 'Perdida',cor: '#6B7280', ordem: 3, slug: 'perdida' },
  { nome: 'Ganho',  cor: '#22C55E', ordem: 4, slug: 'ganho'  },
]

async function run() {
  // 1. Add temperatura column to deals
  await pool.query(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS temperatura text DEFAULT 'morno'`)
  console.log('✓ deals.temperatura adicionado')

  // 2. Create deal_colunas table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deal_colunas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid REFERENCES organizations(id),
      nome text NOT NULL,
      cor text NOT NULL DEFAULT '#9CA3AF',
      ordem integer NOT NULL DEFAULT 0,
      sistema boolean DEFAULT false,
      slug text,
      created_at timestamptz DEFAULT now()
    )
  `)
  console.log('✓ deal_colunas criada')

  // 3. Seed default columns for existing orgs
  const { rows: orgs } = await pool.query('SELECT id FROM organizations')
  for (const org of orgs) {
    const { rows: existing } = await pool.query(
      'SELECT id FROM deal_colunas WHERE organization_id = $1 LIMIT 1',
      [org.id]
    )
    if (existing.length === 0) {
      for (const col of DEFAULT_COLS) {
        await pool.query(
          `INSERT INTO deal_colunas (organization_id, nome, cor, ordem, sistema, slug)
           VALUES ($1, $2, $3, $4, true, $5)`,
          [org.id, col.nome, col.cor, col.ordem, col.slug]
        )
      }
      console.log(`✓ Colunas padrão inseridas para org ${org.id}`)
    } else {
      console.log(`→ Org ${org.id} já tem colunas, pulando`)
    }
  }

  await pool.end()
  console.log('Migration concluída!')
}

run().catch(e => { console.error(e); process.exit(1) })
