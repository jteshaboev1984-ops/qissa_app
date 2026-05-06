import { t } from '../lib/i18n'
import type { Language } from '../types/qissa'

export function WelcomeScreen({ language, onStart }: { language: Language; onStart: () => void }) {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">QISSA</h1>
      <p className="text-lg text-slate-700">{t(language, 'welcome.tagline')}</p>
      <p className="text-sm text-slate-600">{t(language, 'welcome.explanation')}</p>
      <button className="w-full rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-white" onClick={onStart}>
        {t(language, 'actions.start_story')}
      </button>
    </section>
  )
}
