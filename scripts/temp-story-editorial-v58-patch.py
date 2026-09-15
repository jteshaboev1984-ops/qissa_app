from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly 1 match, got {count}: {old[:140]!r}")
    p.write_text(text.replace(old, new, 1))


# Reduce repair pressure while preserving the 700-word hard full-session floor:
# 320 Episode 1 + 25 choice bridge + 355 Episode 2 = 700 words.
for path in [
    "supabase/functions/story-generate/prompt.ts",
    "supabase/functions/story-generate/story-architecture.ts",
    "supabase/functions/story-generate/safety.ts",
]:
    replace_once(path, "return context.episodeIndex === 1 ? [360, 500] : [340, 520]", "return context.episodeIndex === 1 ? [320, 470] : [355, 520]")

replace_once("supabase/functions/story-generate/prompt.ts", "return context.episodeIndex === 1 ? '400-440' : '430-490'", "return context.episodeIndex === 1 ? '350-390' : '430-490'")
replace_once("supabase/functions/story-generate/prompt.ts", "? '420-455'", "? '365-405'")
replace_once("supabase/functions/story-generate/prompt.ts", "const rewriteTargetMinimum = bedtimeEpisodeOne ? 400 : Math.min(maximumStoryWords - 10, minimumStoryWords + 40)", "const rewriteTargetMinimum = bedtimeEpisodeOne ? 350 : Math.min(maximumStoryWords - 10, minimumStoryWords + 40)")
replace_once("supabase/functions/story-generate/prompt.ts", "const rewriteTargetMaximum = bedtimeEpisodeOne ? 440 : Math.max(rewriteTargetMinimum, maximumStoryWords - 20)", "const rewriteTargetMaximum = bedtimeEpisodeOne ? 390 : Math.max(rewriteTargetMinimum, maximumStoryWords - 20)")
replace_once(
    "supabase/functions/story-generate/prompt.ts",
    "'orientation: about 50-60 words — establish where the story is, who the hero is, and what the hero is doing in one compact paragraph; use only one or two concrete details and do not force a context-free cold open',\n        'early curiosity / desire / problem: about 50-60 words — introduce the unusual event, desire, question or small problem within roughly the first 60-120 words and make the central story question understandable by roughly the first 100-120 words',\n        'exploration / build-up: about 230-260 words — move through action, dialogue, reactions and discoveries that deepen the same goal; description must serve what is happening and avoid repeating the same inspection or explanation',\n        'choice setup: about 45-60 words — arrive at the decision naturally, end with one neutral decision cue or question, and keep the actual choice actions only in structured choices rather than listing or paraphrasing them in story_text',",
    "'orientation: about 45-55 words — establish where the story is, who the hero is, and what the hero is doing in one compact paragraph; use only one or two concrete details and do not force a context-free cold open',\n        'early curiosity / desire / problem: about 45-55 words — introduce the unusual event, desire, question or small problem within roughly the first 60-110 words and make the central story question understandable early',\n        'exploration / build-up: about 200-230 words — use distinct causal beats in which something changes: an action, reaction, discovery, exchange, small mistake or useful clue. Allow at most one pure inspection/planning beat; never repeat the same caution, observation or discussion merely to add length',\n        'choice setup: about 35-50 words — arrive at the decision naturally, end with one neutral decision cue or question, and keep the actual choice actions only in structured choices rather than listing or paraphrasing them in story_text',",
)

replace_once("supabase/functions/story-generate/story-architecture.ts", "? context.episodeIndex === 1 ? '400-440' : '400-470'", "? context.episodeIndex === 1 ? '350-390' : '430-490'")
replace_once("supabase/functions/story-generate/story-architecture.ts", "? { target_paragraphs: 7, average_words_per_paragraph: '55-65', final_choice_setup_words: '45-60' }", "? { target_paragraphs: '6-7', average_words_per_paragraph: '50-60', final_choice_setup_words: '35-50' }")
replace_once(
    "supabase/functions/story-generate/story-architecture.ts",
    "'Follow the blueprint beat order. Every one or two short paragraphs should contain action, dialogue, discovery, reaction, attempt, humor or cause-and-effect.',",
    "'Follow the blueprint beat order. Every one or two short paragraphs should contain action, dialogue, discovery, reaction, attempt, humor or cause-and-effect. Use distinct causal beats; do not repeat inspection, planning, caution or agreement as separate beats when the situation has not changed.',\n    'Do not turn bedtime prose into a safety checklist or adult supervision lesson. One concrete cautious action is enough when needed; then move the story forward.',",
)
replace_once(
    "supabase/functions/story-generate/story-architecture.ts",
    "'next_episode_preview is child-facing story copy. Never mention confirmation, selection mechanics, an episode, segment, pipeline, or a story branch. Write one natural in-world sentence about what the hero may notice or do after the immediate chosen action.',",
    "'next_episode_preview is child-facing story copy and must be branch-neutral: it has to remain true after either choice. Never mention confirmation, selection mechanics, an episode, segment, pipeline, story branch, or both alternatives joined by or/yoki/немесе. Write one natural in-world sentence about the same story continuing after the immediate chosen action.',",
)

# Additional deterministic guard: explicit choice-menu scaffolding in the tail is still a duplicated menu even when wording is paraphrased.
safety_path = Path("supabase/functions/story-generate/safety.ts")
safety = safety_path.read_text()
marker = "export const technicalPreviewLanguageNeedsRewrite = (language: string, text: string): boolean => {"
if safety.count(marker) != 1:
    raise SystemExit("technicalPreviewLanguageNeedsRewrite marker mismatch")
helpers = r'''export const choiceMenuScaffoldingNeedsRewrite = (language: string, text: string): boolean => {
  const tail = paragraphs(text).slice(-4).join(' ').replace(/[\u2018\u2019\u02BB`]/g, "'").toLocaleLowerCase()
  const patterns: Record<string, RegExp[]> = {
    ru: [/можно[\s\S]{0,260}(?:а\s+можно|или\s+можно)/iu],
    uz: [/mumkin[\s\S]{0,260}(?:yoki[\s\S]{0,100}mumkin|yana[\s\S]{0,100}mumkin)/iu],
    kz: [/болады[\s\S]{0,260}(?:немесе[\s\S]{0,100}болады|тағы[\s\S]{0,100}болады)/iu],
  }
  return (patterns[language] ?? []).some((pattern) => pattern.test(tail))
}

export const branchingPreviewNeedsRewrite = (language: string, text: string): boolean => {
  const normalized = ` ${text.replace(/[\u2018\u2019\u02BB`]/g, "'").toLocaleLowerCase()} `
  if (language === 'ru') return /\sили\s/iu.test(normalized)
  if (language === 'uz') return /\syoki\s/iu.test(normalized)
  if (language === 'kz') return /\sнемесе\s/iu.test(normalized)
  return false
}

'''
safety_path.write_text(safety.replace(marker, helpers + marker, 1))
replace_once(
    "supabase/functions/story-generate/safety.ts",
    "  if (storyRepeatsChoiceMenu(context, value)) errors.push('story_repeats_choice_menu')",
    "  if (storyRepeatsChoiceMenu(context, value)) errors.push('story_repeats_choice_menu')\n  if (context.episodeIndex === 1 && typeof value.story_text === 'string' && choiceMenuScaffoldingNeedsRewrite(context.language, value.story_text)) errors.push('story_choice_menu_scaffolding')",
)
replace_once(
    "supabase/functions/story-generate/safety.ts",
    "  if (typeof value.nextEpisodePreview === 'string' && technicalPreviewLanguageNeedsRewrite(context.language, value.nextEpisodePreview)) errors.push('technical_preview_language')",
    "  if (typeof value.nextEpisodePreview === 'string' && technicalPreviewLanguageNeedsRewrite(context.language, value.nextEpisodePreview)) errors.push('technical_preview_language')\n  if (context.episodeIndex === 1 && typeof value.nextEpisodePreview === 'string' && branchingPreviewNeedsRewrite(context.language, value.nextEpisodePreview)) errors.push('branching_preview_language')",
)

replace_once(
    "supabase/functions/story-generate/split-index.ts",
    "        'For technical_preview_language, rewrite the preview as one natural child-facing in-world sentence. Do not mention confirmation, selection mechanics, episodes, segments, pipelines, or story branches.',",
    "        'For technical_preview_language, rewrite the preview as one natural child-facing in-world sentence. Do not mention confirmation, selection mechanics, episodes, segments, pipelines, or story branches.',\n        'For story_choice_menu_scaffolding, remove explicit alternative scaffolding such as “можно... а можно...” from story_text; end with only a neutral decision cue.',\n        'For branching_preview_language, make the preview branch-neutral and true after either choice. Do not mention both alternatives or join possible outcomes with or/yoki/немесе.',",
)

# Success observability: record initial vs final Story word counts without exposing story content.
replace_once(
    "supabase/functions/story-generate/split-index.ts",
    "  let providerCalls = 0\n  let lastFailureClass = 'unknown'",
    "  let providerCalls = 0\n  let initialStoryWords = 0\n  let lastFailureClass = 'unknown'",
)
replace_once(
    "supabase/functions/story-generate/split-index.ts",
    "    candidate = narrationToCandidate(context, blueprint, narration)\n  } catch (error) {",
    "    candidate = narrationToCandidate(context, blueprint, narration)\n    initialStoryWords = wordCount(candidate.story_text)\n  } catch (error) {",
)
# Add to provider success headers only.
replace_once(
    "supabase/functions/story-generate/split-index.ts",
    "        'X-QISSA-Provider-Calls': String(providerCalls),\n        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n      },\n    )\n  } catch (error) {",
    "        'X-QISSA-Provider-Calls': String(providerCalls),\n        'X-QISSA-Initial-Story-Words': String(initialStoryWords),\n        'X-QISSA-Final-Story-Words': String(wordCount(candidate.story_text)),\n        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n      },\n    )\n  } catch (error) {",
)

# Update executable/static contract checks.
check_path = Path("scripts/check-story-ai-safety.mjs")
check = check_path.read_text()
check = check.replace(
    "import { russianHeroTokenNeedsRewrite, storyRepeatsChoiceMenu, technicalPreviewLanguageNeedsRewrite, visibleSafetyLanguageNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'",
    "import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, russianHeroTokenNeedsRewrite, storyRepeatsChoiceMenu, technicalPreviewLanguageNeedsRewrite, visibleSafetyLanguageNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'",
)
check = check.replace("return context.episodeIndex === 1 ? '400-440' : '430-490'", "return context.episodeIndex === 1 ? '350-390' : '430-490'")
check = check.replace("context.episodeIndex === 1 ? [360, 500] : [340, 520]", "context.episodeIndex === 1 ? [320, 470] : [355, 520]")
check = check.replace("? '420-455'", "? '365-405'")
check = check.replace("'orientation: about 50-60 words'", "'orientation: about 45-55 words'")
check = check.replace("'early curiosity / desire / problem: about 50-60 words'", "'early curiosity / desire / problem: about 45-55 words'")
check = check.replace("'exploration / build-up: about 230-260 words'", "'exploration / build-up: about 200-230 words'")
check = check.replace("'choice setup: about 45-60 words'", "'choice setup: about 35-50 words'")
anchor = "requireRegression(\n  technicalPreviewLanguageNeedsRewrite('ru', 'После подтверждённого выбора ручеёк начнёт снова журчать.'),"
extra = r'''requireRegression(
  choiceMenuScaffoldingNeedsRewrite('ru', 'Ёжка прошептал: «Можно начать с веточек». Потом подумал. «А можно сначала обратиться к Степашке». Алиса посмотрела на ручей.'),
  'explicit alternative scaffolding near the decision point must be rejected',
)
requireRegression(
  !choiceMenuScaffoldingNeedsRewrite('ru', 'Ёжка предложил убрать один лист. Алиса посмотрела на друзей и спросила: «Как лучше начать?»'),
  'ordinary lead-in plus neutral decision cue must remain allowed',
)
requireRegression(
  branchingPreviewNeedsRewrite('ru', 'У чистого просвета или у Степашки найдётся новая подсказка.'),
  'preview must not enumerate alternate branch outcomes',
)
requireRegression(
  !branchingPreviewNeedsRewrite('ru', 'У ручейка вскоре найдётся новая подсказка.'),
  'branch-neutral preview must remain allowed',
)

'''
if check.count(anchor) != 1:
    raise SystemExit("safety check insertion anchor mismatch")
check_path.write_text(check.replace(anchor, extra + anchor, 1))

split_check_path = Path("scripts/check-story-ai-split.mjs")
split_check = split_check_path.read_text()
split_check = split_check.replace("\"context.episodeIndex === 1 ? '400-440' : '400-470'\"", "\"context.episodeIndex === 1 ? '350-390' : '430-490'\"")
split_check = split_check.replace("\"target_paragraphs: 7\"", "\"target_paragraphs: '6-7'\"")
split_check = split_check.replace("  'For technical_preview_language',", "  'For technical_preview_language',\n  'For story_choice_menu_scaffolding',\n  'For branching_preview_language',\n  \"'X-QISSA-Initial-Story-Words'\",\n  \"'X-QISSA-Final-Story-Words'\",")
split_check_path.write_text(split_check)
