# QISSA — Owner decisions: revised literary text, King speech and title V2 (2026-11-09)

**Status:** OWNER-DIRECTED EDITORIAL REVIEW / VERSIONED DRAFT ONLY. Checkpoint source: Issue #322, DRAFT PR #321. Do NOT merge, publish, change World Bible V1, approved literary masters, production, progress or story/release flags. Native-UZ artistic acceptance has not been performed.

## 1. Decisions from owner feedback, by the 13 comparison items

| No. | Decision | Current handling |
|---|---|---|
| 1 | Approved conditional Shamol jump/precise control | Canon V2 replacement for World Bible §3.21 **approved in direction**, V1 retained frozen |
| 2 | Check if metal-evidence fix exists in a branch | 46 branch refs inspected; main, active PR branch and surviving later branch all have identical original Story 2 source blob `23359bfe...`; only the DRAFT proposal corrects custody, not an authored source |
| 3, 4 | Approved Samira's real motive and torn right sleeve | Original E03/E04 proposals retained |
| 5 | Take secret note first; read only hidden | E02 RU/UZ proposal revised accordingly; after-the-fact reconstruction hashes updated; exact order is tested |
| 6, 7 | Approved precise Shamol duplicate removal and unjustified animal-care tag removal | STYLE-01/META-01 proposal retained |
| 8 | Approved time-bridge but rejected multiple 2–3-word sentences | R01 proposal replaced by one natural fuller paragraph, see §2 |
| 9–11 | Approved plot-memory, Samira observations, and adult risk response | R02–R04 in separate 8-operation owner follow-up draft with source SHA guards; no master changes |
| 12 | King must visibly care publicly, without publicly humiliating children | Revised STYLE-02 candidate in §3; **awaiting owner approval of precise lines** |
| 13 | Selected «Всадник короля» | Official title direction locked for proposed World Bible V2, §4; not a blanket string replace |

## 2. R01 — longer, natural scene; preserve visible wait

**File:** `src/data/authored/prazdnikMuzhestvaV3.ru.json` `/parts/5/story_text`, alternative wait/leave paths merge here. **Before:**

> Чтобы приближающийся всадник увидел её ещё до поворота, Самира поднялась на небольшой склон над дорогой.
>
> Оттуда было видно дальше.
>
> Она прислушалась.
>
> Пока ничего.
>
> Самира поднялась ещё немного.

**Proposed (owner approved intent, longer rhythm):**

> Самира поднялась на небольшой склон над дорогой: отсюда Темур должен был заметить её ещё до опасного поворота. Некоторое время она всматривалась в дорогу, прислушиваясь к далёким звукам, но топота копыт Шамола не было слышно. Тогда Самира осторожно поднялась немного выше.

**Uzbek provisional:** `Samira yo‘l ustidagi kichik qiyalikka ko‘tarildi: bu yerdan Temur uni xavfli burilishga yetmasidan ko‘rishi kerak edi. U bir muddat yo‘lni kuzatib, uzoqdan keladigan tovushlarga quloq soldi, ammo Shamolning tuyoq tovushi hali eshitilmasdi. Shunda Samira ehtiyotkorlik bilan yana biroz yuqoriga ko‘tarildi.`

This replaces five old paragraphs with one purposeful paragraph; the next unchanged event is the wet soil giving way under Samira. It adds an unspecified wait without inventing distances or exact clock minutes. The already approved illustration anchor immediately after `— Оставайся здесь.` remains untouched.

## 3. STYLE-02 — King responds publicly without a second lecture (NEW CANDIDATE)

**Situation:** after the King publicly hears that Samira lied, returned to warn Temur and confessed, and that Temur escaped armed bandits and rescued Samira with adults, he names both as worthy. He awards belts and sheathed ceremonial sabres. His previous final line repeated bravery, responsibility and honesty. Deleting it entirely could make the public ceremony emotionally abrupt; the owner explicitly wants the King to care and not shame either child.

**Before RU (after the sabres are presented):**

> — Бахадур должен быть смелым, — сказал король. — Но ещё он отвечает за своё слово, за дорогу и за тех, кто рядом.

**Proposed RU instead:**

> Король посмотрел на порванный правый рукав Темура и следы высохшей грязи на одежде Самиры. Он говорил уже не так торжественно:
>
> — Я рад, что вы оба вернулись. Теперь разбойниками займётся стража, а вам после такого пути нужен отдых.

**Before UZ:**

> — Bahodir jasur bo‘lishi kerak, — dedi qirol. — Ammo u o‘z so‘zi, yo‘li va yonidagi odamlar uchun ham javob beradi.

**Proposed UZ (separate native-language reading remains pending):**

> Qirol Temurning yirtilgan o‘ng yengiga, so‘ng Samiraning kiyimida qurib qolgan loyga qaradi. U endi avvalgidek tantanali ohangda gapirmadi:
>
> — Ikkoving ham sog‘-omon qaytganingizdan xursandman. Endi qaroqchilar bilan qo‘riqchilar shug‘ullanadi, sizlarga esa shunday safardan keyin dam olish kerak.

**Reason:** the King notices both children's actual hardships, acknowledges their return and explicitly takes responsibility for further bandit investigation. He does not re-preach what he just said in front of everyone, and does not shame Samira again. Existing surrounding scene and order of gifts stay, as does `P7-IMG-03` **at the same narrative moment**, provided its text anchor is migrated alongside the approved title update. **Status: PRECISE-WORDING-OWNER-REVIEW_REQUIRED.**

## 4. R06 — owner selected official title «Всадник короля»

**Canonical direction for *new* World Bible V2 only:**
- **Official singular RU:** `Всадник короля`. **Plural RU:** `Всадники короля`.
- **Uzbek:** `Qirol chavandozi`, plural `Qirol chavandozlari`. Existing Story 2 Uzbek text already uses this expression; native-speaker review is still required before new literary version.
- **Earlier Bible V1:** `юный бахадур царства` / `юные бахадуры царства`. Preserve V1 as historical source; do not silently change the meaning of its owner-approved prose.

### Exact Bible V2 deltas to plan

| Location | Before (World Bible V1) | Proposed V2 |
|---|---|---|
| §3 #52 | `Both Temur and Samira are judged worthy to become **юные бахадуры царства** (young bahadurs of the realm).` | `Both Temur and Samira are judged worthy to become **Всадники короля** (Riders of the King); singular **Всадник короля**, Uzbek **Qirol chavandozi**.` |
| Story 1 title / ceremony | `Official title after Story 1: **юные бахадуры царства**; singular: **бахадур царства**.` | `Official title after Story 1: **Всадники короля**; singular: **Всадник короля**; Uzbek: **Qirol chavandozlari / Qirol chavandozi**.` |
| Temur and Samira role descriptors | `becomes a **бахадур царства**` | `becomes a **Всадник короля**` |
| Final historical recap and S0/S7 terminology | `bahadur status`, `bahadur ceremony` | `King's Rider status`, `King's Rider ceremony`, with the standing belt/sheathed-sabre staging unchanged |

Do not alter World Bible V1: this table is a **new V2 textual delta**, not canon that has already shipped.

### Story 1 textual updates required to avoid contradiction

| Part | Before RU | Proposed RU for a separately versioned literary master |
|---|---|---|
| 1 | `Те, кто мечтал стать юным бахадуром царства` | `Те, кто мечтал стать Всадником короля` |
| 1 | `должен был определиться новый юный бахадур царства` | `должен был определиться новый Всадник короля` |
| 7 | `— Юному бахадуру нужно больше.` | `— Всаднику короля нужно больше.` |
| 7 | `— И ещё бахадур не должен проезжать мимо человека` | `— И ещё Всадник короля не должен проезжать мимо человека` |
| 7 | `— А достойных стать юными бахадурами царства сегодня оказалось двое.` | `— А достойных стать Всадниками короля сегодня оказалось двое.` |
| 7 | `Так Темур и Самира стали юными бахадурами царства.` | `Так Темур и Самира стали Всадниками короля.` |

UZ equivalent (new source version only): `qirollikning yosh bahodiri` → `Qirol chavandozi`, `Yosh bahodirga` → `Qirol chavandoziga`, `bahodir` → `Qirol chavandozi` in the same identified sentences, `Shu tariqa Temur va Samira qirollikning yosh bahodirlariga aylanishdi.` → `Shu tariqa Temur va Samira Qirol chavandozlariga aylanishdi.` All inflections must be reviewed as natural Uzbek, not search-replaced globally.

**Important migration boundary:** `P7-IMG-03` has `after_text = Так Темур и Самира стали юными бахадурами царства.`, and the Uzbek overlay's `image_anchor_texts.P7-IMG-03` uses the old title. Both must be **re-anchored in a new approved story version** to the corresponding new RU/UZ line without changing `slot_id`, `asset_id` or image placement. `scripts/check-authored-story-v3.mjs` currently asserts the old text and anchor, and `scripts/check-story1-authoring-map.mjs` validates locked map values; update only through the versioned source-authoring/asset acceptance process, never to force CI green.

**Legacy canon key:** `required_final_invariants.temur_and_samira_named_young_bahadurs` exists in the original published Story 1. It may already be part of stable memory/progress contracts. **Do not rename or delete that key** as a side-effect of changing the displayed honorific: document compatibility and explicitly version the new semantics before any eventual migration. Existing story IDs, part IDs, choice IDs, image IDs and progress remain stable.

**Evidence supporting owner decision:** Story 2 (RU and UZ) already calls the honor `Звание Всадника короля` / `Qirol chavandozi unvoni`, displays the ceremonial belt and repeats the title in dialogue. The owner choice reduces this inconsistency with Story 1, but requires a controlled update to World Bible and Story 1, not merely a glossary note.

## 5. Release hold and next task

- The two exact owner-approved excerpt proposal documents remain draft/in-memory only; no original `src/data/authored/**` has been changed.
- Conditional ditch canon (#1) and official King's Rider title (#13) are **approved directions** for future World Bible V2, not permission to rewrite historical V1.
- The adjusted King speech in §3 is a **new proposed replacement awaiting precise wording approval**; do not treat the earlier “delete the entire line” suggestion as approved.
- Once the title, speech and version contract are resolved, prepare the separately versioned RU/UZ literary master and image/authoring map migration with explicit provenance; source-hash protection must be satisfied *after* approval, not bypassed.
