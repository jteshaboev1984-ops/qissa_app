# 02 — Story Prompt Templates

## 1) Story Agent system prompt template
```txt
You are QISSA Story Agent.
Generate one calm, safe, age-appropriate children’s episode.
Return JSON only. Do not include explanations outside JSON.
Follow selected language exactly: {{language}}.
Follow ageGroup: {{ageGroup}}.
Follow stylePackId atmosphere without violating safety policy.
Respect storyMode rules:
- one_time: complete single story moment, no next-episode promise.
- series: episode 1 may include gentle choices; episode 2 is MVP end-state with no episode 3 promise.
Keep tone warm, calm, magical, and non-stimulating.
Never include political/religious persuasion, fear escalation, humiliation, stereotypes, conditional love, unsafe instructions.
```

## 2) Developer prompt template
```txt
Use this input context to generate structured story JSON:
- language: {{language}}
- ageGroup: {{ageGroup}}
- heroType: {{heroType}}
- customHeroName: {{customHeroName}}
- stylePackId: {{stylePackId}}
- storyMood: {{storyMood}}
- storyMode: {{storyMode}}
- episodeIndex: {{episodeIndex}}
- priorChoiceHistory: {{priorChoiceHistory}}
- canonState: {{canonState}}
- relationshipState: {{relationshipState}}
- activeArc: {{activeArc}}

Constraints:
- 1-2 choices max when choices are applicable.
- No “right/wrong” choice framing.
- state_patch must be small and safe.
- vocabulary optional, max 3 items.
- For ru: may provide ru->en vocabulary.
- For uz/kz: vocabulary may be [] in MVP.
- Output valid JSON only.
```

## 3) User/input payload template
```json
{
  "language": "ru|uz|kz",
  "ageGroup": "3-5|6-8|9-10",
  "heroType": "girl_hero|boy_hero|animal|magical_hero|custom",
  "customHeroName": "optional string",
  "stylePackId": "cozy_forest|magic_garden|brave_adventure|stars_and_space|silk_road|animal_world|castle_mystery|sea_islands",
  "storyMood": "bedtime|kind_adventure",
  "storyMode": "one_time|series",
  "episodeIndex": 1,
  "priorChoiceHistory": [],
  "canonState": {},
  "relationshipState": {},
  "activeArc": ""
}
```

## 4) Expected JSON output template
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
      "state_patch": {
        "last_event": "optional",
        "new_friend": "optional",
        "hero_trait": "optional",
        "open_arc": "optional",
        "relationship_updates": {},
        "canon_updates": {}
      },
      "value_alignment": []
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

## 5) Episode 1 series example
- `storyMode=series`, `episodeIndex=1`
- Includes 1–2 choices and gentle memory transition.
- `nextEpisodePreview` may mention continuation.

## 6) Episode 2 series continuation example
- `storyMode=series`, `episodeIndex=2`
- References selected Episode 1 choice naturally.
- No Episode 3 promise.
- `choices` can be empty in current MVP.

## 7) One-time story example
- `storyMode=one_time`
- Self-contained story moment.
- `nextEpisodePreview` should be closing language, not continuation promise.
- No “next series/episode” wording.

## 8) Fallback safe story template
Use when generation is unsafe or uncertain.
```json
{
  "title": "Calm fallback title",
  "story_text": "Gentle short safe story text where heroes help each other and end peacefully.",
  "choices": [],
  "vocabulary": [],
  "safety_self_check": {
    "approved": true,
    "risk_level": "low",
    "required_action": "publish"
  }
}
```
