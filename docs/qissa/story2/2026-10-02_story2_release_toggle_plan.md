# Story 2 release toggle plan — 2026-10-02

## Current state

Publication was explicitly authorized on 2026-10-02.

The release change set has been applied on the release branch and is pending merge/deployment. The internal preview route remains disabled in production; the published Story 2 runtime asset flag is enabled.

## Explicit release change

Applied release change set:

1. Add Story 2 RU/UZ package to the published authored-story registry.
2. Add Story 2 as **Story 2** inside the Season 2 story collection.
3. Keep `completionScope: 'story'` and `readerUnit: 'part'`.
4. Switch the relevant Season 2/publication status from `coming_soon` to the published state required by the product shell.
5. Enable Story 2 runtime assets in the production build.
6. Remove/replace the pre-release production-bundle-closed assertion with a release assertion that requires Story 2 to be present.
7. Build release branch and require the published bundle-open assertion. **Completed in CI #842.**
8. Merge/deploy to production, then run production smoke for:
   - RU fresh read;
   - UZ fresh read;
   - cover;
   - representative Choice 3/4 branches;
   - reload/resume;
   - Gallery selected-only behavior;
   - Story-level completion wording;
   - Season 1 regression.

## Must not change during release

Do not modify:

- V4 narrative;
- Uzbek localized prose except a separately reviewed localization fix;
- choice IDs;
- story ID/version;
- image anchors;
- 28 accepted scene images;
- accepted cover;
- runtime asset filenames/hashes;
- Story 1 content.

## Rollback

If the post-release smoke fails:

1. restore Season 2/Story 2 to unpublished state;
2. restore production Story 2 flags to false;
3. redeploy the last known-good main;
4. leave Supabase assets in place — they are inert while no production bundle references them.

The release itself is therefore reversible without deleting production assets.
