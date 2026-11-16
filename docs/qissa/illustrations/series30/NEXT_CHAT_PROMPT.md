# QISSA — продолжение производства иллюстраций (30 серий)

Ты работаешь над приложением QISSA, сказочный мир «Семь дорог» (Seven Roads). Мы **утвердили художественный объём** для читательской структуры `5 / 4 / 11 / 10 = 30 серий`: в среднем около 4 сюжетных картинок на серию (обычно 3–5), а не одинаковое абсолютное количество на каждый сезон.

**Репозиторий:** https://github.com/jteshaboev1984-ops/qissa_app
**Рабочий PR:** https://github.com/jteshaboev1984-ops/qissa_app/pull/334
**Ветка:** `qissa/four-seasons-chronological-runtime-20261112`. Сначала прочитай её актуальный HEAD, не считай указанный в документах snapshot-коммит последней версией.

**Сначала обязательно изучи:**
1. `docs/qissa/41_QISSA_30_Series_Illustration_Production_Plan_2026_11_14.md` — принятое распределение.
2. `docs/qissa/illustrations/series30/ART_QUEUE_2026-11-14.json` — точное ТЗ по количеству на каждую серию.
3. `docs/qissa/illustrations/series30/PRODUCTION_RUNBOOK.md` — порядок приёмки, создания и интеграции.
4. `src/data/sevenRoadsReadingSeries.ts`, `src/data/sevenRoadsSeasons.ts`, исходные RU/UZ authored JSON и `src/data/authoredStoryAssets.ts` — фактические тексты, границы и картинки.
5. `docs/qissa/ai/SEVEN_ROADS_WORLD_BIBLE_V2.md`, `docs/qissa/season2/2026-11-11_temur_samira_costume_chronology_audit.md` — визуальный канон персонажей, лошадей и хронология одежды.
6. Реальные одобренные визуальные эталоны из QISSA Library (`/QISSA/visual_refs/seven_roads_v1/`), при доступности. Не подменяй просмотр изображений их именами.

**Плановый объём (без изменений):** исходно 80 различных сюжетных изображений, 73 видимых за одно прохождение; цель — 121. Требуются **48 общих сюжетных кадров**: 29 в Этапе 1 и 19 в Этапе 2, плюс обложка сезона 4. **Фактическое состояние на 2026-11-16:** 12 из 29 новых художественно приняты; **11/11 предыдущих** проверены и интегрированы в Supabase/RU+UZ runtime, последний S3E3-A01 принят, хранится в QISSA Library, **ещё не загружен и не интегрирован**. S3E3-A02 не принят, после трёх ошибочных генераций требует самостоятельного чистого кадра караванного двора.

**Что делать сейчас:**
- Проверить HEAD PR #334 и текущие `ART_QUEUE`, `series30ApprovedSceneSlots.ts`, `authoredStoryAssets.ts`, storyboard, текущий Storage/CI.
- **S2E4-A02 «Дорога вместо стен»**: теперь успешно загружена, SHA256 проверен, интегрирован в RU/UZ чтение и галерею. CI Seven Roads **#43806831072** и Tier A **#43806831055** SUCCESS; **11/11** uploaded WebP, **22/22** RU/UZ anchors, build/typecheck/browser smoke PASS. S2E4 stage1 2/2 закрыта.
- **S3E3 «Утро после кражи»**: два новых кадра stage1, storyboard `docs/qissa/illustrations/series30/S3E3_MORNING_AFTER_THEFT_STORYBOARD_2026-11-16.md`. **A01 «Тревожный колокол» принят**: 12-летний Темур в бирюзово-синем костюме у окна утром в Арасе, граждане идут к центру, сигнал тревоги. PNG-master/WebP/metadata сохранены в Library `/QISSA/production/seven_roads/series30/stage1/S3E3/`. WebP `seven_roads_s3e3_morning_alarm_window_01_APPROVED.webp` **249700 bytes**, SHA256 `60ce0110b06f70885e7ab8c2e0e3e744ecea4a19b0517c8d955a593b94a91271`, **пока НЕ загружен в Storage, НЕ интегрирован в runtime**. Ждём пользовательской загрузки по точному пути `story-images/seven-roads/season2_tier_a_v2/`, затем verify:remote и overlay (part `story2_part_5_first_investigation`, story_text, RU `Люди двигались в сторону центра города.`, UZ `Odamlar shahar markazi tomon ketayotgandi.`).
- **S3E3-A02 «Темур во дворе каравана»** не принято: генерации с Самирой и лошадьми в горах, затем повтор кадра S2E4 с картой, затем повтор лесной сцены S2E4 с Данияром — **все REJECTED**. Canva остановлена лимитом квоты; Gamma вернула HTTP 402 Insufficient credits. Повторять те же генерации без изоляции контекста не следует. Требуется **только один 12-летний Темур** в бирюзовом дорожном костюме с поясом Всадника короля, с церемониальной саблей в ножнах, в оживлённом караванном дворе Араса, торговцы и стражники у ворот, всё до выбранного способа расследования. Уникальные RU `Темур остановился посреди двора.`, UZ `Temur hovli o‘rtasida to‘xtadi.`. Канон-референсы в Canva уже импортированы как `MAHbDDmma3g` и `MAHbDD6Ipiw`. Не использовать ошибочные файлы.
- Далее оставшиеся позиции этапа 1 — S3E6, S3E10, S3E11, S4E1, S4E3–6, S4E8–10, сверяя `ART_QUEUE` и не меняя 29+19+обложку.
- После утверждения каждого нового кадра сохранять PNG/WebP/sha256 в QISSA Library, подтвердить публичную Storage загрузку, затем scene-only overlay в `src/data/series30ApprovedSceneSlots.ts` и URL в `src/data/authoredStoryAssets.ts`. Исходные RU/UZ JSON/выборы/ключи прогресса SHA-locked и не изменяются.
- Прогонять проверку галереи, виртуальных границ, 5/4/11/10 серий, RU+UZ, typecheck/build и браузерный smoke; никогда не объединять PR или публиковать приложение без разрешения владельца.

**Ограничения:** никакого преждевременного деплоя в production, слияния PR, выдуманных сцен, дублей, потери старых иллюстраций или изменения литературного текста ради картинки. Старые аудиты 7-пакетного Season 2 — исторические и не заменяют реестр 30 серий.

Продолжить непосредственно с принятого S3E3-A01 (ожидает загрузки в Supabase) и незавершённого S3E3-A02 (нужна новая чистая генерация). Не начинать проект заново.

## Подтверждённые GitHub Actions / Storage (2026-11-16)

- Все **11/11** художественно принятых и ранее размещённых WebP (S2E1 2, S2E2 1, S2E3 3, S2E4 2, S4E2 3) найдены в Supabase, MIME и размеры совпали, и независимая удалённая SHA256 проверка прошла: Seven Roads CI **#43806638375** (11/11).
- После подключения S2E4-A02 зафиксированы **Seven Roads CI #43806831072 — SUCCESS** и **Season 2 Tier A Slot Check #43806831055 — SUCCESS**: **11/11** опубликованных в Storage WebP, **22/22** RU/UZ anchors, правильные виртуальные серии, gallery lock/unlock, typecheck, build, browser smoke.
- **12-й художественно принятый** новый файл S3E3-A01 хранится только в QISSA Library: `seven_roads_s3e3_morning_alarm_window_01_APPROVED.webp`, 249700 байт, SHA256 `60ce0110b06f70885e7ab8c2e0e3e744ecea4a19b0517c8d955a593b94a91271`, **НЕ в Storage**; runtime не включать до подтверждённой загрузки и remote CI.
- **S3E3-A02**: нет правильного кадра, все три кандидата отклонены. Canva — quota exceeded, Gamma — HTTP 402 insufficient credits. Подготовленный точный RU/UZ storyboard и импортированные канонические Canva ref IDs сохранены. Не меняйте утверждённые кадры вместо создания A02.
- PR #334 остаётся открытым Draft, литература/выборы/сохранённый прогресс без изменений, merge/deploy не выполнять.
