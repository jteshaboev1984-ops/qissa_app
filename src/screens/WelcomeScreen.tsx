import { StylePackCover } from '../components/StylePackCover'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Language } from '../types/qissa'

export function WelcomeScreen({ language, onStart }: { language: Language; onStart: () => void }) {
  return (
    <section className="q-card space-y-6 p-5 sm:p-6">
      <StylePackCover stylePack={stylePacks[0]} variant="hero" title={t(language, 'welcome.title')} subtitle={t(language, 'welcome.subtitle')} />
      <div className="space-y-3 px-1">
        <h2 className="q-heading text-3xl font-bold leading-tight">{t(language, 'welcome.tagline')}</h2>
      </div>
      <button className="q-primary w-full" onClick={onStart}>
        {t(language, 'actions.start_story')}
      </button>
    </section>
  )
}
