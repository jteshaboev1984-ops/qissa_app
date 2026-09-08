import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Language, VoicePresetId } from '../types/qissa'
import { audioRemoteClient, type AudioDeliverySource, type RemotePlaybackProgress } from './audioRemoteClient'
import { segmentIndexAtPosition, timelineDuration, type NarrationSpeed } from './narrationPlan'
import { useDeviceNarration, type NarrationStatus } from './useDeviceNarration'

type DeliveryMode = 'pending' | 'remote' | 'device'
export type HybridNarrationStatus = NarrationStatus | 'loading'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function useHybridNarration({
  playbackId,
  seriesId,
  episodeId,
  text,
  language,
  voicePresetId,
}: {
  playbackId: string
  seriesId: string
  episodeId: string
  text: string
  language: Language
  voicePresetId: VoicePresetId
}) {
  const device = useDeviceNarration({ playbackId, text, language, voicePresetId })
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('pending')
  const [remoteStatus, setRemoteStatus] = useState<NarrationStatus>('idle')
  const [remotePosition, setRemotePosition] = useState(0)
  const [remoteDuration, setRemoteDuration] = useState(0)
  const [audioAssetId, setAudioAssetId] = useState<string | null>(null)
  const [audioSource, setAudioSource] = useState<AudioDeliverySource>(null)
  const [requiresAiVoiceDisclosure, setRequiresAiVoiceDisclosure] = useState(false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const requestTokenRef = useRef(0)
  const resumeRef = useRef<RemotePlaybackProgress | null>(null)
  const pendingResumeFractionRef = useRef<number | null>(null)
  const pendingPlayRef = useRef(false)
  const modeRef = useRef<DeliveryMode>('pending')
  const remotePositionRef = useRef(0)
  const remoteDurationRef = useRef(0)
  const audioAssetIdRef = useRef<string | null>(null)
  const devicePositionRef = useRef(device.positionSeconds)
  const deviceDurationRef = useRef(device.durationSeconds)
  const speedRef = useRef<NarrationSpeed>(device.speed)
  const completedSavedRef = useRef(false)

  useEffect(() => { modeRef.current = deliveryMode }, [deliveryMode])
  useEffect(() => { remotePositionRef.current = remotePosition }, [remotePosition])
  useEffect(() => { remoteDurationRef.current = remoteDuration }, [remoteDuration])
  useEffect(() => { audioAssetIdRef.current = audioAssetId }, [audioAssetId])
  useEffect(() => { devicePositionRef.current = device.positionSeconds }, [device.positionSeconds])
  useEffect(() => { deviceDurationRef.current = device.durationSeconds }, [device.durationSeconds])
  useEffect(() => { speedRef.current = device.speed }, [device.speed])

  const disposeRemoteAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.onloadedmetadata = null
    audio.ontimeupdate = null
    audio.onplay = null
    audio.onpause = null
    audio.onended = null
    audio.onerror = null
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    audioRef.current = null
  }, [])

  const persistRemote = useCallback((completed: boolean, positionOverride?: number) => {
    const mode = modeRef.current
    const position = positionOverride ?? (mode === 'remote' ? remotePositionRef.current : devicePositionRef.current)
    void audioRemoteClient.savePlaybackProgress({
      seriesId,
      episodeId,
      audioAssetId: mode === 'remote' ? audioAssetIdRef.current : null,
      positionSeconds: position,
      speed: speedRef.current,
      completed,
    }).catch(() => {
      // Local device progress remains the offline safety net; remote sync retries on later interaction.
    })
  }, [episodeId, seriesId])

  const startRemoteAudio = useCallback((audio: HTMLAudioElement) => {
    const playPromise = audio.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      void playPromise.catch(() => {
        setRemoteStatus(audio.currentTime > 0 ? 'paused' : 'idle')
      })
    }
  }, [])

  const attachRemoteAudio = useCallback((url: string, shouldPlay: boolean) => {
    disposeRemoteAudio()
    const audio = new Audio(url)
    audio.preload = 'auto'
    audio.playbackRate = speedRef.current
    audioRef.current = audio
    pendingPlayRef.current = shouldPlay

    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
      remoteDurationRef.current = duration
      setRemoteDuration(duration)

      const resume = resumeRef.current
      const pendingFraction = pendingResumeFractionRef.current
      let desired: number
      if (pendingFraction !== null && duration > 0) {
        desired = duration * clamp(pendingFraction, 0, 1)
        pendingResumeFractionRef.current = null
      } else {
        desired = resume?.completed ? duration : resume?.positionSeconds ?? devicePositionRef.current
      }

      const position = duration > 0 ? clamp(desired, 0, Math.max(0, duration - 0.05)) : Math.max(0, desired)
      try { audio.currentTime = position } catch { /* metadata can race on some browsers */ }
      remotePositionRef.current = position
      setRemotePosition(position)
      setRemoteStatus(resume?.completed ? 'completed' : position > 0 ? 'paused' : 'idle')

      if (pendingPlayRef.current && !resume?.completed) {
        pendingPlayRef.current = false
        startRemoteAudio(audio)
      }
    }

    audio.ontimeupdate = () => {
      remotePositionRef.current = audio.currentTime
      setRemotePosition(audio.currentTime)
    }
    audio.onplay = () => setRemoteStatus('playing')
    audio.onpause = () => {
      if (!audio.ended) setRemoteStatus(audio.currentTime > 0 ? 'paused' : 'idle')
    }
    audio.onended = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : remoteDurationRef.current
      remotePositionRef.current = duration
      setRemotePosition(duration)
      setRemoteStatus('completed')
      completedSavedRef.current = true
      persistRemote(true, duration)
    }
    audio.onerror = () => {
      const duration = remoteDurationRef.current
      const fraction = duration > 0 ? remotePositionRef.current / duration : 0
      const shouldResume = !audio.paused
      disposeRemoteAudio()
      setDeliveryMode('device')
      setRemoteStatus('error')
      setAudioSource('device-fallback')
      setFallbackReason('remote_playback_failed')
      const mapped = fraction * deviceDurationRef.current
      if (mapped > 0) device.seekTo(mapped)
      if (shouldResume) window.setTimeout(() => device.play(), 0)
    }

    audio.load()
  }, [device.play, device.seekTo, disposeRemoteAudio, persistRemote, startRemoteAudio])

  const requestRemoteAudio = useCallback(async (shouldPlay: boolean, speedOverride?: NarrationSpeed) => {
    const token = ++requestTokenRef.current
    const requestedSpeed = speedOverride ?? speedRef.current
    pendingPlayRef.current = shouldPlay
    setIsLoading(true)

    try {
      const result = await audioRemoteClient.requestAudio({
        seriesId,
        episodeId,
        voicePresetId,
        speed: requestedSpeed,
      })
      if (token !== requestTokenRef.current) return

      setAudioSource(result.source)
      setFallbackReason(result.errorCode)
      setRequiresAiVoiceDisclosure(result.requiresAiVoiceDisclosure)

      if (result.audioStatus === 'ready' && result.audioUrl && result.audioAssetId) {
        setDeliveryMode('remote')
        modeRef.current = 'remote'
        setAudioAssetId(result.audioAssetId)
        audioAssetIdRef.current = result.audioAssetId
        attachRemoteAudio(result.audioUrl, shouldPlay)
        return
      }

      setDeliveryMode('device')
      modeRef.current = 'device'
      setAudioAssetId(null)
      audioAssetIdRef.current = null
      setRequiresAiVoiceDisclosure(false)
      if (shouldPlay) device.play()
    } catch {
      if (token !== requestTokenRef.current) return
      setDeliveryMode('device')
      modeRef.current = 'device'
      setAudioSource('device-fallback')
      setFallbackReason('audio_service_unavailable')
      setRequiresAiVoiceDisclosure(false)
      if (shouldPlay) device.play()
    } finally {
      if (token === requestTokenRef.current) setIsLoading(false)
    }
  }, [attachRemoteAudio, device.play, episodeId, seriesId, voicePresetId])

  useEffect(() => {
    requestTokenRef.current += 1
    disposeRemoteAudio()
    setDeliveryMode('pending')
    modeRef.current = 'pending'
    setRemoteStatus('idle')
    setRemotePosition(0)
    setRemoteDuration(0)
    setAudioAssetId(null)
    setAudioSource(null)
    setFallbackReason(null)
    setRequiresAiVoiceDisclosure(false)
    setIsLoading(false)
    completedSavedRef.current = false
    resumeRef.current = null
    pendingResumeFractionRef.current = null

    let cancelled = false
    void audioRemoteClient.loadPlaybackProgress({ seriesId, episodeId }).then((progress) => {
      if (cancelled || !progress) return
      resumeRef.current = progress
      if (progress.speed !== speedRef.current) {
        speedRef.current = progress.speed
        device.changeSpeed(progress.speed)
      }
      window.setTimeout(() => {
        if (!cancelled && progress.positionSeconds > 0) device.seekTo(progress.positionSeconds)
      }, 0)
    }).catch(() => {
      // Loading remote progress is best-effort; local progress remains available.
    })

    return () => {
      cancelled = true
      requestTokenRef.current += 1
      disposeRemoteAudio()
    }
  }, [device.changeSpeed, device.seekTo, disposeRemoteAudio, episodeId, playbackId, seriesId, text])

  useEffect(() => {
    requestTokenRef.current += 1
    if (modeRef.current === 'remote') {
      const duration = remoteDurationRef.current
      const fraction = duration > 0 ? remotePositionRef.current / duration : 0
      pendingResumeFractionRef.current = fraction
      disposeRemoteAudio()
      if (fraction > 0) device.seekTo(fraction * deviceDurationRef.current)
    }
    setDeliveryMode('pending')
    modeRef.current = 'pending'
    setAudioAssetId(null)
    audioAssetIdRef.current = null
    setAudioSource(null)
    setFallbackReason(null)
    setRequiresAiVoiceDisclosure(false)
  }, [device.seekTo, disposeRemoteAudio, voicePresetId])

  const status: HybridNarrationStatus = isLoading
    ? 'loading'
    : deliveryMode === 'remote'
      ? remoteStatus
      : device.status

  const isPlaying = deliveryMode === 'remote' ? remoteStatus === 'playing' : device.isPlaying
  const isCompleted = deliveryMode === 'remote' ? remoteStatus === 'completed' : device.isCompleted
  const positionSeconds = deliveryMode === 'remote' ? remotePosition : device.positionSeconds
  const durationSeconds = deliveryMode === 'remote' && remoteDuration > 0 ? remoteDuration : device.durationSeconds

  const currentSegmentIndex = useMemo(() => {
    if (deliveryMode !== 'remote') return device.currentSegmentIndex
    const plannedDuration = timelineDuration(device.timeline)
    const mappedPosition = remoteDuration > 0 && plannedDuration > 0
      ? (remotePosition / remoteDuration) * plannedDuration
      : remotePosition
    return segmentIndexAtPosition(device.timeline, mappedPosition)
  }, [deliveryMode, device.currentSegmentIndex, device.timeline, remoteDuration, remotePosition])

  const play = useCallback(() => {
    if (isLoading) return
    if (deliveryMode === 'remote' && audioRef.current) {
      const audio = audioRef.current
      if (remoteStatus === 'completed') {
        audio.currentTime = 0
        remotePositionRef.current = 0
        setRemotePosition(0)
        setRemoteStatus('idle')
      }
      audio.playbackRate = speedRef.current
      startRemoteAudio(audio)
      return
    }
    if (deliveryMode === 'device') {
      device.play()
      return
    }
    void requestRemoteAudio(true)
  }, [deliveryMode, device.play, isLoading, remoteStatus, requestRemoteAudio, startRemoteAudio])

  const pause = useCallback(() => {
    if (deliveryMode === 'remote' && audioRef.current) {
      audioRef.current.pause()
      persistRemote(false)
      return
    }
    device.pause()
    window.setTimeout(() => persistRemote(false), 0)
  }, [deliveryMode, device.pause, persistRemote])

  const seekTo = useCallback((nextPosition: number) => {
    const safeDuration = Math.max(0, durationSeconds)
    const next = safeDuration > 0 ? clamp(nextPosition, 0, safeDuration) : Math.max(0, nextPosition)
    if (deliveryMode === 'remote' && audioRef.current) {
      audioRef.current.currentTime = next
      remotePositionRef.current = next
      setRemotePosition(next)
      const completed = safeDuration > 0 && next >= safeDuration - 0.1
      setRemoteStatus(completed ? 'completed' : next > 0 ? 'paused' : 'idle')
      persistRemote(completed, next)
      return
    }
    device.seekTo(next)
    persistRemote(false, next)
  }, [deliveryMode, device.seekTo, durationSeconds, persistRemote])

  const seekBy = useCallback((seconds: number) => seekTo(positionSeconds + seconds), [positionSeconds, seekTo])

  const changeSpeed = useCallback((nextSpeed: NarrationSpeed) => {
    if (nextSpeed === speedRef.current) return
    speedRef.current = nextSpeed
    device.changeSpeed(nextSpeed)

    if (deliveryMode === 'remote' && audioRef.current) {
      audioRef.current.playbackRate = nextSpeed
      persistRemote(false)
      return
    }

    // Device narration owns its own restart/resume logic. Pending remote audio
    // will read speedRef when attached, so changing speed never needs another
    // provider request or another cached TTS asset.
    window.setTimeout(() => persistRemote(false), 0)
  }, [deliveryMode, device.changeSpeed, persistRemote])

  useEffect(() => {
    if (!isPlaying) return
    const intervalId = window.setInterval(() => persistRemote(false), 5_000)
    return () => window.clearInterval(intervalId)
  }, [isPlaying, persistRemote])

  useEffect(() => {
    if (deliveryMode === 'device' && device.isCompleted && !completedSavedRef.current) {
      completedSavedRef.current = true
      persistRemote(true, device.durationSeconds)
    }
    if (!device.isCompleted) completedSavedRef.current = false
  }, [deliveryMode, device.durationSeconds, device.isCompleted, persistRemote])

  return {
    status,
    deliveryMode,
    isLoading,
    isPlaying,
    isPaused: status === 'paused',
    isCompleted,
    isUnavailable: deliveryMode === 'device' && device.status === 'unavailable',
    positionSeconds,
    durationSeconds,
    progress: durationSeconds > 0 ? clamp(positionSeconds / durationSeconds, 0, 1) : 0,
    speed: device.speed,
    timeline: device.timeline,
    currentSegmentIndex,
    play,
    pause,
    seekTo,
    seekBy,
    changeSpeed,
    audioSource,
    fallbackReason,
    requiresAiVoiceDisclosure,
    usingDeviceFallback: deliveryMode === 'device' && audioSource === 'device-fallback',
  }
}
