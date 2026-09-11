# Child-first closed-beta editorial rules

These are Story Agent generation invariants for both deterministic fallback content and future provider-generated stories. The current RU/UZ 5–7 bedtime closed beta applies them as a strict release contract.

## Story experience

- Tell a story rather than narrating safety policy or pacing intent.
- Use one child-scale desire or problem, concrete action, 2–3 memorable supporting characters, and a warm closed ending.
- Let calmness come from scene, rhythm and the ending. Do not repeatedly tell the child that everything is calm, safe, slow or unhurried.
- Prefer simple dialogue, sensory detail, gentle humor, a small surprise and visible character reactions over explanation.
- Keep vocabulary immediately understandable to a 5–7-year-old. A world may be magical or imaginative without becoming technical.

## Choice and consequence

- Episode 1 leads naturally to exactly two understandable choices.
- Both choices are acceptable; neither is framed as the right or wrong answer.
- The branches must create visibly different consequences, not merely different methods with the same narrated result.
- `resolution_text` is a short bridge shown immediately after confirmation. Episode 2 continues from the changed situation and must not replay the selected action from the beginning.
- The full Episode 1 + selected bridge + Episode 2 remains one bedtime story with a closed coda.

## Personalization and language

- The hero token may resolve to a girl, boy, animal, magical hero or custom name. Russian prose must use `{{HERO}}` only in direct address or another grammatically invariant position. Do not place the raw token where Russian case declension or gender agreement is required; rephrase with second-person wording instead. This applies to deterministic and future provider output.
- Once Russian narration addresses the child in second person, keep the child consistently in second person through the scene. Do not accidentally switch the child into a third-person group pronoun or leave malformed forms such as a nominative `ты` after a preposition.
- Uzbek copy should be written as natural Uzbek storytelling, not line-by-line Russian translation.
- Character names, jokes and concrete details may differ between RU and UZ when that improves naturalness while preserving the same product contract.

## Future provider generation

- The deterministic fallback is a safe demo/recovery baseline, not the final engagement ceiling. Future generated stories must also satisfy `06_GENERATED_STORY_ENGAGEMENT_CONTRACT.md`.
- For ages 5–7, hook quickly, minimize static description, keep scenes moving through action/dialogue, and maintain one child-scale anticipation loop until payoff. Bedtime calmness should increase mainly after the story has delivered that payoff.
- Provider generation must receive these child-first rules in the runtime prompt; they are not fallback-only editorial notes.
- For the 5–7 bedtime series, `resolution_text` targets about 30–45 words and must stay below 320 characters so the UI bridge is complete and cannot be silently truncated.
- Episode 2 begins after the bridge's visible change and must not replay the chosen action from the beginning.
- Provider output that fails structural or safety validation still falls back to approved deterministic content.
- Runtime enforcement lives in `story-generate/prompt.ts`, `story-generate/safety.ts`, and the Story AI CI contract, so future provider work must preserve these rules rather than relying on editorial memory.

## Safety and release gates

- Safety remains enforced by the generation/safety layer and must not leak into child-facing meta narration.
- Keep Story AI and provider TTS disabled during closed-beta hardening unless separately approved.
- Preserve beta scope, privacy, memory continuity, provider-free fallback and the 5–10 minute hard session gate.
- Automated word-count and pacing checks are guardrails. Final editorial acceptance still requires reading the complete rendered branches and a natural aloud physical-device check.
