# SYANO — Mobile Parity Matrix (Phase M1)
Last audited: June 17, 2026

## Summary Matrix

| System | Total Web Features | Mobile Implemented | Parity % |
|---|---|---|---|
| **Authentication** | 5 | 3 | **60%** |
| **Marketplace / Browsing** | 15 | 12 | **80%** |
| **Search & Discovery V2** | 17 | 8 | **47%** |
| **Cart** | 5 | 4 | **80%** |
| **Checkout** | 6 | 4 | **67%** |
| **Orders** | 7 | 6 | **86%** |
| **Messaging V2** | 12 | 11 | **92%** |
| **Notifications** | 5 | 0 | **0%** |
| **Wishlist** | 3 | 3 | **100%** |
| **AI Support** | 6 | 0 | **0%** |
| **Customer Profile / Account** | 8 | 2 | **25%** |
| **Seller Systems** | 16 | 1 | **6%** |
| **Courier Systems** | 8 | 0 | **0%** |
| **Admin Systems** | 16 | 0 | **0%** |
| **Static / Info Pages** | 15 | 0 | **0%** |
| **TOTAL** | **164** | **54** | **33%** |

---

## Detailed Feature Matrix

### ✅ FULLY MATCHED (Mobile = Web)

| Feature | Route (Web) | Route (Mobile) |
|---|---|---|
| Login | `/login` | `(auth)/login` |
| Register | `/register` | `(auth)/register` |
| Forgot Password | `/forgot-password` | `(auth)/forgot-password` |
| Cart view | `/cart` | `(tabs)/cart` |
| Cart — add/update/remove items | — | — |
| Orders list | `/orders` | `(tabs)/orders` |
| Order detail — status timeline | `/orders/:id` | `order/[id]` |
| Order detail — cancel | `/orders/:id` | `order/[id]` |
| Order detail — seller review | `/orders/:id` | `order/[id]` |
| Order detail — status history | `/orders/:id` | `order/[id]` |
| Messages — conversations list | `/messages` | `(tabs)/messages` |
| Messages — send/receive | `/messages` | `(tabs)/messages` |
| Messages — typing indicators | `/messages` | `(tabs)/messages` |
| Messages — read receipts | `/messages` | `(tabs)/messages` |
| Messages — attachments | `/messages` | `(tabs)/messages` |
| Messages — archive | `/messages` | `(tabs)/messages` |
| Messages — mute | `/messages` | `(tabs)/messages` |
| Product variants selection | `/products/:id` | `product/[id]` |
| Product add to cart | `/products/:id` | `product/[id]` |
| Product message seller | `/products/:id` | `product/[id]` |
| Product reviews display | `/products/:id` | `product/[id]` |
| Product related products | `/products/:id` | `product/[id]` |
| Product image gallery (swipeable) | `/products/:id` | `product/[id]` |
| Product wishlist heart button | `/products/:id` | `product/[id]` |
| Wishlist list view | `/wishlist` | `(tabs)/wishlist` |
| Wishlist remove item | `/wishlist` | `(tabs)/wishlist` |
| Wishlist add-to-cart shortcut | `/wishlist` | `(tabs)/wishlist` |
| Store follow / unfollow | `/store/:slug` | `store/[slug]` |
| Homepage — Hot Deals (best sellers) | `/` | `(tabs)/index` |
| Homepage — New Arrivals | `/` | `(tabs)/index` |
| Search suggestions | `/shop` | `(tabs)/index` |
| Search click tracking (CTR) | `/shop` | `(tabs)/index` |
| Profile — following stores list | `/customer/dashboard` | `(tabs)/profile` |
| Profile — logout | — | `(tabs)/profile` |
| Order success screen | — | `order-success` |

### ⚠️ PARTIAL (Mobile has subset of web functionality)

| Feature | What Mobile Has | What Mobile Lacks |
|---|---|---|
| Homepage | Product list + search + sort | Hero carousel, 8 homepage sections, best sellers section, featured sellers |
| Product detail | Variants, cart, store preview, trust score | Reviews display, related products, wishlist button, full image gallery |
| Search/Shop | Text search, category chips, 4 sort options, rating filter, in-stock filter | Price range filter, on-sale filter, used filter, NLP banner, semantic indicator, categories tab, stores tab, advanced filter panel |
| Store page | Product list, store info | Follow/unfollow button, store reviews, full trust badge display |
| Checkout | Zones, address, notes, order summary | Coupon/promo code input |
| Seller (Home tab) | Dashboard stats cards | All seller management — products, orders, analytics, reviews, settings |
| Categories | Horizontal chip row | Full category grid page `/categories` |
| Profile | Following stores, nav shortcuts, logout | Settings, notifications, wishlist, account management |
| Messages | Full V2 feature set | Order-linked conversation threading not confirmed |

### ❌ MISSING (Exists on Web, Zero Mobile Implementation)

#### Customer / Shopper
- Email OTP verification screen
- Customer dashboard
- Notifications screen (real-time SSE + inbox)
- Web push notification opt-in
- Wishlist (add, view, remove)
- AI Support chat widget
- Support ticket creation + tracking
- Account settings (theme, language, currency)
- Guest cart
- Store follow/unfollow
- Stores directory
- Seller application (form + status)
- Courier application (form + status)

#### Seller Role
- Product list management
- Create product
- Edit product
- Variant management
- Inventory management
- Seller orders list
- Seller order detail + fulfillment
- Seller analytics (charts, revenue)
- Seller reviews + reply system
- Store settings (SEO, social, policies)
- Seller trust score page
- Seller messages inbox (dedicated)
- Seller followers

#### Courier Role
- Courier dashboard
- Availability toggle (ONLINE/OFFLINE)
- GPS location update
- Mission offers (view, accept, reject)
- Active delivery missions
- Mission history
- Earnings wallet

#### Admin Role
- Admin dashboard (KPIs, stats)
- User management
- Product moderation
- All orders management
- Seller management + verification
- Courier management
- Delivery zone management
- Delivery missions monitor
- Courier availability map
- Dispatch alerts
- Support ticket dashboard
- Hero banner CMS
- Search analytics
- Platform settings
- Audit logs

#### Informational / Static
- About pages (about, story, team)
- Contact page
- Help center
- Shipping information
- Payment methods
- SYANO Guarantee
- Loyalty program
- Privacy policy / Terms / Returns / Cookies

---

## API Coverage Matrix (Condensed)

| Category | Total Endpoints | Mobile Consumes | Coverage |
|---|---|---|---|
| Auth | 6 | 4 | 67% |
| Products | 12 | 4 | 33% |
| Search | 7 | 5 | 71% |
| Sellers | 18 | 3 | 17% |
| Cart | 5 | 5 | 100% |
| Orders | 8 | 6 | 75% |
| Delivery zones | 2 | 2 | 100% |
| Reviews | 4 | 2 | 50% |
| Conversations | 12 | 12 | 100% |
| Notifications | 4 | 0 | 0% |
| Wishlist | 3 | 0 | 0% |
| Support | 6 | 0 | 0% |
| Courier | 8 | 0 | 0% |
| Mission offers | 5 | 0 | 0% |
| Admin | 30+ | 0 | 0% |
| Settings | 2 | 0 | 0% |
| **TOTAL** | **~132** | **~43** | **~33%** |
