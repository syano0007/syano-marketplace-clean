# SYANO — syanomarket.online
Last verified working: June 16, 2026
Workflows: API Server ✅ | Marketplace ✅ | Embedding Service ✅ (TF-IDF mode)
Secrets: All 12 loaded ✅
SEO Layer: react-helmet-async ✅ | sitemap.xml ✅ | robots.txt ✅ | JSON-LD ✅
Next task: Phase 11 — Prompt 9 — Accessibility

---

# SYANO — Syrian Digital Marketplace

---

## ⚠️ FOR ANY NEW AGENT — READ THIS BEFORE DOING ANYTHING

**This project has been fully set up and verified on a new Replit account (June 16, 2026). DO NOT recreate workflows, reinstall packages, or run schema commands unless you have confirmed the environment is broken.**

**Last verified:** June 16, 2026 — all 10 env vars loaded, all 3 workflows running, 33 DB tables, 42/42 embeddings, test email delivered via Resend.

### Before touching anything, run this check:
```bash
curl -s http://localhost:8080/api/healthz && echo "API OK"
```

- If you get `{"status":"ok"}` → **everything is running, do not touch anything**
- If the API is down → follow `RECOVERY_GUIDE.md` step by step

### The 6 workflows that MUST exist (do not create new ones, do not rename):
| Workflow Name | Port | Purpose |
|---|---|---|
| `artifacts/api-server: API Server` | 8080 | Express API + auto-migrations + demo data |
| `Start application` | 5000 | Marketplace web preview (webview) |
| `Embedding Service` | 8001 | TF-IDF/LSA embedding service (paraphrase-multilingual-MiniLM-L12-v2 fallback) |
| `artifacts/marketplace: web` | 20787 | Marketplace artifact view |
| `artifacts/mobile: expo` | 18115 | Expo mobile dev server |
| `artifacts/mockup-sandbox: Component Preview Server` | 8081 | UI component sandbox |

### Things that will BREAK the project if you do them:
- ❌ Creating a new "API Server" workflow → port 8080 conflict, both die
- ❌ Creating a new "Start application" on port 5000 → duplicate conflict
- ❌ Running `pnpm dev` at workspace root → wrong, use workflow restart
- ❌ Running `psql -f schema.sql` if DB already has 33 tables → will fail/corrupt
- ❌ Installing `sentence-transformers` or `torch` via Replit package manager (uv) → fails on Linux; use `pip install --no-cache-dir` directly instead
- ❌ Running `tsc --noEmit` on marketplace/api-server without building libs first → spurious TS6305 errors

### If the environment is fresh (empty DB / packages missing):
Read `RECOVERY_GUIDE.md` — it has the exact commands in the exact order.
**Expected final state:** 33 tables, 42 products, 42/42 embeddings, `GET /api/healthz → {"status":"ok"}`, recovery check 95/100.

---

## Project: SYANO

Full-stack Syrian marketplace platform with role-based auth (Seller / Customer / Courier / Admin), cart/order/inventory/discount system, hybrid NLP Arabic/English search, semantic embeddings, real-time messaging, courier delivery system, and a premium emerald green AMOLED dark design.

**Recovery-Verified:** June 15, 2026 — full restore in Replit environment, 0 TypeScript errors, all services running.

---

## Key Files (Read These First When Debugging)

| File | Purpose |
|---|---|
| `RECOVERY_GUIDE.md` | Step-by-step recovery for any new agent or fresh environment |
| `CURRENT_STATE.md` | Full state of all features, endpoints, pages, DB tables |
| `PROJECT_STATUS.md` | Feature completion matrix and architecture summary |

---

## Run & Operate

> **Always use workflow restart, not shell commands, to start services.**

```bash
# TypeScript check (build libs first!)
npx tsc --build lib/db lib/api-zod lib/api-client-react
npx tsc --noEmit -p artifacts/marketplace/tsconfig.json
npx tsc --noEmit -p artifacts/api-server/tsconfig.json

# Push DB schema changes (dev only — Drizzle push, not psql)
pnpm --filter @workspace/db run push

# Regenerate API hooks and Zod schemas (after OpenAPI spec changes)
pnpm --filter @workspace/api-spec run codegen

# Run embedding backfill manually (if products are missing embeddings)
pnpm --filter @workspace/api-server embed:generate
```

---

## Stack

- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui + TanStack Query + Wouter
- **API:** Express 5, Drizzle ORM, PostgreSQL
- **Mobile:** Expo (React Native) + expo-router
- **Validation:** Zod (v4), drizzle-zod
- **Auth:** JWT (HS256) in localStorage, SESSION_SECRET env var
- **Search:** 13-step NLP pipeline (Arabic + English), LRU cache, GIN FTS index, pgvector semantic (sentence-transformers)
- **Real-time:** SSE for notifications + new_message; polling fallback
- **Embeddings:** sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2, port 8001) — model.safetensors loaded from local disk, TF-IDF+LSA fallback if missing

---

## Where Things Live

```
lib/
  db/src/schema/          → Drizzle ORM schema (33 tables)
  api-spec/openapi.yaml   → Source-of-truth OpenAPI contract
  api-zod/src/index.ts    → Generated Zod schemas (DO NOT EDIT)
  api-client-react/src/   → Generated React Query hooks (DO NOT EDIT)

artifacts/
  api-server/src/
    index.ts              → App bootstrap (migrations + seeding + startup)
    routes/               → All 25+ Express route files
    utils/searchProcessor.ts → 13-step NLP search pipeline (860 lines)
    services/searchCache.ts  → LRU 500-entry search cache (205 lines)
    routes/search.ts      → FTS + semantic search routes (1,910 lines)
    scripts/generateEmbeddings.ts → Embedding backfill script

  marketplace/src/
    App.tsx               → React router + all lazy pages
    pages/search/index.tsx → Shop/search page (1,229 lines)
    pages/home.tsx        → Homepage V7 (renders Navbar directly, NO Layout)
    i18n/en.json          → English translations (2,832 keys)
    i18n/ar.json          → Arabic translations (2,832 keys)
    vite.config.ts        → Vite config — has /api proxy to port 8080 (CRITICAL)

  embedding-service/
    main.py               → FastAPI sentence-transformers service (graceful TF-IDF fallback)
    requirements.txt      → fastapi, uvicorn, numpy, scikit-learn, sentence-transformers, torch
    model/                → paraphrase-multilingual-MiniLM-L12-v2 model files (model.safetensors 449MB)

  mobile/                 → Expo app
  mockup-sandbox/         → Component preview sandbox
```

---

## Architecture Decisions

- **Contract-first API:** OpenAPI spec → Orval codegen → Zod schemas + React Query hooks. Never hand-write API call code.
- **JWT in localStorage:** Token under `localStorage.token`, user under `localStorage.user`. `setAuthTokenGetter` injects into all generated hooks.
- **Stock-on-delivery:** Inventory only decreases when seller marks "delivered" — not at checkout.
- **Role selector on login:** Admin accounts bypass role-mismatch — enter admin credentials while "Customer" is selected.
- **Numeric prices:** DB stores prices as `numeric`/`decimal` in SYP (Syrian Pounds). `finalPrice` computed server-side. `format(sypAmount)` divides by exchange rate for USD display — never multiply.
- **Vite /api proxy:** `artifacts/marketplace/vite.config.ts` proxies `/api/*` → `localhost:8080`. Without this, API calls return HTML from Vite.
- **Embedding service:** Uses `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` loaded from `artifacts/embedding-service/model/model.safetensors` (449MB). Falls back to TF-IDF+LSA if model file missing. Load time ~10s on first start.
- **Demo data self-healing:** `bootstrapDemoMarketplaceData()` runs on every API startup. Idempotent — skips if 42+ products exist.

---

## Database (Verified June 15, 2026)

- **33 tables total** (21 base in schema.sql + 12 added by run-migrations.ts on first API start)
- `notification_type` enum: **32 values**
- `order_status` enum: **15 values**
- FTS: `fts_vector` + `products_fts_gin` GIN index — **42/42 products**
- Semantic: `embedding` vector(384) — **42/42 products** (sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)

---

## Demo / Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin (Root Owner) | delewatiamer7@gmail.com | 00Amer00 |
| Permanent Seller | delewatiamer8@gmail.com | 00Amer00 |
| Permanent Courier | delewatiamer9@gmail.com | 00Amer00 |
| Seller (dev) | seller@syano.test | Seller@2026 |
| Customer (dev) | customer@syano.test | Customer@2026 |
| Courier (dev) | courier@syano.test | Courier@2026 |

Admin login: use "Customer" role selector on the login form (admin bypasses role check server-side).

---

## Environment Variables

Auto-provisioned by Replit — no manual setup needed:
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — JWT signing secret

Set in `.replit` `[userenv.shared]` — no manual setup needed:
- `EMBEDDING_SERVICE_URL=http://localhost:8001` — activates semantic search + auto-backfill
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` — web push notifications
- `ROOT_ADMIN_PASSWORD=00Amer00` — root owner bootstrap password

---

## Gotchas

- **After editing API routes:** API server must be rebuilt (restart workflow) — it runs from compiled `dist/`
- **After OpenAPI spec changes:** Run `pnpm --filter @workspace/api-spec run codegen` before touching frontend
- **TypeScript check order:** Always `npx tsc --build lib/db lib/api-zod lib/api-client-react` FIRST, then per-package checks
- **DB push:** Use `pnpm --filter @workspace/db run push` — never `drizzle-kit push` directly (requires TTY)
- **Port 8080 in use:** Only ONE api-server workflow should exist. If you see EADDRINUSE, a duplicate workflow is running.
- **heroBannerSystem recovery module:** Reports false negative (95/100 is correct). Homepage V7 uses HeroV4.tsx, not HeroBanner.tsx.
- **Embedding service backend:** Uses `sentence-transformers` + `torch==2.4.0+cpu` (installed via `pip install --no-cache-dir`, NOT via uv/Replit package manager which fails on Linux). Model loaded from `model/model.safetensors`. Use `pytorch_model.bin` (legacy format) only if you also upgrade torch to ≥2.6 (sentence-transformers v5.5+ blocks it on older torch due to CVE-2025-32434).
- **Embedding service recovery:** If `model.safetensors` is missing, service starts with TF-IDF+LSA fallback. Re-download: `curl -L -o artifacts/embedding-service/model/model.safetensors "https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/resolve/main/model.safetensors"` then restart workflow + reset embeddings + run `pnpm --filter @workspace/api-server embed:generate`.

---

## User Preferences

- Recovery documentation must always be kept up to date and accurate
- Any new agent must read RECOVERY_GUIDE.md before making any changes
- Do not create duplicate workflows — check existing workflows before creating new ones
- When restarting services, use workflow restart (not shell commands)
