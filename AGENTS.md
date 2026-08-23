# Helix

Grok-native Chromium browser. Public GitHub repo: `shawnwklein/helix-browser`.

## Releases

If you make changes, always ship a new version. Do not leave user-facing work on `main` without a tagged GitHub release.

1. Bump `version` in `package.json` (patch for fixes/UX, minor for features).
2. Keep `package-lock.json` root version in sync.
3. Commit the version bump with the change (or immediately after).
4. Tag `vX.Y.Z` matching `package.json` and push the tag:

```bash
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

GitHub Actions (`Windows release` workflow) builds the portable EXE and NSIS installer and attaches them to https://github.com/shawnwklein/helix-browser/releases.

## UX compounding loop

Helix should feel like **Faces** (people you browse as, in one window — not Chrome profiles) with **Grok as the second reader**. Add Outlook is one click; each account is a locked Chromium cookie jar.

To keep improving without hand-writing every prompt:

```bash
./scripts/iterate-grok-improvements.sh --iterations 6 --focus faces --unattended --no-effort
./scripts/iterate-grok-improvements.sh -n 4 --focus faces --unattended --auto-release --no-effort
```

Doctrine: `scripts/ux-doctrine.md`. How to run: `scripts/README-iterations.md`. Each cycle invents a UX change from the real UI **and** moves Faces / Grok-in-chrome forward. Do not wait for a ticket.
