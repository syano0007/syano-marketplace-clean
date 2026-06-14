# VIEWPORT SCALE FIXES — SYANO Marketplace
**Date:** June 14, 2026  
**Architecture:** Viewport Scale V1 — Canvas-like proportional scaling  
**Session:** Comprehensive implementation of all HIGH/CRITICAL/MEDIUM priority fixes

---

## FIX 1 — ROOT FONT-SIZE ENGINE (CRITICAL)

**File:** `artifacts/marketplace/src/index.css` — Line 296

**Before:**
```css
font-size: clamp(13px, calc(8px + 0.5vw), 16px);
```

**After:**
```css
font-size: clamp(10px, calc(4px + 0.75vw), 18px);
```

**Reason:**  
Old formula had only 11% difference between 1920px (16px) and 1280px (14.4px) — not visually noticeable. New formula achieves 24% difference: 1920px=18px vs 1280px=13.6px. This is the single most impactful change — every `rem` unit across the entire platform now scales more aggressively. The range starts at 10px (floor at ≤800px) to prevent unreadable text on mobile, and caps at 18px for ultrawide screens.

**Impact:** ALL rem-based values throughout the platform — Tailwind spacing, text sizes, heights, gaps, radii — scale with this single rule.

---

## FIX 2 — CSS CUSTOM PROPERTIES FOR SMALL LABELS (NEW)

**File:** `artifacts/marketplace/src/index.css` — After `--navbar-height` block

**Before:** None — small label text was using hardcoded `px` inline styles

**After:**
```css
:root {
  --font-2xs:   clamp(9px, 0.5625rem, 10px);  /* 9-10px tiny labels */
  --font-xs:    clamp(10px, 0.6875rem, 12px);  /* 10-12px small labels */
  --font-xs-up: clamp(11px, 0.75rem, 14px);   /* 11-14px sub-labels */
}
```

**Reason:**  
Inline styles using `fontSize: "10px"` never scaled regardless of viewport. These CSS custom properties clamp to a readable floor at mobile (9-11px minimum) while scaling up proportionally with the root font at desktop. Used by badge text, floating card labels, footer metadata.

---

## FIX 3 — PC-* CARD OVERRIDES: 640px TIER (HIGH)

**File:** `artifacts/marketplace/src/index.css` — `@media (min-width: 640px)` block

**Before:**
```css
.product-grid .pc-title       { font-size: 12px !important; ... }
.product-grid .pc-price-main  { font-size: 14px !important; }
.product-grid .pc-rating-text { font-size: 10px !important; }
.product-grid .pc-cart-btn    { font-size: 10px !important; ... }
```

**After:**
```css
.product-grid .pc-title       { font-size: 0.75rem !important; ... }
.product-grid .pc-price-main  { font-size: 0.875rem !important; }
.product-grid .pc-rating-text { font-size: 0.625rem !important; }
.product-grid .pc-cart-btn    { font-size: 0.625rem !important; ... }
```

**Reason:**  
Fixed px values meant card text never scaled with viewport. At 1920px (18px root), `0.75rem` = 13.5px vs the previous capped 12px — product titles now naturally grow on large screens. The base tier (<640px) deliberately keeps px values as absolute minimum readable floors for tiny card contexts.

---

## FIX 4 — PC-* CARD OVERRIDES: 1024px TIER (HIGH)

**File:** `artifacts/marketplace/src/index.css` — `@media (min-width: 1024px)` block

**Before:**
```css
.product-grid .pc-title       { font-size: 13px !important; ... }
.product-grid .pc-price-main  { font-size: 15px !important; }
.product-grid .pc-rating-text { font-size: 11px !important; }
.product-grid .pc-cart-btn    { font-size: 11px !important; ... }
```

**After:**
```css
.product-grid .pc-title       { font-size: 0.8125rem !important; ... }
.product-grid .pc-price-main  { font-size: 0.9375rem !important; }
.product-grid .pc-rating-text { font-size: 0.6875rem !important; }
.product-grid .pc-cart-btn    { font-size: 0.6875rem !important; ... }
```

**Reason:**  
5-col grid cards at 1920px now scale to natural reading sizes: title=14.6px (at 18px root), price=16.9px. Previously locked at 13px/15px regardless of viewport.

---

## FIX 5 — PC-* CARD OVERRIDES: 1536px TIER (HIGH)

**File:** `artifacts/marketplace/src/index.css` — `@media (min-width: 1536px)` block

**Before:**
```css
.product-grid .pc-title       { font-size: 14px !important; ... }
.product-grid .pc-price-main  { font-size: 16px !important; }
.product-grid .pc-rating-text { font-size: 12px !important; }
.product-grid .pc-cart-btn    { font-size: 12px !important; ... }
```

**After:**
```css
.product-grid .pc-title       { font-size: 0.875rem !important; ... }
.product-grid .pc-price-main  { font-size: 1rem !important; }
.product-grid .pc-rating-text { font-size: 0.75rem !important; }
.product-grid .pc-cart-btn    { font-size: 0.75rem !important; ... }
```

**Reason:**  
6-col grid at 1920px (18px root): title becomes 15.75px, price becomes 18px (full natural reading size). This is the tier where large-screen users benefit most from canvas scaling — cards look appropriately sized rather than miniature.

---

## FIX 6 — HEROSECTION FLOATING CARD LABELS (MEDIUM)

**File:** `artifacts/marketplace/src/components/HomeSections/HeroSection.tsx`

**Before:**
```jsx
<span style={{ fontWeight: 500, fontSize: "12px", ... }}>
<p style={{ fontWeight: 600, fontSize: "11px", ... }}>
<p style={{ fontWeight: 800, fontSize: "12px" }}>
<p style={{ fontWeight: 500, fontSize: "10px" }}>
```

**After:**
```jsx
<span style={{ fontWeight: 500, fontSize: "var(--font-xs-up)", ... }}>
<p style={{ fontWeight: 600, fontSize: "var(--font-xs)", ... }}>
<p style={{ fontWeight: 800, fontSize: "var(--font-xs-up)" }}>
<p style={{ fontWeight: 500, fontSize: "var(--font-2xs)" }}>
```

**Reason:**  
Hero floating product cards are a premium visual element. Their text labels (product name, price, category, availability) now scale with the viewport — slightly bigger on 1920px+ screens, maintaining their clamped minimums on mobile.

**Elements converted:** 7 inline fontSize values across HeroSection.tsx

---

## FIX 7 — HOMEFOOTER SMALL LABELS (MEDIUM)

**File:** `artifacts/marketplace/src/components/HomeSections/HomeFooter.tsx`

**Before:**
```jsx
<div style={{ fontSize: "10px" }}>سوق سوريا</div>
<div style={{ fontSize: "10px" }}>VISA</div>
<Link style={{ fontSize: "12px" }}>Privacy</Link>
```

**After:**
```jsx
<div style={{ fontSize: "var(--font-2xs)" }}>سوق سوريا</div>
<div style={{ fontSize: "var(--font-2xs)" }}>VISA</div>
<Link style={{ fontSize: "var(--font-xs-up)" }}>Privacy</Link>
```

**Reason:**  
Footer metadata text now respects the viewport scale system. On large screens these labels appear proportionally larger rather than staying at their mobile minimum.

---

## FIX 8 — JOINSECTION BADGE (MEDIUM)

**File:** `artifacts/marketplace/src/components/HomeSections/JoinSection.tsx`

**Before:**
```jsx
<span style={{ fontSize: "12px", ... }} className="text-emerald-400 uppercase">
```

**After:**
```jsx
<span style={{ fontSize: "var(--font-xs-up)", ... }} className="text-emerald-400 uppercase">
```

---

## FIX 9 — NEWARRIVALS BADGES (MEDIUM)

**File:** `artifacts/marketplace/src/components/HomeSections/NewArrivals.tsx`

**Before:**
```jsx
<div style={{ fontSize: "12px" }}>New since X days</div>
<p style={{ fontSize: "12px", letterSpacing: "0.06em" }}>category</p>
```

**After:**
```jsx
<div style={{ fontSize: "var(--font-xs-up)" }}>New since X days</div>
<p style={{ fontSize: "var(--font-xs-up)", letterSpacing: "0.06em" }}>category</p>
```

---

## UNCHANGED (INTENTIONAL)

| Element | Value | Reason |
|---------|-------|--------|
| pc-base tier (all) | px values | Absolute readability floors for 140-175px cards |
| pc-price-orig (all) | `9px`/`10px` | Strike-through supplementary text; too small to scale further |
| Decorative blur orbs | `w-[700px] h-[700px]` | Visual-only blur; scaling doesn't affect UX |
| Container `max-w-[1400px]` | Fixed max | Intentional design cap; content shouldn't stretch beyond this |
| Admin/seller `text-[10px]` | px | Internal tools; different priority from consumer UX |
| HeroV4 hero headline | `clamp(52px,6.5vw,94px)` | Already uses vw for aggressive scaling |

---

## CUMULATIVE EFFECT AT KEY VIEWPORTS

### 1280px (common laptop)
- Root: 13.6px (was 14.4px — 6% smaller, cards slightly more compact)
- Product title in 6-col: 0.875rem × 13.6px = **11.9px** (was 14px fixed — more canvas-like)
- Product price in 6-col: 1rem × 13.6px = **13.6px** (was 16px fixed)

### 1920px (large desktop)
- Root: 18px (was 16px — 12.5% bigger)
- Product title in 6-col: 0.875rem × 18px = **15.75px** (was 14px fixed — significantly better)
- Product price in 6-col: 1rem × 18px = **18px** (was 16px fixed)
- Hero badge text: var(--font-xs-up) = **14px** (was 12px fixed)
- Floating card price: var(--font-xs-up) = **14px** (was 12px fixed)

### 1280px vs 1920px visible difference
- Before: 11% font size difference — barely noticeable
- After: **24% font size difference** — clearly visible zoom effect ✓
