'use client'

import { useState, useRef } from 'react'
import { Settings, GripVertical, Pencil, Trash2, Plus, X, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { criarColuna, editarColuna, excluirColuna, reordenarColunas } from '@/app/(dashboard)/crm/colunas-actions'
import { useRouter } from 'next/navigation'

interface Coluna {
  id: string
  nome: string
  cor: string
  ordem: number
  sistema: boolean | null
}

const CORES_PRESET = [
  '#9CA3AF', '#60A5FA', '#FBBF24', '#A855F7',
  '#1B4F8A', '#15803D', '#0EA5E9', '#22C55E',
  '#EF4444', '#6B7280', '#F97316', '#EC4899',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {CORES_PRESET.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
          style={{ backgroundColor: c, borderColor: value === c ? '#1B4F8A' : 'transparent' }}
        />
      ))}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded-full border cursor-pointer overflow-hidden" title="Cor personalizada" />
    </div>
  )
}

export function GerenciarColunas({ colunas: initial }: { colunas: Coluna[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [colunas, setColunas] = useState(initial)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editCor, setEditCor] = useState('#9CA3AF')
  const [novaNome, setNovaNome] = useState('')
  const [novaCor, setNovaCor] = useState('#9CA3AF')
  const [mostrarNova, setMostrarNova] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Drag-and-drop para reordenar
  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  function startEdit(c: Coluna) {
    setEditandoId(c.id)
    setEditNome(c.nome)
    setEditCor(c.cor)
    setErro(null)
  }

  async function salvarEdicao(id: string) {
    setLoading(true)
    const fd = new FormData()
    fd.set('nome', editNome)
    fd.set('cor', editCor)
    const res = await editarColuna(id, fd)
    setLoading(false)
    if (!res.success) { setErro(res.error ?? 'Erro'); return }
    setColunas((prev) => prev.map((c) => c.id === id ? { ...c, nome: editNome, cor: editCor } : c))
    setEditandoId(null)
    router.refresh()
  }

  async function salvarNova() {
    if (!novaNome.trim()) return
    setLoading(true)
    const fd = new FormData()
    fd.set('nome', novaNome.trim())
    fd.set('cor', novaCor)
    const res = await criarColuna(fd)
    setLoading(false)
    if (!res.success) { setErro(res.error ?? 'Erro'); return }
    setNovaNome('')
    setNovaCor('#9CA3AF')
    setMostrarNova(false)
    setErro(null)
    router.refresh()
    // Atualiza lista local
    setColunas((prev) => [...prev, { id: crypto.randomUUID(), nome: novaNome.trim(), cor: novaCor, ordem: prev.length, sistema: false }])
  }

  async function deletar(id: string) {
    setLoading(true)
    const res = await excluirColuna(id)
    setLoading(false)
    if (!res.success) { setErro(res.error ?? 'Erro'); return }
    setColunas((prev) => prev.filter((c) => c.id !== id))
    router.refresh()
  }

  async function onDrop(targetIdx: number) {
    if (dragIdx.current === null || dragIdx.current === targetIdx) { setDragOver(null); return }
    const nova = [...colunas]
    const [item] = nova.splice(dragIdx.current, 1)
    nova.splice(targetIdx, 0, item)
    setColunas(nova)
    setDragOver(null)
    dragIdx.current = null
    await reordenarColunas(nova.map((c) => c.id))
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="flex items-center gap-1.5">
        <Settings className="h-4 w-4" /> Gerenciar Colunas
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Gerenciar Colunas do CRM</h2>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {erro && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {erro}
                  <button onClick={() => setErro(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}

              {colunas.map((c, idx) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => { dragIdx.current = idx }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(idx) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => onDrop(idx)}
                  className={`rounded-lg border transition-colors ${dragOver === idx ? 'border-[#1B4F8A] bg-blue-50' : 'border-gray-200 bg-white'}`}
                >
                  {editandoId === c.id ? (
                    <div className="p-3 space-y-2">
                      <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="h-8 text-sm" autoFocus />
                      <ColorPicker value={editCor} onChange={setEditCor} />
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="bg-[#1B4F8A] hover:bg-[#163f70] h-7 text-xs" onClick={() => salvarEdicao(c.id)} disabled={loading}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Salvar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditandoId(null); setErro(null) }}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <GripVertical className="h-4 w-4 text-gray-300 cursor-grab shrink-0" />
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                      <span className="flex-1 text-sm font-medium text-gray-700 truncate">{c.nome}</span>
                      {c.sistema && <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">sistema</span>}
                      <button onClick={() => startEdit(c)} className="p-1 hover:bg-gray-100 rounded" title="Editar">
                        <Pencil className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                      {!c.sistema && (
                        <button onClick={() => deletar(c.id)} className="p-1 hover:bg-red-50 rounded" title="Excluir">
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {mostrarNova ? (
                <div className="rounded-lg border border-dashed border-[#1B4F8A] bg-blue-50/30 p-3 space-y-2">
                  <Input value={novaNome} onChange={(e) => setNovaNome(e.target.value)} placeholder="Nome da coluna" className="h-8 text-sm" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') salvarNova() }} />
                  <ColorPicker value={novaCor} onChange={setNovaCor} />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="bg-[#1B4F8A] hover:bg-[#163f70] h-7 text-xs" onClick={salvarNova} disabled={loading || !novaNome.trim()}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Criar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setMostrarNova(false); setNovaNome(''); setErro(null) }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setMostrarNova(true); setErro(null) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#1B4F8A] hover:text-[#1B4F8A] transition-colors"
                >
                  <Plus className="h-4 w-4" /> Nova coluna
                </button>
              )}
            </div>

            <div className="px-6 py-3 border-t text-xs text-gray-400">
              Arraste para reordenar · Colunas "sistema" não podem ser excluídas
            </div>
          </div>
        </div>
      )}
    </>
  )
}
