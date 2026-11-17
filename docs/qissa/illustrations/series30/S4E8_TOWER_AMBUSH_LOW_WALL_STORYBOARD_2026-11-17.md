# QISSA — S4E8 «Засада у башни»: Stage1 A01 «За низкой стеной»

**Дата:** 2026-11-17 · **Статус:** REVIEW_v1, предварительная самопроверка выявила отклонения, владелец не утверждал · PR #334 Draft.

## Источник истины и якоря

- RU `src/data/authored/staging/season2Story6TwoReinforcements.ru.json` SHA `3130df982b8f64ad756ef5e60c2794c066463ebf`; UZ `season2Story6TwoReinforcements.uz.json` SHA `70b48c7d84a2a63e0dba6977eb5fa98e9342fd22`.
- `story_id=seven_roads_dve_podmogi`; `story_version=interactive-v3`; `part_id=story6_part_2_two_reinforcements`, `phase=story_text`, `kind=shared`.
- Virtual S4E7/S4E8 split at paragraph 41: RU `Рахим отвёл детей к невысокой каменной стене между башней и повозкой.`; UZ `Rahim bolalarni minora bilan arava orasidagi past tosh devor yoniga olib bordi.` — each once.
- Proposed new scene after paragraph 44 (each anchor 1/1):
  - RU `Темур и Самира спешились.`
  - UZ `Temur bilan Samira otdan tushdi.`
- Anchor is before the children decide which side to help. Do **not** show either choice being made or the outcome.
- Prior approved `seven_roads_s2_story6_two_reinforcements_reveal_02_APPROVED` is at `— Я никого вперёд не посылал.` prior to the new virtual S4E8 split, in S4E7. Existing approved choice-specific image(s) after branching must stay branch-gated.

## Intended independent scene

- Two children, Temur (12, teal chapan, blue patterned cap) and Samira (12, cream/burgundy travel outer layer, one braid), safely dismounted behind the **low stone wall between watchtower and prisoner wagon**. Same approved character visual family as `01_heroes_horses_approved.png`, and wardrobe/setting continuity with `seven_roads_s2_story6_two_reinforcements_reveal_02_APPROVED.png`.
- Rahim defends the opening at the wall (he has stopped an attacker by sword at paragraph 43); should **not** be hiding alongside the children.
- Background: canon old rough-stone watchtower (see `seven_roads_old_watchtower_ref_01_APPROVED.png`), locked wooden prison wagon with a pair of horses; non-graphic distant movement only, no identifiable red banners or symbols, no modern gear, no blood. Keep children's swords sheathed (they draw them later at paragraphs 48–50). Warm painterly `seven_roads_painterly_v1`.

## Visual candidate and QA

- First `seven_roads_s4e8_children_watchtower_low_wall_REVIEW_v1.png` ImageGen generation id `c6cd8adb-8410-4e87-953c-7134ded2000b`: **1670×941**, **2672791 bytes**, SHA256 `3c82306553819996fbc785836d2e89cb5338993bf16c031668835fcac8ad388f`. Review PNG and metadata in QISSA Library `/QISSA/production/seven_roads/series30/review/S4E8/`.
- Correct core: children behind low stone wall, stone watchtower + locked prisoner wagon, warm non-graphic ambush, character clothing similar to approved earlier scene. **Self-QA cautions:** Rahim crouched next to children instead of protecting them, and a small distant red banner not established by canon. This v1 should be revised or explicitly assessed before any acceptance. Do not mark APPROVED.
- Attempt `79c92f43-8746-4bd7-8427-1a7337970b59` MISFIRED and drew another S4E6 three-riders landscape; **not a S4E8 candidate** and not archived as approval.
- Stage1 S4E8 **0/2 artistic approved**, **0/2 integrated**; overall Stage1 **25/29 art accepted, 24/29 technically integrated** after green S4E5 CI. No WebP/Storage/runtime for A01. No merge/deploy/edited authored JSON/IDs/progress.

## 2026-11-17 — новая корректная версия REVIEW_v2, owner acceptance pending

- Старый `REVIEW_v1` **не принимать**: Рахим находился вместе с детьми за стеной, а вдали появился выдуманный красный флаг. Последующие off-target генерации трёх всадников `79c92f43-8746-4bd7-8427-1a7337970b59` и `b9f1f703-ed90-4e23-a450-db35c1c31cac` **отклонены** и не относятся к S4E8.
- Новая целевая версия ImageGen `c6c9f0f9-8455-4e9d-a362-10ea43eea5fc` — `seven_roads_s4e8_children_watchtower_low_wall_REVIEW_v2.png`, **1672×941**, **2775968 bytes**, SHA256 `0916df50adefe96552523c473faa7ffadf62f3cc5c038e6c6cdc03b1c2d3b87c`. PNG+metadata в QISSA Library `/QISSA/production/seven_roads/series30/review/S4E8/`.
- QA визуально: Темур (бирюзовый чапан и синяя узорная шапочка) и Самира (коса, кремовая одежда/бордовый верхний слой) укрыты за низкой стеной. Рахим **справа у проёма**, отражает приближение одного вооружённого нападающего саблей. В кадре прежние башня и запертая тюремная повозка с парой лошадей; **нет красного флага**, крови, сцен результатов выбора и вынутых детских сабель. Ракурс детей со спины помогает сохранить неизменный портретный канон. Точные RU/UZ anchor «Темур и Самира спешились.» / «Temur bilan Samira otdan tushdi.», unique paragraph44, unchanged.
- Статус **REVIEW**, владелец ещё не принимал эту версию; не производить WebP/Storage/runtime до решения. Stage1 S4E8 **0/2 approved**, общий Stage1 **25/29 art accepted and integrated**. No merge/deploy/source text change.
