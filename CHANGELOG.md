# SYANO — Changelog

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
