/**
 * Provider-free authoring tool:
 *   node scripts/compile-authored-audio-manifest.mjs --source src/data/authored/XXX.ru.json
 *   node scripts/compile-authored-audio-manifest.mjs --source ... --out /tmp/qissa-audio-draft.json
 *
 * Never publishes, approves, uploads or invokes Azure. The output is always a
 * DRAFT requiring matching the compiled source against locked literary canon.
 * RU full packages work directly; UZ overlays must first be resolved into
 * complete localized AuthoredStoryPackage objects using approved app tooling.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import ts from 'typescript'

const transpile = (path) => ts.transpileModule(readFileSync(path, 'utf8'), {
  fileName: path,
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const asUrl = (source) =>
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
const engineUrl = asUrl(transpile('src/features/authoredStory/engine.ts'))
const plannerUrl = asUrl(
  transpile('src/features/authoredStory/authoredAudioPlan.ts')
    .replace(/from ['"]\.\/engine['"]/, `from '${engineUrl}'`),
)
const manifestUrl = asUrl(
  transpile('src/features/authoredStory/audioManifest.ts')
    .replace(/from ['"]\.\/authoredAudioPlan['"]/, `from '${plannerUrl}'`),
)
const { compileDraftAuthoredAudioManifest } = await import(manifestUrl)
const sha256 = (content) => createHash('sha256').update(content).digest('hex')

const args = process.argv.slice(2)
const arg = (flag) => {
  const i = args.indexOf(flag)
  return i < 0 ? null : args[i + 1] ?? null
}
const sourcePath = arg('--source')
const outputPath = arg('--out')
if (!sourcePath || !sourcePath.endsWith('.json')) {
  console.error('Usage: --source <complete-authored-package.json> [--out <draft-manifest.json>]')
  process.exit(2)
}
const sourceBytes = readFileSync(sourcePath)
const story = JSON.parse(sourceBytes.toString('utf8'))
if (!Array.isArray(story.parts) ||
  !story.source_literary_version ||
  story.parts.some((part) => !Array.isArray(part.image_slots) ||
    !Object.prototype.hasOwnProperty.call(part, 'post_choice_text'))) {
  throw new Error('Input is not a complete authored package; localize any UZ overlay first.')
}

const draft = compileDraftAuthoredAudioManifest(story)
const manifest = {
  schemaVersion: 'qissa-authored-audio-draft-v1',
  approvalStatus: 'review_required',
  sourcePackagePath: sourcePath,
  sourcePackageSha256: sha256(sourceBytes),
  sourceLiteraryVersion: story.source_literary_version,
  scenariosChecked: draft.scenariosChecked,
  isApproved: false,
  isPublished: false,
  rows: draft.segments.map((segment) => ({
    story_id: story.story_id,
    story_version: story.story_version,
    source_literary_version: story.source_literary_version,
    source_package_sha256: sha256(sourceBytes),
    language: story.language,
    part_id: segment.partId,
    segment_id: segment.segmentId,
    choice_id: segment.choiceId,
    spoken_text: segment.text,
    source_text_sha256: sha256(segment.text),
    is_approved: false,
    is_published: false,
  })),
}
if (outputPath) {
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
}
const counts = draft.segments.reduce((acc, item) => {
  acc[item.phase] = (acc[item.phase] ?? 0) + 1
  return acc
}, {})
console.log(JSON.stringify({
  storyId: draft.storyId, language: draft.language,
  sourcePackageSha256: manifest.sourcePackageSha256,
  scenariosChecked: draft.scenariosChecked,
  chunks: draft.segments.length,
  chunkPhases: counts,
  approvalStatus: manifest.approvalStatus,
  outputWritten: Boolean(outputPath),
}, null, 2))
