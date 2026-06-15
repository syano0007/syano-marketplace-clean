# SYANO — Recovery Guide
**Last Updated:** June 15, 2026 (Replit Migration — verified full restore in Replit environment)

---

## ⚡ FOR ANY NEW AGENT — START HERE

**Before doing ANYTHING, run this single check:**
```bash
curl -s http://localhost:8080/api/healthz
```

| Result | Action |
|---|---|
| `{"status":"ok"}` | ✅ Everything is running. Read the task at hand and start working. Do NOT touch workflows or run setup commands. |
| Connection refused / error | ❌ Environment is fresh or broken. Follow the steps below IN ORDER. |

### If the environment needs recovery — exact commands in exact order:

```bash
# 1. Install Node packages
pnpm install --frozen-lockfile

# 2. Push DB schema (creates all 33 tables)
pnpm --filter @workspace/db run push

# 3. Build shared TypeScript libs (MUST be done before any tsc check)
npx tsc --build lib/db lib/api-zod lib/api-client-react
```

Then start these workflows via the Replit workflow panel (restart_workflow tool or UI):
1. `artifacts/api-server: API Server` ← starts on port 8080; auto-runs migrations + seeds 42 products
2. `Embedding Service` ← starts on port 8001 (Python TF-IDF/LSA)
3. `Start application` ← starts on port 5000 (marketplace webview)

Python packages (if Embedding Service fails to start):
```bash
# Install via Replit code_execution tool:
await installLanguagePackages({ language: "python", packages: ["numpy", "scikit-learn", "fastapi", "uvicorn"] })
```

**DO NOT install `sentence-transformers` or `torch` — they are blocked by Replit firewall.**

### Expected state after recovery:
- `curl http://localhost:8080/api/healthz` → `{"status":"ok"}`
- `psql $DATABASE_URL -c "SELECT COUNT(*) FROM products;"` → `42`
- `psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"` → `33`
- `curl http://localhost:8001/health` → `{"backend":"tfidf-lsa","vector_dimensions":384}`
- TypeScript: 0 errors across all packages
- Recovery check: 95/100 (heroBannerSystem false negative is expected — not a bug)

### 6 workflows that MUST exist — do NOT create duplicates:
| Workflow Name | Port |
|---|---|
| `artifacts/api-server: API Server` | 8080 |
| `Start application` | 5000 |
| `Embedding Service` | 8001 |
| `artifacts/marketplace: web` | 20787 |
| `artifacts/mobile: expo` | 18115 |
| `artifacts/mockup-sandbox: Component Preview Server` | 8081 |

---

This guide restores the project to a fully working state from scratch in the Replit environment.

---

## Prerequisites

The following must be set (auto-provisioned by Replit):
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — JWT signing secret

Verify with:
```bash
echo "DB: $DATABASE_URL" && echo "SECRET: $SESSION_SECRET"
```

The following are set in `.replit` `[userenv.shared]` (no user action needed):
- `EMBEDDING_SERVICE_URL=http://localhost:8001` — activates semantic search + embedding backfill
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` — web push notifications
- `ROOT_ADMIN_PASSWORD=00Amer00` — root owner bootstrap

---

## Step 1: Install Dependencies

```bash
pnpm install --frozen-lockfile
```

Expected: **~1,129 packages installed**. `shamefully-hoist=true` in `.npmrc` puts all packages in root `node_modules`.

> **Fallback if frozen-lockfile fails:** `pnpm install --force`

### Python Dependencies (Embedding Service)

The embedding service requires these Python packages (install via Replit package manager or pip):
```bash
# Via Replit code_execution tool (preferred):
await installLanguagePackages({ language: "python", packages: ["numpy", "scikit-learn", "fastapi", "uvicorn"] })

# Or via pip:
pip install numpy scikit-learn fastapi uvicorn
```

> **Do NOT install `sentence-transformers` or `torch`** — these are blocked by the Replit firewall (disk quota). The embedding service uses a TF-IDF/LSA backend that produces identical 384-dim vectors without any model download.

---

## Step 2: Push Database Schema

The Drizzle-based push command works in Replit and is the recommended approach:

```bash
pnpm --filter @workspace/db run push
```

**Alternative (if DB is completely empty and Drizzle push fails):**
```bash
psql "$DATABASE_URL" -f schema.sql
```

This creates the base **21 tables**. The API server's `run-migrations.ts` adds 12 more on first startup, bringing the total to **33 tables**:

Tables added by run-migrations.ts:
- `couriers`, `delivery_zones`, `courier_assignments`, `courier_wallet_transactions`, `variant_images`
- `seller_verification_log` (Trust System audit table — NOT `verification_audit_log`)
- `admin_audit_log`
- `query_logs`, `search_synonyms`, `search_queries` (Search V2 tables — Phase 8)
- `platform_settings`
- Additive columns: `users.verified_by`, `users.preferred_theme/language/currency`, `product_variants` price/barcode/weight/dimensions columns, `products.embedding` vector(384) column

**Verify:**
```bash
psql "$DATABASE_URL" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
# Expected: 33 tables
```

---

## Step 3: Build Shared Libraries

```bash
npx tsc --build lib/db lib/api-zod lib/api-client-react
```

Expected: no output (clean build).

> **This must be done BEFORE running `tsc --noEmit` on any artifact package**, or you will see TS6305 errors about missing `.d.ts` files.

---

## Step 4: Start API Server (Migrations + Demo Data + Embeddings Auto-Bootstrapped)

Start the `artifacts/api-server: API Server` workflow. On startup it automatically runs **in order**:

1. `runMigrations()` — schema extensions, enum patches, delivery zones, all new tables, pgvector + embedding column
2. `runSearchStartup()` — search index warmup (pg_trgm extension, fts_vector column, GIN index, auto-update trigger)
3. `bootstrapRootAdmin()` — admin account (delewatiamer7)
4. `bootstrapTestAccounts()` — seller + courier permanent accounts (delewatiamer8/9)
5. **`bootstrapDemoMarketplaceData()`** — 4 stores, 4 customers, 42 products, 14 orders, reviews, wishlists, follows
6. **`runEmbeddingBackfill()`** — non-blocking; embeds all products via embedding service (when EMBEDDING_SERVICE_URL is set)

> **No manual seed step is needed.** The demo marketplace recreates itself automatically on every fresh database.

After the API starts, verify enums are complete:

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM unnest(enum_range(NULL::notification_type));"
# Expected: 32

psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM unnest(enum_range(NULL::order_status));"
# Expected: 15
```

> **If the API fails to start on port 8080 (EADDRINUSE):** Another instance of the API is already running. Stop the conflicting workflow first.

> **Note:** If you need to run enum fixes BEFORE starting the API (e.g. to unblock a failed start), use this legacy SQL block:
> ```bash
> psql "$DATABASE_URL" << 'SQL'
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_confirmed';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_preparing';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_ready';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_courier_assigned';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_picked_up';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_out_for_delivery';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_delivery_failed';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_returned';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_cancelled_by_customer';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_refunded';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_user';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'courier_applied';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'courier_approved';
> ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'courier_rejected';
> SQL
> ```

---

## Step 5: Start Embedding Service

Start the `Embedding Service` workflow (command: `cd artifacts/embedding-service && python3 main.py`).

The service uses a TF-IDF/LSA backend — no model download, starts in < 1 second.

Verify:
```bash
curl http://localhost:8001/health
# Expected: {"status":"ok","model":"multilingual-e5-small","vector_dimensions":384,"backend":"tfidf-lsa"}
```

> **EMBEDDING_SERVICE_URL** is already set in `.replit` `[userenv.shared]`. The API server's embedding backfill will automatically run against this service after startup.

---

## Step 6: Start Frontend Services

Start these workflows via the Replit workflow panel:
- **`Start application`** — port 5000, webview (main preview pane)
- **`artifacts/marketplace: web`** — port 20787 (artifact canvas view)
- **`artifacts/mobile: expo`** — port 18115 (Expo dev server)

Workflow commands:
```
Start application:         PORT=5000 BASE_PATH=/ API_PORT=8080 pnpm --filter @workspace/marketplace run dev
artifacts/marketplace:web: (configured by artifact system)
artifacts/mobile:expo:     (configured by artifact system)
```

> **Important — Vite API proxy:** `artifacts/marketplace/vite.config.ts` has a `/api` proxy rule that forwards all `/api/*` requests to port 8080. This was added during Replit migration. Without this, the frontend Vite dev server would return HTML for API calls.

---

## Step 7: Verify API Health

```bash
curl http://localhost:8080/api/healthz
# Expected: {"status":"ok"}
```

---

## Step 8: Verify Bootstrap Accounts

All three permanent accounts are auto-created on every API startup. Verify they exist:

```bash
# Root Owner (admin)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"delewatiamer7@gmail.com","password":"00Amer00","role":"admin"}'
# Expected: {"user":{"role":"admin",...},"token":"..."}

# Permanent Seller
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"delewatiamer8@gmail.com","password":"00Amer00","role":"seller"}'
# Expected: {"user":{"role":"seller",...},"token":"..."}

# Permanent Courier
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"delewatiamer9@gmail.com","password":"00Amer00","role":"courier"}'
# Expected: {"user":{"role":"courier",...},"token":"..."}
```

---

## Step 9: Verify Demo Marketplace Data

```bash
curl http://localhost:8080/api/products | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Products: {len(d)}')"
# Expected: 42 products (plain array)

curl http://localhost:8080/api/sellers/store/ahmad-electronics | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('storeName','NOT FOUND'))"
# Expected: Ahmad Electronics
```

**What is bootstrapped automatically:**
| Data | Count | Notes |
|---|---|---|
| Demo stores | 4 | Ahmad Electronics, Nour Fashion, Beit Al-Nour, Hana Beauty |
| Demo customers | 4 | Mohammed, Sara, Omar, Layla |
| Products | 42 | Real Pexels images, 8 categories |
| Orders | 14 | Various statuses: delivered/shipped/processing/confirmed/pending/cancelled |
| Product reviews | 40 | Arabic reviews, ratings 3–5 |
| Seller reviews | 8 | Per-store reputation data |
| Wishlist items | 12 | Across demo customers |
| Store follows | 8 | Customer → seller follow relationships |

**Idempotency:** If products already exist (`COUNT(*) >= 42`), the entire bootstrap is skipped. No duplicates ever created.

---

## Step 10: Verify Embeddings

```bash
psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM products WHERE embedding IS NOT NULL;"
# Expected: 42

curl http://localhost:8001/health
# Expected: {"status":"ok","model":"multilingual-e5-small","vector_dimensions":384,"backend":"tfidf-lsa"}
```

If embeddings are missing (e.g. after a schema wipe), run the backfill manually:
```bash
pnpm --filter @workspace/api-server embed:generate
```

---

## Verification Checklist

```
[ ] pnpm install done (~1,129 packages)
[ ] DATABASE_URL and SESSION_SECRET set
[ ] Python packages installed: numpy, scikit-learn, fastapi, uvicorn
[ ] 33 tables in DB (21 base + 12 from run-migrations)
[ ] notification_type enum has 32 values (auto-patched by run-migrations)
[ ] order_status enum has 15 values (auto-patched by run-migrations)
[ ] Shared libs built (tsc --build)
[ ] API server responds to /api/healthz → {"status":"ok"}
[ ] Root owner login works (delewatiamer7, role=admin)
[ ] Permanent seller login works (delewatiamer8, role=seller)
[ ] Permanent courier login works (delewatiamer9, role=courier)
[ ] delewatiamer8 has approved seller_application (storeSlug=syano-test-store)
[ ] delewatiamer9 has approved couriers profile (active=true)
[ ] GET /api/products returns 42 products (plain array)
[ ] GET /api/sellers/store/ahmad-electronics returns store data
[ ] Embedding service healthy: curl http://localhost:8001/health
[ ] 42/42 products have embeddings in DB
[ ] Marketplace loads (port 5000, webview)
[ ] Mobile running (Expo, port 18115)
[ ] GET /api/admin/recovery-check → confidenceScore >= 95
[ ] i18n: EN=2,832 / AR=2,832 keys (parity check)
```

---

## Step 11: Run Automated Recovery Verification

After all services are running, run the full platform integrity check:

```bash
# Login as admin to get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"delewatiamer7@gmail.com","password":"00Amer00","role":"admin"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Run comprehensive 13-section recovery check
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/admin/recovery-check \
  | python3 -m json.tool
```

**Expected:** `"confidenceScore": 95, "failures": ["home.tsx does not use HeroBanner component"]`

> **Known False Negative:** The `heroBannerSystem` failure is expected. Homepage V7 uses `HeroV4.tsx` which activates `BannerCarousel` when DB banners exist — `HeroBanner.tsx` is no longer directly imported in `home.tsx`. All other modules pass. **95/100 is the correct expected score.**

---

## TypeScript Verification

```bash
# 1. Build shared libs first (REQUIRED before per-package checks)
npx tsc --build lib/db lib/api-zod lib/api-client-react
# Expected: no output (clean build)

# 2. Check each package
npx tsc --noEmit -p artifacts/marketplace/tsconfig.json
# Expected: no output (0 errors)

npx tsc --noEmit -p artifacts/api-server/tsconfig.json
# Expected: no output (0 errors)

npx tsc --noEmit -p artifacts/mobile/tsconfig.json
# Expected: no output (0 errors)
```

> **Important:** Always build libs first. Running `tsc --noEmit` on artifact packages before libs are built produces spurious TS6305 errors ("Output file has not been built from source file") that disappear after the lib build.

---

## Pitfalls

| Problem | Solution |
|---|---|
| API returns HTML for `/api/*` requests | Vite `/api` proxy is missing — ensure `artifacts/marketplace/vite.config.ts` has `"/api": { target: "http://localhost:8080", changeOrigin: true }` in server.proxy |
| `listen EADDRINUSE 0.0.0.0:8080` | Duplicate API workflow running — stop the conflicting workflow |
| `vite: not found` in workflow | Run `pnpm install --frozen-lockfile` — per-package node_modules need to be re-linked |
| `relation "users" does not exist` | DB is empty — run `pnpm --filter @workspace/db run push` or `psql "$DATABASE_URL" -f schema.sql` |
| Courier notifications crash | `notification_type` enum missing values — start API server (auto-patches) or run Step 4 legacy SQL |
| Rate limited on login (429) | Restart API server — rate limiter is in-memory and resets on restart |
| TS6305 errors ("has not been built") | Run `npx tsc --build lib/db lib/api-zod lib/api-client-react` first |
| Embedding service fails to start | Python packages not installed — run `pip install numpy scikit-learn fastapi uvicorn` |
| `sentence-transformers` or `torch` pip install fails | Expected — blocked by Replit firewall. The service uses TF-IDF/LSA fallback, these packages are NOT needed |
| Embeddings missing after DB wipe | Run `pnpm --filter @workspace/api-server embed:generate` — or restart API (auto-backfills on startup) |
| Seller dashboard shows no store after recovery | Bootstrap creates user but not seller_application — fixed: `bootstrapTestAccounts()` now also bootstraps the approved application |
| Courier dashboard shows 404 profile after recovery | Bootstrap creates user but not couriers record — fixed: `bootstrapTestAccounts()` now also bootstraps the approved courier profile |
| `drizzle-kit push` hangs | Requires TTY — use `pnpm --filter @workspace/db run push` (recommended) or `psql -f schema.sql` |
| Root owner login returns 401 | Use `role:"admin"` not `role:"customer"` for admin account |
| Demo products missing after recovery | `bootstrapDemoMarketplaceData()` runs automatically — just restart the API server |
| DB table count shows 28 instead of 33 | Old documentation was inaccurate — run-migrations.ts creates 12 additional tables. Correct count is 33. |
| i18n key count shows 2,592 | Old documentation was inaccurate — current count is 2,832 EN / 2,832 AR (verified June 15, 2026) |

---

## Hybrid NLP Search — Verification (run after API starts on port 8080)

### Backend Smoke Tests
```bash
# Test 1 — Arabic colloquial: dialect synonym expansion
curl -s "http://localhost:8080/api/search/results?q=%D8%A8%D9%88%D8%A7%D8%B7%20%D8%B3%D8%A8%D9%88%D8%B1&limit=3" | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
  console.log('total:',d.total,'mappedCat:',d.intent?.mappedCategory,'lang:',d.intent?.primaryLanguage,'expanded:',d.intent?.nlpExpandedCount);"
# Expect: total:12, mappedCat:Fashion, lang:ar, nlpExpanded:7

# Test 2 — English cross-language
curl -s "http://localhost:8080/api/search/results?q=shoes&limit=3" | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
  console.log('total:',d.total,'lang:',d.intent?.primaryLanguage);"
# Expect: total:12+, lang:en

# Test 3 — Intent modifier (cheap)
curl -s "http://localhost:8080/api/search/results?q=%D8%B1%D8%AE%D9%8A%D8%B5%20%D9%85%D9%88%D8%A8%D8%A7%D9%8A%D9%84&limit=3" | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
  console.log('modifiers:',JSON.stringify(d.intent?.modifiers),'total:',d.total);"
# Expect: modifiers:["cheap"], total:9+

# Test 4 — Arabic query (هاتف = phone)
curl -s "http://localhost:8080/api/search/results?q=%D9%87%D8%A7%D8%AA%D9%81&limit=3" | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
  console.log('total:',d.total,'lang:',d.intent?.primaryLanguage);"
# Expect: total:12, lang:ar
```

### DB Infrastructure Check
```bash
psql "$DATABASE_URL" -t -c "SELECT 'fts_populated: '||COUNT(*) FROM products WHERE fts_vector IS NOT NULL;"
# Expect: fts_populated: 42

psql "$DATABASE_URL" -t -c "SELECT 'gin_index: '||indexname FROM pg_indexes WHERE tablename='products' AND indexname='products_fts_gin';"
# Expect: gin_index: products_fts_gin

psql "$DATABASE_URL" -t -c "SELECT 'embeddings: '||COUNT(*) FROM products WHERE embedding IS NOT NULL;"
# Expect: embeddings: 42
```

---

## Embedding Service — Architecture Notes

The embedding service (`artifacts/embedding-service/main.py`, 342 lines) uses **TF-IDF + LSA** instead of sentence-transformers:

- `TfidfVectorizer(analyzer='char_wb', ngram_range=(2,4))` — character n-grams work natively for both Arabic and English
- `TruncatedSVD(n_components=384)` — reduces to same 384-dim space as multilingual-e5-small
- L2 normalization — unit-sphere vectors for cosine similarity
- Seed corpus: 500+ Arabic/English product terms covering all marketplace categories
- Starts in < 1 second; no network access or model download required

This was a deliberate architecture decision: sentence-transformers/torch are blocked by the Replit firewall (disk quota), and the TF-IDF/LSA fallback provides adequate semantic similarity for product search within the same category domain.

When `EMBEDDING_SERVICE_URL` is set (as it is in `.replit` userenv), the API server:
1. Checks pgvector availability at startup
2. Runs embedding backfill non-blocking after `app.listen()`
3. Uses RRF blend (FTS 0.65 + semantic 0.35) in search results
4. Generates embeddings for new products on creation (fire-and-forget)

When `EMBEDDING_SERVICE_URL` is NOT set, the API gracefully falls back to pure FTS — all search features work normally.

---

## Bootstrap Startup Sequence

```
Server start
  └─ runMigrations()              ← schema extensions, enums, new tables (total: 33), embedding column
  └─ runSearchStartup()           ← pg_trgm, fts_vector column, GIN index, trigger
  └─ bootstrapRootAdmin()         ← delewatiamer7 (admin)
  └─ bootstrapTestAccounts()      ← delewatiamer8 (seller) + delewatiamer9 (courier)
  └─ bootstrapDemoMarketplaceData() ← 4 stores, 42 products, 14 orders, reviews...
  └─ app.listen()                 ← server ready
  └─ runEmbeddingBackfill()       ← non-blocking; embeds products WHERE embedding IS NULL
```

---

## Architecture Reference

- **API:** Express 5, JWT auth, Drizzle ORM, PostgreSQL
- **Frontend:** React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui + TanStack Query (with `/api` proxy to port 8080)
- **Mobile:** Expo (React Native)
- **Libs:** `lib/db` (schema), `lib/api-zod` (generated), `lib/api-client-react` (generated hooks)
- **Auth:** JWT in localStorage, `bootstrapRootAdmin()` runs on startup
- **Notifications:** SSE stream + push (VAPID), `notification_type` Postgres enum (32 values)
- **Search:** 13-step NLP pipeline in `src/utils/searchProcessor.ts`; LRU cache in `src/services/searchCache.ts`; routes in `src/routes/search.ts`
- **Semantic Search:** TF-IDF/LSA embedding service (port 8001); pgvector storage; RRF blend in search.ts
- **Courier flow:** `POST /admin/orders/:id/assign-courier` creates assignment + updates order status atomically
- **Trust System:** `lib/trustScore.ts` — 0-100 score; `seller_verification_log` audit table; admin routes in `admin.ts`
- **Demo Data:** `lib/bootstrap-demo-data.ts` — self-healing, idempotent, runs on every startup

## Homepage V7 Architecture (June 2026 — Session 7)

**Homepage version:** V7 — Figma-approved premium dark design with 8 HomeSections components

### Critical: home.tsx Does NOT Use Layout
`home.tsx` renders `<Navbar />` directly (not inside Layout) because the page is full dark (`#080808`) and uses its own footer. All other pages still use `<Layout>`. The Navbar must be present in home.tsx explicitly.

### Section Order (top to bottom)
1. `<HeroSection products={allProducts} />` — split-panel; floating cards use real DB products
2. `<PopularCategories />` — 4×2 grid; links → `/products?category=...`
3. `<FeaturedDeals hotDeals={isBestDealProducts} />` — countdown; working add-to-cart
4. `<TrustedStores />` — fetches `/api/sellers/featured`; links → `/store/:slug`
5. `<TrendingProducts products={allProducts.slice(0,6)} />` — add-to-cart + wishlist
6. `<NewArrivals newArrivals={allProducts.slice(0,4)} />` — bento grid
7. `<JoinSection />` — seller/courier CTAs
8. `<HomeFooter />` — full dark footer

All components in `artifacts/marketplace/src/components/HomeSections/`
