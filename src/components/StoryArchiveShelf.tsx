import { stylePacks } from '../data/stylePacks'
import { canRestoreArchiveItem, type StoryArchiveItem } from '../lib/storyArchive'
import type { Language } from '../types/qissa'

const labels: Record<
  Language,
  {
    title: string
    body: string
    episode: string
    lastChoice: string
    tomorrowSeed: string
    updated: string
    open: string
    unavailable: string
  }
> = {
  ru: {
    title: 'Прошлые истории',
    body: 'Здесь сохраняются последние истории на этом устройстве.',
    episode: 'Серия',
    lastChoice: 'Выбор',
    tomorrowSeed: 'След',
    updated: 'Сохранено',
    open: 'Открыть историю',
    unavailable: 'Можно открыть только новые сохранённые истории.',
  },
  uz: {
    title: 'Oldingi hikoyalar',
    body: 'Bu yerda shu qurilmadagi oxirgi hikoyalar saqlanadi.',
    episode: 'Qism',
    lastChoice: 'Tanlov',
    tomorrowSeed: 'Iz',
    updated: 'Saqlangan',
    open: 'Hikoyani ochish',
    unavailable: 'Faqat yangi saqlangan hikoyalarni ochish mumkin.',
  },
  kz: {
    title: 'Алдыңғы оқиғалар',
    body: 'Мұнда осы құрылғыдағы соңғы оқиғалар сақталады.',
    episode: 'Бөлім',
    lastChoice: 'Таңдау',
    tomorrowSeed: 'Із',
    updated: 'Сақталды',
    open: 'Оқиғаны ашу',
    unavailable: 'Тек жаңа сақталған оқиғаларды ашуға болады.',
  },
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function StoryArchiveShelf({
  language,
  items,
  onOpenStory,
}: {
  language: Language
  items: StoryArchiveItem[]
  onOpenStory?: (item: StoryArchiveItem) => void
}) {
  if (items.length === 0) return null

  const copy = labels[language]

  return (
    <section className="q-card space-y-4 p-5">
      <div>
        <p className="q-label mb-2">{copy.title}</p>
        <h3 className="q-heading text-2xl font-bold leading-tight">{copy.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#625846]">{copy.body}</p>
      </div>

      <div className="grid gap-3">
        {items.slice(0, 5).map((item) => {
          const pack = stylePacks.find((entry) => entry.id === item.stylePackId) ?? stylePacks[0]
          const savedDate = formatDate(item.updatedAt)
          const canOpen = canRestoreArchiveItem(item)

          return (
            <article key={`${item.id}-${item.updatedAt}`} className="rounded-[1.5rem] border border-[#eadfc9] bg-[#fff8e9] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="q-label mb-1">{pack.title[language]}</p>
                  <h4 className="text-base font-bold leading-snug text-[#24261f]">{item.title}</h4>
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#735c00]">
                  {copy.episode} {item.episodeNumber}
                </span>
              </div>

              <p className="text-sm leading-6 text-[#4d4635]">{item.summary}</p>

              {item.lastChoiceText ? (
                <p className="mt-3 rounded-2xl border border-[#eadfc9] bg-white/70 px-3 py-2 text-xs leading-5 text-[#5f5848]">
                  <span className="font-bold">{copy.lastChoice}:</span> {item.lastChoiceText}
                </p>
              ) : null}

              {item.tomorrowSeed ? (
                <p className="mt-2 rounded-2xl border border-[#eadfc9] bg-white/70 px-3 py-2 text-xs leading-5 text-[#5f5848]">
                  <span className="font-bold">{copy.tomorrowSeed}:</span> {item.tomorrowSeed}
                </p>
              ) : null}

              <div className="mt-4 grid gap-2">
                {canOpen && onOpenStory ? (
                  <button className="q-secondary w-full py-2.5 text-xs" onClick={() => onOpenStory(item)}>
                    {copy.open}
                  </button>
                ) : (
                  <p className="rounded-2xl border border-[#eadfc9] bg-white/60 px-3 py-2 text-center text-xs leading-5 text-[#7a705d]">
                    {copy.unavailable}
                  </p>
                )}

                {savedDate ? (
                  <p className="text-right text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#8a7b5e]">
                    {copy.updated}: {savedDate}
                  </p>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
