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
}

export function StoryScreen({
  language,
  episode,
  readerPreferences,
  onReaderPreferencesChange,
  onChoiceSelected,
  onContinueNextEpisode,
  isChoiceSavedForCurrentEpisode = false,
}: StoryScreenProps) {
  const [viewMode, setViewMode] = useState<'read' | 'listen'>(
    readerPreferences.defaultPlaybackMode,
  )
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [showReaderSettings, setShowReaderSettings] = useState(false)

  const stylePack = useMemo(
    () => stylePacks.find((pack) => pack.id === episode.stylePackId) ?? stylePacks[0],
    [episode.stylePackId],
  )

  useEffect(() => setSelectedChoiceId(null), [episode.episode_id])
  useEffect(() => setViewMode(readerPreferences.defaultPlaybackMode), [readerPreferences.defaultPlaybackMode])

  const handleViewModeChange = (nextMode: 'read' | 'listen') => {
    setViewMode(nextMode)
    onReaderPreferencesChange({ defaultPlaybackMode: nextMode })
  }

  const handleChoiceClick = (choice: EpisodeChoice) => {
    if (selectedChoiceId) return
    setSelectedChoiceId(choice.choice_id)
    onChoiceSelected?.(choice)
  }

  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div
        className="rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, ${stylePack.palette.primary}, ${stylePack.palette.secondary})`,
          color: stylePack.palette.text,
        }}
      >
        <p className="text-sm opacity-90">{stylePack.title[language]}</p>
        <h2 className="text-2xl font-semibold leading-tight">{episode.title}</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
        <button
          onClick={() => handleViewModeChange('read')}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            viewMode === 'read' ? 'bg-white shadow-sm' : ''
          }`}
        >
          {t(language, 'story.read_mode')}
        </button>
        <button
          onClick={() => handleViewModeChange('listen')}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            viewMode === 'listen' ? 'bg-white shadow-sm' : ''
          }`}
        >
          {t(language, 'story.listen_mode')}
        </button>
      </div>

      {viewMode === 'read' ? (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
              onClick={() => setShowReaderSettings((v) => !v)}
            >
              Aa
            </button>
          </div>

          {showReaderSettings && (
            <ReaderSettingsPanel
              language={language}
              preferences={readerPreferences}
              onChange={onReaderPreferencesChange}
              onClose={() => setShowReaderSettings(false)}
            />
          )}

          <article
            className={`rounded-2xl p-5 ${getReaderThemeClass(readerPreferences.theme)}`}
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

      {episode.choices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t(language, 'story.make_choice')}</h3>
          {episode.choices.map((choice) => (
            <button
              key={choice.choice_id}
              onClick={() => handleChoiceClick(choice)}
              disabled={Boolean(selectedChoiceId && selectedChoiceId !== choice.choice_id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left ${
                selectedChoiceId === choice.choice_id
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-slate-200 bg-white'
              } ${
                selectedChoiceId && selectedChoiceId !== choice.choice_id ? 'opacity-60' : ''
              }`}
            >
              <p className="font-medium text-slate-800">{choice.text}</p>
              <p className="mt-1 text-sm text-slate-600">{choice.effect_summary}</p>
            </button>
          ))}
        </div>
      )}

      {selectedChoiceId && isChoiceSavedForCurrentEpisode && (
        <div className="space-y-1 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>{t(language, 'story.world_remembers')}</p>
          <p>{t(language, 'story.next_episode_hint')}</p>
        </div>
      )}

      {selectedChoiceId && isChoiceSavedForCurrentEpisode && onContinueNextEpisode && (
        <button
          className="w-full rounded-2xl bg-amber-500 px-5 py-3.5 font-semibold text-white"
          onClick={onContinueNextEpisode}
        >
          {t(language, 'story.continue_next_episode')}
        </button>
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
