# VIEWPORT SCALE AUDIT — SYANO Marketplace
**Date:** June 14, 2026  
**Scope:** Full platform audit for Viewport Scale Architecture V1  
**Objective:** Identify all elements that block proportional canvas-like scaling

---

## AUDIT METHODOLOGY

The audit evaluated every component against three criteria:
1. **Font sizes** — hardcoded `px` vs scalable `rem`/`clamp()`
2. **Spacing** — hardcoded `px` vs rem-based Tailwind utilities or CSS vars
3. **Layout** — fixed-width containers, non-scaling images, column collapse triggers

---

## SECTION 1 — ROOT SCALING ENGINE

| Component | File | Current Value | Blocker | Priority |
|-----------|------|---------------|---------|----------|
| Root font-size | `index.css` L296 | `clamp(13px, 8px+0.5vw, 16px)` | Too narrow range (13–16px), only 11% diff between 1280/1920 | **CRITICAL** |
| pc-title 640px tier | `index.css` | `12px` fixed | Not scaling — same size at 640px and 1920px | **HIGH** |
| pc-price-main 640px tier | `index.css` | `14px` fixed | Not scaling | HIGH |
| pc-title 1024px tier | `index.css` | `13px` fixed | Not scaling | HIGH |
| pc-price-main 1024px tier | `index.css` | `15px` fixed | Not scaling | HIGH |
| pc-title 1536px tier | `index.css` | `14px` fixed | Not scaling at ultra-wide | HIGH |
| pc-price-main 1536px tier | `index.css` | `16px` fixed | Not scaling at ultra-wide | HIGH |

---

## SECTION 2 — HOMEPAGE COMPONENTS

### HeroSection.tsx
| Element | File Path | Fixed Value | Scaling Blocker | Priority |
|---------|-----------|-------------|-----------------|----------|
| Badge text | `HomeSections/HeroSection.tsx` L121 | `fontSize: "12px"` | Hardcoded px — won't scale with root | HIGH |
| Floating card product name | L254 | `fontSize: "11px"` | Hardcoded px | MEDIUM |
| Floating card price | L255 | `fontSize: "12px"` | Hardcoded px | MEDIUM |
| Bottom card category label | L279 | `fontSize: "10px"` | Hardcoded px | MEDIUM |
| Bottom card price | L280 | `fontSize: "12px"` | Hardcoded px | MEDIUM |
| Watch card category | L297 | `fontSize: "10px"` | Hardcoded px | MEDIUM |
| Watch card price | L298 | `fontSize: "12px"` | Hardcoded px | MEDIUM |
| "In stock" label | L304 | `fontSize: "10px"` | Hardcoded px | LOW |
| Hero h1 lines | L134-136 | `clamp(40px, 4.5vw, 68px)` | Uses vw — scales ✓ | PASS |
| Hero subtext | L145 | `fontSize: "1.0625rem"` | In rem — scales ✓ | PASS |
| Decorative blur circles | L113-114 | `w-[700px] h-[700px]` | Decorative only — acceptable | LOW |

### HomeFooter.tsx
| Element | File Path | Fixed Value | Scaling Blocker | Priority |
|---------|-----------|-------------|-----------------|----------|
| "سوق سوريا" subtitle | `HomeSections/HomeFooter.tsx` L61 | `fontSize: "10px"` | Hardcoded px | MEDIUM |
| Payment method badges | L114 | `fontSize: "10px"` | Hardcoded px | LOW |
| Footer legal links | L120-122 | `fontSize: "12px"` | Hardcoded px | LOW |
| Footer nav links | L84 | `fontSize: "0.8125rem"` | In rem — scales ✓ | PASS |

### JoinSection.tsx
| Element | File Path | Fixed Value | Scaling Blocker | Priority |
|---------|-----------|-------------|-----------------|----------|
| "Open Your Store" badge | `HomeSections/JoinSection.tsx` L34 | `fontSize: "12px"` | Hardcoded px | MEDIUM |
| Section h2 | L36 | `clamp(24px, 3.5vw, 42px)` | Uses vw — scales ✓ | PASS |

### NewArrivals.tsx
| Element | File Path | Fixed Value | Scaling Blocker | Priority |
|---------|-----------|-------------|-----------------|----------|
| "New since X days" badge | `HomeSections/NewArrivals.tsx` L89 | `fontSize: "12px"` | Hardcoded px | MEDIUM |
| Category eyebrow label | L94 | `fontSize: "12px"` | Hardcoded px | LOW |
| Product name h3 | L95 | `fontSize: "1.75rem"` | In rem — scales ✓ | PASS |

### Other HomeSections
| Component | Element | Fixed Value | Status |
|-----------|---------|-------------|--------|
| PopularCategories | section heading | Uses `clamp()` | PASS |
| TrustedStores | store cards, titles | Tailwind rem utilities | PASS |
| TrendingProducts | TrendingCard titles | `fontSize: "1rem"` rem | PASS |
| TrendingProducts | TrendingCard prices | `fontSize: "1.25rem"` rem | PASS |
| FeaturedDeals | deal cards | Tailwind rem utilities | PASS |

---

## SECTION 3 — PRODUCT GRID (pc-* system)

| Tier | Element | Current | Blocker | Priority |
|------|---------|---------|---------|----------|
| Base (<640px) | pc-title | `10px` fixed | Absolute floor for tiny cards — acceptable | LOW |
| Base (<640px) | pc-price-main | `12px` fixed | Absolute floor — acceptable | LOW |
| Base (<640px) | pc-cart-btn | `9px` fixed | Absolute floor — acceptable | LOW |
| 640px tier | pc-title | `12px` fixed | Doesn't scale at large desktops | HIGH |
| 640px tier | pc-price-main | `14px` fixed | Doesn't scale | HIGH |
| 640px tier | pc-cart-btn | `10px` fixed | Doesn't scale | MEDIUM |
| 640px tier | pc-rating-text | `10px` fixed | Doesn't scale | MEDIUM |
| 1024px tier | pc-title | `13px` fixed | Doesn't scale at 1920px | HIGH |
| 1024px tier | pc-price-main | `15px` fixed | Doesn't scale | HIGH |
| 1024px tier | pc-cart-btn | `11px` fixed | Doesn't scale | MEDIUM |
| 1536px tier | pc-title | `14px` fixed | At 1920px should be ~16px | HIGH |
| 1536px tier | pc-price-main | `16px` fixed | At 1920px should be ~18px | HIGH |

---

## SECTION 4 — NAVIGATION (Navbar)

| Element | Fixed Value | Status |
|---------|-------------|--------|
| Navbar height | `--navbar-height: 3.75rem/4rem` CSS vars (rem) | PASS |
| Logo text "SYANO" | Tailwind `text-lg` (rem) | PASS |
| Nav links | Tailwind `text-sm` (rem) | PASS |
| Search bar | Tailwind rem utilities | PASS |
| Icon sizes | `w-5 h-5` rem | PASS |
| Badge counters | `text-[10px]` fixed px | REMAINING |

---

## SECTION 5 — PRODUCT DETAIL PAGE

| Element | Fixed Value | Scaling Blocker | Priority |
|---------|-------------|-----------------|----------|
| Product title | `text-2xl sm:text-3xl` Tailwind rem | PASS | — |
| Price display | `text-3xl` Tailwind rem | PASS | — |
| Description text | `text-sm` / `text-base` rem | PASS | — |
| Variant option labels | `text-sm` rem | PASS | — |
| Add to cart button | Tailwind utilities | PASS | — |
| Review stars | Icon sizes in rem | PASS | — |
| Thumbnail images | `w-16 h-16` rem | PASS | — |

---

## SECTION 6 — PAGES WITH REMAINING BLOCKERS

### Products Index (`products/index.tsx`)
| Element | Fixed Value | Priority |
|---------|-------------|----------|
| Filter label text | `text-[11px]` | MEDIUM |
| Category chip text | `text-xs` (rem) | PASS |
| Sort dropdown text | `text-sm` (rem) | PASS |

### HeroBanner.tsx
| Element | Fixed Value | Priority |
|---------|-------------|----------|
| Badge text | `text-[10px]`, `text-[11px]` | MEDIUM |
| Rating text | `text-[10px]` | LOW |
| "View all" link | `text-[11px]` | LOW |

### HeroProductMosaic.tsx
| Element | Fixed Value | Priority |
|---------|-------------|----------|
| Category label | `text-[11px]` | LOW |
| Discount badge | `text-[10px]` | LOW |
| Product name | `text-[11px]` | LOW |

### Footer.tsx (main footer, non-home)
| Element | Fixed Value | Priority |
|---------|-------------|----------|
| Section labels | `text-[11px]` | MEDIUM |
| Copyright text | `text-[11px]` | LOW |
| Link text | `text-[11px]` | LOW |

### AdminLayout.tsx
| Element | Fixed Value | Priority |
|---------|-------------|----------|
| Sidebar labels | `text-[10px]` | LOW (admin internal tool) |
| Badge counts | `text-[10px]` | LOW |

---

## SECTION 7 — ARBITRARY TAILWIND PX VALUES (Global Scan)

| Pattern | Count | Impact | Priority |
|---------|-------|--------|----------|
| `text-[10px]` | ~12 occurrences | Small labels/badges | LOW-MEDIUM |
| `text-[11px]` | ~18 occurrences | Footer, banners, badges | MEDIUM |
| `text-[18px]` / `text-[20px]` | ~3 occurrences | Headings (some have clamp) | LOW |
| `w-[Xpx]` / `h-[Xpx]` | ~25 (mostly decorative blurs) | Decorative elements | LOW |
| `gap-[Xpx]` | ~2 | Minor spacing | LOW |

---

## SECTION 8 — SYSTEM-WIDE PASSES ✅

The following systems already scale correctly:
- All Tailwind spacing utilities (`p-4`, `gap-2`, `m-6`, etc.) — rem-based ✓
- All `text-sm/base/lg/xl/2xl` Tailwind classes — rem-based ✓
- Container max-widths (`max-w-[1400px]`) — intentional design cap ✓
- CSS custom property vars (`--navbar-height`) — rem-based ✓
- All heading utilities (`.heading-hero`, `.heading-section`) — use `clamp()` ✓
- Grid gaps in product-grid/store-grid/category-grid — rem-based ✓
- Card border-radius — `rounded-*` Tailwind (rem) ✓
- Button sizes — Tailwind utilities (rem) ✓
- Image aspect ratios — `aspect-square`, `object-cover` — scales ✓
- RTL/LTR — preserved (logical properties `start/end`) ✓
- Theme system — preserved (CSS vars) ✓
- i18n system — preserved ✓
- Currency system — preserved ✓

---

## SUMMARY TABLE

| Priority | Count | Status |
|----------|-------|--------|
| CRITICAL | 1 | ✅ Fixed (root font-size) |
| HIGH | 13 | ✅ Fixed (pc-* rem conversion) |
| MEDIUM | 12 | ✅ Fixed (homepage component inline styles) + 6 remaining |
| LOW | 30+ | Partially fixed; decorative elements acceptable |

---

## VIEWPORT SCALE FORMULA

```
html { font-size: clamp(10px, calc(4px + 0.75vw), 18px); }
```

| Viewport | Root Font | % of max | Visible diff vs 1920px |
|----------|-----------|----------|------------------------|
| 320px    | 10px      | 55.6%    | floor                  |
| 480px    | 10px      | 55.6%    | floor                  |
| 640px    | 10px      | 55.6%    | floor                  |
| 800px    | 10px      | 55.6%    | floor (breakeven)      |
| 1024px   | 11.68px   | 64.9%    | clearly smaller        |
| 1280px   | 13.6px    | 75.6%    | noticeably smaller     |
| 1440px   | 14.8px    | 82.2%    | moderately smaller     |
| 1600px   | 16px      | 88.9%    | slightly smaller       |
| 1920px   | 18px      | 100%     | reference size         |
| 2560px   | 18px      | 100%     | cap                    |
