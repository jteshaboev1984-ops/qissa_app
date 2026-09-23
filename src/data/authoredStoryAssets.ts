export type AuthoredStoryAssetRegistry = Record<string, string>

const productionAssets: AuthoredStoryAssetRegistry = {
  // Filled only after an illustration is owner-approved and uploaded to app-controlled storage.
}

export const resolveAuthoredStoryAssetUrl = (
  assetId: string,
  inlineRuntimeUrl?: string | null,
): string | null => {
  const registered = productionAssets[assetId]?.trim()
  if (registered) return registered

  const inline = inlineRuntimeUrl?.trim()
  return inline || null
}

export const authoredStoryAssetRegistry = {
  resolve: resolveAuthoredStoryAssetUrl,
  registeredCount: () => Object.keys(productionAssets).length,
}
