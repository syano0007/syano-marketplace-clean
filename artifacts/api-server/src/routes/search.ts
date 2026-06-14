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

interface ProductNameRow {
  name: string;
  name_ar: string | null;
  category: string;
  subcategory: string | null;
}

/* ── Arabic normalizer ──────────────────────────────────────────────────────
   Normalizes common Arabic letter variants for fuzzy matching.
   أ إ آ → ا  |  ة → ه  |  ى → ي  |  strips diacritics
─────────────────────────────────────────────────────────────────────────── */
function normalizeAr(s: string): string {
  return s
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .toLowerCase()
    .trim();
}

/* ── Category labels (EN + AR) ──────────────────────────────────────────── */
const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  "Electronics":            { en: "Electronics",            ar: "إلكترونيات" },
  "Fashion":                { en: "Fashion",                ar: "أزياء وموضة" },
  "Beauty & Personal Care": { en: "Beauty & Personal Care", ar: "جمال وعناية" },
  "Home & Kitchen":         { en: "Home & Kitchen",         ar: "منزل ومطبخ" },
  "Supermarket & Grocery":  { en: "Supermarket & Grocery",  ar: "بقالة وسوبرماركت" },
  "Sports & Fitness":       { en: "Sports & Fitness",       ar: "رياضة ولياقة" },
  "Automotive":             { en: "Automotive",             ar: "سيارات ومركبات" },
  "Gaming & Entertainment": { en: "Gaming & Entertainment", ar: "ألعاب وترفيه" },
  "Books & Stationery":     { en: "Books & Stationery",     ar: "كتب وقرطاسية" },
  "Pet Supplies":           { en: "Pet Supplies",           ar: "مستلزمات حيوانات" },
  "Digital Products":       { en: "Digital Products",       ar: "منتجات رقمية" },
  "Handmade & Crafts":      { en: "Handmade & Crafts",      ar: "مصنوعات يدوية" },
  "Jewelry & Luxury":       { en: "Jewelry & Luxury",       ar: "مجوهرات وكماليات" },
  "Baby & Kids":            { en: "Baby & Kids",            ar: "أطفال ورضع" },
  "Tools & Construction":   { en: "Tools & Construction",   ar: "أدوات وبناء" },
  "Garden & Outdoor":       { en: "Garden & Outdoor",       ar: "حديقة وخارجي" },
  "Gifts & Events":         { en: "Gifts & Events",         ar: "هدايا ومناسبات" },
};

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
 * Marketplace-grade search suggestion engine (Amazon / Noon style).
 * Returns search INTENTS — text phrases to search for — NOT product cards.
 *
 * Response shape:
 *   { suggestions[], categories[], stores[], trending[] }
 *
 * suggestions: text phrases derived from real product names & categories
 * categories:  matching main categories with EN + AR labels
 * stores:      matching approved stores
 * trending:    popular search terms (always included, capped at 6)
 *
 * No product images, prices, or ratings are returned.
 */
router.get("/search/suggestions", async (req, res): Promise<void> => {
  const raw = String(req.query.q ?? "").trim();
  const term = raw.toLowerCase();
  const normTerm = normalizeAr(term);
  const likePattern = `%${term}%`;

  /* ── Trending (always returned) ─────────────────────────────────────── */
  const trendingPromise = pool.query<{ query: string; count: number }>(
    `SELECT query, count FROM search_queries ORDER BY count DESC, last_searched DESC LIMIT 6`,
  );

  if (raw.length < 2) {
    const trending = await trendingPromise;
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.json({
      suggestions: [],
      categories: [],
      stores: [],
      trending: trending.rows.map((r) => ({ query: r.query, count: r.count })),
    });
    return;
  }

  /* ── Parallel fetches ────────────────────────────────────────────────── */
  const [productNamesRes, storesRes, trendingRes] = await Promise.all([
    /* Product names — for intent generation */
    pool.query<ProductNameRow>(
      `SELECT DISTINCT p.name, p.name_ar, p.category, p.subcategory
       FROM products p
       WHERE p.stock > 0
         AND (
           lower(p.name)                          LIKE $2
           OR lower(COALESCE(p.name_ar,''))        LIKE $2
           OR lower(COALESCE(p.search_tokens,''))  LIKE $2
           OR lower(p.category)                    LIKE $2
           OR lower(COALESCE(p.subcategory,''))     LIKE $2
           OR word_similarity($1, lower(p.name))  > 0.25
         )
       LIMIT 24`,
      [term, likePattern],
    ),
    /* Stores */
    pool.query<StoreRow>(
      `SELECT sa.user_id, sa.store_name, sa.store_slug, sa.store_logo, sa.city
       FROM seller_applications sa
       WHERE sa.status = 'approved'
         AND sa.store_name IS NOT NULL
         AND (
           lower(COALESCE(sa.store_name,''))   LIKE $1
           OR lower(COALESCE(sa.description,'')) LIKE $1
         )
       ORDER BY lower(sa.store_name) ASC
       LIMIT 3`,
      [likePattern],
    ),
    trendingPromise,
  ]);

  /* ── Build suggestion phrases from real product data ─────────────────── */
  const seenNorm = new Set<string>();
  const suggestions: { text: string; textAr: string | null }[] = [];

  function addSuggestion(text: string, textAr: string | null) {
    if (suggestions.length >= 7) return;
    // Deduplicate by normalized key (use whichever text is available)
    const key = normalizeAr(textAr ?? text).slice(0, 50);
    const engKey = text.toLowerCase().slice(0, 50);
    if (seenNorm.has(key) || seenNorm.has(engKey)) return;
    seenNorm.add(key);
    seenNorm.add(engKey);
    suggestions.push({ text, textAr });
  }

  for (const row of productNamesRes.rows) {
    const arName = row.name_ar ?? null;
    const enName = row.name;

    // Arabic name matches the query (normalized comparison)
    if (arName) {
      const normAr = normalizeAr(arName);
      if (normAr.includes(normTerm) || normTerm.length >= 3 && normAr.includes(normTerm.slice(0, -1))) {
        addSuggestion(enName, arName);
        continue;
      }
    }
    // English name matches
    if (enName.toLowerCase().includes(term)) {
      addSuggestion(enName, arName);
    }
  }

  // Category-level suggestions: "{query} in {subcategory}" from matched products
  // Only add if we have fewer than 5 suggestions so far
  if (suggestions.length < 5) {
    const subcatCounts: Record<string, number> = {};
    for (const row of productNamesRes.rows) {
      if (row.subcategory) {
        subcatCounts[row.subcategory] = (subcatCounts[row.subcategory] ?? 0) + 1;
      }
    }
    const topSubcats = Object.entries(subcatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sc]) => sc);

    for (const subcat of topSubcats) {
      if (suggestions.length >= 7) break;
      const combined = `${raw} ${subcat}`;
      addSuggestion(combined, null);
    }
  }

  /* ── Category matches with EN + AR labels ────────────────────────────── */
  const normTermFull = normalizeAr(raw);
  const categories = MAIN_CATEGORY_SLUGS.filter((slug) => {
    const label = CATEGORY_LABELS[slug];
    if (!label) return false;
    return (
      slug.toLowerCase().includes(term) ||
      label.en.toLowerCase().includes(term) ||
      normalizeAr(label.ar).includes(normTermFull)
    );
  })
    .slice(0, 4)
    .map((slug) => ({
      slug,
      labelEn: CATEGORY_LABELS[slug]?.en ?? slug,
      labelAr: CATEGORY_LABELS[slug]?.ar ?? slug,
    }));

  /* ── Stores ──────────────────────────────────────────────────────────── */
  const stores = storesRes.rows.map((r) => ({
    userId: r.user_id,
    storeName: r.store_name ?? "",
    storeSlug: r.store_slug ?? null,
    storeLogo: r.store_logo ?? null,
    city: r.city ?? null,
  }));

  /* ── Trending ────────────────────────────────────────────────────────── */
  const trending = trendingRes.rows.map((r) => ({ query: r.query, count: r.count }));

  res.setHeader("Cache-Control", "public, max-age=5, stale-while-revalidate=15");
  res.json({ suggestions, categories, stores, trending });
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

/**
 * POST /api/search/track-click
 *
 * Analytics foundation — track suggestion/category/store clicks.
 * Body: { term: string, type: 'suggestion' | 'category' | 'store' }
 */
router.post("/search/track-click", async (req, res): Promise<void> => {
  const { term, type } = req.body as { term?: string; type?: string };
  if (term && typeof term === "string" && term.trim().length >= 2) {
    trackQuery(term.trim());
  }
  res.json({ ok: true });
});

export default router;
