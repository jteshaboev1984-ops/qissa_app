import { FeaturedAuthoredStoryCard } from './FeaturedAuthoredStoryCard'

export type PublishedStoriesTab = 'home' | 'library'

export function PublishedStoriesShell({
  tab,
  onTab,
  onOpenStory,
}: {
  tab: PublishedStoriesTab
  onTab: (tab: PublishedStoriesTab) => void
  onOpenStory: () => void
}) {
  return (
    <div className="relative min-h-screen text-[#1f241d]">
      <div className="mx-auto max-w-[430px] px-4 py-5 pb-28 sm:px-6">
        <header className="mb-5">
          <p className="q-label mb-2">QISSA</p>
          <h1 className="q-heading text-3xl font-bold leading-tight">
            {tab === 'home' ? 'Дом историй' : 'Библиотека'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#625846]">
            {tab === 'home'
              ? 'Интерактивные сказки, где решения ребёнка запоминаются и продолжают жить в следующих историях.'
              : 'Опубликованные сказки QISSA и сохранённый прогресс чтения.'}
          </p>
        </header>

        <FeaturedAuthoredStoryCard onOpen={onOpenStory} />
      </div>

      <nav
        className="fixed z-40 mx-auto max-w-[398px] rounded-full border border-[#e4d8c0] bg-[#fffdf7]/92 p-2 shadow-[0_18px_45px_-26px_rgba(49,45,34,0.55)] backdrop-blur-xl"
        style={{
          left: 'max(1rem, env(safe-area-inset-left))',
          right: 'max(1rem, env(safe-area-inset-right))',
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
        aria-label="QISSA"
      >
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            className={`min-h-11 rounded-full px-3 py-2.5 text-xs font-bold transition ${tab === 'home' ? 'bg-[#d4af37] text-[#2b2100]' : 'text-[#665d49] hover:bg-[#f4ead8]'}`}
            onClick={() => onTab('home')}
            aria-current={tab === 'home' ? 'page' : undefined}
          >
            ⌂&nbsp;&nbsp;Главная
          </button>
          <button
            type="button"
            className={`min-h-11 rounded-full px-3 py-2.5 text-xs font-bold transition ${tab === 'library' ? 'bg-[#d4af37] text-[#2b2100]' : 'text-[#665d49] hover:bg-[#f4ead8]'}`}
            onClick={() => onTab('library')}
            aria-current={tab === 'library' ? 'page' : undefined}
          >
            ☰&nbsp;&nbsp;Библиотека
          </button>
        </div>
      </nav>
    </div>
  )
}
