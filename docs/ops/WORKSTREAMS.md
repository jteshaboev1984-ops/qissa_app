# QISSA — Workstream navigation index

Navigation only, NOT a status board, editorial approval or an instruction to run all streams. Current actual state is established from GitHub Issue comments, PR HEAD/base, source locks, exact CI and branch/release state. Last index review 2026-11-09; do not treat this timestamp as current status.

Repo: https://github.com/jteshaboev1984-ops/qissa_app
Project rules: AGENTS.md, docs/ops/CHAT_PROTOCOL.md
Product source of truth: docs/qissa/00_QISSA_Project_Document_Index.docx plus approved specs, docs/qissa/14_QISSA_Closed_Beta_Scope_2026_09.md, docs/qissa/18_QISSA_Cost_Control_and_Monetization_Gate_2026_09.md, README.md.

| Command / chat | Where to resume / verify | Responsibility |
| --- | --- | --- |
| СТАРТ QISSA / 00 Architecture | AGENTS.md; docs/qissa/00_QISSA_Project_Document_Index.docx; later approved beta/series docs and product branch strategy | Product decisions, approved release scope, story-world roadmap and owner choices. Never turn proposal into release GO |
| СТАРТ STORY / 01 Stories & canon | issues/322 (read latest comments; earlier description may be obsolete), issues/318 and 216; docs/qissa/ai/SEVEN_ROADS_WORLD_BIBLE_V1.md and approved V2; docs/qissa/ai/reviews; current approved story sources | RU/UZ literary/editorial improvements, conditional causality, memory continuity, Story Agent canon and route/counterfactual QA; protect immutable approved source/IDs/illustration anchors |
| СТАРТ QISSA DEV / 02 Development | issues/296 and 287; README.md; src, supabase/functions; docs/qissa/2026-09-25_PRODUCT_BRANCH_STRATEGY.md; latest PR/CI | UI/story-memory/listening/choice pause/backend; respect product/seven-roads vs product/ai-generator-legacy and main-release boundary |
| СТАРТ QISSA QA / 90 Audit | issues/101, 95, 122, 98 and 152; docs/qissa/QA_CHECKLIST.md; release runbooks, Story Core and editorial tests | Physical-phone beta, security/privacy, backup, story/canon, provider cost and release readiness; no paid live provider smoke without owner GO |

Stable issue links:
- Story/Canon: https://github.com/jteshaboev1984-ops/qissa_app/issues/322
- S2E3 assets: https://github.com/jteshaboev1984-ops/qissa_app/issues/318
- Choice-pause listening: https://github.com/jteshaboev1984-ops/qissa_app/issues/296
- Family-beta Story AI: https://github.com/jteshaboev1984-ops/qissa_app/issues/122

## Current-history caveats

PR #321 and the original literary proposals have changed status during 2026-11-09. Always inspect latest merged state and recent Issue comments before suggesting work; do not redo approved edits or claim an earlier draft is pending. Source-specific CI on a superseded SHA does not prove tests on the latest edit.

## Branch and cost boundaries

Seven Roads changes branch from product/seven-roads and return through protected PR+CI. Preserve product/ai-generator-legacy as separate product line. Follow the documented release-branch strategy, never merge direct from the persistent product branch when auto-delete applies. Normal CI is deterministic/provider-free. Paid Story AI, TTS, live production testing, beta access or production changes need the architect's explicit authorization.

Until the architect's cutover, this registry is NOT a replacement for existing chats. Do not halt old chats or change their in-progress PRs. Only one active responsible writing workstream per source area once the new chat model is activated.
