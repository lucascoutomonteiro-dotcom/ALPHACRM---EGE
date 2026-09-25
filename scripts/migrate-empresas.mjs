import { readFileSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Lê .env.local
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=][^=]*)=(.+)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const { Pool, neonConfig } = require('../node_modules/@neondatabase/serverless/index.js')

// Node.js 21+ tem WebSocket nativo
if (!globalThis.WebSocket) {
  console.log('WebSocket não nativo, usando global workaround...')
  // Usa o WebSocket bundled no node
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function run(desc, query) {
  try {
    await pool.query(query)
    console.log(`✅ ${desc}`)
  } catch (err) {
    console.log(`⚠️  ${desc}: ${err.message}`)
  }
}

try {
  await run('CREATE empresas', `
    CREATE TABLE IF NOT EXISTS empresas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID REFERENCES organizations(id),
      nome TEXT NOT NULL,
      cnpj TEXT, segmento TEXT, cidade TEXT, estado TEXT,
      website TEXT, telefone TEXT, email TEXT,
      responsavel_id UUID REFERENCES users(id),
      status TEXT DEFAULT 'Ativo',
      potencial_estimado NUMERIC(14,2),
      origem TEXT, observacoes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `)
  await run('idx empresas.org', `CREATE INDEX IF NOT EXISTS idx_empresas_org ON empresas(organization_id)`)
  await run('idx empresas.resp', `CREATE INDEX IF NOT EXISTS idx_empresas_resp ON empresas(responsavel_id)`)
  await run('idx empresas.status', `CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status)`)
  await run('contatos.empresa_id', `ALTER TABLE contatos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id)`)
  await run('idx contatos.empresa_id', `CREATE INDEX IF NOT EXISTS idx_contatos_empresa ON contatos(empresa_id)`)

  const check = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name='empresas'`)
  console.log('empresas visível?', check.rows.length > 0 ? 'YES ✅' : 'NO ❌')
} finally {
  await pool.end()
}
