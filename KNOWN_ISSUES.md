# SYANO — Known Issues
**Last Updated:** June 11, 2026

---

## Active Issues (Non-Critical)

### KNOWN-1 — notification_type enum mismatch in schema.sql
**Severity:** Low (auto-patched on startup)  
**Status:** Self-healing — `run-migrations.ts` adds all 14 missing values every startup via `ADD VALUE IF NOT EXISTS`  
**Description:** `schema.sql` only contains the original 17 enum values. The 14 newer delivery/courier notification types are missing from the base schema file. However, `run-migrations.ts` auto-patches all 14 values on every API startup — no manual intervention needed.  
**Verified by:** `GET /api/admin/recovery-check` → `notifications.notificationTypeEnumCount: 31` ✅

### KNOWN-2 — Rate limiter is in-memory (resets on restart)
**Severity:** Low  
**Status:** By design  
**Description:** Login rate limiting uses in-memory state. Restarting the API server resets all rate limit counters. In production this should use Redis or a DB-backed store. When running many test logins, restart API server if 429 errors appear.

### KNOWN-3 — OTP delivery disabled
**Severity:** Low (dev environment only)  
**Status:** By design for dev  
**Description:** `VERIFICATION_ENABLED=false` in auth.ts. Registration returns token directly; login skips 403 gate. OTPs are logged to console only (no RESEND/Twilio keys).

### KNOWN-4 — schema.sql out of date
**Severity:** Medium  
**Status:** Known, tracked  
**Description:** `schema.sql` was generated before several schema additions (delivery tables, enum values). It serves as a base schema only. `run-migrations.ts` applies additive columns on startup. Enum values must be applied manually (see RECOVERY_GUIDE.md Step 3).

### KNOWN-5 — `GET /categories` returns 404
**Severity:** None (not a bug)  
**Status:** By design  
**Description:** The frontend uses `/api/products/categories` (correct path). No `/api/categories` shorthand route exists.

### KNOWN-6 — `POST /admin/orders/:id/assign-courier` returns empty body
**Severity:** Low  
**Status:** Known  
**Description:** Returns `204 No Content` on success (empty body). The order IS updated in the DB. Could be improved to return `{status:"courier_assigned"}` for consistency.

### KNOWN-7 — Mobile has no analytics screen
**Severity:** Low  
**Status:** Feature gap  
**Description:** The Expo mobile app has no seller analytics screen. Sellers must use the web marketplace to view analytics. Mobile analytics is planned for a future session.

### KNOWN-8 — Delivery analytics shows 0 when couriers haven't been assigned
**Severity:** None (data state)  
**Status:** By design  
**Description:** `totalDelivered` and `totalFailed` come from `courier_assignments` table, not order status. If orders were marked "delivered" without going through courier workflow, delivery analytics shows 0. The empty state in the UI handles this gracefully.

### KNOWN-9 — Seller application requires role:"customer" to apply
**Severity:** Low  
**Status:** By design  
**Description:** `POST /seller-applications` route rejects users already in role="seller". For testing, ensure the test seller account has role="customer" before submitting an application. After approval, role is promoted to "seller" automatically.

---

## Resolved Issues

| Issue | Resolution Date | Fix |
|---|---|---|
| Unverify via `{"level":"none"}` returned 400 | 2026-06-11 | Added `level === "none"` branch to verification route |
| Mobile `store/[id].tsx` TS: wrong i18n path | 2026-06-11 | Fixed `../../../src/i18n` → `../../src/i18n` |
| Mobile `store/[slug].tsx` TS: API_BASE_URL not exported | 2026-06-11 | Added `getBaseUrl()` export to api-client-react lib |
| Mobile `t()` signature: string fallback not accepted | 2026-06-11 | Updated t() to accept `string \| Record` as second arg |
| `GET /dashboard/seller/metrics` crash (is not iterable) | 2026-06-11 | Fixed QueryResult destructuring |
| notification_type enum crash during courier workflow | 2026-06-11 | ALTER TYPE ADD VALUE for 14 missing values |
| Courier profile missing successRate/activeAssignments/walletBalance | 2026-06-11 | Extended /couriers/profile handler |
| Courier history missing orderStatus field | 2026-06-11 | Added ordersTable.status to history SELECT |
| Seller apply → status page bounce loop | 2026-06-11 | setQueryData before invalidateQueries + !isFetching guard |
| Messaging GET /conversations crash | 2026-06-02 | inArray() instead of ANY() |
| Seller analytics crash (.rows property) | 2026-06-02 | .rows unwrap on db.execute() |
| Stored XSS in product name/description | 2026-06-02 | stripHtml() on all free-text inputs |

---

## Feature Gaps (Not Bugs)

| Gap | Priority | Notes |
|---|---|---|
| Mobile seller analytics screen | Medium | Web-only for now; planned future session |
| Wishlist feature | High | No table or routes — frontend calls 404 |
| Admin message moderation | Medium | `flagged` column exists, no admin routes |
| Customer confirm-delivery | Low | Required to unlock product reviews |
| Real OTP delivery | Low | Needs RESEND or Twilio keys |
| In-memory rate limiter | Low | Should be Redis-backed for production |

### KNOWN-8 — Mobile forgot-password screen not translated
**Severity:** Low  
**Status:** Known (mobile-only)  
**Description:** `app/forgot-password.tsx` uses keys like `auth.back_to_login`, `auth.check_email`, etc. The mobile i18n `index.ts` stores keys as object properties, so scanning is done differently than JSON. Manual inspection confirms auth section has `forgot_password_title`, `forgot_password_subtitle`, `send_reset_code` etc. — keys follow the correct dot notation pattern. No raw keys confirmed visible in production (all have string fallbacks).  
**Status:** Monitor — no user-visible raw keys confirmed.
