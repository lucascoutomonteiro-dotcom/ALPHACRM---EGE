'use client'

import { useState, useTransition } from 'react'
import { salvarValorCampo } from '@/app/(dashboard)/admin/campos/actions'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'

export type CampoComValor = {
  id: string
  label: string
  fieldType: string
  options: string | null
  required: boolean | null
  value: string | null
}

function CampoInput({ campo, entityType, entityId }: { campo: CampoComValor; entityType: string; entityId: string }) {
  const [val, setVal] = useState(campo.value ?? '')
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function save(newVal: string) {
    startTransition(async () => {
      await salvarValorCampo(campo.id, entityType, entityId, newVal || null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })
  }

  if (campo.fieldType === 'boolean') {
    const checked = val === 'true'
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{campo.label}{campo.required && <span className="text-red-500 ml-0.5">*</span>}</span>
        <button
          onClick={() => { const nv = checked ? 'false' : 'true'; setVal(nv); save(nv) }}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${checked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {checked ? 'Sim' : 'Não'}
        </button>
      </div>
    )
  }

  if (campo.fieldType === 'select') {
    const opts: string[] = campo.options ? JSON.parse(campo.options) : []
    return (
      <div>
        <label className="text-xs font-medium text-gray-500">{campo.label}{campo.required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <select value={val} onChange={e => { setVal(e.target.value); save(e.target.value) }}
          className="mt-1 w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 bg-white">
          <option value="">— selecione —</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  const inputType = campo.fieldType === 'number' ? 'number' : campo.fieldType === 'date' ? 'date' : 'text'

  return (
    <div>
      <label className="text-xs font-medium text-gray-500">{campo.label}{campo.required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className="flex gap-2 mt-1">
        <input type={inputType} value={val} onChange={e => setVal(e.target.value)}
          onBlur={e => save(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(val) }}
          className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30" />
        {saved && <span className="text-xs text-green-600 self-center shrink-0">✓</span>}
        {pending && <span className="text-xs text-gray-400 self-center shrink-0">...</span>}
      </div>
    </div>
  )
}

export function CustomFieldsPanel({ campos, entityType, entityId }: {
  campos: CampoComValor[]
  entityType: string
  entityId: string
}) {
  const [open, setOpen] = useState(true)

  if (campos.length === 0) return null

  return (
    <div className="border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="text-sm font-semibold text-gray-700">Campos Personalizados</span>
        {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
      </button>
      {open && (
        <div className="p-4 space-y-3 bg-white">
          {campos.map(c => (
            <CampoInput key={c.id} campo={c} entityType={entityType} entityId={entityId} />
          ))}
        </div>
      )}
    </div>
  )
}
