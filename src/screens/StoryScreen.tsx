import { useEffect, useMemo, useRef, useState } from 'react'
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
}: StoryScreenProps) {
  const [viewMode, setViewMode] = useState<'read' | 'listen'>(readerPreferences.defaultPlaybackMode)
  const [previewChoiceId, setPreviewChoiceId] = useState<string | null>(null)
  const [showReaderSettings, setShowReaderSettings] = useState(false)
  const [showVocabulary, setShowVocabulary] = useState(false)

  const autoContinueTimerRef = useRef<number | null>(null)

  const stylePack = useMemo(() => stylePacks.find((pack) => pack.id === episode.stylePackId) ?? stylePacks[0], [episode.stylePackId])

  const isSeriesMode = storyMode === 'series'
  const isEpisodeOne = episode.episode_id.startsWith('ep-1')
  const isEpisodeTwo = episode.episode_id.startsWith('ep-2')
  const isChoiceLocked = Boolean(isChoiceSavedForCurrentEpisode && savedChoiceIdForCurrentEpisode)
  const hideChoiceFlowForSeriesEnd = storyMode === 'series' && episode.episode_id.startsWith('ep-2')
  const canConfirmChoice = Boolean(previewChoiceId && !isChoiceLocked && !hideChoiceFlowForSeriesEnd)
  const hasVocabulary = episode.vocabulary.length > 0
  const isSeriesAutoTransition = isChoiceLocked && isSeriesMode && isEpisodeOne
  const showSeriesDemoEndState = isSeriesMode && isEpisodeTwo
  const showEndState = showSeriesDemoEndState || (isChoiceLocked && !isSeriesAutoTransition)

  useEffect(() => {
    setPreviewChoiceId(savedChoiceIdForCurrentEpisode)
  }, [episode.episode_id, savedChoiceIdForCurrentEpisode])

  useEffect(() => {
    setViewMode(readerPreferences.defaultPlaybackMode)
  }, [readerPreferences.defaultPlaybackMode])

  useEffect(() => {
    setShowVocabulary(false)
  }, [episode.episode_id])

  useEffect(() => {
    if (!isSeriesAutoTransition || !onContinueNextEpisode) return
    if (autoContinueTimerRef.current) return

    autoContinueTimerRef.current = window.setTimeout(() => {
      onContinueNextEpisode()
      autoContinueTimerRef.current = null
    }, 1000)

    return () => {
      if (autoContinueTimerRef.current) {
        window.clearTimeout(autoContinueTimerRef.current)
        autoContinueTimerRef.current = null
      }
    }
  }, [isSeriesAutoTransition, onContinueNextEpisode])

  const handleConfirmChoice = () => {
    if (!previewChoiceId || isChoiceLocked) return
    const selectedChoice = episode.choices.find((choice) => choice.choice_id === previewChoiceId)
    if (!selectedChoice) return
    onChoiceSelected?.(selectedChoice)
  }

  const renderHeader = () => (
    <header
      className="space-y-3 rounded-2xl p-4"
      style={{
        background: `linear-gradient(145deg, ${stylePack.palette.primary}, ${stylePack.palette.secondary})`,
        color: stylePack.palette.text,
      }}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onBackHome}
          className="rounded-xl border border-white/35 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm"
        >
          {t(language, 'story.back_home')}
        </button>
        <p className="text-xs uppercase tracking-wide opacity-85">{stylePack.title[language]}</p>
      </div>
      <h2 className="text-2xl font-semibold leading-tight">{episode.title}</h2>
      {renderReadListenToggle()}
    </header>
  )

  const renderReadListenToggle = () => (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/50 p-1">
      <button onClick={() => { setViewMode('read'); onReaderPreferencesChange({ defaultPlaybackMode: 'read' }) }} className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${viewMode === 'read' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700'}`}>
        {t(language, 'story.read_mode')}
      </button>
      <button onClick={() => { setViewMode('listen'); onReaderPreferencesChange({ defaultPlaybackMode: 'listen' }) }} className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${viewMode === 'listen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700'}`}>
        {t(language, 'story.listen_mode')}
      </button>
    </div>
  )

  const renderNarrative = () => (
    <section className="rounded-2xl border border-amber-100 bg-[#fffaf1] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{t(language, 'story.narrative_title')}</h3>
        {viewMode === 'read' && (
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium" onClick={() => setShowReaderSettings((v) => !v)}>
            Aa
          </button>
        )}
      </div>

      {viewMode === 'read' ? (
        <>
          {showReaderSettings && (
            <ReaderSettingsPanel
              language={language}
              preferences={readerPreferences}
              onChange={onReaderPreferencesChange}
              onClose={() => setShowReaderSettings(false)}
            />
          )}
          <article className={`rounded-2xl p-5 shadow-sm ${getReaderThemeClass(readerPreferences.theme)}`} style={getReaderTextStyle(readerPreferences)}>
            {episode.story_text}
          </article>
        </>
      ) : (
        <ListeningScene
          language={language}
          episode={episode}
          preferences={readerPreferences}
          onPreferencesChange={onReaderPreferencesChange}
          worldTitle={stylePack.title[language]}
          palette={stylePack.palette}
        />
      )}
    </section>
  )

  const renderChoices = () => {
    if (!episode.choices.length || hideChoiceFlowForSeriesEnd) return null

    return (
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold">{t(language, 'story.preview_helper')}</h3>
        {episode.choices.map((choice) => {
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
        })}
      </section>
    )
  }

  const renderChoiceConfirmation = () => {
    if (hideChoiceFlowForSeriesEnd) return null
    if (!canConfirmChoice) return null
    return (
      <button className="w-full rounded-2xl bg-amber-500 px-5 py-3.5 font-semibold text-white" onClick={handleConfirmChoice}>
        {t(language, 'story.confirm_choice')}
      </button>
    )
  }

  const renderSeriesTransition = () => {
    if (!isSeriesAutoTransition) return null

    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
        <p className="font-semibold">{t(language, 'story.choice_saved_title')}</p>
        <p className="mt-1">{t(language, 'story.opening_next_episode')}</p>
      </section>
    )
  }

  const renderEndState = () => {
    if (!showEndState) return null

    return (
      <section className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <h3 className="font-semibold text-slate-900">{t(language, 'story.end_state_title')}</h3>
        <p className="text-sm text-slate-700">{t(language, 'story.end_state_body')}</p>
        <button className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800" onClick={onBackHome}>
          {t(language, 'story.return_home')}
        </button>
      </section>
    )
  }

  const renderVocabulary = () => {
    if (!hasVocabulary) return null

    return (
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm">
        <button className="font-semibold text-emerald-900" onClick={() => setShowVocabulary((v) => !v)}>
          {showVocabulary ? t(language, 'story.hide_words') : t(language, 'story.show_words')}
        </button>
        {showVocabulary && (
          <ul className="mt-2 space-y-1 text-emerald-900">
            {episode.vocabulary.map((item) => (
              <li key={item.word}>• {item.word} — {item.translation}</li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-3xl bg-white/95 p-4 shadow-sm sm:p-5">
      {renderHeader()}
      {renderNarrative()}
      {renderChoices()}
      {renderChoiceConfirmation()}
      {renderSeriesTransition()}
      {renderEndState()}
      {renderVocabulary()}
    </section>
  )
}

const getReaderThemeClass = (theme: ReaderPreferences['theme']) => {
  if (theme === 'night') return 'bg-slate-900 text-slate-100'
  if (theme === 'warm') return 'bg-amber-50 text-slate-800'
  return 'bg-white text-slate-900'
}

const getReaderTextStyle = (preferences: ReaderPreferences) => {
  const fontSizeMap: Record<ReaderPreferences['textSize'], string> = {
    small: '1rem',
    medium: '1.125rem',
    large: '1.25rem',
    extra_large: '1.4rem',
  }

  const lineHeightMap: Record<ReaderPreferences['lineSpacing'], number> = {
    normal: 1.6,
    relaxed: 1.8,
    wide: 2,
  }

  const fontFamilyMap: Record<ReaderPreferences['fontMode'], string> = {
    standard: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    soft: 'Georgia, Cambria, Times New Roman, serif',
    dyslexia_friendly: 'Arial, Verdana, Tahoma, sans-serif',
  }

  return {
    fontSize: fontSizeMap[preferences.textSize],
    lineHeight: lineHeightMap[preferences.lineSpacing],
    fontFamily: fontFamilyMap[preferences.fontMode],
  }
}
