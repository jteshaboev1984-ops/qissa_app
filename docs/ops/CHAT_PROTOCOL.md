# QISSA — Chat work protocol v1

Status: STAGED FOR CUTOVER. Development chat coordination only. Not the in-product Story Agent, a running agent server, or an automatic background executor.

## 1. Two modes

A. **Discovery menu / READ ONLY** when the entire trimmed user message matches one command (case-insensitive):
- СТАРТ or СТАРТ QISSA → project-wide next-work choices.
- СТАРТ STORY → authored stories, canon, literature, approved RU/UZ texts, branch memory and editorial QA.
- СТАРТ QISSA DEV → frontend, story-state, choice memory, listening/audio, backend and CI.
- СТАРТ QISSA QA → independent child-safety, privacy, editorial/release gates and source-specific checks.

On a discovery turn, inspect live GitHub and present up to 3–5 numbered, grounded, distinct tasks. **Do not modify code, GitHub Issues or PRs merely because START was requested.** If only one or two items are verified, show those instead of inventing others.

B. **Number choice / EXECUTE:** Standalone number 1–5 selects the matching choice from the **latest menu in this same chat**. Revalidate current status/dependencies and perform the selected task. If the current chat has no such menu, ask for START or a normal task; never import number meanings from another chat.

C. **Free-text task / EXECUTE:** Any substantive natural-language request overrides discovery. Work immediately on the requested scope, respecting mandatory release/child safety limits. A chat name is not a requirement to type START first.

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
