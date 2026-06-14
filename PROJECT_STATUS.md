# SYANO — Project Status
**Last Updated:** June 14, 2026 (Session 10 — Messaging V2 Audit)

SYANO is a production-scale Syrian marketplace platform built with React + Vite (web), Expo (mobile), Express + Drizzle (API), PostgreSQL (DB). Full Arabic/English bilingual, RTL support, dark/light theme.

---

## Overall Completion: ~93%

| Layer | Status | Notes |
|---|---|---|
| Core marketplace | ✅ 100% | Auth, products, cart, checkout, orders |
| Seller ecosystem | ✅ 100% | Dashboard, analytics, orders V2, store pages, variants |
| Admin panel | ✅ 100% | Stats, moderation, user management, delivery, courier mgmt |
| Trust & verification | ✅ 100% | 0-100 score, tiers, audit log, verification badges |
| Delivery system | ✅ 100% | 40 Aleppo zones, courier ops, assignment flow |
| Messaging V2 (web) | ✅ 100% | 18 API endpoints, MessagingPanel, 3 inbox pages, attachments, typing, read receipts |
| Messaging V2 (mobile) | 🟡 55% | Core list+send works; missing read receipts, typing, attachments, mute/archive, full i18n |
| Notifications | ✅ 100% | SSE real-time, polling fallback, in-app toasts, web push (VAPID), bilingual |
| Wishlist | ✅ 100% | Web + heart button; mobile not implemented |
| Guest cart | ✅ 100% | All entry points wired |
| Homepage V7 | ✅ 100% | 8 HomeSections, hero carousel, real data, dark glassmorphism navbar |
| i18n (web) | ✅ 100% | 2592 EN / 2592 AR keys, 77 messages.* keys |
| i18n (mobile) | 🟡 80% | Some hardcoded strings in messages screen + minor screens |
| Recovery system | ✅ 95% | 21/22 modules pass; heroBannerSystem false negative known |

---

## Messaging V2 — Deep Audit (June 14, 2026)

### Completion: 90%

#### API — 100% (18 endpoints in `artifacts/api-server/src/routes/messaging.ts`, 868 lines)

| Endpoint | Purpose |
|---|---|
| `GET /conversations/unread-count` | Global unread badge count |
| `GET /conversations/search` | Search by partner name or message content |
| `POST /conversations` | Start or resume a conversation (idempotent) |
| `GET /conversations` | List with archive filter, last message, unread counts |
| `GET /conversations/:id` | Single conversation detail |
| `GET /conversations/:id/messages` | Paginated history + auto-mark-read |
| `POST /conversations/:id/messages` | Send message (optional attachmentId) |
| `DELETE /conversations/:id/messages/:msgId` | Soft-delete own message |
| `PATCH /conversations/:id/archive` | Toggle archive |
| `PATCH /conversations/:id/mute` | Toggle mute |
| `POST /conversations/:id/typing` | Signal typing (in-memory, 4s TTL) |
| `GET /conversations/:id/typing` | Get currently typing users |
| `POST /conversations/:id/attachments` | Upload base64 attachment (2MB max, images/PDF/txt) |
| `GET /conversations/:id/attachments/:attachId` | Serve attachment (buffer with Content-Type) |
| `POST /conversations/:id/report` | Flag message for review |
| `GET /admin/conversations` | Admin inbox — all types, search, type filter |
| `POST /admin/conversations` | Admin initiates support conversation |
| `PATCH /admin/conversations/:id/block` | Block or unblock conversation |

#### Database Schema — 100%

| Table | Key Columns |
|---|---|
| `conversations` | id, customer_id, seller_id, product_id, order_id, type, status (active/archived/blocked), muted, last_message_at |
| `messages` | id, conversation_id, sender_id, body, read_at, deleted_at, flagged, attachment_id |
| `message_attachments` | id, conversation_id, filename, mime_type, size, data (base64) |

#### Web Frontend — 100%

- **`MessagingPanel.tsx`** (803 lines, shared for customer + seller):
  - Sidebar: search input, filter tabs (All / Unread / Archived), archive+mute on hover
  - Thread: message bubbles, ✓/✓✓ read receipts, inline image preview, file download links
  - Composer: textarea, drag-drop+paste image upload, file picker, char counter (shows at 1800+), typing emit
  - Typing indicator: animated 3-dot bounce when partner is typing
  - Empty states with role-specific hints and Browse Products CTA
  - Mobile-responsive: sidebar hidden when thread active, back arrow to return
- **`pages/messages/index.tsx`** — customer inbox at `/messages`
- **`pages/seller/messages.tsx`** — seller inbox at `/seller/messages`
- **`pages/admin/messages.tsx`** — admin inbox at `/admin/messages`:
  - Type filter tabs: All / C↔S / C↔Admin / S↔Admin
  - Block/unblock and archive actions per conversation
  - Full thread with delete, read receipts, send
- **`ContactSellerButton`** on product detail page → starts/resumes conversation → navigate to `/messages`
- Store page contact button → navigate to `/messages`

#### lib/api-client-react — 100% (20+ exported hooks)

`useGetConversations`, `useGetMessages`, `useSendMessage`, `useDeleteMessage`, `useArchiveConversation`, `useMuteConversation`, `useGetTyping`, `useUploadAttachment`, `useGetAdminConversations`, `useBlockConversation`, `useStartAdminConversation`, `useStartConversation`, `getConversationsQueryKey`, `getMessagesQueryKey`, `getUnreadCountQueryKey`

#### Real-time & Notifications — 100%

- SSE `new_message` event → `NotificationProvider` invalidates `getConversationsQueryKey()` + `/api/conversations/*` prefix
- Polling fallback: messages every 3s, conversations every 5s
- Navbar unread badge: blue dot, 15s refetch via `useGetUnreadCount`
- `createNotification` called on send with bilingual (EN+AR) title
- i18n: **77 `messages.*` keys** in both `en.json` and `ar.json`

#### Mobile — 55% (gaps below)

**What works:**
- Conversation list with FlatList, unread badges, partner name/avatar initial, last message preview
- ChatView: message bubbles (mine/theirs), send with haptic feedback, scroll-to-bottom on new message
- KeyboardAvoidingView for iOS/Android
- Auth gate with sign-in CTA
- Performance: `removeClippedSubviews`, `initialNumToRender`, `windowSize` optimized

**What is missing:**
| Gap | Priority | Notes |
|---|---|---|
| Read receipts display | Medium | No ✓/✓✓ in mobile bubbles; API returns `readAt` |
| Typing indicators | Low | No animated dots; API `/typing` endpoint ready |
| Attachment support | Medium | Text-only; API upload+serve endpoints exist |
| Archive/mute controls | Low | No long-press or swipe actions |
| Full i18n | Medium | ~8 hardcoded English strings in messages.tsx |

---

## Platform Architecture

### Tech Stack
- **API**: Express v5, TypeScript, Drizzle ORM + PostgreSQL
- **Web**: React 18, Vite, TanStack Query, Wouter, Tailwind CSS, Radix UI, shadcn/ui
- **Mobile**: Expo (React Native), expo-router, TanStack Query
- **Shared libs**: `lib/db` (Drizzle schema), `lib/api-zod` (Zod validators), `lib/api-client-react` (typed hooks)
- **i18n**: react-i18next (web), custom t() (mobile), 2592 keys per language
- **Real-time**: SSE for notifications + new_message events
- **Auth**: JWT (HS256) via SESSION_SECRET; roles: customer, seller, courier, admin

### Key Files
| File | Purpose |
|---|---|
| `artifacts/api-server/src/index.ts` | App bootstrap, migrations, demo data seeding |
| `artifacts/api-server/src/routes/` | All API routes (25+ route files) |
| `lib/db/src/schema/` | Drizzle schema (all 29+ tables) |
| `lib/api-client-react/src/` | Typed TanStack Query hooks for all endpoints |
| `artifacts/marketplace/src/App.tsx` | React router, all lazy-loaded pages |
| `artifacts/marketplace/src/components/MessagingPanel.tsx` | Shared messaging UI (web) |
| `artifacts/marketplace/src/i18n/en.json` | English translations (2592 keys) |
| `artifacts/marketplace/src/i18n/ar.json` | Arabic translations (2592 keys) |
| `artifacts/mobile/app/(tabs)/messages.tsx` | Mobile messaging screen |

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
| Mobile messaging: no read receipts, typing, attachments | Medium | Open |
| Mobile messaging: ~8 hardcoded English strings | Low | Open |
| Mobile wishlist: not implemented | Low | Open |
| heroBannerSystem recovery module false negative | Low | Known — expected (banner images require seeded DB) |
| Demo reviews don't seed on first run (bootstrap bug fixed June 14) | Fixed | `customer_id` → `user_id` column fix applied |

---

## Recovery Procedure (Quick Reference)

```bash
# 1. Install
pnpm install --force

# 2. Push schema
psql "$DATABASE_URL" -f schema.sql

# 3. Fix notification_type enum (if restoring from backup)
# Run the ALTER TYPE ADD VALUE block in RECOVERY_GUIDE.md Step 3

# 4. Build libs
npx tsc --build lib/db lib/api-zod lib/api-client-react

# 5. Start workflows
# API Server → run-migrations.ts runs → bootstrap accounts + 42 demo products seeded
# Marketplace + Mobile workflows
```

Recovery check endpoint: `GET /api/admin/recovery-check` (admin JWT required) → 95/100 expected.

See `RECOVERY_GUIDE.md` for full step-by-step instructions.
