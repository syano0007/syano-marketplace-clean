# SYANO — Recovery Guide
Last updated: June 16, 2026 (Courier V3.3 Mission Offer Engine)

## HOW TO RECOVER ON A NEW REPLIT ACCOUNT

### Step 1 — Set all Secrets
Go to Replit → Secrets and confirm every one of these is set:
  SESSION_SECRET
  RESEND_API_KEY
  EMAIL_FROM              = noreply@syanomarket.online
  CORS_ORIGIN             = https://syanomarket.online
  SITE_URL                = https://syanomarket.online
  ROOT_ADMIN_PASSWORD
  VAPID_EMAIL             = mailto:admin@syanomarket.online
  VAPID_PRIVATE_KEY
  VAPID_PUBLIC_KEY
  VITE_SUPPORT_PHONE
  EMBEDDING_SERVICE_URL   = http://localhost:8001
  ENABLE_EMAIL_VERIFICATION = true

### Step 2 — Start all three workflows
These three workflows must all be running:
  - API Server          → port 8080
  - Marketplace (web)   → port 5000
  - Embedding Service   → port 8001

If any is stopped → restart it and wait for it to fully start before continuing.

### Step 3 — Push database schema
Run: cd artifacts/api-server && npx drizzle-kit push
This is safe to run multiple times — additive only, never destructive.

### Step 4 — Verify all three services are healthy
  GET http://localhost:8080/api/healthz  → must return { "status": "ok" }
  GET http://localhost:5000              → must return HTTP 200
  GET http://localhost:8001/health       → must return { "status": "ok" }

### Step 5 — Read CURRENT_STATE.md
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
