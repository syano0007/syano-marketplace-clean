# SYANO — Current State
Last updated: June 16, 2026

## Project Identity
- Name: SYANO — سوق سوريا
- Type: Multi-vendor marketplace
- Domain: syanomarket.online
- GitHub: https://github.com/syano0007/syano07007
- Status: Pre-launch — Phase 11 in progress

## Active Phase
Phase 11 — Launch Preparation
Completed: Prompts 1, 2, 3, 4, 5, 6, 7, 8
Remaining: Prompt 9 (Accessibility), Prompt 10 (Performance Baseline)

## Last Session Work — June 16, 2026
### Phase 11 — Prompt 8 — SEO Layer ✅

1. react-helmet-async installed in artifacts/marketplace
2. HelmetProvider added to artifacts/marketplace/src/main.tsx
3. SEO component created: artifacts/marketplace/src/components/SEO.tsx
   - Props: title, description, image, url, type, noindex
   - Outputs: title, meta description, robots, canonical, Open Graph, Twitter Card
4. JsonLd component created: artifacts/marketplace/src/components/JsonLd.tsx
   - Renders JSON-LD structured data via Helmet script tag
5. SEO added to pages: Home, Shop, Product detail, Store, Search results, Deals, Login, Register
6. JSON-LD schemas added: WebSite (home), Product (product detail), LocalBusiness (store), ItemList (shop/deals)
7. i18n keys added under "seo" namespace in ar.json and en.json
8. Default OG image: artifacts/marketplace/public/og-default.jpg
9. Sitemap endpoint: GET /sitemap.xml — returns all products + stores + static URLs
   File: artifacts/api-server/src/routes/sitemap.ts
10. robots.txt: artifacts/marketplace/public/robots.txt

### Phase 11 — Prompt 7 — Email OTP ✅ (previous session)
1. Resend email service: artifacts/api-server/src/services/emailService.ts
2. Domain syanomarket.online verified on Resend: DKIM ✅ SPF ✅ MX ✅
3. OTP flow: POST /api/auth/register → email → POST /api/auth/verify-email → JWT
4. Bug fixed: verification.ts used FROM_EMAIL (wrong) → corrected to EMAIL_FROM with correct domain

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
- Full model installed only once before final production launch

## Database State
- 33 tables, fully migrated
- 42 products with vector embeddings
- pgvector enabled — vector(384) on products table

## Test Accounts
- Admin:   delewatiamer7@gmail.com
- Seller:  delewatiamer8@gmail.com
- Courier: delewatiamer9@gmail.com
