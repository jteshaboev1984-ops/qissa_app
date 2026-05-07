// Prototype Safety Agent: lightweight placeholder. Production MVP must replace with stricter policy checks.
import type { Episode, SafetyResult } from '../types/qissa'

const blockedTerms = ['ужас', 'кровь', 'наказание', 'ненависть', 'война']

export function runEpisodeSafetyCheck(episode: Episode): SafetyResult {
  // Guaranteed safe fallback path is handled by storyAgent when this returns approved=false.
  const text = `${episode.title} ${episode.story_text}`.toLowerCase()
  const hasBlockedTerm = blockedTerms.some((term) => text.includes(term))

  if (hasBlockedTerm) {
    return {
      approved: false,
      risk_level: 'medium',
      flags: {
        discrimination: false,
        humiliation: false,
        religious_push: false,
        political_push: false,
        gender_stereotype: false,
        nationality_stereotype: false,
        conditional_love: false,
        bedtime_overstimulation: true,
        adult_theme: false,
        excessive_fear: true,
      },
      required_action: 'fallback',
    }
  }

  return {
    approved: true,
    risk_level: 'low',
    flags: {
      discrimination: false,
      humiliation: false,
      religious_push: false,
      political_push: false,
      gender_stereotype: false,
      nationality_stereotype: false,
      conditional_love: false,
      bedtime_overstimulation: false,
      adult_theme: false,
      excessive_fear: false,
    },
    required_action: 'publish',
  }
}
