# QISSA / Seven Roads — Season 2 Episode 6 art handoff

**Date:** 2026-11-04  
**Editorial decision:** User approved the final illustration of Rustam’s relief arriving during the ongoing battle. **Art/design APPROVED; runtime deployment pending**. The actual image was saved to QISSA Library.

## Approved replacement for old E6 REVEAL

- **Slot ID (preserve):** `S2-ST6-TIERA-REVEAL`.
- **Exact reader anchor (preserve):** `— Я никого вперёд не посылал.`
- **Approved source PNG:** `/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/seven_roads_s2_story6_two_reinforcements_reveal_02_APPROVED.png`
- **PNG dimensions:** 1672 × 941; **bytes:** 3,392,590; **SHA-256:** `671e8d62895fc356cba363fd57958f749278dde326fdd9e722dce5beb3a2f105`.
- **Prepared WebP derivative in Library:** `/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/seven_roads_s2_story6_two_reinforcements_reveal_02_APPROVED.webp`
- **WebP dimensions:** 1536 × 864; **bytes:** 528,508; **SHA-256:** `a95cd925fa32604f09e961148e1797f6b0f9eab9c2eb02eae3c74dfd69b0420c`.
- **Previous approved master:** `seven_roads_s2_story6_two_reinforcements_reveal_01_APPROVED.png`. Preserve as historic rejected-for-new-story reference; do not overwrite or delete it.
- **Original user-accepted generated image:** the `рустам_ведёт_подкрепление_к_осаждённому_обозу.png` image in the conversation, byte-identical to the saved approved PNG.

## What the new artwork depicts

A high three-quarter vantage: the road brings Rustam’s relief from the left; at center/right Danyar protects a closed barred prison wagon hitched to **two** horses; bandits approach from the rocky slope at right and near the old stone tower. Rustam turns into the fight rather than riding past. Temur on dark Shamol and Samira on pale Bulut remain with arriving adults, not yet acting in the branch choice. No graphic violence.

The hero/equipment/style canon is the established Season 2 approved cover, Episode 5 real relief departure PNG, Episode 6 false relief watchtower PNG, and Season 1 supporting illustrations.

## IMPORTANT: do not misstate deployment

The **PNG + WebP have been uploaded to persistent ChatGPT QISSA Library and verified**. This session's connected Supabase MCP does not expose a **Storage object upload** action; the WebP has **not** been uploaded to Supabase Storage or verified at a public URL. Consequently, as of writing:

- Existing `src/data/authored/season2TierAVisualSlots.json`, `src/data/authoredStoryAssets.ts`, and `docs/qissa/season2/season2_tier_a_runtime_asset_inventory.json` still identify the **old** version-01 hosted image. This is intentional to prevent broken runtime URLs.
- **Do not close image replacement issue #297** as a deployment task until the new WebP is genuinely hosted and tested.
- When uploading, prefer a distinct immutable object path `story-images/seven-roads/season2_tier_a_v2/seven_roads_s2_story6_two_reinforcements_reveal_02_APPROVED.webp` rather than overwriting the old version. Update the runtime registry and locked sha/size inventory to the **actual** object path.
- Confirm the exact public storage URL works, image sha256 equals the prepared derivative, the same slot appears after Rustam’s line on both RU and UZ readers, and Season 2 stays unpublished.
- Keep existing asset ID stable **only if** changing its resolver is fully compatible with gallery/progress/state invariants. Otherwise migrate all authored packages and overlays together.
- Re-run Season 2 image/Tier A and browser checks, then close issue #297.

## Production queue and next steps

The user previously approved proceeding with the image production workflow while deferring audio features. Only the **reveal replacement** is approved as art; optional new illustrations are still **pending individual approval**:

1. E6 **mountain-road repair cart and old bypass** found by Samira’s road book and Temur’s observation — new common scene image.
2. E6 choice **A**: children block flank attack behind tower using gate / Rahim helps detain attacker — branch-A-only image.
3. E6 choice **B**: children stop intruder at the locked wagon door / convoy guard arrests him — branch-B-only image.

Maintain established 16:9 painterly Silk Road style, visual identity, saved original PNG masters, prepared WebPs, unambiguous branch isolation. Ask for approval for each new image before marking approved or deploying.

## Continuation in a new ChatGPT conversation

1. Reference **this GitHub document**, the latest Episode 6 RU/UZ authored files, the `src/data/authored/season2TierAVisualSlots.json` manifest, and the persistent Library folder `/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/`.
2. Retrieve the saved **v2 approved** image (and canonical Season 2 cover / E5 relief / E6 wagon masters) directly using the Library Files connector. If a new image generator cannot consume Library refs, attach individual PNG originals in that conversation; mere URLs or archive names do not guarantee image generation can see the pixels.
3. **Do not regenerate** the already approved reveal. Proceed with the roadblock/bypass image, then the choice-A and choice-B images.
4. Keep source and runtime approval as separate statuses and never silently publish second season.
