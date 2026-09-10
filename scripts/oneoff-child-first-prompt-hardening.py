from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"expected text missing in {path}: {old[:120]}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


prompt = "supabase/functions/story-generate/prompt.ts"
replace_once(prompt, "target_story_words: '360-430',", "target_story_words: '430-470',")
replace_once(
    prompt,
    "choice_resolution_words: '80-130 for each of the two choices; show the selected action causing a visible change before episode 2',",
    "choice_resolution_words: '30-45 words; keep under 320 characters; begin the selected action, show one visible change, then stop so Episode 2 continues without replaying the action',",
)
replace_once(prompt, "target_story_words: '390-500',", "target_story_words: '430-500',")
replace_once(
    prompt,
    "part_role: 'Start immediately from the selected action or its visible consequence. Keep the same core situation and causal thread.',",
    "part_role: 'Start from the changed situation created by resolution_text. Do not replay the selected action from the beginning. Keep the same core situation and causal thread.',",
)
replace_once(
    prompt,
    "'choice consequence / working solution: about 260-340 words — begin from the visible consequence already started in resolution_text; the chosen method must materially change the route to the original goal',",
    "'choice consequence / working solution: about 280-350 words — continue after the one visible change already shown in resolution_text; never repeat that bridge; the chosen method must materially change the route to the original goal',",
)

p = Path(prompt)
text = p.read_text(encoding="utf-8")
marker = "const languageNames: Record<NormalizedStoryContext['language'], string> = {"
editorial = """const childFirstEditorialGuidance = (context: NormalizedStoryContext): JsonRecord => ({
  story_first: 'Tell an engaging child story. Safety rules stay invisible in the prose: never narrate that there is no danger, enough time, or that both choices are safe, calm or good.',
  calmness: 'Create calmness through scene, rhythm, sensory detail and a warm ending. Do not pad the story by repeatedly saying calm, quiet, slow, gentle, safe or unhurried.',
  character_life: context.ageGroup === '5-7'
    ? 'Use one child-scale desire or problem, concrete action, 2-3 memorable supporting characters, natural dialogue, visible reactions, gentle humor or wonder, and one small surprise when it serves the same plot.'
    : 'Prefer concrete action, dialogue, character reactions and age-appropriate wonder over explanation.',
  agency: 'Let values emerge from what characters do. Do not turn the hero into an adult supervisor who checks readiness, schedules, procedures or explains the moral.',
  age_fit: context.ageGroup === '5-7'
    ? 'Use immediately understandable, concrete vocabulary. Avoid technical, operational or bureaucratic jargon; simplify imaginative worlds into things a 5-7-year-old can picture.'
    : 'Match vocabulary and concepts to the requested age guidance.',
  choice_quality: 'Choices must be child-visible actions with genuinely different consequences. Do not offer two technical mechanisms that immediately converge to the same narrated result.',
  bridge_role: context.storyMode === 'series' && context.episodeIndex === 1
    ? 'resolution_text is shown as a separate child-facing bridge. Keep it short: about 30-45 words and under 320 characters. Start the chosen action, show one visible change, then stop. Episode 2 must continue after that change and must not replay the action.'
    : 'When continuing a saved choice, begin after the visible change already shown to the child; never retell the bridge.',
  language_quality: context.language === 'uz'
    ? 'Write natural Uzbek storytelling in Latin script. Do not translate Russian sentence by sentence; natural phrasing, jokes and concrete details may differ while preserving the same story contract.'
    : context.language === 'ru'
      ? 'Write idiomatic Russian. Because {{HERO}} may become a girl, boy, animal, magical hero or custom name, avoid nearby grammar that assumes the hero is masculine or feminine whenever possible.'
      : 'Write natively in the requested language rather than as a calque from another language.',
})

"""
if "const childFirstEditorialGuidance" not in text:
    if marker not in text:
        raise SystemExit("prompt insertion marker missing")
    text = text.replace(marker, editorial + marker, 1)

system_anchor = "    'Never mention AI, prompts, policies, JSON, safety checks, or system behavior inside the story.',\n"
system_lines = [
    "    'Tell the story itself; keep safety policy invisible to the child. Never explain that there is no danger, enough time, or that both choices are safe, calm or good.',\n",
    "    'Create bedtime calmness through scene, rhythm, sensory detail and a warm ending, not by repeatedly saying calm, quiet, slow, gentle, safe or unhurried.',\n",
    "    'Prefer concrete action, natural dialogue, visible character reactions, gentle humor, wonder and small plot-serving surprises over explanations or moral summaries.',\n",
    "    'Do not make the hero behave like an adult supervisor checking readiness, schedules, procedures or rules; let positive values emerge from actions.',\n",
    "    'For ages 5-7, avoid technical, operational and bureaucratic jargon even in fantasy or space settings; use things a child can picture.',\n",
    "    'resolution_text is a short bridge shown separately in the UI. Episode 2 must continue after its visible change and must not replay the selected action.',\n",
    "    'For Russian, keep grammar around {{HERO}} gender-neutral where possible because the token can resolve to any hero type or custom name.',\n",
    "    'For Uzbek, write native-sounding Uzbek rather than a sentence-by-sentence translation from Russian.',\n",
]
system_add = "".join(system_lines)
if system_add not in text:
    if system_anchor not in text:
        raise SystemExit("system prompt anchor missing")
    text = text.replace(system_anchor, system_anchor + system_add, 1)

payload_anchor = "    narrative_guidance: bedtimeNarrativeGuidance(context),\n"
if "child_first_editorial: childFirstEditorialGuidance(context)" not in text:
    if payload_anchor not in text:
        raise SystemExit("payload anchor missing")
    text = text.replace(
        payload_anchor,
        payload_anchor + "    child_first_editorial: childFirstEditorialGuidance(context),\n",
        1,
    )
p.write_text(text, encoding="utf-8")

safety = "supabase/functions/story-generate/safety.ts"
replace_once(
    safety,
    "        if (resolutionWords < 20) errors.push('choice_resolution_too_short')\n        if (resolutionWords > 80) errors.push('choice_resolution_too_long')",
    "        if (choice.resolution_text.length > 360) errors.push('choice_resolution_too_long')\n        if (resolutionWords < 25) errors.push('choice_resolution_too_short')\n        if (resolutionWords > 60) errors.push('choice_resolution_too_long')",
)

check = "scripts/check-story-ai-safety.mjs"
replace_once(check, '"target_story_words: \'360-430\'",', '"target_story_words: \'430-470\'",')
replace_once(check, '"target_story_words: \'390-500\'",', '"target_story_words: \'430-500\'",')
replace_once(
    check,
    '"choice_resolution_words: \'80-130 for each of the two choices; show the selected action causing a visible change before episode 2\'",',
    '"choice_resolution_words: \'30-45 words; keep under 320 characters; begin the selected action, show one visible change, then stop so Episode 2 continues without replaying the action\'",',
)
replace_once(
    check,
    "  'Prefer the 6-8 minute editorial target',\n])",
    "  'Prefer the 6-8 minute editorial target',\n  'Tell the story itself; keep safety policy invisible to the child.',\n  'Create bedtime calmness through scene, rhythm, sensory detail and a warm ending',\n  'gentle humor, wonder and small plot-serving surprises',\n  'Do not make the hero behave like an adult supervisor',\n  'avoid technical, operational and bureaucratic jargon',\n  'Episode 2 must continue after its visible change and must not replay the selected action.',\n  'keep grammar around {{HERO}} gender-neutral where possible',\n  'write native-sounding Uzbek rather than a sentence-by-sentence translation from Russian.',\n  'child_first_editorial: childFirstEditorialGuidance(context)',\n])",
)
replace_once(
    check,
    "  \"errors.push('choice_resolution_too_short')\",\n  \"errors.push('choice_resolution_too_long')\",",
    "  'choice.resolution_text.length > 360',\n  'resolutionWords < 25',\n  'resolutionWords > 60',\n  \"errors.push('choice_resolution_too_short')\",\n  \"errors.push('choice_resolution_too_long')\",",
)

spec = Path("docs/qissa/ai/01_STORY_AGENT_SPEC.md")
text = spec.read_text(encoding="utf-8")
section = """
## Child-first editorial invariants
These rules apply to deterministic fallback content and to future provider-generated Story Agent output. The current RU/UZ 5–7 bedtime beta is the strictest release slice, but provider enablement must not weaken them.

- Story prose tells the story; safety policy, pacing intent and system reassurance stay invisible to the child.
- Calmness comes from scene, rhythm, sensory detail and the ending rather than repeated claims that everything is calm, safe, slow or unhurried.
- Prefer child-scale goals, concrete action, memorable supporting characters, natural dialogue, visible reactions, gentle humor/wonder and small plot-serving surprises.
- Positive values emerge from actions rather than lectures or moral summaries.
- Age 5–7 language must be immediately understandable and avoid technical, operational or bureaucratic jargon.
- Choices are child-visible actions and create visibly different consequences.
- `resolution_text` is a short bridge shown separately by the UI; Episode 2 continues after its visible change and never replays the selected action.
- Russian prose around `{{HERO}}` should avoid assuming hero gender; Uzbek must read as native Uzbek rather than a line-by-line Russian translation.

`05_CHILD_FIRST_CLOSED_BETA_EDITORIAL.md` is the canonical editorial checklist used for these invariants.
"""
if "## Child-first editorial invariants" not in text:
    anchor = "\n## Style pack rules\n"
    if anchor not in text:
        raise SystemExit("spec anchor missing")
    text = text.replace(anchor, section + anchor, 1)
spec.write_text(text, encoding="utf-8")

templates = Path("docs/qissa/ai/02_STORY_PROMPT_TEMPLATES.md")
text = templates.read_text(encoding="utf-8")
add = """Follow the child-first editorial contract for every generated story:
- keep safety policy invisible in child-facing prose;
- create calmness through scene, rhythm and ending rather than repeated reassurance words;
- prefer concrete action, dialogue, reactions, gentle humor and wonder over explanation;
- for ages 5–7 avoid technical/operational jargon and adult-supervisor behavior;
- make choices child-visible actions with visibly different consequences;
- keep resolution_text a short bridge (about 30–45 words, under 320 characters), then continue Episode 2 after that change without replaying it;
- keep Russian hero-token grammar gender-neutral where possible;
- write Uzbek as native storytelling rather than a sentence-by-sentence Russian translation.
"""
needle = "For bedtime mode, do not end with unresolved fear, countdown, sudden danger, or a cliffhanger.\n"
if add not in text:
    if needle not in text:
        raise SystemExit("template prompt anchor missing")
    text = text.replace(needle, needle + add, 1)
behavior = """
## 9) Child-first generation contract
The runtime provider prompt and deterministic fallback share the same editorial bar. For the 5–7 bedtime series, target Episode 1 at roughly 430–470 words, keep the separate choice bridge at roughly 30–45 words and below 320 characters, and target Episode 2 at roughly 430–500 words. These are editorial targets inside the wider safety/runtime envelope. Safety constraints stay enforced internally and must not appear as reassurance or policy language in the story.
"""
if "## 9) Child-first generation contract" not in text:
    text = text.rstrip() + behavior + "\n"
templates.write_text(text, encoding="utf-8")

editorial_doc = Path("docs/qissa/ai/05_CHILD_FIRST_CLOSED_BETA_EDITORIAL.md")
text = editorial_doc.read_text(encoding="utf-8")
text = text.replace(
    "These rules apply to the deterministic RU/UZ bedtime stories used for the 5–7 closed beta.",
    "These are Story Agent generation invariants for both deterministic fallback content and future provider-generated stories. The current RU/UZ 5–7 bedtime closed beta applies them as a strict release contract.",
)
text = text.replace(
    "Russian deterministic prose around `{{HERO}}` must therefore avoid grammatical constructions that assume the hero's gender.",
    "Russian prose around `{{HERO}}` must therefore avoid grammatical constructions that assume the hero's gender, including future provider output.",
)
if "## Future provider generation" not in text:
    text = text.replace(
        "\n## Safety and release gates\n",
        """
## Future provider generation

- Provider generation must receive these child-first rules in the runtime prompt; they are not fallback-only editorial notes.
- For the 5–7 bedtime series, `resolution_text` targets about 30–45 words and must stay below 320 characters so the UI bridge is complete and cannot be silently truncated.
- Episode 2 begins after the bridge's visible change and must not replay the chosen action from the beginning.
- Provider output that fails structural or safety validation still falls back to approved deterministic content.

## Safety and release gates
""",
        1,
    )
editorial_doc.write_text(text, encoding="utf-8")

print("child-first future-generation hardening applied")
