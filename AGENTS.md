# QISSA Agent Instructions

## Project Identity

QISSA is a family AI storytelling app for children in Central Asia.

The product creates personal fairy-tale series with:
- memory of child choices;
- safe AI-only story generation;
- warm bedtime and daytime storytelling;
- visual style packs;
- optional RU/EN vocabulary layer;
- future-ready audio and voice architecture.

## Source of Truth

Before making product or architecture decisions, read the documents in:

/docs/qissa/

Priority order:
1. 00_QISSA_Project_Document_Index.docx
2. 01_QISSA_PRD.docx
3. 02_QISSA_Technical_Specification.docx
4. 03_QISSA_Content_Safety_Policy.docx
5. 04_QISSA_Prompt_and_Agent_Specification.docx
6. 05_QISSA_UX_UI_Specification.docx
7. 06_QISSA_Visual_Style_System.docx
8. 13_QISSA_Listening_Reading_Voice_Addendum.docx
9. 07_QISSA_Database_Schema_Draft.docx
10. 08_QISSA_Localization_Guide.docx
11. 09_QISSA_MVP_Roadmap_and_Release_Plan.docx

## Hard Rules

Do not invent new product features.
Do not change MVP priorities.
Do not add social features.
Do not add ads.
Do not add marketplace.
Do not add badges, coins, streaks, leaderboards, or public profiles.
Do not add open-ended child chat.
Do not add AI image generation in MVP.
Do not add parent voice cloning in MVP.
Do not add religious, political, ideological, or current-events content.
Do not force registration before first story unless explicitly requested.
Do not force vocabulary learning.
Do not force voice setup.

## MVP Core Loop

The MVP must focus on:

Start story → select age/language/hero/world → read or listen → child makes 1–2 soft choices → memory is saved → next episode remembers the choice → optional words from story.

## First Launch Wow Effect

The first launch must show:

1. A generated or mocked story episode.
2. A meaningful child choice.
3. A visible consequence.
4. A message that the story world remembers the choice.
5. A next-episode preview that uses the saved choice.

## Technical Priorities

Build modularly.

Required modules:
- Input Normalizer
- Memory Agent
- Story Agent
- Safety Agent
- Vocabulary Agent
- Audio Agent

In MVP, these can be local/mock modules.
Do not connect real AI, TTS, Supabase, or payments unless explicitly requested.

## UX Rules

The product must feel simple.
Advanced settings must stay optional.
The main CTA after first story must be “Continue story”.
Visual worlds must not be gender-locked.
Voice presets must not be gender-locked.
Reader settings must be free accessibility features.

## Content Safety

Generated or mocked stories must avoid:
- discrimination;
- humiliation;
- religious promotion;
- political promotion;
- gender or nationality stereotypes;
- conditional parental love;
- bullying as moral;
- scary unresolved bedtime endings;
- excessive violence;
- adult themes.

Positive values:
- respect for elders;
- kindness;
- care for nature and animals;
- friendship;
- honesty;
- gratitude;
- curiosity;
- mutual help;
- calm conflict resolution;
- dignity of every person.

## Development Style

Work surgically.
Prefer small PRs.
Do not rewrite broad areas unless necessary.
Keep code readable, typed, and modular.
Run build/typecheck/lint when available.
At the end of each task, report:
- changed files;
- what was implemented;
- what was intentionally not implemented;
- commands run;
- remaining risks.
