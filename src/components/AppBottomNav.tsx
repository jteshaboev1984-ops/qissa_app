import { t } from '../lib/i18n'
import type { Language } from '../types/qissa'

export type AppTab = 'home' | 'library' | 'parent'

const tabMarks: Record<AppTab, string> = {
  home: '⌂',
  library: '☰',
  parent: '◌',
}

export function AppBottomNav({ language, tab, onTab }: { language: Language; tab: AppTab; onTab: (tab: AppTab) => void }) {
  const tabs: AppTab[] = ['home', 'library', 'parent']
  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-[398px] rounded-full border border-[#e4d8c0] bg-[#fffdf7]/92 p-2 shadow-[0_18px_45px_-26px_rgba(49,45,34,0.55)] backdrop-blur-xl">
      <div className="grid grid-cols-3 gap-1.5">
        {tabs.map((item) => {
          const active = tab === item
          return (
            <button
              key={item}
              className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-xs font-bold transition active:scale-[0.98] ${
                active
                  ? 'bg-[#d4af37] text-[#2b2100] shadow-[0_8px_22px_-14px_rgba(115,92,0,.75)]'
                  : 'text-[#665d49] hover:bg-[#f4ead8]'
              }`}
              onClick={() => onTab(item)}
            >
              <span className="text-sm leading-none opacity-80">{tabMarks[item]}</span>
              <span>{t(language, `nav.${item}` as const)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
