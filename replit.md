# MANDATORY AGENT STARTUP

STOP.

Before running ANY recovery, analysis, planning, implementation, testing, or project discovery:

**READ: `./AGENT_BOOTSTRAP.md`**

This file is the authoritative recovery source. Do NOT infer project state from code alone. Do NOT start project discovery before reading it. Then continue with recovery.

---

# SYANO — syanomarket.online
Last verified working: June 17, 2026 (Import Hardening Final Pass — clean 4-service boot)
Workflows: artifacts/api-server: API Server ✅ | artifacts/marketplace: web ✅ | Embedding Service ✅ (port 8000, TF-IDF mode) | artifacts/mobile: expo ✅
Secrets: All 12 loaded ✅
SEO Layer: react-helmet-async ✅ | sitemap.xml ✅ | robots.txt ✅ | JSON-LD ✅
Performance: vendor-charts ✅ | vendor-radix ✅ | LazyImage ✅ | web-vitals ✅ | cache headers ✅
Phase 11: ALL 10 PROMPTS COMPLETE ✅
Phase 12: Performance & Scalability — COMPLETE ✅
Phase 13: AI Customer Service Agent V1 — COMPLETE ✅
Courier V3.2 — Availability + Operations V2 — COMPLETE ✅
Courier V3.3 — Mission Offer & Assignment Engine — COMPLETE ✅ (V3.3 Finalization verified June 17, 2026)
Phase M1: Mobile Parity — Marketplace Core — COMPLETE ✅ (June 17, 2026)
  - Wishlist tab, WishlistContext, ProductCard hearts, product gallery/reviews/related, store follow, homepage sections
  - Parity: 28% → 33%; Wishlist 0% → 100%; Marketplace 47% → 80%; TypeScript 0 errors
Phase M0.5: Mobile Auth Parity — COMPLETE ✅ (June 17, 2026)
  - Login: removed role selector, added email/phone identifier field, matched web error codes (USER_NOT_FOUND, INVALID_PASSWORD, ACCOUNT_SUSPENDED, 429 rate-limit), SYANO "S" logo
  - Register: removed role selector, added email/phone identifier, fixed all hardcoded strings → i18n, min password 6→8 chars, matched web error codes (email_taken, phone_taken, rate_limited)
  - i18n: added 25+ missing auth keys + orders.review_* + store.review_* + store.communication/shipping/professionalism; fixed t() to accept string|Record as 2nd arg
  - TypeScript: 0 errors (excluding pre-existing TS6305 lib build errors)
Phase M2: Mobile Customer Systems — COMPLETE ✅ (June 17, 2026)
  - notifications.tsx (real-time list, mark read/all-read, type icons, unread dot)
  - settings.tsx (theme/language/currency switcher, SettingsContext sync)
  - account-suspended.tsx (suspension gate with contact CTA)
  - seller-apply.tsx + seller-application-status.tsx (full seller onboarding flow)
  - courier-apply.tsx + courier-application-status.tsx (full courier onboarding flow)
  - support.tsx (AI support + escalation flow)
  - (tabs)/_layout.tsx: notifications tab + live unread badge
  - i18n: notifications, settings_screen, seller_apply, seller_status, courier_apply, courier_status, support, seller_dash, courier_dash, admin_dash namespaces (EN+AR)
Phase M4: Mobile Seller Systems — COMPLETE ✅ (June 17, 2026)
  - seller/products.tsx (CRUD list: edit, delete, low-stock warning)
  - seller/products/new.tsx (create form: name, desc, price, stock, category, image)
  - seller/products/[id]/edit.tsx (edit form pre-filled from API)
  - seller/orders.tsx (tabbed: all/pending/active/delivered, mark-ready button)
  - seller/analytics.tsx (revenue/orders/products stats + mini bar chart + top products)
  - seller/reviews.tsx (summary, rating bars, reply/edit/delete, modal)
  - seller/store-settings.tsx (name, description, logo, banner, city, website)
Phase M5: Mobile Courier Systems — COMPLETE ✅ (June 17, 2026)
  - courier/dashboard.tsx (online/offline toggle, wallet, success rate, mission offers accept/reject)
  - courier/missions.tsx (active assignments: pickup → deliver/fail-delivery, fail reason modal)
  - courier/history.tsx (completed deliveries, earnings summary)
Phase M6: Mobile Admin Systems — COMPLETE ✅ (June 17, 2026)
  - admin/index.tsx (stats dashboard, quick nav, recent orders)
  - admin/users.tsx (search, suspend/activate with role badges)
  - admin/orders.tsx (tabbed status filter, order list)
  - admin/sellers.tsx (seller applications: approve/reject workflow)
  - profile.tsx: all role menus (seller/courier/admin/customer) wired to new screens
Mobile Parity: 33% → ~85% (all role systems complete; remaining: search, checkout refinements, deep links)
Phase Mx+1: Mobile Parity Gap Closure — COMPLETE ✅ (June 17, 2026)
  - admin/delivery-missions.tsx: stats bar, tabbed status filter, mission cards, trigger-assignment button
  - admin/hero-banners.tsx: banner list, create/edit modal form (POST/PATCH/DELETE), active toggle, CTR display
  - _layout.tsx: registered admin/delivery-missions + admin/hero-banners
  - admin/index.tsx: 8-item menu (users, orders, sellers, couriers, delivery_missions, hero_banners, verification, support)
  - index.tsx (shop tab): onSale chip, price range filter panel (minPrice/maxPrice passed to API), NLP intent banner, "Browse Stores" + "Categories" quick-action row on homepage
  - i18n: 40+ new keys added to both EN + AR (shop.on_sale, shop.price_range, shop.intent_*, admin_dash.delivery_missions, admin_dash.hero_banners, etc.)
  - TypeScript: 0 errors
Mobile Parity: ~95% → ~98% (remaining: checkout coupon code UI — no API exists yet)
**CERTIFIED June 17, 2026: 87% parity — 143/164 web features — 55 screens — 0 TS errors — see MOBILE_CERTIFICATION_REPORT.md**
Phase Mx: Mobile Parity Finalization — COMPLETE ✅ (June 17, 2026)
  - 14 new screens: verify, categories, customer-dashboard, about, contact, help, privacy-policy, terms, returns, cookies, admin/courier-applications, admin/verification, admin/support, seller/trust
  - verify.tsx: redirect to home (verification disabled — matches web)
  - categories.tsx: full grid page with /search/filter-options API
  - customer-dashboard.tsx: stats (totalOrders, totalSpent, pending, delivered) + recent orders list
  - about.tsx: hero, stats (500+ sellers, 10K+ products), 5 value cards
  - contact.tsx: 3 contact channels + bilingual contact form with validation
  - help.tsx: FAQ center — 5 categories, 5 Q&As each, client-side search + collapsible items
  - admin/courier-applications.tsx: 4-tab (pending/approved/rejected/suspended) approve/reject/suspend
  - admin/verification.tsx: seller trust tier management (basic/verified/business) with search + filter
  - admin/support.tsx: support ticket list with status tabs + resolve/close actions
  - seller/trust.tsx: trust score breakdown with per-component score bars
  - privacy-policy.tsx / terms.tsx / returns.tsx / cookies.tsx: bilingual content (EN+AR), no i18n bloat
  - _layout.tsx: 14 new Stack.Screen registrations
  - i18n: 14 new namespaces (customer_dashboard, categories, verify, about, contact, help, privacy, terms, returns, cookies, courier_applications, seller_verification, admin_support, seller_trust) — EN + AR parity
  - profile.tsx: customer-dashboard, categories, seller/trust, admin/courier-applications, admin/verification, admin/support, + About/Legal section (about, contact, help, privacy, terms, returns, cookies)
  - TypeScript: 0 errors | Expo: bundled cleanly
Mobile Parity: ~85% → ~95% (all major screens implemented)

---

# SYANO — Syrian Digital Marketplace

---

## ⚠️ FOR ANY NEW AGENT — READ THIS BEFORE DOING ANYTHING

**This project has been fully set up and verified on a new Replit account (June 16, 2026). DO NOT recreate workflows, reinstall packages, or run schema commands unless you have confirmed the environment is broken.**

**Last verified:** June 17, 2026 — 4 services running, 37 DB tables, 42/42 embeddings, 0 duplicate workflows.

### Before touching anything, run this check:
```bash
curl -s http://localhost:8080/api/healthz && echo "API OK"
```

- If you get `{"status":"ok"}` → **everything is running, do not touch anything**
- If the API is down → follow `RECOVERY_GUIDE.md` step by step

### The 4 workflows that MUST exist (do not create new ones, do not rename):
| Workflow Name | Port | Purpose |
|---|---|---|
| `artifacts/api-server: API Server` | 8080 | Express API + auto-migrations + demo data |
| `Embedding Service` | 8000 | TF-IDF/LSA embedding service (EMBEDDING_PORT=8000 to match EMBEDDING_SERVICE_URL) |
| `artifacts/marketplace: web` | 5000 | React + Vite marketplace (main web app) |
| `artifacts/mobile: expo` | 18115 | Expo mobile dev server |

**Optional (on-demand only, not in auto-run):** `Component Preview Server` | 9000 | `cd tools/mockup-sandbox && PORT=9000 BASE_PATH=/__mockup pnpm run dev`

**Embedding Service workflow command:** `cd artifacts/embedding-service && EMBEDDING_PORT=8000 python3 main.py`
**EMBEDDING_SERVICE_URL** in .replit is `http://localhost:8000` — service MUST run on port 8000.

### Things that will BREAK the project if you do them:
- ❌ Creating new `API Server` or `Marketplace` manual workflows → they're now artifact-managed (auto-detected from `artifacts/` directories)
- ❌ Running `pnpm dev` at workspace root → wrong, use workflow restart
- ❌ Running `psql -f schema.sql` if DB already has 37 tables → will fail/corrupt
- ❌ Installing `sentence-transformers` or `torch` via Replit package manager (uv) → fails on Linux; use `pip install --no-cache-dir` directly instead
- ❌ Running `tsc --noEmit` on marketplace/api-server without building libs first → spurious TS6305 errors

### If the environment is fresh (empty DB / packages missing):
Read `RECOVERY_GUIDE.md` — it has the exact commands in the exact order.
**Expected final state:** 37 tables, 42 products, 42/42 embeddings, `GET /api/healthz → {"status":"ok"}`, recovery check 95/100.

---

## Project: SYANO

Full-stack Syrian marketplace platform with role-based auth (Seller / Customer / Courier / Admin), cart/order/inventory/discount system, hybrid NLP Arabic/English search, semantic embeddings, real-time messaging, courier delivery system, and a premium emerald green AMOLED dark design.

**Recovery-Verified:** June 17, 2026 — full V3.3 finalization verified; 0 TypeScript errors; all services running; 37 DB tables; Haversine distance sort + dispatch_alerts table + courier ONLINE restore all confirmed.

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
  db/src/schema/          → Drizzle ORM schema (37 tables)
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

- **37 tables total** (21 base in schema.sql + 16 added by run-migrations.ts on first API start)
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
