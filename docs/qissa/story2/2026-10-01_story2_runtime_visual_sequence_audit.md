# QISSA Story 2 runtime visual-sequence audit — 2026-10-01

## Purpose

This is a pre-hosting visual smoke for the approved runtime WebPs of **«Тайна восточного каравана»**.

It checks that the files staged for runtime correspond to the intended narrative moments and that the sequence does not visually reveal a later clue before the text reaches that clue.

This is **not** a browser/CSS smoke. A rendered-reader smoke remains required after the assets are hosted.

## Material checked

All 28 staged Story 2 runtime WebPs were materialized again from QISSA Library.

Independent file verification confirmed:

- 28 / 28 files present;
- 28 / 28 are 1536 × 1024;
- total payload: 9,071,006 bytes;
- every SHA-256 and byte length matches `docs/qissa/story2/story2_runtime_asset_inventory.json`;
- no duplicate filename;
- no obvious wrong-file substitution in the narrative contact-sheet pass.

## Narrative visual pass

### Parts 1–2 — orientation before mystery

**PASS**

- P1-IMG-01 establishes Aras / gates / caravan geography before the investigation.
- P1-IMG-02 establishes the bowyer workshop early, so Choice 4B can later reuse a location the reader has already seen.
- P2-IMG-01 shows the eastern caravan becoming part of ordinary city life.
- P2-IMG-02 introduces Rashid and Barlas only after the text names both men.

No later clue is visually introduced in these opening images.

### Part 3 — road-seal operation

**PASS**

The image order reads correctly as:

1. P3-IMG-01 — the wax impression has just been made;
2. P3-IMG-02 — the guard interrupts before the theft-cover action begins;
3. P3-IMG-03 — later, the two horses are taken through the old exit.

The revised full-resolution P3 runtime files preserve this order and do not use the obsolete old P3-IMG-01 canon in which the real road seal was to be stolen.

### Part 4 — Nadir handoff

**PASS**

- P4-IMG-01 shows the token check outside the city.
- P4-IMG-02 then shows Nadir integrated into the ordinary caravan-yard work context.

The corrected P4-IMG-02 runtime file is full-resolution and is not a different scene.

### Parts 5–6 — investigation starts

**PASS**

- P5-IMG-01 shows the small wax fragment only after Temur notices it.
- P5-IMG-02 shows the broken fitting after the text visually identifies the familiar mark.
- P6-IMG-01 occurs only after the old passage and two outgoing horse trails have been established.
- P6-IMG-02 follows the Sarvan register check and the statement that Rashid and Barlas are not from there.

This ordering avoids turning either the wax or the Sarvan lie into a premature visual answer.

### Choice 3 — Sarvan branch

**PASS**

The two branch images are visually different and correspond to different knowledge:

- **3A / P6A-IMG-03:** Samira at the old Sarvan caravan yard with the two narrow towers.
- **3B / P6B-IMG-03:** Samira questioning Azim beside the horse/stables.

They are not interchangeable. The reader code renders only the selected one, at its exact branch paragraph.

### Part 7 — convergence and third track

**PASS**

The common-path images progress in the correct information order:

1. P7-IMG-01 — Samira prepares for the morning trip;
2. P7-IMG-02 — Temur and Samira identify the later third incoming trail;
3. P7-IMG-03 — the matching horse is inspected and Nadir realizes he has exposed himself.

P7-IMG-03 does not show Nadir already captured; it still belongs before the chase.

### Choice 4 — stopping Nadir

**PASS**

The branch images communicate two genuinely different routes:

- **4A / P8A-IMG-01:** Nadir encounters the guards after Temur and Samira take the shortcut and warn them.
- **4B / P8B-IMG-01:** exactly two arrows visibly block the left route while Nadir turns into the right passage; the arrows are not aimed at his body.

The reader exposes only the chosen branch image. Neither branch image belongs before its selected branch text reaches the corresponding beat.

### Part 9 — interrogation / Sarvan-token payoff

**PASS**

P9-IMG-01 → P9-IMG-02 → P9-IMG-03 reads as one continuous guard-room sequence:

1. Nadir and the captain sit down; the real road seal is absent from Nadir's possessions.
2. Temur places the broken network-mark fitting beside the wooden token.
3. Samira recognizes the two-tower side as connected to the old Sarvan yard.

The third image is after the recognition line, not before the Choice-3-dependent token explanation.

### Part 10 — two roads

**PASS**

The final visual sequence is coherent:

1. P10-IMG-01 — Nadir returns to ordinary work with Hamid.
2. P10-IMG-02 — Temur, Samira, the horses and senior guard are ready at Aras' south gate.
3. P10-IMG-03 — the south-gate group crosses the threshold toward Sarvan.
4. P10-IMG-04 — the light lunch-bundle character beat happens after departure.
5. P10-IMG-05 — cut back to the eastern caravan travelling onward with Nadir under hidden adult observation.

This preserves the story's final split: the reader sees the southbound investigation and the eastbound covert operation as separate movements.

## Result

**Pre-hosting visual-sequence status: PASS.**

No runtime file swap, duplicate scene, branch crossover, or obvious chronology inversion was found in the 28-image visual pass.

## Still required

After Storage upload:

1. enable Story 2 runtime assets only in an internal preview build;
2. read both Choice 3 branches and both Choice 4 branches on a real mobile viewport;
3. verify text → image spacing and exact anchor placement in the rendered DOM;
4. confirm the unchosen branch image never appears in reader or Gallery;
5. confirm scroll/resume does not skip or prematurely mark selected-only art as seen;
6. keep Story 2 unpublished until those rendered-reader checks pass.


## Post-hosting rendered-reader smoke — 2026-10-02

**PASS**

After the 28 runtime WebPs were uploaded to production Supabase Storage and independently byte/hash verified, the gated Story 2 preview build from GitHub Actions was exercised in a real Chromium/React/CSS mobile rendering harness at **430 × 932**.

The environment blocks direct top-level preview navigation, so the smoke used the exact CI-built JS/CSS artifact in an isolated browser document and supplied the exact prebuilt Story 2 authored package. Story-image requests were fulfilled from the same locked 28 WebPs whose public Supabase copies passed the live hash smoke. No story prose, branch logic, anchors, or reader code was rewritten for the test.

### Rendered path coverage

Four rendered paths were completed to cover both Story 3 and Story 4 visual branches:

- Choice 3A + Choice 4A — PASS
- Choice 3A + Choice 4B — PASS
- Choice 3B + Choice 4A — PASS
- Choice 3B + Choice 4B — PASS

Choices 1 and 2 were kept on the same baseline option because they intentionally have no branch-specific illustration; their shared convergence images were still rendered and checked.

For every tested path:

- exactly **26 scene images** became visible;
- all visible images loaded at natural size **1536 × 1024**;
- every shared image immediately followed its locked V4 anchor paragraph;
- only the selected Choice 3 image appeared;
- only the selected Choice 4 image appeared;
- no duplicate image appeared;
- no unchosen branch image leaked into the DOM;
- deferred Choice 3 payoff prose appeared only on its selected path.

### Choice 3 rendered anchor proof

**3A / P6A-IMG-03**

The image rendered immediately after:

> На воротах ещё сохранился старый знак двора: две узкие башни по сторонам проезда.

The mobile frame shows Samira at the old Sarvan caravan yard, with the two narrow towers visible before the subsequent recognition/payoff prose.

**3B / P6B-IMG-03**

The image rendered immediately after:

> — У Каменного колодца. Они уже стояли возле дороги. Две лошади, несколько связок кожи.

The mobile frame shows Samira questioning Azim in the horse-yard context before the dialogue continues.

Both branch frames preserve readable text/image spacing and do not expose the other branch.

### Choice 4 rendered anchor proof

**4A / P8A-IMG-01**

The image rendered immediately after:

> Он увидел стражников впереди и резко остановился.

The frame shows the adult guards blocking the route, consistent with the shortcut-and-warning branch.

**4B / P8B-IMG-01**

The image rendered immediately after:

> Вторая легла дальше по той же стороне, не давая ему снова взять левее.

The frame shows the safe arrow-routing action and the right-hand escape passage; the arrows are not aimed at Nadir.

### General mobile layout result

The rendered reader preserved:

- sticky reader controls;
- readable serif text at the default setting;
- clear paragraph separation;
- full-width landscape illustrations with rounded corners;
- no text overlay on illustrations;
- no clipping or visible stretching;
- correct continuation of prose beneath each illustration.

P1, Choice 3A, Choice 3B, Choice 4A, Choice 4B, P7 and P10 critical transition frames were visually inspected in the rendered mobile flow.

### Remaining rendered-runtime gap

A true browser **reload/resume persistence** smoke still requires an allowed stable preview origin so browser storage survives navigation/reload in the test environment. The current rendered smoke verifies the active-session React path and DOM ordering, but does not claim an end-to-end reload/resume proof for Story 2.

Story 1 already owns the shared authored-reader persistence implementation; nevertheless, Story 2 should receive one final stable-origin resume/Gallery smoke before publication.

