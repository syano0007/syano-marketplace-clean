# Mobile Parity Status — Phase M0.5–M0.13
**Last updated:** June 17, 2026
**Principle:** Web is source of truth. Every screen must match web functionality, validation, error handling, and i18n.

---

## Summary

| Category | Screens | Status |
|---|---|---|
| Auth | Login, Register, Forgot Password | ✅ FIXED (Phase M0.5) |
| Shopping | Home/Shop, Product Detail | ⚠️ PARTIAL |
| Transactions | Cart, Checkout, Order Success | ⚠️ PARTIAL |
| Account | Orders, Wishlist, Messages, Profile | ⚠️ PARTIAL |
| Store | Store Page | ⚠️ PARTIAL |

**Overall mobile parity estimate:** ~40% (was ~28%)

---

## Auth Screens

### Login — ✅ FIXED
| Feature | Web | Mobile (before) | Mobile (after) |
|---|---|---|---|
| Identifier field (email or phone) | ✅ | ❌ email only | ✅ Fixed |
| Role selector | ❌ (none) | ❌ had customer/seller selector | ✅ Removed |
| Email/phone validation | ✅ | ❌ none | ✅ Fixed |
| Error: USER_NOT_FOUND | ✅ `no_account_found` | ❌ generic | ✅ Fixed |
| Error: INVALID_PASSWORD | ✅ `incorrect_password` | ❌ generic | ✅ Fixed |
| Error: ACCOUNT_SUSPENDED | ✅ Alert dialog | ❌ missing | ✅ Fixed |
| Error: 429 rate limiting | ✅ with countdown seconds | ❌ missing | ✅ Fixed |
| SYANO "S" logo square | ✅ emerald gradient | ❌ bag icon circle | ✅ Fixed (solid emerald) |
| All strings i18n'd | ✅ | ⚠️ partial | ✅ Fixed |
| Forgot password link | ✅ | ✅ | ✅ |
| Navigate to /(tabs) on success | ✅ | ✅ | ✅ |

### Register — ✅ FIXED
| Feature | Web | Mobile (before) | Mobile (after) |
|---|---|---|---|
| Identifier field (email or phone) | ✅ | ❌ email only | ✅ Fixed |
| Role selector | ❌ (none) | ❌ had customer/seller selector | ✅ Removed |
| All strings i18n'd | ✅ | ❌ all hardcoded English | ✅ Fixed |
| Password min 8 chars | ✅ | ❌ was 6 chars | ✅ Fixed |
| Error: email_taken | ✅ | ❌ generic text | ✅ Fixed |
| Error: phone_taken | ✅ | ❌ missing | ✅ Fixed |
| Error: 429 rate limiting | ✅ | ❌ missing | ✅ Fixed |
| Name min 2 chars validation | ✅ | ❌ missing | ✅ Fixed |
| SYANO "S" logo square | ✅ | ❌ bag icon circle | ✅ Fixed |
| Password hint shown | ✅ | ❌ missing | ✅ Fixed (below field) |

### Forgot Password — ✅ MATCHES WEB
- 3-step flow: email → 6-digit code → new password
- Same validation, same error messages
- i18n complete for both en/ar

---

## Shopping Screens

### Home / Shop Tab (`/(tabs)/index.tsx`) — ⚠️ PARTIAL
| Feature | Web | Mobile | Gap |
|---|---|---|---|
| Product grid with categories | ✅ | ✅ | None |
| Search bar | ✅ | ✅ | None |
| Sort by price/newest | ✅ | ✅ | None |
| Hero banner carousel | ✅ | ❌ missing | GAP |
| Hot deals / featured section | ✅ | ✅ | None |
| New arrivals section | ✅ | ✅ | None |
| Trending products | ✅ | ❌ missing | GAP |
| Recently viewed | ✅ | ❌ missing | GAP |
| Category icon grid | ✅ | ✅ (text chips) | Minor |

### Product Detail (`/product/[id].tsx`) — ⚠️ PARTIAL
| Feature | Web | Mobile | Gap |
|---|---|---|---|
| Image gallery | ✅ scrollable | ✅ scrollable | None |
| Variant selector (size/color) | ✅ | ✅ | None |
| Reviews section | ✅ | ✅ | None |
| Related products | ✅ | ✅ | None |
| Add to cart (with variants) | ✅ | ✅ | None |
| Message seller button | ✅ | ✅ | None |
| Store trust badge | ✅ | ✅ | None |
| Wishlist heart button | ✅ | ❌ missing on detail | GAP |
| Share button | ✅ | ❌ missing | GAP |

---

## Transaction Screens

### Cart (`/(tabs)/cart.tsx`) — ⚠️ PARTIAL
| Feature | Web | Mobile | Gap |
|---|---|---|---|
| Cart item list | ✅ | ✅ | None |
| Quantity update | ✅ | ✅ | None |
| Remove item | ✅ | ✅ | None |
| Clear cart | ✅ | ✅ | None |
| Order summary (subtotal/discount/total) | ✅ | ✅ | None |
| Delivery zone picker in cart | ❌ (in checkout) | ❌ | None |
| Guest cart (unauthenticated) | ✅ | ❌ missing | GAP |

### Checkout (`/checkout.tsx`) — ⚠️ PARTIAL
| Feature | Web | Mobile | Gap |
|---|---|---|---|
| Delivery info form | ✅ | ✅ | None |
| Delivery zone picker | ✅ | ✅ | None |
| Order review + COD | ✅ | ✅ | None |
| Form validation | ✅ | ✅ | None |
| Promo code / coupon | ✅ | ❌ missing | GAP |

### Order Success (`/order-success.tsx`) — ✅ MATCHES WEB
- Confirmation screen with order ID, total, COD note
- Track order + continue shopping CTAs
- i18n complete

---

## Account Screens

### Orders (`/(tabs)/orders.tsx`) — ⚠️ PARTIAL
| Feature | Web | Mobile | Gap |
|---|---|---|---|
| Order list with status filter | ✅ | ✅ | None |
| Order detail page | ✅ | ✅ | None |
| Seller: advance order status | ✅ | ✅ | None |
| Customer: cancel order | ✅ | ✅ | None |
| Courier info on order | ✅ | ✅ | None |
| Download invoice | ✅ | ❌ missing | GAP |
| Write review after delivery | ✅ | ❌ missing | GAP |

### Wishlist (`/(tabs)/wishlist.tsx`) — ✅ MATCHES WEB (Phase M1)
- Auth-gated, heart button in product cards
- Add wishlist item to cart
- Empty state with browse CTA
- i18n complete

### Messages (`/(tabs)/messages.tsx`) — ✅ MATCHES WEB
- Conversation list + in-thread view
- Image attachments, mute/archive, typing indicators
- Unread badge on tab
- i18n complete

### Profile (`/(tabs)/profile.tsx`) — ⚠️ PARTIAL
| Feature | Web | Mobile | Gap |
|---|---|---|---|
| User info + avatar | ✅ | ✅ | None |
| Seller stats dashboard | ✅ | ✅ | None |
| Customer stats | ✅ | ✅ | None |
| Followed stores list | ✅ | ✅ | None |
| Quick links (orders/cart/messages) | ✅ | ✅ | None |
| Language switcher | ✅ | ❌ missing | GAP |
| Currency switcher | ✅ | ❌ missing | GAP |
| Theme toggle (light/dark) | ✅ | ✅ (in settings) | None |
| Account deletion | ✅ | ❌ missing | GAP |

---

## Store Screen

### Store Page (`/store/[id].tsx` + `/store/[slug].tsx`) — ⚠️ PARTIAL
| Feature | Web | Mobile | Gap |
|---|---|---|---|
| Store header (logo/name/tagline) | ✅ | ✅ | None |
| Follow / Unfollow | ✅ | ✅ | None |
| Products tab | ✅ | ✅ | None |
| About tab | ✅ | ✅ | None |
| Reviews tab | ✅ | ❌ missing | GAP |
| Contact / Policies tab | ✅ | ❌ missing | GAP |
| Trust badge | ✅ | ✅ | None |
| Verified seller indicator | ✅ | ✅ | None |

---

## i18n Coverage (Mobile)

| Module | Keys | en ✅ | ar ✅ |
|---|---|---|---|
| auth | 45+ | ✅ | ✅ |
| cart | 15 | ✅ | ✅ |
| checkout | 25 | ✅ | ✅ |
| orders | 30+ | ✅ | ✅ |
| messages | 22 | ✅ | ✅ |
| profile | 16 | ✅ | ✅ |
| product | 12 | ✅ | ✅ |
| wishlist | 5 | ✅ | ✅ |
| shop | 6 | ✅ | ✅ |
| home | 6 | ✅ | ✅ |
| store | 11 | ✅ | ✅ |
| nav | 7 | ✅ | ✅ |
| trust | 8 | ✅ | ✅ |

---

## Priority Gap List (Next Phases)

### P1 — High Impact
1. Guest cart on mobile (unauthenticated browsing)
2. Wishlist heart on product detail page
3. Language + currency switcher in profile
4. Promo code / coupon at checkout

### P2 — Medium Impact
5. Store reviews tab
6. Write review after delivery
7. Recently viewed section on home
8. Trending products section on home

### P3 — Lower Impact
9. Download invoice from order detail
10. Share button on product detail
11. Store contact / policies tab
12. Account deletion
13. Hero banner carousel on home
