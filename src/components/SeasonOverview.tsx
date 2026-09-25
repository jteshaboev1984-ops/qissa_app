import { authoredStoryPersistence } from '../lib/authoredStoryPersistence'
import type { PublishedSeason } from '../features/publishedStories/types'
import { sevenRoadsStory1ReadingState } from '../features/publishedStories/sevenRoadsProgress'
import { SevenRoadsMark } from './SevenRoadsMark'

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

      <section className="q-world-panel p-6">
        <div className="relative z-10">
          <div className="mx-auto w-28 text-[#ead3a0]">
            <SevenRoadsMark />
          </div>
          <div className="mt-2 text-center">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#ead3a0]">
              {season.worldTitle} · Сезон {season.number}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#fff9ec]">{season.title}</h1>
            <p className="mt-3 text-sm leading-6 text-[#eaf3f1]">
              6 серий · 4 решения · для 8–9 лет
            </p>
          </div>

          <div className="my-5 h-px bg-gradient-to-r from-transparent via-[#ead3a0]/70 to-transparent" />

          <p className="text-center text-sm leading-6 text-[#eef5f3]">
            Первый путь Темура и Самиры по Королевству семи дорог. Решения ребёнка сохраняются и смогут проявиться в следующих сезонах.
          </p>

          <button type="button" className="mt-5 w-full rounded-full border border-[#ead3a0] bg-[#ead3a0] px-5 py-3.5 text-sm font-bold text-[#24434a] active:scale-[0.98]" onClick={onRead}>
            {primaryLabel}
          </button>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <div className="px-1">
          <p className="q-label mb-1">Путь сезона</p>
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
                className={`q-stone-panel px-4 py-3.5 ${
                  current ? 'ring-1 ring-[#1f6670]/40' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border text-xs font-bold ${
                    completed
                      ? 'border-[#7aa49a] bg-[#dceae5] text-[#31543b]'
                      : current
                        ? 'border-[#1f6670] bg-[#1f6670] text-[#fff9ec]'
                        : 'border-[#d0c1a4] bg-[#eee5d5] text-[#847b69]'
                  }`}>
                    {completed ? '✓' : episode.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#817662]">
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
