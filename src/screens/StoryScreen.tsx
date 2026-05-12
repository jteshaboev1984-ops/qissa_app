import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { ListeningScene } from '../components/ListeningScene'
import { ReaderSettingsPanel } from '../components/ReaderSettingsPanel'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Episode, EpisodeChoice, Language, ReaderPreferences, StoryMode } from '../types/qissa'

interface StoryScreenProps {
  language: Language
  episode: Episode
  storyMode: StoryMode
  readerPreferences: ReaderPreferences
  onReaderPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  onChoiceSelected?: (choice: EpisodeChoice) => void
  onContinueNextEpisode?: () => void
  isChoiceSavedForCurrentEpisode?: boolean
  savedChoiceIdForCurrentEpisode?: string | null
  onBackHome?: () => void
  onStartNewStory?: () => void
}

export function StoryScreen({
  language,
  episode,
  storyMode,
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

  const stylePack = useMemo(() => stylePacks.find((pack) => pack.id === episode.stylePackId) ?? stylePacks[0], [episode.stylePackId])

  const isSeriesMode = storyMode === 'series'
  const isEpisodeOne = episode.episode_id.startsWith('ep-1')
  const isEpisodeTwo = episode.episode_id.startsWith('ep-2')
  const isChoiceLocked = Boolean(isChoiceSavedForCurrentEpisode && savedChoiceIdForCurrentEpisode)
  const showNextEpisodeCta = isChoiceLocked && isSeriesMode && isEpisodeOne
  const isOneTimeFinal = storyMode === 'one_time' && isChoiceLocked
  const isSeriesFinal = isSeriesMode && isEpisodeTwo
  const hasVocabulary = episode.vocabulary.length > 0
  const showChoicePanel = episode.choices.length > 0 && !isSeriesFinal
  const canConfirmChoice = Boolean(previewChoiceId && !isChoiceLocked && showChoicePanel)

  const confirmedChoice = useMemo(
    () => episode.choices.find((choice) => choice.choice_id === savedChoiceIdForCurrentEpisode) ?? null,
    [episode.choices, savedChoiceIdForCurrentEpisode],
  )

  const choiceConsequenceText = isChoiceLocked
    ? confirmedChoice?.resolution_text ?? confirmedChoice?.effect_summary ?? null
    : null

  useEffect(() => {
    setPreviewChoiceId(savedChoiceIdForCurrentEpisode)
  }, [episode.episode_id, savedChoiceIdForCurrentEpisode])

  useEffect(() => {
    setViewMode(readerPreferences.defaultPlaybackMode)
  }, [readerPreferences.defaultPlaybackMode])

  useEffect(() => {
    setShowVocabulary(false)
    setShowConfirmedChoices(false)
  }, [episode.episode_id])


  const handleConfirmChoice = () => {
    if (!previewChoiceId || isChoiceLocked) return
    const selectedChoice = episode.choices.find((choice) => choice.choice_id === previewChoiceId)
    if (!selectedChoice) return
    onChoiceSelected?.(selectedChoice)
  }

  const renderStoryHeader = () => (
    <header
      className="space-y-3 rounded-2xl p-4"
      style={{
        background: `linear-gradient(145deg, ${stylePack.palette.primary}, ${stylePack.palette.secondary})`,
        color: stylePack.palette.text,
      }}
    >
      <div className="flex items-center justify-between">
        <button onClick={onBackHome} className="rounded-xl border border-white/35 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm">
          {t(language, 'story.back_home')}
        </button>
        <p className="text-xs uppercase tracking-wide opacity-85">{stylePack.title[language]}</p>
      </div>
      <h2 className="text-2xl font-semibold leading-tight">{episode.title}</h2>
      {renderModeToggle()}
    </header>
  )

  const renderModeToggle = () => (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/50 p-1">
      <button onClick={() => { setViewMode('read'); onReaderPreferencesChange({ defaultPlaybackMode: 'read' }) }} className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${viewMode === 'read' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700'}`}>
        {t(language, 'story.read_mode')}
      </button>
      <button onClick={() => { setViewMode('listen'); onReaderPreferencesChange({ defaultPlaybackMode: 'listen' }) }} className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${viewMode === 'listen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700'}`}>
        {t(language, 'story.listen_mode')}
      </button>
    </div>
  )

  const renderReaderSettings = () => {
    if (viewMode !== 'read' || !showReaderSettings) return null
    return <ReaderSettingsPanel language={language} preferences={readerPreferences} onChange={onReaderPreferencesChange} onClose={() => setShowReaderSettings(false)} />
  }

  const renderListenScene = () => {
    if (viewMode !== 'listen') return null
    return (
      <ListeningScene
        language={language}
        episode={episode}
        preferences={readerPreferences}
        onPreferencesChange={onReaderPreferencesChange}
        worldTitle={stylePack.title[language]}
        palette={stylePack.palette}
      />
    )
  }

  const renderNarrativeCard = () => (
    <section ref={narrativeTopRef} className="rounded-2xl border border-amber-100 bg-[#fffaf1] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{t(language, 'story.narrative_title')}</h3>
        {viewMode === 'read' && (
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium" onClick={() => setShowReaderSettings((v) => !v)}>
            Aa
          </button>
        )}
      </div>
      {renderReaderSettings()}
      {viewMode === 'read' ? (
        <article className={`rounded-2xl p-5 shadow-sm ${getReaderThemeClass(readerPreferences.theme)}`} style={getReaderTextStyle(readerPreferences)}>
          {episode.story_text}
        </article>
      ) : (
        renderListenScene()
      )}
    </section>
  )

  const renderChoicePanel = () => {
    if (!showChoicePanel) return null
    return (
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold">{t(language, isChoiceLocked ? 'story.your_choice' : 'story.preview_helper')}</h3>
        {isChoiceLocked && confirmedChoice ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{t(language, 'story.your_choice')}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{confirmedChoice.text}</p>
            <button
              className="mt-2 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              onClick={() => setShowConfirmedChoices((value) => !value)}
            >
              {showConfirmedChoices ? t(language, 'story.hide_choices') : t(language, 'story.show_choices')}
            </button>
          </section>
        ) : null}
        {(!isChoiceLocked || showConfirmedChoices) ? episode.choices.map((choice) => {
          const isPreviewed = previewChoiceId === choice.choice_id
          const isMuted = isChoiceLocked && savedChoiceIdForCurrentEpisode !== choice.choice_id

          return (
            <button
              key={choice.choice_id}
              onClick={() => !isChoiceLocked && setPreviewChoiceId(choice.choice_id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${isPreviewed ? 'scale-[1.01] border-amber-400 bg-amber-50 shadow-md' : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'} ${isMuted ? 'opacity-50' : ''}`}
            >
              <p className="font-medium text-slate-800">{choice.text}</p>
              <p className={`mt-1 text-sm transition-opacity duration-300 ${isPreviewed ? 'opacity-100 text-slate-700' : 'opacity-80 text-slate-500'}`}>
                {choice.effect_summary}
              </p>
            </button>
          )
        }) : null}
        {canConfirmChoice ? (
          <button className="w-full rounded-2xl bg-amber-500 px-5 py-3.5 font-semibold text-white" onClick={handleConfirmChoice}>
            {t(language, 'story.confirm_choice')}
          </button>
        ) : null}
      </section>
    )
  }


  const renderChoiceConsequence = () => {
    if (!choiceConsequenceText) return null

    return (
      <section className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">{t(language, 'story.choice_consequence_title')}</p>
        <p className="mt-2 text-sm text-slate-800">{choiceConsequenceText}</p>
      </section>
    )
  }

  const renderMemoryTransition = () => {
    if (!showNextEpisodeCta) return null
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
        <p className="font-semibold">{t(language, 'story.choice_saved_title')}</p>
        <p className="mt-1">{t(language, 'story.opening_next_episode')}</p>
        <button className="mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white" onClick={onContinueNextEpisode}>
          {t(language, 'story.open_next_episode')}
        </button>
      </section>
    )
  }

  const renderFinalState = () => {
    if (!isOneTimeFinal && !isSeriesFinal) return null

    const title = isSeriesFinal ? t(language, 'story.series_final_title') : t(language, 'story.one_time_final_title')
    const body = isSeriesFinal ? t(language, 'story.series_final_body') : t(language, 'story.one_time_final_body')

    return (
      <section className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-700">{body}</p>
        <div className="grid gap-2">
          <button className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800" onClick={onBackHome}>
            {t(language, 'story.back_home')}
          </button>
          <button className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-white" onClick={onStartNewStory}>
            {t(language, 'story.start_new_story')}
          </button>
          <button
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800"
            onClick={() => {
              setViewMode('read')
              narrativeTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            {t(language, 'story.read_again')}
          </button>
        </div>
      </section>
    )
  }

  const renderVocabularyToggle = () => {
    if (!hasVocabulary) return null
    return (
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm">
        <button className="font-semibold text-emerald-900" onClick={() => setShowVocabulary((v) => !v)}>
          {showVocabulary ? t(language, 'story.hide_words') : t(language, 'story.show_words')}
        </button>
        {showVocabulary ? (
          <ul className="mt-2 space-y-1 text-emerald-900">
            {episode.vocabulary.map((item) => (
              <li key={item.word}>• {item.word} — {item.translation}</li>
            ))}
          </ul>
        ) : null}
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
      {renderStoryHeader()}
      {renderNarrativeCard()}
      {renderChoicePanel()}
      {renderChoiceConsequence()}
      {renderMemoryTransition()}
      {renderFinalState()}
      {renderVocabularyToggle()}
    </section>
  )
}

function getReaderTextStyle(preferences: ReaderPreferences): CSSProperties {
  const textSize =
    preferences.textSize === 'small'
      ? '1rem'
      : preferences.textSize === 'medium'
        ? '1.125rem'
        : preferences.textSize === 'large'
          ? '1.25rem'
          : '1.4rem'

  const lineHeight =
    preferences.lineSpacing === 'normal'
      ? 1.5
      : preferences.lineSpacing === 'relaxed'
        ? 1.7
        : 1.95

  const fontFamily =
    preferences.fontMode === 'soft'
      ? '"Comic Sans MS", "Trebuchet MS", sans-serif'
      : preferences.fontMode === 'dyslexia_friendly'
        ? '"Verdana", "Arial", sans-serif'
        : '"Inter", "Segoe UI", sans-serif'

  return {
    fontSize: textSize,
    lineHeight,
    fontFamily,
  }
}

function getReaderThemeClass(theme: ReaderPreferences['theme']): string {
  switch (theme) {
    case 'light':
      return 'bg-white text-slate-900 border border-slate-100'
    case 'night':
      return 'bg-slate-900 text-slate-100 border border-slate-700'
    case 'warm':
    default:
      return 'bg-[#fff7e7] text-slate-900 border border-amber-100'
  }
}
