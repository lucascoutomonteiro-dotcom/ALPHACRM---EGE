'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { criarUsuario, editarUsuario, atualizarPerfil, toggleAtivo, deletarUsuario } from './actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { UserPlus, Power, Pencil, Trash2 } from 'lucide-react'

const PERFIS = ['admin', 'closer', 'sdr', 'viewer']

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  ativo: boolean | null
  ultimoAcesso: Date | null
}

export function UsuariosClient({ usuarios }: { usuarios: Usuario[] }) {
  const [novoOpen, setNovoOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCriar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await criarUsuario(fd)
    setLoading(false)
    if (result.success) { toast.success('Usuário criado!'); setNovoOpen(false) }
    else toast.error(result.error ?? 'Erro ao criar.')
  }

  async function handleEditar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await editarUsuario(selected.id, fd)
    setLoading(false)
    if (result.success) { toast.success('Usuário atualizado!'); setEditOpen(false) }
    else toast.error(result.error ?? 'Erro ao editar.')
  }

  async function handleDelete() {
    if (!selected) return
    setLoading(true)
    await deletarUsuario(selected.id)
    setLoading(false)
    toast.success('Usuário removido.')
    setDeleteOpen(false)
  }

  async function handlePerfil(id: string, perfil: string) {
    await atualizarPerfil(id, perfil)
    toast.success('Perfil atualizado!')
  }

  async function handleToggle(id: string, ativo: boolean | null) {
    await toggleAtivo(id, !(ativo ?? true))
    toast.success(ativo ? 'Usuário desativado.' : 'Usuário ativado.')
  }

  const PERFIL_CORES: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    closer: 'bg-blue-100 text-blue-700',
    sdr: 'bg-orange-100 text-orange-700',
    viewer: 'bg-gray-100 text-gray-600',
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button className="bg-[#1B4F8A] hover:bg-[#163f70]" onClick={() => setNovoOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">E-mail</th>
              <th className="text-left px-4 py-3">Perfil</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Último Acesso</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usuarios.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 ${!u.ativo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium">{u.nome}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 w-36">
                  <Select value={u.perfil} onValueChange={(v) => { if (v) handlePerfil(u.id, v) }}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PERFIS.map((p) => <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {u.ultimoAcesso ? format(new Date(u.ultimoAcesso), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Nunca'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => { setSelected(u); setEditOpen(true) }} className="p-1.5 hover:bg-gray-100 rounded" title="Editar">
                      <Pencil className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => handleToggle(u.id, u.ativo ?? true)} className="p-1.5 hover:bg-gray-100 rounded" title={u.ativo ? 'Desativar' : 'Ativar'}>
                      <Power className={`h-3.5 w-3.5 ${u.ativo ? 'text-green-600' : 'text-red-400'}`} />
                    </button>
                    <button onClick={() => { setSelected(u); setDeleteOpen(true) }} className="p-1.5 hover:bg-red-50 rounded" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Novo usuário */}
      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleCriar} className="space-y-3">
            <div className="space-y-1"><Label>Nome completo</Label><Input name="nome" required /></div>
            <div className="space-y-1"><Label>E-mail</Label><Input name="email" type="email" required /></div>
            <div className="space-y-1"><Label>Senha temporária</Label><Input name="senha" type="password" required minLength={6} /></div>
            <div className="space-y-1">
              <Label>Perfil</Label>
              <select name="perfil" className="w-full border rounded-md h-9 px-3 text-sm" defaultValue="viewer">
                {PERFIS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNovoOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B4F8A] hover:bg-[#163f70]" disabled={loading}>{loading ? 'Criando...' : 'Criar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar usuário */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleEditar} className="space-y-3">
            <div className="space-y-1"><Label>Nome completo</Label><Input name="nome" defaultValue={selected?.nome} required /></div>
            <div className="space-y-1"><Label>E-mail</Label><Input name="email" type="email" defaultValue={selected?.email} required /></div>
            <div className="space-y-1">
              <Label>Nova senha <span className="text-gray-400 text-xs">(deixe vazio para manter)</span></Label>
              <Input name="novaSenha" type="password" minLength={6} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B4F8A] hover:bg-[#163f70]" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir Usuário</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Tem certeza que deseja excluir <strong>{selected?.nome}</strong>? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? 'Excluindo...' : 'Excluir'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
