# QISSA / Seven Roads / Season 2 — editorial visual-density rebalance proposal

**Date:** 2026-11-11 • **Status:** EDITORIAL PROPOSAL — OWNER APPROVAL REQUIRED BEFORE RUNTIME CHANGE  
**Base HEAD audited:** `c122970dbe76b74bf56a38195fb7e5c540b6fe0e`  
**Scope:** Story 2 `Тайна восточного каравана` (`taynaVostochnogoKaravanaV4`) RU/UZ, within the 7-episode Season 2.  
**Release:** Season 2 stays **UNPUBLISHED**. This document does not publish, remove, unapprove, replace, re-host or disable any image.

## 1. Verified problem and proportionality

The current seven-story inventory has **54 unique narrative illustrations** excluding the one shared season cover, including **24 shared + 4 choice-dependent** in Story 2 alone. Story 2 has **10 parts** and approximately **7,465 Russian narrative words** on one choice path (historical November 5 editorial method), while other S2 episodes are shorter and contain 3–5 narrative images. The current Story 2 renderer displays 24 common frames + one selected frame from each of the two illustrated decisions = **26 narrative frames per playthrough**, while the rest usually expose 3–5.

Do **not** force Story 2 down to exactly 3–4 images: it is much longer. Use editorial scene function and pacing. Proposed working target: **11 shared frames + 4 approved choice variants**, which means **13 narrative frames on any full reading path** (plus the unchanged shared S2 cover). This is a **50% reduction in per-path narrative images**. Total distinct Story 2 narrative assets referenced by the proposed *display policy* become 15, down from 28, though **all original 28 binaries remain approved, stored and recoverable**.

## 2. Evidence considered

- Actual GitHub RU/UZ authored packages and V4 layout manifest, including all 10 sections, their choices, shared after-paragraph anchors, and conditional dialogue.
- All 28 existing WebPs in permanent QISSA library `/QISSA/production/seven_roads/story2_v2/runtime_webp/`, visually reviewed in narrative order.
- Existing rendered reader, discovery/gallery, RU/UZ and stable-origin resume tests.
- Global Season 2 distribution: E1=4, E2=24+4, E3=5, E4=5, E5=3, E6=3+2, E7=4.

Editorial criterion: keep a picture when it establishes necessary geography, visualizes a major plot change/evidence reveal, differentiates materially different choices or supports an emotional transition. Disable near-duplicate viewpoints, repetitive conversation/table shots and incidental preparation/transport details. This is not a retroactive rejection of approved art.

## 3. Proposed shared-frame selection (11 KEEP / 13 HIDE)

| Story 2 part | KEEP visible `slot_id` | HIDE from reader/gallery `slot_id` | Editorial reason |
|---|---|---|---|
| 1 • Aras return | `P1-IMG-01` | `P1-IMG-02` | Opening geography; bowyer detail remains readable in prose and relevant Choice 4B later |
| 2 • Eastern caravan | `P2-IMG-02` | `P2-IMG-01` | Introduce Rashid and Barlas; generic caravan/city busy scene can be carried by prose |
| 3 • Treasury night | `P3-IMG-01`, `P3-IMG-03` | `P3-IMG-02` | Wax seal impression and horses leaving via old exit are distinct actions; guard interruption is transitional |
| 4 • Nadir handoff | `P4-IMG-01` | `P4-IMG-02` | Secret token check is the key causally important frame; routine horseyard introduction remains in text |
| 5 • First investigation | `P5-IMG-01` | `P5-IMG-02` | Wax fragment is long-range evidence; the other clue is understandable in prose |
| 6 • Wall/Sarvan records | `P6-IMG-02` | `P6-IMG-01` | Keep the geographic switch to Samira's Sarvan register investigation; track-only frame redundant |
| 7 • Third track | `P7-IMG-02` | `P7-IMG-01`, `P7-IMG-03` | Preserve joint clue interpretation; outfit preparation and another close horse examination are less necessary |
| 8 • Stopping Nadir | — | — | Keep both *branch* illustrations; there were no shared illustrations here |
| 9 • Interrogation | `P9-IMG-02` | `P9-IMG-01`, `P9-IMG-03` | Crucial network mark/token juxtaposition; avoid three repetitive table/comparison views |
| 10 • Two roads | `P10-IMG-02`, `P10-IMG-05` | `P10-IMG-01`, `P10-IMG-03`, `P10-IMG-04` | Preserve two distinct departures (Temur/Samira to Sarvan versus Nadir caravan onward), avoid repeated near-identical leaving-the-city frames |

**Exact KEEP shared slot IDs:** `P1-IMG-01`, `P2-IMG-02`, `P3-IMG-01`, `P3-IMG-03`, `P4-IMG-01`, `P5-IMG-01`, `P6-IMG-02`, `P7-IMG-02`, `P9-IMG-02`, `P10-IMG-02`, `P10-IMG-05`.

**Exact HIDE shared slot IDs:** `P1-IMG-02`, `P2-IMG-01`, `P3-IMG-02`, `P4-IMG-02`, `P5-IMG-02`, `P6-IMG-01`, `P7-IMG-01`, `P7-IMG-03`, `P9-IMG-01`, `P9-IMG-03`, `P10-IMG-01`, `P10-IMG-03`, `P10-IMG-04`.

## 4. Choice illustration decision

**KEEP both approved alternatives for two meaningful visual branches:**

- Choice 3: `P6A-IMG-03` (Samira investigates two-tower Sarvan yard) **or** `P6B-IMG-03` (Samira speaks with Azim). Relevant to downstream inherited story-choice memory.
- Choice 4: `P8A-IMG-01` (guards intercept Nadir after shortcut) **or** `P8B-IMG-01` (two safe arrows direct Nadir toward guards).

Do not add pictures to the other two Story 2 decisions or to other episodes for symmetry alone. There is no policy that every choice must have art. Keep both approved S2E6 variant pictures because they show materially different actions; evaluate any *future* branch art by the same rule.

## 5. Technical implementation after owner selection approval

1. Use a **versioned reversible runtime visual-curation allowlist** for Story 2. Do not delete image bytes from Supabase, approved PNG/WebP from Library, registry URLs, old V4 source-image mappings, owners' approvals or image-anchor provenance.
2. Preserve full canonical RU/UZ JSON prose, names, choice IDs, state patches, base package and historical image manifests. Apply curation to **both language render paths** after canonical validation and before reader + gallery construction, keeping the displayed story version/progress keys unchanged.
3. Update derived displayed-image counts only for the curated view. Distinguish archived **28 approved** from **15 currently active distinct**; all 28 original files should stay addressable and recoverable.
4. Ensure disabled images do not appear in Reading, Gallery, "already seen" backfill, replay/resume or Uzbek localization/fallback; never leak unselected branch art. Listening remains unchanged; shared Season 2 cover unchanged.
5. Verify all four Choice3×Choice4 combinations in RU and UZ; exact anchor sequence; rendered viewport; Gallery unlocking; resume; TypeScript; build; Story 2 smoke, Season 2 smoke and CI. Do not merge until all required checks pass **and the owner approves the exact curation**.

## 6. Global editorial guidance, not an arithmetic quota

Use visual density proportional to reading time/episode length but privilege **unique visual function**. A short episode can be perfectly served by three images; a ten-part episode may need more. Review 7-episode spread after Story 2 candidate is tested. Do not generate new images, revise accepted prose/choices or change season publication during this pass.

**Current decision gate:** `PROPOSED — not APPROVED; no runtime filtering applied`.
