# SYANO — AGENT BOOTSTRAP
**Last certified:** June 17, 2026
**This is the FIRST file any new agent must read.**

> If you are a new Replit Agent, DO NOT run recovery, install packages, push schema, or start workflows until you have read this entire file and verified the system is actually broken.

---

## ⚠️ WORKFLOWS — READ BEFORE TOUCHING ANYTHING

The 4 official services are all **artifact-managed** (auto-detected from `artifacts/` subdirectories). They start automatically when the project opens. **Do NOT create manual duplicates.**

| # | Workflow Name | Port | Notes |
|---|---|---|---|
| 1 | `artifacts/api-server: API Server` | 8080 | Dev script sets `PORT=${PORT:-8080}` — starts cleanly on import |
| 2 | `artifacts/marketplace: web` | 5000 | Vite config defaults `PORT ?? "5000"` — renders on port 5000 |
| 3 | `Embedding Service` | 8000 | `cd artifacts/embedding-service && EMBEDDING_PORT=8000 python3 main.py` |
| 4 | `artifacts/mobile: expo` | 18115 | Managed by Replit artifact system |

**On-demand only (not auto-started):** `Component Preview Server` — `cd tools/mockup-sandbox && PORT=9000 BASE_PATH=/__mockup pnpm run dev`

Note: A dead `artifacts/mockup-sandbox: Component Preview Server` entry may appear as "finished" in the workflow list — this is harmless (directory moved to `tools/mockup-sandbox/`).

**Never create new workflows for these services.** If you see `API Server` or `Marketplace` as a separate manual workflow, delete it immediately — it will conflict on port 8080/5000.

---

## QUICK START — IS THE SYSTEM HEALTHY?

```bash
curl -s http://localhost:8080/api/healthz | python3 -m json.tool
```

The enriched health response tells you everything:
```json
{
  "status": "ok",
  "project": "SYANO",
  "version": "2026.06",
  "database": { "connected": true, "tables": 37, "products": 42, "embeddings": 42, "courierTablesOk": true },
  "services": { "api": true, "embedding": true, "embeddingBackend": "tfidf-lsa" },
  "versions": { "courier": "3.3", "search": "2.0", "messaging": "2.0" },
  "mobileParity": 95,
  "activeRoadmap": "...",
  "nextRoadmap": "..."
}
```

- `"status":"ok"` + `"tables":37` + `"courierTablesOk":true` → **System is fully healthy. DO NOTHING. Read CURRENT_STATE.md.**
- `"tables"` < 37 → Run migrations (see RECOVERY PROCEDURE)
- `"courierTablesOk":false` → Courier V3.3 tables missing — restart API (run-migrations.ts fixes it)
- Any error / 503 → Follow the RECOVERY PROCEDURE section at the bottom of this file.

### One-command certification check (after fresh import):
```bash
pnpm import:check    # Full 10-section PASS/FAIL certification
pnpm recovery:report # Generates RECOVERY_REPORT.md from live state
```

---

## PROJECT IDENTITY

| Field | Value |
|---|---|
| Name | SYANO — سوق سوريا |
| Type | Multi-vendor Syrian marketplace |
| Domain | syanomarket.online |
| Architecture | Monorepo — pnpm workspaces |
| Frontend | React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui |
| API | Express 5 + Drizzle ORM + PostgreSQL |
| Mobile | Expo (React Native) + expo-router |
| Validation | Zod v4 + drizzle-zod |
| Auth | JWT HS256 in localStorage (web) / AsyncStorage (mobile) |
| i18n | Arabic + English, RTL/LTR, 2,832+ keys each |

---

## CURRENT VERIFIED STATE (Certified June 17, 2026)

### Services
| Service | Port | Status |
|---|---|---|
| API Server | 8080 | ✅ RUNNING |
| Marketplace (web) | 5000 | ✅ RUNNING |
| Embedding Service | 8000 | ✅ RUNNING (TF-IDF mode) |
| Mobile Expo | 18115 | ✅ RUNNING |

### Database
| Check | Value | Status |
|---|---|---|
| Total tables | 37 | ✅ |
| Products | 42/42 | ✅ |
| Users | 12 | ✅ |
| Seller applications (approved) | 5 | ✅ |
| Delivery zones | 40 | ✅ |
| Search synonyms | 96 | ✅ |
| notification_type enum | 33 values | ✅ |
| order_status enum | 15 values | ✅ |
| FTS indexed | 42/42 | ✅ |
| Embedding vectors | 42/42 (TF-IDF) | ✅ |

### TypeScript (0 errors across all packages)
| Package | Status |
|---|---|
| lib/db + lib/api-zod + lib/api-client-react | ✅ 0 errors |
| artifacts/api-server | ✅ 0 errors |
| artifacts/marketplace | ✅ 0 errors |
| artifacts/mobile | ✅ 0 errors |

### Mobile
| Metric | Value |
|---|---|
| Total screens | 55 |
| Overall parity | 87% (143/164 web features) |
| Auth parity | 100% |
| Wishlist parity | 100% |
| Notifications parity | 100% |

---

## ARCHITECTURE — NEVER VIOLATE

1. **Contract-first API** — OpenAPI spec → Orval codegen → Zod + React Query hooks. Never hand-write API calls in frontend.
2. **Additive-only DB** — Never drop or alter existing columns. Add columns only via `ADD COLUMN IF NOT EXISTS`.
3. **No breaking API response shapes** — add optional fields only, never remove fields.
4. **Price system** — All DB prices are in SYP (Syrian Pounds). `format(sypAmount)` divides by exchange rate for USD display. Never multiply.
5. **JWT in localStorage** (web) / AsyncStorage (mobile). Token getter set via `setAuthTokenGetter()`.
6. **i18n mandatory** — All visible strings via i18n keys (en.json / ar.json on web; mobile/src/i18n/index.ts on mobile). Zero hardcoded strings.
7. **RTL/LTR** — Use Tailwind logical classes: `ms-` not `ml-`, `ps-` not `pl-`, `start-` not `left-`.
8. **TypeScript strict** — 0 errors mandatory. Never use `any`.

---

## COURIER SYSTEM — V3.3 (COMPLETE — DO NOT REBUILD)

**Architecture:**

```
Order (placed)
  ↓
DeliveryMission (created by admin or auto-dispatch)
  ↓
MissionOffer (sent to nearest couriers via Haversine sort)
  ↓
Courier accepts → Assignment created
  ↓
Courier: ONLINE → BUSY
  ↓
pickup → start_delivery → deliver (or fail_delivery)
  ↓
Courier: BUSY → ONLINE (auto-restore)
```

**Key tables:**
| Table | Purpose |
|---|---|
| `delivery_missions` | One per order needing delivery |
| `mission_offers` | Offer sent to specific courier (pending/accepted/rejected/expired) |
| `courier_assignments` | Active assignment once courier accepts |
| `dispatch_alerts` | Auto-dispatch attempt log (no couriers found alerts) |
| `couriers` | Courier profile with `availability_status` (ONLINE/OFFLINE/BUSY) |
| `delivery_zones` | 40 Aleppo zones with lat/lng boundaries |

**Key behaviors:**
- `findNearestCouriers()` uses Haversine distance sort (current_lat/current_lng on couriers table)
- `assignMission()` atomically changes courier ONLINE → BUSY
- On deliver/fail-delivery: courier automatically restores to ONLINE
- On order cancel: courier automatically restores to ONLINE
- Race condition protection: SELECT FOR UPDATE on assignment
- `dispatch_alerts` table logs when no courier is found for auto-dispatch

**Routes:**
- `POST /api/admin/delivery-missions` — create mission
- `POST /api/admin/delivery-missions/:id/offer` — offer to couriers
- `GET /api/admin/delivery-missions/stats` — stats dashboard
- `POST /api/couriers/assignments/:id/pickup` — courier picks up
- `POST /api/couriers/assignments/:id/start-delivery` — en route
- `POST /api/couriers/assignments/:id/deliver` — delivered (restores ONLINE)
- `POST /api/couriers/assignments/:id/fail-delivery` — failed (restores ONLINE)

**Never rebuild this system. Extend only.**

---

## SEARCH SYSTEM — VERIFIED ARCHITECTURE

**13-step NLP pipeline** (`artifacts/api-server/src/utils/searchProcessor.ts`):
1. Normalize Arabic/Latin
2. Stop word removal (Syrian dialect + standard)
3. Dialect synonym expansion (70+ entries)
4. Stemming
5. Intent detection (7 groups: cheap/premium/rating/newest/used/on_sale/gift)
6. Token expansion via `search_synonyms` table (96 rows, 5-min TTL cache)
7. Query construction
8. GIN FTS query execution
9. 4-level fallback chain: relaxed FTS → trigram >0.25 → category → trending
10. Semantic blend (TF-IDF/LSA; full sentence-transformers when model loaded)
11. RRF scoring (FTS 0.65 + semantic 0.35)
12. Quality/freshness scoring
13. LRU cache (500 entries)

**Key endpoints:**
- `GET /api/search?q=...` — main search with NLP
- `GET /api/search/suggestions?q=...` — autocomplete
- `GET /api/suggestions/popular` — trending
- `GET /api/admin/search/health` — index health (42/42 indexed)
- `POST /api/admin/search/reindex` — reindex all products

**Embedding service:** Runs on port 8000. TF-IDF/LSA fallback is intentional during development. Full sentence-transformer semantics requires `model.safetensors` (449MB). Do NOT install torch during development.

---

## MOBILE AUTH — VERIFIED WORKING

**Root cause of "generic error" reports:** The in-memory rate limiter (10 attempts/15 min per IP, 5 attempts/hour per user) triggers when too many test calls are made rapidly. **Fix: restart API Server workflow to clear rate limiter.**

**Mobile auth flow:**
```
login.tsx
  → getBaseUrl() = https://${EXPO_PUBLIC_DOMAIN}
  → EXPO_PUBLIC_DOMAIN = REPLIT_DEV_DOMAIN (set in mobile workflow command)
  → POST https://xxx.replit.dev/api/auth/login
  → Replit proxy → Vite dev server (port 5000)
  → Vite /api proxy → API Server (port 8080)
  → JWT returned
  → login(data) stores token in AsyncStorage
  → router.replace("/(tabs)")
```

**Error codes matched:**
| API returns | Mobile displays |
|---|---|
| `USER_NOT_FOUND` | `t("auth.no_account_found")` |
| `INVALID_PASSWORD` | `t("auth.incorrect_password")` |
| `ACCOUNT_SUSPENDED` (403) | Alert + redirect |
| 429 with `retryAfter` | `t("auth.rate_limited", {seconds})` |
| `Email already registered` | `t("auth.email_taken")` |
| `Phone number already registered` | `t("auth.phone_taken")` |

**Auth is NOT broken. All 3 permanent accounts verified working.**

---

## DEMO ACCOUNTS (PERMANENT — DO NOT DELETE)

| Role | Email | Password | DB ID |
|---|---|---|---|
| Admin (Root Owner) | delewatiamer7@gmail.com | 00Amer00 | 1 |
| Seller | delewatiamer8@gmail.com | 00Amer00 | 2 |
| Courier | delewatiamer9@gmail.com | 00Amer00 | 3 |
| Seller (dev) | seller@syano.test | Seller@2026 | varies |
| Customer (dev) | customer@syano.test | Customer@2026 | varies |

Admin login: use email `delewatiamer7@gmail.com` — admin bypasses role check server-side.

---

## MOBILE PARITY STATUS (Certified June 17, 2026)

**Total: 87% — 143/164 web features — 55 screens**

| System | Parity |
|---|---|
| Authentication | 100% |
| Notifications | 100% |
| Wishlist | 100% |
| Marketplace/Browsing | 93% |
| Messaging V2 | 92% |
| Orders | 86% |
| Customer Profile/Account | 88% |
| Seller Systems | 88% |
| Courier Systems | 88% |
| Admin Systems | 88% |
| AI Support | 83% |
| Checkout | 83% |
| Cart | 80% |
| Static/Info Pages | 80% |
| Search | 65% |

**Screen inventory (55 screens):**
- Auth: login, register, forgot-password, account-suspended
- Tabs: home/shop, cart, orders, messages, notifications, wishlist, profile
- Marketplace: product/[id], store/[slug], stores/index, categories, verify
- Shopping: checkout, order/[id], order-success
- Customer: settings, support, customer-dashboard, seller-apply/status, courier-apply/status
- Seller: products, products/new, products/[id]/edit, orders, orders/[id], analytics, reviews, store-settings, trust
- Courier: dashboard, missions, history
- Admin: index, users, orders, sellers, courier-applications, verification, support, delivery-missions, hero-banners
- Static: about, contact, help, privacy-policy, terms, returns, cookies

**Remaining gaps (~13%):**
- Checkout coupon/promo code (no API exists yet)
- Full NLP filter panel (basic filters done)
- Variant builder on mobile
- Guest cart (pre-auth)
- Admin analytics/revenue charts

---

## COMPLETED SYSTEMS (ALL PHASES)

| System | Phase | Status |
|---|---|---|
| Core marketplace (auth, products, cart, checkout, orders) | Pre-launch | ✅ 100% |
| Seller ecosystem (dashboard, analytics, orders V2, store V4, variants) | Pre-launch | ✅ 100% |
| Admin panel (stats, moderation, user mgmt, delivery, courier) | Pre-launch | ✅ 100% |
| Trust & verification (0-100 score, tiers, audit log) | Pre-launch | ✅ 100% |
| Delivery system (40 zones, courier ops, V3.3 assignment) | Courier V3.3 | ✅ 100% |
| Messaging V2 (19 endpoints, read receipts, attachments, SSE) | Phase 8 | ✅ 100% |
| Notifications (SSE, polling, web push VAPID) | Phase 8 | ✅ 100% |
| Wishlist (web + mobile) | Phase 8 / M1 | ✅ 100% |
| Guest cart (all entry points) | Phase 9 | ✅ 100% |
| Homepage V7 (8 sections, hero carousel, real data) | Phase 10 | ✅ 100% |
| Search V2 (NLP, synonyms, intent, 4-tier fallback, LRU cache) | Phase 9 | ✅ 100% |
| Semantic search (TF-IDF/LSA; sentence-transformers when loaded) | Phase 9 | ✅ 100% |
| AI Customer Service (Phase 13) | Phase 13 | ✅ 100% |
| SEO layer (helmet, sitemap, robots, JSON-LD) | Phase 11 | ✅ 100% |
| Performance (LRU cache, pool tuning, lazy chunks) | Phase 12 | ✅ 100% |
| Mobile auth parity (Phase M0.5) | M0.5 | ✅ 100% |
| Mobile marketplace core (Phase M1) | M1 | ✅ 100% |
| Mobile customer systems (Phase M2) | M2 | ✅ 100% |
| Mobile seller systems (Phase M4) | M4 | ✅ 100% |
| Mobile courier systems (Phase M5) | M5 | ✅ 100% |
| Mobile admin systems (Phase M6) | M6 | ✅ 100% |
| Mobile admin ext + shop filters (Phase Mx+1) | Mx+1 | ✅ 100% |
| Mobile parity finalization (Phase Mx) | Mx | ✅ 100% |

---

## KEY FILES REFERENCE

| File | Purpose |
|---|---|
| `lib/db/src/schema/` | Drizzle ORM schema (37 tables) |
| `lib/api-spec/openapi.yaml` | Source-of-truth OpenAPI contract |
| `lib/api-zod/src/index.ts` | Generated Zod schemas — DO NOT EDIT |
| `lib/api-client-react/src/` | Generated React Query hooks — DO NOT EDIT |
| `artifacts/api-server/src/routes/` | All 26 Express route files |
| `artifacts/api-server/src/utils/searchProcessor.ts` | 13-step NLP pipeline (860 lines) |
| `artifacts/api-server/src/services/searchCache.ts` | LRU 500-entry cache |
| `artifacts/api-server/src/services/deliveryMissionService.ts` | Courier V3.3 dispatch engine |
| `artifacts/api-server/src/routes/search.ts` | FTS + semantic search (1,910 lines) |
| `artifacts/marketplace/src/App.tsx` | React router + all lazy pages |
| `artifacts/marketplace/src/pages/search/index.tsx` | Shop/search page (1,229 lines) |
| `artifacts/marketplace/src/i18n/en.json` | English translations (2,832 keys) |
| `artifacts/marketplace/src/i18n/ar.json` | Arabic translations (2,832 keys) |
| `artifacts/marketplace/vite.config.ts` | Vite config — /api proxy → port 8080 CRITICAL |
| `artifacts/mobile/app/_layout.tsx` | Root layout — setBaseUrl + all Stack.Screen registrations |
| `artifacts/mobile/src/i18n/index.ts` | Mobile i18n (separate from web) |
| `artifacts/embedding-service/main.py` | FastAPI TF-IDF/LSA service (port 8000) |

---

## WORKFLOW COMMANDS (DO NOT CHANGE)

| Workflow Name | Command | Port |
|---|---|---|
| API Server | `cd artifacts/api-server && PORT=8080 pnpm run dev` | 8080 |
| Marketplace | `cd artifacts/marketplace && PORT=5000 BASE_PATH=/ API_PORT=8080 pnpm run dev` | 5000 |
| Embedding Service | `cd artifacts/embedding-service && EMBEDDING_PORT=8000 python3 main.py` | 8000 |

**CRITICAL:** Do NOT create new workflows with these names — port conflicts will kill both.

---

## RECOVERY PROCEDURE (Use only if healthz fails)

### Step 1 — Check if workflows are just stopped
Restart workflows in order: API Server → Marketplace → Embedding Service

### Step 2 — If DB is empty (fresh environment)
```bash
# Install packages
pnpm install --shamefully-hoist

# Push schema
psql "$DATABASE_URL" -f schema.sql

# Build libs
npx tsc --build lib/db lib/api-zod lib/api-client-react

# Start workflows (restart, not create)
# Then verify:
curl -s http://localhost:8080/api/healthz
```

### Step 3 — If API starts but shows DB errors
```bash
# run-migrations.ts runs automatically on API start
# It adds 16 additive tables/columns
# Check logs for "run-migrations complete"
```

### Step 4 — If embeddings are 0/42
```bash
pnpm --filter @workspace/api-server embed:generate
```

### Step 5 — Rate limiter triggered (auth returns 429 unexpectedly)
Restart API Server workflow — in-memory rate limiter clears on restart.

### Step 6 — Verify
```bash
curl -s http://localhost:8080/api/healthz          # → {"status":"ok","database":{"tables":37,...}}
curl -s http://localhost:8000/health               # → {"status":"ok","backend":"tfidf-lsa"}
psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM products;"  # → 42
pnpm import:check                                  # → PASS WITH WARNINGS (1 optional env var)
pnpm recovery:report                               # → generates RECOVERY_REPORT.md
```

### Full recovery: See `RECOVERY_GUIDE.md`

---

## KNOWN ISSUES & CONSTRAINTS

| Issue | Impact | Notes |
|---|---|---|
| `delivery_missions` missing from schema.sql | Medium | schema.sql still missing CREATE TABLE — run-migrations.ts creates it on first API start (workaround OK) |
| Embedding service TF-IDF mode | Low | model.safetensors (449MB) not loaded; TF-IDF fully functional for development |
| Rate limiter resets on API restart | Low | In-memory — intentional; restart clears it |
| customer@syano.test may not exist | Low | Dev account, not permanent; use delewatiamer* accounts |

---

## IMPORT HARDENING TOOLS (Added June 17, 2026)

These tools make the project self-certifying after a fresh GitHub import:

| Command | Purpose |
|---|---|
| `pnpm import:check` | 10-section PASS/FAIL certification (DB, enums, columns, drift, seed, services, files) |
| `pnpm recovery:report` | Generates `RECOVERY_REPORT.md` from live DB state |
| `pnpm manifest:generate` | Refreshes `project.manifest.json` with live DB counts |

**`project.manifest.json`** — machine-readable project state at workspace root. An agent can read this one file to understand the full project state without reading markdown documentation.

**`GET /api/healthz`** — returns full live state (tables, products, embeddings, service status, versions, roadmap phase). One HTTP call = complete project snapshot.

**`artifacts/api-server/src/lib/startup-validation.ts`** — runs on every API boot (after migrations). Validates all 15 critical tables, courier V3.3 tables, enums, and migration columns. Logs exact diagnostics. Never crashes the server.

---

## FUTURE AGENT FIRST ACTIONS

1. Read this file ✅
2. `curl -s http://localhost:8080/api/healthz` — enriched response tells you tables, products, courier status, versions
3. If starting fresh: `pnpm import:check` — 10-section certification with exact failures
4. Read `CURRENT_STATE.md` to know exactly where development stopped
5. Only then proceed with the assigned task

**Never re-read all docs from scratch if healthz returns OK. Start from CURRENT_STATE.md.**

**After fresh GitHub import:** `pnpm install` → start workflows → `pnpm import:check` → should show PASS.
