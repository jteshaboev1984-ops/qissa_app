import { t } from '../lib/i18n'
import type { Language } from '../types/qissa'

export function WelcomeScreen({ language, onStart }: { language: Language; onStart: () => void }) {
  return (
    <section className="space-y-5 rounded-3xl bg-white p-6 shadow-sm sm:p-7">
      <div className="rounded-2xl bg-gradient-to-br from-amber-100 via-rose-50 to-sky-50 p-5">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-700">QISSA</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{t(language, 'welcome.tagline')}</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-700">{t(language, 'welcome.explanation')}</p>
      </div>
      <button className="w-full rounded-2xl bg-amber-500 px-5 py-3.5 text-base font-semibold text-white shadow-sm" onClick={onStart}>
        {t(language, 'actions.start_story')}
      </button>
    </section>
  )
}
