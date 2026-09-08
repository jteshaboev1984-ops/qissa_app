import { readFileSync } from 'node:fs'

const migration = readFileSync('docs/qissa/backend/migrations/20260908_000011_add_story_flow_observability.sql', 'utf8')
const failures = []
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

for (const eventName of [
  'story_session_started',
  'story_episode_persisted',
  'story_choice_confirmed',
  'story_session_completed',
]) {
  requireCondition(migration.includes(`'${eventName}'`), `Missing observability event: ${eventName}`)
}

for (const triggerName of [
  'trg_qissa_story_session_started',
  'trg_qissa_story_session_completed',
  'trg_qissa_story_episode_persisted',
  'trg_qissa_story_choice_confirmed',
]) {
  requireCondition(migration.includes(triggerName), `Missing observability trigger: ${triggerName}`)
}

requireCondition(
  /idx_app_events_profile_created/.test(migration),
  'Operational event lookup must be indexed by child profile and time.',
)

requireCondition(
  /after insert on public\.story_sessions/.test(migration) &&
    /after insert on public\.story_episodes/.test(migration) &&
    /after insert on public\.story_choice_events/.test(migration) &&
    /after update of status on public\.story_sessions/.test(migration),
  'Story observability must be emitted from trusted persistence writes rather than browser analytics.',
)

requireCondition(
  /old\.status is distinct from new\.status and new\.status = 'completed'/.test(migration),
  'Completion event must fire only on a real transition to completed.',
)

for (const forbidden of [
  'story_text',
  'custom_hero_name',
  'display_name',
  'choice_text',
  'resolution_text',
  'tomorrow_seed',
  'audio_bytes',
]) {
  const payloadSections = migration.match(/jsonb_build_object\([\s\S]*?\n\s*\)/g) ?? []
  if (payloadSections.some((section) => section.includes(forbidden))) {
    failures.push(`Observability payload must not contain sensitive/free-form field: ${forbidden}`)
  }
}

requireCondition(
  !/installation_id\s*,/.test(migration),
  'Story-flow telemetry must not persist installation identity in ordinary event payload inserts.',
)

if (failures.length > 0) {
  console.error('Story observability contract check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Story observability contract check passed: first-party, minimal, and privacy-scoped.')
