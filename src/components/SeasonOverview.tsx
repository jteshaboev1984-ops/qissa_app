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
    <main className="mx-auto min-h-[100dvh] max-w-[430px] overflow-hidden bg-[#efe2cb] text-[#2d332f]">
      <section
        className="relative flex min-h-[72dvh] flex-col bg-[#17383d] bg-cover bg-center text-white"
        style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-[#102327]/94" />

        <div className="relative z-10 flex min-h-[72dvh] flex-col px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5">
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

          <div className="pb-2">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#efd6a0]">
              {season.worldTitle} · Сезон {season.number}
            </p>
            <h1 className="mt-2 font-serif text-[2.35rem] font-bold leading-[1.02] tracking-[-0.035em] text-white drop-shadow">
              {season.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/88">
              6 серий · 4 решения · для 8–9 лет
            </p>
            <p className="mt-3 max-w-[360px] text-sm leading-6 text-[#f0e9dd]">
              Первый путь Темура и Самиры по Королевству семи дорог. Решения ребёнка сохраняются и смогут проявиться в следующих сезонах.
            </p>

            <button
              type="button"
              className="mt-5 w-full rounded-full border border-[#f0d7a0]/80 bg-[#ecd09a] px-5 py-4 text-sm font-extrabold text-[#263f42] shadow-[0_16px_40px_-22px_rgba(0,0,0,.9)] transition active:scale-[0.98]"
              onClick={onRead}
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 sm:px-5">
        <div className="px-1">
          <p className="q-label mb-1">Путь сезона</p>
          <h2 className="q-heading text-2xl font-bold">6 серий</h2>
          <p className="mt-1 text-sm leading-6 text-[#6c6252]">
            Непройденные серии открываются по порядку.
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {season.episodes.map((episode) => {
            const completed = reading.state === 'completed' || episode.number < reading.currentEpisode
            const current = reading.state !== 'completed' && episode.number === reading.currentEpisode
            const locked = reading.state !== 'completed' && episode.number > reading.currentEpisode

            return (
              <div
                key={episode.number}
                className={`rounded-[1.35rem] border px-4 py-3.5 shadow-[0_15px_36px_-32px_rgba(74,49,13,.8)] ${
                  current
                    ? 'border-[#1f6670]/55 bg-[#edf5f2]'
                    : 'border-[#d8c39a] bg-[#fffaf0]/92'
                }`}
              >
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
                  <span className="text-xs font-semibold text-[#817662]">
                    {completed
                      ? 'Пройдено'
                      : current
                        ? reading.state === 'new'
                          ? 'Начать'
                          : 'Продолжить'
                        : locked
                          ? 'Впереди'
                          : ''}
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
