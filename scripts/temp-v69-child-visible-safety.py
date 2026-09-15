from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:180]!r}')
    p.write_text(text.replace(old, new, 1))

# Semantic Safety Agent and narrow fear adjudication must see only material a child can actually read/hear.
openai = 'supabase/functions/story-generate/openai.ts'
replace_once(
    openai,
    "import { fearAdjudicationConsistencyErrors, fearAdjudicationOutputSchema, type FearAdjudication } from './fear-adjudication.ts'\n",
    "import { fearAdjudicationConsistencyErrors, fearAdjudicationOutputSchema, type FearAdjudication } from './fear-adjudication.ts'\nimport { childVisibleStorySafetyProjection, childVisibleStorySafetyText } from './story-safety-projection.ts'\n",
)
replace_once(
    openai,
    """const childVisibleFearText = (candidate: StoryCandidate): string => [
  candidate.title,
  candidate.story_text,
  candidate.nextEpisodePreview,
  ...candidate.choices.flatMap((choice) => [
    choice.text,
    choice.effect_summary,
    choice.resolution_text,
    choice.tomorrow_seed,
  ]),
].filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join('\\n')

""",
    "",
)
replace_once(
    openai,
    "  const candidateJson = JSON.stringify(candidate)\n",
    "  const candidateJson = JSON.stringify(childVisibleStorySafetyProjection(candidate))\n",
)
replace_once(
    openai,
    "  const adjudicationErrors = fearAdjudicationConsistencyErrors(adjudication, childVisibleFearText(candidate))\n  if (adjudicationErrors.length > 0) throw new Error('openai_fear_adjudication_inconsistent')\n  if (adjudication.excessive_fear) return first\n",
    """  const adjudicationErrors = fearAdjudicationConsistencyErrors(adjudication, childVisibleStorySafetyText(candidate))
  if (adjudicationErrors.length > 0) throw new Error('openai_fear_adjudication_inconsistent')
  if (adjudication.excessive_fear) {
    return {
      ...first,
      notes: [`fear_adjudication:${adjudication.category}`],
    }
  }
""",
)

# Moderation should use the same child-visible surface, and semantic failures may expose only a sanitized category tag.
split = 'supabase/functions/story-generate/split-index.ts'
replace_once(
    split,
    "import { enforceStoryBlueprintContextContract, narrationToCandidate, normalizeStoryBlueprintMemoryKeys, validateStoryBlueprint, type StoryBlueprint } from './story-architecture.ts'\n",
    "import { enforceStoryBlueprintContextContract, narrationToCandidate, normalizeStoryBlueprintMemoryKeys, validateStoryBlueprint, type StoryBlueprint } from './story-architecture.ts'\nimport { childVisibleStorySafetyText } from './story-safety-projection.ts'\n",
)
replace_once(
    split,
    """const candidateTextForModeration = (candidate: StoryCandidate) => [
  candidate.title,
  candidate.story_text,
  ...candidate.choices.flatMap((choice) => [
    choice.text,
    choice.effect_summary,
    choice.resolution_text,
    choice.tomorrow_seed,
  ]),
].join('\\n')
""",
    "const candidateTextForModeration = (candidate: StoryCandidate) => childVisibleStorySafetyText(candidate)\n",
)
replace_once(
    split,
    """    if (!safety.approved) {
      lastFailureClass = 'semantic-safety'
      const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
      trace.push(`semantic-safety:${flags.join(',') || safety.required_action}`)
""",
    """    if (!safety.approved) {
      lastFailureClass = 'semantic-safety'
      const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
      const fearDetail = safety.notes.find((note) => /^fear_adjudication:[a-z_]+$/u.test(note)) ?? ''
      trace.push(`semantic-safety:${flags.join(',') || safety.required_action}${fearDetail ? `:${fearDetail}` : ''}`)
""",
)

# Add projection and sanitized diagnostic regression coverage.
test = Path('scripts/check-story-safety-verdict.mjs')
t = test.read_text()
old_import = "import { fearAdjudicationConsistencyErrors } from '../supabase/functions/story-generate/fear-adjudication.ts'\n"
new_import = old_import + "import { childVisibleStorySafetyProjection, childVisibleStorySafetyText } from '../supabase/functions/story-generate/story-safety-projection.ts'\n"
if t.count(old_import) != 1:
    raise SystemExit('safety verdict projection import anchor mismatch')
t = t.replace(old_import, new_import, 1)
anchor = "const mildFear = { excessive_fear: false, category: 'none_or_mild', evidence: '' }\n"
projection_test = r'''const projectionCandidate = {
  title: 'Do‘stlarning sovg‘asi',
  story_text: '{{HERO}} do‘stlari bilan barglardan rasm tayyorladi.',
  choices: [{
    choice_id: 'choice-a',
    text: 'Rasmni tugatish',
    effect_summary: 'Do‘stlar rasmni birga tugatdi.',
    resolution_text: 'Ular rasmni kulib tugatib, bir-biriga ko‘rsatdi.',
    tomorrow_seed: 'HIDDEN_SCARY_TOMORROW_SEED',
    choice_icon: '🎁',
    state_patch: {
      last_event: 'HIDDEN_SCARY_STATE', new_friend: null, hero_trait: null, open_arc: null,
      relationship_updates: [{ key: 'friend', value: 'HIDDEN_SCARY_RELATIONSHIP' }],
      canon_updates: [{ key: 'secret', value: 'HIDDEN_SCARY_CANON' }],
    },
    value_alignment: ['kindness'],
  }],
  state_patch: {
    last_event: 'HIDDEN_TOP_STATE', new_friend: null, hero_trait: null, open_arc: null,
    relationship_updates: [], canon_updates: [],
  },
  vocabulary: [{ word: 'barg', translation: 'leaf', example: 'Barg yerga tushdi.' }],
  nextEpisodePreview: 'Sovg‘ani ko‘rsatish vaqti yaqin edi.',
}
const safetyProjectionJson = JSON.stringify(childVisibleStorySafetyProjection(projectionCandidate))
for (const visible of ['Do‘stlarning sovg‘asi', 'Rasmni tugatish', 'Do‘stlar rasmni birga tugatdi.', 'barg', 'Sovg‘ani ko‘rsatish vaqti yaqin edi.']) {
  assert(safetyProjectionJson.includes(visible), `child-visible safety projection must preserve visible material: ${visible}`)
}
for (const hidden of ['HIDDEN_SCARY_TOMORROW_SEED', 'HIDDEN_SCARY_STATE', 'HIDDEN_SCARY_RELATIONSHIP', 'HIDDEN_SCARY_CANON', 'HIDDEN_TOP_STATE', 'state_patch', 'tomorrow_seed', 'value_alignment', 'choice_icon']) {
  assert(!safetyProjectionJson.includes(hidden), `child-visible safety projection must exclude hidden machine metadata: ${hidden}`)
}
const safetyProjectionText = childVisibleStorySafetyText(projectionCandidate)
assert(safetyProjectionText.includes('Barg yerga tushdi.'), 'child-visible safety text must include visible vocabulary examples')
assert(!safetyProjectionText.includes('HIDDEN_SCARY_TOMORROW_SEED') && !safetyProjectionText.includes('HIDDEN_SCARY_CANON'), 'child-visible safety text must exclude hidden future-session and canon metadata')

'''
if t.count(anchor) != 1:
    raise SystemExit('safety verdict projection test anchor mismatch')
t = t.replace(anchor, projection_test + anchor, 1)
for fragment in [
    "childVisibleStorySafetyProjection(candidate)",
    "childVisibleStorySafetyText(candidate)",
    "fear_adjudication:${adjudication.category}",
]:
    if fragment not in t:
        # Make source-contract assertions explicit near the existing fragment loop.
        loop_anchor = "  'isolated excessive_fear was not confirmed by narrow fear adjudication',\n"
        if t.count(loop_anchor) != 1:
            raise SystemExit('safety verdict source fragment anchor mismatch')
        t = t.replace(loop_anchor, loop_anchor + f"  '{fragment}',\n", 1)
test.write_text(t)

split_test = Path('scripts/check-story-ai-split.mjs')
s = split_test.read_text()
anchor = "  'evaluateStorySafety',\n  'moderateStoryText',\n"
replacement = "  'evaluateStorySafety',\n  'moderateStoryText',\n  'childVisibleStorySafetyText(candidate)',\n  'fear_adjudication:[a-z_]+',\n"
if s.count(anchor) != 1:
    raise SystemExit('split test child-visible safety anchor mismatch')
split_test.write_text(s.replace(anchor, replacement, 1))
