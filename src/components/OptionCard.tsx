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
      className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
        selected
          ? 'scale-[1.01] border-amber-400 bg-amber-50 shadow-md ring-1 ring-amber-200'
          : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'
      }`}
    >
      {preview}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {selected ? <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-900">✓</span> : null}
      </div>
      {description && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>}
    </button>
  )
}
