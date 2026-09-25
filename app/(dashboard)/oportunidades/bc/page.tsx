import { db } from '@/lib/db'
import { oportunidadesBc } from '@/lib/schema'
import { OportunidadeBcRow } from './OportunidadeBcRow'
import { OportunidadesBcKanban } from './OportunidadesBcKanban'
import { BcViewToggle } from './BcViewToggle'

export const dynamic = 'force-dynamic'

export default async function OportunidadesBCPage() {
  const lista = await db.select().from(oportunidadesBc)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <a href="/oportunidades" className="text-sm text-gray-400 hover:text-gray-600">← Base EGE</a>
          <h1 className="text-2xl font-bold text-[#1B4F8A]">Cross-sell B/C — {lista.length} Clientes</h1>
        </div>
        <BcViewToggle
          lista={lista as Parameters<typeof OportunidadesBcKanban>[0]['lista']}
          tableContent={
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">Cliente</th>
                    <th className="text-left px-4 py-3">Pilares</th>
                    <th className="text-left px-4 py-3">Segmento</th>
                    <th className="text-right px-4 py-3">Ticket Est.</th>
                    <th className="text-left px-4 py-3">Serviços</th>
                    <th className="text-left px-4 py-3">Potencial</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lista.map((o) => (
                    <OportunidadeBcRow key={o.id} oportunidade={o as Parameters<typeof OportunidadeBcRow>[0]['oportunidade']} />
                  ))}
                  {lista.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nenhuma oportunidade cadastrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          }
        />
      </div>
    </div>
  )
}
