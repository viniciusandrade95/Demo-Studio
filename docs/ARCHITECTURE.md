# Architecture

## Current shape

- Next.js App Router frontend
- local-only simulation assumptions
- no direct dependency on `theone`
- no production write behavior

## Planned layers

1. UI routes
2. simulation domain and fixtures
3. playback orchestration
4. connector abstraction for future remote sessions

## Integration rule

Future theone connectivity must happen through explicit connector or API boundaries.
No direct imports from `theone` are allowed in this repository.
