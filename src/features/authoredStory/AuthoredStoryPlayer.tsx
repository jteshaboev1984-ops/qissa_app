import { Fragment, type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ReaderSettingsPanel } from '../../components/ReaderSettingsPanel'
import { authoredStoryPersistence } from '../../lib/authoredStoryPersistence'
import { authoredReadingPosition } from '../../lib/authoredReadingPosition'
import { authoredIllustrationDiscovery } from '../../lib/authoredIllustrationDiscovery'
import { resolveAuthoredStoryAssetUrl } from '../../data/authoredStoryAssets'
import {
  formatSevenRoadsEpisodeCompleted,
  formatSevenRoadsEpisodeLabel,
  formatSevenRoadsEpisodeProgress,
  formatSevenRoadsPartProgress,
  formatSevenRoadsSeasonCompleted,
  formatSevenRoadsSeasonLabel,
  formatSevenRoadsStoryCompleted,
  formatSevenRoadsStoryLabel,
  getSevenRoadsCopy,
  type SevenRoadsLanguage,
} from '../publishedStories/sevenRoadsCopy'
import {
  advanceAuthoredStory,
  buildAuthoredChoiceResolutionBlocks,
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

type AuthoredStoryCompletionScope = 'season' | 'story' | 'episode'
type AuthoredStoryReaderUnit = 'episode' | 'part'

interface AuthoredStoryPlayerProps {
  story: AuthoredStoryPackage
  onBack?: () => void
  showMissingAssetPlaceholders?: boolean
  showCover?: boolean
  seasonNumber?: number
  storyNumber?: number
  completionScope?: AuthoredStoryCompletionScope
  readerUnit?: AuthoredStoryReaderUnit
  episodeTitles?: string[]
  completionSummary?: string
  nextSeasonPublished?: boolean
  onFinishForToday?: () => void
  initialEpisodeNumber?: number
  readerPreferences: ReaderPreferences
  onReaderPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  inheritedSelectedChoices?: Record<string, string>
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
  onSeen,
  discoverable = true,
  language,
}: {
  asset: AuthoredStoryImageSlot | AuthoredStoryChoiceIllustration
  alt: string
  showPlaceholder: boolean
  onOpen?: (url: string, alt: string) => void
  showTapHint?: boolean
  onSeen?: (assetId: string) => void
  discoverable?: boolean
  language: SevenRoadsLanguage
}) {
  const copy = getSevenRoadsCopy(language)
  const resolvedUrl = resolveAuthoredStoryAssetUrl(asset.asset_id, asset.runtime_url)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!resolvedUrl || !discoverable || !onSeen || !containerRef.current) return

    const target = containerRef.current
    let seen = false
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry || !entry.isIntersecting || entry.intersectionRatio < 0.25 || seen) return
        seen = true
        onSeen(asset.asset_id)
        observer.disconnect()
      },
      { threshold: [0.25, 0.5] },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [asset.asset_id, discoverable, onSeen, resolvedUrl])

  if (resolvedUrl) {
    return (
      <div ref={containerRef} className="space-y-2">
        <button
          type="button"
          className="block w-full cursor-zoom-in rounded-[1.75rem] text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2"
          onClick={() => onOpen?.(resolvedUrl, alt)}
          aria-label={`${copy.openFullscreen}: ${alt}`}
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
            {copy.imageTapHint}
          </p>
        ) : null}
      </div>
    )
  }

  if (!showPlaceholder) return null

  return (
    <div className="rounded-[1.75rem] border border-dashed border-[#d8c7a9] bg-[#f8f1e4] px-5 py-10 text-center">
      <p className="q-label mb-2">{copy.illustrationPending}</p>
      <p className="text-xs text-[#756a56]">{asset.asset_id}</p>
    </div>
  )
}

const StoryBlocks = ({
  blocks,
  showMissingAssetPlaceholders,
  onOpenImage,
  onImageSeen,
  language,
  episodeNumber,
  readerUnit,
}: {
  blocks: ReturnType<typeof buildAuthoredNarrativeBlocks>
  showMissingAssetPlaceholders: boolean
  onOpenImage: (url: string, alt: string) => void
  onImageSeen: (assetId: string) => void
  language: SevenRoadsLanguage
  episodeNumber: number
  readerUnit: AuthoredStoryReaderUnit
}) => (
  <div className="space-y-5">
    {blocks.map((block, index) => {
      if (block.kind === 'image') {
        return (
          <StoryImage
            key={block.slot.slot_id}
            asset={block.slot}
            alt={
              language === 'uz'
                ? `${episodeNumber}-qism lavhasi`
                : readerUnit === 'part'
                  ? `Сцена части ${episodeNumber}`
                  : `Сцена серии ${episodeNumber}`
            }
            showPlaceholder={showMissingAssetPlaceholders}
            onOpen={onOpenImage}
            onSeen={onImageSeen}
            language={language}
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
  showCover = true,
  seasonNumber = 1,
  storyNumber = 1,
  completionScope = 'season',
  readerUnit = 'episode',
  episodeTitles,
  completionSummary,
  nextSeasonPublished = false,
  onFinishForToday,
  initialEpisodeNumber,
  readerPreferences,
  onReaderPreferencesChange,
  inheritedSelectedChoices = {},
}: AuthoredStoryPlayerProps) {
  const language: SevenRoadsLanguage = story.language === 'uz' ? 'uz' : 'ru'
  const copy = getSevenRoadsCopy(language)

  const persistedProgress = useMemo(() => {
    const saved = authoredStoryPersistence.load(story)
    const base =
      saved && saved.current_part_index < story.parts.length
        ? saved
        : createInitialAuthoredStoryProgress(story)

    if (Object.keys(inheritedSelectedChoices).length === 0) return base

    return {
      ...base,
      selected_choices: {
        ...inheritedSelectedChoices,
        ...base.selected_choices,
      },
    }
  }, [story, inheritedSelectedChoices])

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
  const [reviewPartIndex, setReviewPartIndex] = useState<number | null>(null)
  const topRef = useRef<HTMLDivElement | null>(null)
  const restoredPartRef = useRef<number | null>(null)

  const displayedPartIndex = reviewPartIndex ?? progress.current_part_index
  const isReviewingPreviousPart =
    reviewPartIndex != null && reviewPartIndex < progress.current_part_index
  const part =
    story.parts[displayedPartIndex] ?? getCurrentAuthoredStoryPart(story, progress)
  const selectedChoice = getSelectedChoiceForPart(part, progress)
  const storyBlocks = useMemo(
    () => buildAuthoredNarrativeBlocks(part, 'story_text', progress.selected_choices),
    [part, progress.selected_choices],
  )
  const postChoiceBlocks = useMemo(
    () => buildAuthoredNarrativeBlocks(part, 'post_choice_text', progress.selected_choices),
    [part, progress.selected_choices],
  )
  const selectedResolutionBlocks = useMemo(
    () => selectedChoice ? buildAuthoredChoiceResolutionBlocks(selectedChoice) : [],
    [selectedChoice],
  )

  useEffect(() => {
    if (historicalReplay) return
    authoredStoryPersistence.save(story, progress)
  }, [story, progress, historicalReplay])

  useEffect(() => {
    if (historicalReplay || reviewPartIndex != null) return

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
  }, [story, progress.current_part_index, historicalReplay, reviewPartIndex])

  useEffect(() => {
    if (historicalReplay || reviewPartIndex != null) return

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
  }, [story, progress.current_part_index, historicalReplay, reviewPartIndex])

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
    if (isReviewingPreviousPart || !previewChoiceId || selectedChoice || !part.decision) return
    const selected = selectAuthoredStoryChoice(story, progress, previewChoiceId)
    const withResolution = markAuthoredStoryResolutionShown(story, selected)
    updateProgress(withResolution)
  }

  const continueStory = () => {
    if (isReviewingPreviousPart || !canAdvanceAuthoredStory(story, progress)) return
    const next = advanceAuthoredStory(story, progress)
    if (!historicalReplay) authoredReadingPosition.clear(story)
    restoredPartRef.current = null
    setReviewPartIndex(null)
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
    const fresh = {
      ...createInitialAuthoredStoryProgress(story),
      selected_choices: { ...inheritedSelectedChoices },
    }
    setPreviewChoiceId(null)
    setReviewPartIndex(null)
    updateProgress(fresh)
  }

  const finishForToday = () => {
    if (
      isReviewingPreviousPart ||
      !onFinishForToday ||
      !canAdvanceAuthoredStory(story, progress)
    ) return
    const next = advanceAuthoredStory(story, progress)
    authoredReadingPosition.clear(story)
    restoredPartRef.current = null
    setReviewPartIndex(null)
    updateProgress(next)
    onFinishForToday()
  }

  const closeReader = () => {
    if (!historicalReplay && reviewPartIndex == null) {
      authoredReadingPosition.save(story, progress.current_part_index, window.scrollY)
    }
    onBack?.()
  }

  const openImage = (url: string, alt: string) => setLightbox({ url, alt })

  const markImageSeen = (assetId: string) => {
    if (isReviewingPreviousPart) return
    authoredIllustrationDiscovery.markSeen(story, assetId)
  }

  const currentPartNumber = displayedPartIndex + 1
  const persistedPartNumber = progress.current_part_index + 1
  const readerProgress = readerPartProgress(story, currentPartNumber)
  const persistedReaderProgress = readerPartProgress(story, persistedPartNumber)
  const readerEpisodeTitle = episodeTitles?.[readerProgress.current - 1] ?? part.title
  const canContinue =
    !isReviewingPreviousPart && canAdvanceAuthoredStory(story, progress)
  const previousReviewPartIndex =
    readerUnit === 'part' &&
    !historicalReplay &&
    readerProgress.current > 1
      ? firstPartIndexForEpisode(story, readerProgress.current - 1)
      : null
  const nextReviewPartIndex =
    readerUnit === 'part' &&
    !historicalReplay &&
    isReviewingPreviousPart &&
    readerProgress.current < persistedReaderProgress.current
      ? firstPartIndexForEpisode(story, readerProgress.current + 1)
      : null

  const openReviewPart = (partIndex: number | null) => {
    if (partIndex == null || partIndex > progress.current_part_index) return
    restoredPartRef.current = null

    if (partIndex === progress.current_part_index) {
      setReviewPartIndex(null)
      return
    }

    setReviewPartIndex(partIndex)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  const returnToCurrentPart = () => {
    restoredPartRef.current = null
    setReviewPartIndex(null)
  }
  const nextReaderProgress =
    !part.is_final && currentPartNumber < story.parts.length
      ? readerPartProgress(story, currentPartNumber + 1)
      : null
  const isReaderEpisodeBoundary =
    readerUnit === 'episode' &&
    Boolean(
      nextReaderProgress && nextReaderProgress.current > readerProgress.current,
    )
  const currentDecisionChoiceId = part.decision
    ? progress.selected_choices[part.decision.decision_id] ?? null
    : null
  const readerTheme = getReaderTheme(readerPreferences)
  const readerTextStyle = getReaderTextStyle(readerPreferences)
  const replayEpisodeEnd = historicalReplay && (isReaderEpisodeBoundary || part.is_final)
  const readerProgressLabel =
    readerUnit === 'part'
      ? formatSevenRoadsPartProgress(language, readerProgress.current, readerProgress.total)
      : formatSevenRoadsEpisodeProgress(language, readerProgress.current, readerProgress.total)
  const completionLabel =
    completionScope === 'episode'
      ? formatSevenRoadsEpisodeCompleted(language, storyNumber)
      : completionScope === 'story'
        ? formatSevenRoadsStoryCompleted(language, storyNumber)
        : formatSevenRoadsSeasonCompleted(language, seasonNumber)
  const completionEyebrow =
    completionScope === 'episode'
      ? `QISSA · ${formatSevenRoadsSeasonLabel(language, seasonNumber)} · ${formatSevenRoadsEpisodeLabel(language, storyNumber)} · ${story.title}`
      : completionScope === 'story'
        ? `QISSA · ${formatSevenRoadsSeasonLabel(language, seasonNumber)} · ${formatSevenRoadsStoryLabel(language, storyNumber)} · ${story.title}`
        : `QISSA · ${formatSevenRoadsSeasonLabel(language, seasonNumber)} · ${story.title}`
  const completionMemory =
    completionScope === 'episode'
      ? copy.episodeCompletionMemory
      : completionScope === 'story'
        ? copy.storyCompletionMemory
        : copy.completionMemory
  const finishLabel =
    completionScope === 'episode'
      ? copy.finishEpisode
      : completionScope === 'story'
        ? copy.finishStory
        : copy.finishSeason
  const replayLabel =
    completionScope === 'episode'
      ? copy.replayEpisode
      : completionScope === 'story'
        ? copy.replayStory
        : copy.replaySeason

  if (progress.completed) {
    const completionCoverUrl = showCover
      ? resolveAuthoredStoryAssetUrl(
          story.cover_illustration.asset_id,
          story.cover_illustration.runtime_url,
        )
      : null

    return (
      <section
        className="relative min-h-[calc(100dvh-2.5rem)] overflow-hidden rounded-[1.85rem] bg-[#17383d] bg-cover bg-center text-center text-white"
        style={completionCoverUrl ? { backgroundImage: `url("${completionCoverUrl}")` } : undefined}
      >
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/32 to-[#102327]/96" />
        {onBack ? (
          <button
            type="button"
            className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex h-11 items-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 text-xs font-bold text-white/95 backdrop-blur-md transition active:scale-[0.97]"
            onClick={closeReader}
            aria-label={copy.back}
          >
            <span aria-hidden="true">←</span>
            <span>{copy.back}</span>
          </button>
        ) : null}
        <div className="relative z-10 flex min-h-[calc(100dvh-2.5rem)] flex-col justify-end p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#ead3a0]">
            {completionEyebrow}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-[#fff9ec]">
            {completionLabel}
          </h2>
          {completionSummary ? (
            <p className="mt-3 text-base font-semibold leading-7 text-[#f8f1e4]">
              {completionSummary}
            </p>
          ) : null}
          <p className="mt-3 text-sm leading-6 text-[#eaf3f1]">
            {completionMemory}
          </p>
          {completionScope === 'season' ? (
            <div className="mt-4 rounded-[1.4rem] border border-[#ead3a0]/35 bg-black/20 px-4 py-3 backdrop-blur-md">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#ead3a0]">
                {formatSevenRoadsSeasonLabel(language, seasonNumber + 1)}
              </p>
              <p className="mt-1 font-bold text-[#fff9ec]">
                {nextSeasonPublished ? copy.nextSeasonAvailable : copy.nextSeasonSoon}
              </p>
            </div>
          ) : null}
          <div className="mt-5 grid gap-2.5">
            {onFinishForToday ? (
              <button
                className="w-full rounded-full border border-[#ead3a0] bg-[#ead3a0] px-5 py-3.5 text-sm font-bold text-[#24434a]"
                onClick={onFinishForToday}
              >
                {copy.finishToday}
              </button>
            ) : null}
            {onBack ? (
              <button
                className="w-full rounded-full border border-white/35 bg-black/20 px-5 py-3 text-sm font-semibold text-[#fff9ec] backdrop-blur-md"
                onClick={onBack}
              >
                {completionScope === 'episode' ? copy.returnToSeason : copy.backHome}
              </button>
            ) : null}
            <button
              className="w-full rounded-full px-5 py-3 text-sm font-semibold text-[#ead3a0]"
              onClick={restartStory}
            >
              {replayLabel}
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
          className="fixed inset-0 z-90 flex items-end bg-black/45 p-3 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => setShowReaderSettings(false)}
        >
          <div
            className="mx-auto w-full max-w-[430px]"
            role="dialog"
            aria-modal="true"
            aria-label={copy.readerSettings}
            onClick={(event) => event.stopPropagation()}
          >
            <ReaderSettingsPanel
              language={language}
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
          className="fixed inset-0 z-100 flex h-dvh w-screen cursor-zoom-out items-center justify-center bg-black/95 p-3 sm:p-6"
          onClick={() => setLightbox(null)}
          aria-label={copy.closeFullscreen}
        >
          <span
            className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-2xl font-light text-white"
            aria-hidden="true"
          >
            ×
          </span>
          <img
            src={lightbox.url}
            alt={lightbox.alt}
            className="max-h-full max-w-full object-contain"
          />
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-xs font-semibold text-white/85">
            {copy.tapToReturn}
          </span>
        </button>
      ) : null}

      <section
        ref={topRef}
        className={`min-h-dvh space-y-5 pb-10 transition-colors ${readerTheme.page}`}
      >
        <div
          className={`sticky top-0 z-40 -mx-2 flex items-center justify-between gap-2 border-b px-2 py-2 backdrop-blur-xl ${readerTheme.toolbar}`}
        >
          {onBack ? (
            <button
              type="button"
              className="flex min-h-11 items-center gap-1.5 rounded-full border border-current/15 px-3.5 py-2 text-xs font-bold"
              onClick={closeReader}
              aria-label={copy.back}
            >
              <span aria-hidden="true">←</span>
              <span>{copy.back}</span>
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            {previousReviewPartIndex != null ? (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-current/15 text-lg font-bold"
                onClick={() => openReviewPart(previousReviewPartIndex)}
                aria-label={copy.previousReadPart}
                title={copy.previousReadPart}
              >
                ‹
              </button>
            ) : null}
            <span className="rounded-full border border-current/15 px-3 py-1.5 text-xs font-bold">
              {readerProgressLabel}
            </span>
            {nextReviewPartIndex != null ? (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-current/15 text-lg font-bold"
                onClick={() => openReviewPart(nextReviewPartIndex)}
                aria-label={copy.nextReadPart}
                title={copy.nextReadPart}
              >
                ›
              </button>
            ) : null}
            <button
              type="button"
              className="flex h-10 min-w-10 items-center justify-center rounded-full border border-current/15 px-3 text-sm font-bold"
              onClick={() => setShowReaderSettings(true)}
              aria-label={copy.readerSettings}
            >
              Aa
            </button>
          </div>
        </div>

      <header className="space-y-3">
        {isReviewingPreviousPart ? (
          <div className="rounded-2xl border border-[#c8b27e] bg-[#fff7df] px-4 py-3 text-[#514933]">
            <p className="q-label mb-1">{copy.reviewingPart}</p>
            <p className="text-xs leading-5">{copy.reviewingPartBody}</p>
          </div>
        ) : null}
        {showCover && currentPartNumber === 1 ? (
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
            discoverable={false}
            language={language}
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
          onImageSeen={markImageSeen}
          language={language}
          episodeNumber={readerProgress.current}
          readerUnit={readerUnit}
        />
      </article>

      {!isReviewingPreviousPart && part.decision && !selectedChoice ? (
        <section className="q-stone-panel p-5">
          <p className="q-label mb-2">{copy.yourChoice}</p>
          <h3 className="q-heading mb-2 text-2xl font-bold leading-tight">{part.decision.prompt}</h3>
          {progress.choice_history.length === 0 ? (
            <p className="mb-4 text-sm leading-6 text-[#6b6251]">
              {copy.choiceMemoryHint}
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
                  {choice.illustration &&
                  choice.illustration.behavior !== 'show_after_selection' &&
                  choice.illustration.behavior !== 'show_after_resolution' &&
                  choice.illustration.behavior !== 'show_in_resolution_after_anchor' ? (
                    <StoryImage
                      asset={choice.illustration}
                      alt={choice.text}
                      showPlaceholder={showMissingAssetPlaceholders}
                      onOpen={openImage}
                      onSeen={markImageSeen}
                      language={language}
                    />
                  ) : null}
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
              {copy.confirmChoice}
            </button>
          ) : null}
        </section>
      ) : null}

      {selectedChoice && currentDecisionChoiceId ? (
        <>
          <section className="rounded-3xl border border-[#9bbdb8] bg-[#e5f0ed] p-5">
            <p className="q-label mb-2 text-[#35666b]">{copy.choiceSaved}</p>
            <p className="font-bold leading-6 text-[#243c3b]">{selectedChoice.text}</p>
          </section>

          {selectedChoice.illustration &&
          selectedChoice.illustration.behavior !== 'show_after_resolution' &&
          selectedChoice.illustration.behavior !== 'show_in_resolution_after_anchor' ? (
            <StoryImage
              asset={selectedChoice.illustration}
              alt={selectedChoice.text}
              showPlaceholder={showMissingAssetPlaceholders}
              onOpen={openImage}
              onSeen={markImageSeen}
              language={language}
            />
          ) : null}

          <article className={`px-1 py-1 ${readerTheme.text}`} style={readerTextStyle}>
            <StoryBlocks
              blocks={selectedResolutionBlocks}
              showMissingAssetPlaceholders={showMissingAssetPlaceholders}
              onOpenImage={openImage}
              onImageSeen={markImageSeen}
              language={language}
              episodeNumber={readerProgress.current}
              readerUnit={readerUnit}
            />
          </article>

          {selectedChoice.illustration &&
          selectedChoice.illustration.behavior === 'show_after_resolution' ? (
            <StoryImage
              asset={selectedChoice.illustration}
              alt={selectedChoice.text}
              showPlaceholder={showMissingAssetPlaceholders}
              onOpen={openImage}
              onSeen={markImageSeen}
              language={language}
            />
          ) : null}
        </>
      ) : null}

      {(!part.decision || selectedChoice) && postChoiceBlocks.length > 0 ? (
        <article className={`px-1 py-1 ${readerTheme.text}`} style={readerTextStyle}>
          <StoryBlocks
            blocks={postChoiceBlocks}
            showMissingAssetPlaceholders={showMissingAssetPlaceholders}
            onOpenImage={openImage}
            onImageSeen={markImageSeen}
            language={language}
            episodeNumber={readerProgress.current}
            readerUnit={readerUnit}
          />
        </article>
      ) : null}

      {(!part.decision || selectedChoice) ? (
        replayEpisodeEnd ? (
          <section className="q-stone-panel space-y-4 p-5 text-center">
            <div>
              <p className="q-label mb-1">{copy.replayedEpisode}</p>
              <p className="text-sm leading-6 text-[#625846]">
                {copy.replayedEpisodeBody}
              </p>
            </div>
            {onBack ? (
              <button className="q-primary w-full" onClick={onBack}>
                {copy.returnToSeason}
              </button>
            ) : null}
          </section>
        ) : isReaderEpisodeBoundary ? (
          <section className="q-stone-panel space-y-4 p-5 text-center">
            <div>
              <p className="q-label mb-1">
                {formatSevenRoadsEpisodeCompleted(language, readerProgress.current)}
              </p>
              <p className="text-sm leading-6 text-[#625846]">
                {copy.episodeFinishedBody}
              </p>
            </div>
            <div className="grid gap-2.5">
              <button
                className="q-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                onClick={continueStory}
                disabled={!canContinue}
              >
                {copy.nextEpisode}
              </button>
              {onFinishForToday ? (
                <button
                  className="q-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={finishForToday}
                  disabled={!canContinue}
                >
                  {copy.finishToday}
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
            {part.is_final ? finishLabel : copy.continue}
          </button>
        )
      ) : null}
      </section>
    </>
  )
}
