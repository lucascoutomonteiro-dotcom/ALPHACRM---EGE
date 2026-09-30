'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, X, ChevronRight, AlertCircle, Clock, TrendingDown } from 'lucide-react'

export type Notification = {
  id: string
  type: 'overdue' | 'stalled' | 'today'
  title: string
  description: string
  href?: string
}

const TYPE_CONFIG = {
  overdue: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Atrasado' },
  stalled: { icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Parado' },
  today:   { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Hoje' },
}

const LS_KEY = 'alphaCRM_dismissed_notifications'

function loadDismissed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as string[]) } catch { return new Set() }
}

function saveDismissed(s: Set<string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...s])) } catch { /* ignore */ }
}

export function NotificationToast({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed())
  const ref = useRef<HTMLDivElement>(null)

  const active = notifications.filter(n => !dismissed.has(n.id))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function dismiss(id: string) {
    setDismissed(prev => { const next = new Set([...prev, id]); saveDismissed(next); return next })
  }

  function dismissAll() {
    const next = new Set(notifications.map(n => n.id))
    setDismissed(next); saveDismissed(next); setOpen(false)
  }

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Painel de alertas */}
      {open && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-80 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <span className="text-sm font-semibold text-[#1A1A2E]">Alertas</span>
            {active.length > 0 && (
              <button onClick={dismissAll} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Dispensar todos
              </button>
            )}
          </div>

          {active.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Nenhum alerta no momento
            </div>
          ) : (
            <div className="divide-y max-h-80 overflow-y-auto">
              {active.map(n => {
                const cfg = TYPE_CONFIG[n.type]
                const Icon = cfg.icon
                return (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1A1A2E] leading-tight">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.description}</p>
                      {n.href && (
                        <a href={n.href} onClick={() => setOpen(false)}
                          className="text-xs text-[#1B4F8A] font-medium flex items-center gap-0.5 mt-1 hover:underline">
                          Ver <ChevronRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <button onClick={() => dismiss(n.id)}
                      className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Sininho */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center h-12 w-12 bg-[#1B4F8A] text-white rounded-full shadow-lg hover:bg-[#163f70] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {active.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {active.length > 9 ? '9+' : active.length}
          </span>
        )}
      </button>
    </div>
  )
}
