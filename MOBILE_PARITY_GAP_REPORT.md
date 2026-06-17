# SYANO — Mobile Parity Gap Report & Migration Roadmap (Phase M0)
Last audited: June 17, 2026

---

## SECTION 7 — MOBILE PARITY MASTER REPORT

| Metric | Count |
|---|---|
| **Total Web Routes** | 75 |
| **Total Mobile Routes** | 15 |
| **Total Web Features** | 164 |
| **Total Mobile Features** | 46 |
| **Fully Matched Features** | 25 |
| **Partially Matched Features** | 9 |
| **Missing Features** | 130 |
| **Overall Parity %** | **28%** |

### Parity by Role

| Role | Parity % |
|---|---|
| Customer (browsing + orders) | ~45% |
| Customer (full account) | ~25% |
| Seller | ~6% |
| Courier | **0%** |
| Admin | **0%** |

### Strongest Areas (≥80%)
- Messaging V2 — **92%** (best system on mobile)
- Orders — **86%**
- Cart — **80%**

### Weakest Areas (0%)
- Courier System — **0%**
- Admin System — **0%**
- Notifications — **0%**
- Wishlist — **0%**
- AI Support — **0%**
- Seller (beyond stats) — **~6%**

---

## SECTION 8 — MIGRATION ROADMAP

---

### Phase M1 — Marketplace Parity

**Goal:** Complete the core shopping experience so a customer can browse and buy with full feature parity.

**Features Included:**
1. Homepage V7 — hero carousel (static, no CMS), featured products section, best sellers, trending, featured stores
2. Product detail — reviews display (list + rating breakdown)
3. Product detail — related products row
4. Product detail — wishlist button (heart toggle)
5. Product detail — full image gallery (swipeable)
6. Categories page — full grid browser
7. Store page — follow/unfollow button
8. Stores directory — browsable store list
9. Search — price range filter
10. Search — on-sale filter
11. Search — NLP intent banner
12. Search — categories tab
13. Search — stores tab
14. Checkout — coupon/promo code input

**Estimated Scope:** Large — 14 features, ~8–12 screens/components
**Dependencies:** None — all APIs already exist

---

### Phase M2 — Customer Systems

**Goal:** Complete the full customer account and engagement layer.

**Features Included:**
1. Customer dashboard (stats, recent orders, recent reviews)
2. Notifications screen (real-time polling + inbox)
3. Notification badge on tab bar
4. Wishlist screen (full list + add/remove)
5. Account settings screen (theme, language, currency)
6. OTP email/phone verification screen (`/verify`)
7. Account suspended screen
8. Guest cart support (pre-auth cart + merge on login)
9. Push notification opt-in (Expo Push + VAPID)
10. Seller application form + status screen
11. Courier application form + status screen

**Estimated Scope:** Large — 11 features, ~6–8 new screens
**Dependencies:** M1 recommended first (UX flow)

---

### Phase M3 — Messaging & AI Support

**Goal:** Close messaging gaps and bring AI support to mobile.

**Features Included:**
1. Order-linked conversation threading (attach order_id to conversation start)
2. AI Support chat widget (Smart Support)
3. Support ticket creation
4. Support ticket tracking screen
5. Ticket history list
6. Admin message inbox (admin role only)

**Estimated Scope:** Medium — 6 features, ~3–4 screens
**Dependencies:** Auth + Messaging V2 (already done)

---

### Phase M4 — Seller Systems

**Goal:** Full seller management on mobile — a complete mobile seller dashboard.

**Features Included:**
1. Seller navigation (dedicated seller tabs/drawer when `isSeller`)
2. Seller product list
3. Create product (form — title, price, images, description, category)
4. Edit product
5. Variant management (groups + options + images)
6. Inventory management
7. Seller orders list + detail + fulfillment actions
8. Seller analytics (revenue chart, orders chart, top products)
9. Seller reviews list + reply
10. Store settings (logo, banner, social links)
11. Seller trust score breakdown screen
12. Seller messages dedicated inbox
13. Followers list

**Estimated Scope:** Very Large — 13 features, ~10–15 screens
**Dependencies:** M1, M2

---

### Phase M5 — Courier Systems

**Goal:** Full courier operations on mobile — GPS, mission management, earnings.

**Features Included:**
1. Courier dashboard (active mission, stats, earnings)
2. Availability toggle (ONLINE/OFFLINE) with background location permission
3. GPS location update (background task, sends lat/lng to API)
4. Mission offers screen (incoming offers with accept/reject + countdown)
5. Active delivery missions screen (current mission details, pickup/delivery actions)
6. Mission history + earnings ledger
7. Courier application form + status (shared with M2)

**Estimated Scope:** Large — 7 features, ~5–7 screens
**Dependencies:** M2 (auth + account system), location permissions (expo-location)

---

### Phase M6 — Admin Systems

**Goal:** Essential admin management on mobile (power-user subset).

**Features Included:**
1. Admin dashboard (KPIs — users, orders, revenue, sellers)
2. Order management (list + status update)
3. Seller management (list + verification actions)
4. Courier management (list + availability view)
5. Delivery missions monitor (real-time mission states)
6. Support ticket management (view + respond)
7. User management (suspend/activate)

**Estimated Scope:** Very Large — 7 features, ~8–10 screens
**Dependencies:** M1–M5

---

### Phase M7 — Pixel-Perfect Final Parity

**Goal:** Design and UX polish to bring mobile to full visual parity with web.

**Features Included:**
1. Skeleton shimmer loading states (replace ActivityIndicator)
2. Illustrated empty states (matching web illustrations)
3. Global toast notification system (react-native-toast)
4. Framer Motion equivalents (Reanimated 3 micro-animations)
5. Typography — confirm Cairo (AR) + Inter (EN) font loading
6. Error states — full illustrated error pages
7. Haptics on key interactions (purchase, review, availability toggle)
8. Transition animations between screens
9. Static informational pages (about, help, shipping, policies)
10. Loyalty page
11. SYANO Guarantee page
12. Full accessibility audit (screen reader labels, focus management)

**Estimated Scope:** Medium — polish phase, no new API work
**Dependencies:** M1–M6

---

## Priority Recommendation

Given the current 28% parity, the highest-impact phases to close the gap fastest are:

1. **M2 (Customer Systems)** — Notifications, wishlist, and account settings affect every customer session
2. **M1 (Marketplace)** — Reviews, wishlist button, and image gallery are the most visible gaps
3. **M4 (Seller)** — Zero seller management on mobile is a hard blocker for seller adoption
4. **M5 (Courier)** — Zero courier ops on mobile means couriers must use web; GPS needs native integration
5. **M3 (Messaging + AI Support)** — Messaging is already 92%; AI Support gap is the priority
6. **M6 (Admin)** — Mobile admin is a nice-to-have; web admin sufficient for launch
7. **M7 (Polish)** — Final pass before production launch

---

## Files Generated

- `MOBILE_PARITY_AUDIT.md` — Complete section-by-section audit (routes, features, API, role reports, design)
- `MOBILE_PARITY_MATRIX.md` — Condensed parity matrix with matched/partial/missing breakdown
- `MOBILE_PARITY_GAP_REPORT.md` — This file — master report + migration roadmap M1–M7
