# «Праздник мужества» — V1/V2/V3 audit

> Date: 2026-09-23  
> Scope: literary canon, interactive structure, visual canon, illustration map and app-readiness.  
> Rule: V2 prose is not changed by this audit.

## Executive result

The approved literary story, the four approved interactive choices and the visual direction are consistent.

The audit found **documentation/integration inconsistencies**, not plot failures. Those inconsistencies were repaired in the V3/World-Bible/illustration documents without changing V2 prose.

## 1. V1 preservation

PASS.

The current V1 file is byte-for-byte unchanged from the original owner-approved V1 commit.

Authoritative file:
`2026-09-23_prazdnik_muzhestva_owner_approved_v1.md`

V1 intentionally still contains the earlier city name «Луговой». That is historical preservation, not current canon.

## 2. V2 approved editorial deltas

PASS.

V2 contains the approved changes:
- Zaran replaces the earlier working city name;
- capital/location/character/horse visual anchors;
- Temur notices that the upper path does not look blocked;
- Temur consciously trusts Samira because she studied the road book;
- Temur immediately rides away before Samira puts her book away / gets ready;
- Temur loses his road book in the Eastern Forest;
- exact lost-book location: between roots of the large forked oak, immediately after the cut rope and before the later ditch;
- the book remains unresolved and available for a later story;
- after Samira's confession, Temur visibly does not restore full trust immediately;
- the king's speech is shortened/reworked but remains substantial and ceremonial.

No interactive A/B metadata is inserted into V2.

### Metadata note

The V2 header was written before the final external-expert editorial pass and does not enumerate every later owner-approved V2 delta. Because the owner explicitly instructed not to change V2 without approval, this audit leaves even that header untouched. This audit document is the complete version ledger instead.

## 3. Zaran canon

PASS after repair.

Current canon:
- city name = **Заран / Zaran**;
- «зар» appears as warm golden light / honey-gold stone / copper-bronze details / sunlit fields;
- not literal gold plating;
- not generic Western-European castle architecture.

Audit repair:
- renamed stale internal asset IDs:
  - `char_lugovoy_ruler_v1` → `char_zaran_ruler_v1`;
  - `prop_lugovoy_reply_v1` → `prop_zaran_reply_v1`.

The only remaining «Луговой» mention outside frozen V1 is the intentional historical note explaining that V1 used the old working name.

## 4. Visual canon

PASS after repair.

Approved:
- master style = `seven_roads_painterly_v1`;
- master image = `QISSA_MASTER_REFERENCE_user_selected.png`;
- Central Asian / Silk Road-inspired storybook fantasy direction;
- approved identities for Temur, Samira, Shamol and Bulut;
- approved capital, Eastern Forest, Zaran and landslide visual language.

Audit repair:
- removed the stale World-Bible statement that the rendering style was still open/unapproved.

Confirmed persistent editorial reference files:
1. `QISSA_MASTER_REFERENCE_user_selected.png`
2. `01_heroes_horses_approved.png`
3. `02_capital_festival_approved.png`
4. `03_eastern_forest_escape_approved.png`
5. `04_zaran_arrival_approved.png`
6. `05_landslide_rescue_approved.png`

These are authoritative reference assets. They are not automatically all final app illustrations.

## 5. Interactive V3 structure

PASS.

- 7 ordered parts;
- 4 decision points;
- exactly 2 actions per decision;
- 8 unique choice IDs;
- 16 possible choice combinations;
- one common canon ending;
- no full binary story tree.

Approved choices:

1. Temur:
   - jump the ditch;
   - actively guide Shamol through the narrow line.

2. Samira at the river:
   - recognize/check the marker with the book;
   - first decide to search for a safer crossing, then discover/check the marker.

3. Samira in Zaran:
   - leave immediately;
   - wait only until Temur/Shamol are visible far away, then leave before he arrives.

4. Temur after the confession:
   - verify Samira's book himself;
   - deliberately give Samira another chance and trust her.

## 6. V3 ↔ V2 fidelity

PASS.

The V3 baseline path uses the V2 action at all four decision points.

After removing V3 structural/UI wrappers, the complete baseline V3 prose reconstructs V2 exactly.

Therefore:
- V2 stays the linear literary source;
- V3 is an interactive adaptation, not a rewritten competing story.

## 7. Mandatory convergence facts

PASS.

All branches must converge to:
- Samira lied at the first fork;
- Temur entered the Eastern Forest;
- bandits confronted Temur;
- Temur used the sabre on the rope, not on a person;
- Temur's road book remains lost under the forked oak;
- royal letter remains intact;
- Samira reaches Zaran first;
- Temur later reports the bandit mark;
- Samira chooses herself to warn Temur at the landslide;
- adults perform the rope rescue;
- Samira voluntarily confesses;
- both replies reach the king intact;
- both become **юные бахадуры царства**;
- the bandit arc remains open.

Only four branch-memory facts differ:
- `temur_escape_method`;
- `samira_river_method`;
- `samira_zaran_wait`;
- `temur_trust_response`.

## 8. Illustration structure

PASS after repair.

Authoritative Interactive V3 target:
- 1 cover;
- 18 shared narrative illustrations;
- 8 A/B choice illustrations;
- **27 production assets total**.

One playthrough shows:
- 1 cover;
- 18 shared illustrations;
- 4 selected choice illustrations;
- **23 visual moments**.

Audit repair:
- removed stale 17-shared / 26-total wording;
- marked the older storyboard's 10–12-image recommendation as superseded for V3 placement/count;
- kept the storyboard as the continuity/scene-meaning reference.

Authoritative count/placement source:
`2026-09-23_prazdnik_muzhestva_v3_illustration_map.md`

## 9. Image placement / choice behavior

PASS.

Images are anchored inside the story, not shown as a gallery.

At choice moments:
1. both A/B choice images appear as cards;
2. child selects one;
3. only the selected image remains/expands with its `resolution_text`;
4. unselected result is not shown as if it happened;
5. story continues at common merge text.

## 10. Runtime asset separation

PASS after repair.

The six approved ChatGPT Library images are editorial references, not app URLs.

The V3 fixture now separates:
- `master_style_id` / stable `asset_id` — app-facing identity;
- `editorial_master_style_reference` — generation/editorial source;
- `runtime_url = null` — intentionally unresolved until final assets are uploaded to app-controlled storage.

Before production launch:
`asset_id → Supabase Storage/CDN URL`
must be resolved without changing story structure.

## 11. Current app compatibility boundary

NOT YET IMPLEMENTED — expected.

Current QISSA runtime still assumes:
- `split-v1`;
- Episode 1 = exactly one two-option decision;
- Episode 2 = no decisions;
- status/memory logic based on `ep-1 / ep-2`.

V3 therefore must not be forced into the existing player.

Required future path:
1. authored multi-choice player;
2. N ordered parts;
3. optional decision per part;
4. save selected resolution/progress;
5. resume correctly;
6. then, only later, extend Story AI.

## 12. Age / safety boundary

OPEN PRODUCT WORK, explicitly documented.

The expert described the literary story as suitable for roughly 8–12.

Current app taxonomy supports `8-9` but not an explicit 10–12 group.

For initial app integration:
- scope Story 1 to `8-9`;
- mood = `kind_adventure`;
- preserve the authored no-gore / no-person-strike / adult-rescue rules.

Choice 1 occurs during a bandit pursuit and therefore should **not** be passed through the existing generic 5–7 bedtime/generated-choice assumptions. It needs authored 8–9 editorial/safety qualification.

## 13. Remaining work before app use

Not defects in the story:
- final 27 production assets have not yet been generated/approved;
- asset IDs are not yet mapped to app storage URLs;
- multi-choice player is not yet implemented;
- restart/resume behavior is not yet implemented;
- all 16 paths need deterministic app-level regression tests;
- TTS must read only the selected branch;
- 10–12 product support, if desired, requires an explicit age-taxonomy decision.

## Final audit verdict

**Literary canon: coherent.**  
**Interactive V3: coherent.**  
**Visual canon: coherent after the repairs above.**  
**Illustration count/placement: coherent after the repairs above.**  
**Current app runtime: not yet capable of playing V3; this is the next engineering stage, not a story defect.**
