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
          ? 'scale-[1.01] border-amber-400 bg-amber-50 shadow-md'
          : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'
      }`}
    >
      {preview}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>}
    </button>
  )
}
