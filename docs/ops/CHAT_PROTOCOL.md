# QISSA — Chat work protocol v1

Status: STAGED FOR CUTOVER. Development chat coordination only. Not the in-product Story Agent, a running agent server, or an automatic background executor.

## 1. Two modes

A. **Discovery menu / READ ONLY** when the entire trimmed user message matches one command (case-insensitive):
- СТАРТ or СТАРТ QISSA → project-wide next-work choices.
- СТАРТ STORY → authored stories, canon, literature, approved RU/UZ texts, branch memory and editorial QA.
- СТАРТ QISSA DEV → frontend, story-state, choice memory, listening/audio, backend and CI.
- СТАРТ QISSA QA → independent child-safety, privacy, editorial/release gates and source-specific checks.

On a discovery turn, inspect live GitHub and present up to 3–5 numbered, grounded, distinct tasks. **Do not modify code, GitHub Issues or PRs merely because START was requested.** If only one or two items are verified, show those instead of inventing others.

B. **Number choice / EXECUTE:** A standalone number 1–5 selects only from the **latest UNCONSUMED menu in this same chat**. A menu expires after selection, a new START, or a substantive free-text request. Revalidate current status/dependencies; if the chosen task is now complete, blocked or owned by an overlapping PR, DO NOT switch tasks silently, overwrite another chat's work, or treat the old number as approval. Explain briefly and provide refreshed options. With no active menu, ask for START or a normal task; numbers never carry across chats.

C. **Free-text request / RESPOND OR EXECUTE AS ASKED:** Any substantive natural-language request overrides discovery. Question/discussion → answer without changing files; requested audit → examine without implementation by default; implementation/fix → execute the described scope. No START required. Respect release/child-safety boundaries.

## 2. Fresh source resolution

1. Read AGENTS.md, docs/ops/WORKSTREAMS.md and the relevant approved docs/qissa specifications, launch/beta scope and branch strategy.
2. Read canonical Issue INCLUDING its newest comments, PR current state/HEAD/base, source/canon locks and SHA-specific CI; check actual main and branch content. Old “DRAFT”, “NEXT”, “LATEST” body text is not evidence if later checks/merges supersede it.
3. Check the exact story source version, approved World Bible, route/choice IDs, illustrated anchors, sibling/inherited choices and RU/UZ files before proposing literary edits. Automated route coverage never implies independent human literary sign-off.
4. For Story AI/TTS, preserve normal provider-free tests; production paid generation/smoke is manual-only and owner-gated. Never turn on paid providers simply to test CSS, navigation, fixtures or normal story behavior.
5. Identify ongoing other-chat PRs and overlapping files. A menu is a choice of work, NOT authorization to take over their branches.

## 3. Menu & execution

Menu items specify the concrete deliverable, why it is next, source Issue/PR or MD, dependency and owner approval/release gate. Prefer current blockers and approved scope over re-auditing completed 136 routes, older 2026-09 launch baselines or merged PRs.

On selection or direct task: execute meaningful, coherent work in an isolated Draft PR by default; repair substantiated defects; run appropriate typecheck/build/route/canon/security/CI checks. Distinguish deterministic tests, simulated services and real provider/browser acceptance. Append an exact SHA + CI + current next action to the **existing canonical Issue or accepted workstream handoff**. WORKSTREAMS is a navigation index, not a manually maintained runtime-status board.

Never change child safety/product policy, release published story, merge to main, deploy production, delete or mutate families' data, or enable providers/payments without explicit architect approval. A second AI review is not human editorial certification. Editorial/code audit defaults to read-only and routes findings back to the responsible development chat.

## 4. Chat boundaries & activation

No invisible multi-agent team, background autonomy or real-time cross-chat coordination is claimed. GitHub Issues/MD/PRs carry confirmed progress across chat limits; menus are chat-local. When starting a new chat, send START for a fresh menu or any direct request for immediate execution.

Existing QISSA work continues in current chats while this documentation is staged. The architect will stop asking old chats for new work **only after** the technical foundation and project instructions are ready. At cutover re-check all heads and checkpoints. Do not create parallel competing source edits.

## 5. Forward-safe coordination and cutover

- **Three different authorities:** approved product/canon/child-safety contracts define acceptable behavior; current branch/main/release evidence establishes what exists; latest Issue comments and SHA-specific CI establish task progress. An old "NEXT", source scan, PR title or WORKSTREAMS link alone is never authorization or proof.
- **A menu number is not owner GO:** choosing an option authorizes work within that task, but never an implicit GitHub main merge, public story publication, family-data mutation, provider/TTS charge, live AI activation, payments or external beta. Ask explicit authorization for the particular gated action.
- **Multiple chat race:** check exact branch/PR HEAD and overlapping files immediately before writing. GitHub Issues are not atomic locks and do not guarantee an exclusive editor. Never force-update or overwrite another working chat's changes; split non-overlapping branches and report collisions.
- **Source lock safety:** a new approved authored edit must preserve versioned canon and old approvals, route choices, identity/illustration anchors, correct RU/UZ source hashes and applicable branch strategy. A mechanical merge is not literary sign-off.
- **Cheap QA:** reuse already verified exact-SHA checks on unchanged code, target new checks to changed files, and keep Story AI/TTS provider-free by default. Free use depends on available platform quotas; do not create billable usage without consent.
- **Lost connectivity:** if relevant repositories, CI or official status cannot be checked, say what is unknown; do not invent a fresh task menu or call an unverified test successful.

### Cutover sequence (owner-controlled)

1. Keep the existing chats active while staging these docs. Do not install new project instructions in their shared ChatGPT Project early.
2. Once the architect stops sending work to old chats, verify that in-flight updates have settled; refresh main, latest Issue comments, PR HEAD, source locks and this docs PR. Resolve any changed-base conflicts using normal reviewed PR edits, not force pushes.
3. After specific owner authorization, merge the **docs-only** PR and verify these instructions from main. Do not touch published stories or product branches as part of this merge.
4. The architect installs the approved text from docs/ops/PROJECT_INSTRUCTIONS.md into **QISSA ChatGPT Project settings**. GitHub commits do not update the ChatGPT UI.
5. Test a new QISSA project chat: START STORY must show source-backed read-only choices; choose a still-open numbered task and verify correct scope; direct discussion must not write files; a concrete development request must not silently publish/merge; a new chat START must not inherit old menu choices.
6. If a test fails, do not change product or release state; amend the coordination documentation in an isolated docs PR and retest before declaring the workflow operational.
