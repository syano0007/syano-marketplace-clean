---
name: Search Suggestions Engine
description: Architecture and guard patterns for the Amazon/Noon-style search suggestion dropdown — text intents only, no product cards.
---

## Rule
`GET /api/search/suggestions?q=<term>` returns `{ suggestions[], categories[], stores[], trending[] }` — never product images or prices.

**Why:** UX spec: text-intent phrases only in dropdown (Amazon/Noon behavior). Product results live on the search results page, not the dropdown.

## How to apply

### API shape (search.ts)
```ts
interface SuggestionItem { text: string; textAr: string | null }
interface CategoryItem   { slug: string; labelEn: string; labelAr: string }
interface StoreItem      { userId: number; storeName: string; storeSlug: string | null; storeLogo: string | null; city: string | null }
interface TrendingQuery  { query: string; count: number }
// Response: { suggestions, categories, stores, trending }
```

- `suggestions` generated from real product `name`/`name_ar` (not hardcoded) — max 7
- Arabic normalizer: `أإآ→ا`, `ة→ه`, `ى→ي`, strips diacritics (U+064B–U+065F+U+0670)
- Trending always included (returned even for empty query)
- Query tracking via `search_queries` table upsert on every call
- Click analytics: `POST /api/search/track-click` — fire-and-forget from frontend
- CATEGORY_LABELS map in search.ts has all 17 categories with EN+AR labels

### Frontend hook (use-search.ts)
- `useSearchSuggestions(rawQuery)` → `{ suggestions: SuggestionResult, isLoading, hasQuery }`
- `SuggestionResult` = `{ suggestions: SuggestionItem[], categories: CategoryItem[], stores: SuggestionStore[], trending: TrendingQuery[] }`
- Query key: `["search/suggestions/v2", dq]` — v2 suffix avoids stale cache from old shape that had `.products` instead of `.suggestions`
- `trackSearchClick(term, type)` — exported from use-search.ts, fire-and-forget

### Navbar guard pattern (HMR-safe)
Every access to `suggestions.*` uses null-coalescing:
```tsx
(suggestions.suggestions?.length ?? 0) > 0
(suggestions.suggestions ?? []).slice(0, 6).map(...)
(suggestions.categories?.length ?? 0) > 0
(suggestions.stores ?? []).slice(0, 3).map(...)
```
**Why:** HMR can leave stale TanStack Query data with old shape (`{ products }` not `{ suggestions }`) before the component fully remounts. `// @refresh reset` is already in Navbar.tsx but is insufficient alone.

### Mobile (index.tsx)
- State: `searchFocused`, `mobileSuggestions: MobileSuggestions`
- Fetch: `useEffect` on `debouncedSearch` → `fetch(${getBaseUrl()}/search/suggestions?q=...)`
- Render: inline View inside `shopHeader` (ListHeaderComponent), not an absolute overlay
- Tap suggestion: `setSearch(text)` + `setDebouncedSearch(text)` → triggers inline product filter
- Styles: `suggStyles` StyleSheet (overlay, row, rowText, catBadge)
