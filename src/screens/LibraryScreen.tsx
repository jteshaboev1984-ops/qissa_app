import { StylePackCover } from '../components/StylePackCover'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import { deriveStoryStatus } from '../lib/storyStatus'
import type { Episode, Language, OnboardingSelections, SeriesState, StoryStatus } from '../types/qissa'

const libraryLabels: Record<
  Language,
  {
    world: string
    format: string
    episode: string
    progress: string
    currentEpisode: string
    lastChoice: string
    tomorrowSeed: string
    nextPreview: string
    noChoiceYet: string
    deviceOnly: string
  }
> = {
  ru: {
    world: 'Мир',
    format: 'Формат',
    episode: 'Серия',
    progress: 'Прогресс',
    currentEpisode: 'Текущая история',
    lastChoice: 'Последний выбор',
    tomorrowSeed: 'След для продолжения',
    nextPreview: 'Что дальше',
    noChoiceYet: 'Выбор ещё не сделан.',
    deviceOnly: 'Пока история хранится только на этом устройстве.',
  },
  uz: {
    world: 'Dunyo',
    format: 'Format',
    episode: 'Qism',
    progress: 'Jarayon',
    currentEpisode: 'Joriy hikoya',
    lastChoice: 'Oxirgi tanlov',
    tomorrowSeed: 'Davom uchun iz',
    nextPreview: 'Keyin nima bo‘ladi',
    noChoiceYet: 'Tanlov hali qilinmagan.',
    deviceOnly: 'Hozircha hikoya faqat shu qurilmada saqlanadi.',
  },
  kz: {
    world: 'Әлем',
    format: 'Формат',
    episode: 'Бөлім',
    progress: 'Барысы',
    currentEpisode: 'Қазіргі оқиға',
    lastChoice: 'Соңғы таңдау',
    tomorrowSeed: 'Жалғастыру ізі',
    nextPreview: 'Әрі қарай не болады',
    noChoiceYet: 'Таңдау әлі жасалған жоқ.',
    deviceOnly: 'Әзірге оқиға тек осы құрылғыда сақталады.',
  },
}

function statusLabel(language: Language, status: StoryStatus) {
  if (status === 'completed') return t(language, 'library.status_completed')
  if (status === 'episode_1_choice_saved') return t(language, 'home.tomorrow_memory_title')
  return t(language, 'library.status_active')
}

function storyActionLabel(language: Language, status: StoryStatus, storyMode: OnboardingSelections['storyMode']) {
  if (status === 'completed' && storyMode === 'series') return t(language, 'home.open_last_story')
  if (status === 'episode_1_choice_saved' && storyMode === 'series') return t(language, 'home.continue_from_memory')
  return t(language, 'home.open_current_story')
}

export function LibraryScreen({
  language,
  selections,
  seriesState,
  episode,
  onOpenStory,
  onCreateStory,
}: {
  language: Language
  selections: OnboardingSelections
  seriesState: SeriesState | null
  episode: Episode | null
  onOpenStory: () => void
  onCreateStory: () => void
}) {
  const pack = stylePacks.find((p) => p.id === selections.stylePackId) ?? stylePacks[0]
  const status = deriveStoryStatus(selections, seriesState, episode)
  const labels = libraryLabels[language]
  const latestChoice =
    seriesState && seriesState.choiceHistory.length > 0
      ? seriesState.choiceHistory[seriesState.choiceHistory.length - 1]
      : null
  const episodeNumber = Math.max(seriesState?.episodeCount ?? (episode?.episode_id.startsWith('ep-2') ? 2 : 1), 1)
  const completed = status === 'completed'

  if (!episode) {
    return (
      <section className="space-y-5 pb-28">
        <div className="px-1">
          <p className="q-label mb-2">{t(language, 'nav.library')}</p>
          <h2 className="q-heading text-3xl font-bold leading-tight">{t(language, 'library.empty_title')}</h2>
        </div>

        <div className="q-card overflow-hidden p-0">
          <StylePackCover stylePack={pack} variant="hero" title={pack.title[language]} subtitle={t(language, 'library.empty_title')} />
          <div className="space-y-4 p-5">
            <p className="text-sm leading-6 text-[#625846]">{t(language, 'library.empty_body')}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#eadfc9] bg-[#fff8e9] px-4 py-3">
                <p className="q-label mb-1">{labels.world}</p>
                <p className="text-sm font-bold text-[#3d382c]">{pack.title[language]}</p>
              </div>
              <div className="rounded-2xl border border-[#eadfc9] bg-[#fff8e9] px-4 py-3">
                <p className="q-label mb-1">{labels.format}</p>
                <p className="text-sm font-bold text-[#3d382c]">{t(language, selections.storyMode === 'series' ? 'mode.series' : 'mode.one_time')}</p>
              </div>
            </div>

            <button className="q-primary w-full" onClick={onCreateStory}>
              {t(language, selections.storyMode === 'series' ? 'home.create_first_series' : 'home.start_one_time')}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-5 pb-28">
      <div className="px-1">
        <p className="q-label mb-2">{t(language, 'nav.library')}</p>
        <h2 className="q-heading text-3xl font-bold leading-tight">{labels.currentEpisode}</h2>
      </div>

      <article className="q-card overflow-hidden p-0">
        <StylePackCover stylePack={pack} variant="hero" title={episode.title} subtitle={`${pack.title[language]} · ${labels.episode} ${episodeNumber}`} />

        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="q-label">{statusLabel(language, status)}</p>
            <span className="rounded-full bg-[#f4ead8] px-3 py-1 text-xs font-bold text-[#735c00]">
              {t(language, selections.storyMode === 'series' ? 'mode.series' : 'mode.one_time')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#eadfc9] bg-[#fff8e9] px-4 py-3">
              <p className="q-label mb-1">{labels.world}</p>
              <p className="text-sm font-bold text-[#3d382c]">{pack.title[language]}</p>
            </div>
            <div className="rounded-2xl border border-[#eadfc9] bg-[#fff8e9] px-4 py-3">
              <p className="q-label mb-1">{labels.progress}</p>
              <p className="text-sm font-bold text-[#3d382c]">{labels.episode} {episodeNumber}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eadfc9] bg-[#fffdf7] px-4 py-3">
            <p className="q-label mb-2">{labels.lastChoice}</p>
            <p className="text-sm leading-6 text-[#4d4635]">{latestChoice?.choice_text ?? labels.noChoiceYet}</p>
          </div>

          {latestChoice?.tomorrow_seed ? (
            <div className="rounded-2xl border border-[#eadfc9] bg-[#fff8e9] px-4 py-3">
              <p className="q-label mb-2">{labels.tomorrowSeed}</p>
              <p className="text-sm leading-6 text-[#4d4635]">{latestChoice.tomorrow_seed}</p>
            </div>
          ) : null}

          {seriesState?.lastEpisodeSummary ? (
            <div className="rounded-2xl border border-[#eadfc9] bg-[#fff8e9] px-4 py-3">
              <p className="q-label mb-2">{t(language, 'home.last_episode_summary')}</p>
              <p className="text-sm leading-6 text-[#4d4635]">{seriesState.lastEpisodeSummary}</p>
            </div>
          ) : null}

          {!completed && !latestChoice && episode.nextEpisodePreview ? (
            <div className="rounded-2xl border border-[#eadfc9] bg-[#fffdf7] px-4 py-3">
              <p className="q-label mb-2">{labels.nextPreview}</p>
              <p className="text-sm leading-6 text-[#4d4635]">{episode.nextEpisodePreview}</p>
            </div>
          ) : null}

          <button className="q-primary w-full" onClick={onOpenStory}>
            {storyActionLabel(language, status, selections.storyMode)}
          </button>

          <p className="text-center text-xs leading-5 text-[#7a705d]">
            {labels.deviceOnly}
          </p>
        </div>
      </article>
    </section>
  )
}
