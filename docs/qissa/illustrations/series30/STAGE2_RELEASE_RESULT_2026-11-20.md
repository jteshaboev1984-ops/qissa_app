# QISSA — Seven Roads Stage 2 / production release result (2026-11-20)

**Status: GitHub Pages production deploy SUCCESS; manual independent public-browser acceptance NOT performed in the chat runtime.**

## Owner authorization and source of release

On 2026-11-20 the owner replied `разрешаю. работай` directly to the proposal to consolidate Stage2 Draft PRs #348/#353/#354, check release gates/security issue #336, and proceed with release. Released all 19 individually accepted Stage2 pictures through the single temporary [release PR #355](https://github.com/jteshaboev1984-ops/qissa_app/pull/355). GitHub auto-closed all three earlier PRs as merged by ancestry.

- Prior `main`: `ae120dc83c5a48707b8693c5a522e7fb712fb1d7`.
- Release candidate: `7f9b9be47853761fe2b57d9ec4af8ca314ddf55a`.
- **Final code/art main release merge SHA:** `622857c752f8738954a2edb4caee0dd7a1a5637c`.
- Release diff: 6 additive art/queue/test files + `ci.yml` and `deploy-pages.yml` security gate restoration + [preflight record](STAGE2_RELEASE_PREFLIGHT_2026-11-20.md). No literature JSON, choice IDs, source hashes or family progress rewritten.
- Owner-approved Stage1 **29/29** and Stage2 **19/19** complete, all 19 Stage2 images present in hosted public Storage and wired to the RU/UZ reader. The verified CI counts of **48/48 public art assets** (29+19) and **96/96 RU/UZ image anchors** apply to newly inserted stage assets; the reader retains original images too.

## Pre-release CI at exact release candidate SHA

| Gate | Evidence | Result |
| --- | --- | --- |
| Seven Roads CI | [#44677530975](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44677530975) | SUCCESS |
| Season 2 Tier A | [#44677530894](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44677530894) | SUCCESS |
| `npm run audit:prod` | Unexceptioned production dependency audit | 0 vulnerabilities |
| `npm run audit:all` | Unexceptioned full dependency audit, no scoped waiver | 0 vulnerabilities |
| Hosted art SHA | `[series30-art-remote] PASS 48/48 remote GET, MIME, byte lengths and SHA256` | PASS |
| Bilingual anchors | `[series30-art] PASS: 48 hosted, owner-approved assets, 96 unique RU/UZ anchors` | PASS |
| Literary routes | 136 complete paths | PASS |
| Reader/gallery | 30 series, virtual split, both languages, scene chronology, branch and spoiler lock | PASS |
| App | TypeScript, Vite build, four-season Chrome smoke | PASS |

## Production GitHub Pages

- [GitHub Pages workflow #44677801258](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44677801258): `event=push`, **HEAD `622857c752f8738954a2edb4caee0dd7a1a5637c`**, completed **SUCCESS** at 2026-11-20T04:57:58Z.
- Build job `136093703622`: SUCCESS; direct `audit:prod` and `audit:all` log `found 0 vulnerabilities`, `npm ci`, typecheck, build and Pages artifact upload PASS.
- Deploy job `136093814603`: SUCCESS.
- Expected published URL: https://jteshaboev1984-ops.github.io/qissa_app/
- A browser/HTTP fetch of the public GitHub Pages URL could **not** be completed in this chat's environment (DNS resolution failed / browsing tool inaccessible). Thus this report does **not** claim a human phone, Safari/Chrome end-to-end acceptance of the deployed site. The GitHub Pages deploy job is genuinely green. The already independently verified 48 Storage WebPs were fetched by CI.

## Security Issue #336

- [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) was officially **WITHDRAWN on Nov 18, 2026**. This was **not** a patched `picomatch` release and historical risk notes remain valid as contemporaneous reports.
- Release workflow and CI now call **unexceptioned `npm run audit:all`**, not the historical Stage1-specific exceptional audit validator, and it reports 0 vulnerabilities.
- [Issue #336](https://github.com/jteshaboev1984-ops/qissa_app/issues/336) closed as **resolved by official advisory withdrawal and clean full audit**; avoid describing this as a dependency upgrade.
- The historical exception source code is retained for provenance but never executed in the mandatory CI or Pages workflow.

## Branch strategy / preservation

- Permanent `product/seven-roads` at `5359a8f19ae6359dd94b6ac25cb777ab9bd8c6e5` is materially **diverged** from main: 11 unique old UI commits vs 661 commits behind the main baseline at preflight. It was neither overwritten, force-updated nor merged with the release.
- The single release was staged through an **isolated, temporary main-based release branch** instead of merging these unrelated old UI commits. This one-off deviation is documented, not a standing project rule. A future workstream should reconcile the persistent product branch through a reviewed migration, never a blind reset or fast-forward of conflicting UI changes.
- `product/ai-generator-legacy` untouched.

## Unfinished gates, outside this static Stage2 art release

- Direct external live Pages browser and physical-mobile acceptance before admission of additional external families; issue [#101](https://github.com/jteshaboev1984-ops/qissa_app/issues/101).
- Verified private production backup/recovery path before external beta; [#95](https://github.com/jteshaboev1984-ops/qissa_app/issues/95).
- Synthetic orphan fixture safe cleanup by approved operator path; [#152](https://github.com/jteshaboev1984-ops/qissa_app/issues/152).
- No extra paid Story AI/TTS, payments or production family data write was involved in the Stage2 release.

This is a **release checkpoint**, not a new standing policy or an authorization for future product merges.
