from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:140]!r}')
    p.write_text(text.replace(old, new, 1))

arch = 'supabase/functions/story-generate/story-architecture.ts'
replace_once(
    arch,
    "    'Use exactly one central goal, question or gentle problem. Avoid a second unrelated problem.',",
    "    'Use exactly one central goal, question or gentle problem. Avoid a second unrelated problem.',\n"
    "    context.stylePackId === 'cozy_forest'\n"
    "      ? 'For cozy_forest, make living forest characters drive the story. Prefer friendly animals, birds, insects or other clearly living forest residents with a small desire, relationship, funny misunderstanding, discovery or need for help. Streams, stones, leaves, weather and paths may support the scene, but should not become the main protagonist or a maintenance task by themselves. Avoid plots centered on clearing water, repairing a path, moving debris or fixing nature unless that action directly serves a living character goal.'\n"
    "      : 'Make the central story problem emotionally legible to a child through a character desire, relationship, discovery or playful goal rather than an abstract process.',",
)
replace_once(
    arch,
    "    'All natural-language blueprint values, including effect summaries, state values, arc text and preview text, must be in the requested story language. Memory keys are machine identifiers and are the only exception.',",
    "    'All natural-language blueprint values, including effect summaries, state values, arc text and preview text, must be in the requested story language. Memory keys are machine identifiers and are the only exception.',\n"
    "    context.ageGroup === '5-7'\n"
    "      ? 'For ages 5-7, build the plan around concrete everyday words and situations a young child can immediately picture. Avoid literary, abstract, technical, procedural or adult vocabulary when a simpler child-level word exists.'\n"
    "      : 'Match concepts and vocabulary to the requested age.',\n"
    "    context.language === 'uz' && context.ageGroup === '5-7'\n"
    "      ? 'For Uzbek ages 5-7, prefer common natural Uzbek words, short direct phrases and child-familiar speech. Avoid bookish, formal, bureaucratic, scientific or translation-like wording merely to sound poetic.'\n"
    "      : 'Use native age-appropriate phrasing in the requested language.',",
)
replace_once(
    arch,
    "    'Write only in the requested language and for the requested age. Never switch languages inside dialogue, signs, inscriptions, narration, choice resolutions or examples.',",
    "    'Write only in the requested language and for the requested age. Never switch languages inside dialogue, signs, inscriptions, narration, choice resolutions or examples.',\n"
    "    context.ageGroup === '5-7'\n"
    "      ? 'Use concrete child-level vocabulary. Prefer familiar words a 5-7-year-old can understand from context, mostly short sentences, and clear verbs. Do not choose rare literary synonyms, abstract nouns or adult-sounding wording just for beauty.'\n"
    "      : 'Keep vocabulary appropriate for the requested age.',\n"
    "    context.language === 'uz' && context.ageGroup === '5-7'\n"
    "      ? 'Write warm natural Uzbek for a young Uzbek-speaking child in Latin script. Prefer common spoken-and-read vocabulary and simple sentence structure; avoid Russian calques, formal written Uzbek and uncommon poetic words unless the story explains them through obvious action.'\n"
    "      : 'Write naturally in the requested language.',\n"
    "    context.stylePackId === 'cozy_forest'\n"
    "      ? 'Keep the forest socially alive: let 2-3 memorable living forest characters act, speak, react, joke or help. Nature can be beautiful and responsive scenery, but do not make a stream, stone pile, path or weather pattern the main child-facing subject when a living-character story can carry the same value.'\n"
    "      : 'Let characters, action and relationships carry the child-facing story.',",
)

loc = 'supabase/functions/story-generate/localization.ts'
replace_once(
    loc,
    "      'Uzbek dialogue, jokes, forms of address, and small expressions may differ from a Russian version while preserving the same story contract and canon.',",
    "      'Uzbek dialogue, jokes, forms of address, and small expressions may differ from a Russian version while preserving the same story contract and canon.',\n"
    "      'For ages 3-7 especially, prefer common everyday Uzbek words and short direct sentences that a child can follow when heard aloud. Avoid rare bookish synonyms, formal official wording, heavy abstract nouns, and Russian-style sentence structure when a simpler natural Uzbek phrase exists.',\n"
    "      'Do not make Uzbek sound artificially old-fashioned or overly poetic. Warmth should come from characters, dialogue, rhythm and concrete images rather than difficult vocabulary.',",
)

split = 'supabase/functions/story-generate/split-index.ts'
replace_once(
    split,
    "  'choice_resolution_too_short',\n  'choice_resolution_too_long',",
    "  'choice_resolution_too_short',\n  'choice_resolution_too_long',\n  'bedtime_coda_too_short',\n  'bedtime_coda_too_long',",
)

prompt = 'supabase/functions/story-generate/prompt.ts'
replace_once(
    prompt,
    "  const storyTooShort = validationErrors.includes('story_too_short')\n  const storyTooLong = validationErrors.includes('story_too_long')\n  const bedtimeEpisodeOne = context.ageGroup === '5-7' &&",
    "  const storyTooShort = validationErrors.includes('story_too_short')\n  const storyTooLong = validationErrors.includes('story_too_long')\n  const codaTooShort = validationErrors.includes('bedtime_coda_too_short')\n  const codaTooLong = validationErrors.includes('bedtime_coda_too_long')\n  const bedtimeEpisodeTwo = context.ageGroup === '5-7' &&\n    context.storyMode === 'series' &&\n    context.storyMood === 'bedtime' &&\n    context.episodeIndex === 2\n  const rewriteContinuation = bedtimeEpisodeTwo && (storyTooShort || storyTooLong || codaTooShort || codaTooLong)\n  const bedtimeEpisodeOne = context.ageGroup === '5-7' &&",
)
replace_once(
    prompt,
    "  const rewriteTargetMinimum = bedtimeEpisodeOne ? 350 : Math.min(maximumStoryWords - 10, minimumStoryWords + 40)\n  const rewriteTargetMaximum = bedtimeEpisodeOne ? 390 : Math.max(rewriteTargetMinimum, maximumStoryWords - 20)",
    "  const rewriteTargetMinimum = bedtimeEpisodeOne ? 350 : bedtimeEpisodeTwo ? 400 : Math.min(maximumStoryWords - 10, minimumStoryWords + 40)\n  const rewriteTargetMaximum = bedtimeEpisodeOne ? 390 : bedtimeEpisodeTwo ? 470 : Math.max(rewriteTargetMinimum, maximumStoryWords - 20)",
)
replace_once(
    prompt,
    "    'For story_too_short, do NOT rewrite the existing story. Return story_rewrite as null and write only story_expansion: one coherent passage that the server will insert immediately before the existing final choice-setup paragraph. The original story remains verbatim, so the expansion must continue naturally from the preceding paragraph and lead naturally into the existing final paragraph.',",
    "    rewriteContinuation\n"
    "      ? 'For Episode 2 continuation length or bedtime-coda failures, rewrite the full story_text while preserving the same characters, causal events, selected-choice consequence, central goal and immutable state. Return story_expansion as null. Reach the requested total naturally, solve the original problem before the end, and make the final paragraph a real 60-120 word sleepy coda rather than another plot beat.'\n"
    "      : 'For story_too_short, do NOT rewrite the existing story. Return story_rewrite as null and write only story_expansion: one coherent passage that the server will insert immediately before the existing final choice-setup paragraph. The original story remains verbatim, so the expansion must continue naturally from the preceding paragraph and lead naturally into the existing final paragraph.',",
)
replace_once(
    prompt,
    "    'If there is no story length failure, return both story_rewrite and story_expansion as null.',",
    "    'If there is no story length or Episode 2 bedtime-coda failure, return both story_rewrite and story_expansion as null.',\n"
    "    'When rewriting Episode 2, do not invent a new problem, location, character, durable object, clue, relationship or branch consequence. Do not replay the selected choice bridge. Use dialogue, reactions, humor and concrete action already licensed by the candidate to develop the same story, then lower energy into closure.',",
)
replace_once(
    prompt,
    "      story_expansion: storyTooShort\n        ? {",
    "      story_expansion: storyTooShort && !rewriteContinuation\n        ? {",
)
replace_once(
    prompt,
    "      story_rewrite: storyTooLong\n        ? {\n            current_story_text: candidate.story_text,\n            current_words: currentStoryWords,\n            hard_minimum_words: minimumStoryWords,\n            hard_maximum_words: maximumStoryWords,\n            target_words: `${rewriteTargetMinimum}-${rewriteTargetMaximum}`,\n          }\n        : null,",
    "      story_rewrite: rewriteContinuation || storyTooLong\n        ? {\n            current_story_text: candidate.story_text,\n            current_words: currentStoryWords,\n            hard_minimum_words: minimumStoryWords,\n            hard_maximum_words: maximumStoryWords,\n            target_words: `${rewriteTargetMinimum}-${rewriteTargetMaximum}`,\n            preserve_story_contract: rewriteContinuation ? 'same Episode 2 plot, same selected-choice consequence, same characters and immutable state; no new problem or durable fact' : 'preserve all causal beats while shortening',\n            final_bedtime_coda_words: rewriteContinuation ? '60-120 words in the final paragraph after the main problem is solved' : null,\n            validation_errors: validationErrors,\n          }\n        : null,",
)

openai = 'supabase/functions/story-generate/openai.ts'
replace_once(
    openai,
    "  const storyTooShort = validationErrors.includes('story_too_short')\n  const storyTooLong = validationErrors.includes('story_too_long')\n  if (storyTooShort && (typeof repair.story_expansion !== 'string' || !repair.story_expansion.trim() || repair.story_rewrite !== null)) {\n    throw new Error('openai_invalid_text_repair_expansion')\n  }\n  if (storyTooLong && (typeof repair.story_rewrite !== 'string' || !repair.story_rewrite.trim() || repair.story_expansion !== null)) {\n    throw new Error('openai_invalid_text_repair_rewrite')\n  }\n  if (!storyTooShort && !storyTooLong && (repair.story_rewrite !== null || repair.story_expansion !== null)) {\n    throw new Error('openai_unexpected_text_repair_story')\n  }",
    "  const storyTooShort = validationErrors.includes('story_too_short')\n  const storyTooLong = validationErrors.includes('story_too_long')\n  const codaLengthFailure = validationErrors.includes('bedtime_coda_too_short') || validationErrors.includes('bedtime_coda_too_long')\n  const rewriteContinuation = context.episodeIndex === 2 && (storyTooShort || storyTooLong || codaLengthFailure)\n  if (rewriteContinuation && (typeof repair.story_rewrite !== 'string' || !repair.story_rewrite.trim() || repair.story_expansion !== null)) {\n    throw new Error('openai_invalid_continuation_text_repair_rewrite')\n  }\n  if (!rewriteContinuation && storyTooShort && (typeof repair.story_expansion !== 'string' || !repair.story_expansion.trim() || repair.story_rewrite !== null)) {\n    throw new Error('openai_invalid_text_repair_expansion')\n  }\n  if (!rewriteContinuation && storyTooLong && (typeof repair.story_rewrite !== 'string' || !repair.story_rewrite.trim() || repair.story_expansion !== null)) {\n    throw new Error('openai_invalid_text_repair_rewrite')\n  }\n  if (!storyTooShort && !storyTooLong && !codaLengthFailure && (repair.story_rewrite !== null || repair.story_expansion !== null)) {\n    throw new Error('openai_unexpected_text_repair_story')\n  }",
)
replace_once(
    openai,
    "    story_text: storyTooShort\n      ? insertStoryExpansionBeforeFinalParagraph(candidate.story_text, repair.story_expansion as string)\n      : storyTooLong\n        ? (repair.story_rewrite as string)\n        : candidate.story_text,",
    "    story_text: rewriteContinuation\n      ? (repair.story_rewrite as string)\n      : storyTooShort\n        ? insertStoryExpansionBeforeFinalParagraph(candidate.story_text, repair.story_expansion as string)\n        : storyTooLong\n          ? (repair.story_rewrite as string)\n          : candidate.story_text,",
)

# Add static regression contracts without making them brittle to generated prose.
check = 'scripts/check-story-ai-safety.mjs'
p = Path(check)
text = p.read_text()
marker = "  'choice_resolution_too_long',\n  'repairStoryCandidateTextLengths',"
if text.count(marker) != 1:
    raise SystemExit('safety static marker mismatch')
text = text.replace(marker, "  'choice_resolution_too_long',\n  'bedtime_coda_too_short',\n  'bedtime_coda_too_long',\n  'repairStoryCandidateTextLengths',", 1)
marker2 = "  'buildTextLengthRepairPrompts',\n  'textLengthRepairOutputSchema',"
if text.count(marker2) != 1:
    raise SystemExit('repair static marker mismatch')
text = text.replace(marker2, "  'buildTextLengthRepairPrompts',\n  'rewriteContinuation',\n  'final_bedtime_coda_words',\n  'textLengthRepairOutputSchema',", 1)
p.write_text(text)

split_check = 'scripts/check-story-ai-split.mjs'
p = Path(split_check)
text = p.read_text()
marker = "  'Episode 2 has no child decision menu',"
if text.count(marker) != 1:
    raise SystemExit('split static marker mismatch')
text = text.replace(marker, "  'Episode 2 has no child decision menu',\n  'make living forest characters drive the story',\n  'For Uzbek ages 5-7, prefer common natural Uzbek words',", 1)
p.write_text(text)
