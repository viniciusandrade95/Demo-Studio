# Downloadable Demo Studio archive

This directory contains a zip archive of the current committed Demo Studio worktree so it can be downloaded and moved to another environment.

## Files

- `demo-studio-worktree-20260506.zip` — zip archive generated from `HEAD` with `git archive`.
- `demo-studio-worktree-20260506.zip.sha256` — SHA-256 checksum for the zip archive.

## Verify after download

From the directory containing the downloaded files, run:

```bash
sha256sum -c demo-studio-worktree-20260506.zip.sha256
```

The command should report `demo-studio-worktree-20260506.zip: OK`.
