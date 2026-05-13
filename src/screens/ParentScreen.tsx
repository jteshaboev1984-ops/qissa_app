import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Episode, Language, OnboardingSelections, ReaderPreferences } from '../types/qissa'
import { ReaderSettingsPanel } from '../components/ReaderSettingsPanel'
import { VoiceSelector } from '../components/VoiceSelector'
import { StylePackCover } from '../components/StylePackCover'

export function ParentScreen({ language, selections, episode, readerPreferences, onReaderPreferencesChange, onEditSetup, onResetStory }: { language: Language; selections: OnboardingSelections; episode: Episode | null; readerPreferences: ReaderPreferences; onReaderPreferencesChange: (patch: Partial<ReaderPreferences>) => void; onEditSetup: () => void; onResetStory: () => void }) {
  const pack = stylePacks.find((p) => p.id === selections.stylePackId) ?? stylePacks[0]
  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">{t(language, 'nav.parent')}</h2>
      {episode ? <StylePackCover stylePack={pack} variant="compact" title={episode.title} subtitle={pack.title[language]} /> : null}
      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-semibold">{t(language, 'parent.setup_title')}</p>
        <p className="mt-2 text-sm text-slate-600">{t(language, 'onboarding.age')}: {t(language, `age.${selections.ageGroup === '3-5' ? '3_5' : selections.ageGroup === '6-8' ? '6_8' : '9_10'}` as const)}</p>
        <button className="mt-3 rounded-xl border border-slate-300 px-3 py-2 text-sm" onClick={onEditSetup}>{t(language, 'home.change_choice')}</button>
      </div>
      <div className="rounded-2xl border border-slate-200 p-3"><p className="mb-2 text-sm font-semibold">{t(language, 'reader.open_settings')}</p><ReaderSettingsPanel language={language} preferences={readerPreferences} onChange={onReaderPreferencesChange} onClose={() => {}} showClose={false} /></div>
      <div className="rounded-2xl border border-slate-200 p-3"><p className="mb-2 text-sm font-semibold">{t(language, 'listen.change_voice')}</p><VoiceSelector language={language} selectedVoiceId={readerPreferences.voicePresetId} onSelect={(voicePresetId) => onReaderPreferencesChange({ voicePresetId })} /></div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-600">{t(language, 'parent.reset_hint')}</p><button className="mt-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" onClick={onResetStory}>{t(language, 'home.reset_story_soft')}</button></div>
    </section>
  )
}
