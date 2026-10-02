import { resolveAuthoredStoryAssetUrl } from '../data/authoredStoryAssets'
import {
  getPrimaryPublishedSeasonStory,
  getPublishedSeasonStories,
} from '../data/sevenRoadsSeasons'
import { authoredStoryPersistence } from '../lib/authoredStoryPersistence'
import type { PublishedSeason } from '../features/publishedStories/types'
import {
  formatSevenRoadsEpisodeLabel,
  formatSevenRoadsSeasonLabel,
  formatSevenRoadsStoryLabel,
  getSevenRoadsCopy,
  type SevenRoadsLanguage,
} from '../features/publishedStories/sevenRoadsCopy'
import { sevenRoadsStory1ReadingState } from '../features/publishedStories/sevenRoadsProgress'

export function SeasonOverview({
  language,
  season,
  onBack,
  onRead,
}: {
  language: SevenRoadsLanguage
  season: PublishedSeason
  onBack: () => void
  onRead: (storyNumber: number, episodeNumber?: number) => void
}) {
  const publishedStories = getPublishedSeasonStories(season)
  const seasonStory = getPrimaryPublishedSeasonStory(season)
  const story = seasonStory?.authoredStory
  if (!seasonStory || !story || season.status !== 'published') return null

  const copy = getSevenRoadsCopy(language)

  if (publishedStories.length > 1) {
    return (
      <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-[#efe2cb] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-[#2d332f] sm:px-5">
        <button
          type="button"
          className="rounded-full border border-[#cdb583] bg-[#fffaf0] px-4 py-2.5 text-xs font-bold text-[#4b463b] active:scale-[0.98]"
          onClick={onBack}
        >
          ← {copy.seasons}
        </button>

        <div className="mt-8">
          <p className="q-label">{formatSevenRoadsSeasonLabel(language, season.number)}</p>
          <h1 className="q-heading mt-1 text-3xl font-bold">
            {season.title ?? copy.worldTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6c6252]">
            {language === 'uz'
              ? 'Bu mavsum bir nechta alohida hikoyadan iborat. Har bir hikoya o‘z o‘qish joyi va tanlovlarini alohida saqlaydi.'
              : 'Этот сезон состоит из нескольких отдельных сказок. У каждой сказки свой прогресс чтения и свои сохранённые выборы.'}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {publishedStories.map((seasonStoryEntry) => {
            const authoredStory = seasonStoryEntry.authoredStory
            if (!authoredStory) return null

            const storyProgress = authoredStoryPersistence.load(authoredStory)
            const storyState =
              storyProgress?.completed
                ? copy.completed
                : storyProgress
                  ? copy.continue
                  : language === 'uz'
                    ? 'Boshlanmagan'
                    : 'Не начата'
            const coverUrl = resolveAuthoredStoryAssetUrl(
              authoredStory.cover_illustration.asset_id,
              authoredStory.cover_illustration.runtime_url,
            )

            return (
              <button
                key={seasonStoryEntry.id}
                type="button"
                className="relative min-h-44 w-full overflow-hidden rounded-[1.55rem] border border-[#cfb57f] bg-[#17383d] text-left shadow-[0_18px_42px_-30px_rgba(0,0,0,.75)] transition active:scale-[0.99]"
                onClick={() => onRead(seasonStoryEntry.number)}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#f0d7a0]">
                      {formatSevenRoadsStoryLabel(language, seasonStoryEntry.number)}
                    </p>
                    <span className="rounded-full bg-black/35 px-2.5 py-1 text-[0.62rem] font-bold text-white/90 backdrop-blur">
                      {storyState}
                    </span>
                  </div>
                  <h2 className="mt-1 font-serif text-2xl font-bold leading-tight text-white">
                    {seasonStoryEntry.title ?? authoredStory.title}
                  </h2>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    )
  }
  const progress = authoredStoryPersistence.load(story)
  const reading = sevenRoadsStory1ReadingState(progress)
  const coverUrl = resolveAuthoredStoryAssetUrl(
    story.cover_illustration.asset_id,
    story.cover_illustration.runtime_url,
  )

  const primaryLabel =
    reading.state === 'new'
      ? copy.startSeason
      : reading.state === 'completed'
        ? copy.openSeasonResult
        : copy.continue

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-[#efe2cb] text-[#2d332f]">
      <section
        className="sticky top-0 z-30 flex h-[68dvh] min-h-[520px] max-h-[720px] flex-col bg-[#17383d] bg-cover bg-center text-white"
        style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-[#102327]/94" />

        <div className="relative z-10 flex h-full flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5">
          <div>
            <button
              type="button"
              className="rounded-full border border-white/28 bg-black/20 px-4 py-2.5 text-xs font-bold text-white/95 backdrop-blur-md active:scale-[0.98]"
              onClick={onBack}
            >
              ← {copy.seasons}
            </button>
          </div>

          <div className="flex-1" />

          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#efd6a0]">
              {formatSevenRoadsSeasonLabel(language, season.number)}
            </p>
            <h1 className="mt-2 font-serif text-[2.35rem] font-bold leading-[1.02] tracking-[-0.035em] text-white drop-shadow">
              {season.title}
            </h1>
            <button
              type="button"
              className="mt-5 w-full rounded-full border border-[#f0d7a0]/80 bg-[#ecd09a] px-5 py-4 text-sm font-extrabold text-[#263f42] shadow-[0_16px_40px_-22px_rgba(0,0,0,.9)] transition active:scale-[0.98]"
              onClick={() => onRead(seasonStory.number)}
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-10 rounded-t-[2rem] bg-[#efe2cb] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-5">
        <div className="px-1">
          <p className="q-label mb-1">{copy.openSeasonPath}</p>
          <h2 className="q-heading text-2xl font-bold">{copy.sixEpisodes}</h2>
          <p className="mt-1 text-sm leading-6 text-[#6c6252]">
            {copy.seasonDescription}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#817662]">
            {copy.seasonReplayHint}
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {seasonStory.episodes.map((episode) => {
            const completed = reading.state === 'completed' || episode.number < reading.currentEpisode
            const current = reading.state !== 'completed' && episode.number === reading.currentEpisode
            const locked = reading.state !== 'completed' && episode.number > reading.currentEpisode
            const available = completed || current

            const className = `w-full rounded-[1.35rem] border px-4 py-3.5 text-left shadow-[0_15px_36px_-32px_rgba(74,49,13,.8)] ${
              current
                ? 'border-[#1f6670]/65 bg-[#edf5f2] transition active:scale-[0.99]'
                : completed
                  ? 'border-[#c9b27f] bg-[#fffaf0] transition active:scale-[0.99]'
                  : 'border-[#d8c39a] bg-[#fffaf0]/72 opacity-65'
            }`

            const body = (
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border text-xs font-bold ${
                    completed
                      ? 'border-[#7aa49a] bg-[#dceae5] text-[#31543b]'
                      : current
                        ? 'border-[#1f6670] bg-[#1f6670] text-[#fff9ec]'
                        : 'border-[#d0c1a4] bg-[#eee5d5] text-[#847b69]'
                  }`}
                >
                  {completed ? '✓' : episode.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#817662]">
                    {formatSevenRoadsEpisodeLabel(language, episode.number)}
                  </p>
                  <p className="font-bold leading-6 text-[#342f25]">{episode.title}</p>
                </div>
                <span className="flex-none text-xs font-semibold text-[#817662]">
                  {completed
                    ? copy.open
                    : current
                      ? reading.state === 'new'
                        ? copy.begin
                        : copy.continueArrow
                      : locked
                        ? copy.ahead
                        : ''}
                </span>
              </div>
            )

            if (!available) {
              return (
                <div key={episode.number} className={className} aria-disabled="true">
                  {body}
                </div>
              )
            }

            return (
              <button
                key={episode.number}
                type="button"
                className={className}
                onClick={() => onRead(seasonStory.number, episode.number)}
              >
                {body}
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}
