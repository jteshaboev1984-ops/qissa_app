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

**Плановый объём (без изменений):** 4 сезона 5/4/11/10 = 30 серий; исходная база 73 видимых изображения/80 уникальных, целевой объём 121 видимых, новые **29 Stage1 + 19 Stage2 + обложка 4 сезона**. **Актуальное состояние 2026-11-16:** 13/29 новых художественно приняты; **12/13 уже загружены, проверены по SHA и интегрированы в RU/UZ чтение**; только **S3E3-A02** принят, сохранён в Library, но ещё не загружен и не интегрирован. Следующие новые stage1 сцены: S3E6 (1), S3E10 (2), S3E11 (2), затем четвёртый сезон по ART_QUEUE.

**Что делать сейчас:**
- Сначала прочесть актуальный HEAD PR #334, `ART_QUEUE`, `series30ApprovedSceneSlots.ts` и `authoredStoryAssets.ts`; не начинать проект заново.
- **S3E3-A02 «Темур во дворе каравана»**: правильный кадр найден и условно художественно принят после трёх прежних отклонённых попыток. Master PNG, WebP и SHA JSON сохранены в QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E3/`. WebP `seven_roads_s3e3_temur_caravan_courtyard_02_APPROVED.webp`, **299718 байт**, SHA-256 `ba66f3835ed7acea64dfcf3da17985f131a93d813310e5d9930d284bd1701c14`. Пользователь должен загрузить именно этот WebP в бакет `story-images` под префиксом `seven-roads/season2_tier_a_v2/` **до runtime**.
- После загрузки подтвердить Storage object и независимый GET/MIME/bytes/SHA в GitHub Actions; добавить `SERIES30-S3E3-A02` в additive overlay `src/data/series30ApprovedSceneSlots.ts` и URL в `src/data/authoredStoryAssets.ts`, с `story_id=seven_roads_tayna_vostochnogo_karavana`, `part_id=story2_part_5_first_investigation`, phase `story_text`, exact RU `Темур остановился посреди двора.` / UZ `Temur hovli o‘rtasida to‘xtadi.`. Внутри reader **S3E3**. Проверить правильный порядок «тревожный колокол → старый кадр сургуча → Темур в караванном дворе», отсутствие раскрытия веток и сохранённый прогресс.
- **S3E3-A01 уже полностью интегрирован**: Seven Roads CI **#43824446846** SUCCESS, Season 2 Tier A **#43824446863** SUCCESS, 12/12 публичных WebP SHA, 24/24 RU/UZ anchors, typecheck, build, reader/gallery/browser smoke.
- Продолжить оставшуюся Stage1 очередь: S3E6, S3E10, S3E11, S4E1, S4E3–6, S4E8–10, проверяя точные RU/UZ JSON, хронологию, существующие изображения и реально просмотренные референсы. Одно изображение за раз.
- После принятия каждого кадра — PNG master/WebP/SHA, QISSA Library, фактическая Storage загрузка, remote SHA proof, runtime overlay, CI/gallery/browser. Исходные художественные/литературные JSON, выборы и ключи прогресса защищены, не изменять.

**Ограничения:** никакого преждевременного деплоя в production, слияния PR, выдуманных сцен, дублей, потери старых иллюстраций или изменения литературного текста ради картинки. Старые аудиты 7-пакетного Season 2 — исторические и не заменяют реестр 30 серий.

Продолжить непосредственно с принятого S3E3-A01 (ожидает загрузки в Supabase) и незавершённого S3E3-A02 (нужна новая чистая генерация). Не начинать проект заново.

## Техническая сверка на 2026-11-16

- 12 принятых WebP доступны в Supabase с проверенными MIME/размером/SHA: remote verifier **12/12** в CI #43824446846.
- Сцены S2E1 (2), S2E2 (1), S2E3 (3), S2E4 (2), S4E2 (3), S3E3-A01 (1): 12/12 runtime integrated. Совпадающие RU/UZ anchors **24/24**, галерея блокирует ещё не прочитанные сцены; reading 30, 4 seasons 5/4/11/10, typecheck/build/browser smoke PASS.
- S3E3-A02 accepted **only in Library**; not yet uploaded/verified, do not wire prematurely. 13/29 art accepted, 12/29 fully integrated.
- PR Draft, merge and deploy not authorised.
