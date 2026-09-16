from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if text.count(old) != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {text.count(old)} for {old[:80]!r}')
    p.write_text(text.replace(old, new, 1))

# 1) Narrator contract: Episode 2 may not invent a phantom child decision.
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    'Resolve the same central goal and finish calmly without a cliffhanger. Use only the already-established living cast',
    'Resolve the same central goal and finish calmly without a cliffhanger. Episode 2 has no child decision: do not ask {{HERO}} or the child to choose, decide, pick, place, rank or answer a new question; do not make characters wait for {{HERO}} to decide; and do not leave an unresolved either-or, where/which/how choice in the prose. The characters must complete the remaining action inside the narration before the bedtime coda. Use only the already-established living cast',
)

# 2) Repair prompt receives the same boundary, so a detected defect can be fixed in one bounded rewrite.
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    'Use dialogue, reactions, humor and concrete action licensed by the candidate only after that boundary, then lower energy into closure.',
    'Use dialogue, reactions, humor and concrete action licensed by the candidate only after that boundary, then lower energy into closure. Episode 2 has no child decision: remove any new invitation for {{HERO}} or the child to choose, decide, pick, place, rank or answer; remove any characters waiting for that decision; resolve the remaining action inside the prose before the bedtime coda.',
)

# 3) Deterministic validator: narrow tail-only detector for unresolved Episode 2 decisions.
safety_marker = "export const branchingPreviewNeedsRewrite = (language: string, text: string): boolean => {"
safety_insert = r'''export const episodeTwoUnresolvedDecisionNeedsRewrite = (
  context: Pick<NormalizedStoryContext, 'episodeIndex' | 'ageGroup' | 'storyMode' | 'storyMood' | 'language'>,
  text: string,
): boolean => {
  if (!isFiveToSevenBedtimeSeries(context as NormalizedStoryContext) || context.episodeIndex !== 2) return false
  const tail = paragraphs(text).slice(-3).join(' ').replace(/[\u2018\u2019\u02BB`]/g, "'").toLocaleLowerCase()
  const patterns: Record<string, RegExp[]> = {
    ru: [
      /(?:геро[йя]|\{\{hero\}\})[\s\S]{0,160}(?:выбер|выбира|решит|решать|решени)[\s\S]{0,120}(?:ждал|ждали|ждёт|ждут|ожидал|ожидали)/iu,
      /(?:какое|какой|какую|куда|где)[^?]{0,140}(?:лучше|подойд|выбрать|выбер|постав|повес|размест)[^?]{0,80}\?/iu,
    ],
    uz: [
      /(?:qahramon|\{\{hero\}\})[\s\S]{0,160}(?:tanla|qaror)[\p{L}\p{M}-]*[\s\S]{0,120}(?:kut|kutil)[\p{L}\p{M}-]*/iu,
      /(?:qaysi|qayerga|qayerda)[^?]{0,140}(?:yaxshi|ma'qul|mos|tanla|qo'y|os|joy)[\p{L}\p{M}'-]*[^?]{0,80}\?/iu,
    ],
    kz: [
      /(?:кейіпкер|\{\{hero\}\})[\s\S]{0,160}(?:таңда|шеш)[\p{L}\p{M}-]*[\s\S]{0,120}(?:күт|күтіп)[\p{L}\p{M}-]*/iu,
      /(?:қайсы|қайда)[^?]{0,140}(?:жақсы|лайық|таңда|қой|іл|орналастыр)[\p{L}\p{M}-]*[^?]{0,80}\?/iu,
    ],
  }
  return (patterns[context.language] ?? []).some((pattern) => pattern.test(tail))
}

'''
replace_once('supabase/functions/story-generate/safety.ts', safety_marker, safety_insert + safety_marker)
replace_once(
    'supabase/functions/story-generate/safety.ts',
    "  if (context.episodeIndex === 1 && typeof value.story_text === 'string' && choiceMenuScaffoldingNeedsRewrite(context.language, value.story_text)) errors.push('story_choice_menu_scaffolding')\n",
    "  if (context.episodeIndex === 1 && typeof value.story_text === 'string' && choiceMenuScaffoldingNeedsRewrite(context.language, value.story_text)) errors.push('story_choice_menu_scaffolding')\n  if (context.episodeIndex === 2 && typeof value.story_text === 'string' && episodeTwoUnresolvedDecisionNeedsRewrite(context, value.story_text)) errors.push('episode_2_unresolved_decision')\n",
)

# 4) Route this narration-owned defect through bounded full-story rewrite.
replace_once(
    'supabase/functions/story-generate/repair-routing.ts',
    "  'continuation_resets_before_resolution',\n])\n\nexport const textRepairableValidationErrors",
    "  'continuation_resets_before_resolution',\n  'episode_2_unresolved_decision',\n])\n\nexport const textRepairableValidationErrors",
)
replace_once(
    'supabase/functions/story-generate/repair-routing.ts',
    "  'continuation_resets_before_resolution',\n])\n\nconst allRepairable",
    "  'continuation_resets_before_resolution',\n  'episode_2_unresolved_decision',\n])\n\nconst allRepairable",
)

# 5) Regression tests: the exact UZ live failure plus RU/KZ equivalents, while ordinary dialogue questions remain allowed.
replace_once(
    'scripts/check-story-ai-safety.mjs',
    'branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, choiceResolutionDefersToFutureSession,',
    'branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, choiceResolutionDefersToFutureSession, episodeTwoUnresolvedDecisionNeedsRewrite,',
)
anchor = "requireRegression(\n  !choiceMenuScaffoldingNeedsRewrite('ru', 'Ёжка предложил убрать один лист. Алиса посмотрела на друзей и спросила: «Как лучше начать?»'),\n  'ordinary lead-in plus neutral decision cue must remain allowed',\n)\n"
addition = r'''requireRegression(
  episodeTwoUnresolvedDecisionNeedsRewrite(
    { language: 'uz', ageGroup: '5-7', episodeIndex: 2, storyMode: 'series', storyMood: 'bedtime' },
    '{{HERO}} do‘stlariga qaradi. Quvnoq va Chittak {{HERO}} qayerga osishni tanlashini kutishdi. Qaysi joy bayram maydonchasini eng quvnoq ko‘rsatardi?\n\nKech kirgach, o‘rmon asta tinchidi va hamma dam oldi.',
  ),
  'Episode 2 must reject the live Uzbek phantom choice that asks the child to decide without structured choices',
)
requireRegression(
  episodeTwoUnresolvedDecisionNeedsRewrite(
    { language: 'ru', ageGroup: '5-7', episodeIndex: 2, storyMode: 'series', storyMood: 'bedtime' },
    '{{HERO}} посмотрел на друзей. Они ждали, какое место герой выберет для флажков. Какое место лучше подойдёт для праздника?\n\nЛес стих, и друзья устроились отдыхать.',
  ),
  'Episode 2 must reject an unresolved Russian child decision',
)
requireRegression(
  episodeTwoUnresolvedDecisionNeedsRewrite(
    { language: 'kz', ageGroup: '5-7', episodeIndex: 2, storyMode: 'series', storyMood: 'bedtime' },
    '{{HERO}} достарына қарады. Олар кейіпкер қай жерді таңдайтынын күтіп тұрды. Қайсы жер жақсы лайық болады?\n\nОрман тынышталып, достар демалды.',
  ),
  'Episode 2 must reject an unresolved Kazakh child decision',
)
requireRegression(
  !episodeTwoUnresolvedDecisionNeedsRewrite(
    { language: 'uz', ageGroup: '5-7', episodeIndex: 2, storyMode: 'series', storyMood: 'bedtime' },
    'Quvnoq kulib: “Bayroqchalar chiroyli ko‘rinyaptimi?” dedi. {{HERO}} kuldi. Keyin do‘stlar bayroqchalarni eman yoniga o‘zlari osib bo‘lishdi.\n\nKech kirgach, o‘rmon asta tinchidi va hamma dam oldi.',
  ),
  'Episode 2 must still allow ordinary dialogue questions when the action resolves inside the prose',
)
'''
replace_once('scripts/check-story-ai-safety.mjs', anchor, anchor + addition)

# 6) Static contract checks make prompt/validator/repair wiring non-optional.
replace_once(
    'scripts/check-story-ai-split.mjs',
    "  'Episode 2 has no child decision menu',\n",
    "  'Episode 2 has no child decision menu',\n  'Episode 2 has no child decision: do not ask {{HERO}} or the child to choose, decide, pick, place, rank or answer a new question',\n  'episode_2_unresolved_decision',\n",
)

print('v80 patch applied')
