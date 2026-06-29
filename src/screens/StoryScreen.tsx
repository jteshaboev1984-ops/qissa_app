import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { ListeningScene } from '../components/ListeningScene'
import { ReaderSettingsPanel } from '../components/ReaderSettingsPanel'
import { StylePackCover } from '../components/StylePackCover'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Episode, EpisodeChoice, Language, ReaderPreferences, StoryMode } from '../types/qissa'

interface StoryScreenProps {
  language: Language
  episode: Episode
  storyMode: StoryMode
  isGenerating: boolean
  generationLabel: string
  generationErrorMessage: string | null
  readerPreferences: ReaderPreferences
  onReaderPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  onChoiceSelected?: (choice: EpisodeChoice) => void
  onContinueNextEpisode?: () => void
  isChoiceSavedForCurrentEpisode?: boolean
  savedChoiceIdForCurrentEpisode?: string | null
  onBackHome?: () => void
  onStartNewStory?: () => void
}

type StoryStage = 'reading' | 'choice' | 'resolution'

export function StoryScreen({
  language,
  episode,
  storyMode,
  isGenerating,
  generationLabel,
  generationErrorMessage,
  readerPreferences,
  onReaderPreferencesChange,
  onChoiceSelected,
  onContinueNextEpisode,
  isChoiceSavedForCurrentEpisode = false,
  savedChoiceIdForCurrentEpisode = null,
  onBackHome,
  onStartNewStory,
}: StoryScreenProps) {
  const [viewMode, setViewMode] = useState<'read' | 'listen'>(readerPreferences.defaultPlaybackMode)
  const [previewChoiceId, setPreviewChoiceId] = useState<string | null>(null)
  const [showReaderSettings, setShowReaderSettings] = useState(false)
  const [showVocabulary, setShowVocabulary] = useState(false)
  const [showConfirmedChoices, setShowConfirmedChoices] = useState(false)

  const narrativeTopRef = useRef<HTMLElement | null>(null)

  const stylePack = useMemo(
    () => stylePacks.find((pack) => pack.id === episode.stylePackId) ?? stylePacks[0],
    [episode.stylePackId],
  )

  const isSeriesMode = storyMode === 'series'
  const isEpisodeOne = episode.episode_id.startsWith('ep-1')
  const isEpisodeTwo = episode.episode_id.startsWith('ep-2')
  const isChoiceLocked = Boolean(isChoiceSavedForCurrentEpisode && savedChoiceIdForCurrentEpisode)
  const isOneTimeFinal = storyMode === 'one_time' && isChoiceLocked
  const isSeriesFinal = isSeriesMode && isEpisodeTwo
  const hasVocabulary = episode.vocabulary.length > 0
  const showChoicePanel = episode.choices.length > 0 && !isSeriesFinal

  const hasSavedChoiceForStage = Boolean(isChoiceLocked && !isSeriesFinal)
  const [storyStage, setStoryStage] = useState<StoryStage>(hasSavedChoiceForStage ? 'resolution' : 'reading')

  const effectiveChoiceId = storyStage === 'resolution'
    ? (savedChoiceIdForCurrentEpisode ?? previewChoiceId)
    : savedChoiceIdForCurrentEpisode

  const effectiveConfirmedChoice = useMemo(
    () => episode.choices.find((choice) => choice.choice_id === effectiveChoiceId) ?? null,
    [effectiveChoiceId, episode.choices],
  )

  const effectiveResolutionText = effectiveConfirmedChoice?.resolution_text ?? effectiveConfirmedChoice?.effect_summary ?? null
  const effectiveTomorrowSeedText = effectiveConfirmedChoice?.tomorrow_seed ?? episode.nextEpisodePreview

  const showTomorrowSeed = Boolean(
    storyStage === 'resolution' &&
      effectiveConfirmedChoice &&
      isSeriesMode &&
      isEpisodeOne &&
      effectiveTomorrowSeedText,
  )

  const canConfirmChoice = Boolean(previewChoiceId && !isChoiceLocked && showChoicePanel)

  const canShowVocabulary = hasVocabulary && (isSeriesFinal || storyStage === 'resolution')

  useEffect(() => {
    setPreviewChoiceId(savedChoiceIdForCurrentEpisode)
  }, [episode.episode_id, savedChoiceIdForCurrentEpisode])

  useEffect(() => {
    setViewMode(readerPreferences.defaultPlaybackMode)
  }, [readerPreferences.defaultPlaybackMode])

  useEffect(() => {
    setShowVocabulary(false)
    setShowConfirmedChoices(false)
    setStoryStage(hasSavedChoiceForStage ? 'resolution' : 'reading')
  }, [episode.episode_id, hasSavedChoiceForStage])

  const handleReadAgain = () => {
    setViewMode('read')
    setShowVocabulary(false)
    setShowConfirmedChoices(false)
    setStoryStage('reading')

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        narrativeTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  const handleConfirmChoice = () => {
    if (!previewChoiceId || isChoiceLocked) return
    const selectedChoice = episode.choices.find((choice) => choice.choice_id === previewChoiceId)
    if (!selectedChoice) return

    onChoiceSelected?.(selectedChoice)
    setStoryStage('resolution')
  }

  const renderModeToggle = () => (
    <div className="grid grid-cols-2 items-center gap-1.5 rounded-full border border-[#e2d5be] bg-[#f4ead8] p-1.5">
      <button
        onClick={() => {
          setViewMode('read')
          onReaderPreferencesChange({ defaultPlaybackMode: 'read' })
        }}
        className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${viewMode === 'read' ? 'bg-[#fffdf7] text-[#24261f] shadow-sm' : 'text-[#665d49]'}`}
      >
        {t(language, 'story.read_mode')}
      </button>
      <button
        onClick={() => {
          setViewMode('listen')
          onReaderPreferencesChange({ defaultPlaybackMode: 'listen' })
        }}
        className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${viewMode === 'listen' ? 'bg-[#fffdf7] text-[#24261f] shadow-sm' : 'text-[#665d49]'}`}
      >
        {t(language, 'story.listen_mode')}
      </button>
    </div>
  )

  const renderStoryHeader = () => (
    <header className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <button
          onClick={onBackHome}
          className="q-secondary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isGenerating}
        >
          {t(language, 'story.back_home')}
        </button>
        <p className="q-label rounded-full bg-[#fff8e9] px-3 py-1">{stylePack.title[language]}</p>
      </div>
      {storyStage === 'reading' || isSeriesFinal ? (
        <>
          <StylePackCover
            stylePack={stylePack}
            variant="story"
            title={episode.title}
            subtitle={stylePack.title[language]}
          />
          {storyStage === 'reading' ? renderModeToggle() : null}
        </>
      ) : (
        <div className="rounded-[1.25rem] border border-[#eadfc9] bg-[#fff8e9] px-4 py-3">
          <p className="q-label mb-1">{stylePack.title[language]}</p>
          <p className="text-base font-bold text-[#24261f]">{episode.title}</p>
        </div>
      )}
    </header>
  )

  const renderNarrativeCard = () => (
    <section ref={narrativeTopRef} className="q-card space-y-4 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <p className="q-label mb-1">{t(language, 'story.narrative_title')}</p>
        </div>

        {viewMode === 'read' ? (
          <button className="q-secondary px-3 py-2 text-sm" onClick={() => setShowReaderSettings((v) => !v)}>
            Aa
          </button>
        ) : null}
      </div>

      {viewMode === 'read' && showReaderSettings ? (
        <ReaderSettingsPanel
          language={language}
          preferences={readerPreferences}
          onChange={onReaderPreferencesChange}
          onClose={() => setShowReaderSettings(false)}
        />
      ) : null}

      {viewMode === 'read' ? (
        <article
          className={`q-story-text max-h-[min(52vh,34rem)] overflow-y-auto overscroll-contain rounded-[1.75rem] p-6 pr-4 text-[1.22rem] leading-[2.15rem] shadow-inner ${getReaderThemeClass(readerPreferences.theme)}`}
          style={getReaderTextStyle(readerPreferences)}
          tabIndex={0}
          aria-label={t(language, 'story.narrative_title')}
        >
          {episode.story_text}
        </article>
      ) : (
        <ListeningScene
          language={language}
          episode={episode}
          preferences={readerPreferences}
          onPreferencesChange={onReaderPreferencesChange}
          stylePack={stylePack}
        />
      )}
    </section>
  )

  const renderChoiceStage = () => {
    if (!showChoicePanel) return null

    return (
      <section className="relative overflow-hidden rounded-[2rem] border border-[#eadfc9] bg-[#fffdf7]/90 p-5 shadow-[0_18px_44px_-34px_rgba(115,92,0,.65)]">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#f3d34a]/20 blur-2xl" />

        <div className="relative space-y-4">
          <div className="text-center">
            <p className="q-label mb-2">{t(language, 'story.bedtime_choice_helper')}</p>
            <h3 className="q-heading text-3xl font-bold leading-tight">{t(language, 'story.choose_path')}</h3>
          </div>

          <div className="grid gap-3">
            {episode.choices.map((choice) => {
              const isPreviewed = previewChoiceId === choice.choice_id

              return (
                <button
                  key={choice.choice_id}
                  onClick={() => setPreviewChoiceId(choice.choice_id)}
                  className={`rounded-[1.6rem] border px-4 py-4 text-left transition-all duration-300 ${
                    isPreviewed
                      ? 'scale-[1.01] border-[#d4af37] bg-[#fff7d8] shadow-[0_18px_40px_-28px_rgba(115,92,0,.75)]'
                      : 'border-[#eadfc9] bg-[#fffdf7] hover:border-[#d4af37] hover:bg-[#fff8e9]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border text-xs font-bold ${
                        isPreviewed ? 'border-[#d4af37] bg-[#d4af37] text-[#24261f]' : 'border-[#eadfc9] bg-white text-[#746a55]'
                      }`}
                    >
                      {isPreviewed ? '✓' : ''}
                    </span>
                    <span>
                      <span className="mb-1 inline-flex rounded-full border border-[#eadfc9] bg-white px-2 py-0.5 text-xs">{choice.choice_icon ?? '✨'}</span>
                      <span className="block font-bold text-[#24261f]">{choice.text}</span>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="grid gap-2.5">
            {isChoiceLocked ? (
              <button className="q-primary w-full" onClick={() => setStoryStage('resolution')}>
                {t(language, 'story.back_to_result')}
              </button>
            ) : canConfirmChoice ? (
              <button className="q-primary w-full" onClick={handleConfirmChoice}>
                {t(language, 'story.confirm_choice')}
              </button>
            ) : null}

            <button className="q-secondary w-full" onClick={() => setStoryStage('reading')}>
              {t(language, 'story.back_to_story')}
            </button>
          </div>
        </div>
      </section>
    )
  }

  const renderResolutionStage = () => {
    if (!effectiveConfirmedChoice || !effectiveResolutionText) return null

    return (
      <>
        <section className="q-card space-y-3 p-4">
          <p className="q-label text-[#35666b]">{t(language, 'story.your_choice')}</p>
          <p className="text-base font-bold leading-snug text-[#24261f]">{effectiveConfirmedChoice.text}</p>

          {showConfirmedChoices ? (
            <div className="grid gap-3 pt-1">
              {episode.choices.map((choice) => {
                const isSelected = effectiveConfirmedChoice.choice_id === choice.choice_id

                return (
                  <div
                    key={choice.choice_id}
                    className={`rounded-[1.5rem] border px-4 py-4 text-left ${
                      isSelected ? 'border-[#35666b] bg-[#eaf7f8]' : 'border-[#eadfc9] bg-[#fffdf7] opacity-45'
                    }`}
                  >
                    <p className="mb-1 inline-flex rounded-full border border-[#eadfc9] bg-white px-2 py-0.5 text-xs">{choice.choice_icon ?? '✨'}</p>
                    <p className="font-bold text-[#24261f]">{choice.text}</p>
                  </div>
                )
              })}
            </div>
          ) : null}
        </section>

        <section className="q-card space-y-4 p-5">
          <h3 className="q-heading text-2xl font-bold leading-tight">{t(language, 'story.resolution_title')}</h3>
          <article className="q-story-text rounded-[1.75rem] border border-[#eadfc9] bg-[#fff8e9] p-6 text-lg leading-8 text-[#2b2b22] shadow-inner">
            <p>{effectiveResolutionText}</p>

            {showTomorrowSeed ? (
              <div className="mt-5 border-t border-[#e2d5be] pt-4">
                <p className="q-label mb-2 text-[#735c00]">{t(language, 'story.tomorrow_seed_title')}</p>
                <p className="text-base leading-7 text-[#4c4535]">{effectiveTomorrowSeedText}</p>
              </div>
            ) : null}
          </article>
        </section>

        {isOneTimeFinal ? (
          <section className="space-y-2">
            <button className="q-primary w-full" onClick={onStartNewStory}>
              {t(language, 'story.start_new_story')}
            </button>
            <button className="q-secondary w-full" onClick={handleReadAgain}>
              {t(language, 'story.read_again')}
            </button>
            <button className="q-tertiary w-full text-sm" onClick={onBackHome}>
              {t(language, 'story.back_home')}
            </button>
          </section>
        ) : (
          <section className="space-y-2">
            {showTomorrowSeed ? (
              <>
                <button
                  className="q-primary w-full disabled:cursor-wait disabled:opacity-70"
                  onClick={onContinueNextEpisode}
                  disabled={isGenerating}
                  aria-busy={isGenerating}
                >
                  {isGenerating ? generationLabel : t(language, 'story.preview_tomorrow')}
                </button>

                <button
                  className="q-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onBackHome}
                  disabled={isGenerating}
                >
                  {t(language, 'story.finish_today')}
                </button>
              </>
            ) : (
              <button
                className="q-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onBackHome}
                disabled={isGenerating}
              >
                {t(language, 'story.finish_today')}
              </button>
            )}

            <button
              className="q-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleReadAgain}
              disabled={isGenerating}
            >
              {t(language, 'story.read_again')}
            </button>

            {generationErrorMessage ? (
              <p
                role="alert"
                className="rounded-2xl border border-[#e6b9ae] bg-[#fff1ed] px-4 py-3 text-sm leading-6 text-[#7b3026]"
              >
                {generationErrorMessage}
              </p>
            ) : null}
          </section>
        )}
      </>
    )
  }

  const renderSeriesFinal = () => {
    if (!isSeriesFinal) return null

    return (
      <>
        {renderNarrativeCard()}
        <section className="q-card space-y-4 p-5 text-center">
          <p className="q-label">QISSA</p>
          <h3 className="q-heading text-3xl font-bold leading-tight">{t(language, 'story.series_final_title')}</h3>
          <p className="mx-auto max-w-xs text-sm leading-6 text-[#625846]">{t(language, 'story.series_final_body')}</p>
          <div className="grid gap-2.5 pt-1">
            <button className="q-primary w-full" onClick={onStartNewStory}>
              {t(language, 'story.start_new_story')}
            </button>
            <button className="q-secondary w-full" onClick={handleReadAgain}>
              {t(language, 'story.read_again')}
            </button>
            <button className="q-secondary w-full" onClick={onBackHome}>
              {t(language, 'story.back_home')}
            </button>
          </div>
        </section>
      </>
    )
  }

  const renderReturnToResultCta = () => {
    if (!(isChoiceLocked && !isSeriesFinal && storyStage === 'reading')) return null
    return (
      <button className="q-secondary w-full" onClick={() => setStoryStage('resolution')}>
        {t(language, 'story.back_to_result')}
      </button>
    )
  }

  const renderVocabularyToggle = () => {
    if (!canShowVocabulary) return null

    return (
      <section className="rounded-[1.5rem] border border-[#cfe9cf] bg-[#eff9ee]/70 p-4 text-sm">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[#244f2c]">{t(language, 'story.show_words')}</h3>
          {showVocabulary ? (
            <button
              className="rounded-full border border-[#c6dfc2] bg-white/85 px-3 py-1 text-xs font-bold text-[#244f2c]"
              onClick={() => setShowVocabulary(false)}
            >
              {t(language, 'story.hide_words_short')}
            </button>
          ) : (
            <button
              className="rounded-full border border-[#c6dfc2] bg-white/85 px-3 py-1 text-xs font-bold text-[#244f2c]"
              onClick={() => setShowVocabulary(true)}
            >
              {t(language, 'story.show_words_short')}
            </button>
          )}
        </div>

        {showVocabulary ? (
          <ul className="mt-3 space-y-1.5 leading-6 text-[#315d36]">
            {episode.vocabulary.map((item) => (
              <li key={item.word}>• {item.word} — {item.translation}</li>
            ))}
          </ul>
        ) : null}
      </section>
    )
  }

  const renderMainStage = () => {
    if (isSeriesFinal) return renderSeriesFinal()

    if (storyStage === 'choice') return renderChoiceStage()

    if (storyStage === 'resolution') return renderResolutionStage()

    return (
      <>
        {renderNarrativeCard()}
        {renderReturnToResultCta()}
        {showChoicePanel && !isChoiceLocked ? (
          <button className="q-primary w-full" onClick={() => setStoryStage('choice')}>
            {t(language, 'story.go_to_choice')}
          </button>
        ) : null}
      </>
    )
  }

  return (
    <section className="space-y-5 pb-28">
      {renderStoryHeader()}
      {renderMainStage()}
      {renderVocabularyToggle()}
    </section>
  )
}

function getReaderTextStyle(preferences: ReaderPreferences): CSSProperties {
  const textSize =
    preferences.textSize === 'small'
      ? '1rem'
      : preferences.textSize === 'medium'
        ? '1.16rem'
        : preferences.textSize === 'large'
          ? '1.28rem'
          : '1.44rem'

  const lineHeight =
    preferences.lineSpacing === 'normal'
      ? 1.62
      : preferences.lineSpacing === 'relaxed'
        ? 1.82
        : 2

  const fontFamily =
    preferences.fontMode === 'soft'
      ? 'Georgia, "Trebuchet MS", sans-serif'
      : preferences.fontMode === 'dyslexia_friendly'
        ? 'Verdana, Arial, sans-serif'
        : 'Georgia, "Times New Roman", serif'

  return {
    fontSize: textSize,
    lineHeight,
    fontFamily,
  }
}

function getReaderThemeClass(theme: ReaderPreferences['theme']) {
  if (theme === 'night') return 'bg-[#151d25] text-[#f4ead8]'
  if (theme === 'light') return 'bg-white text-[#20221c]'
  return 'bg-[#fff8e9] text-[#2b2b22]'
}
