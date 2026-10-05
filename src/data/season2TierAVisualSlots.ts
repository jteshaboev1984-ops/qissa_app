import rawManifest from './authored/season2TierAVisualSlots.json'

export type Season2TierAVisualRuntimeState =
  | 'published-existing-runtime'
  | 'hosted-runtime-ready'

export type Season2TierAVisualSlot = {
  story_number: number
  story_title_ru: string
  source_reference: string
  slot_id: string
  asset_id: string
  master_filename: string
  master_library_path: string
  runtime_state: Season2TierAVisualRuntimeState
  behavior: 'show_after_anchor'
  after_text: string
  note: string
}

export type Season2TierAVisualSlotManifest = {
  version: string
  status: 'runtime-assets-hosted'
  updated_at: string
  world_id: 'seven_roads'
  season_number: 2
  library_master_root: string
  runtime_policy: {
    published_story2_assets_remain_authoritative: boolean
    staged_assets_must_not_enter_authoredStoryAssets_until_hosted: boolean
    image_order: string
    gallery_unlock: string
    publication: string
  }
  slots: Season2TierAVisualSlot[]
}

export const season2TierAVisualSlotManifest =
  rawManifest as Season2TierAVisualSlotManifest

export const getSeason2TierAVisualSlots = (
  storyNumber: number,
): readonly Season2TierAVisualSlot[] =>
  season2TierAVisualSlotManifest.slots.filter(
    (slot) => slot.story_number === storyNumber,
  )

export const getSeason2TierAVisualSlot = (
  slotId: string,
): Season2TierAVisualSlot | null =>
  season2TierAVisualSlotManifest.slots.find(
    (slot) => slot.slot_id === slotId,
  ) ?? null
