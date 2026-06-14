import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { MAIN_CATEGORY_SLUGS } from "../categories";

const router: IRouter = Router();

interface SearchRow {
  id: number;
  seller_id: number;
  seller_name: string;
  name: string;
  description: string;
  price: string;
  discount_percent: string | null;
  category: string;
  subcategory: string | null;
  stock: number;
  image_url: string | null;
  featured: boolean;
  name_ar: string | null;
  created_at: Date;
  score: number;
}

interface StoreRow {
  user_id: number;
  store_name: string | null;
  store_slug: string | null;
  store_logo: string | null;
  categories: string[] | null;
  city: string | null;
  description: string | null;
}

function computeFinalPrice(price: string, discount: string | null): number {
  const p = parseFloat(price);
  if (!discount) return p;
  const d = parseFloat(discount);
  if (d <= 0 || d > 100) return p;
  return parseFloat((p * (1 - d / 100)).toFixed(2));
}

function trackQuery(rawTerm: string): void {
  const q = rawTerm.trim().toLowerCase().slice(0, 120);
  if (q.length < 2) return;
  pool.query(
    `INSERT INTO search_queries (query, count, last_searched)
     VALUES ($1, 1, NOW())
     ON CONFLICT (query) DO UPDATE
       SET count         = search_queries.count + 1,
           last_searched = NOW()`,
    [q],
  ).catch(() => {});
}

/**
 * GET /api/search?q=<term>&limit=<n>
 *
 * Dedicated search endpoint with pg_trgm relevance scoring.
 * Architecture:
 *   1. Exact name match          → score 1.00
 *   2. Name starts with term     → score 0.95
 *   3. Name contains term        → score 0.85
 *   4. pg_trgm word_similarity   → typo-tolerant fuzzy match (handles "phon"→"phone")
 *   5. Arabic name match         → score 0.85
 *   6. search_tokens match       → score 0.75 (pre-computed: name+nameAr+cat+subcat+desc)
 *   7. Category / subcategory    → score 0.65 / 0.55
 *   8. Description               → score 0.45
 */
router.get("/search", async (req, res): Promise<void> => {
  const raw = String(req.query.q ?? "").trim();
  if (raw.length < 2) {
    res.json([]);
    return;
  }

  const rawLimit = parseInt(String(req.query.limit ?? "10"), 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 50 ? rawLimit : 10;

  const term = raw.toLowerCase();
  const likePattern = `%${term}%`;

  trackQuery(raw);

  const { rows } = await pool.query<SearchRow>(
    `WITH scored AS (
      SELECT
        p.id,
        p.seller_id,
        u.name  AS seller_name,
        p.name,
        p.description,
        p.price::text,
        p.discount_percent::text,
        p.category,
        p.subcategory,
        p.stock,
        p.image_url,
        p.featured,
        p.name_ar,
        p.created_at,
        GREATEST(
          CASE WHEN lower(p.name) = $1                                  THEN 1.00 ELSE 0 END,
          CASE WHEN lower(p.name) LIKE $1 || '%'                        THEN 0.95 ELSE 0 END,
          CASE WHEN lower(p.name) LIKE $2                               THEN 0.85 ELSE 0 END,
          word_similarity($1, lower(p.name))                            * 0.90,
          CASE WHEN lower(COALESCE(p.name_ar,       '')) LIKE $2        THEN 0.85 ELSE 0 END,
          word_similarity($1, lower(COALESCE(p.name_ar, '')))           * 0.80,
          CASE WHEN lower(COALESCE(p.search_tokens, '')) LIKE $2        THEN 0.75 ELSE 0 END,
          word_similarity($1, lower(COALESCE(p.search_tokens, '')))     * 0.70,
          CASE WHEN lower(p.category)                    LIKE $2        THEN 0.65 ELSE 0 END,
          word_similarity($1, lower(p.category))                        * 0.60,
          CASE WHEN lower(COALESCE(p.subcategory,   '')) LIKE $2        THEN 0.55 ELSE 0 END,
          CASE WHEN lower(p.description)                 LIKE $2        THEN 0.45 ELSE 0 END,
          word_similarity($1, lower(p.description))                     * 0.35
        ) AS score
      FROM products p
      INNER JOIN users u ON u.id = p.seller_id
      WHERE
        p.stock > 0
        AND (
          lower(p.name)                        LIKE $2
          OR lower(COALESCE(p.name_ar,       '')) LIKE $2
          OR lower(COALESCE(p.search_tokens, '')) LIKE $2
          OR lower(p.category)                    LIKE $2
          OR lower(COALESCE(p.subcategory,   '')) LIKE $2
          OR lower(p.description)                 LIKE $2
          OR word_similarity($1, lower(p.name)) > 0.20
        )
    )
    SELECT * FROM scored
    WHERE score > 0
    ORDER BY score DESC
    LIMIT $3`,
    [term, likePattern, limit],
  );

  const result = rows.map((r) => ({
    id: r.id,
    sellerId: r.seller_id,
    sellerName: r.seller_name ?? "Unknown",
    name: r.name,
    description: r.description,
    price: parseFloat(r.price),
    discountPercent: r.discount_percent ? parseFloat(r.discount_percent) : null,
    finalPrice: computeFinalPrice(r.price, r.discount_percent),
    category: r.category,
    subcategory: r.subcategory ?? null,
    stock: r.stock,
    imageUrl: r.image_url ?? null,
    featured: r.featured,
    nameAr: r.name_ar ?? null,
    createdAt: r.created_at.toISOString(),
    score: Math.round(r.score * 100) / 100,
  }));

  res.setHeader("Cache-Control", "public, max-age=5, stale-while-revalidate=15");
  res.json(result);
});

/**
 * GET /api/search/suggestions?q=<term>
 *
 * Combined instant-search endpoint used by the Navbar overlay.
 * Returns { products[], stores[], categories[] } in a single round trip.
 */
router.get("/search/suggestions", async (req, res): Promise<void> => {
  const raw = String(req.query.q ?? "").trim();
  if (raw.length < 2) {
    res.json({ products: [], stores: [], categories: [] });
    return;
  }

  const term = raw.toLowerCase();
  const likePattern = `%${term}%`;

  const [productsRes, storesRes] = await Promise.all([
    pool.query<SearchRow>(
      `WITH scored AS (
        SELECT
          p.id, p.seller_id, u.name AS seller_name,
          p.name, p.description, p.price::text, p.discount_percent::text,
          p.category, p.subcategory, p.stock, p.image_url, p.featured,
          p.name_ar, p.created_at,
          GREATEST(
            CASE WHEN lower(p.name) = $1          THEN 1.00 ELSE 0 END,
            CASE WHEN lower(p.name) LIKE $1||'%'  THEN 0.95 ELSE 0 END,
            CASE WHEN lower(p.name) LIKE $2        THEN 0.85 ELSE 0 END,
            word_similarity($1, lower(p.name))     * 0.90,
            CASE WHEN lower(COALESCE(p.name_ar,'')) LIKE $2 THEN 0.85 ELSE 0 END,
            CASE WHEN lower(COALESCE(p.search_tokens,'')) LIKE $2 THEN 0.75 ELSE 0 END,
            CASE WHEN lower(p.category) LIKE $2   THEN 0.65 ELSE 0 END,
            CASE WHEN lower(p.description) LIKE $2 THEN 0.40 ELSE 0 END
          ) AS score
        FROM products p
        INNER JOIN users u ON u.id = p.seller_id
        WHERE p.stock > 0
          AND (
            lower(p.name)                          LIKE $2
            OR lower(COALESCE(p.name_ar,''))        LIKE $2
            OR lower(COALESCE(p.search_tokens,''))  LIKE $2
            OR lower(p.category)                    LIKE $2
            OR lower(p.description)                 LIKE $2
            OR word_similarity($1, lower(p.name)) > 0.20
          )
      )
      SELECT * FROM scored WHERE score > 0 ORDER BY score DESC LIMIT 5`,
      [term, likePattern],
    ),
    pool.query<StoreRow>(
      `SELECT
         sa.user_id, sa.store_name, sa.store_slug, sa.store_logo,
         sa.categories, sa.city, sa.description
       FROM seller_applications sa
       WHERE sa.status = 'approved'
         AND sa.store_name IS NOT NULL
         AND (
           lower(COALESCE(sa.store_name, '')) LIKE $1
           OR lower(COALESCE(sa.description, '')) LIKE $1
         )
       ORDER BY lower(sa.store_name) ASC
       LIMIT 4`,
      [likePattern],
    ),
  ]);

  const categories = MAIN_CATEGORY_SLUGS.filter((slug) =>
    slug.toLowerCase().includes(term),
  ).slice(0, 4);

  const products = productsRes.rows.map((r) => ({
    id: r.id,
    name: r.name,
    nameAr: r.name_ar ?? null,
    category: r.category,
    imageUrl: r.image_url ?? null,
    price: parseFloat(r.price),
    finalPrice: computeFinalPrice(r.price, r.discount_percent),
    discountPercent: r.discount_percent ? parseFloat(r.discount_percent) : null,
    score: Math.round((r.score ?? 0) * 100) / 100,
  }));

  const stores = storesRes.rows.map((r) => ({
    userId: r.user_id,
    storeName: r.store_name ?? "",
    storeSlug: r.store_slug ?? null,
    storeLogo: r.store_logo ?? null,
    categories: r.categories ?? [],
    city: r.city ?? null,
  }));

  res.setHeader("Cache-Control", "public, max-age=5, stale-while-revalidate=15");
  res.json({ products, stores, categories });
});

/**
 * GET /api/search/trending
 *
 * Returns the top popular search terms tracked server-side.
 */
router.get("/search/trending", async (_req, res): Promise<void> => {
  const { rows } = await pool.query<{ query: string; count: number }>(
    `SELECT query, count FROM search_queries ORDER BY count DESC LIMIT 12`,
  );
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
  res.json(rows.map((r) => ({ query: r.query, count: r.count })));
});

export default router;
