# SYANO — Current State
Last updated: June 16, 2026

## Project Identity
- Name: SYANO — سوق سوريا
- Type: Multi-vendor marketplace
- Domain: syanomarket.online
- GitHub: https://github.com/syano0007/syano07007
- Status: Pre-launch — Phase 11 COMPLETE ✅

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
- 33 tables, fully migrated
- 42 products with vector embeddings
- pgvector enabled — vector(384) on products table

## Test Accounts
- Admin:   delewatiamer7@gmail.com
- Seller:  delewatiamer8@gmail.com
- Courier: delewatiamer9@gmail.com
