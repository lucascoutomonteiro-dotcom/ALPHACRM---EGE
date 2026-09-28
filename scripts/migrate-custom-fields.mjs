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
      CREATE TABLE IF NOT EXISTS custom_fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id),
        entity_type TEXT NOT NULL,
        label TEXT NOT NULL,
        field_type TEXT NOT NULL,
        options TEXT,
        required BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    console.log('✅ 1/2 Tabela custom_fields criada')

    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_field_values (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id),
        field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id UUID NOT NULL,
        value TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    console.log('✅ 2/2 Tabela custom_field_values criada')

    const check = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('custom_fields', 'custom_field_values')
    `)
    console.log(`✅ Tabelas visíveis: ${check.rows.map(r => r.table_name).join(', ')}`)
    console.log('\n🎉 Migração FASE 9 concluída!')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
