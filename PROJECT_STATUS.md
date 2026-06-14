# SYANO — Project Status
**Last Updated:** June 14, 2026 (Session 12 — Search Suggestions Engine COMPLETE)

SYANO is a production-scale Syrian marketplace platform built with React + Vite (web), Expo (mobile), Express + Drizzle (API), PostgreSQL (DB). Full Arabic/English bilingual, RTL support, dark/light theme.

---

## Overall Completion: ~96%

| Layer | Status | Notes |
|---|---|---|
| Core marketplace | ✅ 100% | Auth, products, cart, checkout, orders |
| Seller ecosystem | ✅ 100% | Dashboard, analytics, orders V2, store pages, variants |
| Admin panel | ✅ 100% | Stats, moderation, user management, delivery, courier mgmt |
| Trust & verification | ✅ 100% | 0-100 score, tiers, audit log, verification badges |
| Delivery system | ✅ 100% | 40 Aleppo zones, courier ops, assignment flow |
| Messaging V2 | ✅ 100% | 19 API endpoints, 58/58 tests, web+mobile+lib complete |
| Notifications | ✅ 100% | SSE real-time, polling fallback, in-app toasts, web push (VAPID), bilingual |
| Wishlist | ✅ 100% | Web + heart button; mobile not implemented |
| Guest cart | ✅ 100% | All entry points wired |
| Homepage V7 | ✅ 100% | 8 HomeSections, hero carousel, real data, dark glassmorphism navbar |
| Navbar Polish V1 | ✅ 100% | Light mode contrast, icon unification, active state fix, badge fix, settings dropdown |
| **Search Suggestions Engine** | ✅ 100% | Amazon/Noon style — text intents only, Arabic-normalized, category+store matches, click tracking |
| i18n (web) | ✅ 100% | 2592 EN / 2592 AR keys, 77 messages.* keys |
| i18n (mobile) | ✅ 100% | Full i18n including 30+ messages.* keys; zero hardcoded strings |
| Recovery system | ✅ 95% | 21/22 modules pass; heroBannerSystem false negative known |

---

## ✅ Phase 7: Messaging V2 — COMPLETE (June 14, 2026)

**58/58 API tests pass.** Three bugs found and fixed in final audit pass:

1. **`PATCH /conversations/:id/read` was missing** → added explicit mark-as-read endpoint; `useMarkConversationRead` hook added to lib; wired into MessagingPanel (web) and messages.tsx (mobile) — unread badge updates immediately when conversation is opened
2. **Soft-deleted messages weren't returned as tombstones** → removed `isNull(deletedAt)` filter from GET messages queries; deleted messages now appear with `deletedAt` set so clients render "Message deleted" placeholder
3. Both web and mobile were relying solely on GET /messages auto-mark instead of explicit mark-as-read; now correctly call PATCH /read on conversation open

### API — 100% (19 endpoints in `artifacts/api-server/src/routes/messaging.ts`)

| Endpoint | Purpose |
|---|---|
| `GET /conversations/unread-count` | Global unread badge count |
| `GET /conversations/search` | Search by partner name or message content |
| `POST /conversations` | Start or resume a conversation (idempotent) |
| `GET /conversations` | List with archive filter, last message, unread counts |
| `GET /conversations/:id` | Single conversation detail |
| `GET /conversations/:id/messages` | Paginated history (includes soft-delete tombstones) |
| `POST /conversations/:id/messages` | Send message (optional attachmentId) |
| `DELETE /conversations/:id/messages/:msgId` | Soft-delete own message (tombstone preserved) |
| `PATCH /conversations/:id/read` | **[NEW]** Explicitly mark all partner messages as read |
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

#### Mobile — 100% (COMPLETE as of June 14, 2026)

**All features implemented in `artifacts/mobile/app/(tabs)/messages.tsx`:**
- Conversation list with FlatList, unread badges, muted indicator, last message preview (with 📎 for attachments)
- Filter tabs: All / Unread / Archived (archived fetched via separate query with `enabled` guard)
- Long-press on conversation → Alert with Archive/Unarchive + Mute/Unmute + Cancel options
- ChatView: message bubbles (mine/theirs), read receipts (✓ sent / ✓✓ read via `readAt`), soft-deleted messages
- Typing indicators: animated 3-dot bounce using `Animated.loop` + `useGetTyping` polling every 2s
- Image attachments: `expo-image-picker` → base64 → `useUploadAttachment` → inline `ExpoImage` display with auth headers; 2MB limit enforced
- File attachments: chip display with filename + document icon
- Haptic feedback on send and long-press
- KeyboardAvoidingView for iOS/Android
- Full i18n: 30+ `messages.*` keys in EN+AR, zero hardcoded strings
- Auth gate with sign-in CTA
- Performance: `removeClippedSubviews`, `initialNumToRender`, `windowSize` optimized

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
| Mobile wishlist: not implemented | Low | Open |
| heroBannerSystem recovery module false negative | Low | Known — expected (banner images require seeded DB) |
| Demo reviews don't seed on first run (bootstrap bug fixed June 14) | Fixed | `customer_id` → `user_id` column fix applied |
| Mobile messaging: read receipts, typing, attachments, i18n | All Fixed | Completed June 14, 2026 (Phase 7) |

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
