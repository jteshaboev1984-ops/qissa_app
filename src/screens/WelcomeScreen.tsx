import { StylePackCover } from '../components/StylePackCover'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Language } from '../types/qissa'

export function WelcomeScreen({ language, onStart }: { language: Language; onStart: () => void }) {
  return (
    <section className="q-card space-y-6 p-5 sm:p-6">
      <StylePackCover stylePack={stylePacks[0]} variant="hero" title={t(language, 'welcome.tagline')} subtitle="QISSA" />
      <div className="space-y-3 px-1">
        <p className="q-label">QISSA</p>
        <h2 className="q-heading text-3xl font-bold leading-tight">{t(language, 'welcome.tagline')}</h2>
        <p className="max-w-sm text-base leading-7 text-[#5f5848]">{t(language, 'welcome.explanation')}</p>
      </div>
      <button className="q-primary w-full" onClick={onStart}>
        {t(language, 'actions.start_story')}
      </button>
    </section>
  )
}
