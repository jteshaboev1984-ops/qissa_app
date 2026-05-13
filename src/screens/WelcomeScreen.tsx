import { t } from '../lib/i18n'
import { stylePacks } from '../data/stylePacks'
import { StylePackCover } from '../components/StylePackCover'
import type { Language } from '../types/qissa'

export function WelcomeScreen({ language, onStart }: { language: Language; onStart: () => void }) {
  return (
    <section className="space-y-5 rounded-3xl bg-white p-6 shadow-sm sm:p-7">
      <StylePackCover stylePack={stylePacks[0]} variant="hero" title={t(language, 'welcome.tagline')} subtitle="QISSA" />
      <p className="text-base leading-relaxed text-slate-700">{t(language, 'welcome.explanation')}</p>
      <button className="w-full rounded-2xl bg-amber-500 px-5 py-3.5 text-base font-semibold text-white shadow-sm" onClick={onStart}>
        {t(language, 'actions.start_story')}
      </button>
    </section>
  )
}
