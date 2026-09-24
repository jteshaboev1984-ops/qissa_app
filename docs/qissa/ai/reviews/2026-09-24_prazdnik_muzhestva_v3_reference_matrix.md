# «Праздник мужества» — V3 reference matrix

> Updated: 2026-09-24
> Purpose: prevent visual drift and repeated composition contamination.
> Rule: rejected generations are never references. Approved production illustrations are continuity checks only unless the owner explicitly promotes one to a reference.

## Clean generation reference pack

Use these files as the direct generation inputs. They are pixel crops derived only from owner-approved references and deliberately remove unrelated characters/actions that were contaminating later generations.

Folder:
`/QISSA/visual_refs/seven_roads_v1/clean/`

### Style / environment
- `00_style_texture_architecture_v1.png` — style texture + Seven Roads architectural language; no hero composition.
- `10_capital_architecture_v1.png` — capital architecture only; do not use the old full festival scene as a direct generation reference.
- `11_forest_tree_mark_v1.png` — Eastern Forest tree/ground/sign reference without Temur's damaged-sleeve chase pose.
- `12_zaran_architecture_v1.png` — Zaran architecture only, without Samira/Bulut arrival pose.
- `13_landslide_terrain_v1.png` — landslide terrain only, without the rescue/action pose.

### Identity
- `20_temur_identity_v1.png`
- `21_samira_identity_v1.png`
- `22_shamol_identity_v1.png`
- `23_bulut_identity_v1.png`

### Important correction

The old full-scene references remain approved **story/world references**, but they are no longer direct generation inputs because they encode scene state:
- `02_capital_festival_approved.png` biases toward riders/festival composition.
- `03_eastern_forest_escape_approved.png` shows Temur after action with a damaged sleeve.
- `04_zaran_arrival_approved.png` biases toward Samira/Bulut arrival composition.
- `05_landslide_rescue_approved.png` encodes landslide/action/damage state.

For new scenes, use the clean pack above plus only the identities actually present in the target scene.

## Authoritative reference hierarchy

### STYLE — always required
`QISSA_MASTER_REFERENCE_user_selected.png`
- controls rendering style, painterly texture, softness, child-book feeling and overall visual language.

### CHARACTER / HORSE IDENTITY — always required when recurring heroes/horses appear
`01_heroes_horses_approved.png`
- Temur age/face/body;
- Samira age/face/body/hair;
- Shamol markings;
- Bulut markings;
- canonical clothing silhouettes/colors.

### ENVIRONMENT — add only when relevant
`02_capital_festival_approved.png`
- capital/festival/palace environment.

`03_eastern_forest_escape_approved.png`
- Eastern Forest environment and forest-action lighting.

`04_zaran_arrival_approved.png`
- Zaran architecture/light.

`05_landslide_rescue_approved.png`
- mountain road/landslide environment and post-fall travel damage context.

## Prohibited reference sources

Never use as generation references:
- any rejected image;
- any repeated “Temur + Samira riding side by side” output;
- rejected wolf/crossed-swords sign outputs;
- rejected P6 verify-book attempts;
- rejected P7 final-hook attempts;
- any production illustration merely because it was accepted for a different scene.

Approved production assets may be inspected **after** generation for continuity, but are not input references unless the owner explicitly promotes them.

## Remaining slots and exact reference set

| Slot | Scene | Required references |
|---|---|---|
| COVER-01 | Story cover | STYLE + CHARACTER + CAPITAL |
| P2-IMG-02 | Fallen tree + Samira lie | STYLE + CHARACTER |
| P3-IMG-01 | Temur first sees bandit mark | STYLE + CHARACTER + EASTERN FOREST |
| P3-IMG-02 | Rope cut + road book under forked oak | STYLE + CHARACTER + EASTERN FOREST |
| P3-CHOICE-A | Jump ditch | STYLE + CHARACTER + EASTERN FOREST |
| P3-CHOICE-B | Precise narrow-line control | STYLE + CHARACTER + EASTERN FOREST |
| P4-CHOICE-A | Marker then book | STYLE + CHARACTER |
| P4-CHOICE-B | Search safer crossing then marker | STYLE + CHARACTER |
| P5-CHOICE-A | Leave Zaran immediately | STYLE + CHARACTER + ZARAN |
| P5-CHOICE-B | Wait until Temur visible far away | STYLE + CHARACTER + ZARAN |
| P6-CHOICE-A | Temur personally verifies road book | STYLE + CHARACTER + LANDSLIDE |
| P7-IMG-04B | Final bandit-sign hook | STYLE + CHARACTER + CAPITAL |

Note: P7-IMG-03 and P7-IMG-04A are now accepted/saved and are no longer missing.

## Exact recurring identity locks

### Temur
- ~12 years old;
- lean child proportions;
- dark straight hair;
- small embroidered cap;
- teal / blue-green travel tunic/chapan;
- reddish scarf;
- after Eastern Forest: right sleeve torn/dusty;
- no oversized blue superhero cloak;
- no adult armor.

### Samira
- ~12 years old;
- one long dark braid;
- maroon/burgundy travel outfit;
- narrow decorative headband, not a crown;
- after landslide: muddy/damp knees/hem/side;
- no loose glamorous hair;
- no princess costume.

### Shamol
- dark bay, nearly black;
- small narrow white forehead star;
- black mane/tail;
- no white socks.

### Bulut
- light dapple gray, not pure white;
- darker gray mane/tail;
- no forehead blaze/star.

## Bandit symbol lock

Only:
- rough crescent opening RIGHT;
- short diagonal slash crossing it from lower-left to upper-right;
- monochrome/hand-drawn or hand-carved;
- no wolf;
- no crossed swords;
- no extra runes/text;
- no heraldic shield.

## Generation workflow

For each remaining slot:
1. state the exact slot and scene;
2. load/use only the required authoritative references above;
3. create one new scene from scratch;
4. compare output against identity locks + scene meaning;
5. owner accepts/rejects;
6. only accepted file is saved under its final asset ID;
7. rejected output is never reused as a reference.

