---
name: Homepage V4 Architecture
description: Commerce-first full-width hero (V4 refined); section order, component hierarchy, zero-state behaviors, banner overlay system, and design decisions.
---

# Homepage V4 Architecture (June 2026)

**Version:** V4 refined — Full-Width Cinematic Hero
**Previous:** Option C Hybrid (split left/right mosaic) — superseded by full-width.

## Design Decision (V4 → V4 Refined)

The split mosaic (`HeroProductMosaic` right column) and the `TrustStrip` below the hero were removed because:
- Full-width cinematic image is more premium and visually dominant
- Trust signals are now inline in the hero content (bullet dots + text)
- Mosaic felt cluttered and competed with the hero statement

**Current approach:** Single-column full-width hero with directional dark gradient overlay,
inline search bar, CTAs, and 4 trust bullet signals all inside the hero itself.

## Component Hierarchy

```
home.tsx
├── <HeroV4 />
│   ├── Single full-width column — h-[360px] sm:h-[440px] lg:h-[520px]
│   ├── <BrandStatement />  — if 0 banners (background image cascade)
│   └── <BannerCarousel />  — if banners exist (enhancement layer)
├── <PopularCategoriesSection />  — horizontal scroll chips with Pexels images
├── <VerifiedStoresSection />     — featured seller cards
├── <HotDealsSection />           — conditional (hidden when 0 deals)
├── Best Sellers section          — conditional (hidden when 0)
├── New Arrivals section          — always rendered
├── Recently Viewed section       — conditional (hidden when empty localStorage)
└── Bottom CTAs                   — Seller + Courier, side-by-side grid
```

**Removed from hierarchy (V4 refined):**
- `<HeroProductMosaic />` — right column — REMOVED
- `<TrustStrip />` — below hero — REMOVED
- Category Gallery large photo-card section — REMOVED (was duplicate of PopularCategoriesSection)

## HeroV4 Background Image Strategy

`BrandStatement` uses a cascade array `HERO_BACKGROUNDS[]`:
1. Unsplash fashion/retail store (photo-1441986300917-64674bd600d8)
2. Unsplash restaurant/market (photo-1555396273-367ea4eb4db5)
3. Pexels fallback
4. Final fallback: CSS gradient (`from-slate-900 via-slate-800 to-emerald-950`)

`onError` increments `bgIndex` — if all images fail, dark gradient renders.
This makes the hero work offline or behind Replit network restrictions.

## Hero Gradient Overlay

Uses directional gradient based on `isRTL`:
- LTR: `to right` — dark on left (content side), transparent on right
- RTL: `to left` — dark on right (content side), transparent on left

Values: `rgba(5,15,30,0.88)` at 0% → transparent at 100%
Plus a bottom-to-top depth layer: `from-black/50 to-transparent` on the bottom 40%.

## Typography Changes (V4 refined)

`heading-section` in `index.css` reduced:
- LTR: `clamp(0.9375rem, 0.875rem + 0.5vw, 1.25rem)` — 15–20px
- RTL: `clamp(1rem, 0.9375rem + 0.5vw, 1.375rem)` — 16–22px

Previously 18–30px (LTR) and 19–32px (RTL) — was too large for section labels.
Reference: matches the visual weight of `PopularCategoriesSection` title.

## Banner Enhancement Layer

`HeroV4.tsx` fetches `GET ${BASE}api/banners` on mount:
- Returns empty array → `<BrandStatement />` renders (always premium)
- Returns banners → `<BannerCarousel />` replaces brand statement
- `HeroBanner.tsx` (V3 component) is preserved but NOT used in home.tsx

## API Endpoints Used

| Endpoint | Used By | Stale Time |
|---|---|---|
| `GET /api/banners` | HeroV4.tsx | Fetched fresh on mount |
| `GET /api/products/best-sellers?limit=4` | Best Sellers section | 5min |
| `GET /api/products` | home.tsx (New Arrivals + Hot Deals) | 3min |
| `GET /api/settings` | home.tsx (flash sale countdown) | 5min |
| `GET /api/sellers/featured` | VerifiedStoresSection | 5min |

## Zero-State Resilience

| State | Homepage appearance |
|---|---|
| 0 banners | BrandStatement with background image + inline trust |
| Banners exist | BannerCarousel (full-width same dimensions) |
| 0 deals | Hot Deals section hidden |
| 0 best sellers | Best Sellers section hidden |
| No localStorage history | Recently Viewed section hidden |
| All hero images fail to load | Dark emerald→slate CSS gradient fallback |

## Recovery Check Impact

Module 21 (`heroBannerSystem`) checks `home.tsx uses HeroBanner`. This FAILS because home.tsx
uses `HeroV4` instead. This is a **false negative** — system is working correctly.
The recovery-check module 21 condition should check for `HeroV4`, not `HeroBanner`.

## Files Changed (V4 → V4 Refined)

- `artifacts/marketplace/src/components/HeroV4.tsx` — full rewrite; removed mosaic+trust strip
- `artifacts/marketplace/src/pages/home.tsx` — removed category gallery section (~60 lines)
- `artifacts/marketplace/src/index.css` — heading-section scale reduced (both LTR + RTL)
- `artifacts/marketplace/src/components/HeroProductMosaic.tsx` — still exists, no longer imported
