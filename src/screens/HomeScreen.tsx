import { useMemo, useState } from 'react'
import { StylePackCover } from '../components/StylePackCover'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import { deriveStoryStatus } from '../lib/storyStatus'
import type { Episode, Language, OnboardingSelections, SeriesState } from '../types/qissa'

interface HomeScreenProps {
  language: Language
  selections: OnboardingSelections
  seriesState: SeriesState | null
  episode: Episode | null
  onCreateFirstSeries: () => void
  onContinueStory: () => void
  onResetStory: () => void
  onEditSetup: () => void
}

const ageKeyByGroup = {
  '3-4': 'age.3_4',
  '5-7': 'age.5_7',
  '8-9': 'age.8_9',
} as const

export function HomeScreen({ language, selections, seriesState, episode, onCreateFirstSeries, onContinueStory, onResetStory, onEditSetup }: HomeScreenProps) {
  const [showDetails, setShowDetails] = useState(false)
  const world = stylePacks.find((pack) => pack.id === selections.stylePackId) ?? stylePacks[0]
  const isSeriesMode = selections.storyMode === 'series'
  const storyStatus = deriveStoryStatus(selections, seriesState, episode)
  const isTomorrowMemoryState = isSeriesMode && storyStatus === 'episode_1_choice_saved'

  const compactSummary = useMemo(() => {
    const hero = t(language, `hero.${selections.heroType}` as const)
    const mood = t(language, `mood.${selections.storyMood}` as const)
    return `${hero} · ${world.title[language]} · ${mood}`
  }, [language, selections.heroType, selections.storyMood, world])

  const topTitle = useMemo(() => {
    if (storyStatus === 'not_started') return t(language, 'home.launch_ready_title')
    if (isTomorrowMemoryState) return t(language, 'home.tomorrow_memory_title')
    if (storyStatus === 'completed') return t(language, isSeriesMode ? 'home.completed_series_title' : 'home.completed_one_time_title')
    return t(language, 'home.story_in_progress_title')
  }, [language, storyStatus, isSeriesMode, isTomorrowMemoryState])

  const primaryLabel = () => {
    if (storyStatus === 'not_started') return isSeriesMode ? t(language, 'home.create_first_series') : t(language, 'home.start_one_time')
    if (isTomorrowMemoryState) return t(language, 'home.continue_from_memory')
    if (storyStatus === 'completed') return isSeriesMode ? t(language, 'home.open_last_story') : t(language, 'home.reopen_story')
    return t(language, 'home.open_current_story')
  }

  const primaryAction = storyStatus === 'not_started' ? onCreateFirstSeries : onContinueStory

  const renderSetupSummary = () => (
    <div className="rounded-[1.75rem] border border-[#eadfc9] bg-[#fff8e9] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="q-label mb-2">{t(language, 'onboarding.world')}</p>
          <p className="text-sm font-bold text-[#24261f]">{compactSummary}</p>
        </div>
        <button className="q-tertiary px-2 py-1 text-xs" onClick={() => setShowDetails((v) => !v)}>
          {showDetails ? t(language, 'home.hide_details') : t(language, 'home.show_details')}
        </button>
      </div>
      {showDetails && (
        <div className="mt-4 grid gap-2 border-t border-[#eadfc9] pt-4 text-sm text-[#625846]">
          <p>{t(language, 'onboarding.age')}: {t(language, ageKeyByGroup[selections.ageGroup])}</p>
          <p>{t(language, 'onboarding.language')}: {t(language, `language.${selections.language}` as const)}</p>
          <p>{t(language, 'onboarding.hero')}: {t(language, `hero.${selections.heroType}` as const)}</p>
          <p>{t(language, 'onboarding.world')}: {world.title[language]}</p>
          <p>{t(language, 'onboarding.story_mode')}: {t(language, selections.storyMode === 'series' ? 'mode.series' : 'mode.one_time')}</p>
          <p>{t(language, 'onboarding.mood')}: {t(language, `mood.${selections.storyMood}` as const)}</p>
        </div>
      )}
    </div>
  )

  const renderStoryState = () => {
    const completed = storyStatus === 'completed'
    const notStarted = storyStatus === 'not_started'
    const latestChoice = isTomorrowMemoryState ? seriesState?.choiceHistory.at(-1) : null
    const savedChoiceText = latestChoice?.choice_text?.trim() ?? ''
    const savedMemoryText = isTomorrowMemoryState
      ? (latestChoice?.tomorrow_seed?.trim() || latestChoice?.effect_summary?.trim() || t(language, 'home.tomorrow_memory_body'))
      : ''
    const stateBody = notStarted
      ? t(language, 'home.launch_ready_body')
      : isTomorrowMemoryState
        ? savedMemoryText
        : completed
          ? (isSeriesMode ? t(language, 'home.completed_series_body') : t(language, 'home.one_time_completed_body'))
          : t(language, 'home.read_together_hint')

    return (
      <section className="q-card overflow-hidden p-0">
        <StylePackCover stylePack={world} variant={notStarted ? 'hero' : 'card'} title={episode?.title ?? topTitle} subtitle={world.title[language]} />
        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <p className="q-label">{notStarted ? 'QISSA' : completed ? t(language, 'library.status_completed') : t(language, 'library.status_active')}</p>
            {!notStarted ? (
              <h3 className="q-heading text-2xl font-bold leading-tight">{topTitle}</h3>
            ) : null}
            <p className="text-sm leading-6 text-[#5f5848]">{stateBody}</p>
          </div>

          {isTomorrowMemoryState && savedChoiceText ? (
            <p className="rounded-2xl border border-[#eadfc9] bg-[#fff8e9] px-4 py-3 text-sm leading-6 text-[#4d4635]">
              {t(language, 'story.your_choice')}: {savedChoiceText}
            </p>
          ) : null}

          {!notStarted && !isTomorrowMemoryState && seriesState?.lastEpisodeSummary ? (
            <p className="rounded-2xl border border-[#eadfc9] bg-[#fff8e9] px-4 py-3 text-sm leading-6 text-[#4d4635]">
              {seriesState.lastEpisodeSummary}
            </p>
          ) : null}

          <div className="grid gap-2.5">
            <button className="q-primary w-full" onClick={primaryAction}>{primaryLabel()}</button>
            {completed ? <button className="q-secondary w-full" onClick={onResetStory}>{t(language, 'home.start_new_story')}</button> : null}
            <button className="q-secondary w-full" onClick={onEditSetup}>{t(language, 'home.change_choice')}</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-5 pb-28">
      <div className="px-1">
        <p className="q-label mb-2">{t(language, 'nav.home')}</p>
        <h2 className="q-heading text-3xl font-bold leading-tight">{t(language, 'home.title')}</h2>
      </div>

      {renderSetupSummary()}
      {renderStoryState()}

      {storyStatus !== 'not_started' && !isTomorrowMemoryState ? (
        <div className="rounded-[1.75rem] border border-[#e5d8bf] bg-[#f8f2e7]/75 p-4 text-center">
          <p className="mx-auto mb-3 max-w-xs text-sm leading-6 text-[#665d49]">{t(language, 'home.reset_progress_hint')}</p>
          <button className="q-secondary px-4 py-2.5" onClick={onResetStory}>
            {t(language, 'home.reset_story_soft')}
          </button>
        </div>
      ) : null}
    </section>
  )
}
