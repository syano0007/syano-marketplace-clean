# SYANO — Changelog

---

## [2026-06-11] Seller Analytics Dashboard V2 — Production Finalization

### Summary
Full production-quality finalization of the Seller Analytics Dashboard V2. Environment recovered, test data seeded, analytics page improved with Shopify-grade visuals, Layout.tsx TypeScript fixed, and all documentation updated.

### Environment Recovery
- Full pnpm install (1,131 packages), schema.sql restore, notification_type enum fixed to 31 values
- Seller application seeded (approved, store_slug: ahmads-electronics)
- 18 orders across 6 statuses, 21 order_items, 10 products, 2 store follows, 1 seller review

### analytics.tsx — Visual & UX Improvements
- **KPI Cards**: Color-coded icon backgrounds (emerald/blue/violet/pink/cyan/amber) with trend badge at top-right
- **Chart legend**: Explicit revenue + orders legend bar below area chart
- **Empty states**: `EmptyState` component with icon + title for each section (empty period, no products, no deliveries, etc.)
- **No-data banner**: Period-level banner when `totalOrders === 0`
- **Delivery analytics**: Stacked bar visualization showing success/fail ratio
- **Store growth**: Color-coded mini tiles for new followers + new reviews with trend badges
- **Financial summary**: 5 colored tiles in a responsive grid
- **Customer analytics**: New vs Returning colored tiles at the bottom of the section
- **StatRow**: Added optional progress bar per row (colored by data type)
- **Top products**: Rank 1-5 as gradient progress bars; ranks 6-10 as horizontal bar chart
- **Date picker**: Chevron rotation animation on open/close
- **SectionCard**: Border separator between header and content

### Layout.tsx — TypeScript Fix
- Added `hideFooter?: boolean` prop (default `false`)
- Analytics page now uses `<Layout hideFooter>` — footer hidden to maximize chart space

### API Validation
- `GET /dashboard/seller/analytics/summary`: grossRevenue $1,819.88 (+188.9%), 15 orders (+400%)
- `GET /dashboard/seller/analytics/revenue-chart`: 12 active data points over 30-day period
- TypeScript: 0 errors across marketplace artifact

---

## [2026-06-11] Seller Orders V2 — Audit + Metrics Bug Fix

### Critical Bug Fix: `GET /dashboard/seller/metrics` Crash

**File:** `artifacts/api-server/src/routes/dashboard.ts`  
**Root cause:** `const [row] = await db.execute(rawSql)` used array destructuring on a `QueryResult` object (not an array). This crashed with "is not iterable" on every call.  
**Fix:** `const rawResult = await db.execute(rawSql); const r = rawResult.rows?.[0] ?? rawResult[0] ?? {}` — safely unwraps whether the driver returns `{rows:[...]}` or a bare array.  
**Impact:** The Operational Metrics panel on the Seller Orders V2 page now loads correctly.

### Seller Orders V2 — Full Code + API Audit

**Page:** `artifacts/marketplace/src/pages/seller/orders.tsx` (790 lines)  
**Detail:** `artifacts/marketplace/src/pages/seller/orders/[id].tsx` (478 lines)

All features verified:
- 6 stat cards, 8 KPI metrics, 9 filter groups, search, bulk actions
- Desktop table + mobile card views, all with correct API field bindings
- Order detail: customer, products (with images), financials, timeline, courier, action center
- i18n: **122 translation keys** all present in `en.json` and `ar.json`
- API response shapes: all fields present (`customerName`, `zoneNameEn`, `zoneNameAr`, `courierName`, `courierPhone`, `courierStatus`, `deliveryFee`, `items[].imageUrl`)

### E2E Flow Validated

```
Order 9: pending → confirmed → preparing → ready_for_pickup → courier_assigned
- All seller PATCH transitions succeeded
- 5 notifications fired with correct types (no enum errors)
- Courier assignment record created in courier_assignments
```

### Architecture Notes (Courier Status Updates)

Couriers do NOT use `PATCH /orders/:id/status`. They use dedicated endpoints in `couriers.ts`:
- `PATCH /couriers/assignments/:id/pickup` → `courier_assigned → picked_up`
- `PATCH /couriers/assignments/:id/start-delivery` → `picked_up → out_for_delivery`
- `PATCH /couriers/assignments/:id/deliver` → `out_for_delivery → delivered`
- `PATCH /couriers/assignments/:id/fail-delivery` → `out_for_delivery → delivery_failed`

The `PATCH /orders/:id/status` handler correctly excludes courier role (line 605) because couriers have their own routes. This is intentional, not a bug.

---

## [2026-06-11] Seller Application Redirect Fix

### Bug Fix: Seller Apply → Status Page Redirect Race Condition

**Root cause (two interlocking bugs):**

1. **`application-status.tsx` redirect guard fired on stale cache.**  
   The guard `if (!isLoading && application === null) navigate("/seller/apply")` ran while a refetch was in flight (`isFetching=true`). React Query's `isLoading` is only true on the very first load — during a background refetch the cache still holds the old `null` value but `isLoading=false`, causing an immediate bounce back to the apply form.

2. **`apply.tsx` did not seed the cache before navigating.**  
   `onSuccess` called `invalidateQueries` (marks the cache stale, keeping `null`) then `navigate(...)`. The status page always arrived with a null cache entry, triggering the bounce.

**Fixes applied:**

- `apply.tsx` — `onSuccess` now calls `queryClient.setQueryData(["seller-application","my"], newApp)` **before** `invalidateQueries`, seeding the cache with the real `{status:"pending"}` data so the status page never sees null.
- `apply.tsx` — Added `submitMutation.isSuccess` early-return to prevent the form from re-rendering after a successful submit (guards against any post-navigate re-render flashing the form).
- `apply.tsx` — Submit button now also disabled on `submitMutation.isSuccess` to block duplicate submissions.
- `application-status.tsx` — Redirect guard updated to `if (!isLoading && !isFetching && application === null)` — only redirects after the query has fully settled.
- `application-status.tsx` — Skeleton loader now shown when `isFetching && application === null` to cover the brief refetch window on arrival.

**Validated states:** guest (redirected to login), customer (form shows), pending (redirected to status), under_review (status), approved (status), rejected (form to reapply), suspended (status).

---

## [2026-06-11] Recovery + Full E2E Validation + Bug Fixes

### Environment Recovery
- Restored from empty DB using `schema.sql` (psql push)
- `pnpm install --force` (1,131 packages, shamefully-hoisted)
- `npx tsc --build lib/db lib/api-zod lib/api-client-react` — clean
- All 3 services restarted and verified

### Critical Fix: notification_type Enum
- **Problem:** DB enum had 17 values, schema/code expected 31
- **Fix:** Added 14 missing values via `ALTER TYPE notification_type ADD VALUE IF NOT EXISTS`
- **Missing values added:** `order_confirmed`, `order_preparing`, `order_ready`, `order_courier_assigned`, `order_picked_up`, `order_out_for_delivery`, `order_delivery_failed`, `order_returned`, `order_cancelled_by_customer`, `order_refunded`, `new_user`, `courier_applied`, `courier_approved`, `courier_rejected`
- **Impact:** Without this fix, every courier/order workflow notification insert would crash the DB transaction

### Bug Fix: Courier Profile Missing Fields
- **File:** `artifacts/api-server/src/routes/couriers.ts`
- **Problem:** `GET /couriers/profile` returned only 7 fields; frontend courier dashboard expects `successRate`, `activeAssignments`, `walletBalance`
- **Fix:** Extended profile handler to compute and return all 3 missing fields:
  - `successRate` = completed / (completed + failed) × 100
  - `activeAssignments` = count of assigned/picked_up/out_for_delivery assignments
  - `walletBalance` = sum of all wallet transactions

### Bug Fix: Courier History Missing orderStatus
- **File:** `artifacts/api-server/src/routes/couriers.ts`
- **Problem:** `GET /couriers/history` SELECT did not include `ordersTable.status`; frontend courier dashboard uses `orderStatus` to render action buttons
- **Fix:** Added `orderStatus: ordersTable.status` to the SELECT and returned it in the response map

### E2E Validation Results
- Full order fulfillment chain validated: pending → confirmed → preparing → ready_for_pickup → courier_assigned → picked_up → out_for_delivery → delivered
- Failure flow validated: out_for_delivery → delivery_failed with reason stored
- Earnings validated: $0.80 wallet transaction for $1.00 delivery fee (80% cut) ✅
- All 15 notification types fired with no enum errors ✅
- Security: 7/7 RBAC checks passed ✅
- TypeScript: 0 errors ✅

---

## [2026-06-02] Comprehensive Production Audit

### Bugs Fixed
- FIX-1: Messaging GET /conversations crash (Drizzle ANY() serialization)
- FIX-2: Messaging GET /conversations/:id/messages crash (snake_case column ref)
- FIX-3: Seller analytics crash (.rows property bug)
- FIX-4: Store branding PATCH silently ignored all fields except logo/banner
- FIX-5 (Security): Stored XSS in product create/update and user registration

### Features Added
- ADD-1: PATCH /auth/me profile update endpoint
- Admin user suspension (PATCH /admin/users/:id/suspend, /reactivate)

---

## [Earlier] Features Implemented

- Core marketplace (auth, products, cart, checkout, orders)
- Seller ecosystem (store pages, follow system, reviews, messaging, analytics)
- Admin panel (stats, moderation, logs, settings, courier management)
- Product variant system (5-step wizard, VariantBuilder, combo cards, bulk actions, variant images)
- Delivery system (40 Aleppo zones, courier flow, wallet, earnings)
- Order Fulfillment Workflow V1 (13 statuses + full history)
- Courier Operations Dashboard V2 (admin delivery center, courier dashboard tabs)
- Mobile order tracking (courier info card, delivery fee, timeline, 30s polling)
- Recently viewed products (localStorage, homepage section)
- Guest cart (all entry points wired)
- i18n (Arabic/English, RTL, paginated components)
- SSE real-time notifications + push subscriptions
