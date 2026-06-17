---
name: Artifact workflow dedup pattern
description: How Replit auto-detects workflows from artifacts/ subdirs and the correct fix to prevent duplicates on import.
---

# Artifact Workflow Dedup Pattern

## The Problem
Replit auto-detects every subdirectory of `artifacts/` as an "artifact workflow". If `.replit` also defines manual workflows with different names targeting the same ports, every import produces duplicates (one manually-named, one artifact-auto-detected).

**Previous symptom:** `API Server` (manual, port 8080) + `artifacts/api-server: API Server` (auto-detected, no PORT → crash). `Marketplace` (manual, port 5000) + `artifacts/marketplace: web` (auto-detected, wrong port 20787). `artifacts/mockup-sandbox: Component Preview Server` auto-detected and auto-started on every import.

## The Fix

### For service artifacts (api-server, marketplace, mobile)
- **Do NOT define manual workflow duplicates in `.replit`.** The artifact-detected workflows ARE the canonical ones.
- **Bake port defaults into `package.json` dev scripts** so artifact-managed workflows work without needing `.replit` `PORT=` overrides:
  - api-server: `"dev": "export NODE_ENV=development PORT=${PORT:-8080} && pnpm run build && pnpm run start"`
  - marketplace vite.config: `const rawPort = process.env.PORT ?? "5000"` (already correct)
  - mobile: `... expo start --localhost --port ${PORT:-8081}` (already correct)
- Artifact-managed workflows **cannot be overridden or deleted** via `configureWorkflow`/`removeWorkflow` — the API returns `PROHIBITED_ACTION`.

### For non-service tooling (mockup-sandbox)
- Move out of `artifacts/` → `tools/` to prevent auto-detection.
- Update `pnpm-workspace.yaml` to add `tools/mockup-sandbox`.
- Update vite.config.ts cartographer root: `path.resolve(import.meta.dirname, "..", "..")` (workspace root, not tools/).
- Add via `configureWorkflow` with `autoStart: false` and `isCanvasWorkflow: true`. Use port 9000 (8081 is NOT in Replit's supported port list for configureWorkflow).
- The old `artifacts/mockup-sandbox: Component Preview Server` remains as "finished" forever (artifact-protected, can't delete) — this is harmless since the directory is gone.

## Final Clean State (June 17, 2026)
- `artifacts/api-server: API Server` — running, port 8080 ✅
- `artifacts/marketplace: web` — running, port 5000 ✅
- `artifacts/mobile: expo` — running, port 18115 ✅
- `Embedding Service` — running, port 8000 ✅
- `Component Preview Server` — not_started (on-demand, tools/mockup-sandbox, port 9000)

**Why:** Replit deduplicates by workflow name; the artifact system owns `artifacts/*: *` names. Trying to define the same name in `.replit` fails with PROHIBITED_ACTION. The only reliable approach is fixing the dev scripts to default the correct port.
