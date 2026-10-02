# Story 2 Uzbek localization reconciliation — 2026-10-02

## Authority

Canonical narrative source:

`/QISSA/production/seven_roads/story2_v2/seven_roads_story2_interactive_v4_continuity_sync.md`

Uzbek wording reference:

`seven_roads_story2_interactive_v7_literary_tightening_uz.md`

The Uzbek V7 file is used only as a native-language literary wording source. It does **not** override V4 plot, continuity, branching, visual anchors, or character canon.

## Reconciliation performed

The Uzbek overlay keeps the V4 runtime structure exactly:

- 10 reader parts;
- 4 decisions × 2 choices;
- 24 shared illustration anchors;
- 4 selected-branch illustration anchors;
- 5 deferred Choice-3 payoff segments;
- the same `story_id` and `story_version` as the Russian V4 package.

Two localization-source divergences were corrected before app integration.

### 1. Old Aras passage restored

The Uzbek literary-tightening source compressed the old caravan-yard introduction and omitted the V4 sentence that the old livestock passage still existed but was almost unused.

The localization restores the V4 continuity beat in Uzbek, including:

`Endi bu o‘tish joyidan deyarli hech kim foydalanmasdi.`

This is also the exact anchor for `P1-IMG-01`.

### 2. Guard names removed

The Uzbek literary source introduced the names **Kamol** for the Aras guard captain and **Rahim** for the senior guard.

Those names do not exist in the authoritative V4 canon, so the app localization does not adopt them. They are normalized to role-based wording:

- `sardor` for the captain;
- `katta qo‘riqchi` for the senior guard.

This avoids creating new Story 2 canon through localization.

## Critical V4 canon retained in Uzbek

The localized package explicitly preserves that:

- the real Aras road seal remains in the treasury;
- Rashid and Barlas return the real seal to the cabinet;
- the deep wax impression remains with them;
- the small red wax fragment remains between cabinet and wall;
- Nadir does not carry the road seal;
- Rashid and Barlas remain at large;
- Nadir continues with the eastern caravan under hidden adult supervision;
- Temur and Samira leave south for the old Sarvan caravan yard with the senior guard.

## App contract

Localization file:

`src/data/authored/taynaVostochnogoKaravanaV4.uz.json`

Validation:

`npm run check:authored-story2-uz`

The gated Story 2 preview resolves Russian/Uzbek from the same base package through `localizeAuthoredStoryPackage`. Progress, choices, reading position, and Gallery discovery remain keyed by the same Story 2 identity rather than being duplicated per language.

Story 2 remains unpublished while cover/release gates are still open.
