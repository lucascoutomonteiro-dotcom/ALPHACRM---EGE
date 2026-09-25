import { STATUS_CORES } from '@/lib/constants'

export function StatusBadge({ status }: { status: string }) {
  const cor = STATUS_CORES[status] ?? '#9CA3AF'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap"
      style={{ backgroundColor: cor }}
    >
      {status}
    </span>
  )
}
