import type { ReactNode } from 'react'

interface OptionCardProps {
  title: string
  description?: string
  selected: boolean
  onClick: () => void
  preview?: ReactNode
}

export function OptionCard({ title, description, selected, onClick, preview }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-amber-300'
      }`}
    >
      {preview}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </button>
  )
}
