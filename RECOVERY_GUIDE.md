# SYANO — Recovery Guide
**Last Updated:** June 11, 2026

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

Expected: ~1,131 packages installed. `shamefully-hoist=true` in `.npmrc` puts all packages in root `node_modules`.

---

## Step 2: Push Database Schema

**If DB is empty (no tables):**
```bash
psql "$DATABASE_URL" -f schema.sql
```

This creates the base 21 tables. The API server's `run-migrations.ts` adds the remaining tables on first startup:
- `couriers`, `delivery_zones`, `courier_assignments`, `courier_wallet_transactions`, `variant_images`
- `seller_verification_log` (Trust System audit table — NOT `verification_audit_log`)
- Additive columns: `users.verified_by`, `product_variants` price/barcode/weight/dimensions columns

**Verify:**
```bash
psql "$DATABASE_URL" -c "\dt"
# Expected: 26+ tables (exact count depends on which migrations have run)
```

---

## Step 3: Fix notification_type Enum (CRITICAL — always run this)

The `schema.sql` was generated before courier/delivery/trust notification types were added. Always run this after restoring from schema.sql:

```bash
psql "$DATABASE_URL" << 'SQL'
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_confirmed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_preparing';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_ready';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_courier_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_picked_up';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_out_for_delivery';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_delivery_failed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_returned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_cancelled_by_customer';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_refunded';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_user';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'courier_applied';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'courier_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'courier_rejected';
SQL
```

**Verify:**
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM unnest(enum_range(NULL::notification_type));"
# Expected: 31
```

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

## Step 7: Verify Root Owner Account

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"delewatiamer7@gmail.com","password":"00Amer00","role":"admin"}'
# Expected: {"user":{"role":"admin",...},"token":"..."}
```

The root owner is auto-bootstrapped by `bootstrapRootAdmin()` on every server start.
Note: use `role":"admin"` for the root owner (not "customer").

---

## Verification Checklist

```
[ ] pnpm install done
[ ] DATABASE_URL and SESSION_SECRET set
[ ] 26+ tables in DB
[ ] notification_type enum has 31 values
[ ] Shared libs built (tsc --build)
[ ] API server responds to /api/healthz
[ ] Root owner login works (role=admin)
[ ] Marketplace loads
[ ] Mobile builds
```

---

## Pitfalls

| Problem | Solution |
|---|---|
| `vite: not found` in workflow | Run `pnpm install --force` — per-package node_modules need to be re-linked |
| `relation "users" does not exist` | DB is empty — run `psql "$DATABASE_URL" -f schema.sql` |
| Courier notifications crash | `notification_type` enum missing values — run Step 3 SQL block |
| Rate limited on login (429) | Restart API server — rate limiter is in-memory and resets on restart |
| `drizzle-kit push` hangs | Requires TTY — use `psql -f schema.sql` instead for base schema |
| Seller apply bounces back after submit | TanStack Query `isLoading` is false during refetch — guard must also check `!isFetching`; apply page must seed cache with `setQueryData` before navigating |
| `verification_audit_log` name clash | The admin audit table is `seller_verification_log` — NOT `verification_audit_log` (that's the OTP log in base schema) |
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
