# SYANO — Mobile Parity Audit (Phase M0)
Last audited: June 17, 2026

---

## SECTION 1 — WEB ROUTES MATRIX

| # | Route | Purpose | Role Access | Exists On Mobile? |
|---|---|---|---|---|
| 1 | `/` | Homepage V7 — hero carousel, featured products, categories, best sellers, trending | Public | PARTIAL — Customer Shop tab exists; no hero carousel, no full homepage sections |
| 2 | `/login` | Login form | Public | ✅ YES — `(auth)/login` |
| 3 | `/register` | Registration form | Public | ✅ YES — `(auth)/register` |
| 4 | `/verify` | Email/phone OTP verification | Public | ❌ NO |
| 5 | `/forgot-password` | Password reset via OTP | Public | ✅ YES — `(auth)/forgot-password` |
| 6 | `/account-suspended` | Suspended account notice | Public | ❌ NO |
| 7 | `/shop` | Full search/shop page with NLP, filters, semantic search | Public | PARTIAL — basic search + sort chips in Home tab; no full NLP banner, no advanced filter panel |
| 8 | `/search` | Alias for `/shop` | Public | PARTIAL |
| 9 | `/products` | Alias for `/shop` | Public | PARTIAL |
| 10 | `/categories` | Category browser with grid | Public | PARTIAL — categories shown as chips only in shop |
| 11 | `/products/:id` | Product detail — variants, reviews, related, store preview, wishlist | Public | PARTIAL — variants ✅, add to cart ✅, store preview ✅, trust score ✅; no reviews display, no related products, no wishlist button |
| 12 | `/cart` | Cart with items, discount, delivery fee preview | Public | ✅ YES — `(tabs)/cart` |
| 13 | `/checkout` | 2-step checkout — delivery zone, address, notes, confirm | Customer | PARTIAL — zones ✅, address ✅, notes ✅; no coupon/promo code |
| 14 | `/orders` | Order history list | Customer | ✅ YES — `(tabs)/orders` |
| 15 | `/orders/:id` | Order detail — status timeline, history, cancel, review seller | Customer | ✅ YES — `order/[id]` — timeline ✅, history ✅, review ✅, cancel ✅ |
| 16 | `/customer/dashboard` | Customer stats, recent activity | Customer | ❌ NO |
| 17 | `/wishlist` | Saved products list | Customer | ❌ NO |
| 18 | `/messages` | Messaging inbox — conversations, typing, read receipts, attachments | Customer | ✅ YES — `(tabs)/messages` — full V2 parity |
| 19 | `/support` | AI Support chat + ticket tracking | Customer | ❌ NO |
| 20 | `/store/:slug` | Store page — products, reviews, follow, trust badge | Public | PARTIAL — `store/[slug]` ✅; follow button unknown |
| 21 | `/stores` | Stores directory / listing | Public | ❌ NO |
| 22 | `/seller/apply` | Seller application form | Customer | ❌ NO |
| 23 | `/seller/application-status` | Seller application status tracker | Customer | ❌ NO |
| 24 | `/seller/dashboard` | Seller dashboard — stats, orders, revenue | Seller | PARTIAL — stats only in Home tab index via `useGetSellerDashboard`; no navigation to seller pages |
| 25 | `/seller/products` | Seller product list | Seller | ❌ NO |
| 26 | `/seller/products/new` | Create new product | Seller | ❌ NO |
| 27 | `/seller/products/:id/edit` | Edit product — details, variants, images | Seller | ❌ NO |
| 28 | `/seller/orders` | Seller order management | Seller | ❌ NO |
| 29 | `/seller/orders/:id` | Seller order detail — status update, fulfillment | Seller | ❌ NO |
| 30 | `/seller/inventory` | Inventory tracking | Seller | ❌ NO |
| 31 | `/seller/messages` | Seller messaging inbox | Seller | ❌ NO (uses shared messages tab, but seller-specific view missing) |
| 32 | `/seller/analytics` | Sales analytics charts | Seller | ❌ NO |
| 33 | `/seller/reviews` | Review management with reply | Seller | ❌ NO |
| 34 | `/seller/store-settings` | Store profile, SEO, social, policies | Seller | ❌ NO |
| 35 | `/seller/trust` | Trust score breakdown | Seller | ❌ NO |
| 36 | `/seller/how-to-sell` | Seller onboarding guide | Public | ❌ NO |
| 37 | `/seller/terms` | Seller terms of service | Public | ❌ NO |
| 38 | `/seller/center` | Seller resource center | Public | ❌ NO |
| 39 | `/seller/commission` | Commission structure page | Public | ❌ NO |
| 40 | `/seller/faq` | Seller FAQ | Public | ❌ NO |
| 41 | `/courier/apply` | Courier application form | Customer | ❌ NO |
| 42 | `/courier/application-status` | Courier application status | Customer | ❌ NO |
| 43 | `/courier/dashboard` | Courier ops — availability, missions, earnings | Courier | ❌ NO |
| 44 | `/admin` | Admin dashboard — KPIs, stats | Admin | ❌ NO |
| 45 | `/admin/users` | User management | Admin | ❌ NO |
| 46 | `/admin/products` | Product moderation | Admin | ❌ NO |
| 47 | `/admin/orders` | All orders management | Admin | ❌ NO |
| 48 | `/admin/logs` | Audit log viewer | Admin | ❌ NO |
| 49 | `/admin/settings` | Platform settings | Admin | ❌ NO |
| 50 | `/admin/sellers` | Seller management | Admin | ❌ NO |
| 51 | `/admin/analytics` | Platform analytics | Admin | ❌ NO |
| 52 | `/admin/search-analytics` | Search query analytics | Admin | ❌ NO |
| 53 | `/admin/courier-applications` | Courier application list | Admin | ❌ NO |
| 54 | `/admin/courier-applications/:id` | Courier application review | Admin | ❌ NO |
| 55 | `/admin/delivery` | Delivery zones management | Admin | ❌ NO |
| 56 | `/admin/delivery-missions` | Delivery mission monitoring | Admin | ❌ NO |
| 57 | `/admin/courier-availability` | Live courier availability map | Admin | ❌ NO |
| 58 | `/admin/verification` | Seller verification panel | Admin | ❌ NO |
| 59 | `/admin/messages` | Admin inbox view | Admin | ❌ NO |
| 60 | `/admin/hero-banners` | Hero banner CMS | Admin | ❌ NO |
| 61 | `/admin/support` | Support ticket management | Admin | ❌ NO |
| 62 | `/about` | About page | Public | ❌ NO |
| 63 | `/about/story` | Company story | Public | ❌ NO |
| 64 | `/about/team` | Team page | Public | ❌ NO |
| 65 | `/contact` | Contact page | Public | ❌ NO |
| 66 | `/shipping` | Shipping information | Public | ❌ NO |
| 67 | `/shipping/nationwide` | Nationwide shipping info | Public | ❌ NO |
| 68 | `/payment-methods` | Accepted payment methods | Public | ❌ NO |
| 69 | `/syano-guarantee` | Buyer protection guarantee | Public | ❌ NO |
| 70 | `/loyalty` | Loyalty program page | Public | ❌ NO |
| 71 | `/help` | Help center | Public | ❌ NO |
| 72 | `/privacy-policy` | Privacy policy | Public | ❌ NO |
| 73 | `/terms-of-use` | Terms of use | Public | ❌ NO |
| 74 | `/returns-policy` | Returns policy | Public | ❌ NO |
| 75 | `/cookies` | Cookie policy | Public | ❌ NO |

**Total web routes: 75**

---

## SECTION 2 — MOBILE ROUTES MATRIX

| # | Mobile Route | Purpose | Equivalent Web Route | Status |
|---|---|---|---|---|
| 1 | `(auth)/login` | Login form | `/login` | MATCHED |
| 2 | `(auth)/register` | Registration | `/register` | MATCHED |
| 3 | `(auth)/forgot-password` | Password reset | `/forgot-password` | MATCHED |
| 4 | `(tabs)/index` | Customer shop + Seller dashboard (role-branched) | `/shop` + `/seller/dashboard` | PARTIAL |
| 5 | `(tabs)/cart` | Cart view | `/cart` | MATCHED |
| 6 | `(tabs)/orders` | Order history | `/orders` | MATCHED |
| 7 | `(tabs)/messages` | Messaging V2 — full conversations | `/messages` | MATCHED |
| 8 | `(tabs)/profile` | Profile — following stores, navigation links, logout | `/customer/dashboard` | PARTIAL |
| 9 | `product/[id]` | Product detail — variants, add to cart, message seller | `/products/:id` | PARTIAL |
| 10 | `order/[id]` | Order detail — timeline, history, review, cancel | `/orders/:id` | MATCHED |
| 11 | `store/[slug]` | Store page — info + products | `/store/:slug` | PARTIAL |
| 12 | `store/[id]` | Store page by numeric ID (legacy/duplicate) | `/store/:slug` | PARTIAL |
| 13 | `checkout` | 2-step checkout — zones, address, confirm | `/checkout` | PARTIAL |
| 14 | `order-success` | Order success confirmation | (inline on web) | MATCHED |
| 15 | `+not-found` | 404 screen | `/not-found` | MATCHED |

**Total mobile routes: 15**
**Mobile routes without web equivalent: 0**
**Web routes with no mobile equivalent: 60**

---

## SECTION 3 — FEATURE PARITY MATRIX

### 3.1 Marketplace Features

| Feature | Web Status | Mobile Status | Parity % |
|---|---|---|---|
| Homepage V7 (8 sections, hero carousel) | ✅ Full | ❌ Missing — no homepage, customer goes directly to shop | 0% |
| Hero Banner System (admin CMS + carousel) | ✅ Full | ❌ Missing | 0% |
| Product listing (grid, pagination, load more) | ✅ Full | ✅ FlatList with load more | 90% |
| Product detail — images | ✅ Gallery + zoom | ✅ Single hero image | 60% |
| Product detail — variants | ✅ Full (color swatches, size, options) | ✅ Full (color swatches, option selection, availability check) | 95% |
| Product detail — reviews display | ✅ Full (list + rating breakdown) | ❌ Missing | 0% |
| Product detail — related products | ✅ Full | ❌ Missing | 0% |
| Product detail — wishlist button | ✅ Full | ❌ Missing | 0% |
| Product detail — store preview + trust | ✅ Full | ✅ Full (trust score, verification badge) | 95% |
| Product detail — message seller | ✅ Full | ✅ Full | 100% |
| Categories browser | ✅ Full grid page | ⚠️ Chips only in shop tab | 40% |
| Store page | ✅ Full (banner, logo, reviews, follow, trust, products) | ⚠️ Partial (products + basic info; follow not confirmed) | 50% |
| Store follow / unfollow | ✅ Full | ❌ Missing from store page | 10% |
| Store directory / listing | ✅ Full | ❌ Missing | 0% |
| Wishlist page | ✅ Full | ❌ Missing | 0% |

### 3.2 Search & Discovery V2

| Feature | Web Status | Mobile Status | Parity % |
|---|---|---|---|
| Search input with debounce | ✅ Full | ✅ Full | 100% |
| Search suggestions (typeahead) | ✅ Full | ✅ Full (suggestions + categories) | 95% |
| Trending searches | ✅ Full | ✅ Fetched (searchLogId CTR tracking) | 90% |
| Search results page | ✅ Full — dedicated `/shop` page | ⚠️ Inline in Home tab only | 60% |
| Search filters — category | ✅ Full sidebar + chips | ⚠️ Category chips only | 60% |
| Search filters — price range | ✅ Full | ❌ Missing | 0% |
| Search filters — rating | ✅ Full | ✅ minRating chip | 70% |
| Search filters — in stock | ✅ Full | ✅ inStock chip | 80% |
| Search filters — on sale | ✅ Full | ❌ Missing | 0% |
| Search filters — used/condition | ✅ Full | ❌ Missing | 0% |
| Search sorting | ✅ Full (6+ options) | ✅ 4 options (newest, price_asc, price_desc, highest_rated) | 70% |
| NLP banner (intent detection display) | ✅ Full | ❌ Missing | 0% |
| Semantic search visual indicator | ✅ Full | ❌ Missing | 0% |
| Categories tab in search | ✅ Full | ❌ Missing | 0% |
| Stores tab in search | ✅ Full | ❌ Missing | 0% |
| Search synonyms (transparent) | ✅ Server-side | ✅ Server-side | 100% |
| Click tracking (CTR) | ✅ Full | ✅ recordMobileSearchClick | 100% |

### 3.3 Customer Systems

| Feature | Web Status | Mobile Status | Parity % |
|---|---|---|---|
| Cart — view items | ✅ Full | ✅ Full | 100% |
| Cart — update quantity | ✅ Full | ✅ Full | 100% |
| Cart — remove item | ✅ Full | ✅ Full | 100% |
| Cart — guest cart | ✅ Full | ❌ No guest cart (auth required) | 20% |
| Cart — discount display | ✅ Full | ✅ Full | 100% |
| Checkout — delivery zones | ✅ Full (40 zones) | ✅ Full | 100% |
| Checkout — delivery address | ✅ Full | ✅ Full | 100% |
| Checkout — delivery notes | ✅ Full | ✅ Full | 100% |
| Checkout — coupon/promo code | ✅ Full | ❌ Missing | 0% |
| Checkout — order summary | ✅ Full | ✅ Full | 100% |
| Order history list | ✅ Full | ✅ Full | 100% |
| Order detail — status timeline | ✅ Full | ✅ Full | 100% |
| Order detail — status history | ✅ Full | ✅ Full (useGetOrderHistory) | 100% |
| Order detail — cancel order | ✅ Full | ✅ Full | 100% |
| Order detail — seller review | ✅ Full | ✅ Full (usePostSellerReview + status check) | 100% |
| Customer dashboard | ✅ Full — `/customer/dashboard` | ❌ Missing | 0% |
| Notifications inbox | ✅ Full (SSE + in-app toasts + web push) | ❌ Missing — no notifications screen | 0% |
| Wishlist | ✅ Full | ❌ Missing | 0% |
| Account settings (theme, language, currency) | ✅ Full | ❌ Missing | 0% |
| OTP email verification | ✅ Full | ❌ No `/verify` screen | 0% |
| AI Support chat | ✅ Full | ❌ Missing | 0% |
| Support ticket tracking | ✅ Full | ❌ Missing | 0% |

### 3.4 Messaging V2

| Feature | Web Status | Mobile Status | Parity % |
|---|---|---|---|
| Conversation list | ✅ Full | ✅ Full | 100% |
| Send/receive messages | ✅ Full | ✅ Full | 100% |
| Typing indicators | ✅ Full | ✅ Full (TypingDots component) | 100% |
| Read receipts (✓/✓✓) | ✅ Full | ✅ Full | 100% |
| Attachments (images + files) | ✅ Full | ✅ Full (expo-image-picker) | 100% |
| Archive conversation | ✅ Full | ✅ Full (long press menu) | 100% |
| Mute conversation | ✅ Full | ✅ Full (long press menu + mute icon) | 100% |
| Archived conversations view | ✅ Full | ✅ Full (archived tab) | 100% |
| Order-linked conversations | ✅ Full | ❌ order_id linking not confirmed in mobile | 70% |
| Admin inbox (admin role) | ✅ Full | ❌ Missing | 0% |
| Unread badge count | ✅ Full (navbar badge) | ✅ Tab badge | 95% |
| Poll-based fallback | ✅ Full | ✅ Full (3s/5s/10s intervals) | 100% |

### 3.5 AI Support System

| Feature | Web Status | Mobile Status | Parity % |
|---|---|---|---|
| Smart Support widget | ✅ Full | ❌ Missing | 0% |
| Ticket creation | ✅ Full | ❌ Missing | 0% |
| AI response (FAQ/intent matching) | ✅ Full | ❌ Missing | 0% |
| Escalation to human | ✅ Full | ❌ Missing | 0% |
| Ticket tracking | ✅ Full | ❌ Missing | 0% |
| Admin support dashboard | ✅ Full | ❌ Missing | 0% |

### 3.6 Seller Systems

| Feature | Web Status | Mobile Status | Parity % |
|---|---|---|---|
| Seller dashboard stats | ✅ Full | ✅ Stats cards (useGetSellerDashboard) | 70% |
| Seller analytics (charts, revenue) | ✅ Full | ❌ Missing | 0% |
| Product management list | ✅ Full | ❌ Missing | 0% |
| Create new product | ✅ Full | ❌ Missing | 0% |
| Edit product | ✅ Full | ❌ Missing | 0% |
| Variant management | ✅ Full | ❌ Missing | 0% |
| Inventory management | ✅ Full | ❌ Missing | 0% |
| Seller orders list | ✅ Full | ❌ Missing | 0% |
| Seller order detail / fulfillment | ✅ Full | ❌ Missing | 0% |
| Seller messages (dedicated inbox) | ✅ Full | ❌ Missing | 0% |
| Review management + replies | ✅ Full | ❌ Missing | 0% |
| Store settings (profile, SEO, social) | ✅ Full | ❌ Missing | 0% |
| Trust score display | ✅ Full | ❌ Missing (only shown on product page) | 10% |
| Seller application form | ✅ Full | ❌ Missing | 0% |
| Seller application status | ✅ Full | ❌ Missing | 0% |
| Followers management | ✅ Full | ❌ Missing | 0% |

### 3.7 Courier Systems

| Feature | Web Status | Mobile Status | Parity % |
|---|---|---|---|
| Courier application | ✅ Full | ❌ Missing | 0% |
| Courier application status | ✅ Full | ❌ Missing | 0% |
| Courier dashboard | ✅ Full | ❌ Missing | 0% |
| Availability toggle (ONLINE/OFFLINE) | ✅ Full | ❌ Missing | 0% |
| Location update (lat/lng) | ✅ Full | ❌ Missing | 0% |
| Mission offers (accept/reject) | ✅ Full | ❌ Missing | 0% |
| Active delivery missions | ✅ Full | ❌ Missing | 0% |
| Mission history + earnings | ✅ Full | ❌ Missing | 0% |

### 3.8 Admin Systems

| Feature | Web Status | Mobile Status | Parity % |
|---|---|---|---|
| Admin dashboard | ✅ Full | ❌ Missing | 0% |
| User management | ✅ Full | ❌ Missing | 0% |
| Product moderation | ✅ Full | ❌ Missing | 0% |
| Order management | ✅ Full | ❌ Missing | 0% |
| Seller management + verification | ✅ Full | ❌ Missing | 0% |
| Courier management | ✅ Full | ❌ Missing | 0% |
| Delivery zone management | ✅ Full | ❌ Missing | 0% |
| Delivery missions monitor | ✅ Full | ❌ Missing | 0% |
| Courier availability map | ✅ Full | ❌ Missing | 0% |
| Dispatch alerts | ✅ Full | ❌ Missing | 0% |
| Support ticket dashboard | ✅ Full | ❌ Missing | 0% |
| Hero banner CMS | ✅ Full | ❌ Missing | 0% |
| Search analytics | ✅ Full | ❌ Missing | 0% |
| Platform settings | ✅ Full | ❌ Missing | 0% |
| Audit logs | ✅ Full | ❌ Missing | 0% |
| Analytics charts | ✅ Full | ❌ Missing | 0% |

---

## SECTION 4 — API CONSUMPTION AUDIT

| API Endpoint | Web Uses | Mobile Uses |
|---|---|---|
| `GET /api/products` | ✅ YES | ✅ YES |
| `GET /api/products/:id` | ✅ YES | ✅ YES |
| `GET /api/products/categories` | ✅ YES | ✅ YES (category chips) |
| `GET /api/products/best-sellers` | ✅ YES | ❌ NO |
| `GET /api/products/featured` | ✅ YES | ❌ NO |
| `GET /api/search/results` | ✅ YES | ✅ YES (via useGetProducts with search param) |
| `GET /api/search/suggestions` | ✅ YES | ✅ YES |
| `GET /api/search/trending` | ✅ YES | ✅ YES (implicit) |
| `GET /api/search/related` | ✅ YES | ✅ YES |
| `POST /api/search/track-click` | ✅ YES | ✅ YES |
| `GET /api/sellers/featured` | ✅ YES | ❌ NO |
| `GET /api/sellers/directory` | ✅ YES | ❌ NO |
| `GET /api/sellers/store/:slug` | ✅ YES | ✅ YES |
| `GET /api/sellers/dashboard` | ✅ YES | ✅ YES |
| `POST /api/sellers/apply` | ✅ YES | ❌ NO |
| `GET /api/sellers/application` | ✅ YES | ❌ NO |
| `GET /api/sellers/analytics` | ✅ YES | ❌ NO |
| `GET /api/sellers/products` | ✅ YES | ❌ NO |
| `POST /api/sellers/products` | ✅ YES | ❌ NO |
| `PATCH /api/sellers/products/:id` | ✅ YES | ❌ NO |
| `DELETE /api/sellers/products/:id` | ✅ YES | ❌ NO |
| `GET /api/sellers/orders` | ✅ YES | ❌ NO |
| `PATCH /api/sellers/orders/:id/status` | ✅ YES | ❌ NO |
| `GET /api/sellers/reviews` | ✅ YES | ❌ NO |
| `POST /api/sellers/reviews/:id/reply` | ✅ YES | ❌ NO |
| `GET /api/cart` | ✅ YES | ✅ YES |
| `POST /api/cart/items` | ✅ YES | ✅ YES |
| `PATCH /api/cart/items/:id` | ✅ YES | ✅ YES |
| `DELETE /api/cart/items/:id` | ✅ YES | ✅ YES |
| `GET /api/delivery-zones` | ✅ YES | ✅ YES |
| `POST /api/orders` | ✅ YES | ✅ YES |
| `GET /api/orders` | ✅ YES | ✅ YES |
| `GET /api/orders/:id` | ✅ YES | ✅ YES |
| `GET /api/orders/:id/history` | ✅ YES | ✅ YES |
| `PATCH /api/orders/:id/cancel` | ✅ YES | ✅ YES |
| `POST /api/reviews` | ✅ YES | ✅ YES (seller review) |
| `GET /api/reviews/seller/:id/status` | ✅ YES | ✅ YES |
| `GET /api/conversations` | ✅ YES | ✅ YES |
| `POST /api/conversations` | ✅ YES | ✅ YES |
| `GET /api/conversations/:id/messages` | ✅ YES | ✅ YES |
| `POST /api/conversations/:id/messages` | ✅ YES | ✅ YES |
| `GET /api/conversations/:id/typing` | ✅ YES | ✅ YES |
| `POST /api/conversations/:id/typing` | ✅ YES | ✅ YES |
| `PATCH /api/conversations/:id/archive` | ✅ YES | ✅ YES |
| `PATCH /api/conversations/:id/mute` | ✅ YES | ✅ YES |
| `PATCH /api/conversations/:id/read` | ✅ YES | ✅ YES |
| `POST /api/conversations/:id/attachments` | ✅ YES | ✅ YES |
| `GET /api/notifications` | ✅ YES | ❌ NO |
| `GET /api/notifications/stream` (SSE) | ✅ YES | ❌ NO |
| `PATCH /api/notifications/:id/read` | ✅ YES | ❌ NO |
| `POST /api/push/subscribe` | ✅ YES | ❌ NO |
| `GET /api/wishlist` | ✅ YES | ❌ NO |
| `POST /api/wishlist` | ✅ YES | ❌ NO |
| `DELETE /api/wishlist/:id` | ✅ YES | ❌ NO |
| `GET /api/stores/following` | ✅ YES | ✅ YES (profile following stores) |
| `POST /api/stores/:id/follow` | ✅ YES | ❌ NO |
| `DELETE /api/stores/:id/follow` | ✅ YES | ❌ NO |
| `POST /api/support/message` | ✅ YES | ❌ NO |
| `GET /api/support/tickets` | ✅ YES | ❌ NO |
| `GET /api/courier/availability` | ✅ YES | ❌ NO |
| `PATCH /api/courier/availability` | ✅ YES | ❌ NO |
| `GET /api/courier/missions` | ✅ YES | ❌ NO |
| `GET /api/mission-offers` | ✅ YES | ❌ NO |
| `POST /api/mission-offers/:id/accept` | ✅ YES | ❌ NO |
| `POST /api/mission-offers/:id/reject` | ✅ YES | ❌ NO |
| `GET /api/admin/*` (all admin endpoints) | ✅ YES | ❌ NO |
| `GET /api/settings` | ✅ YES | ❌ NO |

---

## SECTION 5 — ROLE PARITY REPORTS

### CUSTOMER PARITY REPORT

| Feature | Status |
|---|---|
| Login / Register / Forgot Password | ✅ Existing |
| Product browsing + search | ✅ Existing |
| Cart (add, edit, remove) | ✅ Existing |
| Checkout (zones, address, notes) | ✅ Existing |
| Orders list | ✅ Existing |
| Order detail (timeline, cancel, review) | ✅ Existing |
| Messaging V2 (full parity) | ✅ Existing |
| Store page (basic) | ✅ Existing (partial) |
| Following stores (profile view) | ✅ Existing |
| Product variants | ✅ Existing |
| Search suggestions + sort + basic filters | ✅ Existing |
| Seller dashboard stats (if is seller) | ✅ Existing |
| OTP email verification screen | ❌ Missing |
| Customer dashboard | ❌ Missing |
| Notifications (inbox, real-time) | ❌ Missing |
| Wishlist | ❌ Missing |
| Support / AI chat | ❌ Missing |
| Account settings (theme, language, currency) | ❌ Missing |
| Checkout coupon/promo code | ❌ Missing |
| Product reviews display | ❌ Missing |
| Related products | ❌ Missing |
| Guest cart | ❌ Missing |
| Store follow/unfollow | ❌ Missing |
| Stores directory | ❌ Missing |
| Push notification opt-in | ❌ Missing |
| Seller application (apply + status) | ❌ Missing |
| Courier application (apply + status) | ❌ Missing |

**Customer Parity: ~45%**

### SELLER PARITY REPORT

| Feature | Status |
|---|---|
| Seller dashboard stats | ⚠️ Partial — stats visible in Home tab, no navigation to seller features |
| All seller management features | ❌ Missing |
| Product CRUD | ❌ Missing |
| Order management + fulfillment | ❌ Missing |
| Analytics + revenue charts | ❌ Missing |
| Inventory management | ❌ Missing |
| Seller messaging inbox | ❌ Missing |
| Review management + replies | ❌ Missing |
| Store settings | ❌ Missing |
| Trust score | ❌ Missing |
| Followers list | ❌ Missing |
| Verification status | ❌ Missing |

**Seller Parity: ~8%**

### COURIER PARITY REPORT

| Feature | Status |
|---|---|
| Courier application | ❌ Missing |
| Application status | ❌ Missing |
| Dashboard | ❌ Missing |
| Availability toggle | ❌ Missing |
| GPS location update | ❌ Missing |
| Mission offers (accept/reject) | ❌ Missing |
| Active missions | ❌ Missing |
| Mission history | ❌ Missing |
| Earnings wallet | ❌ Missing |

**Courier Parity: 0%**

### ADMIN PARITY REPORT

| Feature | Status |
|---|---|
| All admin features | ❌ Missing — zero admin screens on mobile |

**Admin Parity: 0%**

---

## SECTION 6 — DESIGN PARITY AUDIT

### DESIGN PARITY REPORT

| Design Token | Web | Mobile | Match? |
|---|---|---|---|
| Primary color | Emerald `#10B981` | Emerald `#10B981` | ✅ MATCH |
| Dark background | `#0f172a` slate-900 | OS dark mode via `useColorScheme` | ✅ MATCH |
| Light background | White / slate-50 | OS light mode | ✅ MATCH |
| Border radius — cards | `rounded-xl` (12px) | Similar radius via StyleSheet | ✅ MATCH |
| Typography — Arabic | Cairo (Google Fonts) | Not confirmed in mobile | ⚠️ UNKNOWN |
| Typography — English | Inter (self-hosted WOFF2) | Not confirmed in mobile | ⚠️ UNKNOWN |
| RTL support | ✅ Full (`dir="rtl"`, logical Tailwind classes) | ✅ Full (i18n-based, RN handles RTL natively) | ✅ MATCH |
| Glassmorphism (navbar) | ✅ Dark glassmorphism navbar | N/A — native tab bar | — |
| Tab bar styling | N/A | ✅ Native iOS tabs + Blur view + emerald active | ✅ MATCH |
| Loading skeleton | ✅ Implemented (PageLoadingSpinner, LazyImage) | ⚠️ ActivityIndicator used, no skeleton shimmer | PARTIAL |
| Empty states | ✅ Full illustrated empty states | ⚠️ Basic icon + text (no illustrations) | PARTIAL |
| Toast notifications | ✅ Sonner toasts | ❌ No global toast system | MISMATCH |
| Card shadows | ✅ Tailwind shadow-md | ✅ React Native elevation | ✅ MATCH |
| Button styles (primary/secondary) | ✅ Full variant system | ✅ Consistent emerald/muted | ✅ MATCH |
| Animations | ✅ Framer Motion (page transitions, cards) | ⚠️ Expo Haptics, basic Animated API only | PARTIAL |
| Product cards | ✅ Rich cards (badge, discount, rating, stock) | ✅ Similar via `ProductCard` component | 85% |
| Error states | ✅ Full ErrorBoundary + per-page error UI | ⚠️ Basic inline error text | PARTIAL |
| Minimum touch target | ✅ ≥44px | ✅ Platform-appropriate sizing | ✅ MATCH |
| AMOLED / dark mode | ✅ Full dark theme | ✅ Full dark mode support | ✅ MATCH |
| Bilingual labels (AR/EN) | ✅ 2,832 keys per language | ✅ Full i18n (custom `t()` function) | ✅ MATCH |
