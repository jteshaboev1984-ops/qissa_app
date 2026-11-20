# QISSA / Seven Roads — Stage 2 release preflight (2026-11-20)

**Status: RELEASE CANDIDATE IN ISOLATED TEMPORARY BRANCH; NO MAIN MERGE/DEPLOY YET.**
**Owner release action:** 2026-11-20 chat "разрешаю. работай" after proposal to reconcile #348, #353, #354, inspect Issue #336 and release if gates permit.

## 1. Immutable scope and code lineage

- Planned/new Stage2 image slots: **19 of 19 owner-art accepted**. Existing Stage1 **29 of 29 published**, not retouched.
- Draft chain: [#348](https://github.com/jteshaboev1984-ops/qissa_app/pull/348) `cb9109991c780b6ec093eb0d1590d8684abd1881` → [#353](https://github.com/jteshaboev1984-ops/qissa_app/pull/353) `485a69a2f3875fa9373f24000fb5ce14f82e3f41` → [#354](https://github.com/jteshaboev1984-ops/qissa_app/pull/354) `06e4a6a0e9dfa6a75be67afc12a3f68a208b5c9a`, each open Draft before release preflight.
- Git compare `ae120dc83c5a48707b8693c5a522e7fb712fb1d7...06e4a6a0e9dfa6a75be67afc12a3f68a208b5c9a`: exactly **40 commits ahead / 0 behind**, **6 changed files only**: art queue, anchored scene slot registry, hosted URL registry, local/image validators and the existing 30-series browser fixture.
- Exact source RU/UZ literary JSON, story/part/decision/choice IDs, hashes, family progress, old images, providers, payments and backend tables are NOT changed. No new Story AI/TTS spend.

## 2. Verified original preflight evidence

- [Seven Roads CI #44676582657](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44676582657) SUCCESS and [Tier A #44676582645](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44676582645) SUCCESS on exact #354 SHA `06e4a6a0e9dfa6a75be67afc12a3f68a208b5c9a`.
- Real CI logs: `[series30-art-remote] PASS 48/48 remote GET, MIME, byte lengths and SHA256`, `[series30-art] PASS: 48 hosted, owner-approved assets, 96 unique RU/UZ anchors`. 136 authored routes, TypeScript, build, gallery/spoiler and 30-series RU/UZ browser smoke PASS.
- Stage2 final published-object evidence: S4E8-A03 WebP **389740 bytes** SHA256 `41d29e6b1b1868fa0873f3faef5ce99af7665786e5903f2d22fbb55e36201094`, S4E10-A03 WebP **332388 bytes** SHA256 `ec1b05ca6e41c7b0bc7de66cecb44fef7e02eaed480c17e8a7d69f7a2a5f5877`. Full 48 image set includes Stage1, Stage2 and previous public images; 48 is not the Stage2 slot count.

## 3. Security Issue #336: status change must be validated

- Original Stage1 exception was owner-authorized **only for Stage1**, and the exact `package-lock.json` remained locked. No automatic Stage2 risk carry-forward.
- [Official GitHub advisory GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) is now **WITHDRAWN 2026-11-18**; **not a patched picomatch release**. The authoritative GitHub Pages status should be checked again before release. At last `#354` Seven Roads CI job on 2026-11-20, the live full graph audit script returned `[QISSA release audit] PASS: no vulnerabilities`, not a waiver.
- For this release candidate **both** `.github/workflows/ci.yml` and `.github/workflows/deploy-pages.yml` now run mandatory unexceptioned `npm run audit:all` alongside `npm run audit:prod`. The formerly approved known-advisory exception helper is no longer used by the workflows; it remains as historical reference only. This change must PASS at exact release candidate HEAD.
- [#336](https://github.com/jteshaboev1984-ops/qissa_app/issues/336) is not yet closed; annotate actual withdrawal and audit results. Withdrawal alone must not be misreported as an upstream patched version.

## 4. Branch/release strategy exception — visible, not silent

- Official [product branch strategy](../../2026-09-25_PRODUCT_BRANCH_STRATEGY.md) normally builds from maintained `product/seven-roads`, then temporary `release/seven-roads-...` to `main`, protecting the permanent product branch from auto-delete.
- **Factual topology at preflight**: `main` SHA `ae120dc83c5a48707b8693c5a522e7fb712fb1d7` and `product/seven-roads` SHA `5359a8f19ae6359dd94b6ac25cb777ab9bd8c6e5` are DIVERGED: the product branch is **661 commits behind main and 11 ahead**; those ahead contain distinct, unfinished historical UI modifications (e.g. Library/gallery scroll). Replaying/pulling it wholesale into a 6-file art release risks changing the already deployed product.
- Therefore this release candidate is an **explicitly isolated temporary branch at verified #354 HEAD**, containing all three stacked art PRs, *not a rewrite or reset of `product/seven-roads`*. This is a **one-off deviation** to preserve that divergent product work. Before merge, require explicit acceptance of this bounded route by the owner and confirm no main drift; update project branch strategy later only via independent approval if this becomes permanent.
- The three existing stacked PR heads remain unchanged; merge/release would be from the *temporary* branch only. Never try to merge #348 then #353 then #354 independently, which would risk duplicate/confusing commit histories.
- `main` pushes automatically launch production GitHub Pages from `.github/workflows/deploy-pages.yml`. A successful PR check is **not** production deployment. Verify Pages build/deploy SHA and public URL after any authorized merge.

## 5. Required GO/no-GO list

- [x] Owner individually accepted all 19 Stage2 images; exact master and WebP SHA recorded in QISSA Library/queue.
- [x] Verified 48/48 hosted public WebP, 96 unique RU/UZ anchors and 136 routes on preflight parent SHA.
- [x] Current temp release candidate excludes old product branch's distinct UI work and unchanged source packages.
- [ ] Release branch exact-HEAD **unexceptioned audit:prod + audit:all** PASS, story/canon/reader/gallery/CI PASS.
- [ ] Final branch/main SHA comparison and scope review; no overlapping writer or manual review blocker.
- [ ] Owner separately acknowledges this **temporary main-based branch route** as an exception to stale product-branch workflow, if the stated "разрешаю" does not clearly specify such a deviation.
- [ ] Merge candidate into protected main only with GO; verify Pages workflow build+deploy and public website content (not merely run success).
- [ ] Record exact merged SHA, checks, deployment SHA/site and any remaining mobile/family-beta gates. Issues #95 (verified recoverability), #101 (physical phone), #152 (orphan fixture) continue to gate **external family admissions**, not this static image-only update.

**Strict boundary:** No production publication without verified security and branch-release decision. No child/family data operations, no provider/TTS charges, no production Edge Function changes.
