# SYANO — Recovery Guide
Last updated: June 17, 2026 (Full Boot Recovery — all 5 workflows verified, 37 tables, 42/42 embeddings)

## HOW TO RECOVER ON A NEW REPLIT ACCOUNT

### Step 1 — Verify env vars are set
These are set in .replit [userenv.shared] — no manual setup needed:
  EMBEDDING_SERVICE_URL   = http://localhost:8000   ← PORT 8000 (not 8001!)
  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
  ROOT_ADMIN_PASSWORD     = 00Amer00
  CORS_ORIGIN, SITE_URL, VITE_SUPPORT_PHONE

Replit Secrets (set in Secrets tab):
  SESSION_SECRET, DATABASE_URL (auto), RESEND_API_KEY, EMAIL_FROM

### Step 2 — Install packages (fresh env only)
  pnpm install --shamefully-hoist

### Step 3 — Load database schema (fresh env only)
  psql "$DATABASE_URL" -f schema.sql
  # schema.sql now includes: delivery_missions table + delivery_mission_status + delivery_size enums
  # run-migrations.ts adds 16 more tables + columns on first API start

### Step 4 — Build libs (fresh env only)
  npx tsc --build lib/db lib/api-zod lib/api-client-react

### Step 5 — Start all workflows
These workflows must all be running:
  - artifacts/api-server: API Server       → port 8080
  - Embedding Service                      → port 8000 (command: cd artifacts/embedding-service && EMBEDDING_PORT=8000 python main.py)
  - artifacts/marketplace: web             → port 20787
  - artifacts/mobile: expo                 → port 18115

If Embedding Service workflow is missing → create it with the command above, waitForPort=8000

### Step 6 — Verify all services are healthy
  GET http://localhost:8080/api/healthz  → must return { "status": "ok" }
  GET http://localhost:8000/health       → must return { "status": "ok", "backend": "tfidf-lsa" }

### Step 7 — Generate embeddings (if 0/42)
  pnpm --filter @workspace/api-server embed:generate

### Step 8 — Read CURRENT_STATE.md
Read CURRENT_STATE.md in full to know exactly where development stopped.

## EMAIL SERVICE
- Provider: Resend (resend.com)
- Verified domain: syanomarket.online (DKIM ✅ SPF ✅ MX ✅)
- From address: noreply@syanomarket.online
- Required secrets: RESEND_API_KEY, EMAIL_FROM
- Service file: artifacts/api-server/src/services/emailService.ts
- OTP flow: POST /api/auth/register → OTP email → POST /api/auth/verify-email → JWT

## EMBEDDING SERVICE
- Status on startup: TF-IDF fallback — this is correct and intentional
- Do NOT install sentence-transformers or torch during any development session
- Do NOT download model files during development
- Only before final production launch:
    pip install --no-cache-dir sentence-transformers torch==2.4.0+cpu --index-url https://download.pytorch.org/whl/cpu
    Then restart the Embedding Service workflow
    Then run: cd artifacts/api-server && npm run embed:generate

## MOBILE PARITY STATUS (Phase M1 — June 17, 2026)
- WishlistContext: `artifacts/mobile/contexts/WishlistContext.tsx`
- Wishlist tab: `artifacts/mobile/app/(tabs)/wishlist.tsx`
- ProductCard hearts + ratings: `artifacts/mobile/components/ProductCard.tsx`
- Product gallery/reviews/related: `artifacts/mobile/app/product/[id].tsx`
- Store follow/unfollow: `artifacts/mobile/app/store/[slug].tsx` — uses `followStatus.following` (NOT isFollowing)
- Homepage sections: `artifacts/mobile/app/(tabs)/index.tsx` — shop mode toggle + HomepageHeader
- i18n keys: wishlist.*, home.*, store.*, cart.add_to_cart, nav.wishlist (EN+AR in `artifacts/mobile/src/i18n/index.ts`)

## ARCHITECTURE RULES — NEVER VIOLATE
- No `any` TypeScript type — 0 errors mandatory
- No dropping or altering existing DB columns — additive migrations only
- No breaking existing API response shapes — add optional fields only
- No hardcoded visible text — all strings via i18n (ar.json / en.json)
- No redesigning existing pages or components
- All components must work in all four combinations: AR RTL + EN LTR × dark + light
- Mobile minimum width: 375px
- Use logical Tailwind classes: ms- not ml-, ps- not pl-, start- not left-
