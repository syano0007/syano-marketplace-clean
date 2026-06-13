---
name: Hero Banner System V3 (fully dynamic)
description: Architecture of HeroV4.tsx — the fully dynamic hero banner with product mosaic default, admin BannerCarousel, TrustStrip, swipe/keyboard/analytics. No static image.
---

# Hero Banner System V3 (June 2026)

## Key Rule
The hero has **NO static image**. It is built entirely from React CSS + text + Pexels product images. If anyone proposes adding a static PNG as the hero background, that is a regression — refer to this file.

## Component File
`artifacts/marketplace/src/components/HeroV4.tsx`

## Architecture

### BrandStatement (default — 0 API banners)
- Dark luxury CSS background: `bg-gradient-to-br from-zinc-900/60 via-black to-zinc-950`
- Vertical stripe pattern: `repeating-linear-gradient(90deg, ...)` at 0.045 opacity, 58px repeat
- Green ambient glow + warm amber glow blobs (radial-gradient)
- **Product mosaic** (md+): 6 Pexels images scattered as absolute positioned `rounded-2xl` cards
  - Visual area: `left: 0, width: 55%` in RTL; `right: 0, width: 55%` in LTR
  - LTR mirror: outer ProductMosaic div `scaleX(-1)`, each image counter `scaleX(-1)` — keeps image content un-mirrored
  - Per-image CSS `filter: brightness() contrast() saturate()` to blend light-bg products with dark hero
- Directional gradient blend (visual side → text side) for text readability
- Text column (`right-0 w-[52%]` RTL / `left-0 w-[52%]` LTR): badge → headline → subtitle → CTA button
- Container height: `h-[310px] sm:h-[370px] md:h-[450px] lg:h-[510px]`

### BannerCarousel (activates when GET /api/banners returns ≥1)
- Admin banner image as background (full cover) + directional gradient using banner's `backgroundColor`
- Text: `titleAr/En`, `subtitleAr/En`, `ctaLabelAr/En`, `ctaUrl`, `textColor`
- Secondary CTA: `ctaLabelArSecondary/EnSecondary` + `ctaUrlSecondary`
- Autoplay 6 000 ms, pauses on mouseenter
- Framer Motion AnimatePresence fade (0.55 s in / 0.38 s out)
- Prev/Next arrows (`start-3`/`end-3`, RTL-aware chevron)
- Dot/pill indicators (pill width 24px = active, 3.5px dot = inactive)
- **Swipe**: touchstart/touchend, 48px threshold, RTL-aware (diff > 0 = goPrev in RTL / goNext in LTR)
- **Keyboard**: ArrowLeft/Right on :hover, RTL-aware
- **Impression tracking**: `POST ${BASE}api/banners/:id/impression` on mount + slide change
- **Click tracking**: `POST ${BASE}api/banners/:id/click` on CTA onClick

### TrustStrip (always shown below hero)
- 4 items: Headphones/دعم سريع, ShieldCheck/تاجر موثوق, CreditCard/دفع آمن, Truck/توصيل سريع
- `grid-cols-2 sm:grid-cols-4`, emerald icon squares, bilingual (lang === "ar" ternary)
- NOT duplicated in any other home.tsx section

### Product Mosaic Images (Pexels IDs)
| Role | Pexels ID | Notes |
|---|---|---|
| Headphones (dominant) | 1649771 | Dark bg; filter brightness(0.92) |
| Watch | 1034069 | Dark studio bg; filter brightness(0.9) |
| Perfume | 965989 | filter brightness(0.82) saturate(0.9) |
| Camera | 243757 | Dark atmospheric; filter brightness(0.88) |
| Sneakers | 2529148 | Light bg — filter brightness(0.72) to blend |
| Phone | 1092644 | Dark bg; filter brightness(0.9) |

## API Routes (hero-banners.ts)
- `GET /banners` — public; active + scheduled only
- `POST /banners/:id/impression` — fire-and-forget; always 200
- `POST /banners/:id/click` — fire-and-forget; always 200
- `GET/POST/PATCH/DELETE /admin/banners` — admin CRUD
- `GET /admin/banners/analytics` — impressions/clicks/CTR

## Admin Page
`artifacts/marketplace/src/pages/admin/hero-banners.tsx` — route `/admin/hero-banners`
Full CRUD, drag-to-reorder, analytics tab.

## Recovery Check
Module 21 check `home.tsx uses HeroBanner` is a **known false negative** — HeroV4.tsx contains its own carousel logic; HeroBanner.tsx is no longer used directly. Recovery score 95/100 is healthy.

**Why ProductMosaic uses per-image filter (not global):**
Different stock photos have wildly different ambient lighting. A global brightness would either crush the dark-bg headphones or fail to dim the light-bg sneakers. Per-image filters are the only way to make all 6 products feel like a unified dark scene.
