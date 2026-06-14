# SYANO — Recovery Guide
**Last Updated:** June 14, 2026 (Session 9 — Full Recovery: fresh DB + TS fixes + bootstrap patch)

This guide restores the project to a fully working state from scratch.

---

## Prerequisites

- `DATABASE_URL` — PostgreSQL connection string (must be set)
- `SESSION_SECRET` — JWT signing secret (must be set)

Verify with:
```bash
echo "DB: $DATABASE_URL" && echo "SECRET: $SESSION_SECRET"
```

---

## Step 1: Install Dependencies

```bash
pnpm install --force
```

Expected: **1,131 packages installed** (verified June 13, 2026). `shamefully-hoist=true` in `.npmrc` puts all packages in root `node_modules`.

---

## Step 2: Push Database Schema

**If DB is empty (no tables):**
```bash
psql "$DATABASE_URL" -f schema.sql
```

This creates the base 21 tables. The API server's `run-migrations.ts` adds the remaining tables on first startup:
- `couriers`, `delivery_zones`, `courier_assignments`, `courier_wallet_transactions`, `variant_images`
- `seller_verification_log` (Trust System audit table — NOT `verification_audit_log`)
- `admin_audit_log` (added by run-migrations)
- Additive columns: `users.verified_by`, `product_variants` price/barcode/weight/dimensions columns

**Verify:**
```bash
psql "$DATABASE_URL" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
# Expected: 28 tables (21 base + 7 from run-migrations) — verified June 13, 2026
```

---

## Step 3: Start API Server (Enums + Demo Data Auto-Bootstrapped)

Start the API server workflow. On startup it automatically runs **in order**:

1. `runMigrations()` — schema extensions, enum patches, delivery zones, all new tables
2. `runSearchStartup()` — search index warmup
3. `bootstrapRootAdmin()` — admin account (delewatiamer7)
4. `bootstrapTestAccounts()` — seller + courier permanent accounts (delewatiamer8/9)
5. **`bootstrapDemoMarketplaceData()`** — 4 stores, 4 customers, 42 products, 15 orders, reviews, wishlists, follows

> **No manual seed step is needed.** The demo marketplace recreates itself automatically on every fresh database.

After the API starts, verify enums are complete:

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM unnest(enum_range(NULL::notification_type));"
# Expected: 32 (verified June 13, 2026)

psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM unnest(enum_range(NULL::order_status));"
# Expected: 15
```

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

## Step 4: Build Shared Libraries

```bash
npx tsc --build lib/db lib/api-zod lib/api-client-react
```

Expected: no output (clean build).

---

## Step 5: Start Services

Use the Replit workflow panel to start:
- `artifacts/api-server: API Server`
- `artifacts/marketplace: web`
- `artifacts/mobile: expo`

Or via restart_workflow tool.

---

## Step 6: Verify API Health

```bash
curl http://localhost:8080/api/healthz
# Expected: {"status":"ok"}
```

---

## Step 7: Verify Bootstrap Accounts

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

All three are bootstrapped by `bootstrapRootAdmin()` + `bootstrapTestAccounts()` on every server start.  
Self-healing: if an account is missing or has drifted role/status, it is automatically repaired.  
Files: `artifacts/api-server/src/lib/bootstrap-admin.ts`, `bootstrap-test-accounts.ts`

---

## Step 8: Verify Demo Marketplace Data

Demo marketplace data is self-healing and auto-created by `bootstrapDemoMarketplaceData()` on every startup:

```bash
curl http://localhost:8080/api/products | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Products: {len(d[\"products\"] if isinstance(d,dict) else d)}')"
# Expected: 42+ products

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

## Verification Checklist

```
[ ] pnpm install done (1,131 packages)
[ ] DATABASE_URL and SESSION_SECRET set
[ ] 28 tables in DB (21 base + 7 from run-migrations)
[ ] notification_type enum has 32 values (auto-patched by run-migrations)
[ ] order_status enum has 15 values (auto-patched by run-migrations)
[ ] Shared libs built (tsc --build)
[ ] API server responds to /api/healthz
[ ] Root owner login works (delewatiamer7, role=admin)
[ ] Permanent seller login works (delewatiamer8, role=seller)
[ ] Permanent courier login works (delewatiamer9, role=courier)
[ ] delewatiamer8 has approved seller_application (storeSlug=syano-test-store)
[ ] delewatiamer9 has approved couriers profile (active=true)
[ ] GET /api/products returns 42+ products (demo data self-healed)
[ ] GET /api/sellers/store/ahmad-electronics returns store data
[ ] Marketplace loads
[ ] Mobile builds
[ ] GET /api/admin/recovery-check → confidenceScore >= 95
```

---

## Step 9: Run Automated Recovery Verification

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

> **Recovery Session 5 Note (June 13, 2026):** `bootstrapDemoMarketplaceData()` added to `index.ts`. Demo marketplace (42 products, 4 stores, 14 orders, 40 reviews, 12 wishlists, 8 follows) now auto-recreates on any fresh database. No manual seed step required.

> **Note:** The `heroBannerSystem` failure is a **known false negative**. Homepage V4 uses `HeroV4.tsx` which activates `BannerCarousel` when DB banners exist — `HeroBanner.tsx` is no longer directly imported in `home.tsx`. All 20 other modules pass. 95/100 is the correct expected score.

The endpoint runs 13 parallel checks covering:
- Core platform (DB tables, enums, zones, root owner)
- Bootstrap accounts (roles, seller application, courier profile)
- Security (6 routes × no-token/wrong-role/admin-token tests)
- Marketplace (categories, products, store, search, best-sellers)
- Seller system (dashboard, analytics, orders, variants, messaging)
- Courier system (profile, assignments, earnings, history)
- Order system (tables, status enum, delivery zones)
- Trust system (endpoint shape, leaderboard, verification log, columns, badge)
- Notifications (31 enum values by name, SSE route, notifications route)
- Translations (EN/AR parity — 2344 = 2344)
- Responsive audit (RTL pattern scan across admin/seller/courier pages)
- Mobile (13/13 required screens, i18n, expo config)
- Analytics (4 seller + 3 admin endpoints + stats shape)
- Recovery (bootstrap files, enum repair in migrations, self-healing)

---

## Pitfalls

| Problem | Solution |
|---|---|
| `vite: not found` in workflow | Run `pnpm install --force` — per-package node_modules need to be re-linked |
| `relation "users" does not exist` | DB is empty — run `psql "$DATABASE_URL" -f schema.sql` |
| Courier notifications crash | `notification_type` enum missing values — start API server (auto-patches) or run Step 3 legacy SQL |
| Rate limited on login (429) | Restart API server — rate limiter is in-memory and resets on restart |
| Seller dashboard shows no store after recovery | Bootstrap creates user but not seller_application — fixed: `bootstrapTestAccounts()` now also bootstraps the approved application |
| Courier dashboard shows 404 profile after recovery | Bootstrap creates user but not couriers record — fixed: `bootstrapTestAccounts()` now also bootstraps the approved courier profile |
| `drizzle-kit push` hangs | Requires TTY — use `psql -f schema.sql` instead for base schema |
| Seller apply bounces back after submit | TanStack Query `isLoading` is false during refetch — guard must also check `!isFetching`; apply page must seed cache with `setQueryData` before navigating |
| `verification_audit_log` name clash | The admin audit table is `seller_verification_log` — NOT `verification_audit_log` (that's the OTP log in base schema) |
| `wishlist.ts` TS errors on recovery | `req.user.id` does not exist — use `req.user!.userId` (all 4 occurrences); fixed in Recovery Session 3 |
| `GET /api/reviews?productId=X` returns 404 on old DB | Expected on fresh DB without demo data — `bootstrapDemoMarketplaceData()` now seeds products automatically |
| SSE endpoint path | SSE stream is `/api/notifications/stream` (not `/api/notifications/sse`) |
| Root owner login returns 401 | Use `role:"admin"` not `role:"customer"` for admin account |
| Trust score shows `isVerified: null` | Server restart needed — tsx watch sometimes doesn't hot-reload route changes |
| Seller application returns 400 "already an approved seller" | The test seller was registered with `role:"seller"` — reset to `role:"customer"` via SQL before applying: `UPDATE users SET role='customer', seller_status=null WHERE email='seller@syano.test'` |
| Unverify returns "Invalid level" | Send `{"action":"unverify"}` OR `{"level":"none"}` — both accepted after June 2026 fix |
| Demo products missing after recovery | `bootstrapDemoMarketplaceData()` now runs automatically — just restart the API server |

---

## Architecture Reference

- **API:** Express 5, JWT auth, Drizzle ORM, PostgreSQL
- **Frontend:** React + Vite + Tailwind + shadcn/ui + TanStack Query
- **Mobile:** Expo (React Native)
- **Libs:** `lib/db` (schema), `lib/api-zod` (generated), `lib/api-client-react` (generated hooks)
- **Auth:** JWT in localStorage, `bootstrapRootAdmin()` runs on startup
- **Notifications:** SSE stream + push (VAPID), `notification_type` Postgres enum
- **Courier flow:** `POST /admin/orders/:id/assign-courier` creates assignment + updates order status atomically
- **Trust System:** `lib/trustScore.ts` — 0-100 score; `seller_verification_log` audit table; admin routes in `admin.ts` (lines 1356–1530)
- **Demo Data:** `lib/bootstrap-demo-data.ts` — self-healing, idempotent, runs on every startup

## Bootstrap Startup Sequence

```
Server start
  └─ runMigrations()              ← schema extensions, enums, new tables
  └─ runSearchStartup()           ← search warmup
  └─ bootstrapRootAdmin()         ← delewatiamer7 (admin)
  └─ bootstrapTestAccounts()      ← delewatiamer8 (seller) + delewatiamer9 (courier)
  └─ bootstrapDemoMarketplaceData() ← 4 stores, 42 products, 14 orders, reviews...
  └─ app.listen()                 ← server ready
```

## Homepage V7 Architecture (June 2026 — Session 7)

**Homepage version:** V7 — Figma-approved premium dark design with 8 HomeSections components

### Critical: home.tsx Does NOT Use Layout
`home.tsx` renders `<Navbar />` directly (not inside Layout) because the page is full dark (`#080808`) and uses its own footer. All other pages still use `<Layout>`. The Navbar must be present in home.tsx explicitly.

### Navbar Architecture (Session 8 — RTL-first 3-column grid)
- File: `artifacts/marketplace/src/components/Navbar.tsx`
- **Always dark** glassmorphism — `rgba(8,8,8,0.75)` base → `rgba(8,8,8,0.88)` when scrolled > 20px
- `position: fixed` at `top-0 z-50`, height: 64px desktop / 60px mobile
- Desktop uses **CSS Grid** `gridTemplateColumns: "auto 1fr auto"` with `dir={isRtl?"rtl":"ltr"}`
  - COL 1 (renders RIGHT in RTL): Logo + divider + Nav links (الرئيسية / المنتجات / المتاجر / العروض)
  - COL 2 (CENTER): Search bar `max-w-[300px]` with live suggestions + recent searches
  - COL 3 (renders LEFT in RTL): ⚙ Settings dropdown + Login button + Sign up button (or avatar when authenticated)
- **Settings dropdown** (new, Session 8): Theme (Light/Dark/Auto) + Language (العربية/English) + Currency (SYP/USD) — fully functional, matches navbar design system
- Floating green ShoppingBag icon **removed** from HeroSection (Session 8)
- Mobile: Logo → [Search icon / Wishlist / Cart] → Menu → Sheet drawer (dark `#0d0d0d`) with preferences section

### Section Order (top to bottom)
1. `<HeroSection products={allProducts} />` — split-panel; floating cards use real DB products (first 3)
2. `<PopularCategories />` — 4×2 grid; links → `/products?category=...`
3. `<FeaturedDeals hotDeals={isBestDealProducts} />` — countdown; working add-to-cart (auth + guest)
4. `<TrustedStores />` — fetches `/api/sellers/featured`; links → `/store/:slug`
5. `<TrendingProducts products={allProducts.slice(0,6)} />` — add-to-cart + wishlist heart
6. `<NewArrivals newArrivals={allProducts.slice(0,4)} />` — bento grid; all links → `/products/:id`
7. `<JoinSection />` — seller/courier CTAs via hooks
8. `<HomeFooter />` — full dark footer

### All Components Location
`artifacts/marketplace/src/components/HomeSections/`
- `HeroSection.tsx`, `PopularCategories.tsx`, `FeaturedDeals.tsx`, `TrustedStores.tsx`
- `TrendingProducts.tsx`, `NewArrivals.tsx`, `JoinSection.tsx`, `HomeFooter.tsx`

### Homepage V6 Architecture (preserved for reference)
**Homepage version:** V6 — Amazon/Noon/Trendyol split-hero layout + real category data
- Section order: HeroV4 → Categories → Hot Deals → Verified Stores + New Arrivals → Recently Viewed → Join
- Key component: `artifacts/marketplace/src/components/HeroV4.tsx`

## Product Image Quality — Verified June 14, 2026

All 42 demo products have verified matching images. The bootstrap seed in `lib/bootstrap-demo-data.ts` uses the corrected Pexels IDs. Key verified IDs:

| Product | Pexels ID | Content |
|---------|-----------|---------|
| Sony WH-1000XM5 Headphones | 1649771 | over-ear headphones |
| Samsung Galaxy S24 | 699122 | smartphone |
| Apple MacBook Pro | 18105 | laptop |
| Samsung 65" QLED TV | 1201996 | TV in living room |
| Floral Maxi Dress | 1926769 | floral dress |
| Leather Jacket | 2529148 | leather jacket |
| Men's Chino Pants | 2220280 | casual trousers |
| Women's Stiletto Heels | 1619651 | women's shoes |
| Nida Fabric Abaya | 6149284 | dark modest fashion |
| Canvas Wall Art | 1839919 | gallery/art |
| Memory Foam Pillow | 1034584 | white bedding |
| Dior Sauvage EDP | 3059609 | perfume bottles |
| Charlotte Tilbury Lipstick | 2533266 | makeup products |
| Dyson Supersonic Hair Dryer | 3993449 | hair styling (Anna Avilova) |
| Resistance Bands | 4498480 | fitness bands (Karolina Grabowska) |
| Pearl Bracelet | 5442799 | pearl jewelry |
| Atomic Habits | 1907785 | book |
| Think & Grow Rich | 2908984 | book (Andrew Neel) |
| Syrian Olive Oil | 1029757 | olive oil bottle |
| Damascus Rose Water | 4021992 | botanical/rose (Karolina Grabowska) |

**Idempotency note:** The bootstrap guard (`COUNT(products) >= 42 → skip`) means these image fixes only apply on fresh DB restores. On an existing DB, re-run the image SQL from the audit if needed.

## Trust System API Reference

```
GET  /api/sellers/:id/trust                    — public trust breakdown
GET  /api/admin/sellers/verification           — admin: all sellers + verification status
POST /api/admin/sellers/:id/verification       — admin: set/clear verification tier
GET  /api/admin/trust/leaderboard              — admin: trust leaderboard
POST /api/admin/sellers/:id/recompute-trust    — admin: force recompute score

Seller application flow:
POST /api/seller-applications                  — submit (needs categories:[])
PATCH /api/seller-applications/:id/status      — admin approve/reject

Store pages:
GET  /api/sellers/store/:slug                  — public store by slug (has isVerified)
GET  /api/sellers/:id/store-preview            — store preview by user ID (has isVerified)
```
