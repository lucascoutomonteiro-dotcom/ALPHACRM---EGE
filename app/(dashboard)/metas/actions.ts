'use server'

import { db } from '@/lib/db'
import { metas } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Converte "350.000,00" OU "350000.00" (do banco) → "350000.00" para Postgres
function parseMoeda(v: FormDataEntryValue | null): string | null {
  if (!v || v === '') return null
  const s = String(v).trim()
  // Já está no formato numérico simples (vindo do banco): "31089900.00"
  if (/^\d+(\.\d+)?$/.test(s)) return s
  // Formato brasileiro: "1.234.567,89" ou "350.000,00"
  const normalized = s.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  if (isNaN(n)) return null
  return String(n)
}

function parseInteiro(v: FormDataEntryValue | null): number | null {
  if (!v || v === '') return null
  const n = Number(String(v).replace(/\D/g, ''))
  return isNaN(n) ? null : n
}

export async function salvarMeta(fd: FormData) {
  try {
    const id = fd.get('id') as string
    const mes = Number(fd.get('mes'))
    const ano = Number(fd.get('ano'))
    const tab = (fd.get('tab') as string) || 'realizado'

    // Upsert base — sempre mantém mes/ano
    const base = { mes, ano }

    // Campos do tab "metas" (só admin)
    const dadosMetas = tab === 'metas' ? {
      faturamentoNecessario: parseMoeda(fd.get('faturamentoNecessario')),
      metaEbitda: parseMoeda(fd.get('metaEbitda')),
      pipelineNecessario: parseMoeda(fd.get('pipelineNecessario')),
      metaPropostas: parseInteiro(fd.get('metaPropostas')),
      metaPropostasValor: parseMoeda(fd.get('metaPropostasValor')),
      metaProspeccoes: parseInteiro(fd.get('metaProspeccoes')),
      metaReunioes: parseInteiro(fd.get('metaReunioes')),
      metaContratos: parseInteiro(fd.get('metaContratos')),
    } : {}

    // Campos do tab "realizado"
    const dadosRealizado = tab === 'realizado' ? {
      realizadoVendas: parseMoeda(fd.get('realizadoVendas')),
      realizadoEbitda: parseMoeda(fd.get('realizadoEbitda')),
      realizadoPipeline: parseMoeda(fd.get('realizadoPipeline')),
      realizadoPipelineQtd: parseInteiro(fd.get('realizadoPipelineQtd')),
      realizadoPropostas: parseInteiro(fd.get('realizadoPropostas')),
      realizadoPropostasValor: parseMoeda(fd.get('realizadoPropostasValor')),
      realizadoProspeccoes: parseInteiro(fd.get('realizadoProspeccoes')),
      realizadoReunioes: parseInteiro(fd.get('realizadoReunioes')),
      contratosFechados: parseInteiro(fd.get('contratosFechados')),
    } : {}

    const data = { ...base, ...dadosMetas, ...dadosRealizado }

    if (id) {
      // Atualização parcial — não sobrescreve campos de outro tab
      await db.update(metas).set(tab === 'metas' ? dadosMetas : dadosRealizado).where(eq(metas.id, id))
    } else {
      await db.insert(metas).values(data).onConflictDoUpdate({ target: [metas.mes, metas.ano], set: data })
    }

    revalidatePath('/metas')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false }
  }
}
