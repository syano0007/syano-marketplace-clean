---
name: Semantic Search + Cache Layer Phase 8
description: Architecture decisions for the semantic search + in-memory LRU cache added to the SYANO search pipeline in June 2026.
---

## Cache Layer (searchCache.ts)
- `artifacts/api-server/src/services/searchCache.ts` — 500-entry LRU, O(1) get/set via doubly-linked list + Map.
- Cache key: `MD5(normalizeArabic(raw) + "|" + sortBy + "|" + JSON.stringify(filters))`.
- TTL tiers: 1 min (sale/new_arrivals), 10 min (fallback L4), 5 min all others.
- API exposes `getTTL(detectedIntent, fallbackLevel)` — imported into search.ts alongside `searchCache`.
- Admin endpoints: `GET /api/admin/search/cache` (stats + top queries), `DELETE /api/admin/search/cache` (flush).
- `searchCache.invalidate()` called on: product create/update/delete/discount (products.ts), reindex route (search.ts).
- Response includes `X-Cache: HIT | MISS` header.

## Semantic Search Infrastructure
- `artifacts/embedding-service/main.py` — FastAPI service on port 8001, model `intfloat/multilingual-e5-small` (384 dims).
  - `"query: "` prefix for queries, `"passage: "` for documents.
  - Endpoints: `POST /embed` (single), `POST /embed/batch` (up to 50).
- `EMBEDDING_SERVICE_URL` env var controls activation; 2-second hard timeout on all calls.
- `_embeddingServiceAvailable` and `_pgvectorAvailable` flags probed at startup (IIFE in search.ts).
- pgvector extension NOT available on current DB instance — migration catches error gracefully.

**Why:** Disk quota exceeded prevented `pip install sentence-transformers torch` during implementation. All infra is in place; set `EMBEDDING_SERVICE_URL=http://localhost:8001` + install packages + start the Python service to activate hybrid mode.

## Reciprocal Rank Fusion (RRF)
- Weights: FTS=0.65, semantic=0.35, k=60.
- Reorders existing FTS results only (no fetch for semantic-only products) — additive, never replaces FTS.
- `searchMode: "hybrid" | "fts_only"` + `semanticResultCount` in API response.

## Frontend (search/index.tsx)
- `apiEngineMode` variable extracted from `searchData?.searchMode` (avoids naming conflict with existing boolean `searchMode`).
- Violet "Smart search ✨" badge shown in chips row when `apiEngineMode === "hybrid"`.
- i18n keys: `search.semantic.smartSearch`, `search.semantic.hybridTooltip` in both en.json + ar.json.

## DB Schema
- `embedding_model` (text) and `embedded_at` (timestamp) columns on `products` table via `run-migrations.ts`.
- Backfill script: `artifacts/api-server/src/scripts/generateEmbeddings.ts` — run via `pnpm embed:generate`.
