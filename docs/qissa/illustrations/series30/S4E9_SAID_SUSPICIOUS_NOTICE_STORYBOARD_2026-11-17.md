# S4E9-A01 «Подозрительное письмо» — REVIEW v1, художественная приёмка владельца ожидается

**Дата:** 2026-11-17. **Источник:** approved 30-series ART_QUEUE (S4E9 Stage1 1 new shared scene; status before review 0/1), QISSA World Bible V2. **PR:** #334 Draft / branch `qissa/four-seasons-chronological-runtime-20261112`.

## Проверенный литературный момент
- `story_id=seven_roads_obratno_v_ordan`, `story_version=interactive-v17-visible-inherited-defect`, `part_id=story7_part_1_back_to_ordan`, `phase=story_text`, `kind=shared`, **виртуальная серия S4E9** `Обратно в Ордан / Ordanga qaytish`.
- **RU точный полный абзац after_text, 1/1:** `Когда все закончили, он положил на стол дорожное уведомление из Араса.` (40-й абзац исходного story_text, если считать и заголовок). RU source SHA `e5fde8ac773375a334ffab1c80fe621967674a3a`.
- **UZ точный полный абзац after_text, 1/1:** `Hamma tugatgach, u Arasdan kelgan yo‘l xabarnomasini stolga qo‘ydi.` (тот же 40-й абзац). UZ SHA `67101f138790269f3929f0c2ad3c4cd218242651`.
- В `src/data/sevenRoadsReadingSeries.ts` S4E9/S4E10 split происходит только после RU `Ответ из Араса пришёл после полудня.` / UZ `Arasdan javob tushdan keyin keldi.` (100-й абзац), поэтому S4E9-якорь лежит **до** разреза, в правильной виртуальной серии.
- До кадра: колонна возвращается в Ордан после захода солнца; Фарид снова под охраной; Саид, Рустам, Данияр, Рахим и дети обсуждают поддельную дорожную охрану. Рустам кладёт металлический знак на стол; Саид выслушивает доклады.
- **Момент кадра:** Саид кладёт **единственное ранее полученное** дорожное уведомление Араса на деревянный стол в маленькой комнате караула; Темур (12, бирюзовый чапан/синяя узорная шапочка) и Самира (12, бордовый костюм, одна коса) с интересом наблюдают; взрослые сосредоточены, без новых неканоничных персонажей.
- После кадра Саид решает запросить подтверждение из Араса. Только на следующий день придёт свежая подлинная печать для **сравнения двух оттисков**; НЕ изображать будущую проверку печатей, разгадку фальсификации, последствия следующего выбора. Оригинальные RU/UZ JSON и IDs не менять.

## Художественный кандидат — REVIEW, НЕ APPROVED

- Файл: `seven_roads_s4e9_said_suspicious_road_notice_A01_REVIEW_v1.png`.
- Image generation `d90c1730-c6fa-4b70-abd7-f27495ea1593`; 1672×941 PNG, **2,637,666 bytes**, SHA256 `ec49fd0081076a7d1c65860037c2919c94729e57daf07eae7817230631796ab5`.
- Фактические образцы изучены: `seven_roads_said_ref_01_APPROVED.png` (канонический Саид: седоватые волосы/борода, тёмная бордовая одежда), `seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED.png` (утверждённый визуальный возраст/костюмы Темура и Самиры), `01_heroes_horses_approved.png` (герои).
- Самопроверка: один старый документ перед Саидом, без второй сравнительной печати; 4 взрослых и 2 ребёнка, узнаваемые цвета одежды, Темур с синим головным убором, Самира с одной косой, спокойная сцена в караулке, отсутствие боя, лошадей, спойлеров, современного оборудования и жестокости. Детали лиц/костюмов и документа **предоставлены владельцу для окончательной визуальной оценки**, самостоятельное APPROVED не присваивать.
- Архив REVIEW (не production): `/QISSA/production/seven_roads/series30/review/S4E9/` — PNG + metadata JSON, точная SHA/bytes в metadata.
- **No approved asset ID, no production WebP, no Supabase Storage, no runtime gallery/reader slot, no queue accepted counter increase.** Stage1 25/29 art accepted and 25/29 integrated, S4E9-A01 0/1, S4E8 0/2. Возвращаться к S4E8 только после отдельного решения владельца. No merge, deploy, publish.
