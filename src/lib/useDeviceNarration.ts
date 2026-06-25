import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Language, VoicePresetId } from '../types/qissa'
import {
  buildNarrationTimeline,
  segmentIndexAtPosition,
  timelineDuration,
  type NarrationSegment,
  type NarrationSpeed,
} from './narrationPlan'
import { playbackProgress } from './playbackProgress'

export type NarrationStatus = 'idle' | 'playing' | 'paused' | 'completed' | 'unavailable' | 'error'

const languageTags: Record<Language, string> = {
  ru: 'ru-RU',
  uz: 'uz-UZ',
  kz: 'kk-KZ',
}

const voiceHints: Record<VoicePresetId, RegExp> = {
  soft_female: /female|woman|anna|alena|milena|irina|zuzana|victoria|xenia/i,
  calm_male: /male|man|alex|maxim|yuri|pavel|dmitri|mikhail/i,
  neutral_storyteller: /natural|premium|enhanced|neural|google|microsoft/i,
  cheerful_daytime: /female|woman|natural|premium|enhanced|google|microsoft/i,
}

const getSpeechSynthesis = (): SpeechSynthesis | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  return window.speechSynthesis
}

const chooseVoice = (
  voices: SpeechSynthesisVoice[],
  language: Language,
  voicePresetId: VoicePresetId,
): SpeechSynthesisVoice | null => {
  const languagePrefix = languageTags[language].slice(0, 2).toLowerCase()
  const languageVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(languagePrefix))
  const candidates = languageVoices.length > 0 ? languageVoices : voices
  return candidates.find((voice) => voiceHints[voicePresetId].test(voice.name)) ?? candidates[0] ?? null
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum)

export function useDeviceNarration({
  episodeId,
  text,
  language,
  voicePresetId,
}: {
  episodeId: string
  text: string
  language: Language
  voicePresetId: VoicePresetId
}) {
  const initialSnapshot = useMemo(() => playbackProgress.load(episodeId), [episodeId])
  const [speed, setSpeedState] = useState<NarrationSpeed>(initialSnapshot?.speed ?? 1)
  const [positionSeconds, setPositionSeconds] = useState(initialSnapshot?.positionSeconds ?? 0)
  const [status, setStatus] = useState<NarrationStatus>(initialSnapshot?.completed ? 'completed' : 'idle')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const timeline = useMemo(() => buildNarrationTimeline(text, speed), [speed, text])
  const durationSeconds = useMemo(() => timelineDuration(timeline), [timeline])

  const statusRef = useRef(status)
  const positionRef = useRef(positionSeconds)
  const speedRef = useRef(speed)
  const timelineRef = useRef(timeline)
  const durationRef = useRef(durationSeconds)
  const currentSegmentRef = useRef(0)
  const utteranceTokenRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const segmentStartedAtRef = useRef(0)
  const segmentBasePositionRef = useRef(0)
  const lastPersistedSecondRef = useRef(-1)
  const speakSegmentRef = useRef<(index: number) => void>(() => {})
  const speedTransitionRef = useRef<{ fraction: number; resume: boolean } | null>(null)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    positionRef.current = positionSeconds
  }, [positionSeconds])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    timelineRef.current = timeline
    durationRef.current = durationSeconds
  }, [durationSeconds, timeline])

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const persistCurrent = useCallback((completed = false) => {
    playbackProgress.save({
      episodeId,
      positionSeconds: positionRef.current,
      durationSeconds: durationRef.current,
      speed: speedRef.current,
      completed,
      updatedAt: new Date().toISOString(),
    })
  }, [episodeId])

  const updatePlayingPosition = useCallback(() => {
    if (statusRef.current !== 'playing') return
    const segments = timelineRef.current
    const segment = segments[currentSegmentRef.current]
    if (!segment) return

    const elapsed = Math.max(0, (performance.now() - segmentStartedAtRef.current) / 1000)
    const nextPosition = Math.min(segment.endSeconds, segmentBasePositionRef.current + elapsed)
    positionRef.current = nextPosition
    setPositionSeconds(nextPosition)

    const wholeSecond = Math.floor(nextPosition)
    if (wholeSecond !== lastPersistedSecondRef.current) {
      lastPersistedSecondRef.current = wholeSecond
      persistCurrent(false)
    }
  }, [persistCurrent])

  const startTimer = useCallback(() => {
    stopTimer()
    timerRef.current = window.setInterval(updatePlayingPosition, 250)
  }, [stopTimer, updatePlayingPosition])

  const cancelActiveUtterance = useCallback(() => {
    utteranceTokenRef.current += 1
    stopTimer()
    getSpeechSynthesis()?.cancel()
  }, [stopTimer])

  const speakSegment = useCallback((index: number) => {
    const synthesis = getSpeechSynthesis()
    const segments = timelineRef.current
    const segment: NarrationSegment | undefined = segments[index]

    if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      setStatus('unavailable')
      return
    }
    if (!segment) {
      const finalPosition = durationRef.current
      positionRef.current = finalPosition
      setPositionSeconds(finalPosition)
      setStatus('completed')
      persistCurrent(true)
      return
    }

    cancelActiveUtterance()
    const token = utteranceTokenRef.current
    currentSegmentRef.current = index
    positionRef.current = segment.startSeconds
    setPositionSeconds(segment.startSeconds)

    const utterance = new SpeechSynthesisUtterance(segment.text)
    utterance.lang = languageTags[language]
    utterance.rate = speedRef.current
    const selectedVoice = chooseVoice(voices, language, voicePresetId)
    if (selectedVoice) utterance.voice = selectedVoice

    utterance.onstart = () => {
      if (token !== utteranceTokenRef.current) return
      segmentBasePositionRef.current = segment.startSeconds
      segmentStartedAtRef.current = performance.now()
      setStatus('playing')
      startTimer()
    }

    utterance.onend = () => {
      if (token !== utteranceTokenRef.current) return
      stopTimer()
      positionRef.current = segment.endSeconds
      setPositionSeconds(segment.endSeconds)
      persistCurrent(index >= segments.length - 1)

      if (index >= segments.length - 1) {
        setStatus('completed')
        return
      }

      window.setTimeout(() => {
        if (token === utteranceTokenRef.current) speakSegmentRef.current(index + 1)
      }, 0)
    }

    utterance.onerror = (event) => {
      if (token !== utteranceTokenRef.current || event.error === 'canceled' || event.error === 'interrupted') return
      stopTimer()
      setStatus('error')
      persistCurrent(false)
    }

    synthesis.speak(utterance)
  }, [cancelActiveUtterance, language, persistCurrent, startTimer, stopTimer, voicePresetId, voices])

  useEffect(() => {
    speakSegmentRef.current = speakSegment
  }, [speakSegment])

  useEffect(() => {
    const synthesis = getSpeechSynthesis()
    if (!synthesis) {
      setStatus('unavailable')
      return
    }

    const refreshVoices = () => setVoices(synthesis.getVoices())
    refreshVoices()
    synthesis.addEventListener('voiceschanged', refreshVoices)
    return () => synthesis.removeEventListener('voiceschanged', refreshVoices)
  }, [])

  useEffect(() => {
    cancelActiveUtterance()
    const snapshot = playbackProgress.load(episodeId)
    const restoredSpeed = snapshot?.speed ?? 1
    setSpeedState(restoredSpeed)
    speedRef.current = restoredSpeed
    const restoredPosition = snapshot?.completed ? durationSeconds : snapshot?.positionSeconds ?? 0
    positionRef.current = restoredPosition
    setPositionSeconds(restoredPosition)
    setStatus(snapshot?.completed ? 'completed' : 'idle')
    currentSegmentRef.current = segmentIndexAtPosition(timeline, restoredPosition)
    lastPersistedSecondRef.current = Math.floor(restoredPosition)
  }, [cancelActiveUtterance, episodeId, text])

  useEffect(() => () => {
    cancelActiveUtterance()
    persistCurrent(statusRef.current === 'completed')
  }, [cancelActiveUtterance, persistCurrent])

  useEffect(() => {
    const transition = speedTransitionRef.current
    if (!transition) return
    speedTransitionRef.current = null

    const nextPosition = transition.fraction * durationSeconds
    positionRef.current = nextPosition
    setPositionSeconds(nextPosition)
    currentSegmentRef.current = segmentIndexAtPosition(timeline, nextPosition)
    persistCurrent(false)

    if (transition.resume) {
      window.setTimeout(() => speakSegmentRef.current(currentSegmentRef.current), 0)
    } else {
      setStatus(nextPosition > 0 ? 'paused' : 'idle')
    }
  }, [durationSeconds, persistCurrent, timeline])

  const play = useCallback(() => {
    const synthesis = getSpeechSynthesis()
    if (!synthesis || timelineRef.current.length === 0) {
      setStatus('unavailable')
      return
    }

    if (statusRef.current === 'paused' && synthesis.paused) {
      segmentBasePositionRef.current = positionRef.current
      segmentStartedAtRef.current = performance.now()
      synthesis.resume()
      setStatus('playing')
      startTimer()
      return
    }

    const startPosition = statusRef.current === 'completed' ? 0 : positionRef.current
    const index = segmentIndexAtPosition(timelineRef.current, startPosition)
    speakSegmentRef.current(index)
  }, [startTimer])

  const pause = useCallback(() => {
    const synthesis = getSpeechSynthesis()
    if (!synthesis || statusRef.current !== 'playing') return
    updatePlayingPosition()
    synthesis.pause()
    stopTimer()
    setStatus('paused')
    persistCurrent(false)
  }, [persistCurrent, stopTimer, updatePlayingPosition])

  const seekTo = useCallback((nextPosition: number) => {
    const duration = durationRef.current
    if (duration <= 0) return
    const wasPlaying = statusRef.current === 'playing'
    const clampedPosition = clamp(nextPosition, 0, duration)
    cancelActiveUtterance()

    if (clampedPosition >= duration - 0.1) {
      positionRef.current = duration
      setPositionSeconds(duration)
      setStatus('completed')
      persistCurrent(true)
      return
    }

    const index = segmentIndexAtPosition(timelineRef.current, clampedPosition)
    const alignedPosition = timelineRef.current[index]?.startSeconds ?? 0
    currentSegmentRef.current = index
    positionRef.current = alignedPosition
    setPositionSeconds(alignedPosition)
    setStatus(alignedPosition > 0 ? 'paused' : 'idle')
    persistCurrent(false)

    if (wasPlaying) window.setTimeout(() => speakSegmentRef.current(index), 0)
  }, [cancelActiveUtterance, persistCurrent])

  const seekBy = useCallback((deltaSeconds: number) => {
    seekTo(positionRef.current + deltaSeconds)
  }, [seekTo])

  const changeSpeed = useCallback((nextSpeed: NarrationSpeed) => {
    if (nextSpeed === speedRef.current) return
    const currentDuration = durationRef.current
    speedTransitionRef.current = {
      fraction: currentDuration > 0 ? positionRef.current / currentDuration : 0,
      resume: statusRef.current === 'playing',
    }
    cancelActiveUtterance()
    speedRef.current = nextSpeed
    setSpeedState(nextSpeed)
  }, [cancelActiveUtterance])

  return {
    status,
    isPlaying: status === 'playing',
    isPaused: status === 'paused',
    isCompleted: status === 'completed',
    positionSeconds,
    durationSeconds,
    progress: durationSeconds > 0 ? clamp(positionSeconds / durationSeconds, 0, 1) : 0,
    speed,
    play,
    pause,
    seekTo,
    seekBy,
    changeSpeed,
  }
}
