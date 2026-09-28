'use client'

import { useState, useTransition } from 'react'
import { criarProduct, editarProduct, excluirProduct, type ProductInput } from './actions'
import { Plus, Edit2, Trash2, X, Package, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Product = {
  id: string
  name: string
  description: string | null
  category: string | null
  price: string | null
  unit: string | null
  active: boolean | null
}

const UNITS = ['unidade', 'hora', 'mês', 'projeto', 'licença', 'usuário']

function fmt(price: string | null) {
  if (!price) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(price))
}

function ProductForm({ product, onClose }: { product?: Product; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [form, setForm] = useState<ProductInput>({
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: product?.category ?? '',
    price: product?.price ? Number(product.price) : null,
    unit: product?.unit ?? 'unidade',
    active: product?.active ?? true,
  })

  const set = (k: keyof ProductInput, v: string | number | boolean | null) =>
    setForm(f => ({ ...f, [k]: v }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (product) await editarProduct(product.id, form)
      else await criarProduct(form)
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-[#1A1A2E]">{product ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Nome *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Categoria</label>
            <input value={form.category ?? ''} onChange={e => set('category', e.target.value || null)}
              placeholder="Ex: Consultoria, Software, Suporte..."
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Preço (R$)</label>
              <input type="number" min={0} step={0.01} value={form.price ?? ''}
                onChange={e => set('price', e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Unidade</label>
              <select value={form.unit ?? 'unidade'} onChange={e => set('unit', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Descrição</label>
            <textarea rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value || null)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => set('active', !form.active)}>
              {form.active
                ? <ToggleRight className="h-6 w-6 text-green-500" />
                : <ToggleLeft className="h-6 w-6 text-gray-400" />}
            </button>
            <span className="text-sm text-gray-600">{form.active ? 'Ativo' : 'Inativo'}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={pending}
              className="flex-1 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#163f70] disabled:opacity-50">
              {pending ? 'Salvando...' : product ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ProductsClient({ products: initial }: { products: Product[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = initial.filter(p =>
    filterActive === null || p.active === filterActive
  )

  const categories = [...new Set(initial.map(p => p.category).filter(Boolean))] as string[]

  function doDelete(p: Product) {
    startTransition(async () => {
      await excluirProduct(p.id)
      setDeleting(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4F8A]">Produtos & Serviços</h1>
          <p className="text-sm text-gray-500">{initial.length} cadastrados</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#163f70]">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      {/* Filtro ativo/inativo */}
      <div className="flex gap-2">
        {[null, true, false].map((v, i) => (
          <button key={i} onClick={() => setFilterActive(v)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterActive === v ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B4F8A]'}`}>
            {v === null ? 'Todos' : v ? 'Ativos' : 'Inativos'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {initial.length === 0 ? 'Nenhum produto ainda. Clique em "Novo" para começar.' : 'Nenhum produto encontrado.'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => (
            <div key={p.id} className={`bg-white rounded-xl border p-4 ${!p.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#1B4F8A]/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-[#1B4F8A]" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#1A1A2E]">{p.name}</div>
                    {p.category && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Tag className="h-3 w-3" />{p.category}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(p)}
                    className="p-1 text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 rounded">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleting(p)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {p.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{p.description}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-[#1B4F8A]">{fmt(p.price)}</span>
                <span className="text-xs text-gray-400">por {p.unit}</span>
              </div>
              {!p.active && (
                <div className="mt-2 text-xs text-gray-400 bg-gray-50 rounded px-2 py-0.5 text-center">Inativo</div>
              )}
            </div>
          ))}
        </div>
      )}

      {(showForm || editing) && (
        <ProductForm product={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null) }} />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-[#1A1A2E] mb-2">Excluir produto?</h3>
            <p className="text-sm text-gray-600 mb-5"><strong>{deleting.name}</strong> será removido permanentemente.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => doDelete(deleting)} disabled={pending}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {pending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
