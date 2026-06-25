import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Language, VoicePresetId } from '../types/qissa'
import {
  buildNarrationTimeline,
  segmentIndexAtPosition,
  timelineDuration,
  type NarrationSpeed,
} from './narrationPlan'
import { playbackProgress, type PlaybackProgressSnapshot } from './playbackProgress'

export type NarrationStatus = 'idle' | 'playing' | 'paused' | 'completed' | 'unavailable' | 'error'

type RestoreState = {
  playbackId: string
  snapshot: PlaybackProgressSnapshot | null
}

const languageTags: Record<Language, string> = {
  ru: 'ru-RU',
  uz: 'uz-UZ',
  kz: 'kk-KZ',
}

const voiceHints: Record<VoicePresetId, RegExp> = {
  soft_female: /female|woman|anna|alena|milena|irina|victoria|xenia/i,
  calm_male: /male|man|alex|maxim|yuri|pavel|dmitri|mikhail/i,
  neutral_storyteller: /natural|premium|enhanced|neural|google|microsoft/i,
  cheerful_daytime: /female|woman|natural|premium|enhanced|google|microsoft/i,
}

const synthesisApi = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

const chooseVoice = (voices: SpeechSynthesisVoice[], language: Language, preset: VoicePresetId) => {
  const prefix = languageTags[language].slice(0, 2).toLowerCase()
  const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix))
  return matching.find((voice) => voiceHints[preset].test(voice.name)) ?? matching[0] ?? null
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function useDeviceNarration({
  playbackId,
  text,
  language,
  voicePresetId,
}: {
  playbackId: string
  text: string
  language: Language
  voicePresetId: VoicePresetId
}) {
  const initial = useMemo(() => playbackProgress.load(playbackId), [playbackId])
  const [speed, setSpeedState] = useState<NarrationSpeed>(initial?.speed ?? 1)
  const [positionSeconds, setPositionSeconds] = useState(initial?.positionSeconds ?? 0)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [status, setStatus] = useState<NarrationStatus>(initial?.completed ? 'completed' : 'idle')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [restoreState, setRestoreState] = useState<RestoreState | null>({ playbackId, snapshot: initial })

  const timeline = useMemo(() => buildNarrationTimeline(text, speed), [text, speed])
  const durationSeconds = useMemo(() => timelineDuration(timeline), [timeline])

  const statusRef = useRef(status)
  const positionRef = useRef(positionSeconds)
  const speedRef = useRef(speed)
  const timelineRef = useRef(timeline)
  const durationRef = useRef(durationSeconds)
  const segmentRef = useRef(currentSegmentIndex)
  const startedAtRef = useRef(0)
  const basePositionRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const tokenRef = useRef(0)
  const speakRef = useRef<(index: number) => void>(() => {})

  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { positionRef.current = positionSeconds }, [positionSeconds])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => {
    timelineRef.current = timeline
    durationRef.current = durationSeconds
  }, [timeline, durationSeconds])

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const persist = useCallback((completed = false) => {
    playbackProgress.save({
      playbackId,
      positionSeconds: positionRef.current,
      durationSeconds: durationRef.current,
      speed: speedRef.current,
      completed,
      updatedAt: new Date().toISOString(),
    })
  }, [playbackId])

  const setPosition = useCallback((index: number, position: number) => {
    segmentRef.current = index
    setCurrentSegmentIndex(index)
    positionRef.current = position
    setPositionSeconds(position)
  }, [])

  const updateClock = useCallback(() => {
    if (statusRef.current !== 'playing') return
    const segment = timelineRef.current[segmentRef.current]
    if (!segment) return
    const elapsed = Math.max(0, (performance.now() - startedAtRef.current) / 1000)
    const next = Math.min(segment.endSeconds, basePositionRef.current + elapsed)
    positionRef.current = next
    setPositionSeconds(next)
  }, [])

  const cancel = useCallback(() => {
    tokenRef.current += 1
    stopTimer()
    clearPendingTimeout()
    const synthesis = synthesisApi()
    if (synthesis?.paused) synthesis.resume()
    synthesis?.cancel()
  }, [clearPendingTimeout, stopTimer])

  const speak = useCallback((index: number) => {
    const synthesis = synthesisApi()
    const segment = timelineRef.current[index]
    if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      setStatus('unavailable')
      return
    }
    if (!segment) {
      setStatus('completed')
      setPosition(Math.max(0, timelineRef.current.length - 1), durationRef.current)
      persist(true)
      return
    }

    cancel()
    const token = tokenRef.current
    setPosition(index, segment.startSeconds)
    const utterance = new SpeechSynthesisUtterance(segment.text)
    utterance.lang = languageTags[language]
    utterance.rate = speedRef.current
    const selectedVoice = chooseVoice(voices, language, voicePresetId)
    if (selectedVoice) utterance.voice = selectedVoice

    utterance.onstart = () => {
      if (token !== tokenRef.current) return
      basePositionRef.current = segment.startSeconds
      startedAtRef.current = performance.now()
      setStatus('playing')
      stopTimer()
      timerRef.current = window.setInterval(updateClock, 250)
    }

    utterance.onend = () => {
      if (token !== tokenRef.current) return
      stopTimer()
      setPosition(index, segment.endSeconds)
      const completed = index >= timelineRef.current.length - 1
      persist(completed)
      if (completed) {
        setStatus('completed')
        return
      }

      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        if (token === tokenRef.current) speakRef.current(index + 1)
      }, 0)
    }

    utterance.onerror = (event) => {
      if (token !== tokenRef.current || event.error === 'canceled' || event.error === 'interrupted') return
      stopTimer()
      setStatus('error')
      persist(false)
    }

    synthesis.speak(utterance)
  }, [cancel, language, persist, setPosition, stopTimer, updateClock, voicePresetId, voices])

  useEffect(() => { speakRef.current = speak }, [speak])

  useEffect(() => {
    const synthesis = synthesisApi()
    if (!synthesis) {
      setStatus('unavailable')
      return
    }
    const refresh = () => setVoices(synthesis.getVoices())
    refresh()
    synthesis.addEventListener('voiceschanged', refresh)
    return () => synthesis.removeEventListener('voiceschanged', refresh)
  }, [])

  useEffect(() => {
    cancel()
    const snapshot = playbackProgress.load(playbackId)
    setRestoreState({ playbackId, snapshot })
    setSpeedState(snapshot?.speed ?? 1)
  }, [cancel, playbackId, text])

  useEffect(() => {
    if (!restoreState || restoreState.playbackId !== playbackId) return
    const desiredSpeed = restoreState.snapshot?.speed ?? 1
    if (speed !== desiredSpeed) return
    const restored = restoreState.snapshot?.completed
      ? durationSeconds
      : Math.min(restoreState.snapshot?.positionSeconds ?? 0, durationSeconds)
    const index = segmentIndexAtPosition(timeline, restored)
    setPosition(index, restored)
    setStatus(restoreState.snapshot?.completed ? 'completed' : restored > 0 ? 'paused' : 'idle')
    setRestoreState(null)
  }, [durationSeconds, playbackId, restoreState, setPosition, speed, timeline])

  useEffect(() => () => {
    cancel()
    persist(statusRef.current === 'completed')
  }, [cancel, persist])

  const play = useCallback(() => {
    if (!synthesisApi() || timelineRef.current.length === 0) {
      setStatus('unavailable')
      return
    }
    const start = statusRef.current === 'completed' ? 0 : positionRef.current
    speakRef.current(segmentIndexAtPosition(timelineRef.current, start))
  }, [])

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return
    updateClock()
    cancel()
    setStatus('paused')
    persist(false)
  }, [cancel, persist, updateClock])

  const seekTo = useCallback((nextPosition: number) => {
    if (durationRef.current <= 0) return
    const wasPlaying = statusRef.current === 'playing'
    const next = clamp(nextPosition, 0, durationRef.current)
    cancel()
    if (next >= durationRef.current - 0.1) {
      setPosition(Math.max(0, timelineRef.current.length - 1), durationRef.current)
      setStatus('completed')
      persist(true)
      return
    }

    const index = segmentIndexAtPosition(timelineRef.current, next)
    const aligned = timelineRef.current[index]?.startSeconds ?? 0
    setPosition(index, aligned)
    setStatus(aligned > 0 ? 'paused' : 'idle')
    persist(false)

    if (wasPlaying) {
      const token = tokenRef.current
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        if (token === tokenRef.current) speakRef.current(index)
      }, 0)
    }
  }, [cancel, persist, setPosition])

  const seekBy = useCallback((seconds: number) => seekTo(positionRef.current + seconds), [seekTo])

  const changeSpeed = useCallback((nextSpeed: NarrationSpeed) => {
    if (nextSpeed === speedRef.current) return
    const fraction = durationRef.current > 0 ? positionRef.current / durationRef.current : 0
    const wasPlaying = statusRef.current === 'playing'
    cancel()
    const token = tokenRef.current
    speedRef.current = nextSpeed
    setSpeedState(nextSpeed)

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null
      if (token !== tokenRef.current) return
      const next = fraction * durationRef.current
      const index = segmentIndexAtPosition(timelineRef.current, next)
      setPosition(index, next)
      persist(false)
      setStatus(next > 0 ? 'paused' : 'idle')
      if (wasPlaying) speakRef.current(index)
    }, 0)
  }, [cancel, persist, setPosition])

  return {
    status,
    isPlaying: status === 'playing',
    isPaused: status === 'paused',
    isCompleted: status === 'completed',
    positionSeconds,
    durationSeconds,
    progress: durationSeconds > 0 ? clamp(positionSeconds / durationSeconds, 0, 1) : 0,
    speed,
    timeline,
    currentSegmentIndex,
    play,
    pause,
    seekTo,
    seekBy,
    changeSpeed,
  }
}
