from pathlib import Path


def replace_once(path, old, new):
    file = Path(path)
    text = file.read_text()
    assert text.count(old) == 1, f'{path}: expected exactly one replacement anchor, got {text.count(old)}'
    file.write_text(text.replace(old, new))

replace_once(
    'supabase/functions/story-generate/editorial-guidance.ts',
    'Write a complete 350-390-word story_text (hard minimum 320) BEFORE compact metadata; count only words in story_text, never choice labels, bridges or state. Develop 4-6 distinct meaningful pre-choice beats through the SAME problem; do not pad with repetitive dialogue or unrelated action.',
    'Write a complete 380-420-word story_text (hard minimum 320) BEFORE compact metadata; count only words in story_text, never choice labels, bridges or state. Develop 5-7 distinct meaningful pre-choice beats through the SAME problem. Each beat must create one observable change licensed by the immutable blueprint: a character action and reaction, a discovery, or a harmless attempt. Avoid a second round of waiting or reassurance, repetitive dialogue and unrelated actions. Do not sacrifice the story length to complete other fields.',
)
replace_once(
    'scripts/check-story-editorial-guidance.mjs',
    "'350-390-word story_text'",
    "'380-420-word story_text'",
)
repair = Path('supabase/functions/story-generate/prompt.ts')
text = repair.read_text()
anchor = "    'The expansion may deepen only existing branch-neutral setup, dialogue, reactions, attempts, gentle humor and cause-and-effect. Do not introduce a new durable object, clue, relationship, location, mechanism state, branch consequence, canon fact, problem or mission.',\n"
assert text.count(anchor) == 1, 'expected unique repair expansion anchor'
new = anchor + "    'For a pure Episode 1 length insertion, each inserted paragraph must contain an observable change already licensed by the immutable candidate: a small branch-neutral character action followed by a meaningful response, discovery, or harmless surprise. Do not repeat waiting or reassurance, multiple versions of the same encouragement, everyone looking around again, or scenic interludes merely to reach a number. If the immutable story cannot support useful progress, never invent new canon or perform a choice to conceal the problem; the unchanged validator may reject this Repair.',\n    'Every pre-choice insertion must remain equally true after either choice, without beginning, rehearsing, resolving, or delivering the specific payoff of either future branch.',\n"
repair.write_text(text.replace(anchor, new))

print('Applied v98 editorial-only guidance: no validator, model, timeout, provider routing or safety change.')
