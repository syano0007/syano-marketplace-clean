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

This creates the base 21 tables. The API server's `run-migrations.ts` adds the remaining 5 tables (couriers, delivery_zones, courier_assignments, courier_wallet_transactions, variant_images) on first startup.

**Verify:**
```bash
psql "$DATABASE_URL" -c "\dt"
# Expected: 26 tables
```

---

## Step 3: Fix notification_type Enum (CRITICAL — always run this)

The `schema.sql` was generated before courier/delivery notification types were added. Always run this after restoring from schema.sql:

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
  -d '{"email":"delewatiamer7@gmail.com","password":"00Amer00","role":"customer"}'
# Expected: {"user":{"role":"admin",...},"token":"..."}
```

The root owner is auto-bootstrapped by `bootstrapRootAdmin()` on every server start.

---

## Verification Checklist

```
[ ] pnpm install done
[ ] DATABASE_URL and SESSION_SECRET set
[ ] 26 tables in DB
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

---

## Architecture Reference

- **API:** Express 5, JWT auth, Drizzle ORM, PostgreSQL
- **Frontend:** React + Vite + Tailwind + shadcn/ui + TanStack Query
- **Mobile:** Expo (React Native)
- **Libs:** `lib/db` (schema), `lib/api-zod` (generated), `lib/api-client-react` (generated hooks)
- **Auth:** JWT in localStorage, `bootstrapRootAdmin()` runs on startup
- **Notifications:** SSE stream + push (VAPID), `notification_type` Postgres enum
- **Courier flow:** `POST /admin/orders/:id/assign-courier` creates assignment + updates order status atomically
