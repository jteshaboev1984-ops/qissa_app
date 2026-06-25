# QISSA privacy rollout checklist

This checklist is a deployment gate, not legal advice.

## Before merge

- [ ] Privacy contract check passes.
- [ ] Existing backend, story safety, localization, typecheck, and build checks pass.
- [ ] Live story smoke still returns the safe fallback while remote AI is disabled.
- [ ] Review confirms soft story reset and irreversible profile deletion remain separate actions.

## Production rollout order

1. Apply the privacy consent migration.
2. Deploy `story-state` with JWT verification enabled.
3. Deploy `story-generate` with JWT verification enabled.
4. Run the production privacy smoke test.
5. Confirm the temporary profile cannot be loaded after deletion.
6. Merge the pull request and allow the Pages deployment.

## Remote AI activation gate

Keep remote AI disabled until the parent consent UI, consent evidence, deletion smoke, launch privacy review, and provider data-processing settings are approved.
