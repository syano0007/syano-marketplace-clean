# RECOVERY_GUIDE.md — SYANO (سوق سوريا)

## PURPOSE
This file allows any AI session to recover and continue instantly without asking the user for context.

Read this FIRST in any new session before touching any code.

---

## ⚠️ PERMANENT ROOT OWNER — READ THIS FIRST

The one and only permanent owner of this platform is:

- **Email:** `delewatiamer7@gmail.com`
- **Password:** `00Amer00`
- **Role:** `admin` | **Status:** `active` | **Verified:** `true`

This account is self-healing: it is created/repaired automatically on every API startup.
**No other bootstrap admin should ever exist.** Any typo variant (e.g. `delewaitamer7`) is automatically deleted on startup.

---

## LATEST VERIFIED CHECKPOINT
- **Date:** 2026-06-09
- **Recovery version:** Post-Migration Stable Build (v2)
- **TypeScript:** 0 structural errors across api-server, marketplace, mobile
- **Database:** 22 tables, all additive migrations applied
- **Root Owner:** delewatiamer7@gmail.com (role=admin, active, verified) — self-healing
- **All services:** API Server + Marketplace + Mobile running
- **Official logo:** Installed and verified (silver/green S, see Branding section)
- **Browser console:** Zero errors

---

## Official Branding Assets

### Official SYANO Logo
- **Canonical source:** `artifacts/marketplace/src/assets/syano-logo.png`
- **Public URL path:** `artifacts/marketplace/public/syano-logo.png`
- **Mobile icon:** `artifacts/mobile/assets/images/icon.png`
- **Design:** Silver/metallic "S" letterform with green neon glow on dark background, 500×500 RGBA PNG
- **Used in:** Navbar (×3 via `src="/syano-logo.png"`), AdminLayout (×1), index.html JSON-LD

### PWA / Manifest PNG Icons (all generated from official logo)
All live in `artifacts/marketplace/public/`:
- `favicon-16x16.png` (16×16)
- `favicon-32x32.png` (32×32)
- `favicon-48x48.png` (48×48)
- `apple-touch-icon.png` (180×180)
- `android-chrome-192x192.png` (192×192)
- `android-chrome-512x512.png` (512×512)

### Other Assets
- `artifacts/marketplace/public/favicon.svg` — red rounded square, brand favicon
- `artifacts/marketplace/public/fonts/inter-latin.woff2` — Inter font (73KB WOFF2)
- `artifacts/marketplace/public/opengraph.jpg` — OpenGraph social preview (114KB)

### If Logo Is Missing After Migration
```bash
# Restore from canonical copy inside src/assets/
cp artifacts/marketplace/src/assets/syano-logo.png artifacts/marketplace/public/syano-logo.png

# Regenerate all PNG icons from official logo
LOGO=artifacts/marketplace/public/syano-logo.png
PUBLIC=artifacts/marketplace/public
magick "$LOGO" -resize 16x16   $PUBLIC/favicon-16x16.png
magick "$LOGO" -resize 32x32   $PUBLIC/favicon-32x32.png
magick "$LOGO" -resize 48x48   $PUBLIC/favicon-48x48.png
magick "$LOGO" -resize 180x180 $PUBLIC/apple-touch-icon.png
magick "$LOGO" -resize 192x192 $PUBLIC/android-chrome-192x192.png
magick "$LOGO" -resize 512x512 $PUBLIC/android-chrome-512x512.png

# Restore mobile icon
cp artifacts/marketplace/src/assets/syano-logo.png artifacts/mobile/assets/images/icon.png
```

### If Inter Font Is Missing
```bash
mkdir -p artifacts/marketplace/public/fonts
curl -fsSL "https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwYZ8UA3.woff2" \
  -o artifacts/marketplace/public/fonts/inter-latin.woff2
```

---

## Recovery Order (run in this exact sequence)

### Step 1 — Install dependencies
```bash
pnpm install
```

### Step 2 — Verify environment variables
All must be present:
- `DATABASE_URL`
- `SESSION_SECRET`
- `SITE_URL`
- `CORS_ORIGIN`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`
- `REPLIT_DEV_DOMAIN`
- `REPLIT_DOMAINS`
- `REPL_ID`

Check: `printenv | grep -E "DATABASE_URL|SESSION_SECRET|SITE_URL|CORS_ORIGIN|VAPID|REPLIT"`

### Step 3 — Verify database (expect 22 tables)
```bash
psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"
```

If empty, push schema:
```bash
cd lib/db && echo "" | DATABASE_URL="$DATABASE_URL" pnpm drizzle-kit push --config=drizzle.config.ts
```
Then restart API server — it applies all additive migrations automatically.

### Step 4 — Root Owner is self-healing (automatic)
`bootstrapRootAdmin()` runs on every API startup. No manual action required.

Verify in API logs: `Root Owner healthy` / `Root Owner bootstrapped` / `Root Owner repaired`

### Step 5 — Build lib declarations
```bash
npx tsc --build lib/db lib/api-zod lib/api-client-react
```
Required after fresh clone/migration. Run before any tsc checks.

### Step 6 — Restore branding assets
Check that all public assets exist:
```bash
ls artifacts/marketplace/public/syano-logo.png \
   artifacts/marketplace/public/favicon-16x16.png \
   artifacts/marketplace/public/fonts/inter-latin.woff2 \
   artifacts/mobile/assets/images/icon.png
```
If any are missing, use the restore commands in the Branding section above.

### Step 7 — Start services
Via Replit workflow manager:
- `artifacts/api-server: API Server` → `export NODE_ENV=development && pnpm run build && pnpm run start`
- `artifacts/marketplace: web` → `vite --config vite.config.ts --host 0.0.0.0`
- `artifacts/mobile: expo` → `expo start`

### Step 8 — Verify authentication
```bash
curl -s -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"delewatiamer7@gmail.com","password":"00Amer00"}'
```
Expected: `{ user: { role: "admin" }, token: "eyJ..." }`

### Step 9 — Verify browser console shows zero errors
Open the marketplace preview. Browser console must be clean.

### Step 10 — Read current project state
1. `project-memory/CURRENT_STATE.md` — overall verified state
2. `project-memory/KNOWN_ISSUES.md` — open bugs
3. `project-memory/DATABASE_STATE.md` — schema details
4. `project-memory/CHANGELOG.md` — recent changes

---

## Verified Working Systems (DO NOT REBUILD)

| System | Status | Notes |
|---|---|---|
| Authentication (JWT, bcrypt, OTP) | ✅ Verified | OTP disabled via VERIFICATION_ENABLED flag |
| Guest Cart | ✅ Verified | All entry points wired |
| Seller Dashboard | ✅ Verified | Orders, products, inventory, analytics, messaging |
| Admin Dashboard | ✅ Verified | Users, products, orders, logs, stats, suspension |
| Notifications (SSE + polling) | ✅ Verified | DO NOT MODIFY NotificationProvider.tsx |
| Push Notifications (VAPID) | ✅ Verified | Service worker intact |
| Messaging (SSE real-time) | ✅ Verified | 3s/5s polling fallback |
| Product Reviews | ✅ Verified | |
| Seller Reviews | ✅ Verified | |
| Store Follow system | ✅ Verified | |
| Seller Applications | ✅ Verified | Draft, submit, admin approval |
| Product Variants | ✅ Verified | Groups, options, values, images |
| Variant Builder (1,323 lines) | ✅ Verified | RTL+mobile QA complete. DO NOT MODIFY VariantBuilder.tsx |
| Flash Sale | ✅ Verified | flashSaleEnd in platform_settings |
| Arabic RTL + i18n (ar/en) | ✅ Verified | en.json + ar.json, 1,837 lines each |
| Google Translate protection | ✅ Verified | translate="no" on all price spans |
| Account Suspension | ✅ Verified | requireActiveAccount middleware |
| Seller store pages | ✅ Verified | |
| Search (pg_trgm) | ✅ Verified | |
| Sitemap | ✅ Verified | |
| CSV export | ✅ Verified | |
| Performance optimizations | ✅ Verified | See PERFORMANCE_STATE.md |
| Products page (CSS grid layout) | ✅ Verified | Virtualizer removed — DO NOT re-add |
| RTL layout | ✅ Verified | |
| Mobile (Expo 54) | ✅ Verified | |

---

## DO NOT (Absolute Rules)

- **DO NOT regenerate OpenAPI** — manually extended (isBestDeal, storeName, hasVariants, flashSale*, q on AdminListUsersParams)
- **DO NOT run orval** without preserving all manual extensions
- **DO NOT rewrite authentication** — fully working, JWT + bcrypt + OTP all intact
- **DO NOT recreate JWT logic** — SESSION_SECRET is in Replit Secrets
- **DO NOT remove additive migrations** from `run-migrations.ts` — idempotent, safe to re-run
- **DO NOT drop tables or columns** — additive only
- **DO NOT modify the manualChunks** in `vite.config.ts` without understanding the pnpm path bug
- **DO NOT merge vendor-react and vendor-radix** into one chunk — causes production crash
- **DO NOT add scroll-behavior: smooth to html root** — causes layout recalculations
- **DO NOT use position:fixed on mobile action bars** — doesn't render correctly
- **DO NOT undo any performance optimization** — all are complete and verified
- **DO NOT modify VariantBuilder.tsx** — 1,323 lines, RTL+mobile QA complete, fully tested
- **DO NOT modify NotificationProvider.tsx** — 243 lines, fully tested
- **DO NOT re-add useWindowVirtualizer** to products page — caused footer overlap
- **DO NOT replace syano-logo.png** with placeholders — restore from `src/assets/syano-logo.png`
- **DO NOT rebuild working features** without a proven defect

---

## Key File Locations

| What | Where |
|---|---|
| API Server entry | `artifacts/api-server/src/index.ts` |
| API Server routes | `artifacts/api-server/src/routes/index.ts` |
| Additive migrations | `artifacts/api-server/src/lib/run-migrations.ts` |
| Drizzle schema | `lib/db/src/schema/` |
| Drizzle config | `lib/db/drizzle.config.ts` |
| Vite config (bundle split) | `artifacts/marketplace/vite.config.ts` |
| i18n translations | `artifacts/marketplace/src/i18n/{en,ar}.json` |
| **Official logo (canonical)** | `artifacts/marketplace/src/assets/syano-logo.png` |
| **Official logo (public URL)** | `artifacts/marketplace/public/syano-logo.png` |
| **Mobile app icon** | `artifacts/mobile/assets/images/icon.png` |
| Generated API schemas | `lib/api-client-react/src/generated/api.schemas.ts` |
| Generated API hooks | `lib/api-client-react/src/generated/api.ts` |
| Auth routes | `artifacts/api-server/src/routes/auth.ts` |
| Auth middleware | `artifacts/api-server/src/middleware/` |
| Product card | `artifacts/marketplace/src/components/ProductCard.tsx` |
| Notification provider | `artifacts/marketplace/src/providers/NotificationProvider.tsx` |
| Guest cart context | `artifacts/marketplace/src/providers/GuestCartContext.tsx` |

---

## Workspace Structure
```
workspace/
├── attached_assets/        — User-uploaded files (logo source etc.)
├── artifacts/
│   ├── api-server/         Express v5 + TypeScript + esbuild (port 8080)
│   ├── marketplace/        React 18 + Vite + TanStack Query + Radix UI
│   ├── mobile/             Expo 54 + React Native + Expo Router
│   └── mockup-sandbox/     Canvas component preview (port $PORT)
├── lib/
│   ├── db/                 Drizzle ORM schema (composite TS — build with tsc --build)
│   ├── api-zod/            Zod schemas (composite TS — build with tsc --build)
│   ├── api-client-react/   Orval hooks (composite TS — build with tsc --build)
│   └── api-spec/           OpenAPI source
├── project-memory/         THIS DIRECTORY — persistent project state
└── pnpm-workspace.yaml
```

---

## Quick Diagnostic Commands
```bash
# Services health
curl -s http://localhost:8080/api/settings
curl -s http://localhost:8080/api/products?limit=1

# DB table count (expect 22)
psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"

# Branding assets check
ls -la artifacts/marketplace/public/syano-logo.png \
        artifacts/marketplace/public/favicon-16x16.png \
        artifacts/marketplace/public/fonts/inter-latin.woff2 \
        artifacts/mobile/assets/images/icon.png

# TypeScript check (ignore pre-existing TS7006)
npx tsc --noEmit -p artifacts/api-server/tsconfig.json 2>&1 | grep "error TS" | grep -v TS7006
npx tsc --noEmit -p artifacts/marketplace/tsconfig.json 2>&1 | grep "error TS" | grep -v TS7006
npx tsc --noEmit -p artifacts/mobile/tsconfig.json    2>&1 | grep "error TS" | grep -v TS7006

# Rebuild lib declarations
npx tsc --build lib/db lib/api-zod lib/api-client-react
```

---

## Known Open Issues

- **KI-001:** TS7006 implicit-any in callbacks — pre-existing, accepted, does not affect runtime
- **KI-002:** Non-root admin passwords set during recovery — reset via forgot-password flow
- **KI-003:** Expo packages ~1 patch behind — no functional impact
