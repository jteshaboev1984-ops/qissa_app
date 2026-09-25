import type {
  AuthoredStoryChoiceIllustration,
  AuthoredStoryImageSlot,
  AuthoredStoryPackage,
  AuthoredStoryProgress,
} from '../features/authoredStory/types'
import { sevenRoadsStory1EpisodeNumber } from '../features/publishedStories/sevenRoadsProgress'

const KEY_PREFIX = 'qissa:v1:authoredIllustrationDiscovery'

export interface SevenRoadsGalleryItem {
  key: string
  episodeNumber: number
  assetId: string | null
  runtimeUrl: string | null
  alt: string
  unlocked: boolean
}

export interface SevenRoadsGalleryEpisode {
  episodeNumber: number
  title: string
  items: SevenRoadsGalleryItem[]
  unlockedCount: number
}

const storage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const keyFor = (story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>) =>
  `${KEY_PREFIX}:${story.story_id}:${story.story_version}`

const readIds = (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
): Set<string> => {
  const target = storage()
  if (!target) return new Set()

  try {
    const raw = target.getItem(keyFor(story))
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((value): value is string => typeof value === 'string'))
  } catch {
    return new Set()
  }
}

const writeIds = (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
  ids: Set<string>,
) => {
  const target = storage()
  if (!target) return
  try {
    target.setItem(keyFor(story), JSON.stringify([...ids]))
  } catch {
    // Illustration discovery is additive; reading must remain available if storage fails.
  }
}

const markSeen = (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
  assetId: string,
) => {
  const ids = readIds(story)
  if (ids.has(assetId)) return ids
  ids.add(assetId)
  writeIds(story, ids)
  return ids
}

const addPartAssets = (
  ids: Set<string>,
  part: AuthoredStoryPackage['parts'][number],
  includeChoicePreviews: boolean,
) => {
  part.image_slots.forEach((slot) => ids.add(slot.asset_id))

  if (includeChoicePreviews && part.decision) {
    part.decision.choices.forEach((choice) => ids.add(choice.illustration.asset_id))
  }
}

const seedFromProgress = (
  story: AuthoredStoryPackage,
  progress: AuthoredStoryProgress | null,
): Set<string> => {
  const ids = readIds(story)
  if (!progress) return ids

  story.parts.forEach((part, index) => {
    const definitelyCompleted = progress.completed || index < progress.current_part_index
    if (definitelyCompleted) {
      // To finish a part, the reader has passed every shared illustration.
      // Decision cards also show both choice previews before confirmation.
      addPartAssets(ids, part, true)
      return
    }

    if (
      index === progress.current_part_index &&
      part.decision &&
      progress.selected_choices[part.decision.decision_id]
    ) {
      // Confirming a choice means both preview cards were already shown.
      part.decision.choices.forEach((choice) => ids.add(choice.illustration.asset_id))
    }
  })

  writeIds(story, ids)
  return ids
}

const imageItem = (
  episodeNumber: number,
  asset: AuthoredStoryImageSlot | AuthoredStoryChoiceIllustration,
  alt: string,
  seenIds: Set<string>,
  key: string,
): SevenRoadsGalleryItem => ({
  key,
  episodeNumber,
  assetId: asset.asset_id,
  runtimeUrl: asset.runtime_url,
  alt,
  unlocked: seenIds.has(asset.asset_id),
})

const buildGalleryEpisodes = (
  story: AuthoredStoryPackage,
  episodeTitles: string[],
  progress: AuthoredStoryProgress | null,
): SevenRoadsGalleryEpisode[] => {
  const seenIds = seedFromProgress(story, progress)
  const groups = new Map<number, SevenRoadsGalleryItem[]>()

  const push = (episodeNumber: number, item: SevenRoadsGalleryItem) => {
    const existing = groups.get(episodeNumber) ?? []
    existing.push(item)
    groups.set(episodeNumber, existing)
  }

  story.parts.forEach((part, partIndex) => {
    const episodeNumber = sevenRoadsStory1EpisodeNumber(partIndex)
    const storyTextSlots = part.image_slots.filter((slot) => slot.phase === 'story_text')
    const postChoiceSlots = part.image_slots.filter((slot) => slot.phase === 'post_choice_text')

    storyTextSlots.forEach((slot) => {
      push(
        episodeNumber,
        imageItem(
          episodeNumber,
          slot,
          `Иллюстрация серии ${episodeNumber}`,
          seenIds,
          `shared:${slot.slot_id}`,
        ),
      )
    })

    if (part.decision) {
      part.decision.choices.forEach((choice) => {
        push(
          episodeNumber,
          imageItem(
            episodeNumber,
            choice.illustration,
            `Иллюстрация выбора в серии ${episodeNumber}`,
            seenIds,
            `choice:${choice.choice_id}`,
          ),
        )
      })
    }

    postChoiceSlots.forEach((slot) => {
      push(
        episodeNumber,
        imageItem(
          episodeNumber,
          slot,
          `Иллюстрация серии ${episodeNumber}`,
          seenIds,
          `shared:${slot.slot_id}`,
        ),
      )
    })
  })

  return episodeTitles.map((title, index) => {
    const episodeNumber = index + 1
    const items = groups.get(episodeNumber) ?? []
    return {
      episodeNumber,
      title,
      items,
      unlockedCount: items.filter((item) => item.unlocked).length,
    }
  })
}

export const authoredIllustrationDiscovery = {
  keyPrefix: KEY_PREFIX,
  keyFor,
  load: readIds,
  markSeen,
  seedFromProgress,
  buildGalleryEpisodes,
}
