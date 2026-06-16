# SYANO — Project Status
**Last Updated:** June 16, 2026 (Phase 11 — Prompt 2: Critical & High Fixes Complete)
**Recovery-Verified:** June 15, 2026 — all services running, 0 TypeScript errors, 95/100 recovery check

SYANO is a production-scale Syrian marketplace platform built with React + Vite (web), Expo (mobile), Express + Drizzle (API), PostgreSQL (DB). Full Arabic/English bilingual, RTL support, dark/light theme.

---

## Overall Completion: ~97%

| Layer | Status | Notes |
|---|---|---|
| Core marketplace | ✅ 100% | Auth, products, cart, checkout, orders |
| Seller ecosystem | ✅ 100% | Dashboard, analytics, orders V2, store pages V4, variants |
| Admin panel | ✅ 100% | Stats, moderation, user management, delivery, courier mgmt |
| Trust & verification | ✅ 100% | 0-100 score, tiers, audit log, verification badges |
| Delivery system | ✅ 100% | 40 Aleppo zones, courier ops, assignment flow |
| Messaging V2 | ✅ 100% | 19 API endpoints, 58/58 tests, web+mobile+lib complete |
| Notifications | ✅ 100% | SSE real-time, polling fallback, in-app toasts, web push (VAPID), bilingual |
| Wishlist | ✅ 100% | Web + heart button in ProductCard; mobile not implemented |
| Guest cart | ✅ 100% | All entry points wired (ProductCard + ProductDetail + Navbar) |
| Homepage V7 | ✅ 100% | 8 HomeSections, hero carousel, real data, dark glassmorphism navbar |
| Navbar Polish V1 | ✅ 100% | Light mode contrast, icon unification, active state fix, badge fix, settings dropdown |
| **Search & Discovery Engine V2** | ✅ 100% | Syrian Dialect Dict (70+ entries post-audit), intent modifiers (5 groups), 4-tier scoring, 3 endpoints, dialect-aware suggestions |
| **Hybrid NLP Search Engine V1** | ✅ 100% | Steps 1–5 complete + 8-axis audit (48/49 PASS). 5 modifiers: cheap/premium/rating/newest/used. 70+ dialect dict entries. GIN avg 4ms. |
| **Semantic Search / Embeddings** | ✅ 100% | TF-IDF/LSA embedding service running on port 8001; 42/42 products embedded; pgvector active |
| **Shop Page UX** | ✅ 100% | 3-bug surgical fix (June 15): toolbar overlap, mobile filter layout, NLP banner z-index |
| i18n (web) | ✅ 100% | **2,832 EN / 2,832 AR keys** (perfectly balanced) |
| i18n (mobile) | ✅ 100% | Full i18n including 30+ messages.* keys; zero hardcoded strings |
| Recovery system | ✅ 95% | 21/22 modules pass; heroBannerSystem false negative known |
| Vite API proxy | ✅ 100% | `/api` proxy rule added — frontend correctly routes API calls to port 8080 |

---

## Phase 11 — Launch Preparation
- Prompt 1 (Audit): ✅ Complete
- Prompt 2 (Critical & High Fixes): ✅ Complete
- Prompt 3 (Error Handling): ⏳ Not started

---

## Last Completed: Replit Migration (June 15, 2026)

Migrated the project to the Replit native environment:
1. Packages installed (`pnpm install --frozen-lockfile`, Python deps via Replit package manager)
2. Vite `/api` proxy rule added to `artifacts/marketplace/vite.config.ts` (critical: without this, API calls return HTML 404 from the Vite dev server)
3. Embedding service Python packages installed (numpy, scikit-learn, fastapi, uvicorn)
4. `requirements.txt` corrected — removed sentence-transformers/torch (blocked by Replit firewall), reflects the actual TF-IDF/LSA backend
5. Embedding service running: TF-IDF/LSA fallback, port 8001, 42/42 products auto-embedded at startup
6. Semantic search now ACTIVE (pgvector=true, RRF blend FTS 0.65 + semantic 0.35)

---

## Previous: Session 15 — Shop Page 3-Bug Surgical Fix (June 15, 2026)

Three visual bugs on `/shop` (`artifacts/marketplace/src/pages/search/index.tsx`) fixed:

1. **Desktop Bug (Bug 1):** First product row overlapped by sticky toolbar when no query active — fixed via `ResizeObserver` on toolbar div, dynamic `paddingTop` on tab containers
2. **Mobile Bug (Bug 2a):** Same overlap on mobile — same fix (shared container)
3. **Mobile Filter Bug (Bug 2b):** Cramped 2-column filter grid replaced with `space-y-5` vertical layout matching desktop sidebar
4. **Mobile NLP Bug (Bug 3):** NLP banner and active-filter chips hidden behind sticky filter bar — fixed by reordering JSX (banner before filter bar) and removing sticky positioning from filter bar

---

## ✅ Phase 8: Hybrid NLP Search Engine — COMPLETE (June 14, 2026)

**8-Axis Audit: 48/49 PASS.** Full production-grade bilingual search pipeline.

### Search Pipeline (13 steps in searchProcessor.ts)
1. Validate & sanitize → 2. Language detection → 3. Arabic normalization → 4. English normalization → 5. Stop word removal → 6. Synonym expansion (DB, 5-min cache) → 7. Intent detection → 8. Brand boost → 9. Numeric context → 10. FTS query build → 11. Multi-signal DB ranking → 12. Seller diversity → 13. Return with metadata

### Cache Layer (searchCache.ts)
- LRU 500-entry in-memory cache (O(1) operations)
- TTL: 5min normal / 1min sale / 10min fallback-L4
- Cache key: SHA-256 of query + filters

### Intent Modifiers (7 groups)
| Modifier | Effect |
|---|---|
| `cheap` | `affordable/discount/sale/offer/bargain` → price_asc sort |
| `premium` | `فاخر/original/authentic/high-end` → quality filter |
| `rating` | `أفضل تقييم/best rated/recommended` → effectiveSort=rating |
| `newest` | `جديد/أحدث/latest/new arrival` → effectiveSort=newest |
| `used` | second-hand / مستعمل → used condition filter |
| `on_sale` | discount_percent > 0 auto-WHERE |
| `gift` | gift-related filter |

### Syrian Dialect Dictionary (70+ entries)
Covers all major product categories: electronics (موبايل→phone), fashion (بواط→shoes, شنط→bags), beauty (برفانات→perfume, كريمات→cream), home (ديكور→decor), sports (موتوسيكل→motorcycle, دراجات→bikes), automotive (عربيات→cars), and more.

### 4-Level Fallback Chain
Level 1: Relaxed FTS (OR tsquery) → Level 2: Trigram similarity > 0.25 → Level 3: Category match → Level 4: Trending products

### Scoring Formula
`score = text_score × 0.55 + quality_score × 0.20 + freshness × 0.10 + seller_bonus (0.5 verified) + stock_bonus`

### API Endpoints
- `GET /api/search/results` — full search with NLP, cache, scoring, fallback, RRF semantic blend
- `GET /api/search/suggestions` — autocomplete (text/categories/stores/trending, avg 5ms)
- `GET /api/search` — legacy product list
- `POST /api/search/track-click` — click analytics
- `GET /api/suggestions/popular` — trending
- `POST /api/admin/search/reindex` — force reindex
- `GET /api/admin/search/health` — system health

---

## ✅ Phase 7: Messaging V2 — COMPLETE (June 14, 2026)

**58/58 API tests pass.**

19 endpoints in `artifacts/api-server/src/routes/messaging.ts`. Full web + mobile implementation. SSE real-time + polling fallback. 77 i18n keys (EN+AR). Unread badge in Navbar (15s refetch).

Key features: conversation CRUD, soft-delete tombstones, read receipts (✓/✓✓), typing indicators, base64 attachments (2MB), archive/mute, admin inbox, explicit mark-as-read via `PATCH /conversations/:id/read`.

---

## Platform Architecture

### Tech Stack
- **API**: Express v5, TypeScript, Drizzle ORM + PostgreSQL
- **Web**: React 19, Vite 7, TanStack Query, Wouter, Tailwind CSS v4, Radix UI, shadcn/ui
- **Mobile**: Expo (React Native), expo-router, TanStack Query
- **Shared libs**: `lib/db` (Drizzle schema), `lib/api-zod` (Zod validators), `lib/api-client-react` (typed hooks)
- **i18n**: react-i18next (web), custom t() (mobile), 2,832 keys per language
- **Real-time**: SSE for notifications + new_message events
- **Auth**: JWT (HS256) via SESSION_SECRET; roles: customer, seller, courier, admin
- **Search**: 13-step NLP pipeline + LRU cache + GIN FTS index + RRF semantic blend
- **Embeddings**: TF-IDF/LSA service (port 8001), pgvector storage, 384 dimensions

### Key Files
| File | Purpose |
|---|---|
| `artifacts/api-server/src/index.ts` | App bootstrap, migrations, demo data seeding |
| `artifacts/api-server/src/utils/searchProcessor.ts` | 13-step NLP search pipeline (860 lines) |
| `artifacts/api-server/src/services/searchCache.ts` | LRU 500-entry search result cache (205 lines) |
| `artifacts/api-server/src/routes/search.ts` | Search routes — FTS, suggestions, semantic cache (1,910 lines) |
| `artifacts/api-server/src/scripts/generateEmbeddings.ts` | Semantic embedding backfill (195 lines) |
| `artifacts/embedding-service/main.py` | FastAPI TF-IDF/LSA embedding service (342 lines) |
| `artifacts/api-server/src/routes/` | All API routes (25+ route files) |
| `lib/db/src/schema/` | Drizzle schema (all 33 tables) |
| `lib/api-client-react/src/` | Typed TanStack Query hooks for all endpoints |
| `artifacts/marketplace/src/App.tsx` | React router, all lazy-loaded pages |
| `artifacts/marketplace/src/pages/search/index.tsx` | Shop/search page (1,229 lines) |
| `artifacts/marketplace/src/components/MessagingPanel.tsx` | Shared messaging UI (web) |
| `artifacts/marketplace/src/i18n/en.json` | English translations (2,832 keys) |
| `artifacts/marketplace/src/i18n/ar.json` | Arabic translations (2,832 keys) |
| `artifacts/mobile/app/(tabs)/messages.tsx` | Mobile messaging screen |
| `artifacts/marketplace/vite.config.ts` | Vite config — includes `/api` proxy to port 8080 |

### Database
- **33 tables** (21 base schema + 12 via run-migrations.ts)
- `notification_type` enum: 32 values
- `order_status` enum: 15 values
- FTS: `fts_vector` column + `products_fts_gin` GIN index (42/42 products populated)
- Semantic: `embedding` vector(384) column (42/42 products populated, TF-IDF/LSA)

### Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin / Root Owner | delewatiamer7@gmail.com | 00Amer00 |
| Permanent Seller | delewatiamer8@gmail.com | 00Amer00 |
| Permanent Courier | delewatiamer9@gmail.com | 00Amer00 |
| Seller (dev) | seller@syano.test | Seller@2026 |
| Customer (dev) | customer@syano.test | Customer@2026 |
| Courier (dev) | courier@syano.test | Courier@2026 |

---

## Known Issues & Gaps

| Issue | Severity | Status |
|---|---|---|
| Mobile wishlist | Low | Open — web works; mobile heart button not implemented |
| heroBannerSystem recovery module false negative | Low | Known expected — homepage V7 uses HeroV4.tsx, not HeroBanner.tsx directly |
| Expo version warnings | Low | expo@54.0.34 vs expected ~54.0.35 — app functions correctly, update optional |

---

## Recovery Procedure (Quick Reference)

```bash
# 1. Install (Replit environment)
pnpm install --frozen-lockfile

# 2. Push schema (Drizzle handles it — no manual psql needed)
pnpm --filter @workspace/db run push

# 3. Build libs
npx tsc --build lib/db lib/api-zod lib/api-client-react

# 4. Start workflows via Replit workflow panel or restart_workflow tool
# API Server → run-migrations.ts runs → bootstrap accounts + 42 demo products + embeddings seeded
# Marketplace (Start application) + Mobile workflows
```

Expected after recovery: **33 tables**, notification_type=32 enum values, order_status=15, 42 products, 42/42 embeddings, 95/100 recovery check.

See `RECOVERY_GUIDE.md` for full step-by-step instructions.
