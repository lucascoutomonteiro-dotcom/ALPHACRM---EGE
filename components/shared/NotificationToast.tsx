'use client'

import { useState, useEffect } from 'react'
import { Bell, X, ChevronRight, AlertCircle, Clock, TrendingDown } from 'lucide-react'

export type Notification = {
  id: string
  type: 'overdue' | 'stalled' | 'today'
  title: string
  description: string
  href?: string
}

const TYPE_CONFIG = {
  overdue: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  stalled:  { icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  today:    { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
}

export function NotificationToast({ notifications }: { notifications: Notification[] }) {
  const [visible, setVisible] = useState<Notification[]>([])
  const [minimized, setMinimized] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Mostra apenas após 1s para não atrapalhar o carregamento
    const t = setTimeout(() => setVisible(notifications.filter(n => !dismissed.has(n.id))), 1000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications])

  function dismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]))
    setVisible(prev => prev.filter(n => n.id !== id))
  }

  function dismissAll() {
    setVisible([])
    setDismissed(new Set(notifications.map(n => n.id)))
  }

  const active = visible.filter(n => !dismissed.has(n.id))
  if (active.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {/* Botão minimizar / bell */}
      <div className="flex justify-end pointer-events-auto">
        <button
          onClick={() => setMinimized(!minimized)}
          className="flex items-center gap-2 bg-white border border-gray-200 shadow-lg rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Bell className="h-4 w-4 text-[#1B4F8A]" />
          <span className="bg-[#1B4F8A] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {active.length}
          </span>
          {!minimized && <span className="text-xs text-gray-500">Alertas</span>}
        </button>
      </div>

      {!minimized && (
        <div className="pointer-events-auto space-y-2">
          {/* Mostrar no máximo 3 */}
          {active.slice(0, 3).map(n => {
            const cfg = TYPE_CONFIG[n.type]
            const Icon = cfg.icon
            return (
              <div key={n.id}
                className={`flex items-start gap-3 p-3 rounded-xl border shadow-lg bg-white ${cfg.border} animate-in slide-in-from-right-2`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1A1A2E] leading-tight">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.description}</p>
                  {n.href && (
                    <a href={n.href} className="text-xs text-[#1B4F8A] font-medium flex items-center gap-0.5 mt-1 hover:underline">
                      Ver <ChevronRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <button onClick={() => dismiss(n.id)}
                  className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}

          {active.length > 3 && (
            <div className="text-center text-xs text-gray-400">
              +{active.length - 3} alertas
            </div>
          )}

          {active.length > 1 && (
            <button onClick={dismissAll}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors">
              Dispensar todos
            </button>
          )}
        </div>
      )}
    </div>
  )
}
