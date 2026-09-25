import { Fragment, type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ReaderSettingsPanel } from '../../components/ReaderSettingsPanel'
import { authoredStoryPersistence } from '../../lib/authoredStoryPersistence'
import { authoredReadingPosition } from '../../lib/authoredReadingPosition'
import { resolveAuthoredStoryAssetUrl } from '../../data/authoredStoryAssets'
import {
  advanceAuthoredStory,
  buildAuthoredNarrativeBlocks,
  canAdvanceAuthoredStory,
  createInitialAuthoredStoryProgress,
  getCurrentAuthoredStoryPart,
  getSelectedChoiceForPart,
  markAuthoredStoryResolutionShown,
  selectAuthoredStoryChoice,
} from './engine'
import type {
  AuthoredStoryChoiceIllustration,
  AuthoredStoryImageSlot,
  AuthoredStoryPackage,
  AuthoredStoryProgress,
} from './types'
import type { ReaderPreferences } from '../../types/qissa'

interface AuthoredStoryPlayerProps {
  story: AuthoredStoryPackage
  onBack?: () => void
  showMissingAssetPlaceholders?: boolean
  seasonNumber?: number
  episodeTitles?: string[]
  completionSummary?: string
  onFinishForToday?: () => void
  initialEpisodeNumber?: number
  readerPreferences: ReaderPreferences
  onReaderPreferencesChange: (patch: Partial<ReaderPreferences>) => void
}

const getReaderTextStyle = (preferences: ReaderPreferences): CSSProperties => ({
  fontSize:
    preferences.textSize === 'small'
      ? '1rem'
      : preferences.textSize === 'medium'
        ? '1.08rem'
        : preferences.textSize === 'large'
          ? '1.22rem'
          : '1.36rem',
  lineHeight:
    preferences.lineSpacing === 'normal'
      ? 1.62
      : preferences.lineSpacing === 'relaxed'
        ? 1.78
        : 1.94,
  fontFamily:
    preferences.fontMode === 'soft'
      ? 'Georgia, "Trebuchet MS", sans-serif'
      : preferences.fontMode === 'dyslexia_friendly'
        ? 'Verdana, Arial, sans-serif'
        : 'Georgia, "Times New Roman", serif',
})

const getReaderTheme = (preferences: ReaderPreferences) => {
  if (preferences.theme === 'night') {
    return {
      page: 'bg-[#151d25] text-[#f4ead8]',
      toolbar: 'bg-[#151d25]/92 border-white/10',
      text: 'text-[#f4ead8]',
      muted: 'text-[#c9c0af]',
      label: 'text-[#d8b972]',
    }
  }

  if (preferences.theme === 'light') {
    return {
      page: 'bg-[#fffdf8] text-[#24261f]',
      toolbar: 'bg-[#fffdf8]/94 border-[#e5dccb]',
      text: 'text-[#24261f]',
      muted: 'text-[#665d49]',
      label: 'text-[#876834]',
    }
  }

  return {
    page: 'bg-[#f8efdf] text-[#2b2b22]',
    toolbar: 'bg-[#f8efdf]/94 border-[#ddccb0]',
    text: 'text-[#2b2b22]',
    muted: 'text-[#665d49]',
    label: 'text-[#876834]',
  }
}

const renderInline = (text: string): ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((chunk, index) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={index}>{chunk.slice(2, -2)}</strong>
    }
    return <Fragment key={index}>{chunk}</Fragment>
  })

const readerPartProgress = (
  story: AuthoredStoryPackage,
  internalPartNumber: number,
): { current: number; total: number } => {
  if (
    story.story_id === 'seven_roads_prazdnik_muzhestva' &&
    story.story_version === 'interactive-v3' &&
    story.parts.length === 7
  ) {
    return {
      current: internalPartNumber <= 2 ? 1 : internalPartNumber - 1,
      total: 6,
    }
  }

  return { current: internalPartNumber, total: story.parts.length }
}

const firstPartIndexForEpisode = (
  story: AuthoredStoryPackage,
  episodeNumber: number,
): number | null => {
  for (let index = 0; index < story.parts.length; index += 1) {
    if (readerPartProgress(story, index + 1).current === episodeNumber) return index
  }
  return null
}

function StoryImage({
  asset,
  alt,
  showPlaceholder,
  onOpen,
  showTapHint = false,
}: {
  asset: AuthoredStoryImageSlot | AuthoredStoryChoiceIllustration
  alt: string
  showPlaceholder: boolean
  onOpen?: (url: string, alt: string) => void
  showTapHint?: boolean
}) {
  const resolvedUrl = resolveAuthoredStoryAssetUrl(asset.asset_id, asset.runtime_url)

  if (resolvedUrl) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          className="block w-full cursor-zoom-in rounded-[1.75rem] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2"
          onClick={() => onOpen?.(resolvedUrl, alt)}
          aria-label={`Открыть иллюстрацию на весь экран: ${alt}`}
        >
          <img
            src={resolvedUrl}
            alt={alt}
            className="w-full rounded-[1.75rem] border border-[#eadfc9] object-cover shadow-[0_18px_44px_-34px_rgba(60,45,20,.65)]"
            loading="lazy"
          />
        </button>
        {showTapHint ? (
          <p className="px-2 text-center text-xs leading-5 text-[#7a705f]">
            Нажмите на иллюстрацию, чтобы рассмотреть её на весь экран. Коснитесь экрана ещё раз, чтобы вернуться.
          </p>
        ) : null}
      </div>
    )
  }

  if (!showPlaceholder) return null

  return (
    <div className="rounded-[1.75rem] border border-dashed border-[#d8c7a9] bg-[#f8f1e4] px-5 py-10 text-center">
      <p className="q-label mb-2">Illustration pending</p>
      <p className="text-xs text-[#756a56]">{asset.asset_id}</p>
    </div>
  )
}

const StoryBlocks = ({
  blocks,
  showMissingAssetPlaceholders,
  onOpenImage,
}: {
  blocks: ReturnType<typeof buildAuthoredNarrativeBlocks>
  showMissingAssetPlaceholders: boolean
  onOpenImage: (url: string, alt: string) => void
}) => (
  <div className="space-y-5">
    {blocks.map((block, index) => {
      if (block.kind === 'image') {
        return (
          <StoryImage
            key={block.slot.slot_id}
            asset={block.slot}
            alt={block.slot.scene_key}
            showPlaceholder={showMissingAssetPlaceholders}
            onOpen={onOpenImage}
          />
        )
      }

      return (
        <p key={`text-${index}`} className="whitespace-pre-wrap">
          {renderInline(block.text)}
        </p>
      )
    })}
  </div>
)

export function AuthoredStoryPlayer({
  story,
  onBack,
  showMissingAssetPlaceholders = false,
  seasonNumber = 1,
  episodeTitles,
  completionSummary,
  onFinishForToday,
  initialEpisodeNumber,
  readerPreferences,
  onReaderPreferencesChange,
}: AuthoredStoryPlayerProps) {
  const persistedProgress = useMemo(() => {
    const saved = authoredStoryPersistence.load(story)
    if (saved && saved.current_part_index < story.parts.length) return saved
    return createInitialAuthoredStoryProgress(story)
  }, [story])

  const requestedPartIndex = useMemo(
    () =>
      initialEpisodeNumber == null
        ? null
        : firstPartIndexForEpisode(story, initialEpisodeNumber),
    [story, initialEpisodeNumber],
  )

  const persistedEpisode = readerPartProgress(
    story,
    persistedProgress.current_part_index + 1,
  ).current

  const historicalReplay = Boolean(
    initialEpisodeNumber != null &&
      requestedPartIndex != null &&
      (persistedProgress.completed || initialEpisodeNumber < persistedEpisode),
  )

  const initialProgress = useMemo<AuthoredStoryProgress>(() => {
    if (!historicalReplay || requestedPartIndex == null) return persistedProgress
    return {
      ...persistedProgress,
      current_part_index: requestedPartIndex,
      completed: false,
      updated_at: new Date().toISOString(),
    }
  }, [historicalReplay, persistedProgress, requestedPartIndex])

  const [progress, setProgress] = useState<AuthoredStoryProgress>(initialProgress)
  const [previewChoiceId, setPreviewChoiceId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null)
  const [showReaderSettings, setShowReaderSettings] = useState(false)
  const topRef = useRef<HTMLDivElement | null>(null)
  const restoredPartRef = useRef<number | null>(null)

  const part = getCurrentAuthoredStoryPart(story, progress)
  const selectedChoice = getSelectedChoiceForPart(part, progress)
  const storyBlocks = useMemo(
    () => buildAuthoredNarrativeBlocks(part, 'story_text'),
    [part],
  )
  const postChoiceBlocks = useMemo(
    () => buildAuthoredNarrativeBlocks(part, 'post_choice_text'),
    [part],
  )

  useEffect(() => {
    if (historicalReplay) return
    authoredStoryPersistence.save(story, progress)
  }, [story, progress, historicalReplay])

  useEffect(() => {
    if (historicalReplay) return

    const saved = authoredReadingPosition.load(story)
    if (!saved || saved.part_index !== progress.current_part_index) return
    if (restoredPartRef.current === progress.current_part_index) return

    restoredPartRef.current = progress.current_part_index

    const restore = () => {
      window.scrollTo({ top: saved.scroll_y, behavior: 'auto' })
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(restore)
    })

    const retry = window.setTimeout(restore, 350)
    return () => window.clearTimeout(retry)
  }, [story, progress.current_part_index, historicalReplay])

  useEffect(() => {
    if (historicalReplay) return

    let frame = 0

    const persistPosition = () => {
      frame = 0
      authoredReadingPosition.save(story, progress.current_part_index, window.scrollY)
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(persistPosition)
    }

    const onPageHide = () => persistPosition()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', onPageHide)
      if (frame) window.cancelAnimationFrame(frame)
      persistPosition()
    }
  }, [story, progress.current_part_index, historicalReplay])

  useEffect(() => {
    setPreviewChoiceId(selectedChoice?.choice_id ?? null)
  }, [part.part_id, selectedChoice?.choice_id])

  useEffect(() => {
    if (!lightbox) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [lightbox])

  const updateProgress = (next: AuthoredStoryProgress) => {
    setProgress(next)
    if (!historicalReplay) authoredStoryPersistence.save(story, next)
  }

  const confirmChoice = () => {
    if (!previewChoiceId || selectedChoice || !part.decision) return
    const selected = selectAuthoredStoryChoice(story, progress, previewChoiceId)
    const withResolution = markAuthoredStoryResolutionShown(story, selected)
    updateProgress(withResolution)
  }

  const continueStory = () => {
    if (!canAdvanceAuthoredStory(story, progress)) return
    const next = advanceAuthoredStory(story, progress)
    if (!historicalReplay) authoredReadingPosition.clear(story)
    restoredPartRef.current = null
    updateProgress(next)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  const restartStory = () => {
    authoredStoryPersistence.clear(story)
    authoredReadingPosition.clear(story)
    restoredPartRef.current = null
    const fresh = createInitialAuthoredStoryProgress(story)
    setPreviewChoiceId(null)
    updateProgress(fresh)
  }

  const finishForToday = () => {
    if (!onFinishForToday || !canAdvanceAuthoredStory(story, progress)) return
    const next = advanceAuthoredStory(story, progress)
    authoredReadingPosition.clear(story)
    restoredPartRef.current = null
    updateProgress(next)
    onFinishForToday()
  }

  const closeReader = () => {
    if (!historicalReplay) {
      authoredReadingPosition.save(story, progress.current_part_index, window.scrollY)
    }
    onBack?.()
  }

  const openImage = (url: string, alt: string) => setLightbox({ url, alt })

  const currentPartNumber = progress.current_part_index + 1
  const readerProgress = readerPartProgress(story, currentPartNumber)
  const readerEpisodeTitle = episodeTitles?.[readerProgress.current - 1] ?? part.title
  const canContinue = canAdvanceAuthoredStory(story, progress)
  const nextReaderProgress =
    !part.is_final && currentPartNumber < story.parts.length
      ? readerPartProgress(story, currentPartNumber + 1)
      : null
  const isReaderEpisodeBoundary = Boolean(
    nextReaderProgress && nextReaderProgress.current > readerProgress.current,
  )
  const currentDecisionChoiceId = part.decision
    ? progress.selected_choices[part.decision.decision_id] ?? null
    : null
  const readerTheme = getReaderTheme(readerPreferences)
  const readerTextStyle = getReaderTextStyle(readerPreferences)
  const replayEpisodeEnd = historicalReplay && (isReaderEpisodeBoundary || part.is_final)

  if (progress.completed) {
    const completionCoverUrl = resolveAuthoredStoryAssetUrl(
      story.cover_illustration.asset_id,
      story.cover_illustration.runtime_url,
    )

    return (
      <section
        className="relative min-h-[calc(100dvh-2.5rem)] overflow-hidden rounded-[1.85rem] bg-[#17383d] bg-cover bg-center text-center text-white"
        style={completionCoverUrl ? { backgroundImage: `url("${completionCoverUrl}")` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/32 to-[#102327]/96" />
        <div className="relative z-10 flex min-h-[calc(100dvh-2.5rem)] flex-col justify-end p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#ead3a0]">
            QISSA · Сезон {seasonNumber} · {story.title}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-[#fff9ec]">
            Сезон {seasonNumber} завершён
          </h2>
          {completionSummary ? (
            <p className="mt-3 text-base font-semibold leading-7 text-[#f8f1e4]">
              {completionSummary}
            </p>
          ) : null}
          <p className="mt-3 text-sm leading-6 text-[#eaf3f1]">
            QISSA запомнила четыре решения. В следующих сезонах они смогут влиять на то, кто первым предложит решение, что герои проверят и насколько легко Темур и Самира будут доверять друг другу.
          </p>
          <div className="mt-4 rounded-[1.4rem] border border-[#ead3a0]/35 bg-black/20 px-4 py-3 backdrop-blur-md">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#ead3a0]">
              Сезон {seasonNumber + 1}
            </p>
            <p className="mt-1 font-bold text-[#fff9ec]">Следующий сезон — скоро</p>
          </div>
          <div className="mt-5 grid gap-2.5">
            {onFinishForToday ? (
              <button
                className="w-full rounded-full border border-[#ead3a0] bg-[#ead3a0] px-5 py-3.5 text-sm font-bold text-[#24434a]"
                onClick={onFinishForToday}
              >
                Завершить на сегодня
              </button>
            ) : null}
            {onBack ? (
              <button
                className="w-full rounded-full border border-white/35 bg-black/20 px-5 py-3 text-sm font-semibold text-[#fff9ec] backdrop-blur-md"
                onClick={onBack}
              >
                На главную
              </button>
            ) : null}
            <button
              className="w-full rounded-full px-5 py-3 text-sm font-semibold text-[#ead3a0]"
              onClick={restartStory}
            >
              Пройти сезон заново
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      {showReaderSettings ? (
        <div
          className="fixed inset-0 z-[90] flex items-end bg-black/45 p-3 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => setShowReaderSettings(false)}
        >
          <div
            className="mx-auto w-full max-w-[430px]"
            role="dialog"
            aria-modal="true"
            aria-label="Настройки чтения"
            onClick={(event) => event.stopPropagation()}
          >
            <ReaderSettingsPanel
              language="ru"
              preferences={readerPreferences}
              onChange={onReaderPreferencesChange}
              onClose={() => setShowReaderSettings(false)}
            />
          </div>
        </div>
      ) : null}

      {lightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-[100] flex h-[100dvh] w-screen cursor-zoom-out items-center justify-center bg-black/95 p-3 sm:p-6"
          onClick={() => setLightbox(null)}
          aria-label="Закрыть полноэкранную иллюстрацию"
        >
          <img
            src={lightbox.url}
            alt={lightbox.alt}
            className="max-h-full max-w-full object-contain"
          />
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-xs font-semibold text-white/85">
            Коснитесь экрана, чтобы вернуться
          </span>
        </button>
      ) : null}

      <section
        ref={topRef}
        className={`min-h-[100dvh] space-y-5 pb-10 transition-colors ${readerTheme.page}`}
      >
        <div
          className={`sticky top-0 z-40 -mx-2 flex items-center justify-between gap-2 border-b px-2 py-2 backdrop-blur-xl ${readerTheme.toolbar}`}
        >
          {onBack ? (
            <button
              className="rounded-full border border-current/15 px-3.5 py-2 text-xs font-bold"
              onClick={closeReader}
            >
              Закрыть
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-current/15 px-3 py-1.5 text-xs font-bold">
              Серия {readerProgress.current} из {readerProgress.total}
            </span>
            <button
              type="button"
              className="flex h-10 min-w-10 items-center justify-center rounded-full border border-current/15 px-3 text-sm font-bold"
              onClick={() => setShowReaderSettings(true)}
              aria-label="Настройки чтения"
            >
              Aa
            </button>
          </div>
        </div>

      <header className="space-y-3">
        {currentPartNumber === 1 ? (
          <StoryImage
            asset={{
              slot_id: 'cover',
              kind: 'choice',
              scene_key: 'cover',
              status: story.cover_illustration.status,
              behavior: 'cover',
              asset_id: story.cover_illustration.asset_id,
              runtime_url: story.cover_illustration.runtime_url,
            }}
            alt={story.title}
            showPlaceholder={showMissingAssetPlaceholders}
            onOpen={openImage}
            showTapHint
          />
        ) : null}

        <div>
          <p className={`mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] ${readerTheme.label}`}>
            {story.title}
          </p>
          <h2 className={`font-serif text-3xl font-bold leading-tight ${readerTheme.text}`}>
            {readerEpisodeTitle}
          </h2>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#d9c8aa]">
          <div
            className="h-full rounded-full bg-[#1f6670] transition-all"
            style={{ width: `${(readerProgress.current / readerProgress.total) * 100}%` }}
          />
        </div>
      </header>

      <article className={`px-1 py-1 ${readerTheme.text}`} style={readerTextStyle}>
        <StoryBlocks
          blocks={storyBlocks}
          showMissingAssetPlaceholders={showMissingAssetPlaceholders}
          onOpenImage={openImage}
        />
      </article>

      {part.decision && !selectedChoice ? (
        <section className="q-stone-panel p-5">
          <p className="q-label mb-2">Твой выбор</p>
          <h3 className="q-heading mb-2 text-2xl font-bold leading-tight">{part.decision.prompt}</h3>
          {progress.choice_history.length === 0 ? (
            <p className="mb-4 text-sm leading-6 text-[#6b6251]">
              QISSA запомнит решение. В следующих сказках оно может повлиять на привычки героев и их отношения.
            </p>
          ) : null}

          <div className="grid gap-3">
            {part.decision.choices.map((choice) => {
              const active = previewChoiceId === choice.choice_id
              return (
                <div
                  key={choice.choice_id}
                  className={`overflow-hidden rounded-[1.6rem] border text-left transition-all ${
                    active
                      ? 'border-[#1f6670] bg-[#e9f2ef] shadow-[0_18px_40px_-28px_rgba(31,102,112,.55)]'
                      : 'border-[#d8c39a] bg-[#fffaf0]'
                  }`}
                >
                  <StoryImage
                    asset={choice.illustration}
                    alt={choice.text}
                    showPlaceholder={showMissingAssetPlaceholders}
                    onOpen={openImage}
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewChoiceId(choice.choice_id)}
                    className="flex w-full items-start gap-3 p-4 text-left"
                    aria-pressed={active}
                  >
                    <span className={`mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border text-xs font-bold ${
                      active
                        ? 'border-[#1f6670] bg-[#1f6670] text-[#fff9ec]'
                        : 'border-[#d8c39a] bg-[#fffaf0] text-[#746a55]'
                    }`}>
                      {active ? '✓' : ''}
                    </span>
                    <span className="font-bold leading-6 text-[#24261f]">{choice.text}</span>
                  </button>
                </div>
              )
            })}
          </div>

          {previewChoiceId ? (
            <button className="q-primary mt-4 w-full" onClick={confirmChoice}>
              Подтвердить выбор
            </button>
          ) : null}
        </section>
      ) : null}

      {selectedChoice && currentDecisionChoiceId ? (
        <>
          <section className="rounded-[1.5rem] border border-[#9bbdb8] bg-[#e5f0ed] p-5">
            <p className="q-label mb-2 text-[#35666b]">Выбор сохранён</p>
            <p className="font-bold leading-6 text-[#243c3b]">{selectedChoice.text}</p>
          </section>

          <StoryImage
            asset={selectedChoice.illustration}
            alt={selectedChoice.text}
            showPlaceholder={showMissingAssetPlaceholders}
            onOpen={openImage}
          />

          <article className={`px-1 py-1 ${readerTheme.text}`} style={readerTextStyle}>
            <div className="space-y-5">
              {selectedChoice.resolution_text
                .split(/\n\n+/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={`resolution-${index}`} className="whitespace-pre-wrap">
                    {renderInline(paragraph)}
                  </p>
                ))}
            </div>
          </article>
        </>
      ) : null}

      {(!part.decision || selectedChoice) && postChoiceBlocks.length > 0 ? (
        <article className={`px-1 py-1 ${readerTheme.text}`} style={readerTextStyle}>
          <StoryBlocks
            blocks={postChoiceBlocks}
            showMissingAssetPlaceholders={showMissingAssetPlaceholders}
            onOpenImage={openImage}
          />
        </article>
      ) : null}

      {(!part.decision || selectedChoice) ? (
        replayEpisodeEnd ? (
          <section className="q-stone-panel space-y-4 p-5 text-center">
            <div>
              <p className="q-label mb-1">Пройденная серия</p>
              <p className="text-sm leading-6 text-[#625846]">
                Вы открыли эту серию повторно. Текущий прогресс сезона и сохранённые решения не изменились.
              </p>
            </div>
            {onBack ? (
              <button className="q-primary w-full" onClick={onBack}>
                Вернуться к пути сезона
              </button>
            ) : null}
          </section>
        ) : isReaderEpisodeBoundary ? (
          <section className="q-stone-panel space-y-4 p-5 text-center">
            <div>
              <p className="q-label mb-1">Серия {readerProgress.current} завершена</p>
              <p className="text-sm leading-6 text-[#625846]">
                Можно продолжить путь сейчас или остановиться здесь. Прогресс уже сохранён.
              </p>
            </div>
            <div className="grid gap-2.5">
              <button
                className="q-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                onClick={continueStory}
                disabled={!canContinue}
              >
                Следующая серия
              </button>
              {onFinishForToday ? (
                <button
                  className="q-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={finishForToday}
                  disabled={!canContinue}
                >
                  Завершить на сегодня
                </button>
              ) : null}
            </div>
          </section>
        ) : (
          <button
            className="q-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            onClick={continueStory}
            disabled={!canContinue}
          >
            {part.is_final ? 'Завершить сезон' : 'Продолжить'}
          </button>
        )
      ) : null}
      </section>
    </>
  )
}
