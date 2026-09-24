import type { PositiveValue, StatePatch } from '../../types/qissa'

export type AuthoredStoryPhase = 'story_text' | 'post_choice_text'
export type AuthoredStoryImageKind = 'shared' | 'choice'

export interface AuthoredStoryImageSlot {
  slot_id: string
  anchor_key: string
  kind: 'shared'
  scene_key: string
  status: string
  asset_id: string
  runtime_url: string | null
  phase: AuthoredStoryPhase
  after_text: string
}

export interface AuthoredStoryChoiceIllustration {
  slot_id: string
  kind: 'choice'
  scene_key: string
  status: string
  behavior: string
  asset_id: string
  runtime_url: string | null
}

export interface AuthoredStoryChoice {
  choice_id: string
  text: string
  effect_summary: string
  resolution_text: string
  state_patch: StatePatch
  value_alignment: PositiveValue[]
  illustration: AuthoredStoryChoiceIllustration
}

export interface AuthoredStoryDecision {
  decision_id: string
  prompt: string
  choices: [AuthoredStoryChoice, AuthoredStoryChoice]
  merge_state: Record<string, string>
}

export interface AuthoredStoryPart {
  part_id: string
  order: number
  title: string
  story_text: string
  post_choice_text: string
  visual_state: string
  illustration_refs: string[]
  image_slots: AuthoredStoryImageSlot[]
  decision: AuthoredStoryDecision | null
  is_final: boolean
}

export interface AuthoredStoryIllustrationPlan {
  plan_version: string
  plan_ref: string
  master_style_id: string
  editorial_master_style_reference: string
  runtime_asset_storage: string
  planned_asset_count: number
  shared_asset_count: number
  choice_asset_count: number
  cover_asset_count: number
  visible_assets_per_playthrough: number
  rule: string
  production_prompt_pack_ref: string
}

export interface AuthoredStoryCoverIllustration {
  asset_id: string
  runtime_url: string | null
  status: string
  editorial_reference_ids: string[]
}

export interface AuthoredStoryPackage {
  schema_version: string
  story_id: string
  story_version: string
  source_literary_version: string
  source_file: string
  language: 'ru' | 'uz' | 'kz'
  world_id: string
  title: string
  app_age_group: '3-4' | '5-7' | '8-9'
  editorial_age_range: string
  story_mode: 'series'
  story_mood: 'kind_adventure' | 'bedtime'
  style_pack_id: string
  master_style_id: string
  editorial_master_style_reference: string
  baseline_choice_path: string[]
  required_final_invariants: Record<string, string>
  illustration_plan: AuthoredStoryIllustrationPlan
  cover_illustration: AuthoredStoryCoverIllustration
  parts: AuthoredStoryPart[]
}

export interface AuthoredStoryChoiceHistoryEntry {
  decision_id: string
  part_id: string
  choice_id: string
  choice_text: string
  effect_summary: string
  selected_at: string
}

export interface AuthoredStoryMemoryState {
  lastEvent: string
  canonState: Record<string, string>
  relationshipState: Record<string, string>
}

export interface AuthoredStoryProgress {
  story_id: string
  story_version: string
  current_part_index: number
  selected_choices: Record<string, string>
  shown_resolution_decisions: string[]
  choice_history: AuthoredStoryChoiceHistoryEntry[]
  memory: AuthoredStoryMemoryState
  completed: boolean
  updated_at: string
}

export type AuthoredStoryNarrativeBlock =
  | { kind: 'text'; text: string }
  | { kind: 'image'; slot: AuthoredStoryImageSlot }
