import { useEffect, useMemo, useState } from 'react'
import { ListeningScene } from '../components/ListeningScene'
import { ReaderSettingsPanel } from '../components/ReaderSettingsPanel'
import { stylePacks } from '../data/stylePacks'
import { t } from '../lib/i18n'
import type { Episode, EpisodeChoice, Language, ReaderPreferences } from '../types/qissa'

interface StoryScreenProps {
  language: Language
  episode: Episode
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

  const stylePack = useMemo(
    () => stylePacks.find((pack) => pack.id === episode.stylePackId) ?? stylePacks[0],
    [episode.stylePackId],
  )

  useEffect(() => {
    setPreviewChoiceId(savedChoiceIdForCurrentEpisode)
  }, [episode.episode_id, savedChoiceIdForCurrentEpisode])
  useEffect(() => setViewMode(readerPreferences.defaultPlaybackMode), [readerPreferences.defaultPlaybackMode])

  const handleViewModeChange = (nextMode: 'read' | 'listen') => {
    setViewMode(nextMode)
    onReaderPreferencesChange({ defaultPlaybackMode: nextMode })
  }

  const isChoiceLocked = Boolean(isChoiceSavedForCurrentEpisode && savedChoiceIdForCurrentEpisode)

  const handleChoicePreview = (choiceId: string) => {
    if (isChoiceLocked) return
    setPreviewChoiceId(choiceId)
  }

  const handleConfirmChoice = () => {
    if (!previewChoiceId || isChoiceLocked) return
    const selectedChoice = episode.choices.find((choice) => choice.choice_id === previewChoiceId)
    if (!selectedChoice) return
    onChoiceSelected?.(selectedChoice)
  }

  return (
    <section className="space-y-4 rounded-3xl bg-white/90 p-4 shadow-sm sm:p-5">
      <header
        className="space-y-4 rounded-2xl p-4"
        style={{
          background: `linear-gradient(145deg, ${stylePack.palette.primary}, ${stylePack.palette.secondary})`,
          color: stylePack.palette.text,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-85">{stylePack.title[language]}</p>
            <h2 className="text-2xl font-semibold leading-tight">{episode.title}</h2>
          </div>
          {onBackHome && (
            <button
              onClick={onBackHome}
              className="rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-xs font-medium backdrop-blur transition hover:bg-white/25"
            >
              {t(language, 'story.back_home')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/20 p-1">
          <button
            onClick={() => handleViewModeChange('read')}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${viewMode === 'read' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/90'}`}
          >
            {t(language, 'story.read_mode')}
          </button>
          <button
            onClick={() => handleViewModeChange('listen')}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${viewMode === 'listen' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/90'}`}
          >
            {t(language, 'story.listen_mode')}
          </button>
        </div>
      </header>

      <div className="space-y-3 rounded-2xl border border-amber-100 bg-[#fffaf1] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{t(language, 'story.narrative_title')}</h3>
          {viewMode === 'read' && (
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
              onClick={() => setShowReaderSettings((v) => !v)}
            >
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
            <article
              className={`rounded-2xl p-5 shadow-sm ${getReaderThemeClass(readerPreferences.theme)}`}
              style={getReaderTextStyle(readerPreferences)}
            >
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
      </div>

      {episode.choices.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold">{t(language, 'story.make_choice')}</h3>
          {episode.choices.map((choice) => {
            const isPreviewed = previewChoiceId === choice.choice_id
            const isDisabled = isChoiceLocked && savedChoiceIdForCurrentEpisode !== choice.choice_id
            return (
              <button
                key={choice.choice_id}
                onClick={() => handleChoicePreview(choice.choice_id)}
                disabled={isDisabled}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${
                  isPreviewed
                    ? 'scale-[1.01] border-amber-400 bg-amber-50 shadow-md'
                    : 'border-slate-200 bg-white shadow-sm hover:border-amber-200 hover:bg-amber-50/30'
                } ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <p className="font-medium text-slate-800">{choice.text}</p>
                <p className="mt-1 text-sm text-slate-600">{choice.effect_summary}</p>
              </button>
            )
          })}

          {previewChoiceId && !isChoiceLocked && (
            <button
              className="w-full rounded-2xl bg-amber-500 px-5 py-3.5 font-semibold text-white transition hover:bg-amber-600"
              onClick={handleConfirmChoice}
            >
              {t(language, 'story.confirm_choice')}
            </button>
          )}
        </div>
      )}

      {isChoiceLocked && (
        <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 text-sm text-emerald-950 transition-all duration-500">
          <p className="font-semibold">{t(language, 'story.world_remembers')}</p>
          <p>{t(language, 'story.next_episode_hint')}</p>
        </div>
      )}

      {isChoiceLocked && onContinueNextEpisode && (
        <button
          className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 font-semibold text-white"
          onClick={onContinueNextEpisode}
        >
          {t(language, 'story.continue_next_episode')}
        </button>
      )}

      {isChoiceLocked && !onContinueNextEpisode && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <h3 className="text-base font-semibold text-slate-900">{t(language, 'story.episode_end_title')}</h3>
          <p className="text-sm text-slate-700">{t(language, 'story.episode_end_body')}</p>
          {onBackHome && (
            <button
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800"
              onClick={onBackHome}
            >
              {t(language, 'story.back_home')}
            </button>
          )}
        </div>
      )}

      {episode.vocabulary.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <h4 className="font-semibold text-emerald-900">{t(language, 'story.words_preview')}</h4>
          <ul className="mt-2 space-y-1 text-sm text-emerald-900">
            {episode.vocabulary.map((item) => (
              <li key={item.word}>• {item.word} — {item.translation}</li>
            ))}
          </ul>
        </div>
      )}
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
