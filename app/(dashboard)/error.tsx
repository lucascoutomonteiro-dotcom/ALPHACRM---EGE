'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8">
      <h1 className="text-red-600 font-bold text-lg mb-2">Erro ao carregar página</h1>
      <pre className="bg-red-50 border border-red-200 rounded p-4 text-xs text-red-800 whitespace-pre-wrap break-all">
        {error?.message || String(error)}
        {error?.digest ? `\n\ndigest: ${error.digest}` : ''}
      </pre>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        Tentar novamente
      </button>
      <p className="mt-3 text-xs text-gray-500">Envie esta mensagem para o suporte.</p>
    </div>
  )
}
