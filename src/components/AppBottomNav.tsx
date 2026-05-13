import { t } from '../lib/i18n'
import type { Language } from '../types/qissa'

export type AppTab = 'home' | 'library' | 'parent'

export function AppBottomNav({ language, tab, onTab }: { language: Language; tab: AppTab; onTab: (tab: AppTab) => void }) {
  const tabs: AppTab[] = ['home', 'library', 'parent']
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 pb-4 pt-2 backdrop-blur sm:left-1/2 sm:w-[420px] sm:-translate-x-1/2 sm:rounded-t-2xl">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((item) => (
          <button key={item} className={`rounded-xl px-3 py-2 text-sm font-medium ${tab === item ? 'bg-amber-100 text-amber-900' : 'text-slate-600'}`} onClick={() => onTab(item)}>
            {t(language, `nav.${item}` as const)}
          </button>
        ))}
      </div>
    </nav>
  )
}
