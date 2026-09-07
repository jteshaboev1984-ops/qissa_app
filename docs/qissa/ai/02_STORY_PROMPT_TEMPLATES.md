# 02 — Story Prompt Templates

Status: reference documentation aligned with the current Story Agent contract. Runtime implementation lives in `supabase/functions/story-generate/prompt.ts` and remains the source for exact provider instructions.

## 1) Story Agent system prompt template
```txt
You are QISSA Story Agent.
Generate one calm, safe, age-appropriate children’s episode.
Return structured JSON only. Do not include explanations outside JSON.
Follow selected language exactly: {{language}}.
Follow ageGroup: {{ageGroup}}.
Follow stylePackId atmosphere without violating safety policy or remembered canon.
Respect storyMode rules:
- one_time: complete single story moment, no next-episode promise.
- series episode 1: return exactly two safe and genuinely different choices.
- series episode 2: visibly reflect the confirmed episode-1 choice, return no choices, and close calmly.
For bedtime mode, do not end with unresolved fear, countdown, sudden danger, or a cliffhanger.
Never include political/religious persuasion, fear escalation, humiliation, stereotypes, conditional love, unsafe instructions, or adult themes.
```

## 2) Developer/context template
```txt
Use this input context to generate structured story JSON:
- language: {{language}}
- ageGroup: {{ageGroup}}
- heroType: {{heroType}}
- heroName placeholder: {{HERO}}
- stylePackId: {{stylePackId}}
- storyMood: {{storyMood}}
- storyMode: {{storyMode}}
- episodeIndex: {{episodeIndex}}
- priorChoiceHistory: {{priorChoiceHistory}}
- canonState: {{canonState}}
- relationshipState: {{relationshipState}}
- recurringCharacters: {{recurringCharacters}}
- activeArc: {{activeArc}}
- lastEpisodeSummary: {{lastEpisodeSummary}}

Constraints:
- Episode 1: exactly 2 choices.
- Episode 2: 0 choices.
- No “right/wrong” choice framing.
- Each choice must include effect_summary, resolution_text, tomorrow_seed, choice_icon, value_alignment and a small state_patch.
- state_patch must be small, safe and limited to facts introduced by the episode.
- Russian: 2–3 gentle ru->en vocabulary items.
- Uzbek/Kazakh: vocabulary must be [].
- Series Episode 1: one calm nextEpisodePreview sentence.
- Episode 2 and one_time: nextEpisodePreview must be empty.
- Output valid JSON only.
```

## 3) Input payload shape
The current normalized backend accepts these contract values:

```json
{
  "language": "ru|uz|kz",
  "ageGroup": "3-4|5-7|8-9",
  "heroType": "girl_hero|boy_hero|animal|magical_hero|custom",
  "customHeroName": "optional string",
  "stylePackId": "cozy_forest|magic_garden|brave_adventure|stars_and_space|silk_road|animal_world|castle_mystery|sea_islands",
  "storyMood": "bedtime|kind_adventure",
  "storyMode": "one_time|series",
  "seriesState": {
    "id": "string",
    "mainCharacter": "string",
    "recurringCharacters": [],
    "lastEpisodeSummary": "string",
    "activeArc": "string",
    "relationshipState": {},
    "choiceHistory": [],
    "canonState": {},
    "episodeCount": 0
  }
}
```

The September 2026 closed beta publicly uses only `5-7`, `series`, `bedtime`, RU/UZ and the three approved flagship worlds. Other values remain internal contract capability, not launch exposure.

## 4) Final episode output shape
```json
{
  "episode_id": "string",
  "series_id": "string",
  "title": "string",
  "story_text": "string",
  "mode": "one_time|series",
  "mood": "bedtime|kind_adventure",
  "stylePackId": "string",
  "choices": [
    {
      "choice_id": "string",
      "text": "string",
      "effect_summary": "string",
      "resolution_text": "string",
      "tomorrow_seed": "string",
      "choice_icon": "✨",
      "state_patch": {
        "last_event": "optional string",
        "new_friend": "optional string",
        "hero_trait": "optional string",
        "open_arc": "optional string",
        "relationship_updates": {},
        "canon_updates": {}
      },
      "value_alignment": ["kindness"]
    }
  ],
  "state_patch": {},
  "vocabulary": [],
  "nextEpisodePreview": "string",
  "safety_self_check": {
    "approved": true,
    "risk_level": "low|medium|high",
    "flags": {},
    "required_action": "publish|regenerate|fallback|block"
  }
}
```

## 5) Episode 1 series behavior
- `storyMode=series`, `episodeIndex=1`.
- Exactly two safe choices.
- Choices have distinct consequences and memory bridges.
- `nextEpisodePreview` is one calm sentence with no danger or cliffhanger.

## 6) Episode 2 series continuation behavior
- `storyMode=series`, `episodeIndex=2`.
- Naturally and visibly reflects the confirmed Episode 1 choice.
- `choices=[]`.
- `nextEpisodePreview=""`.
- The current bedtime arc ends calmly; no Episode 3 promise.

## 7) One-time story behavior
- `storyMode=one_time` remains in the internal contract for later use.
- Self-contained story moment.
- No next-episode promise.
- `nextEpisodePreview=""`.

## 8) Safe fallback behavior
Fallback is not a separate UI contract. It must return the same final episode shape as provider generation.

During launch hardening, Story AI is intentionally disabled and production returns deterministic editorial fallback content. When provider generation is enabled later, unsafe, invalid or failed provider output falls back to the same safe contract instead of exposing provider errors to the child.
