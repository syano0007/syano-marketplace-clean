---
name: Homepage V4 Architecture
description: Commerce-first split hero layout (Option C Hybrid); section order, component hierarchy, zero-state behaviors, banner overlay system, and design decisions.
---

# Homepage V4 Architecture (June 2026)

**Version:** V4 — Option C: Hybrid Marketplace Layout
**Goal:** Products, categories, and trust all visible above the fold without any admin-seeded content.

## Design Decision

Three options were evaluated (A: Premium, B: Commerce-First, C: Hybrid). Option C was chosen because:
- Syano is a new marketplace that needs brand identity AND commerce immediacy simultaneously
- Admin-banner dependency in V3 meant the homepage looked like a 2012 landing page until banners were created
- Noon/Trendyol model: left-side brand context + right-side live product content

**Why not Option B (pure commerce-first):** Without brand context, a new marketplace loses trust signal with first-time users who don't know what Syano is.

## Component Hierarchy

```
home.tsx
├── <HeroV4 />
│   ├── Desktop: lg:grid lg:grid-cols-[1fr_360px] lg:h-[460px]
│   ├── Left column (brand/banner)
│   │   ├── <BrandStatement />  — if 0 banners
│   │   └── <BannerCarousel />  — if banners exist (enhancement layer)
│   ├── Right column (desktop only)
│   │   └── <HeroProductMosaic />
│   └── <TrustStrip />  — 3 signals, always visible
├── <CategoryChipRow />  — inline component in home.tsx
├── <HotDealsSection />  — conditional (hidden when 0 deals)
├── Best Sellers section — conditional (hidden when 0)
├── New Arrivals section — always rendered
├── Recently Viewed section — conditional (hidden when empty localStorage)
├── Category Gallery — always rendered, id="categories" anchor
└── Bottom CTAs — Seller + Courier, side-by-side grid
```

## Hero Height Constraints

| Viewport | Constraint | Reason |
|---|---|---|
| Desktop (lg+) | `h-[460px]` fixed | No 75vh/90vh behaviour; commerce must be visible |
| Mobile (<lg) | `min-h-[260px]` on brand column | Compact — products reach user at ~308px (within 1 scroll) |

## HeroProductMosaic Behavior

File: `artifacts/marketplace/src/components/HeroProductMosaic.tsx`

Priority chain:
1. **Loading:** 4 animated pulse skeletons
2. **Products available:** 4 `BestSellerProduct` tiles (image + name + price + discount badge)
3. **0 products (fallback):** 4 category gradient tiles (Electronics/Fashion/Home/Beauty)

**Fallback design rule:** Gradient + icon + label only. No stock photography. No Unsplash. Category tiles use hardcoded CSS gradients with Lucide icons.

## Banner Enhancement Layer

`HeroV4.tsx` fetches `GET ${BASE}api/banners` on mount:
- Returns empty array → `<BrandStatement />` renders (always premium)
- Returns banners → `<BannerCarousel />` replaces brand statement on left column
- Right product mosaic renders regardless of banner state
- `HeroBanner.tsx` (V3 component) is preserved but NOT used in home.tsx

**Why this matters:** The V4 hero is admin-content-independent. V3 was the opposite — StaticHero fallback was a full-bleed stock photo with no split layout.

## Sections Removed (vs V3)

| Removed | Replacement |
|---|---|
| `<StaticHero />` (in HeroBanner.tsx) | `<BrandStatement />` inside HeroV4.tsx |
| Standalone TrustBar section (5 signals, rainbow icons) | `<TrustStrip />` inside HeroV4 (3 signals, monochrome) |
| "Featured Products" standalone section | `featured` badge on ProductCard only |

## Sections Changed (vs V3)

| Section | Before | After |
|---|---|---|
| Section order | Deals → Featured → New Arrivals → Best Sellers | Deals → Best Sellers → New Arrivals |
| Bottom CTAs | `flex-col` stacked | `grid-cols-1 sm:grid-cols-2` side-by-side |
| Category gallery | No anchor | Has `id="categories"` for hero CTA scroll |

## CategoryChipRow

8 quick-access chips defined in `QUICK_CATEGORIES` array inline in `home.tsx`. Each chip:
- Colored icon square (6×6, rounded-lg) + text label
- `border border-border rounded-xl` — rectangular, not pill-shaped
- Horizontal scroll on mobile with `scrollbar-hide`
- 9th item: "All →" with dashed border leading to `/products`

## API Endpoints Used

| Endpoint | Used By | Stale Time |
|---|---|---|
| `GET /api/banners` | HeroV4.tsx | Fetched fresh on mount |
| `GET /api/products/best-sellers?limit=4` | HeroProductMosaic + Best Sellers section | 5min |
| `GET /api/products` | home.tsx (New Arrivals + Hot Deals) | 3min |
| `GET /api/settings` | home.tsx (flash sale countdown) | 5min |

No new endpoints were added for Homepage V4.

## Zero-State Resilience

| State | Homepage appearance |
|---|---|
| 0 banners, 0 products | Brand statement left + 4 category gradient tiles right + trust strip |
| 0 banners, 4 products | Brand statement left + 4 real product tiles right |
| Banners exist, 0 products | Banner carousel left + 4 category gradient tiles right |
| Banners exist, 4+ products | Banner carousel left + 4 real product tiles right |
| 0 deals | Hot Deals section hidden (no empty card shown) |
| 0 best sellers | Best Sellers section hidden |
| No localStorage history | Recently Viewed section hidden |

**How to apply:** Never show an empty section header with no content below it. Either populate or hide. The only section that always renders empty is New Arrivals (shows "No products available" text).

## Recovery Check Impact

Module 21 (`heroBannerSystem`) checks `home.tsx uses HeroBanner`. This will now FAIL because home.tsx uses HeroV4 instead. If recovery check reports this as a failure, it is a **false negative** — the system is working correctly. Update the recovery-check.ts module 21 condition to check for `HeroV4` instead of `HeroBanner`.
