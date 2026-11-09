# QISSA — Canon and literary acceptance workflow v2 (2026-11-09)

Status: proposed QISSA-specific operational supplement to literary acceptance guide v1.1. It does not replace approved source prose, safety policy or historical literary approval.

## 1. Separate three judgments

A. Literary integrity: plot, causality, character, dialogue, emotional movement, oral rhythm and ending.
B. Product fit: age/mode, session vs whole arc, interaction and localization.
C. Release readiness: approved source version, valid package topology, canon state, assets/audio/safety and consent rules.

A text may be literature-quality but unsuitable for a particular bedtime duration. A structurally valid JSON may still be a weak story. Do not convert a numeric diagnostic into a literary veto.

## 2. Two distinct lanes

**Authored/published or staging stories:** preserve immutable owner-approved literary versions. Review all meaningful branch routes, their common continuation, canon objects, time/place and motivations. Review Russian and Uzbek separately as literary language, not merely translations. For release record owner/editor approval of the exact version and selected paths. Do not silently rewrite approved text when a checker detects a review signal.

**Provider-generated Story Agent:** runtime safety, schema, immutable-canon and choice-memory guards run before showing text. On a hard failure, follow the existing retry/fallback flow without exposing diagnostics to children. Do not require a human editor for every on-demand episode; instead qualify the provider/prompt version on representative multi-language, multi-branch cases before enabling it and sample outcomes during controlled rollout. Story AI stays disabled until separately authorized.

## 3. Before a story is written

Story Architect inputs: age, language, mode, hero identity, story world, series memory, relationships, last verified choice, open arcs and established object states.

Architect must prepare: (1) one local goal; (2) causally ordered events; (3) immutable identities/locations; (4) objects that matter and explicitly intentional unresolved arcs; (5) the moment of choice; (6) independent effects for EACH option; (7) plausible time/place/trust/object facts at the common merge; (8) an ending fitting the mode.

Do not require every incidental object to reappear. An intentional lost book or delayed clue may be a stored open arc. Avoid converting all decisions into moral examinations.

## 4. Deterministic gates (hard errors only)

- Invalid/missing story or choice IDs, missing resolution, incorrect part order or final-part topology.
- A conditional segment references an unknown/future choice or has an absent/ambiguous anchor.
- RU/UZ package topology (story ID/version, part IDs, decision IDs, choice IDs, canon key names) diverges. Human-readable canon values and prose are allowed to be naturally localized.
- Two options have identical labels or identical resolution text.
- A common state patch contradicts selected branch-specific memory.
- A proposed state_patch changes locked hero/world identity.
- Unsafe or unsupported content according to existing Content Safety Policy.

These checks protect technical facts, not literary excellence. Automation must not delete intentional open arcs, equalize branch lengths, turn all speeches short or turn vocabulary frequency into a rule.

## 5. Editorial-only findings (never automatically reject)

Paragraphs of 1–4 words, average sentence length, frequent verbs of looking, repeated transitional words, alternative branch word ratio, duration estimate, an explicit moral, ceremonial speech, unusual syntax, intentionally recurring jokes, complicated but age-fitting vocabulary. Log exact passages and an aloud reading before claiming harm.

Tag-to-action meaning (e.g. a risky horse jump marked care_for_animals), apparent time compression after a wait choice, contradictory dialogue and overlooked items require a human semantic reading or a dedicated source-specific oracle; keyword matching is not enough.

## 6. Whole-branch acceptance

For each decision, review both choices and the continuation after each. The questions:
- Can the hero plausibly do either action, without a preselected morally correct answer?
- Do the resulting events differ meaningfully to the child and remain anchored in selected memory?
- Can the merged paragraph be true after either action? Are time, place, trust and object states plausible?
- Does a later part remember important outcomes without replaying the just-seen branch?
- Is any open arc intentionally stored and are completed arcs accurately closed?
- Does the ending honor what characters actually did, including the real cost of mistakes?
- Does a read-aloud version sound natural in this language and age/mode?

For multiple independent choices use a path matrix, not a single canonical path. Exhaustively run feasible deterministic state combinations; manually review materially distinct routes. In Story 1, four binary decisions imply 16 possible paths; do not claim all 16 accepted from reading one branch.

## 7. Evidence and sign-off

Case record:
- case_id, story_id, literary_source_sha, runtime_file_sha, language, part/choice/path
- actual excerpt / expected state / observed problem
- class: HARD_STRUCTURAL, LITERARY_MAJOR, LITERARY_LOCAL, PRODUCT_FIT, SIGNAL_ONLY, NOT_DEFECT, UNVERIFIED
- impact and reviewer confidence, alternative authorial explanation
- proposed repair, owner approval when touching frozen prose
- regression cases, post-fix full-path check, final version and approval date

Workflow:
1. Register source/version and audience/mode.
2. Read full story once without microscopic edits.
3. Build causal event and canon map.
4. Run mechanical gate and two-choice path matrix.
5. Read natural RU and UZ aloud independently, with age/mode-specific session fit.
6. Merge duplicate notes; rank only evidence-supported issues.
7. Fix structural defects and only approved literary text.
8. Re-run all affected branches, audio/localization/asset anchors and CI.
9. Approve specific version or mark incomplete; do not mark pass based on an older version.

Release classes: PASS; PASS_WITH_LOCAL_REVISIONS; REWORK_AND_REREAD; HOLD_UNVERIFIED. A blocker is a violated prior contract or unsafe content, not a disliked stylistic choice.

## 8. Operational commands

- npm run check:story-canon-literary : authored RU/UZ topology + deterministic canon + runtime guard regression.
- npm run check:story-ai-split : existing split Story AI contracts and safety validations.
- npm run check:authored-v3 and npm run check:authored-story2 : existing published packages.

The new command prints WARN/REVIEW style metrics without failing CI for rhythm or branch-length imbalance. CI failure means a reproducible deterministic contract violation, not an adverse artistic verdict.

## 9. Boundaries

Never auto-merge literary edits into approved masters. Never change user progress, private child state or production configuration as a by-product of corpus evaluation. Keep provider/TTS enablement separately authorized. Native Uzbek literary quality and full path audio acceptance remain open until actually reviewed.
