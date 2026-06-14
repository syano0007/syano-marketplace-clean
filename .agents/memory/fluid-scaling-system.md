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

## Product Grid Density Schedule (V2 — June 2026)
Density-first: cards scale before columns drop. Column breakpoints in `index.css`:
- `< 480px`: 2 cols, 0.5rem gap
- `480–639px`: 3 cols, 0.5rem gap  ← key improvement (was 640px before)
- `640–767px`: 3 cols, 0.625rem gap
- `768–1023px`: 4 cols, 0.625rem gap
- `1024–1279px`: 5 cols, 0.75rem gap
- `1280–1535px`: 6 cols, 0.75rem gap  ← key improvement (was 5 before)
- `1536px+`: 6 cols, 0.875rem gap

pc-* overrides are tiered (not flat): tighter at base/<640px, moderate at 640px+, comfortable at 1024px+, near-natural at 1536px+.

`.store-grid` class: same column schedule as product-grid (2→3→4→5→5) WITHOUT pc-* overrides. Used by store/[slug].tsx and wishlist.tsx.
`.category-grid`: 2→3→4→5→6 cols.

FeaturedDeals + TrendingProducts homepage sections: changed from `grid-cols-1` → `grid-cols-2` on mobile.

## Status (June 2026)
- ✅ HeroSection, FeaturedDeals, TrustedStores, NewArrivals, JoinSection, HomeFooter
- ✅ PopularCategories, TrendingProducts, TrendingCard
- ✅ Navbar (heights, logo, icons, badges, SYANO text, search)
- ✅ Products page, store pages, wishlist — density-first grids
- 📋 Remaining: HeroBanner, product detail page, messages UI

## CSS Variable
`--navbar-height` in index.css: `3.75rem` mobile / `4rem` desktop (matches `h-[3.75rem]` / `h-[4rem]` in Navbar.tsx)
