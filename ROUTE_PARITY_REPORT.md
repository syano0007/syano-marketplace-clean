# Route Parity Report — Web vs Mobile
**Last updated:** June 17, 2026

---

## Web Routes (Source of Truth)

### Public / Auth
| Route | Page | Mobile Equivalent | Status |
|---|---|---|---|
| `/login` | Login | `/(auth)/login` | ✅ Fixed Phase M0.5 |
| `/register` | Register | `/(auth)/register` | ✅ Fixed Phase M0.5 |
| `/forgot-password` | Forgot Password | `/(auth)/forgot-password` | ✅ |
| `/verify` | Email verify (disabled) | — | N/A (VERIFICATION_ENABLED=false) |

### Marketplace / Shopping
| Route | Page | Mobile Equivalent | Status |
|---|---|---|---|
| `/` | Homepage V7 (hero, deals, categories, trending) | `/(tabs)` index | ⚠️ PARTIAL |
| `/shop` | Shop/search with FTS | `/(tabs)` shop view | ⚠️ PARTIAL |
| `/products/:id` | Product detail | `/product/[id]` | ⚠️ PARTIAL |
| `/store/:slug` | Store page | `/store/[id]` or `/store/[slug]` | ⚠️ PARTIAL |
| `/stores` | Store directory | ❌ MISSING | GAP |
| `/categories` | Category browse | ❌ MISSING (inline on home) | GAP |
| `/search` | Search results | Inline in shop tab | ⚠️ |

### Account / Customer
| Route | Page | Mobile Equivalent | Status |
|---|---|---|---|
| `/cart` | Cart | `/(tabs)/cart` | ✅ |
| `/checkout` | Checkout | `/checkout` | ✅ |
| `/order-success` | Order success | `/order-success` | ✅ |
| `/orders` | Order list | `/(tabs)/orders` | ✅ |
| `/orders/:id` | Order detail | `/order/[id]` | ✅ |
| `/wishlist` | Wishlist | `/(tabs)/wishlist` | ✅ |
| `/messages` | Messages | `/(tabs)/messages` | ✅ |
| `/profile` | Profile settings | `/(tabs)/profile` | ⚠️ PARTIAL |
| `/support` | AI customer support | ❌ MISSING | GAP |

### Seller Dashboard
| Route | Page | Mobile Equivalent | Status |
|---|---|---|---|
| `/seller/dashboard` | Seller overview | `/(tabs)` (isSeller view) | ⚠️ PARTIAL |
| `/seller/products` | Product management | ❌ MISSING | GAP |
| `/seller/orders` | Seller orders | `/(tabs)/orders` (isSeller filter) | ⚠️ PARTIAL |
| `/seller/analytics` | Analytics charts | ❌ MISSING | GAP |
| `/seller/messages` | Seller messages | `/(tabs)/messages` | ✅ |
| `/seller/settings` | Store settings | ❌ MISSING | GAP |
| `/seller/reviews` | Review management | ❌ MISSING | GAP |
| `/seller/apply` | Seller application | ❌ MISSING | GAP |

### Courier Dashboard
| Route | Page | Mobile Equivalent | Status |
|---|---|---|---|
| `/courier/dashboard` | Courier overview | ❌ MISSING | GAP |
| `/courier/application-status` | Courier onboarding | ❌ MISSING | GAP |

### Admin (Out of scope for mobile)
| Route | Page | Mobile | Status |
|---|---|---|---|
| `/admin/*` | Admin dashboard | ❌ MISSING | OUT OF SCOPE |

---

## Mobile Routes (Expo Router)

### Tabs
| Route | Screen | Web Equivalent | Notes |
|---|---|---|---|
| `/(tabs)` | Home + shop (dual view) | `/` + `/shop` | Dual role view |
| `/(tabs)/cart` | Cart | `/cart` | ✅ |
| `/(tabs)/wishlist` | Wishlist | `/wishlist` | ✅ |
| `/(tabs)/orders` | Orders (customer + seller) | `/orders` + `/seller/orders` | Combined |
| `/(tabs)/messages` | Messages | `/messages` | ✅ |
| `/(tabs)/profile` | Profile | `/profile` | ⚠️ |

### Auth
| Route | Screen | Web Equivalent |
|---|---|---|
| `/(auth)/login` | Login | `/login` |
| `/(auth)/register` | Register | `/register` |
| `/(auth)/forgot-password` | Forgot Password | `/forgot-password` |

### Detail Pages
| Route | Screen | Web Equivalent |
|---|---|---|
| `/product/[id]` | Product detail | `/products/:id` |
| `/store/[id]` | Store page (by ID) | `/store/:slug` |
| `/order/[id]` | Order detail | `/orders/:id` |
| `/checkout` | Checkout | `/checkout` |
| `/order-success` | Order success | `/order-success` |

---

## Gap Summary

### Routes on web with NO mobile equivalent (P1/P2)
1. `/stores` — Store directory
2. `/support` — AI customer service
3. `/seller/products` — Product management
4. `/seller/analytics` — Analytics
5. `/seller/settings` — Store settings
6. `/seller/apply` — Seller application
7. `/courier/dashboard` — Courier dashboard
8. `/categories` — Full category browse

### Mobile has but web doesn't
- None — mobile is a strict subset of web

---

## Phase Completion Targets

| Phase | Scope | Status |
|---|---|---|
| M0.5 — Auth Parity | Login + Register | ✅ COMPLETE |
| M0.6 — Profile Settings | Language/currency/theme in profile | PENDING |
| M0.7 — Product Detail | Wishlist heart on detail, share | PENDING |
| M0.8 — Checkout | Promo code support | PENDING |
| M0.9 — Orders | Review after delivery, invoice download | PENDING |
| M0.10 — Store | Store reviews tab, contact/policies | PENDING |
| M0.11 — Home | Trending, recently viewed, hero carousel | PENDING |
| M0.12 — Seller Mobile | Seller product create/edit on mobile | PENDING |
| M0.13 — Guest Cart | Unauthenticated cart on mobile | PENDING |
