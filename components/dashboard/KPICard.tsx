import { cn } from '@/lib/utils'

interface KPICardProps {
  titulo: string
  realizado: number
  meta: number
  formato?: 'moeda' | 'numero'
}

function fmt(valor: number, formato: 'moeda' | 'numero') {
  if (formato === 'moeda') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor)
  }
  return valor.toString()
}

function getBadge(pct: number) {
  if (pct >= 100) return { label: 'META BATIDA', className: 'bg-green-100 text-green-700' }
  if (pct >= 70) return { label: 'OK', className: 'bg-blue-100 text-blue-700' }
  if (pct >= 30) return { label: 'ATENÇÃO', className: 'bg-yellow-100 text-yellow-700' }
  return { label: 'CRÍTICO', className: 'bg-red-100 text-red-700' }
}

export function KPICard({ titulo, realizado, meta, formato = 'moeda' }: KPICardProps) {
  const pct = meta > 0 ? Math.round((realizado / meta) * 100) : 0
  const badge = getBadge(pct)

  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{titulo}</span>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', badge.className)}>{badge.label}</span>
      </div>
      <div className="text-2xl font-bold text-[#1A1A2E]">{fmt(realizado, formato)}</div>
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Meta: {fmt(meta, formato)}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-blue-500' : pct >= 30 ? 'bg-yellow-400' : 'bg-red-500')}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
