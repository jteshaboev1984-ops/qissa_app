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
  onRead: () => void
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
        : `Продолжить · серия ${reading.currentEpisode}`

  return (
    <main className="mx-auto min-h-screen max-w-[430px] px-4 py-5 pb-10 sm:px-6">
      <div className="mb-4">
        <button type="button" className="q-secondary px-4 py-2 text-xs" onClick={onBack}>
          Назад к сезонам
        </button>
      </div>

      <section className="q-card overflow-hidden p-0">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={season.title ?? `Сезон ${season.number}`}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : null}

        <div className="space-y-4 p-5">
          <div>
            <p className="q-label mb-2">{season.worldTitle} · Сезон {season.number}</p>
            <h1 className="q-heading text-3xl font-bold leading-tight">{season.title}</h1>
            <p className="mt-2 text-sm leading-6 text-[#625846]">
              6 серий · 4 решения · для 8–9 лет
            </p>
          </div>

          <p className="text-sm leading-6 text-[#5f5848]">
            Темур и Самира становятся соперниками в Празднике мужества и отправляются по одной из семи дорог королевства. Решения ребёнка сохраняются и смогут проявиться в следующих сезонах.
          </p>

          <button type="button" className="q-primary w-full" onClick={onRead}>
            {primaryLabel}
          </button>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <div className="px-1">
          <p className="q-label mb-1">Серии сезона</p>
          <h2 className="q-heading text-2xl font-bold">6 серий</h2>
        </div>

        <div className="space-y-2.5">
          {season.episodes.map((episode) => {
            const completed = reading.state === 'completed' || episode.number < reading.currentEpisode
            const current = reading.state !== 'completed' && episode.number === reading.currentEpisode
            const locked = reading.state !== 'completed' && episode.number > reading.currentEpisode

            return (
              <div
                key={episode.number}
                className={`rounded-[1.4rem] border px-4 py-3.5 ${
                  current
                    ? 'border-[#d4af37] bg-[#fff8df]'
                    : 'border-[#eadfc9] bg-[#fffdf7]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold ${
                    completed
                      ? 'bg-[#dbeadb] text-[#31543b]'
                      : current
                        ? 'bg-[#d4af37] text-[#2b2100]'
                        : 'bg-[#eee7da] text-[#847b69]'
                  }`}>
                    {completed ? '✓' : episode.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#817662]">
                      Серия {episode.number}
                    </p>
                    <p className="font-bold leading-6 text-[#342f25]">{episode.title}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#817662]">
                    {completed ? 'Пройдено' : current ? (reading.state === 'new' ? 'Начать' : 'Продолжить') : locked ? 'Впереди' : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
