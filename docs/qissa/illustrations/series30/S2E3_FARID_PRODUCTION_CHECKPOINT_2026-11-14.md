# QISSA — S2E3 «Фарид»: художественный производственный checkpoint

Дата: 2026-11-14. Основа: PR #334, ветка `qissa/four-seasons-chronological-runtime-20261112`.
Исходный литературный пакет: `seven_roads_korolevskoe_serebro` / `interactive-v5`, `part_id=story1_part_3_network_sign`.
**Не изменять литературный текст, choices, прогресс и существующие утверждённые изображения.**

## Текущее состояние по результатам CI — 15 ноября 2026 г.

**S2E3 Этап 1: 3/3 изображения приняты, находятся в Library и подключены в неопубликованном PR #334.**
WebP A01/A02/A03 сохранены в публичном `story-images`; независимый `GET + MIME + bytes + SHA-256` подтвердил все три файла (и отдельную S4E2 A01 v2) в workflow [43698397387](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/43698397387). Браузерные проверки пройдены в [43698397401](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/43698397401).

Новые слоты внедрены **не правкой исходных SHA-locked литературных JSON**, а через `src/data/series30ApprovedSceneSlots.ts` и `src/data/authoredStoryAssets.ts`. Сюжет, `story_id`, `story_version`, выборы и существующий прогресс не изменены.

A03: `phase=post_choice_text`, RU `Данияр заметил этот взгляд.`, UZ `Daniyar bu qarashni payqadi.`, находится в читательской серии S2E3 до виртуального разреза S2E4. Публичный asset: `https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/season2_tier_a_v2/seven_roads_s2e3_farid_capital_trial_glance_03_APPROVED.webp`. SHA256: `b9c8f1ea0b446c4ac3daaa7c4bbea3ff14995256048b173ffc4d8741fb1d16dd`.

**Примечание:** разделы ниже исторические checkpoints до загрузки. Указанные в них статусы `NOT uploaded`, `NOT integrated` для A01–A03 устарели. Специальная ручная проверка пикселей в живой браузерной сессии ещё не проводилась. **Релиз, merge PR и публикация не разрешены и не выполнялись.**

## Актуальная проверка
- Исходные RU/UZ JSON прочитаны по HEAD `670fa9ba23eb43a1143154e3b483116e18f03502`.
- Виртуальная граница S2E3/S2E4: `post_choice_text` **перед** RU `К вечеру Ордан снова выглядел обычным.` / UZ `Kechga kelib Ordan yana odatdagidek ko‘rina boshladi.`.
- В реестре S2E3 изначально нет сюжетных картинок; план этапа 1: **три новых общих кадра**.
- Оригинальные одобренные визуальные образцы найдены и просмотрены: `QISSA_MASTER_REFERENCE_user_selected.png`, `01_heroes_horses_approved.png`, `seven_roads_s2_story1_danyar_pursuit_01_APPROVED.png`, `seven_roads_s2_story1_kamran_rescues_comrade_01_APPROVED.png`, `seven_roads_s2_story1_royal_silver_attack_01_APPROVED.png`.
- Всего по 30 сериям структурный аудит исходных RU JSON и девяти разрезов сошёлся с очередью: **30/30** серий, **73/73** видимых изображений в одном маршруте; этап 1 **29/29**.

## S2E3-A01 — «Он назвался Фаридом»
- Состояние: **изображение принято владельцем условно, соответствие RU/UZ сцене вручную подтверждено; master + WebP + метаданные сохранены в QISSA Library**.
- `kind=shared`; `phase=story_text`; RU `after_text: — Фарид.`; UZ `after_text: — Farid.`. Оба точных якоря единственны в тексте.
- В кадре: Камран задержан возле старых скотных ворот Орданы; оружие отобрано, руки связаны, два стражника и Данияр наблюдают. Кадр сверялся с ранее утверждённой внешностью Камрана и Данияра.
- `asset_id=seven_roads_s2e3_farid_gate_arrest_01_APPROVED`.
- Library: `/QISSA/production/seven_roads/series30/stage1/S2E3/`.
- PNG: `seven_roads_s2e3_farid_gate_arrest_01_APPROVED.png` (1672×941, 2,958,487 байт, SHA-256 `b685be81a6acf81a17abc428e0bf10671797483eac63c2afa29d4139e03218c9`).
- WebP: `seven_roads_s2e3_farid_gate_arrest_01_APPROVED.webp` (532,314 байт, SHA-256 `00f1c705bbd1c446c354a00852039b57a867ff7166839dc88da5170e03c9a8b1`).
- **Supabase Storage upload: NOT DONE; public URL: NOT VERIFIED; reader/gallery integration: NOT DONE; runtime QA: PENDING.**

## S2E3-A02 — «Возница и Данияр: после нападения»
- **Художественная приёмка владельца: OWNER_APPROVED 2026-11-15**, оригинал и WebP сохранены в QISSA Library. Эта иллюстрация существенно отличается от утверждённого выезда повозки: крупная сцена диалога с возницей и Данияром, повозка лишь на дальнем плане.
- `kind=shared`; `phase=story_text`; `part_id=story1_part_3_network_sign`.
- **RU exact after_text:** `— Пока не знаю. Но я ещё подумаю.`
- **UZ exact after_text:** `— Hozircha bilmayman. Lekin yana o‘ylab ko‘raman.`
- **Asset ID:** `seven_roads_s2e3_driver_danyar_after_attack_02_APPROVED`.
- **Master PNG:** 1672×941, 2 909 256 B, SHA-256 `a7f7cf71f57dde5f5c3187306e21fedee014e91755a8ff4340cbdce6b1c0cb2c`.
- **WebP:** 303 376 B, SHA-256 `853e88ca1394cc61c7b8857145ad12adf22e70b12d02eadfd211a1f85d077849`.
- **Library directory:** `/QISSA/production/seven_roads/series30/stage1/S2E3/`; stored under immutable asset ID with `.png`, `.webp`, `.metadata.json` suffixes.
- **Supabase Storage: NOT UPLOADED; Public URL: NOT VERIFIED; runtime/gallery integration: NOT DONE; QA: PENDING.**

## S2E3-A03 — «В столице» — revised from-behind frame accepted

- **Art status: accepted under owner's earlier conditional instruction** (if exact narrative and approved references match, accept and continue). The earlier four incorrect bearded / older Camran candidates remain rejected.
- Reassessed surviving **revised fifth candidate** `a_detailed_richly_lit_painterly_storybook_illust.png`: young dark-haired Kamran is depicted exclusively from behind in his canonical gray travel cloak with tied hands; Danyar in identifiable bright-blue scarf carefully observes the prison commandant at a ledger. The ordinary stone guardroom and heavy door match source; no convoy or ambush is shown.
- `kind=shared`; `part_id=story1_part_3_network_sign`; `phase=post_choice_text` **before the S2E3/S2E4 virtual split**.
- **Exact RU `after_text`:** `Данияр заметил этот взгляд.`; **exact UZ `after_text`:** `Daniyar bu qarashni payqadi.`. Each occurs exactly once and precedes the reading split by 15 paragraphs.
- **Logical asset ID:** `seven_roads_s2e3_farid_capital_trial_glance_03_APPROVED`.
- **Master PNG:** 1672×941 px, 2700214 B, SHA256 `01509051f2ef227cb01ca19ac13fa5ee9b78b2613ab2e7186173632b68c3ed3b`.
- **WebP:** 1672×941 px, 286370 B, SHA256 `b9c8f1ea0b446c4ac3daaa7c4bbea3ff14995256048b173ffc4d8741fb1d16dd`.
- Files (PNG, WebP, metadata) persisted to `/QISSA/production/seven_roads/series30/stage1/S2E3/` in QISSA Library.
- **Supabase Storage: NOT uploaded. Runtime: NOT integrated. Full QISSA scene count: two hosted and connected, third owner-art accepted + in Library.** Do not invent or assume hosted public URL; require user upload, independent GET/SHA and new CI verification.

## Следующее техническое действие — только после доступной проверенной загрузки
1. Для утверждённого A01 загрузить существующий WebP в реальный Storage через поддерживаемое действие, проверить GET, content-type, размеры и SHA-256. Не придумывать публичный URL.
2. Добавить `image_slot` с точным RU `after_text` в исходный RU JSON и `image_anchor_texts[slot_id]` в UZ overlay; UZ локализатор наследует RU слоты. Никаких текстовых правок.
3. Проверить `sevenRoadsReadingSeries.ts` границу и отсутствие спойлера в галерее, обе ветви, RU/UZ.
4. Запустить `npm run check:reading-series-30`, `npm run check:four-seasons`, `npm run typecheck`, `npm run build` и визуальный smoke.
5. Только после фактического успеха отметить `stored → runtime_integrated → qa_passed`. Не деплоить, не merge PR без отдельного разрешения владельца.
