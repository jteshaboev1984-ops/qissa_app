import { createInitialSeriesState } from './memoryAgent'
import { localPersistence } from './localPersistence'
import { storyArchive } from './storyArchive'
import { getStoryProviderConfig } from './storyRemoteClient'
import { isClosedBetaSelections, normalizeSelectionsForClosedBeta } from './closedBetaScope'

export type ClosedBetaMigrationResult = {
  migrated: boolean
  archivedLegacyStory: boolean
}

export const migratePersistedStoryIntoClosedBetaScope = (): ClosedBetaMigrationResult => {
  const legacySelections = localPersistence.loadOnboardingSelections()
  if (!legacySelections || isClosedBetaSelections(legacySelections)) {
    return { migrated: false, archivedLegacyStory: false }
  }

  const legacySeriesState = localPersistence.loadSeriesState()
  const legacyEpisode = localPersistence.loadCurrentEpisode()
  const archivedLegacyStory = Boolean(
    storyArchive.saveSnapshot(legacySelections, legacySeriesState, legacyEpisode),
  )

  const normalizedSelections = normalizeSelectionsForClosedBeta(
    legacySelections,
    legacySelections.language,
  )

  // Keep the historical episode intact in the local archive. For the remote
  // provider, reset_current archives the old server session before any new
  // closed-beta generation can persist. The durable reset outbox already makes
  // this safe across offline reloads.
  if (getStoryProviderConfig().mode === 'remote') {
    localPersistence.clearEpisodeAndScreen()
  } else {
    localPersistence.clearStoryProgressOnly()
  }

  localPersistence.saveOnboardingSelections(normalizedSelections)
  localPersistence.saveSeriesState(createInitialSeriesState(normalizedSelections))
  localPersistence.saveLanguage(normalizedSelections.language)

  return { migrated: true, archivedLegacyStory }
}
