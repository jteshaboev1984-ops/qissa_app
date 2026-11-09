// Read-only QA for authored QISSA episodes. No published prose/state is modified.
// Fail only deterministic structural/canon contradictions. Style metrics are evidence,
// not literary verdicts or arbitrary publication thresholds.
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

export const AUTHORED_STORIES = [
  'prazdnikMuzhestvaV3',
  'taynaVostochnogoKaravanaV4',
  'staging/season2Story1RoyalSilver',
  'staging/season2Story3TwoTowers',
  'staging/season2Story4WaitedMan',
  'staging/season2Story5FalseRoad',
  'staging/season2Story6TwoReinforcements',
  'staging/season2Story7BackToOrdan',
]

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const words = (text) => String(text ?? '').trim().split(/\s+/u).filter(Boolean)
const paragraphs = (text) => String(text ?? '').split(/\n\s*\n/u).map((item) => item.trim()).filter(Boolean)
const patchCanon = (patch) => {
  const source = patch?.canon_updates
  if (Array.isArray(source)) {
    return Object.fromEntries(source.filter((entry) => isObject(entry) && typeof entry.key === 'string').map((entry) => [entry.key, entry.value]))
  }
  return isObject(source) ? source : {}
}
const normalized = (text) => String(text ?? '').toLocaleLowerCase('ru').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

export const auditLockedCanonPatch = (lockedCanon, proposedPatch) => {
  const errors = []
  for (const [key, proposedValue] of Object.entries(patchCanon(proposedPatch))) {
    if (Object.hasOwn(lockedCanon ?? {}, key) && lockedCanon[key] !== proposedValue) {
      errors.push('immutable_canon_conflict:' + key)
    }
  }
  return errors
}

export const auditStoryPackage = (story) => {
  const errors = []
  const warnings = []
  if (!isObject(story) || !Array.isArray(story.parts) || story.parts.length === 0) {
    return { errors: ['missing_parts'], warnings, metrics: null }
  }
  for (const key of ['story_id', 'story_version', 'language', 'title']) {
    if (!String(story[key] ?? '').trim()) errors.push('missing_' + key)
  }
  const partIds = new Set()
  const decisions = new Map()
  const choiceIds = new Set()
  for (const [index, part] of story.parts.entries()) {
    if (!part || typeof part !== 'object') { errors.push('invalid_part:' + index); continue }
    if (part.order !== index + 1) errors.push('nonsequential_order:' + part.part_id)
    if (!part.part_id || partIds.has(part.part_id)) errors.push('duplicate_or_missing_part_id:' + index)
    partIds.add(part.part_id)
    if (!String(part.story_text ?? '').trim()) errors.push('empty_story_text:' + part.part_id)
    const decision = part.decision
    if (!decision) continue
    if (!decision.decision_id || decisions.has(decision.decision_id)) errors.push('duplicate_or_missing_decision:' + part.part_id)
    decisions.set(decision.decision_id, { partIndex: index, choiceIds: new Set((decision.choices ?? []).map((x) => x.choice_id)) })
    if (!Array.isArray(decision.choices) || decision.choices.length !== 2) {
      errors.push('choice_count:' + decision.decision_id)
      continue
    }
    const [a, b] = decision.choices
    for (const choice of decision.choices) {
      if (!choice.choice_id || choiceIds.has(choice.choice_id)) errors.push('duplicate_or_missing_choice:' + decision.decision_id)
      choiceIds.add(choice.choice_id)
      if (!String(choice.text ?? '').trim()) errors.push('empty_choice_text:' + choice.choice_id)
      if (!String(choice.resolution_text ?? '').trim()) errors.push('empty_resolution:' + choice.choice_id)
      const merge = isObject(decision.merge_state) ? decision.merge_state : {}
      for (const [key, value] of Object.entries(patchCanon(choice.state_patch))) {
        if (Object.hasOwn(merge, key) && merge[key] !== value) {
          errors.push('branch_state_overwritten_by_merge:' + decision.decision_id + ':' + key)
        }
      }
    }
    if (normalized(a.text) === normalized(b.text)) errors.push('identical_choice_labels:' + decision.decision_id)
    if (normalized(a.resolution_text) === normalized(b.resolution_text)) errors.push('identical_resolutions:' + decision.decision_id)
    const diffState = JSON.stringify(patchCanon(a.state_patch)) !== JSON.stringify(patchCanon(b.state_patch)) ||
      JSON.stringify(a.state_patch?.relationship_updates ?? {}) !== JSON.stringify(b.state_patch?.relationship_updates ?? {})
    if (!diffState && normalized(a.effect_summary) === normalized(b.effect_summary)) {
      warnings.push('choice_memory_may_be_cosmetic:' + decision.decision_id)
    }
    const counts = decision.choices.map((choice) => words(choice.resolution_text).length)
    const ratio = Math.max(...counts) / Math.max(1, Math.min(...counts))
    if (ratio >= 2.5) warnings.push('branch_length_review:' + decision.decision_id + ':' + counts.join('/'))
  }

  const finals = story.parts.map((part, index) => part.is_final ? index : -1).filter((index) => index >= 0)
  if (finals.length !== 1 || finals[0] !== story.parts.length - 1) errors.push('final_part_must_be_last_and_unique')

  const external = new Map((story.external_choice_context ?? []).map((entry) => [entry.decision_id, new Set(entry.allowed_choice_ids ?? [])]))
  const seenSegments = new Set()
  for (const [index, part] of story.parts.entries()) {
    for (const segment of part.conditional_segments ?? []) {
      if (!segment.segment_id || seenSegments.has(segment.segment_id)) errors.push('duplicate_or_missing_conditional_segment:' + part.part_id)
      seenSegments.add(segment.segment_id)
      const condition = segment.when ?? {}
      const local = decisions.get(condition.decision_id)
      const allowed = local?.choiceIds ?? external.get(condition.decision_id)
      if (!allowed || !allowed.has(condition.choice_id)) errors.push('unknown_branch_reference:' + segment.segment_id)
      if (local && local.partIndex > index) errors.push('future_branch_reference:' + segment.segment_id)
      const sourceText = part[segment.phase]
      if (!['story_text', 'post_choice_text'].includes(segment.phase) ||
        paragraphs(sourceText).filter((paragraph) => paragraph === segment.after_text).length !== 1) {
        errors.push('missing_or_ambiguous_conditional_anchor:' + segment.segment_id)
      }
    }
  }

  const allText = story.parts.flatMap((part) => [
    part.story_text, part.post_choice_text,
    ...(part.decision?.choices ?? []).map((choice) => choice.resolution_text),
    ...(part.conditional_segments ?? []).map((segment) => segment.text),
  ]).filter(Boolean)
  const para = allText.flatMap(paragraphs)
  const shortCount = para.filter((item) => words(item).length <= 4).length
  const adjacentRepetitions = []
  for (let i = 1; i < para.length; i += 1) {
    if (normalized(para[i]) === normalized(para[i - 1]) && words(para[i]).length >= 2) {
      adjacentRepetitions.push(i)
    }
  }
  if (adjacentRepetitions.length) warnings.push('adjacent_identical_paragraph_review:' + adjacentRepetitions.length)
  const metrics = {
    total_all_path_words: words(allText.join('\n')).length,
    paragraphs: para.length,
    short_paragraphs_1_to_4_words: shortCount,
    short_paragraph_percent: para.length ? Math.round(1000 * shortCount / para.length) / 10 : 0,
    decisions: decisions.size,
  }
  return { errors, warnings, metrics }
}

export const auditLanguagePair = (source, localized) => {
  const errors = []
  if (source.story_id !== localized.story_id) errors.push('bilingual_story_id_drift')
  if (source.story_version !== localized.story_version) errors.push('bilingual_story_version_drift')
  if (source.parts?.length !== localized.parts?.length) errors.push('bilingual_part_count_drift')
  for (let i = 0; i < Math.min(source.parts?.length ?? 0, localized.parts?.length ?? 0); i += 1) {
    const a = source.parts[i], b = localized.parts[i]
    if (a.part_id !== b.part_id) errors.push('bilingual_part_id_drift:' + i)
    if ((a.decision?.decision_id ?? null) !== (b.decision?.decision_id ?? null)) {
      errors.push('bilingual_decision_drift:' + a.part_id)
    }
    const aChoices = (a.decision?.choices ?? []).map((choice) => choice.choice_id)
    const bChoices = (b.decision?.choices ?? []).map((choice) => choice.choice_id)
    if (JSON.stringify(aChoices) !== JSON.stringify(bChoices)) errors.push('bilingual_choice_ids_drift:' + a.part_id)
    for (let j = 0; j < Math.min(aChoices.length, bChoices.length); j += 1) {
      const left = Object.keys(patchCanon(a.decision.choices[j].state_patch)).sort()
      const right = Object.keys(patchCanon(b.decision.choices[j].state_patch)).sort()
      if (JSON.stringify(left) !== JSON.stringify(right)) errors.push('bilingual_canon_key_drift:' + a.part_id + ':' + j)
    }
  }
  // Narrative prose and human-readable canon values may be intentionally localized.
  return errors
}

const selfTest = () => {
  const choice = (id, value) => ({
    choice_id: id, text: 'Действие ' + id, effect_summary: 'Результат ' + id,
    resolution_text: 'Событие ' + id, state_patch: { canon_updates: { method: value } },
  })
  const specimen = {
    story_id: 'test', story_version: '1', language: 'ru', title: 'Тест',
    parts: [{ part_id: 'p1', order: 1, story_text: 'Однажды.', post_choice_text: 'Конец.',
      is_final: true, decision: { decision_id: 'd1', merge_state: {},
      choices: [choice('a', 'a'), choice('b', 'b')] } }],
  }
  assert.deepEqual(auditStoryPackage(specimen).errors, [])
  assert.deepEqual(auditLanguagePair(specimen, { ...specimen, language: 'uz' }), [])
  const overwrite = structuredClone(specimen)
  overwrite.parts[0].decision.merge_state = { method: 'forced' }
  assert(auditStoryPackage(overwrite).errors.some((e) => e.startsWith('branch_state_overwritten_by_merge')))
  const bad = structuredClone(specimen)
  bad.parts[0].decision.choices[1].resolution_text = 'Событие a'
  assert(auditStoryPackage(bad).errors.some((e) => e.startsWith('identical_resolutions')))
  const localized = structuredClone(specimen)
  localized.parts[0].decision.choices[0].state_patch.canon_updates = { translated_method: 'a' }
  assert(auditLanguagePair(specimen, localized).some((e) => e.startsWith('bilingual_canon_key_drift')))
  assert.deepEqual(auditLockedCanonPatch({ hero_name: 'Темур' }, { canon_updates: { hero_name: 'Другое имя' } }),
    ['immutable_canon_conflict:hero_name'])
  assert.deepEqual(auditLockedCanonPatch({ hero_name: 'Темур' }, { canon_updates: { current_location: 'Заран' } }), [])
  console.log('[story-canon-literary] self-tests PASS')
}

const main = () => {
  const root = process.cwd()
  const failures = []
  const rows = []
  for (const stem of AUTHORED_STORIES) {
    const load = (language) => JSON.parse(fs.readFileSync(
      path.join(root, 'src/data/authored', stem + '.' + language + '.json'), 'utf8',
    ))
    const ru = load('ru')
    const uz = load('uz')
    const ruAudit = auditStoryPackage(ru)
    const uzAudit = auditStoryPackage(uz)
    const bilingual = auditLanguagePair(ru, uz)
    for (const error of ruAudit.errors) failures.push(stem + '.ru:' + error)
    for (const error of uzAudit.errors) failures.push(stem + '.uz:' + error)
    for (const error of bilingual) failures.push(stem + '.bilingual:' + error)
    rows.push({ story: ru.title, ru: ruAudit.metrics, uz: uzAudit.metrics,
      warnings_ru: ruAudit.warnings, warnings_uz: uzAudit.warnings })
  }
  for (const row of rows) {
    console.log('[story-canon-literary]', row.story, 'RU short=', row.ru.short_paragraph_percent + '%',
      'UZ short=', row.uz.short_paragraph_percent + '%',
      'decisions=', row.ru.decisions)
    for (const warning of row.warnings_ru) console.log('  REVIEW RU', warning)
    for (const warning of row.warnings_uz) console.log('  REVIEW UZ', warning)
  }
  if (failures.length) {
    failures.forEach((item) => console.error('[story-canon-literary] ERROR', item))
    process.exitCode = 1
  } else {
    console.log('[story-canon-literary] PASS: 8 RU/UZ story pairs; only deterministic contradictions are gates')
    console.log('[story-canon-literary] Rhythm and branch-length metrics are advisory, never auto-rewrite/rejection')
  }
}

if (process.argv.includes('--self-test')) selfTest()
else if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main()
