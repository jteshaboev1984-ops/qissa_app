/**
 * QISSA: OFFLINE-ONLY Azure Uzbek audio pre-generation plan.
 *
 * Deliberately no Azure client, HTTP, Supabase client, credential, DB write or
 * secret access. A reviewed, owner-approved generation worker is a later gate.
 * The result is a catalogue of unique content-addressed MP3 candidates, NOT
 * an authorization to publish or spend.
 */
import { createHash } from 'node:crypto'

export const AZURE_UZ_DRAFT_MODEL = 'azure-neural-v1'
export const AZURE_UZ_DRAFT_VOICES = Object.freeze({
  soft_female: 'uz-UZ-MadinaNeural',
  calm_male: 'uz-UZ-SardorNeural',
})

const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex')
const safeId = (v) => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v)
const segmentId = (v) => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9:_-]{0,511}$/.test(v)
const positiveInt = (v) => Number.isSafeInteger(v) && v > 0

/**
 * sources: compiler output from actual localized, 30-series authored packages.
 * config caps are mandatory and are not Azure billing controls. No provider I/O.
 *
 * A repeated text+voice tuple appears in exactly one candidate MP3. Multiple
 * route IDs reference that one candidate without making it a shared plot beat.
 */
export const planOfflineAzureUzBatch = (sources, config) => {
  if (!Array.isArray(sources) || sources.length === 0) throw new Error('No audio sources supplied.')
  if (!config || config.mode !== 'review_only' ||
      !positiveInt(config.maxCharacterUnits) ||
      !positiveInt(config.maxUniqueAssets) ||
      !Array.isArray(config.voicePresets) || config.voicePresets.length === 0 ||
      config.voicePresets.length > 2 ||
      new Set(config.voicePresets).size !== config.voicePresets.length) {
    throw new Error('Explicit review-only mode, voice list, character and asset caps are mandatory.')
  }
  const voices = config.voicePresets.map((preset) => {
    const providerVoiceId = AZURE_UZ_DRAFT_VOICES[preset]
    if (!providerVoiceId) throw new Error('Only the two pre-approved-for-candidacy Uzbek identifiers may be planned.')
    return { clientPresetId: preset, providerVoiceId }
  })
  const allSourceIdentities = new Set()
  const segmentsSeen = new Map()
  const jobs = new Map()
  let sourceSegmentCount = 0

  for (const source of sources) {
    if (!source || source.language !== 'uz' ||
      !safeId(source.storyId) || !safeId(source.storyVersion) ||
      !safeId(source.sourceLiteraryVersion) ||
      source.isApproved !== false || source.isPublished !== false ||
      !Array.isArray(source.segments) || source.segments.length === 0) {
      throw new Error('Only complete, unpublished, unapproved Uzbek source plans are accepted.')
    }
    const identity = [source.storyId, source.storyVersion, source.language].join(':')
    if (allSourceIdentities.has(identity)) throw new Error('Duplicate source package in offline batch.')
    allSourceIdentities.add(identity)
    for (const segment of source.segments) {
      if (!segment || !safeId(segment.partId) || !segmentId(segment.segmentId) ||
          !['before_choice','choice_resolution','after_choice'].includes(segment.phase) ||
          (segment.choiceId !== null && !safeId(segment.choiceId)) ||
          (segment.phase === 'choice_resolution') !== (segment.choiceId !== null) ||
          typeof segment.text !== 'string' || segment.text.trim() !== segment.text ||
          segment.text.length === 0 || segment.text.length > 2500) {
        throw new Error('Invalid narration segment; refusing offline queue plan.')
      }
      const stableId = identity + ':' + segment.segmentId
      const hash = sha256(segment.text)
      const previous = segmentsSeen.get(stableId)
      if (previous) {
        if (previous !== hash) throw new Error('Source segment identity maps to multiple texts.')
        throw new Error('Duplicate segment ID in the same source package.')
      }
      segmentsSeen.set(stableId, hash)
      sourceSegmentCount += 1
      for (const voice of voices) {
        const key = ['uz', hash, voice.clientPresetId, voice.providerVoiceId, AZURE_UZ_DRAFT_MODEL].join(':')
        const reference = {
          storyId: source.storyId,
          storyVersion: source.storyVersion,
          sourceLiteraryVersion: source.sourceLiteraryVersion,
          partId: segment.partId,
          segmentId: segment.segmentId,
          choiceId: segment.choiceId,
        }
        const existing = jobs.get(key)
        if (existing) {
          if (existing._text !== segment.text) throw new Error('Text digest collision detected.')
          existing.references.push(reference)
        } else {
          jobs.set(key, {
            cacheIdentity: key,
            language: 'uz',
            sourceTextSha256: hash,
            clientPresetId: voice.clientPresetId,
            providerVoiceId: voice.providerVoiceId,
            providerModel: AZURE_UZ_DRAFT_MODEL,
            characterUnits: segment.text.length,
            references: [reference],
            _text: segment.text,
          })
        }
      }
    }
  }
  const ordered = [...jobs.values()].sort((a,b) => a.cacheIdentity.localeCompare(b.cacheIdentity, 'en'))
  const totalCharacterUnits = ordered.reduce((sum, job) => sum + job.characterUnits, 0)
  if (ordered.length > config.maxUniqueAssets) {
    throw new Error('OFFLINE CAP STOP: unique MP3 candidates exceed the operator-supplied asset cap.')
  }
  if (totalCharacterUnits > config.maxCharacterUnits) {
    throw new Error('OFFLINE CAP STOP: text character units exceed the operator-supplied cap.')
  }
  const publicJobs = ordered.map(({_text, ...job}) => job)
  const fingerprint = sha256(JSON.stringify(publicJobs))
  return {
    schemaVersion: 'qissa-azure-uz-batch-review-v1',
    mode: 'review_only',
    approved: false,
    published: false,
    canExecute: false,
    providerCallsMade: 0,
    sourcePackages: sources.length,
    sourceSegmentCount,
    selectedVoices: voices,
    uniqueMp3Candidates: publicJobs.length,
    characterUnits: totalCharacterUnits,
    limitCharacterUnits: config.maxCharacterUnits,
    limitUniqueAssets: config.maxUniqueAssets,
    // This fingerprint is only the prepared job catalogue, NOT literary approval.
    planSha256: fingerprint,
    // Only metadata and digests are exported: source text stays in original
    // authored packages and an operator-reviewed server-side registry.
    jobs: publicJobs,
  }
}
