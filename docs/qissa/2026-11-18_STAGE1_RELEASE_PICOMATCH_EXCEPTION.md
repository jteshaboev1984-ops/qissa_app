# QISSA Stage1 release — narrowly scoped security risk acceptance (2026-11-18)

**Owner decision:** explicitly requested publication of **all contents of PR #334** despite the known outstanding `picomatch` finding; requested that the remediation task be preserved. Owner approval covers this particular release and its merge/deploy, **not** future production releases, paid Story AI/TTS or modifications to saved family data.

## Known blocker, not a fix

- GitHub advisory: [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), ReDoS in `picomatch`.
- Affected dev/build graph: `picomatch`, `fdir`, `tinyglobby`, `vite`, `@vitejs/plugin-react` (five high npm-audit entries, one root advisory).
- `npm run audit:prod` passed with **zero production vulnerabilities** at exact PR HEAD `c1c05b9c0dd480301fc0d2def471e65c493308e1`; all 29 Stage1 approved hosted WebP checks / 58 RU/UZ exact anchored scenes and targeted browser/typecheck/build were SUCCESS [Tier A #44238767000](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44238767000).
- No upstream patched `picomatch` release verified at decision time. This is **explicit residual risk**, not a vulnerability remediation.
- Remediation continues in **[Issue #336](https://github.com/jteshaboev1984-ops/qissa_app/issues/336)**; do not close it because the release succeeded.

## Mechanically constrained release risk acceptance

- Normal `npm run audit:all` remains **unchanged** (still reports the advisory).
- `ci.yml` and `deploy-pages.yml` still **execute a full live `npm audit --json --audit-level=high`**; to accept the owner-approved condition, they now use `scripts/check-known-build-dependency-advisory.mjs` instead of blindly requiring an empty vulnerability report.
- An exception passes **only** if the checked-in lockfile has exact Git blob `2f7b70f714bc5083b0a88ae3c815b88f42d4625d`, if npm audit gives exactly 5 HIGH entries in the five fixed packages listed above, all chained to exactly GHSA-fc5q-39xc-vjpf, and **no other low/moderate/critical/high findings**. A clean audit also passes. Any malformed audit data, added advisory, changed package-lock, unfamiliar package or package ancestry **fails closed**.
- `npm run audit:prod` remains a separate mandatory release gate.
- After upstream fix, remove this exceptional check from both workflows, restore `npm run audit:all`, upgrade verified packages, keep reproducible lockfile and all CI green.
- This security exception must **never be described as patching picomatch** or eliminating the known risk.

## Release scope / protection
- Exact user-specified scope: all **64 pre-existing changes of PR #334**, not Stage1-only selective cherry-picks; staged release changes above add explicit limited security exception and documentation.
- The approved Seven Roads branch remains `product/seven-roads`; `main` is the GitHub Pages publishing branch. Do not merge a persistent product branch directly into main. No `product/ai-generator-legacy`, paid AI/TTS, family-data edits, or story-id changes authorized.
- Before merge, require that PR #334 HEAD be rechecked, all known relevant non-audit checks pass under the scoped validator, and conflicts or unrelated changes are not silently accepted. After merge, confirm GitHub Pages deployment result and actual hosted production content.
- A merge alone does **not** imply public availability, which requires successful Pages workflow and live URL verification.
