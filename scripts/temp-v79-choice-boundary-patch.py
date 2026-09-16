from pathlib import Path

repo = Path(__file__).resolve().parents[1]
prompt = repo / 'supabase/functions/story-generate/prompt.ts'
arch = repo / 'supabase/functions/story-generate/story-architecture.ts'


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {count}: {old[:100]!r}')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')

# Narrator contract: make pre-choice material truly branch-neutral, including partial/rehearsal actions.
replace_once(
    arch,
    "    'For Episode 1, end story_text at the blueprint decision point before either branch happens. End with one neutral decision cue or question. Never restate, list, paraphrase, preview, or name either choice action inside story_text; the two actions belong only in the structured choices supplied by the blueprint.',",
    "    'For Episode 1, end story_text at the blueprint decision point before either branch happens. End with one neutral decision cue or question. Never restate, list, paraphrase, preview, rehearse, begin performing, partially perform, or show the payoff of either choice action inside story_text; the two actions and every branch-specific consequence belong only after the child chooses. Every pre-choice beat must remain true whichever choice is selected.',",
)
replace_once(
    arch,
    "    'For Episode 2, the exact confirmed_choice_bridge.resolution_text has already been displayed before this prose begins. Start from its result. Do not narrate that action as newly invented, newly discovered, newly decided or performed for the first time again, and do not copy or paraphrase the bridge as an opening beat. Stay in the same bedtime session; do not jump to tomorrow, morning or the next day. Treat any tomorrow_seed in memory as a deferred future-session hook, not as Episode 2 material. Resolve the same central goal and finish calmly without a cliffhanger. Use only the already-established living cast from the immutable blueprint and memory; do not add a new animal, bird, insect, named helper, nickname, unnamed second child or plural helper group, and do not replace one established character with a generic group.',",
    "    'For Episode 2, the exact confirmed_choice_bridge.resolution_text has already been displayed before this prose begins. Start strictly after its visible result. The opening paragraph must contain a genuinely new reaction, consequence, exchange or next action caused by that result. Do not copy, paraphrase, enlarge, slow down, restage, or replay any physical action, object placement, joke, reaction or payoff already shown in the bridge, even from a different camera angle. Stay in the same bedtime session; do not jump to tomorrow, morning or the next day. Treat any tomorrow_seed in memory as a deferred future-session hook, not as Episode 2 material. Resolve the same central goal and finish calmly without a cliffhanger. Use only the already-established living cast from the immutable blueprint and memory; do not add a new animal, bird, insect, named helper, nickname, unnamed second child or plural helper group, and do not replace one established character with a generic group.',",
)

# Architect contract: pre-choice beats cannot execute branch material; E2 begins after bridge, not by expanding it.
replace_once(
    arch,
    "    'For Episode 1, plan 5-7 causal beats ending at one explicit decision point. Do not resolve either branch before the decision.',",
    "    'For Episode 1, plan 5-7 causal beats ending at one explicit decision point. Every beat before that decision must be branch-neutral: do not resolve, rehearse, start carrying out, partially carry out, or show the visible payoff of either branch before the child chooses.',",
)
replace_once(
    arch,
    "    'For Episode 2, the confirmed resolution_text in memory has ALREADY been shown to the child before this segment starts. Continue from the result of that bridge; never present its action as newly invented, newly discovered, newly decided or performed for the first time again. Continue immediately in the same bedtime session and same evening unless the established scene itself uses another same-session time. Never jump to tomorrow, morning or the next day. The latest confirmed choice tomorrow_seed belongs to a future bedtime session and must not become an Episode 2 opening beat. Use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',",
    "    'For Episode 2, the confirmed resolution_text in memory has ALREADY been shown to the child before this segment starts. Continue strictly from the changed state after that bridge. The first planned beat must be new: a reaction, consequence, exchange or next action caused by the bridge result. Never restage, expand, paraphrase or replay an action, object placement, joke, reaction or payoff already visible in resolution_text. Continue immediately in the same bedtime session and same evening unless the established scene itself uses another same-session time. Never jump to tomorrow, morning or the next day. The latest confirmed choice tomorrow_seed belongs to a future bedtime session and must not become an Episode 2 opening beat. Use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',",
)

# Text-repair layer: this was the live v78 failure surface.
replace_once(
    prompt,
    "  const [minimumStoryWords, maximumStoryWords] = hardStoryWordRange(context)\n  const currentStoryWords = storyWordCount(candidate.story_text)",
    "  const [minimumStoryWords, maximumStoryWords] = hardStoryWordRange(context)\n  const latestChoice = context.choiceHistory[context.choiceHistory.length - 1] ?? null\n  const currentStoryWords = storyWordCount(candidate.story_text)",
)
replace_once(
    prompt,
    "    'When rewriting Episode 2, do not invent a new problem, location, character, durable object, clue, relationship or branch consequence. Do not replay the selected choice bridge. Use dialogue, reactions, humor and concrete action already licensed by the candidate to develop the same story, then lower energy into closure.',",
    "    'When rewriting Episode 2, do not invent a new problem, location, character, durable object, clue, relationship or branch consequence. confirmed_choice_bridge.resolution_text has already been shown to the child. The rewritten opening must start AFTER that visible bridge with a genuinely new reaction, consequence, exchange or next action. Do not copy, paraphrase, enlarge, restage, slow down, or replay any bridge action, object placement, joke, reaction or payoff, even if the wording changes. Use dialogue, reactions, humor and concrete action licensed by the candidate only after that boundary, then lower energy into closure.',",
)
replace_once(
    prompt,
    "    'The expansion may deepen only existing action, dialogue, reactions, attempts, gentle humor and cause-and-effect. Do not introduce a new durable object, clue, relationship, location, mechanism state, branch consequence, canon fact, problem or mission.',\n    'Do not resolve either choice inside the expansion or rewrite. The final decision point and existing choices must remain valid.',",
    "    'The expansion may deepen only existing branch-neutral setup, dialogue, reactions, attempts, gentle humor and cause-and-effect. Do not introduce a new durable object, clue, relationship, location, mechanism state, branch consequence, canon fact, problem or mission.',\n    'For an Episode 1 insertion, structured choices are FUTURE material. Treat every choice.text, effect_summary, resolution_text and branch state_patch as forbidden content before the decision. Do not rehearse, begin, partially perform, prepare the distinctive mechanics of, or show the result/payoff of either choice. The inserted passage must remain equally true after either choice is selected.',\n    'Do not resolve either choice inside the expansion or rewrite. The final decision point and existing choices must remain valid.',",
)
replace_once(
    prompt,
    "            rule: 'Return only NEW prose for insertion. Do not repeat either neighboring paragraph and do not restate the choices.',",
    "            rule: 'Return only NEW PRE-CHOICE prose for insertion. It must remain branch-neutral and equally true whichever structured choice is selected. Do not repeat either neighboring paragraph. Do not name, restate, rehearse, begin performing, partially perform, prepare the distinctive mechanics of, or show the payoff/result of either choice.',\n            forbidden_future_branch_material: candidate.choices.map((choice) => ({\n              choice_id: choice.choice_id,\n              choice_text: choice.text,\n              effect_summary: choice.effect_summary,\n              resolution_text: choice.resolution_text,\n              branch_state_patch: choice.state_patch,\n            })),",
)
replace_once(
    prompt,
    "            preserve_story_contract: context.episodeIndex === 2 ? 'same Episode 2 plot, same selected-choice consequence, same established characters and immutable state; no new problem, helper group or durable fact' : 'same Episode 1 plot, same established characters, same decision point and structured choices; no new problem or durable fact',",
    "            preserve_story_contract: context.episodeIndex === 2 ? 'same Episode 2 plot, same selected-choice consequence, same established characters and immutable state; start strictly after confirmed_choice_bridge and do not replay any bridge action or payoff; no new problem, helper group or durable fact' : 'same Episode 1 plot, same established characters, same decision point and structured choices; all prose before the decision remains branch-neutral and does not begin or perform either choice; no new problem or durable fact',",
)
replace_once(
    prompt,
    "    retry_feedback: retryFeedback,\n    immutable_candidate_context: {",
    "    retry_feedback: retryFeedback,\n    confirmed_choice_bridge: context.episodeIndex === 2 && latestChoice ? {\n      choice_text: latestChoice.choice_text,\n      effect_summary: latestChoice.effect_summary,\n      resolution_text: latestChoice.resolution_text,\n      instruction: 'Already displayed before this repair output begins. Start after its visible result and do not copy, paraphrase, expand or restage it.',\n    } : null,\n    immutable_candidate_context: {",
)

print('v79 choice-boundary patch applied')
