# QISSA — продолжение производства 30 серий «Семь дорог»

**Дата актуализации:** 2026-11-16. **Граница:** сохранять continuity, не начинать проект заново.

## Репозиторий и ограничения

- GitHub: https://github.com/jteshaboev1984-ops/qissa_app
- PR #334 (Draft, open): https://github.com/jteshaboev1984-ops/qissa_app/pull/334
- Ветка: `qissa/four-seasons-chronological-runtime-20261112`. Проверить актуальный HEAD перед изменениями.
- План неизменен: четыре сезона 5/4/11/10 = 30 серий; **29 новых иллюстраций Stage 1**, 19 Stage 2 и отдельная обложка сезона 4.
- НЕЛЬЗЯ менять authored RU/UZ JSON, сюжетные выборы, прогресс, существующие принятые изображения, публиковать приложение или объединять PR.

## Текущее состояние

**14/29 Stage 1 художественно принято:** 13 загружены в Supabase Storage и подключены к scene overlay; **S3E6-A01 принят, но не загружен**. Для 13-го кадра S3E3-A02 `seven_roads_s3e3_temur_caravan_courtyard_02_APPROVED.webp` независимая проверка HTTP/MIME/bytes/SHA прошла: GitHub Actions **#43826262741**, полный комплект **13/13** WebP. Runtime RU/UZ для S3E3-A02 добавлен коммитом `ea8e7b57d10ad7a3d7758f107993a494810850da`. Первые две проверки на этом коммите **FAILED из-за ошибки в regression-тесте**: он сравнивал `slice(0,2)` с ожидаемыми тремя ID. Исправлено на `slice(0,3)` в следующем коммите; **новый результат CI надо проверить**, прежде чем называть S3E3 stage 1 полностью завершённой.

## Первое действие

1. Проверить текущие Seven Roads CI и Season 2 Tier A Slot Check на HEAD; удостовериться, что `check:reading-series-30`, `check:four-seasons`, `typecheck`, `build`, browser smoke и bilingual gallery regression прошли; при успехе отметить S3E3 в `ART_QUEUE` как `stage_1_complete`.
2. **S3E6-A01 «Надир бросился бежать»**: новая правильная генерация художественно принята после проверки RU/UZ и канона. WebP `seven_roads_s3e6_nadir_runs_between_wagons_01_APPROVED.webp`, **267232 байта**, SHA256 `4fb68e473f6a11573278142fad86c908e6d427b873b9952dbda839a94e96bf14`, PNG и метаданные в QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E6/`. Пока **НЕ загружен в Storage**, runtime НЕ подключён. User upload -> проверить `storage.objects` + GitHub CI public GET/MIME/byte/SHA -> добавить scene slot в `src/data/series30ApprovedSceneSlots.ts` и asset URL в `src/data/authoredStoryAssets.ts` (без литературных изменений).
3. Для S3E6 точный authored `story_id=seven_roads_tayna_vostochnogo_karavana`, `part_id=story2_part_8_stop_nadir`, `phase=story_text`, virtual episode **S3E6**, RU `Он проскочил между двумя повозками и вылетел через боковой проезд за мастерские.`, UZ `U ikki arava orasidan o‘tib, ustaxonalar ortidagi yon yo‘lakka chiqdi.`. После слота проверить 2 старых альтернативных choice кадра на неизменность, галерею и защиту от спойлеров, непрерывность между S3E5/S3E6.
4. Следующие сцены Stage 1: S3E10 (2), S3E11 (2), затем очередные S4 согласно `ART_QUEUE`. Каждый кадр — отдельно, прочитать полный фрагмент RU/UZ, 2 соседних события, посмотреть утверждённые Library PNG, только потом генерировать. Не переносить отклонённые варианты и не использовать названия файлов вместо проверки изображений.

## Нужные документы
- `docs/qissa/41_QISSA_30_Series_Illustration_Production_Plan_2026_11_14.md`
- `docs/qissa/illustrations/series30/ART_QUEUE_2026-11-14.json`
- `docs/qissa/illustrations/series30/PRODUCTION_RUNBOOK.md`
- `docs/qissa/illustrations/series30/S3E3_MORNING_AFTER_THEFT_STORYBOARD_2026-11-16.md`
- `docs/qissa/illustrations/series30/S3E6_NADIR_ESCAPE_STORYBOARD_2026-11-16.md`
- `docs/qissa/ai/SEVEN_ROADS_WORLD_BIBLE_V2.md`
- `src/data/sevenRoadsReadingSeries.ts` и `src/data/authoredStoryAssets.ts`.

**Все дальнейшие изменения строго в рабочей ветке PR, без merge/deploy.**
