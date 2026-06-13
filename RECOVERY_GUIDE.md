# SYANO — Recovery Guide
**Last Updated:** June 13, 2026 (Recovery Session 3 — full environment restore + wishlist TS fix)

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

## Step 3: Start API Server (Enums Auto-Patched on Startup)

Start the API server workflow. `run-migrations.ts` runs automatically on startup and handles ALL enum extensions:
- `role` enum: adds `courier`
- `order_status` enum: adds 9 delivery workflow statuses
- `notification_type` enum: adds 14 courier/delivery/trust notification types (was previously manual Step 3)

After the API starts, verify enums are complete:

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM unnest(enum_range(NULL::notification_type));"
# Expected: 32 (verified June 13, 2026 — was 31 in prior docs)

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
[ ] Marketplace loads
[ ] Mobile builds
[ ] GET /api/admin/recovery-check → confidenceScore >= 97
```

---

## Step 8: Run Automated Recovery Verification

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

> **Recovery Session 3 Note (June 13, 2026):** `wishlist.ts` had 4 TypeScript errors (`user.id` → `user.userId`) introduced when the wishlist system was built. Fixed during recovery session 3. All 6 artifacts now compile at 0 errors.

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
| `GET /api/reviews?productId=X` returns 404 | Expected on fresh DB — no products seeded; reviews endpoint works once products exist |
| SSE endpoint path | SSE stream is `/api/notifications/stream` (not `/api/notifications/sse`) |
| Root owner login returns 401 | Use `role:"admin"` not `role:"customer"` for admin account |
| Trust score shows `isVerified: null` | Server restart needed — tsx watch sometimes doesn't hot-reload route changes |
| Seller application returns 400 "already an approved seller" | The test seller was registered with `role:"seller"` — reset to `role:"customer"` via SQL before applying: `UPDATE users SET role='customer', seller_status=null WHERE email='seller@syano.test'` |
| Unverify returns "Invalid level" | Send `{"action":"unverify"}` OR `{"level":"none"}` — both accepted after June 2026 fix |

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

## Homepage V6 Architecture (June 2026)

**Homepage version:** V6 — Amazon/Noon/Trendyol split-hero layout + real category data

### Section Order (top to bottom)
1. `<HeroV4 />` — split-panel hero (text LEFT + rotating image RIGHT) + TrustStrip
2. Popular Categories — real product images + real counts from DB, RTL-aware grid
3. Hot Deals countdown — dark card-style boxes (conditional: hidden when 0 `isBestDeal` products)
4. Combined section — Verified Stores (53%) + New Arrivals (47%), vertical divider
5. Recently Viewed Products — horizontal scroll, conditional (hidden when empty)
6. Join Syano — delivery van + two CTAs (Open Store / Become Courier)

> **Note (section order change):** Recently Viewed now appears **before** Join Syano. Previously it was after.

### Hero Split-Panel Layout (V6)

The hero uses a **fixed split** — no full-width image. This is the Amazon/Noon/Trendyol pattern.

**LEFT panel (48% width in LTR — text is always fixed, never rotates):**
- Brand badge: "Syria's Premier Marketplace ✦"
- Headline: title white + green line 2 (locale-aware: AR/EN)
- Subtitle paragraph
- Two CTA buttons: "Browse Stores" (outline) + "→ Shop Now" (green solid)
- Stats bar: 500+ Active Stores | 25,000+ Active Products | 12,000+ Happy Customers

**RIGHT panel (56% width in LTR — rotating banners):**
- Full-height banner image (objectFit:cover), Ken Burns scale animation
- Ken Burns CSS keyframe (`@keyframes heroKenBurns`) on each image
- **Floating product cards** (3 cards, absolutely positioned on the image panel):
  - Top-right: product card 1 (عطر ديور سوفاج, 75,000 ل.س, 5-star rating)
  - Middle-left: product card 2 (جاكيت جلد فاخر, 175,000 ل.س)
  - Bottom-left: product card 3 (رولكس سابمارينر, 142,000 ل.س, ● متوفر الآن)
  - Float animations: `heroFloatA/B/C` keyframes, staggered timing
- Discount badge: `خصم ٨٠٪` (green pill, top-left of image panel)
- Dot progress indicators (bottom of image panel)
- Prev arrow: `left: calc(44% + 10px)` (junction of text/image panels in LTR)
- Next arrow: `right: 12px` (far edge of image panel in LTR)
- All positions RTL-aware (flipped when `i18n.language === "ar"`)

**RTL flip:** `isRTL = i18n.language === "ar"`. Text panel: `[isRTL?"right":"left"]:0`. Image panel: `[isRTL?"left":"right"]:0`.

**TrustStrip** (always rendered, below hero content):
- 4 items: Fast Support / Trusted Sellers / Secure Payment / Fast Delivery
- `grid-cols-2 sm:grid-cols-4`, emerald icon squares
- NOT duplicated anywhere else on the homepage

**BannerCarousel data source:** `GET /api/banners` → array of banners used as image slides.  
Falls back to 3 hardcoded static banner objects (tech workspace, fashion, luxury) when DB returns 0.

### Categories — Real Data (V6)

`CategoriesSection` now accepts `products` prop from `home.tsx` (all products from `/api/products`).  
It derives real images and counts from DB data, not hardcoded values.

```ts
// home.tsx passes: <CategoriesSection products={products} />
// CategoriesSection groups by product.category, picks first imageUrl, counts per category
```

### Key Component
- `artifacts/marketplace/src/components/HeroV4.tsx`
  - Split-panel layout (text panel + image panel)
  - Floating product cards with float animations
  - Dot indicators, prev/next arrows (RTL-aware)
  - `TrustStrip` — 4-item row at hero bottom
  - `// @refresh reset` at top (required for HMR stability)

### API Endpoints (homepage)
| Endpoint | Consumer | Notes |
|---|---|---|
| `GET /api/banners` | `HeroV4.tsx` | Banner images for rotating right panel; fallback to static if 0 |
| `POST /api/banners/:id/impression` | `HeroV4.tsx` | Fire-and-forget; always 200 |
| `POST /api/banners/:id/click` | `HeroV4.tsx` | Fire-and-forget; always 200 |
| `GET /api/products` | `home.tsx` | Passed to CategoriesSection + Deals + Trending + New Arrivals |
| `GET /api/sellers/featured` | `home.tsx` | Verified Stores carousel |

### Zero-Data Resilience
- 0 banners → 3 hardcoded static slides (always beautiful, no external image dependency)
- 0 `isBestDeal` products → Hot Deals section hidden
- 0 products → New Arrivals column hidden; Categories shows empty state
- 0 featured sellers → Verified Stores section hidden

### Currency System Audit (V6)
| Component | Uses useCurrency | Notes |
|---|---|---|
| ProductCard | ✅ `format(product.price)` | All price displays |
| Cart | ✅ `format(price)` | Item prices + subtotal + total |
| Checkout | ✅ `format(price)` | Order totals + delivery fee |
| ProductDetail | ✅ `format(price)` | Final + compare-at prices |
| Home custom sections (Deals/Trending) | ⚠️ Hardcoded `ل.س` | Inline style sections don't use context — known limitation |

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
