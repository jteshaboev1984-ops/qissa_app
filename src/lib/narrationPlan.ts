export type NarrationSpeed = 0.8 | 1 | 1.2

export type NarrationSegment = {
  id: string
  text: string
  startSeconds: number
  endSeconds: number
}

const WORDS_PER_MINUTE = 155
const MAX_WORDS_PER_SEGMENT = 22
const MIN_SEGMENT_SECONDS = 1.2

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim()

const splitLongSentence = (sentence: string): string[] => {
  const words = normalizeText(sentence).split(' ').filter(Boolean)
  if (words.length <= MAX_WORDS_PER_SEGMENT) return words.length > 0 ? [words.join(' ')] : []

  const chunks: string[] = []
  for (let index = 0; index < words.length; index += MAX_WORDS_PER_SEGMENT) {
    chunks.push(words.slice(index, index + MAX_WORDS_PER_SEGMENT).join(' '))
  }
  return chunks
}

export const splitNarrationText = (text: string): string[] => {
  const normalized = normalizeText(text)
  if (!normalized) return []

  const sentences = normalized.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/gu) ?? [normalized]
  return sentences.flatMap(splitLongSentence).filter(Boolean)
}

export const estimateNarrationSeconds = (text: string, speed: NarrationSpeed): number => {
  const wordCount = normalizeText(text).split(' ').filter(Boolean).length
  if (wordCount === 0) return 0
  return Math.max(MIN_SEGMENT_SECONDS, (wordCount / (WORDS_PER_MINUTE * speed)) * 60)
}

export const buildNarrationTimeline = (text: string, speed: NarrationSpeed): NarrationSegment[] => {
  let cursor = 0
  return splitNarrationText(text).map((segmentText, index) => {
    const duration = estimateNarrationSeconds(segmentText, speed)
    const segment: NarrationSegment = {
      id: `segment-${index + 1}`,
      text: segmentText,
      startSeconds: cursor,
      endSeconds: cursor + duration,
    }
    cursor = segment.endSeconds
    return segment
  })
}

export const timelineDuration = (segments: NarrationSegment[]): number =>
  segments.length > 0 ? segments[segments.length - 1].endSeconds : 0

export const segmentIndexAtPosition = (segments: NarrationSegment[], positionSeconds: number): number => {
  if (segments.length === 0) return 0
  const clamped = Math.max(0, positionSeconds)
  const index = segments.findIndex((segment) => clamped < segment.endSeconds)
  return index >= 0 ? index : segments.length - 1
}
