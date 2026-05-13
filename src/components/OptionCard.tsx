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
      className={`group w-full rounded-[1.5rem] border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] ${
        selected
          ? 'scale-[1.01] border-[#d4af37] bg-[#fff7df] shadow-[0_18px_38px_-28px_rgba(115,92,0,.8)] ring-1 ring-[#efd47a]'
          : 'border-[#eadfc9] bg-[#fffdf7] hover:-translate-y-0.5 hover:border-[#dec992] hover:bg-[#fffaf0]'
      }`}
    >
      {preview}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold leading-snug text-[#24261f]">{title}</h3>
        {selected ? <span className="rounded-full bg-[#d4af37] px-2.5 py-0.5 text-[10px] font-black text-[#2b2100]">✓</span> : null}
      </div>
      {description && <p className="mt-2 text-sm leading-relaxed text-[#655d4b]">{description}</p>}
    </button>
  )
}
