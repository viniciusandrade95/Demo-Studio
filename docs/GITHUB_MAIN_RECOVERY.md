# GitHub `main` recovery path

This repository may be opened in an environment that cannot reach GitHub over HTTPS. In the
current workspace, `git fetch` and `git push` to `https://github.com/viniciusandrade95/Demo-Studio.git`
failed with `CONNECT tunnel failed, response 403`, so the safest path is to restore the known-good
local backup artifacts in a network-capable environment and push from there.

## Known-good consolidated work

Use these identifiers to confirm that you are restoring the intended work:

- Latest backup commit: `6faefbe Add local backup artifacts for consolidated work`
- Main feature commit: `1554a9a Add Demo Lab UI, remote-ready demo-session API, simulation engine, connectors, and QA tooling`
- GitHub remote: `https://github.com/viniciusandrade95/Demo-Studio.git`

Expected backup artifacts:

- `backups/demo-studio-consolidated-main.bundle`
- `backups/demo-studio-consolidated-main.patch`
- `backups/format-patches/0001-Add-Demo-Lab-UI-remote-ready-demo-session-API-simula.patch`
- `backups/SHA256SUMS.txt`
- `backups/README_RESTORE.md`

## Verify the backup artifacts

From the repository root that contains `backups/`, run:

```bash
sha256sum -c backups/SHA256SUMS.txt
```

If any checksum fails, do not push from that backup set. Locate a clean copy of the backup artifacts
first.

## Preferred restore: bundle

A bundle preserves commit history and is the preferred source of truth.

```bash
cd /path/to/Demo-Studio
git remote add origin https://github.com/viniciusandrade95/Demo-Studio.git 2>/dev/null || \
  git remote set-url origin https://github.com/viniciusandrade95/Demo-Studio.git
sha256sum -c backups/SHA256SUMS.txt
git bundle verify backups/demo-studio-consolidated-main.bundle
git fetch backups/demo-studio-consolidated-main.bundle main:recovered-main
git log --oneline --decorate recovered-main --max-count=5
git branch -f main recovered-main
git checkout main
git status --short
git push origin main
```

After pushing, verify GitHub shows commit `1554a9a` on `main`. Keep the `recovered-main` branch until
that verification is complete.

## Fallback restore: patch

Use the patch only if the bundle is unavailable or fails verification. This path can recreate the
file changes, but it may not preserve the original commit IDs.

```bash
cd /path/to/Demo-Studio
git remote add origin https://github.com/viniciusandrade95/Demo-Studio.git 2>/dev/null || \
  git remote set-url origin https://github.com/viniciusandrade95/Demo-Studio.git
git checkout -B main
git apply --check backups/demo-studio-consolidated-main.patch
git apply backups/demo-studio-consolidated-main.patch
git status --short
git add .
git commit -m "Restore consolidated Demo Studio work from backup patch"
git push origin main
```

## If this environment still cannot push

If `git push origin main` returns `CONNECT tunnel failed, response 403`, the local repository state is
not the blocker. Move the verified `backups/` directory or the bundle file to a machine/network that
can reach GitHub, then run the bundle restore commands above.

Do not force-push unless you have first confirmed the current GitHub `main` history and intentionally
want to replace it. If GitHub already has commits that are not in the bundle, create a pull request
from `recovered-main` instead of pushing directly to `main`.
