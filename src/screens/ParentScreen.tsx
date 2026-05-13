import { ReaderSettingsPanel } from '../components/ReaderSettingsPanel'
import { StylePackCover } from '../components/StylePackCover'
import { VoiceSelector } from '../components/VoiceSelector'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Episode, Language, OnboardingSelections, ReaderPreferences } from '../types/qissa'

export function ParentScreen({
  language,
  selections,
  episode,
  readerPreferences,
  onReaderPreferencesChange,
  onEditSetup,
  onResetStory,
}: {
  language: Language
  selections: OnboardingSelections
  episode: Episode | null
  readerPreferences: ReaderPreferences
  onReaderPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  onEditSetup: () => void
  onResetStory: () => void
}) {
  const pack = stylePacks.find((p) => p.id === selections.stylePackId) ?? stylePacks[0]
  const ageKey = selections.ageGroup === '3-5' ? 'age.3_5' : selections.ageGroup === '6-8' ? 'age.6_8' : 'age.9_10'

  return (
    <section className="space-y-5">
      <div className="px-1">
        <p className="q-label mb-2">QISSA</p>
        <h2 className="q-heading text-3xl font-bold leading-tight">{t(language, 'nav.parent')}</h2>
      </div>

      <section className="q-card overflow-hidden p-0">
        <StylePackCover stylePack={pack} variant="card" title={episode?.title ?? pack.title[language]} subtitle={t(language, 'parent.setup_title')} />
        <div className="space-y-4 p-5">
          <div>
            <p className="q-label mb-2">{t(language, 'parent.setup_title')}</p>
            <div className="grid gap-2 text-sm leading-6 text-[#625846]">
              <p>{t(language, 'onboarding.age')}: <span className="font-semibold text-[#24261f]">{t(language, ageKey)}</span></p>
              <p>{t(language, 'onboarding.world')}: <span className="font-semibold text-[#24261f]">{pack.title[language]}</span></p>
              <p>{t(language, 'onboarding.story_mode')}: <span className="font-semibold text-[#24261f]">{t(language, selections.storyMode === 'series' ? 'mode.series' : 'mode.one_time')}</span></p>
            </div>
          </div>
          <button className="q-secondary w-full" onClick={onEditSetup}>{t(language, 'home.change_choice')}</button>
        </div>
      </section>

      <section className="q-card space-y-4 p-5">
        <div>
          <p className="q-label mb-2">{t(language, 'reader.open_settings')}</p>
          <h3 className="q-heading text-2xl font-bold leading-tight">{t(language, 'reader.open_settings')}</h3>
        </div>
        <ReaderSettingsPanel language={language} preferences={readerPreferences} onChange={onReaderPreferencesChange} onClose={() => {}} showClose={false} />
      </section>

      <section className="q-card space-y-4 p-5">
        <div>
          <p className="q-label mb-2">{t(language, 'listen.change_voice')}</p>
          <h3 className="q-heading text-2xl font-bold leading-tight">{t(language, 'listen.change_voice')}</h3>
        </div>
        <VoiceSelector language={language} selectedVoiceId={readerPreferences.voicePresetId} onSelect={(voicePresetId) => onReaderPreferencesChange({ voicePresetId })} tone="light" />
      </section>

      <section className="rounded-[1.75rem] border border-[#e5d8bf] bg-[#f8f2e7]/80 p-5 text-center">
        <p className="mx-auto max-w-xs text-sm leading-6 text-[#665d49]">{t(language, 'parent.reset_hint')}</p>
        <button className="q-secondary mt-4 px-5 py-2.5" onClick={onResetStory}>{t(language, 'home.reset_story_soft')}</button>
      </section>
    </section>
  )
}
