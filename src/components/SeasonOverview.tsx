import { resolveAuthoredStoryAssetUrl } from '../data/authoredStoryAssets'
import { authoredStoryPersistence } from '../lib/authoredStoryPersistence'
import type { PublishedSeason } from '../features/publishedStories/types'
import { sevenRoadsStory1ReadingState } from '../features/publishedStories/sevenRoadsProgress'

export function SeasonOverview({
  season,
  onBack,
  onRead,
}: {
  season: PublishedSeason
  onBack: () => void
  onRead: (episodeNumber?: number) => void
}) {
  if (!season.story || season.status !== 'published') return null

  const progress = authoredStoryPersistence.load(season.story)
  const reading = sevenRoadsStory1ReadingState(progress)
  const coverUrl = resolveAuthoredStoryAssetUrl(
    season.story.cover_illustration.asset_id,
    season.story.cover_illustration.runtime_url,
  )

  const primaryLabel =
    reading.state === 'new'
      ? 'Начать сезон'
      : reading.state === 'completed'
        ? 'Открыть итог сезона'
        : 'Продолжить'

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
              ← Сезоны
            </button>
          </div>

          <div className="flex-1" />

          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#efd6a0]">
              Сезон {season.number}
            </p>
            <h1 className="mt-2 font-serif text-[2.35rem] font-bold leading-[1.02] tracking-[-0.035em] text-white drop-shadow">
              {season.title}
            </h1>
            <button
              type="button"
              className="mt-5 w-full rounded-full border border-[#f0d7a0]/80 bg-[#ecd09a] px-5 py-4 text-sm font-extrabold text-[#263f42] shadow-[0_16px_40px_-22px_rgba(0,0,0,.9)] transition active:scale-[0.98]"
              onClick={() => onRead()}
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-10 rounded-t-[2rem] bg-[#efe2cb] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-5">
        <div className="px-1">
          <p className="q-label mb-1">Путь сезона</p>
          <h2 className="q-heading text-2xl font-bold">6 серий</h2>
          <p className="mt-1 text-sm leading-6 text-[#6c6252]">
            Первый путь Темура и Самиры по Королевству семи дорог. Решения ребёнка сохраняются и смогут проявиться в следующих сезонах.
          </p>
          <p className="mt-2 text-xs leading-5 text-[#817662]">
            Пройденные серии можно открыть снова. Новые серии открываются по порядку.
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {season.episodes.map((episode) => {
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
                    Серия {episode.number}
                  </p>
                  <p className="font-bold leading-6 text-[#342f25]">{episode.title}</p>
                </div>
                <span className="flex-none text-xs font-semibold text-[#817662]">
                  {completed
                    ? 'Открыть ›'
                    : current
                      ? reading.state === 'new'
                        ? 'Начать ›'
                        : 'Продолжить ›'
                      : locked
                        ? 'Впереди'
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
                onClick={() => onRead(episode.number)}
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
