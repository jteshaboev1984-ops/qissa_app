# QISSA — продолжение производства 30 серий «Семь дорог»

**Дата актуализации:** 2026-11-16. **Граница:** сохранять continuity, не начинать проект заново.

## Репозиторий и ограничения

- GitHub: https://github.com/jteshaboev1984-ops/qissa_app
- PR #334 (Draft, open): https://github.com/jteshaboev1984-ops/qissa_app/pull/334
- Ветка: `qissa/four-seasons-chronological-runtime-20261112`. Проверить актуальный HEAD перед изменениями.
- План неизменен: четыре сезона 5/4/11/10 = 30 серий; **29 новых иллюстраций Stage 1**, 19 Stage 2 и отдельная обложка сезона 4.
- НЕЛЬЗЯ менять authored RU/UZ JSON, сюжетные выборы, прогресс, существующие принятые изображения, публиковать приложение или объединять PR.

## Подтверждённое состояние на 2026-11-16

**14/29 Stage 1 художественно принято.** Из них 13/29 загружены в Supabase, проверены по публичным HTTP/MIME/байтам/SHA и подключены к RU/UZ чтению. Сцена **S3E3-A02** полностью интегрирована; Seven Roads CI **#43827195071 — SUCCESS**, Season 2 Tier A Slot Check **#43827195114 — SUCCESS**, весь комплект **13/13 WebP**, **26/26 bilingual anchors**, gallery/reading 30/4 seasons/typecheck/build/browser smoke PASS. Первоначальный тестовый дефект `slice(0,2)` исправлен на `slice(0,3)`. S3E3 Stage1 **2/2 COMPLETED**.

**14-й принятый кадр S3E6-A01** `seven_roads_s3e6_nadir_runs_between_wagons_01_APPROVED.webp` (267232 байта, SHA256 `4fb68e473f6a11573278142fad86c908e6d427b873b9952dbda839a94e96bf14`) сохранён PNG/WebP/metadata в QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E6/`. **Его ещё нужно загрузить** в Supabase bucket `story-images`, путь `seven-roads/season2_tier_a_v2/` с точным именем. Пока нет подтверждённого Storage, runtime слот не подключать. После загрузки выполнить независимый remote SHA checker + RU/UZ overlay `story2_part_8_stop_nadir`, `phase=story_text`, anchors RU `Он проскочил между двумя повозками и вылетел через боковой проезд за мастерские.` / UZ `U ikki arava orasidan o‘tib, ustaxonalar ortidagi yon yo‘lakka chiqdi.`, затем полные проверки и обе старые choice-картинки оставить.

**S3E10 «Курьер», Stage1 0/2.** Storyboard `docs/qissa/illustrations/series30/S3E10_COURIER_STORYBOARD_2026-11-16.md`: A01 дети учат маршрут к арасским воротам (без погони), A02 молодой стражник подходит к водопою. Оба с уникальными RU/UZ якорями. Генератор в трёх попытках снова показал побег Надира со стражниками, все три кадра **REJECTED**, не сохранялись. В следующий раз лучше изолировать визуальный контекст и использовать Library refs `seven_roads_s2_story3_sarvan_market_01_APPROVED.png` и `seven_roads_s2_story3_sarvan_old_caravan_yard_01_APPROVED.png`, а также `01_heroes_horses_approved.png`. Если не удаётся — оставить как блокер, не выдавать похожую сцену за утверждённую.

Далее по плану: **S3E11** (2), S4E1 и остальные S4 по `ART_QUEUE`, строго 29 + 19 + 1 обложка, без пересмотра количества. Для каждой иллюстрации: прочитать точный RU/UZ абзац и соседние события, проверить визуальные канонические референсы в QISSA Library, сгенерировать только один кадр, самостоятельно отбраковывать неправильный, только после художественной приёмки PNG/WebP/SHA/Library/Storage/reader/CI.

## Нужные документы
- `docs/qissa/41_QISSA_30_Series_Illustration_Production_Plan_2026_11_14.md`
- `docs/qissa/illustrations/series30/ART_QUEUE_2026-11-14.json`
- `docs/qissa/illustrations/series30/PRODUCTION_RUNBOOK.md`
- `docs/qissa/illustrations/series30/S3E3_MORNING_AFTER_THEFT_STORYBOARD_2026-11-16.md`
- `docs/qissa/illustrations/series30/S3E6_NADIR_ESCAPE_STORYBOARD_2026-11-16.md`
- `docs/qissa/ai/SEVEN_ROADS_WORLD_BIBLE_V2.md`
- `src/data/sevenRoadsReadingSeries.ts` и `src/data/authoredStoryAssets.ts`.

**Все дальнейшие изменения строго в рабочей ветке PR, без merge/deploy.**
