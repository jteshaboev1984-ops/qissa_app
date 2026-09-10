# Main Branch Protection Acceptance — 2026-09-10

This note records the live acceptance check for GitHub issue #91.

Verified repository settings before the test:

- ruleset `Protect main` is active and targets the default branch;
- pull requests are required before changes can enter `main`;
- required GitHub Actions check is `validate`;
- force pushes are blocked;
- deletion of the protected branch is blocked;
- bypass list is empty;
- merged head branches are configured for automatic deletion.

Acceptance method:

1. create this harmless documentation change on a temporary branch;
2. open a pull request to `main`;
3. verify merge is blocked until required `validate` succeeds;
4. merge after GREEN CI;
5. verify the temporary head branch is automatically deleted.

No application runtime, Supabase configuration, database state, provider setting, secret, Story AI setting, or TTS setting is changed by this acceptance note.
