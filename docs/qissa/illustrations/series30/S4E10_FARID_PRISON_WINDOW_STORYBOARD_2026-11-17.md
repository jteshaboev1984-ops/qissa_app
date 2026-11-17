# QISSA S4E10-A01 «Взгляд через решётку» — REVIEW v1

**Дата:** 2026-11-17. **Статус:** предварительная самопроверка пройдена; **владелец художественно ещё не утвердил**. PR #334 Draft, only storyboard. Сцена специально выбрана после успешного S4E9-A01 как простой двухперсонажный кадр без боевой массовки.

## Первоисточник и хронология

- Authored RU `src/data/authored/staging/season2Story7BackToOrdan.ru.json` SHA `e5fde8ac773375a334ffab1c80fe621967674a3a`; UZ `...uz.json` SHA `67101f138790269f3929f0c2ad3c4cd218242651`; обе прочитаны до и после сцены.
- `story_id=seven_roads_obratno_v_ordan`, `story_version=interactive-v17-visible-inherited-defect`, `part_id=story7_part_1_back_to_ordan`, `phase=post_choice_text`, `kind=shared`.
- Display series **S4E10 «Печать» / «Muhr»**, потому что virtual split S4E9→S4E10 происходит ранее внутри `story_text` после RU `Ответ из Араса пришёл после полудня.` / UZ `Arasdan javob tushdan keyin keldi.`.
- **RU exact unique anchor** `Данияр остановился.` — 1/1, p32 of original `post_choice_text`; **UZ** `Daniyar to‘xtadi.` — 1/1, same p32.
- Непосредственно перед кадром: в тюремном внутреннем дворе Фарид сидит на **низкой каменной скамье**, не слышал разговоры в караулке, замечает Данияра, проходящего мимо решётчатого окна, поднимает голову и говорит, что так и не доехал до столицы. Данияр останавливается. Ни ответ на дальнейший вопрос о сроке заключения, ни разгадку заговора в кадре не показывать.
- Сцена общая **после выбора** в предыдущем расследовании. Не копирует уже существующий в S4E10 утверждённый кадр **сравнения печатей** или более поздний ending hook. Нельзя перезаписывать исходную литературу, ID, progress.

## APPROVED визуальные референсы — реальные пиксели проверены

- `seven_roads_kamran_farid_ref_01_APPROVED.png`: Камран, выдающий себя за Фарида, 23–27 лет, тёмные растрёпанные волосы, в плену простой коричневый/землистый костюм, без доспеха и оружия.
- `seven_roads_s2e3_farid_gate_arrest_01_APPROVED.png`: лицо Фарида и образ Данияра с синей накидкой/шарфом и стражническим костюмом.
- Стиль `seven_roads_painterly_v1`, тёплое дневное освещение и мотив Центральной Азии, без современной тюрьмы, крови, новых флагов или лишних участников.

## Фактический новый REVIEW-кандидат

- `seven_roads_s4e10_farid_danyar_prison_window_A01_REVIEW_v1.png`, **1672×941, 2,663,911 bytes**, SHA256 `352de1d1a9a055824dc32080c286c0a4843b830adf46f8b496257d5f788fb33f`; generation `71956e59-acac-4990-a0e4-1e4578354197`.
- Farid sits inside the barred prison courtyard opening, Daniyar stops **outside** in familiar blue scarf. Both are on one plausible ground-plane; narrow intimate perspective. No other characters, choice results, weapons drawn or future document-seal reveal.
- Реальные пиксели кандидатного PNG визуально изучены, очевидных существенных ошибок масштаба, личности и ракурса не выявлено. Финальная художественная приёмка — **только явным решением владельца**.
- Архив REVIEW PNG+metadata `/QISSA/production/seven_roads/series30/review/S4E10/`.
- **S4E10-A01 0/1 art accepted, NOT uploaded/NOT wired; S4E8 still 0/2**. После возможного принятия: master/WebP → Library → подтверждённый Storage upload → независимый SHA → additive RU/UZ overlay → CI. Не выполнять merge/deploy/publish.

## OWNER ART ACCEPTED 2026-11-17 — S4E10-A01, production WebP pending upload

Owner explicitly replied **«принимаем. работай далее»** to the S4E10-A01 review image. This accepts **this concrete rendered v1 artwork** only. No advance approval of other images or release.

- Official asset_id: `seven_roads_s2_story7_farid_danyar_prison_window_01_APPROVED`.
- Approved pixel-identical original master PNG `/QISSA/production/seven_roads/series30/stage1/S4E10/seven_roads_s2_story7_farid_danyar_prison_window_01_APPROVED.png` (1672×941, 2663911 bytes, SHA256 `352de1d1a9a055824dc32080c286c0a4843b830adf46f8b496257d5f788fb33f`).
- WebP `/QISSA/production/seven_roads/series30/stage1/S4E10/seven_roads_s2_story7_farid_danyar_prison_window_01_APPROVED.webp` (quality 90, method 6, 356286 bytes, SHA256 `b99316fbbd6d711ccf34c12e3f040bca0bc3ec2fae09b85da0242608c3f360d3`). Metadata adjacent. Both real files saved to QISSA Library, original REVIEW remains for historical comparison.
- Exact desired Supabase storage bucket `story-images`; object path `seven-roads/season2_tier_a_v2/seven_roads_s2_story7_farid_danyar_prison_window_01_APPROVED.webp`. SQL read of `storage.objects` for this filename returned **zero records**; not uploaded. Available connector lacks binary Supabase Storage upload and there is no authorized substitute. **Never fabricate a successful upload or insert storage metadata without binary**.
- RU/UZ exact unique `post_choice_text` anchor above remains valid. Prepare `SERIES30-S4E10-A01` as **additive overlay in** `src/data/series30ApprovedSceneSlots.ts` and URL in `src/data/authoredStoryAssets.ts` **only after** actual public GET + MIME `image/webp` + byte count 356286 + SHA256 verification. Ensure slot mapped to display episode S4E10 (after the virtual split), `kind=shared`, no spoiler leak before choice.
- Update QA counts from 26/52 to 27/54; assert S4E10 gallery and chronological ordering with existing seal-comparison/ending-hook art; browser smoke and independent SHA must pass. Preserve existing RU/UZ stories, old progress, all IDs and 26 approved runtime images.
- Status now **art accepted 27/29**, **technically integrated 26/29**; S4E8 remains blocked at 0/2. **PR #334 Draft only**, no merge/deploy/publish.

## 2026-11-17 — Storage object appeared; draft runtime wire, exact CI pending

- Owner confirmed file uploaded; `storage.objects` in QISSA Supabase project shows exact object `seven-roads/season2_tier_a_v2/seven_roads_s2_story7_farid_danyar_prison_window_01_APPROVED.webp`, content type `image/webp` and **356286 bytes**. Original approved derivative hash `b99316fbbd6d711ccf34c12e3f040bca0bc3ec2fae09b85da0242608c3f360d3`; independently verified remote SHA **only upon passing the PR CI remote-public-WebP script**.
- Additive runtime slot `SERIES30-S4E10-A01` anchors post-choice text uniquely in both RU/UZ; story_id `seven_roads_obratno_v_ordan`, part_id `story7_part_1_back_to_ordan`, same non-branch scene for both paths; virtual reader episode S4E10.
- Required QA: S4E10 gallery ordering existing Aras seal comparison → **Farid/Daniyar window** → existing ending hook; S4E9 contains **no S4E10 art**; unread scene locked; after seen only this scene unlocked, later ending hook remains locked. 27 approved hosted assets, 54 unique RU/UZ text anchors; reader-split, typecheck/build/browser CI and full public GET/MIME/size/SHA to verify.
- **ART accepted 27/29**, TECH still **26/29 until CI success**. No merge/deploy/publish.
