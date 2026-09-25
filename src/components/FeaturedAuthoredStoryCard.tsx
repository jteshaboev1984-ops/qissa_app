import { prazdnikMuzhestvaV3 } from '../data/authoredStories'
import { resolveAuthoredStoryAssetUrl } from '../data/authoredStoryAssets'
import { authoredStoryPersistence } from '../lib/authoredStoryPersistence'

export function FeaturedAuthoredStoryCard({ onOpen }: { onOpen: () => void }) {
  const progress = authoredStoryPersistence.load(prazdnikMuzhestvaV3)
  const coverUrl = resolveAuthoredStoryAssetUrl(
    prazdnikMuzhestvaV3.cover_illustration.asset_id,
    prazdnikMuzhestvaV3.cover_illustration.runtime_url,
  )

  const readerPart = progress
    ? progress.current_part_index <= 1
      ? 1
      : Math.min(6, progress.current_part_index)
    : 1

  const statusLabel = progress?.completed
    ? 'Завершена'
    : progress && (progress.current_part_index > 0 || progress.choice_history.length > 0)
      ? `Часть ${readerPart} из 6`
      : 'Новая сказка'

  const actionLabel = progress?.completed
    ? 'Открыть сказку'
    : progress && (progress.current_part_index > 0 || progress.choice_history.length > 0)
      ? 'Продолжить'
      : 'Читать сказку'

  return (
    <section className="q-card overflow-hidden p-0">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={prazdnikMuzhestvaV3.title}
          className="aspect-[4/3] w-full object-cover"
          loading="lazy"
        />
      ) : null}

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="q-label">QISSA · Авторская история</p>
            <span className="rounded-full bg-[#f4ead8] px-3 py-1 text-xs font-bold text-[#735c00]">
              {statusLabel}
            </span>
          </div>
          <h3 className="q-heading text-2xl font-bold leading-tight">
            {prazdnikMuzhestvaV3.title}
          </h3>
          <p className="text-sm leading-6 text-[#5f5848]">
            Для 8–9 лет · приключение Темура и Самиры · 6 частей · 4 выбора
          </p>
        </div>

        <button className="q-primary w-full" onClick={onOpen}>
          {actionLabel}
        </button>
      </div>
    </section>
  )
}
