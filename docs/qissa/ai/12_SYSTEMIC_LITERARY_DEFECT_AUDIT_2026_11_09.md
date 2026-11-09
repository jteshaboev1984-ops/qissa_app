# QISSA — Systemic literary audit (2026-11-09)

Status: diagnostic, NOT a re-approval of literary masters. All original texts remain unchanged.

## Scope and limits

Audited eight runtime-authored story pairs (16 RU/UZ JSON packages) including 19 distinct decisions per language. Inspected both choice resolutions and the current authored metadata. Also checked the earlier owner-approved September 23 V2/V3 audit, the Story Agent runtime guidance and literary review policy. Six Season 2 stories are staging-only.

Automated structural analysis cannot establish oral quality, native Uzbek, complete plot semantics or reader response. Literary findings below are evidence classifications, not fabricated review results.

## Paragraph rhythm (descriptive, never a quota)

Metric: proportion of non-empty prose paragraphs with 1–4 whitespace-delimited words, including both possible resolutions and conditional segments.

| Story | RU | UZ | Decisions |
|---|---:|---:|---:|
| Праздник мужества | 44% | 43% | 4 |
| Тайна восточного каравана | 44% | 45% | 4 |
| Королевское серебро | 37% | 37% | 3 |
| Две башни | 38% | 40% | 3 |
| Человек, которого ждут | 35% | 36% | 2 |
| Ложная дорога | 40% | 42% | 1 |
| Две подмоги | 26% | 25% | 1 |
| Обратно в Ордан | 25% | 34% | 1 |

The repeated short-paragraph pattern is a SYSTEMIC STYLE SIGNAL, not yet a proven literary defect. Late-season RU texts show lower percentages. No mandatory sentence length, repetition cap or short-paragraph percentage should be introduced.

## Findings ranked by evidence

| Observation | Status | Rationale / follow-up |
|---|---|---|
| Shared continuation may erase branch-specific elapsed time, object ownership or method | Confirmed cross-cutting QA vulnerability | Previously required semantic reading; deterministic common-patch collision now blocked in draft, while prose-level time still needs full path review |
| Model proposal might rename an established hero/world through canon_updates | Confirmed missing narrow runtime guard | Added immutable-identity check at blueprint and final-candidate validation |
| Short-paragraph tendency | Recurring measurable signal, not proven harmful | Confirm through 5–7 bedtime vs 8–9 adventure appropriate aloud reading; preserve intentional punchlines |
| Zaran leave/wait branches differ around 30 versus 79 RU words | Local review, not systemic | One independent decision with resolution-length ratio >=2.5; review meaning and common continuation, do not pad mechanically |
| Animal-care tag for ditch jump | Local metadata review | Intent/horse welfare needs editorial assessment, not a keyword auto-block |
| King/realm titles and terminology | Series-level glossary review | Bahadur and rider can be rank versus description; kingdom and realm can be synonyms; decide canonical usage before rewriting |
| Repeated final morality | Local literary review | Repeated narrator/hero/king lesson may weaken closure; no automatic speech-length quota |
| Missing literal apology | Not proof of a defect | Evaluate confession, repair and credible reconciliation; do not force one word |
| Lost Temur road book | NOT a defect | Explicit intentionally open story arc: lodged beneath forked oak and reserved for later continuation |
| Early sabre and later sabre award | Not confirmed contradiction | Prior audit states sabre used on rope, not person; ceremonial award may differ from travel weapon |
| Entire 4,000/8,000-word arcs against 6–8-minute bedtime | Wrong comparison unless format agrees | Authored Story 1/2 are serialized 8–9 kind_adventure; check individual sessions, not arc totals |
| Uzbek prose naturalness | Not established | Matching structure and canonical keys do not substitute native-speaker and oral quality review |

Important source: docs/qissa/ai/reviews/2026-09-23_prazdnik_muzhestva_v3_audit.md, §§2,5,7,12. Its previously documented canon decisions are authoritative unless a separately approved change supersedes them.

## Decision rule for systemic vs localized

A confirmed systemic literary defect requires the same demonstrated harmful effect in at least two independent story units with exact cited passages AND a plausible common editorial mechanism; a single shared program fault affecting multiple paths also qualifies. A recurring statistic by itself is NOT enough. Separate: (a) proven systemic, (b) recurring signal, (c) localized, (d) unverified, and (e) intentional/non-defect.

For every case log: source SHA and literary version, story and language, exact part/choice/path, excerpt, expected vs actual, impact, counter-interpretation, severity, remedy, regression test, decision and owner sign-off.

## Draft-only repairs

- Runtime Story Architect: explicit canon ledger, branch time/place/ownership invariants and counterfactual choice validity.
- Runtime Story Narrator: read-aloud rhythm variation, avoid duplicate explanations and unearned moral repetitions while retaining humor and purposeful short lines.
- Automatic guard: immutable identity and common-versus-selected canon-patch conflict checks at both blueprint and candidate validation.
- Authored-package audit: structural branch references, RU/UZ topology and canon key parity, memory convergence, final-part invariants and advisory stylistic metrics.
- CI: tests and corpus audit, without touching published stories, state or production release flags.

## Not done / release boundary

No claim that all branching prose has been fully read or Uzbek is native-quality. No edits to owner-approved V2 or published Story 1/2, no promotion of staging, no generated Story AI enablement, no production database changes. Full selected-path literary and audio verification remains a separate content QA task.
