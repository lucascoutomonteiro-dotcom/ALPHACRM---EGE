'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, MessageSquare, Phone, Mail, ExternalLink, Clock, ChevronRight } from 'lucide-react'
import { registrarInteracao } from '@/app/(dashboard)/crm/actions'
import { buscarInteracoesContato } from '@/app/(dashboard)/crm/actions'

type Contato = {
  id: string
  nome: string | null
  telefone: string | null
  email: string | null
}

type Interacao = {
  id: string
  tipo: string | null
  descricao: string | null
  proximoPasso: string | null
  dataProximoPasso: string | null
  dataInteracao: Date | null
}

const TIPOS = ['Ligação', 'WhatsApp', 'E-mail', 'Reunião', 'Visita', 'Outro']

export function PainelInteracao({ contato, userId, onClose }: {
  contato: Contato
  userId: string
  onClose: () => void
}) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const [historico, setHistorico] = useState<Interacao[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(true)
  const [tipo, setTipo] = useState('WhatsApp')
  const [descricao, setDescricao] = useState('')
  const [proximoPasso, setProximoPasso] = useState('')
  const [dataProximoPasso, setDataProximoPasso] = useState('')
  const [proximaAtividade, setProximaAtividade] = useState('')
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    buscarInteracoesContato(contato.id).then(r => {
      setHistorico(r as Interacao[])
      setLoadingHistorico(false)
    }).catch(() => setLoadingHistorico(false))
  }, [contato.id])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) return
    setSending(true)
    const fd = new FormData()
    fd.set('contatoId', contato.id)
    fd.set('tipo', tipo)
    fd.set('descricao', descricao)
    fd.set('proximoPasso', proximoPasso)
    fd.set('dataProximoPasso', dataProximoPasso)
    fd.set('proximaAtividade', proximaAtividade)
    fd.set('usuarioId', userId)
    await registrarInteracao(fd)
    setSending(false)
    setSaved(true)
    setDescricao('')
    setProximoPasso('')
    setDataProximoPasso('')
    setTimeout(() => setSaved(false), 2000)
    const updated = await buscarInteracoesContato(contato.id)
    setHistorico(updated as Interacao[])
    router.refresh()
  }

  const tel = contato.telefone?.replace(/\D/g, '')
  const waUrl = tel ? `https://wa.me/55${tel}` : null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1" onClick={onClose} />
      <div
        ref={panelRef}
        className="w-80 bg-white border-l shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-[#1B4F8A] text-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="font-semibold text-sm truncate max-w-[180px]">{contato.nome || 'Contato'}</span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick contact buttons */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium bg-green-500 text-white px-3 py-1.5 rounded-full hover:bg-green-600 transition-colors">
              <ExternalLink className="h-3 w-3" /> WhatsApp
            </a>
          )}
          {contato.email && (
            <a href={`mailto:${contato.email}`}
              className="flex items-center gap-1.5 text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors">
              <Mail className="h-3 w-3" /> E-mail
            </a>
          )}
          {contato.telefone && (
            <a href={`tel:${contato.telefone}`}
              className="flex items-center gap-1.5 text-xs font-medium bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-300 transition-colors">
              <Phone className="h-3 w-3" /> Ligar
            </a>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Histórico */}
          <div className="px-4 pt-3 pb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Últimas interações</h3>
            {loadingHistorico ? (
              <p className="text-xs text-gray-400 py-2">Carregando...</p>
            ) : historico.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Nenhuma interação ainda.</p>
            ) : (
              <div className="space-y-0">
                {historico.map((h, i) => (
                  <div key={h.id} className="flex gap-2 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[#1B4F8A] mt-1 shrink-0" />
                      {i < historico.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-0.5" />}
                    </div>
                    <div className="pb-2.5 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-700">{h.tipo}</span>
                        <span className="text-gray-400">
                          {h.dataInteracao ? new Date(h.dataInteracao).toLocaleDateString('pt-BR') : ''}
                        </span>
                      </div>
                      {h.descricao && <p className="text-gray-500 leading-tight">{h.descricao}</p>}
                      {h.proximoPasso && (
                        <p className="text-[#1B4F8A] flex items-center gap-0.5 mt-0.5">
                          <ChevronRight className="h-3 w-3" />{h.proximoPasso}
                          {h.dataProximoPasso && <span className="text-gray-400 ml-0.5">({h.dataProximoPasso})</span>}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nova interação */}
          <div className="px-4 pb-4 border-t pt-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Registrar interação</h3>
            <form onSubmit={handleSubmit} className="space-y-2">
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30">
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea
                required
                placeholder="O que foi discutido..."
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30"
              />
              <input
                type="text"
                placeholder="Próximo passo"
                value={proximoPasso}
                onChange={e => setProximoPasso(e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-0.5">Data próx. passo</label>
                  <input type="date" value={dataProximoPasso} onChange={e => setDataProximoPasso(e.target.value)}
                    className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-0.5">Follow-up para</label>
                  <input type="date" value={proximaAtividade} onChange={e => setProximaAtividade(e.target.value)}
                    className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
                </div>
              </div>
              <button type="submit" disabled={sending || !descricao.trim()}
                className="w-full bg-[#1B4F8A] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#163f70] disabled:opacity-50 transition-colors">
                {sending ? 'Salvando...' : saved ? '✓ Registrado' : 'Registrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
