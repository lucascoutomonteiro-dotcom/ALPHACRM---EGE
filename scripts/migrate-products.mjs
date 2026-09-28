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
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id),
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price NUMERIC(14, 2),
        unit TEXT DEFAULT 'unidade',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    console.log('✅ 1/3 Tabela products criada')

    await client.query(`
      CREATE TABLE IF NOT EXISTS deal_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
        product_id UUID REFERENCES products(id) NOT NULL,
        quantity NUMERIC(10, 2) DEFAULT 1,
        unit_price NUMERIC(14, 2),
        discount NUMERIC(5, 2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    console.log('✅ 2/3 Tabela deal_products criada')

    const check = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('products', 'deal_products')
    `)
    console.log(`✅ 3/3 Tabelas visíveis: ${check.rows.map(r => r.table_name).join(', ')} ✅`)

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
