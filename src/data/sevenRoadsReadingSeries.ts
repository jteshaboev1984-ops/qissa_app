import type { AuthoredStoryPackage, AuthoredStoryPart } from '../features/authoredStory/types'
import type { PublishedSeasonEpisode } from '../features/publishedStories/types'

// User-approved 30-series layout, independent of the literary JSON and its persisted story IDs.
// Every split is anchored to a unique complete paragraph in RU and UZ, never a paragraph index.
export type ReadingStoryKey =
  | 'festival' | 'silver' | 'caravan' | 'towers'
  | 'waited' | 'falseRoad' | 'reinforcements' | 'ordan'

type Language = 'ru' | 'uz'
type Split = { part: number; phase: 'story_text' | 'post_choice_text'; ru: string[]; uz: string[] }
type Definition = {
  names: Record<Language, string[]>
  groups: number[][]
  splits: Split[]
}

const layout: Record<ReadingStoryKey, Definition> = {
  festival: {
    names: {
      ru: ['Праздник мужества', 'Восточный лес', 'Дорога в Заран', 'Обратная дорога', 'Возвращение'],
      uz: ['Jasorat bayrami', 'Sharqiy o‘rmon', 'Zaranga yo‘l', 'Qaytish yo‘li', 'Qaytish'],
    },
    groups: [[0, 1], [2], [3, 4], [5], [6]],
    splits: [],
  },
  silver: {
    names: { ru: ['Королевское серебро', 'Погоня', 'Фарид', 'Логово'], uz: ['Qirollik kumushi', 'Quvish', 'Farid', 'In'] },
    groups: [[0], [1], [2], [3]],
    splits: [{ part: 2, phase: 'post_choice_text', ru: ['К вечеру Ордан снова выглядел обычным.'], uz: ['Kechga kelib Ordan yana odatdagidek ko‘rina boshladi.'] }],
  },
  caravan: {
    names: {
      ru: ['Дом и караван', 'Ночь в сокровищнице', 'Утро после кражи', 'Старый проход', 'Третий след', 'Побег Надира', 'Допрос', 'Две дороги'],
      uz: ['Uy va karvon', 'Xazinadagi tun', 'O‘g‘irlikdan keyingi tong', 'Eski yo‘lak', 'Uchinchi iz', 'Nadirning qochishi', 'So‘roq', 'Ikki yo‘l'],
    },
    groups: [[0, 1], [2, 3], [4], [5, 6], [7], [8, 9], [10], [11]],
    splits: [
      { part: 4, phase: 'post_choice_text', ru: ['Когда Темур закончил первый круг вопросов, он вернулся к капитану.'], uz: ['Temur dastlabki savol-javoblarni tugatib, sardorning oldiga qaytdi.'] },
      { part: 6, phase: 'post_choice_text', ru: ['К вечеру караванный двор снова был полон движения.'], uz: ['Kechga yaqin karvonsaroy yana harakatga to‘ldi.'] },
    ],
  },
  towers: {
    names: { ru: ['Две башни', 'Курьер', 'Три столба'], uz: ['Ikki minora', 'Chopar', 'Uch ustun'] },
    groups: [[0], [1], [2]],
    splits: [],
  },
  waited: {
    names: {
      ru: ['Дорога в Ордан', 'Гнедой конь и Фарид', 'Ложное уведомление', 'Красный холм'],
      uz: ['Ordanga yo‘l', 'To‘riq ot va Farid', 'Soxta xabarnoma', 'Qizil tepalik'],
    },
    groups: [[0], [1], [2, 3], [4]],
    splits: [
      { part: 0, phase: 'story_text', ru: ['Вдруг Самира заметила гнедого коня у крайней стойки навеса.', 'Тюремную повозку готовили к утру.'], uz: ['Shu payt Samira soyabonning chetki ustuniga bog‘langan to‘riq otni ko‘rdi.', 'Qamoqxona aravasini tongga tayyorlashayotgan edi.'] },
      { part: 1, phase: 'story_text', ru: ['В караванном дворе Хамида день начался позже.'], uz: ['Hamidning karvon hovlisida kun kechroq boshlandi.'] },
    ],
  },
  falseRoad: {
    names: { ru: ['Северная дорога', 'Ложная дорога'], uz: ['Shimoliy yo‘l', 'Soxta yo‘l'] },
    groups: [[0], [1]],
    splits: [
      { part: 0, phase: 'story_text', ru: ['Через несколько минут впереди появилась небольшая развилка.'], uz: ['Bir necha daqiqadan keyin oldinda kichik ayrilish ko‘rindi.'] },
    ],
  },
  reinforcements: {
    names: { ru: ['Ложная подмога', 'Засада у башни'], uz: ['Soxta yordam', 'Minora yonidagi pistirma'] },
    groups: [[0, 1], [2]],
    splits: [
      { part: 1, phase: 'story_text', ru: ['Рахим отвёл детей к невысокой каменной стене между башней и повозкой.'], uz: ['Rahim bolalarni minora bilan arava orasidagi past tosh devor yoniga olib bordi.'] },
    ],
  },
  ordan: {
    names: { ru: ['Обратно в Ордан', 'Печать'], uz: ['Ordanga qaytish', 'Muhr'] },
    groups: [[0], [1]],
    splits: [
      { part: 0, phase: 'story_text', ru: ['Ответ из Араса пришёл после полудня.'], uz: ['Arasdan javob tushdan keyin keldi.'] },
    ],
  },
}

const paragraphs = (text: string): string[] =>
  text.split(/\n\n+/).map((part) => part.trim()).filter(Boolean)

const splitParagraphs = (source: string, anchors: string[], id: string): string[] => {
  const blocks = paragraphs(source)
  const locations = anchors.map((anchor) => {
    const matches = blocks.flatMap((paragraph, index) => paragraph === anchor ? [index] : [])
    if (matches.length !== 1) throw new Error(`Reading split anchor must be unique: ${id}: ${anchor}`)
    return matches[0]
  })
  if (locations.some((index, i) => index === 0 || (i > 0 && index <= locations[i - 1]))) {
    throw new Error(`Reading split anchors must be ordered and non-initial: ${id}`)
  }
  const endpoints = [0, ...locations, blocks.length]
  return endpoints.slice(0, -1).map((start, i) => blocks.slice(start, endpoints[i + 1]).join('\n\n'))
}

const storyPartPieces = (part: AuthoredStoryPart, sourceIndex: number, split: Split | undefined, language: Language): AuthoredStoryPart[] => {
  if (!split) return [part]
  const cuts = split[language]
  const phase = split.phase
  const segments = splitParagraphs(part[phase], cuts, `${part.part_id}/${language}`)
  const choiceChunk = phase === 'story_text' ? segments.length - 1 : 0
  return segments.map((text, segmentIndex) => {
    const isChoice = segmentIndex === choiceChunk
    const isLast = segmentIndex === segments.length - 1
    const sliceText = phase === 'story_text'
      ? text
      : segmentIndex === 0 ? part.story_text : text
    const sliceContinuation = phase === 'story_text'
      ? isLast ? part.post_choice_text : ''
      : segmentIndex === 0 ? text : ''
    const movedPostChoice = phase === 'post_choice_text' && segmentIndex > 0
    const slotIn = (slot: AuthoredStoryPart['image_slots'][number]) => {
      if (slot.phase !== phase) return segmentIndex === choiceChunk
      const splitBlocks = paragraphs(text)
      return splitBlocks.includes(slot.after_text)
    }
    const imageSlots = part.image_slots.filter(slotIn).map((slot) =>
      movedPostChoice ? { ...slot, phase: 'story_text' as const } : slot)
    const conditionalSegments = (part.conditional_segments ?? [])
      .filter((segment) => {
        if (segment.phase !== phase) return segmentIndex === choiceChunk
        return paragraphs(text).includes(segment.after_text)
      })
      .map((segment) => movedPostChoice ? { ...segment, phase: 'story_text' as const } : segment)
    return {
      ...part,
      // Preserve the original part_id on the choice-bearing segment.
      // Additional display segments receive derived IDs, never mutate authored IDs.
      part_id: isChoice ? part.part_id : `${part.part_id}__reading_${segmentIndex + 1}`,
      order: sourceIndex + 1,
      story_text: sliceText,
      post_choice_text: sliceContinuation,
      decision: isChoice ? part.decision : null,
      image_slots: imageSlots,
      conditional_segments: conditionalSegments,
      is_final: part.is_final && isLast,
    }
  })
}

export const withReadingSeries = (
  original: AuthoredStoryPackage,
  key: ReadingStoryKey,
  seasonOffset: number,
): { story: AuthoredStoryPackage; episodes: PublishedSeasonEpisode[] } => {
  const cfg = layout[key]
  const language: Language = original.language === 'uz' ? 'uz' : 'ru'
  const sourceIndices: number[] = []
  const parts: AuthoredStoryPart[] = []
  original.parts.forEach((part, index) => {
    const split = cfg.splits.find((cut) => cut.part === index)
    const pieces = storyPartPieces(part, index, split, language)
    pieces.forEach((piece) => {
      sourceIndices.push(index)
      parts.push({ ...piece, order: parts.length + 1 })
    })
  })
  const all = cfg.groups.flat()
  if (all.length !== parts.length || all.some((index, i) => index !== i)) {
    throw new Error(`Reading series must cover each literary fragment once: ${key}`)
  }
  if (cfg.names[language].length !== cfg.groups.length) {
    throw new Error(`Reading series title count mismatch: ${key}`)
  }
  const episodeByPart = Array.from({ length: parts.length }, () => 0)
  cfg.groups.forEach((indices, episodeIndex) =>
    indices.forEach((partIndex) => { episodeByPart[partIndex] = episodeIndex + 1 }))
  const story: AuthoredStoryPackage = {
    ...original,
    parts,
    reader_layout: {
      version: 'series-30-v1',
      episode_by_part: episodeByPart,
      source_part_by_part: sourceIndices,
    },
  }
  const episodes: PublishedSeasonEpisode[] = cfg.names[language].map((title, index) => ({
    number: index + 1,
    seasonNumber: seasonOffset + index + 1,
    title,
  }))
  return { story, episodes }
}
