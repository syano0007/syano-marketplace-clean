# CHANGELOG.md — SYANO (سوق سوريا)

Chronological log of all verified modifications. Never delete previous entries.

---

## 2026-06-11 — Recently Viewed Products + Product Wizard Inventory UX

### Task 1: Recently Viewed Products

**Architecture:**
- Persistence: `localStorage` key `syano_recently_viewed` — works for guests AND authenticated users, survives refresh
- Storage: lightweight product snapshot (id, name, price, discountPercent, imageUrls, category, storeName, stock, isBestDeal, hasVariants)
- Max 10 items, most-recent-first ordering
- Duplicate prevention: re-viewing a product moves it to position 0, removes old entry
- Cross-tab sync: `window.storage` event listener keeps all open tabs in sync

**New file:**
- `artifacts/marketplace/src/hooks/useRecentlyViewed.ts` — `useRecentlyViewed()` hook exports `{ recentlyViewed, trackView, clearHistory }`

**Modified files:**
- `artifacts/marketplace/src/pages/products/[id].tsx`
  - Added `import { useRecentlyViewed }` 
  - Added `const { trackView } = useRecentlyViewed()`
  - Added `useEffect(() => { if (product) trackView(product); }, [product?.id])` — fires once per unique product ID
- `artifacts/marketplace/src/pages/home.tsx`
  - Added `import { useRecentlyViewed }`
  - Added `import { Clock }` from lucide-react
  - Added `const { recentlyViewed, clearHistory } = useRecentlyViewed()`
  - Added "Recently Viewed" section between Best Sellers and Categories — conditionally rendered when `recentlyViewed.length > 0`; uses existing `ProductCard`; has "Clear" button
- `artifacts/marketplace/src/i18n/en.json` — added `home.recently_viewed_title`, `home.recently_viewed_clear`
- `artifacts/marketplace/src/i18n/ar.json` — added Arabic translations for both keys

**Behavior:**
- Guest: view product → refresh homepage → section appears with viewed products ✅
- Auth: same behavior ✅
- View same product again → moves to front, no duplicate ✅
- Clear button → removes section ✅
- Section only appears after at least one product has been viewed ✅

---

### Task 2: Product Wizard Inventory UX Improvement

**Root cause:** In `mode="new"`, Step 2 showed the stock input field unconditionally. If a seller enabled variants in Step 3 then navigated back to Step 2, the stock field was confusing because variant products use per-variant stock, not the product-level stock field.

**Architecture analysis:**
- `products.stock` is authoritative for simple (no-variant) products
- `product_variants.stock` is authoritative when variants exist; order system auto-syncs `products.stock = SUM(variant stocks)` on each order
- The `variantsEnabled` state lives at the wizard scope and is accessible in `renderStep2()`

**Change (additive UI only, zero logic/API/schema changes):**
- `artifacts/marketplace/src/components/ProductWizard.tsx` → `renderStep2()` stock section:
  - When `mode === "new"` AND `variantsEnabled === true`: show amber informational notice with Package icon: _"Stock is managed per variant — set quantities in the next step."_
  - When `mode === "new"` AND `variantsEnabled === false`: show stock input as before (no change)
  - When `mode === "edit"`: unchanged (read-only stock display with "(Manage in Inventory)")
- `artifacts/marketplace/src/i18n/en.json` — added `seller_products.stock_variant_managed`
- `artifacts/marketplace/src/i18n/ar.json` — added Arabic translation

**Backward compatibility:**
- Existing products: unaffected (edit mode is unchanged)
- Existing orders: unaffected (no logic changes)
- Existing variants: unaffected (VariantBuilder unchanged)
- No migration required ✅

---

## 2026-06-09 — new.tsx Main Toggle RTL Fix + Real Page Verification (Session 2b)

**Root cause identified on real page `/seller/products/new`:**

`new.tsx` lines 515-518 had a SEPARATE toggle from VariantBuilder.tsx that was NOT fixed in Session 2.
It used `inline-flex items-center + inline-block translate-x-6/translate-x-1`:
- `inline-flex + direction:rtl` repositions the inline-block child to the RIGHT edge of the container.
- `translateX(24px)` then pushes it further right, escaping the 44px track.

**Changed:**
- `artifacts/marketplace/src/pages/seller/products/new.tsx` (lines ~517-518)
  - Toggle button: removed `inline-flex items-center`, changed thumb to `position:absolute top-1`
  - `style={{ left: variantsEnabled ? 26 : 2 }}` — same bulletproof fix as VariantBuilder.tsx Toggle

**Verified on REAL page:**
- Seller: `delewatiamer8@gmail.com` (role=seller, active)
- URL: `/seller/products/new`
- Arabic RTL: ✅ ON=right, OFF=left, no escape
- Desktop 1280px: ✅ thumb inside track
- Mobile 390px: ✅ thumb inside track
- Both screenshots: green track, white thumb, label "مفعّل" correct RTL placement

**Zero debug artifacts remain:**
- `artifacts/marketplace/src/pages/login.tsx` — auto-login `useEffect` fully removed
- `artifacts/marketplace/src/pages/seller/products/new.tsx` — temp groups/variantsEnabled reverted to defaults
- `vb-verify.tsx` — deleted (not re-created)
- `App.tsx` — no debug routes

---

## 2026-06-09 — VariantBuilder Toggle Bulletproof RTL Fix (Session 2)

**Changed:**
- `artifacts/marketplace/src/components/VariantBuilder.tsx`
  - **Toggle impl replaced (again):** Previous session used `flex + margin-inline-start` (ms-[26px]/ms-[2px]).
    Under Arabic `direction:rtl` the flex main-axis reverses, so the margin-inline-start math
    caused the thumb to escape the 44px track on RTL ON state.
    New implementation: `position:relative` track + `position:absolute` thumb with
    `style={{ left: on ? 26 : 2 }}` — explicit physical-left pixel values, completely
    direction-agnostic. Track=44px, thumb=16px → max position 26+16=42 < 44px, escape
    is mathematically impossible. Toggle visual intentionally NOT direction-mirrored
    (matches iOS/WhatsApp convention: green=right=ON regardless of writing mode).

**Verified at viewports:** 320px, 360px, 390px, 768px, 1280px — Arabic RTL + English LTR

**Verification status:**
- ✅ Toggle thumb: inside track, correct ON=right / OFF=left in ALL viewports + both languages
- ✅ Group toggles: same — no escape in RTL
- ✅ Variant card toggles: same — no escape at 360px/390px mobile
- ✅ Step 4 header: Generate button full-width on own row at mobile, same-line at sm+
- ✅ Bulk toolbar: 2-col stacks to 4-col at sm breakpoint
- ✅ RTL direction: text right-aligned, UI elements mirrored, group order correct
- ✅ No horizontal overflow at any viewport
- ✅ Temp `/vb-verify` route + page removed from App.tsx + filesystem

---

## 2026-06-08 12:05 UTC — Root Owner Canonicalized & Hardened

**Changed:**
- `artifacts/api-server/src/lib/bootstrap-admin.ts` — fixed email from typo `delewaitamer7` → correct `delewatiamer7`; added cleanup of legacy typo account; renamed to "Root Owner"; exported `ROOT_OWNER_EMAIL` constant
- `artifacts/api-server/src/routes/admin.ts` — added 403 guard to DELETE /admin/users/:id to prevent Root Owner deletion

**Root Owner is now:**
- Email: `delewatiamer7@gmail.com`
- Password: `00Amer00` (env: `ROOT_ADMIN_PASSWORD`)
- Self-healing, protected from deletion, single canonical identity

**Database impact:**
- Legacy typo account `delewaitamer7@gmail.com` deleted
- Correct Root Owner `delewatiamer7@gmail.com` created (id=2, admin, active, verified)

**Verification status:**
- ✅ Bootstrap logs: "Legacy typo bootstrap admin found → Root Owner bootstrapped (created) → Legacy typo bootstrap admin removed"
- ✅ DB: id=2, email=delewatiamer7@gmail.com, role=admin, account_status=active, is_verified=true
- ✅ Login: POST /api/auth/login → JWT 232 chars, role=admin
- ✅ Admin delete protection: 403 returned if target is Root Owner
- ✅ All project-memory files updated with correct email + password
- ✅ TypeScript: 0 structural errors

---

## 2026-06-08 02:55 UTC — Permanent Root Admin Bootstrap

**Added:**
- `artifacts/api-server/src/lib/bootstrap-admin.ts` — self-healing root admin function
- `bootstrapRootAdmin()` called in `artifacts/api-server/src/index.ts` after migrations, before listen

**Fixed:**
- Root admin account now recreates and self-repairs on every server startup

**Changed:**
- `project-memory/AUTH_STATE.md` — permanent root admin rules documented
- `project-memory/RECOVERY_GUIDE.md` — Step 4 now describes automatic self-healing (no manual SQL)

**Database impact:**
- Root admin account (delewaitamer7@gmail.com) created automatically if missing

**API impact:**
- None — bootstrap runs before HTTP server starts, adds no routes

**Frontend impact:**
- None

**Mobile impact:**
- None

**Performance impact:**
- One bcrypt.compare (+ optional hash) at startup — negligible

**Breaking changes:**
- None

**Verification status:**
- ✅ Bootstrap log: `Root admin bootstrapped (created)` on first run
- ✅ DB: id=3, role=admin, account_status=active, is_verified=true, hash_length=60
- ✅ Login: `POST /api/auth/login` with root credentials → JWT 232 chars
- ✅ Wrong password: returns `INVALID_PASSWORD` (correct)
- ✅ Idempotent: safe to re-run on every startup

---

## 2026-06-08 02:30 UTC — Workspace Migration Recovery

**Added:**
- `project-memory/` directory with full project state layer (10 files)

**Fixed:**
- `AdminListUsersParams` missing `q?: string` field in `lib/api-client-react/src/generated/api.schemas.ts`
- Empty database after Replit account migration — schema pushed via `drizzle-kit push`
- Missing admin account (delewatiamer7@gmail.com) — recreated with role=admin, is_verified=true, account_status=active
- Missing `node_modules` after migration — restored via `pnpm install`
- Missing lib declarations (`lib/db/dist`, `lib/api-zod/dist`, `lib/api-client-react/dist`) — rebuilt via `npx tsc --build`

**Changed:**
- Nothing functional changed — recovery only

**Database impact:**
- All 22 tables created from scratch (DB was empty)
- Additive migrations applied: order shipping fields, order_status_history, variant columns, sales_count, account_status

**API impact:**
- `AdminListUsersParams.q` now typed correctly — admin user search works

**Frontend impact:**
- None

**Mobile impact:**
- None

**Performance impact:**
- All previously completed optimizations verified intact

**Breaking changes:**
- None

**Verification status:**
- ✅ pnpm install: OK
- ✅ Environment: all 10 vars present
- ✅ Database: all 22 tables present
- ✅ Admin account: active
- ✅ Login: JWT issued
- ✅ Register: working
- ✅ Forgot password: working
- ✅ Verify OTP: endpoint present
- ✅ Reset password: endpoint present
- ✅ API Server: running
- ✅ Marketplace: running
- ✅ Mobile: running
- ✅ TypeScript api-server: 0 structural errors
- ✅ TypeScript marketplace: 0 structural errors
- ✅ TypeScript mobile: 0 structural errors
- ✅ All performance optimizations: intact

---

## 2026-06-08 — Pre-migration State (carried over from previous workspace)

The following was already complete and working before migration:

**Authentication:**
- Login (JWT, bcrypt, account status check)
- Register (duplicate email/phone detection)
- Forgot password (OTP via email)
- OTP verification (disabled via VERIFICATION_ENABLED flag)
- Password reset (token-based)
- Guest cart (full flow)
- Account suspension system

**Dashboards:**
- Admin dashboard (users, products, orders, logs, stats, suspension/reactivation)
- Seller dashboard (orders, products, inventory, analytics, store settings, messaging)
- Customer dashboard (orders, profile)

**Platform features:**
- Messaging system (SSE real-time + 3s/5s polling fallback)
- Notifications (SSE + polling)
- Push notifications (VAPID)
- Product reviews
- Seller reviews
- Store follow system
- Seller applications (draft, submit, admin approval)
- Product variants (groups, options, values, images)
- Flash sale support
- Search (pg_trgm)
- Sitemap
- CSV export
- Arabic RTL + i18n (en + ar)
- Google Translate protection
- Localization (USD/SYP currency)

**Performance optimizations:**
- React.memo (Navbar, NotificationCenter, ProductCard, cart, home)
- Stable callbacks (useCallback in 13+ files)
- Bundle splitting (manualChunks: vendor-react, vendor-radix, framer-motion deferred, recharts deferred)
- Lazy loading (54 lazy-loaded components in marketplace)
- Virtualized product grid (IntersectionObserver prefetch in ProductCard)
- Frame pacing (NavigationProgress CSS animation, will-change removal)
- Long task optimization (CSV export ISO date formatting)
- Memory optimization (NotificationProvider, GuestCartContext useMemo)
- Mobile FlatList optimization (getItemLayout, removeClippedSubviews, initialNumToRender)
- Skeleton screens on all pages
- SSE kick on account suspension
