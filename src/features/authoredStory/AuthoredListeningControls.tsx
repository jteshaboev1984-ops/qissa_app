import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { VoicePresetId } from '../../types/qissa'
import type { AuthoredStoryPackage, AuthoredStoryProgress } from './types'
import {
  buildAuthoredAudioPlan, nextAuthoredAudioSegment,
  type AuthoredAudioPlan, type AuthoredAudioSegment,
} from './authoredAudioPlan'
import { requestCachedAuthoredAudio } from '../../lib/authoredAudioRemoteClient'

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'choice' | 'completed' | 'unavailable'
type Snapshot = {
  sourceLiteraryVersion: string
  lastCompletedId: string | null
  currentId: string | null
  seconds: number
  voicePreset: VoicePresetId
}
const PREFIX = 'qissa:v1:authoredAudioProgress'
const keyFor = (story: AuthoredStoryPackage, partId: string) =>
  `${PREFIX}:${story.story_id}:${story.story_version}:${story.language}:${partId}`
const readSnapshot = (key: string, version: string): Snapshot | null => {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const snapshot = parsed as Snapshot
    return snapshot.sourceLiteraryVersion === version &&
      (snapshot.currentId === null || typeof snapshot.currentId === 'string') &&
      (snapshot.lastCompletedId === null || typeof snapshot.lastCompletedId === 'string') &&
      typeof snapshot.seconds === 'number' && Number.isFinite(snapshot.seconds) &&
      (snapshot.voicePreset === 'soft_female' || snapshot.voicePreset === 'calm_male')
      ? snapshot : null
  } catch { return null }
}
const saveSnapshot = (key: string, snapshot: Snapshot) => {
  try { window.localStorage.setItem(key, JSON.stringify(snapshot)) } catch { /* browsing still works */ }
}

export const clearAuthoredAudioProgress = (story: AuthoredStoryPackage) => {
  try {
    const prefix = `${PREFIX}:${story.story_id}:${story.story_version}:`
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(prefix)) window.localStorage.removeItem(key)
    }
  } catch { /* best effort */ }
}

/**
 * Existing authored reader supplies the exact story/progress. Never reconstruct
 * a branch from a loose text response or generate audio before the family taps Play.
 */
export function AuthoredListeningControls({
  story, progress,
}: {
  story: AuthoredStoryPackage
  progress: AuthoredStoryProgress
}) {
  const plan = useMemo(() => buildAuthoredAudioPlan(story, progress), [story, progress])
  const key = useMemo(() => keyFor(story, plan.partId), [story, plan.partId])
  const snapshot = useMemo(() => readSnapshot(key, plan.sourceLiteraryVersion), [key, plan.sourceLiteraryVersion])
  const [voice, setVoice] = useState<VoicePresetId>(snapshot?.voicePreset ?? 'soft_female')
  const [status, setStatus] = useState<Status>('idle')
  const [source, setSource] = useState<'cache' | 'device' | null>(null)
  const lastCompletedRef = useRef<string | null>(snapshot?.lastCompletedId ?? null)
  const currentRef = useRef<string | null>(snapshot?.currentId ?? null)
  const secondsRef = useRef(snapshot?.seconds ?? 0)
  const speedRef = useRef<0.8 | 1 | 1.2>(1)
  const tokenRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)
  const planRef = useRef<AuthoredAudioPlan>(plan)
  const startRef = useRef<(segment: AuthoredAudioSegment) => void>(() => {})
  const lastSavedRef = useRef(0)
  planRef.current = plan

  const persist = useCallback(() => {
    saveSnapshot(key, {
      sourceLiteraryVersion: planRef.current.sourceLiteraryVersion,
      lastCompletedId: lastCompletedRef.current,
      currentId: currentRef.current,
      seconds: secondsRef.current,
      voicePreset: voice,
    })
  }, [key, voice])

  const stopMedia = useCallback(() => {
    tokenRef.current += 1
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current.ontimeupdate = null
      audioRef.current.onerror = null
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    speechRef.current = null
  }, [])

  const finished = useCallback((segmentId: string) => {
    lastCompletedRef.current = segmentId
    currentRef.current = null
    secondsRef.current = 0
    persist()
    const next = nextAuthoredAudioSegment(planRef.current, segmentId)
    if (!next) {
      setStatus(planRef.current.pauseForChoice ? 'choice' : 'completed')
      return
    }
    startRef.current(next)
  }, [persist])

  const start = useCallback(async (segment: AuthoredAudioSegment) => {
    stopMedia()
    const token = tokenRef.current
    currentRef.current = segment.segmentId
    const restoredSeconds = secondsRef.current
    setStatus('loading')
    persist()

    const cachedUrl = await requestCachedAuthoredAudio(planRef.current, segment, voice)
    if (token !== tokenRef.current) return

    if (cachedUrl) {
      const audio = new Audio(cachedUrl)
      audioRef.current = audio
      audio.playbackRate = speedRef.current
      audio.onended = () => { if (token === tokenRef.current) finished(segment.segmentId) }
      audio.onerror = () => { if (token === tokenRef.current) setStatus('unavailable') }
      audio.ontimeupdate = () => {
        if (token !== tokenRef.current) return
        secondsRef.current = audio.currentTime
        if (Math.abs(audio.currentTime - lastSavedRef.current) >= 4) {
          lastSavedRef.current = audio.currentTime
          persist()
        }
      }
      if (restoredSeconds > 0) {
        audio.addEventListener('loadedmetadata', () => {
          audio.currentTime = Math.min(restoredSeconds, Math.max(0, audio.duration - 0.2))
        }, { once: true })
      }
      try {
        await audio.play()
        if (token === tokenRef.current) { setSource('cache'); setStatus('playing') }
      } catch {
        if (token === tokenRef.current) setStatus('paused')
      }
      return
    }

    // Fail closed when the OS has no actual voice for the selected language:
    // do not silently read Uzbek as Russian or English.
    const synth = 'speechSynthesis' in window ? window.speechSynthesis : null
    const prefix = story.language === 'uz' ? 'uz' : story.language === 'ru' ? 'ru' : 'kk'
    const matching = synth?.getVoices().filter((candidate) =>
      candidate.lang.toLowerCase().startsWith(prefix)) ?? []
    if (!synth || matching.length === 0) {
      setStatus('unavailable')
      setSource(null)
      return
    }
    const utterance = new SpeechSynthesisUtterance(segment.text)
    utterance.lang = story.language === 'uz' ? 'uz-UZ' : story.language === 'ru' ? 'ru-RU' : 'kk-KZ'
    utterance.voice = matching[0]
    utterance.rate = speedRef.current
    utterance.onend = () => { if (token === tokenRef.current) finished(segment.segmentId) }
    utterance.onerror = () => { if (token === tokenRef.current) setStatus('unavailable') }
    speechRef.current = utterance
    setSource('device')
    secondsRef.current = 0 // browser speech does not guarantee precise seek offsets
    synth.speak(utterance)
    if (token === tokenRef.current) setStatus('playing')
  }, [finished, persist, stopMedia, story.language, voice])

  startRef.current = (segment) => { void start(segment) }

  useEffect(() => {
    // When a choice is confirmed after the spoken pre-choice text ended, move
    // to the chosen resolution automatically. If OS autoplay blocks it, the
    // user sees the existing Play control and can resume explicitly.
    if (status !== 'choice' || plan.pauseForChoice) return
    const next = nextAuthoredAudioSegment(plan, lastCompletedRef.current)
    if (next) startRef.current(next)
  }, [plan, status])

  useEffect(() => () => {
    stopMedia()
    persist()
  }, [persist, stopMedia])

  const playOrPause = () => {
    if (status === 'playing') {
      if (audioRef.current) audioRef.current.pause()
      else if ('speechSynthesis' in window) window.speechSynthesis.pause()
      setStatus('paused')
      persist()
      return
    }
    if (status === 'paused') {
      if (audioRef.current) {
        void audioRef.current.play().then(() => setStatus('playing')).catch(() => setStatus('paused'))
        return
      }
      if (speechRef.current && 'speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
        setStatus('playing')
        return
      }
    }
    if (status === 'completed') {
      lastCompletedRef.current = null
      currentRef.current = null
      secondsRef.current = 0
    }
    const current = plan.segments.find((segment) => segment.segmentId === currentRef.current)
    const next = current ?? nextAuthoredAudioSegment(plan, lastCompletedRef.current)
    if (next) startRef.current(next)
    else setStatus(plan.pauseForChoice ? 'choice' : 'completed')
  }

  const updateVoice = (value: VoicePresetId) => {
    stopMedia()
    setVoice(value)
    setStatus('paused')
    setSource(null)
    secondsRef.current = 0
    persist()
  }

  const isUz = story.language === 'uz'
  return (
    <section className="rounded-[1.2rem] border border-[#d9c9a5] bg-[#fcf5e6] p-3 text-[#2e3a36]" aria-label={isUz ? 'Ertakni tinglash' : 'Прослушивание сказки'}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={playOrPause}
          disabled={status === 'loading'}
          className="rounded-full bg-[#206b70] px-4 py-2 text-sm font-semibold text-white disabled:opacity-55"
          aria-label={status === 'playing' ? (isUz ? 'To‘xtatib turish' : 'Пауза') : (isUz ? 'Tinglash' : 'Слушать')}
        >
          {status === 'playing' ? (isUz ? 'Pauza' : 'Пауза') : (isUz ? '▶ Tinglash' : '▶ Слушать')}
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs">
          {isUz ? 'Ovoz' : 'Голос'}
          <select
            aria-label={isUz ? 'Ovoz' : 'Голос рассказчика'}
            value={voice}
            onChange={(event) => updateVoice(event.target.value as VoicePresetId)}
            className="rounded-lg border border-[#d9c9a5] bg-white p-2"
          >
            <option value="soft_female">{isUz ? 'Yumshoq' : 'Мягкий'}</option>
            <option value="calm_male">{isUz ? 'Sokin' : 'Спокойный'}</option>
          </select>
        </label>
      </div>
      {status === 'choice' ? (
        <p className="mt-2 text-xs">{isUz ? 'Davomini eshitish uchun tanlovni tasdiqlang.' : 'Подтвердите выбор, чтобы услышать продолжение.'}</p>
      ) : null}
      {status === 'unavailable' ? (
        <p className="mt-2 text-xs" role="status">{isUz
          ? 'Bu qurilmada mos o‘zbekcha ovoz mavjud emas. Ertakni o‘qish mumkin.'
          : 'Голос на этом устройстве недоступен. Сказку можно читать.'}</p>
      ) : null}
      {status === 'loading' ? (
        <p className="mt-2 text-xs" role="status">{isUz ? 'Audio tekshirilmoqda…' : 'Проверяем аудиозапись…'}</p>
      ) : null}
      {status === 'playing' && source ? (
        <p className="mt-2 text-xs text-[#647169]" role="status">
          {source === 'cache'
            ? (isUz ? 'Tayyor audio' : 'Готовая аудиозапись')
            : (isUz ? 'Qurilma ovozi' : 'Голос устройства')}
        </p>
      ) : null}
    </section>
  )
}
