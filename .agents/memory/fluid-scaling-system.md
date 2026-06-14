---
name: Fluid Scaling System V1
description: Root clamp font-size + px→rem conversion rules across the marketplace
---

## The Engine
`html { font-size: clamp(13px, calc(8px + 0.5vw), 16px) }` in `artifacts/marketplace/src/index.css`

**Why:** Single-source scaling — every `rem` value (Tailwind utilities + explicit conversions) scales automatically as viewport narrows.

**Scale table:** 960px→13px (floor), 1280px→14.4px, 1440px→15.2px, 1600px→16px (cap)

## Conversion Rules

**CONVERT to rem (consumer-facing):**
- Inline `fontSize` values ≥ 13px in HomeSections, Navbar, product cards
- Eyebrow labels with `letterSpacing: "0.12em"` even if 12px (uppercase tracks well at 9.75px floor)
- Structural dimensions (hero card, floating cards, nav heights, grid heights)

**KEEP as px (intentional floors):**
- `fontSize` ≤ 12px for badge/label text, review counts, strikethrough prices
- `fontSize` ≤ 11px everywhere (9px, 10px, 11px)
- All admin/seller/courier page sizes (internal tools)
- Decorative blur circles (`w-[700px]`, etc.)
- `pc-*` compact card overrides in index.css (5-col grid floor)

## Status (June 2026)
- ✅ HeroSection, FeaturedDeals, TrustedStores, NewArrivals, JoinSection, HomeFooter
- ✅ PopularCategories, TrendingProducts, TrendingCard
- ✅ Navbar (heights, logo, icons, badges, SYANO text, search)
- 📋 Remaining: HeroBanner, product detail page, store pages, messages UI

## CSS Variable
`--navbar-height` in index.css: `3.75rem` mobile / `4rem` desktop (matches `h-[3.75rem]` / `h-[4rem]` in Navbar.tsx)
