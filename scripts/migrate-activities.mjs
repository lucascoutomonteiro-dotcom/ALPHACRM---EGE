import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const envPath = resolve(__dirname, '../.env.local')
try {
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    process.env[key] = value
  }
  console.log('✅ .env.local carregado')
} catch {
  console.log('⚠️  .env.local não encontrado')
}

const { Pool } = require('../node_modules/@neondatabase/serverless/index.js')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔗 Conectado ao banco')

    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMPTZ NOT NULL,
        duration_minutes INTEGER,
        status TEXT DEFAULT 'done',
        contato_id UUID REFERENCES contatos(id),
        deal_id UUID,
        lead_id UUID,
        responsavel_id UUID REFERENCES users(id),
        proximo_passo TEXT,
        data_proximo_passo DATE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    console.log('✅ 1/2 Tabela activities criada (ou já existe)')

    const check = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'activities'
    `)
    console.log('✅ 2/2 activities visível?', check.rows.length > 0 ? 'YES ✅' : 'NÃO ❌')

    console.log('\n🎉 Migração concluída!')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
