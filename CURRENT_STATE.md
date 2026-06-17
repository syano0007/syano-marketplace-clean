# SYANO — Current State
Last updated: June 17, 2026

## Project Identity
- Name: SYANO — سوق سوريا
- Type: Multi-vendor marketplace
- Domain: syanomarket.online
- GitHub: https://github.com/syano0007/syano07007
- Status: Pre-launch — Phase M1 COMPLETE ✅

## Phase M1 — Mobile Parity: Marketplace Core — COMPLETE ✅
Date: June 17, 2026

### New Files
- `artifacts/mobile/contexts/WishlistContext.tsx` — AsyncStorage (guest) + API (auth) wishlist state
- `artifacts/mobile/app/(tabs)/wishlist.tsx` — Wishlist tab: list, remove, add-to-cart, empty state

### Modified Files
- `artifacts/mobile/app/_layout.tsx` — WishlistProvider added
- `artifacts/mobile/app/(tabs)/_layout.tsx` — wishlist tab + live badge count
- `artifacts/mobile/components/ProductCard.tsx` — heart button, rating row, heartBtn/ratingRow/ratingText styles
- `artifacts/mobile/app/product/[id].tsx` — swipeable image gallery, reviews, related products, wishlist heart
- `artifacts/mobile/app/store/[slug].tsx` — FollowButton component (follow/unfollow, followStatus.following)
- `artifacts/mobile/app/(tabs)/index.tsx` — HomepageHeader: Hot Deals, Categories, New Arrivals, shop mode toggle
- `artifacts/mobile/src/i18n/index.ts` — EN+AR: wishlist.*, home.*, store.*, cart.add_to_cart, product.reviews/related, nav.wishlist

### Parity Delta
- Overall: 28% → 33% (46 → 54 features implemented)
- Wishlist: 0% → 100% ✅
- Marketplace/Browsing: 47% → 80% ✅

### TypeScript Status
0 errors (`npx tsc --noEmit --skipLibCheck` — clean pass)

---

## Phase 12 — Performance & Scalability — COMPLETE ✅

### Database Indexes (22 new indexes via run-migrations.ts — STEP 3)
All 22 indexes created via `executeSql` (additive, `IF NOT EXISTS`):
- `users`: idx_users_email, idx_users_role, idx_users_created_at
- `products`: idx_products_seller_id, idx_products_category, idx_products_stock, idx_products_featured, idx_products_sales_count, idx_products_created_at, idx_products_price, idx_products_name_trgm (GIN), idx_products_description_trgm (GIN)
- `seller_applications`: idx_seller_applications_user_id, idx_seller_applications_status
- `orders`: idx_orders_customer_id, idx_orders_seller_id, idx_orders_status, idx_orders_created_at
- `conversations`: idx_conversations_buyer_id, idx_conversations_seller_id, idx_conversations_order_id
- `messages`: idx_messages_conversation_id, idx_messages_created_at
- `reviews`: idx_reviews_product_id, idx_reviews_seller_id

### In-process LRU Cache (STEP 4) — `artifacts/api-server/src/services/cacheService.ts`
Generic `CacheService<T>` class + 4 named instances:
- `productsCache` — 500 entries, 60s TTL — GET /products
- `productDetailCache` — 200 entries, 5min TTL — GET /products/:id
- `categoriesCache` — 1 entry, 1hr TTL — GET /products/categories
- `sellersCache` — 100 entries, 2min TTL — GET /sellers/directory
- X-Cache: HIT / MISS headers on all cached routes
- Cache invalidation on POST/PATCH/DELETE mutations
- Admin stats endpoint: GET /api/admin/cache-stats

### Connection Pool Tuning (STEP 5) — `lib/db/src/index.ts`
- `max=20, min=2, idleTimeoutMillis=30000, connectionTimeoutMillis=5000, statement_timeout=10000`
- Memory logging every 60s (dev only)
- Pool monitoring every 5min (dev only)
- Graceful SIGTERM/SIGINT shutdown with 10s forced exit

### Query Timeout Protection (STEP 6.4) — products.ts
- `withQueryTimeout<T>()` helper — `Promise.race` with 8000ms
- Applied to GET /products main query; returns HTTP 503 + Retry-After: 5 on timeout
- Also protected by pg `statement_timeout: 10_000` at pool level

### EXPLAIN ANALYZE Results (STEP 6.1)
- products list: **1.879ms** execution time — all buffer hits, no disk I/O
- Seq Scans on products(42 rows), reviews(40 rows), users(11 rows) are OPTIMAL (planner correct)

### Load Test Results (PART 7) — autocannon
| Test | Connections | Duration | Req/s avg | Latency p50 | Errors |
|---|---|---|---|---|---|
| healthz | 100 | 5s | 2,228 | 37ms | 0 |
| GET /products | 50 | 10s | 1,696 | 222ms* | 0 |
| GET /search | 30 | 10s | 1,566 | 16ms | 0 |
*50 connections × 10 pipeline factor = 500 in-flight; cache hit path; latency dominated by JSON serialization (~20KB/response)

### After Optimization Measurements (STEP 9)
| Endpoint | Cold | Warm (cache HIT) | Target |
|---|---|---|---|
| healthz | 13ms | 3ms | <100ms ✅ |
| GET /products | 30ms | 6ms | <100ms cold / <20ms warm ✅ |
| GET /products/:id | 34ms | 3.5ms | <100ms cold / <20ms warm ✅ |
| GET /products/categories | 3.5ms | 3.5ms | <100ms ✅ |
| GET /search/results | 37ms | 3.5ms | <100ms cold / <20ms warm ✅ |
| GET /sellers/directory | ~84ms | 4ms | <100ms cold / <20ms warm ✅ |
| GET /orders (admin) | 23ms | 13ms | <100ms ✅ |

### TypeScript (PART 10)
- `npx tsc --noEmit -p artifacts/api-server/tsconfig.json` → EXIT:0 ✅
- `npx tsc --noEmit -p artifacts/marketplace/tsconfig.json` → EXIT:0 ✅

---

## Phase 11 — Launch Preparation — COMPLETE ✅
All 10 prompts finished:
- Prompt 1  — Launch Readiness Audit     ✅
- Prompt 2  — Critical & High Fixes      ✅
- Prompt 3  — Error Handling Layer       ✅
- Prompt 4  — Data Quality               ✅
- Prompt 5  — Mobile Readiness           ✅
- Prompt 6  — Security Review            ✅
- Prompt 7  — Email OTP Verification     ✅
- Prompt 8  — SEO Layer                  ✅
- Prompt 9  — Accessibility (≥96)        ✅
- Prompt 10 — Performance Baseline       ✅

## Next Phase
Phase 12 — Performance & Scalability
Phase 13 — AI Agent (Customer Service)

## Last Session Work — June 16, 2026
### Phase 11 — Prompt 10 — Performance Baseline ✅

1. Vite build optimization:
   - manualChunks: vendor-react, vendor-query, vendor-i18n, vendor-ui, vendor-radix, vendor-charts, vendor-motion, vendor-date, vendor-router, vendor-forms, vendor-icons
   - target: es2020, minify: esbuild, cssMinify: lightningcss
   - reportCompressedSize: true, chunkSizeWarningLimit: 500

2. Gzip compression: compression middleware already installed in API server (threshold 1KB, level 6)

3. Cache headers:
   - Static assets: Cache-Control max-age=1y (served via Vite build output)
   - HTML: no-cache always
   - API GET /products: public, max-age=60, stale-while-revalidate=300
   - API GET /products/:id: public, max-age=300, stale-while-revalidate=600
   - API GET /products/categories: public, max-age=3600, stale-while-revalidate=86400
   - API GET /sellers/directory: public, max-age=120, stale-while-revalidate=600
   - API GET /sellers/store/:slug: public, max-age=300, stale-while-revalidate=600

4. LazyImage component: artifacts/marketplace/src/components/LazyImage.tsx
   - loading="lazy", decoding="async", skeleton placeholder, error fallback
   - priority prop for above-the-fold images (loading="eager", fetchpriority="high")

5. PageLoadingSpinner component: artifacts/marketplace/src/components/PageLoadingSpinner.tsx
   - role="status", aria-label from i18n, centered spinner

6. Code splitting: all non-home pages already converted to React.lazy() + Suspense (done in prior phase)

7. Font optimization:
   - Inter: self-hosted WOFF2, preloaded in index.html, font-display:swap in @font-face
   - Cairo: Google Fonts @import in index.css with &display=swap
   - preconnect to fonts.googleapis.com + fonts.gstatic.com added to index.html

8. TanStack Query: staleTime=5min, gcTime=30min, retry=2, refetchOnWindowFocus=false, refetchOnReconnect=true

9. Web Vitals tracking: CLS, FCP, LCP, TTFB, INP — dev console only (no data sent)
   - web-vitals@^5.0.0 added to artifacts/marketplace/package.json

10. ETag support: changed to "strong" on API server

11. Resource hints in index.html: preconnect + dns-prefetch for fonts.googleapis.com, fonts.gstatic.com, Pexels, Unsplash, Cloudinary

12. TrendingCard product images: width={400} height={400} added for CLS prevention

## Bundle sizes (production build):
- vendor-react: 797KB (230KB gzip) — React+ReactDOM+scheduler, unavoidable
- index chunk: 514KB (142KB gzip) — home page entry, eagerly loaded by design
- All other chunks: <100KB uncompressed ✅

## Required Replit Secrets — ALL must be set:
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

## Embedding Service
- Status: TF-IDF fallback — INTENTIONAL — do not install sentence-transformers
- Note: In fresh environments, requires pip install of numpy+scikit-learn for TF-IDF mode
- Full model installed only once before final production launch

## Database State
- 37 tables, fully migrated (21 base schema + 16 via run-migrations.ts)
  - Includes: dispatch_alerts (V3.3 finalization), delivery_missions, delivery_zones, mission_offers, courier_assignments, courier_wallet_transactions, and all prior migration tables
  - couriers table now has current_lat/current_lng columns (Haversine distance sorting)
- 42 products with vector embeddings
- pgvector enabled — vector(384) on products table

## Test Accounts
- Admin:   delewatiamer7@gmail.com
- Seller:  delewatiamer8@gmail.com
- Courier: delewatiamer9@gmail.com
