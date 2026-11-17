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

## 2026-11-17 — углублённая RU/UZ художественная проверка, исправление и приёмка A01 (final v3)

**Решение:** после пользовательского условия «если ок принимай, если нет дорабатывай» предыдущий `REVIEW_v2` отклонён при сверке абзацев до/после кадра. В нём присутствовал только бой у башни, без явно показанной **отдельной обороны повозки**. Исправленную композицию `v3` проверили по обоим литературным JSON и approved мастер-референсам; принята по условному разрешению пользователя.

- До кадра: Рустам + четверо настоящих дорожных стражников появляются, Рахим отводит детей к низкой стене между башней и запертой тюремной повозкой (§41). Нападающий пытается обойти стену и Рахим встречает удар саблей (§43). Темур и Самира спешиваются (§44).
- В кадре: дети **за** стеной; отдельная первая схватка у башни (8 нападающих против Рустама и четырёх стражников, один из нападающих отвлечён Рахимом), отдельная вторая схватка у повозки (7 против Данияра/6 конвойных, один конвойный опустился на колено). Заключённый Фарид остаётся внутри, задняя дверь заперта; два тягловых коня при повозке.
- После: только §48 и §50 дети обнажат собственные сабли; затем следует вопрос о выборе стороны. Поэтому **точный якорь согласован на §47, а не прежний §44**, чтобы не показывать две линии боя до их литературного описания, но и не раскрывать ни одно последствие выбора.
- **Новый exact RU `after_text` (§47):** `У повозки один конвойный опустился на колено после сильного удара. Другой отбивался от двух противников. Третий разбойник искал путь к задней двери.`
- **Новый exact UZ `after_text` (§47):** `Arava yonida bir qo‘riqchi kuchli zarbadan so‘ng tiz cho‘kdi. Boshqasi ikki dushmanning zarbasini qaytarardi. Uchinchi bosqinchi orqa eshikka yo‘l izlar edi.`
- Оба якоря — самостоятельные абзацы исходных `story6_part_2_two_reinforcements/story_text` и встречаются ровно по одному разу. Source JSON, `story_id`, `decision_id` и `choice_id` не менялись.
- Сверены утверждённые `seven_roads_old_watchtower_ref_01_APPROVED.png`, `seven_roads_s2_story6_two_reinforcements_reveal_02_APPROVED.png`, `seven_roads_s2_story6_choice_b_wagon_door_01_APPROVED.png`, `01_heroes_horses_approved.png`. Сохранены старая каменная башня, деревянная закрытая повозка, два коня, невыдуманные возраст/костюмы детей, безопасный живописный язык. Нет флага, крови, выхода заключённого или будущего результата выбора. Лица детей скрыты ракурсом со спины, не подменяется портретный канон.
- **Final image generation `6f5229e7-cb77-44fd-9153-f07121b5e8fe`**; `asset_id=seven_roads_s4e8_children_watchtower_two_fronts_01_APPROVED`. PNG 1672×941, **2886790 bytes**, SHA256 `0fea21bb759fba2b6cbe34b08fa3ed6cbc05293180b99cd8b02f2ee87ebd7b52`; derived WebP quality92/method6 **495942 bytes**, SHA256 `b0f240eb4cff9be19ecb12126859462f5c03abdf8490c3cd082bfe4a3ffb191f`. QISSA Library `/QISSA/production/seven_roads/series30/stage1/S4E8/` содержит PNG, WebP и metadata JSON. Earlier `REVIEW_v1/v2` never accepted.
- **Supabase upload pending:** bucket `story-images`, object `seven-roads/season2_tier_a_v2/seven_roads_s4e8_children_watchtower_two_fronts_01_APPROVED.webp`; SQL-check returned no object. No public GET/SHA, no runtime/gallery CI for A01 until owner uploads the exact final WebP. S4E8 Stage1 **1/2 artistic accepted, 0/2 integrated**; total Stage1 **26/29 accepted**, **25/29 integrated**. PR #334 Draft; no merge/deploy/publish.

## 2026-11-17 — владелец ОТКЛОНИЛ ранее условно принятый S4E8-A01 v3

**Статус:** арт-приёмка **ОТОЗВАНА**. Предыдущий заголовок «final v3 approved» в историческом документе теперь НЕДЕЙСТВИТЕЛЕН. Несмотря на слово `APPROVED` в имени ранее сохранённых PNG/WebP/metadata, файлы `seven_roads_s4e8_children_watchtower_two_fronts_01_APPROVED.*` являются **REJECTED / DO NOT UPLOAD / DO NOT USE**. Архивировать для QA, не заменять другие утверждённые ассеты.

### Сверено с настоящими утверждёнными изображениями
- `seven_roads_s2_story6_two_reinforcements_reveal_02_APPROVED.png` — общая география прибывшей помощи, силуэт грубой каменной сторожевой башни с частично разобранным деревянным верхом, тёмная повозка с зарешёченными окнами, экипаж, пара лошадей стандартного роста; Рустам прибывает со стороны дороги
- `seven_roads_s2_story6_choice_b_wagon_door_01_APPROVED.png` — внешний вид тёмной деревянной закрытой тюремной повозки с окованной задней дверью и замком, возраст и костюмы детей; это более поздняя ЧАСТНАЯ ветка выбора, не раскрывать её действия заранее
- `seven_roads_old_watchtower_ref_01_APPROVED.png` — старая, потрёпанная каменная башня с неровной кладкой, разрушающимися конструкциями, привязка к дорожному пространству
- `01_heroes_horses_approved.png` — детский возраст, Темур бирюзовый, Самира бордовая, не взрослые лица

### Изучены исходные соседние абзацы RU/UZ
- §35–37: **слева у башни** Рустам + четыре дорожных стражника сдерживают восьмерых разбойников; **у повозки** Данияр + шесть конвойных сдерживают семерых; тринадцать защитников ВСЕГО, включая Рахима
- §41–44: Рахим ставит детей за низкую стену МЕЖДУ башней и повозкой, сам отражает атаку на проход, дети спешиваются
- §45–47: с их позиции видны обе линии боя; у повозки конвойный опустился на колено, другой отражает двух нападающих, один пытается пробраться к задней двери
- §48–51: ТОЛЬКО ПОСЛЕ этого дети обнажают сабли и решают, кому помогать; никаких результатов выбора, изменённой судьбы Фарида и снятых замков на общем кадре
- Основной RU/UZ exact after_text абзаца 47 ранее выбран корректно, литературные JSON не менять

### Признанные ошибки v3
1. Гигантские/вынесенные ближе по перспективе лошади на фоне маленьких людей; испорченная относительная масштабность людей, коней, повозки
2. Сложно отличить, какой взрослый на чьей стороне; нечётко соотнесены действия Рустама/Данияра и их группы
3. Условная постановка обеих линий боя: кто атакует с какой стороны, где защищённые лошади и задняя дверь, где укрытие между башней и вагоном
4. Башня и повозка не выдерживают геометрию предыдущего и последующего уже утверждённых кадров

**Решение:** снят `asset_id` и его `exact_anchor_pairs` из ART_QUEUE. Stage1 — **25/29 artistically accepted, 25/29 fully integrated**. S4E8 0/2. Никакого S4E8 runtime не было. Новый кандидат должен пройти проверку хронологии и изображения в единой перспективе до отдельной приёмки. Нет merge/deploy/publish и никаких правок прозы/ID/progress.

### 2026-11-17 — THREE failed re-renders after owner rejection

Generation ids `c0827826-a739-44c8-87fe-a3e6cb3435de`, `630d13c7-b357-4b3c-8426-ff84932c3363`, `2c6a29b0-92fd-48d5-886e-cd13330a1ce1` repeated the same spatial wrongness (clean tower top, implausible size/depth relationships, unclear guard-vs-bandit grouping). None art-approved. Compare actual owner-approved before/after images with the withdrawn v3 contact sheet archived in Library. See detailed audit doc for acceptance criteria.
