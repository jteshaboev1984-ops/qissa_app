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

**Плановый объём (без изменений):** исходно 80 различных сюжетных изображений, 73 видимых за одно прохождение; цель — 121. Требуются **48 общих сюжетных кадров**: 29 в Этапе 1 и 19 в Этапе 2, плюс обложка сезона 4. **Фактическое состояние на 2026-11-16:** 11 из 29 новых художественно приняты, 10 из них загружены в Supabase, SHA-проверены и интегрированы в RU/UZ чтение, один (S2E4-A02) принят и лежит в QISSA Library, но ещё НЕ загружен и НЕ интегрирован. Следующая серия к производству — S3E3, её два кадра НЕ приняты.

**Что делать сейчас:**
- Проверить HEAD PR #334 и текущие `ART_QUEUE`, `series30ApprovedSceneSlots.ts`, `authoredStoryAssets.ts`, storyboard, текущий Storage/CI.
- **S2E4-A02 «Дорога вместо стен»**: пользователь ещё должен загрузить `seven_roads_s2e4_western_road_map_02_APPROVED.webp` (192494 байта, SHA256 `fc44e2f2d002bf08db2d063ed804c3135392fef3e9e702e4ea7514f15131dcc7`) из QISSA Library `/QISSA/production/seven_roads/series30/stage1/S2E4/` в `story-images/seven-roads/season2_tier_a_v2/`. После подтверждения Storage выполнить независимый remote SHA/GET и подключить в исходный `story1_part_3_network_sign` (`post_choice_text`) по RU `Потом провёл пальцем по дороге на запад.` / UZ `Keyin barmog‘ini g‘arbga ketadigan yo‘l bo‘ylab yurgizdi.`, виртуально **S2E4**, затем RU/UZ gallery/CI.
- **S3E3 «Утро после кражи»**: два новых кадра stage 1. Storyboard `docs/qissa/illustrations/series30/S3E3_MORNING_AFTER_THEFT_STORYBOARD_2026-11-16.md`; точные сцены A01 «Тревожный колокол» (12-летний Темур у окна Араса) и A02 «Темур во дворе каравана» (после получения пояса Всадника короля, до выбора метода расследования). Перед генерацией смотреть real Library refs, которые уже импортированы в Canva как `MAHbDDmma3g` и `MAHbDD6Ipiw`.
- S3E3-A01 НЕ сгенерирован корректно: два результата ImageGen REJECTED (посторонний dashboard, затем S2E4 лесные всадники), Canva генерация заблокирована `quota_exceeded`. Возобновлять только при корректном инструменте; **никакого APPROVED или интеграции** до художественной приёмки.
- Далее оставшиеся позиции этапа 1 — S3E6, S3E10, S3E11, S4E1, S4E3–6, S4E8–10, сверяя `ART_QUEUE` и не меняя 29+19+обложку.
- После утверждения каждого нового кадра сохранять PNG/WebP/sha256 в QISSA Library, подтвердить публичную Storage загрузку, затем scene-only overlay в `src/data/series30ApprovedSceneSlots.ts` и URL в `src/data/authoredStoryAssets.ts`. Исходные RU/UZ JSON/выборы/ключи прогресса SHA-locked и не изменяются.
- Прогонять проверку галереи, виртуальных границ, 5/4/11/10 серий, RU+UZ, typecheck/build и браузерный smoke; никогда не объединять PR или публиковать приложение без разрешения владельца.

**Ограничения:** никакого преждевременного деплоя в production, слияния PR, выдуманных сцен, дублей, потери старых иллюстраций или изменения литературного текста ради картинки. Старые аудиты 7-пакетного Season 2 — исторические и не заменяют реестр 30 серий.

Начни с аудита и конкретного storyboard первых иллюстраций Этапа 1.

## Подтверждённые GitHub Actions / Storage (2026-11-16)

- Все десять прежних художественно принятых файлов этапа 1 найдены в Supabase Storage в `seven-roads/season2_tier_a_v2/`. Важно: исправленный конь S4E2-A01 хранится как `seven_roads_s4e2_bay_horse_roadside_escape_01_APPROVED_v2.webp`, не заменять на старый файл без `_v2`.
- Independent SHA/mime/length GET remote **10/10**: Seven Roads CI #43804819808, pass.
- S2E4-A01 окончательно подключён в правильную виртуальную S2E4; Seven Roads CI **#43805029277** и Season 2 Tier A **#43805029409** SUCCESS. **10/10 принятых ассетов, 20/20 RU/UZ якорей**, галерея/блокировки, typecheck, build, browser smoke, без изменения литературных JSON.
- S2E4-A02 мастер PNG 1672×941, WebP 192494 байта и metadata в QISSA Library. Нет подтверждённой загрузки Storage: не считать интегрированным.
- S3E3 storyboard создан; обе новые позиции ещё `not_started`.
