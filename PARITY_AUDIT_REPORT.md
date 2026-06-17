# SYANO Web ↔ Mobile Parity Audit Report
**Date:** June 17, 2026  
**Phase:** A — Home Page, Header, Search, Navigation Foundation

---

## Home Page Section Comparison

| Section | Web | Mobile (Before) | Mobile (After Phase A) |
|---------|-----|-----------------|------------------------|
| Hero Banner / Brand | ✅ HeroSection (carousel, floating cards, stats) | ❌ Simple text "Discover / SYANO" | ✅ HeroBannerSection (emerald glow, stats bar: 500+ sellers / 10K+ products / 50K+ customers) |
| Popular Categories | ✅ 2x4 image grid, dark overlay, color bars | ❌ Chip scroll only | ✅ 2x4 image grid (8 categories, Unsplash photos, same as web) |
| Featured Deals | ✅ Countdown timer + discount product grid | ❌ Missing | ✅ CountdownTimer + horizontal DealMiniCard scroll (discountPercent > 0 filter) |
| Trusted Stores | ✅ 3 store cards, cover images, verified badge, rating, product count | ❌ Missing | ✅ FeaturedStoresSection (3 static store cards, horizontal scroll) |
| Hot Deals / Best Sellers | ✅ HeroSection includes featured products | ✅ Horizontal MiniProductCard scroll | ✅ Retained |
| Trending Products | ✅ TrendingProducts grid | ✅ Horizontal scroll | ✅ Retained |
| New Arrivals | ✅ NewArrivals grid | ✅ Horizontal scroll | ✅ Retained |
| Join CTA (Seller/Courier) | ✅ JoinSection — two cards with navigation | ❌ Missing | ✅ JoinCTASection (seller + courier cards, routes to /seller-apply and /courier-apply) |
| Footer | ✅ HomeFooter (links, newsletter) | ❌ N/A (mobile has tab bar) | ⏭ Not applicable on mobile |

**Section order (after Phase A):**  
Hero → Hot Deals → Categories Grid → Featured Deals → Trusted Stores → New Arrivals → Trending → Join CTA → All Products

---

## Header Comparison

| Feature | Web | Mobile (Before) | Mobile (After Phase A) |
|---------|-----|-----------------|------------------------|
| Logo / Brand | ✅ SYANO text + logo | ✅ "Discover" + "SYANO" | ✅ Same (unchanged) |
| Search bar | ✅ In navbar with autocomplete | ✅ In home screen header | ✅ Retained |
| Cart badge | ✅ Navbar cart icon with item count | ❌ Only in bottom tab (no count in header) | ✅ Cart icon with count badge added to header |
| Notifications | ✅ Bell icon, click opens notifications | ✅ Bell icon present | ✅ Wired to router.push("/(tabs)/notifications") |
| Messages | ✅ Navbar icon | ⏭ Bottom tab | ⏭ Bottom tab (adequate) |
| Wishlist | ✅ Navbar heart icon | ⏭ Bottom tab | ⏭ Bottom tab (adequate) |

---

## Navigation Comparison

| Feature | Web | Mobile |
|---------|-----|--------|
| Home | Top nav link | Shop tab (index) ✅ |
| Shop / Search | Top nav + search | Shop tab + search bar ✅ |
| Categories | Top nav | Quick Actions button + Category Grid ✅ |
| Stores | Top nav link | Quick Actions button + Stores section ✅ |
| Cart | Navbar cart | Cart tab ✅ |
| Wishlist | Navbar heart | Wishlist tab ✅ |
| Orders | Profile dropdown | Orders tab ✅ |
| Messages | Navbar icon | Messages tab ✅ |
| Notifications | Navbar bell | Notifications tab ✅ |
| Profile | Navbar avatar | Profile tab ✅ |

---

## i18n Additions (Phase A)

28 new keys added to both EN and AR `home.*` namespace:
- `hero_tagline`, `hero_subtitle`
- `stats_sellers`, `stats_products`, `stats_customers`
- `popular_categories`, `categories_see_all`
- `featured_deals`, `deals_ends_in`, `deals_see_all`
- `trusted_stores`, `stores_see_all`, `stores_products`, `stores_verified`
- `join_title`, `join_subtitle`, `join_seller_title`, `join_seller_desc`, `join_seller_cta`
- `join_courier_title`, `join_courier_desc`, `join_courier_cta`

---

## TypeScript Status

- Mobile: **0 errors** (excluding pre-existing TS6305 lib-build errors)
- Expo: Bundled successfully in 320ms

---

## Remaining Parity Gaps (Phase B)

| Gap | Priority |
|-----|----------|
| Search autocomplete category grouping (mobile shows flat list, web shows grouped by type) | Medium |
| Currency-aware price display (mobile hardcodes $, web uses useCurrency() + SYP) | High |
| Product card rating display parity (mobile shows price only, web shows star rating) | Medium |
| Store directory page visual refresh to match web layout | Low |
| Checkout coupon code field (no API yet) | Low |
