---
name: Hero Banner System V1 (Enhancement Layer in V4)
description: Architecture, schema, API, component, admin, and recovery-check integration for the homepage hero banner carousel. In Homepage V4, HeroBanner.tsx is an enhancement overlay — not the primary hero.
---

# Hero Banner System V1

## Status in Homepage V4 (June 2026)

**HeroBanner.tsx is preserved but no longer directly used in home.tsx.**

In Homepage V4, the primary hero is `HeroV4.tsx`. When admin creates banner records:
- `HeroV4` fetches `/api/banners` and activates `<BannerCarousel />` on the left column
- The right column (`<HeroProductMosaic />`) always renders regardless of banner state
- `HeroBanner.tsx` remains available as a reference and as a possible future full-bleed override

**Recovery check module 21** checks `home.tsx uses HeroBanner` — this is now a false negative. The system is healthy even when this check fails; `HeroV4` contains its own carousel logic.

# Hero Banner System V1 (Original)

## Schema
- Table: `hero_banners` in `lib/db/src/schema/hero_banners.ts`
- Key columns: titleEn, titleAr, subtitleEn, subtitleAr, descriptionEn, descriptionAr, desktopImage, mobileImage, ctaLabelEn, ctaLabelAr, ctaUrl, ctaLabelEnSecondary, ctaLabelArSecondary, ctaUrlSecondary, backgroundColor, textColor, sortOrder, active, startDate, endDate, impressions, clicks
- Migration added to `artifacts/api-server/src/lib/run-migrations.ts` (CREATE TABLE IF NOT EXISTS)

## API Routes (`artifacts/api-server/src/routes/hero-banners.ts`)
- Public: GET /banners (active + scheduled only), POST /banners/:id/impression, POST /banners/:id/click
- Admin (requireAdmin): GET /admin/banners, POST /admin/banners, GET /admin/banners/:id, PATCH /admin/banners/:id, DELETE /admin/banners/:id, PATCH /admin/banners/reorder, GET /admin/banners/analytics

## Frontend Component (`artifacts/marketplace/src/components/HeroBanner.tsx`)
- Framer Motion carousel with `bgVariants`, `textContainer`, `textItem: Variants` (typed explicitly to fix TS error)
- `BezierEase = [number, number, number, number]` type alias required; ease array inferred as `number[]` without it
- Fetches from `${BASE}api/banners` where BASE = `import.meta.env.BASE_URL ?? "/"`
- Tracks impressions on mount, clicks on CTA click
- Falls back to `<StaticHero />` if banners array empty
- Auto-play with pause on hover/focus; RTL-aware prev/next

## Admin Page (`artifacts/marketplace/src/pages/admin/hero-banners.tsx`)
- Route: `/admin/hero-banners` (lazy in App.tsx)
- Full CRUD: list, create, edit, delete, drag-to-reorder (uses reorder endpoint), toggle active
- Analytics tab: impressions/clicks/CTR per banner

## i18n
- 17 keys added to both en.json and ar.json under `hero_banner.*` and `admin.hero_banners.*`

## Recovery Check (Module 21)
- `checkHeroBannerSystem(adminToken)` in recovery-check.ts
- Checks: table accessible, banner count, active count, GET /banners 200, admin auth (401 no token / 200 with token), analytics 200, component file exists, admin page file exists, home.tsx uses HeroBanner, router file has impression+click routes
- Weight: 5, in WEIGHTS object as `heroBannerSystem`

**Why BezierEase alias is needed:**
TypeScript infers `[0.32, 0.72, 0, 1]` as `number[]` which doesn't match Framer Motion's `Variants` type that expects `[number, number, number, number]` tuple. Fix: `type BezierEase = [number, number, number, number]; const EASE_OUT: BezierEase = [...]`.
