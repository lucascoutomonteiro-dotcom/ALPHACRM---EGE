import { db } from '@/lib/db'
import { accounts, contatos, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { Building2, Phone, Mail, Globe, MapPin, ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/crm/StatusBadge'

export const dynamic = 'force-dynamic'

function fmtBRL(v: string | null) {
  if (!v) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))
}

function statusColor(s: string | null) {
  if (s === 'Ativo') return 'bg-green-100 text-green-700'
  if (s === 'Prospecto') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-500'
}

export default async function AccountDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [account] = await db.select({
    id: accounts.id,
    nome: accounts.nome,
    cnpj: accounts.cnpj,
    segmento: accounts.segmento,
    cidade: accounts.cidade,
    estado: accounts.estado,
    website: accounts.website,
    telefone: accounts.telefone,
    email: accounts.email,
    status: accounts.status,
    potencialEstimado: accounts.potencialEstimado,
    origem: accounts.origem,
    observacoes: accounts.observacoes,
    responsavelId: accounts.responsavelId,
    createdAt: accounts.createdAt,
  }).from(accounts).where(eq(accounts.id, id))

  if (!account) notFound()

  const contatosVinculados = await db.select({
    id: contatos.id,
    nome: contatos.nome,
    cargo: contatos.cargo,
    telefone: contatos.telefone,
    email: contatos.email,
    status: contatos.status,
    ultimaInteracao: contatos.ultimaInteracao,
  }).from(contatos).where(eq(contatos.empresaId, id))

  let responsavel: { nome: string } | null = null
  if (account.responsavelId) {
    const [u] = await db.select({ nome: users.nome }).from(users).where(eq(users.id, account.responsavelId))
    responsavel = u ?? null
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/accounts" className="text-gray-400 hover:text-[#1B4F8A]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-[#1A1A2E]">{account.nome}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(account.status)}`}>
          {account.status}
        </span>
      </div>

      {/* Dados da account */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="h-12 w-12 rounded-xl bg-[#1B4F8A]/10 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-[#1B4F8A]" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[#1A1A2E]">{account.nome}</h2>
            {account.segmento && <p className="text-sm text-gray-500">{account.segmento}</p>}
            {account.cnpj && <p className="text-xs text-gray-400 mt-0.5">CNPJ: {account.cnpj}</p>}
          </div>
          {account.potencialEstimado && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Potencial</p>
              <p className="font-semibold text-[#1B4F8A]">{fmtBRL(account.potencialEstimado)}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {(account.cidade || account.estado) && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
              {[account.cidade, account.estado].filter(Boolean).join(', ')}
            </div>
          )}
          {account.telefone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
              <a href={`tel:${account.telefone}`} className="hover:text-[#1B4F8A]">{account.telefone}</a>
            </div>
          )}
          {account.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
              <a href={`mailto:${account.email}`} className="hover:text-[#1B4F8A] truncate">{account.email}</a>
            </div>
          )}
          {account.website && (
            <div className="flex items-center gap-2 text-gray-600">
              <Globe className="h-4 w-4 text-gray-400 shrink-0" />
              <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                target="_blank" rel="noopener noreferrer" className="hover:text-[#1B4F8A] truncate">
                {account.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {responsavel && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4 text-gray-400 shrink-0" />
              Responsável: {responsavel.nome}
            </div>
          )}
          {account.origem && (
            <div className="text-gray-600">
              <span className="text-gray-400">Origem:</span> {account.origem}
            </div>
          )}
        </div>

        {account.observacoes && (
          <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            {account.observacoes}
          </div>
        )}
      </div>

      {/* Contatos vinculados */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Contatos ({contatosVinculados.length})</h2>
          <Link href={`/crm?account=${id}`} className="text-xs text-[#1B4F8A] hover:underline">
            Ver no CRM →
          </Link>
        </div>

        {contatosVinculados.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum contato vinculado ainda. Vincule pelo CRM.</p>
        ) : (
          <div className="space-y-2">
            {contatosVinculados.map(c => (
              <Link key={c.id} href={`/crm/${c.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                <div>
                  <p className="font-medium text-sm text-[#1A1A2E]">{c.nome || 'Sem nome'}</p>
                  {c.cargo && <p className="text-xs text-gray-500">{c.cargo}</p>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {c.status && <StatusBadge status={c.status} />}
                  {c.ultimaInteracao && <span>Últ. {new Date(c.ultimaInteracao).toLocaleDateString('pt-BR')}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
