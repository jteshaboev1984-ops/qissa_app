import { useEffect, useState } from 'react'
import { listeningCopy } from '../i18n/listening'
import { t } from '../lib/i18n'
import { useDeviceNarration } from '../lib/useDeviceNarration'
import type { Episode, Language, ReaderPreferences, StylePack } from '../types/qissa'
import { StylePackCover } from './StylePackCover'
import { VoiceSelector } from './VoiceSelector'

interface ListeningSceneProps {
  language: Language
  episode: Episode
  preferences: ReaderPreferences
  onPreferencesChange: (patch: Partial<ReaderPreferences>) => void
  stylePack: StylePack
}

const formatTime = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0
  const minutes = Math.floor(safe / 60)
  return `${minutes}:${String(safe % 60).padStart(2, '0')}`
}

const textSizeClass: Record<ReaderPreferences['textSize'], string> = {
  small: 'text-base',
  medium: 'text-lg',
  large: 'text-xl',
  extra_large: 'text-2xl',
}

const lineHeightClass: Record<ReaderPreferences['lineSpacing'], string> = {
  normal: 'leading-7',
  relaxed: 'leading-8',
  wide: 'leading-9',
}

export function ListeningScene({ language, episode, preferences, onPreferencesChange, stylePack }: ListeningSceneProps) {
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  const copy = listeningCopy[language]
  const isNightMode = preferences.audioOnlyNightMode
  const showText = preferences.showTextWithAudio && !isNightMode
  const speechSupported = typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  const playbackId = `${episode.series_id}:${episode.episode_id}`
  const narration = useDeviceNarration({
    playbackId,
    text: episode.story_text,
    language,
    voicePresetId: preferences.voicePresetId,
  })

  useEffect(() => {
    setShowVoiceSelector(false)
  }, [episode.episode_id, episode.series_id])

  const unavailable = !speechSupported || narration.status === 'unavailable'
  const statusMessage = unavailable
    ? copy.unavailable
    : narration.status === 'error'
      ? copy.error
      : narration.isCompleted
        ? copy.completed
        : narration.positionSeconds > 0
          ? copy.resumeHint
          : copy.ready

  return (
    <div className={`space-y-4 rounded-[2rem] border p-4 text-[#f8f2e7] transition-colors duration-300 ${
      isNightMode
        ? 'border-[#242b28] bg-[#090d0b] shadow-[0_18px_45px_-30px_rgba(0,0,0,.9)]'
        : 'border-[#2f3a35] bg-gradient-to-b from-[#26332f] to-[#121916] shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_18px_45px_-30px_rgba(0,0,0,.65)]'
    }`}>
      <p
        role={narration.status === 'error' || unavailable ? 'alert' : 'status'}
        className={`rounded-[1.25rem] border px-3 py-2 text-xs leading-5 ${
          narration.status === 'error' || unavailable
            ? 'border-[#815b52] bg-[#3a211d] text-[#ffd8ce]'
            : 'border-[#4e5d54] bg-white/6 text-[#d8d0be]'
        }`}
      >
        {statusMessage}
      </p>

      {isNightMode ? (
        <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] px-5 py-8 text-center">
          <p className="text-4xl" aria-hidden="true">☾</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#b8aa85]">{stylePack.title[language]}</p>
          <h3 className="q-heading mt-2 text-2xl font-bold text-[#f3ecd9]">{episode.title}</h3>
        </div>
      ) : (
        <StylePackCover stylePack={stylePack} variant="listening" title={episode.title} subtitle={stylePack.title[language]} />
      )}

      <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/7 p-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d4af37]">{t(language, 'listen.progress')}</p>
            <p className="text-xs tabular-nums text-[#d8d0be]">
              {formatTime(narration.positionSeconds)} / {formatTime(narration.durationSeconds)}
            </p>
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(1, narration.durationSeconds)}
            step={1}
            value={Math.min(narration.positionSeconds, Math.max(1, narration.durationSeconds))}
            onChange={(event) => narration.seekTo(Number(event.target.value))}
            disabled={narration.durationSeconds <= 0 || unavailable}
            aria-label={t(language, 'listen.progress')}
            className="mt-3 h-2 w-full cursor-pointer accent-[#b9ebf2] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-center gap-3 py-1">
          <button
            className="min-h-12 rounded-full border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-[#f8f2e7] disabled:opacity-40"
            onClick={() => narration.seekBy(-10)}
            disabled={narration.durationSeconds <= 0 || unavailable}
          >
            {t(language, 'listen.back_10')}
          </button>
          <button
            className="h-16 w-16 rounded-full bg-gradient-to-b from-[#f0cd58] to-[#d4af37] text-sm font-black text-[#2b2100] shadow-[0_18px_35px_-22px_rgba(212,175,55,.9)] disabled:cursor-not-allowed disabled:opacity-45"
            onClick={narration.isPlaying ? narration.pause : narration.play}
            disabled={unavailable}
            aria-label={narration.isPlaying ? t(language, 'listen.pause') : t(language, 'listen.play')}
          >
            {narration.isPlaying ? '⏸' : '▶'}
          </button>
          <button
            className="min-h-12 rounded-full border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-[#f8f2e7] disabled:opacity-40"
            onClick={() => narration.seekBy(10)}
            disabled={narration.durationSeconds <= 0 || unavailable}
          >
            {t(language, 'listen.forward_10')}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-[#d8d0be]">{t(language, 'listen.speed')}</p>
          <div className="flex gap-2">
            {([0.8, 1, 1.2] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => narration.changeSpeed(speed)}
                disabled={unavailable}
                className={`rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${
                  narration.speed === speed ? 'bg-[#b9ebf2] text-[#12373b]' : 'border border-white/10 text-[#f8f2e7]'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          className="rounded-2xl border border-white/10 bg-white/7 px-3 py-3 text-sm font-bold disabled:opacity-40"
          onClick={() => onPreferencesChange({ showTextWithAudio: !preferences.showTextWithAudio })}
          disabled={isNightMode}
        >
          {preferences.showTextWithAudio ? copy.hideText : copy.showText}
        </button>
        <button
          className="rounded-2xl border border-white/10 bg-white/7 px-3 py-3 text-sm font-bold"
          onClick={() => onPreferencesChange({ audioOnlyNightMode: !isNightMode })}
        >
          {isNightMode ? copy.exitNightMode : copy.nightMode}
        </button>
      </div>

      {showText ? (
        <article className={`rounded-[1.5rem] border border-white/10 bg-[#fff8e9] p-5 text-[#29271f] ${textSizeClass[preferences.textSize]} ${lineHeightClass[preferences.lineSpacing]}`}>
          {narration.timeline.map((segment, index) => (
            <span
              key={segment.id}
              className={`rounded-md px-0.5 transition-colors duration-300 ${
                index === narration.currentSegmentIndex && narration.status !== 'idle'
                  ? 'bg-[#f4d86a]/55'
                  : ''
              }`}
            >
              {segment.text}{' '}
            </span>
          ))}
        </article>
      ) : null}

      {!isNightMode ? (
        <div className="space-y-3">
          <button
            className="w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm font-bold"
            onClick={() => setShowVoiceSelector((value) => !value)}
          >
            {t(language, 'listen.change_voice')}
          </button>
          {showVoiceSelector ? (
            <div className="space-y-2">
              <p className="px-1 text-xs leading-5 text-[#d8d0be]">{copy.voiceHint}</p>
              <VoiceSelector
                language={language}
                selectedVoiceId={preferences.voicePresetId}
                onSelect={(voicePresetId) => onPreferencesChange({ voicePresetId })}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
