// @ts-strict-ignore — enterprise search engine with dynamic SQL construction
import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { MAIN_CATEGORY_SLUGS } from "../categories";
import { processSearchQuery } from "../utils/searchProcessor";

const router: IRouter = Router();

/* ═══════════════════════════════════════════════════════════════════════════
   I.  ARABIC NLP — normalizeArabic
   ═══════════════════════════════════════════════════════════════════════════
   Strips diacritics, normalises all common variant letter forms so that
   fuzzy matching is robust regardless of input encoding choice.
   ─────────────────────────────────────────────────────────────────────── */
function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/* ═══════════════════════════════════════════════════════════════════════════
   II. SYRIAN DIALECT & INTENT DICTIONARY
   ═══════════════════════════════════════════════════════════════════════════
   Maps colloquial Syrian Arabic terms → standard DB categories + keywords.
   ─────────────────────────────────────────────────────────────────────── */
const SYRIAN_DIALECT_DICTIONARY: Record<string, { category: string; keywords: string[] }> = {
  // Shoes
  "بواط":   { category: "Fashion", keywords: ["أحذية", "أحذية رياضية", "بوط", "سناكرز"] },
  "بوط":    { category: "Fashion", keywords: ["أحذية", "أحذية رياضية", "سبور"] },
  "شحاطات": { category: "Fashion", keywords: ["أحذية", "شحاطة", "صنادل", "نعال"] },
  "شحاطة":  { category: "Fashion", keywords: ["أحذية", "شحاطة", "صندل"] },
  "صباط":   { category: "Fashion", keywords: ["أحذية", "أحذية رسمية", "كندرة"] },
  "صبابيط": { category: "Fashion", keywords: ["أحذية", "أحذية رسمية"] },
  "كندرة":  { category: "Fashion", keywords: ["أحذية", "أحذية رسمية", "كعب عالي"] },
  "كنادر":  { category: "Fashion", keywords: ["أحذية", "أحذية رسمية"] },
  "جزمة":   { category: "Fashion", keywords: ["أحذية", "جزمات", "بوط شتوي", "أحذية طويلة"] },
  "جزم":    { category: "Fashion", keywords: ["أحذية", "جزمات"] },
  "بابوج":  { category: "Fashion", keywords: ["أحذية", "خف منزل", "شحاطة بيت"] },
  // Clothing
  "أواعي":   { category: "Fashion", keywords: ["ملابس", "أزياء", "ثياب"] },
  "ثياب":    { category: "Fashion", keywords: ["ملابس", "أزياء"] },
  "لبس":     { category: "Fashion", keywords: ["ملابس", "أزياء"] },
  "هدوم":    { category: "Fashion", keywords: ["ملابس", "ثياب"] },
  "كسوة":    { category: "Fashion", keywords: ["ملابس", "تجهيز العرائس"] },
  "مانطو":   { category: "Fashion", keywords: ["ملابس نسائية", "جاكيت طويل", "بالطو"] },
  "مانطويا": { category: "Fashion", keywords: ["ملابس نسائية", "جاكيتات"] },
  "كنزة":    { category: "Fashion", keywords: ["ملابس", "بلوزة", "سويتر", "تيشيرت"] },
  "تناوير":  { category: "Fashion", keywords: ["ملابس نسائية", "تنورة"] },
  "فستان":   { category: "Fashion", keywords: ["ملابس نسائية", "فساتين", "سهرة"] },
  "دشاديش":  { category: "Fashion", keywords: ["ملابس رجالية", "جلابيات"] },
  "كلابية":  { category: "Fashion", keywords: ["ملابس", "جلابية"] },
  "بجامة":   { category: "Fashion", keywords: ["ملابس نوم", "بيجامات", "ترينغ"] },
  "ترينغ":   { category: "Fashion", keywords: ["ملابس رياضية", "بيجامة سبور"] },
  // Electronics
  "موبايل":   { category: "Electronics", keywords: ["هواتف ذكية", "جوالات", "موبايلات"] },
  "جوال":     { category: "Electronics", keywords: ["هواتف ذكية", "موبايل"] },
  "خليوي":    { category: "Electronics", keywords: ["هواتف ذكية", "جوال"] },
  "تليفون":   { category: "Electronics", keywords: ["هواتف ذكية", "موبايلات"] },
  "شاشة":     { category: "Electronics", keywords: ["تلفزيونات", "شاشات ذكية", "TV"] },
  "تلفزيون":  { category: "Electronics", keywords: ["شاشات", "تلفزيونات"] },
  "لابتوب":   { category: "Electronics", keywords: ["كمبيوترات محمولة", "حاسوب", "لاب توب"] },
  "كمبيوتر":  { category: "Electronics", keywords: ["حاسوب", "أجهزة مكتبية", "PC"] },
  "وصلة":     { category: "Electronics", keywords: ["كابلات", "شواحن", "وصلة شحن"] },
  "باوربانك": { category: "Electronics", keywords: ["بنك طاقة", "شاحن سفري"] },
  "سماعات":   { category: "Electronics", keywords: ["سماعات أذن", "هيدفون", "ايربودز"] },
  // Home & Kitchen
  "غراض بيت": { category: "Home & Kitchen", keywords: ["أدوات منزلية", "ديكور", "أثاث"] },
  "طناجر":    { category: "Home & Kitchen", keywords: ["أدوات المطبخ", "طنجرة", "قدور طبخ"] },
  "صحون":     { category: "Home & Kitchen", keywords: ["أدوات المطبخ", "أطباق"] },
  "معالق":    { category: "Home & Kitchen", keywords: ["أدوات المطبخ", "ملاعق"] },
  "كاسات":    { category: "Home & Kitchen", keywords: ["أدوات المطبخ", "أكواب"] },
  "حرامات":   { category: "Home & Kitchen", keywords: ["مفروشات", "بطانيات", "لحف"] },
  "برداية":   { category: "Home & Kitchen", keywords: ["ستائر", "برادي"] },
  "برادي":    { category: "Home & Kitchen", keywords: ["ستائر", "مفروشات"] },
  "صوبيا":    { category: "Home & Kitchen", keywords: ["وسائل تدفئة", "مدفأة", "صوبيات"] },
  "نملية":    { category: "Home & Kitchen", keywords: ["خزائن مطبخ", "منظمات"] },
  // Groceries
  "مونة":        { category: "Supermarket & Grocery", keywords: ["أغذية مجففة", "زيت زيتون", "مكدوس", "تموين"] },
  "غراض طبق":   { category: "Supermarket & Grocery", keywords: ["خضروات", "لحوم", "مواد غذائية"] },
  "أكل":         { category: "Supermarket & Grocery", keywords: ["سوبرماركت", "مواد غذائية"] },
  "بزر":         { category: "Supermarket & Grocery", keywords: ["مكسرات", "تسالي"] },
  "سكاكر":       { category: "Supermarket & Grocery", keywords: ["حلويات", "بسكويت", "شوكولا"] },
  // Beauty
  "مكياجات": { category: "Beauty & Personal Care", keywords: ["مكياج", "مستحضرات تجميل"] },
  "حمرة":     { category: "Beauty & Personal Care", keywords: ["أحمر شفاه", "مكياج"] },
  "ريحة":     { category: "Beauty & Personal Care", keywords: ["عطور", "برفيوم"] },
  "عطورات":   { category: "Beauty & Personal Care", keywords: ["عطور", "برفيوم"] },
};

/* Intent modifiers: detected in query to adjust sort/filter strategy */
const INTENT_MODIFIERS = {
  cheap:   ["رخيص", "لقطة", "ببلاش", "على قد الايد", "اقتصادي", "حرق", "تنزيلات", "عروض", "كسر", "cheap", "budget"],
  premium: ["غالي", "فخم", "اصلي", "نخب اول", "ماركة", "براند", "ملوكي", "ممتاز", "وكالة", "premium", "luxury", "branded"],
  used:    ["مستعمل", "شغال", "نضيف", "نص عمر", "بحالة الوكالة", "used", "second hand"],
} as const;

type IntentModifier = keyof typeof INTENT_MODIFIERS;

/* ═══════════════════════════════════════════════════════════════════════════
   III. INTENT PARSING PIPELINE
   ═══════════════════════════════════════════════════════════════════════════ */
interface ParsedIntent {
  modifiers: IntentModifier[];
  mappedCategory: string | null;
  expandedTerms: string[];
  baseTokens: string[];
  expandedQuery: string;
}

function parseIntent(rawQuery: string): ParsedIntent {
  const norm = normalizeArabic(rawQuery);
  const tokens = norm.split(/\s+/).filter(Boolean);

  const modifiers: IntentModifier[] = [];
  for (const [mod, words] of Object.entries(INTENT_MODIFIERS) as [IntentModifier, readonly string[]][]) {
    const normWords = words.map(normalizeArabic);
    if (tokens.some(t => normWords.includes(t))) modifiers.push(mod);
  }

  let mappedCategory: string | null = null;
  const expandedTerms: string[] = [];
  const dialectTokens = new Set<string>();

  for (const token of tokens) {
    const entry = SYRIAN_DIALECT_DICTIONARY[token];
    if (entry) {
      if (!mappedCategory) mappedCategory = entry.category;
      expandedTerms.push(...entry.keywords);
      dialectTokens.add(token);
    }
  }

  for (const [key, entry] of Object.entries(SYRIAN_DIALECT_DICTIONARY)) {
    if (key.includes(" ") && norm.includes(normalizeArabic(key))) {
      if (!mappedCategory) mappedCategory = entry.category;
      expandedTerms.push(...entry.keywords);
    }
  }

  const baseTokens = tokens.filter(t => !dialectTokens.has(t));
  const expandedQuery = [...new Set([...baseTokens, ...expandedTerms])].join(" ");

  return { modifiers, mappedCategory, expandedTerms, baseTokens, expandedQuery };
}

/* ═══════════════════════════════════════════════════════════════════════════
   IV. CATEGORY LABELS (EN + AR) — for /suggestions endpoint
   ═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   V.  UTILITIES
   ═══════════════════════════════════════════════════════════════════════════ */
function computeFinalPrice(price: number, discountPercent: number | null): number {
  if (!discountPercent || discountPercent <= 0) return price;
  return parseFloat((price * (1 - discountPercent / 100)).toFixed(2));
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

function makeParamBuilder() {
  const params: unknown[] = [];
  return {
    add(val: unknown): string { params.push(val); return `$${params.length}`; },
    get values(): unknown[] { return params; },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   VI.  NLP HELPERS — tsquery construction
   ═══════════════════════════════════════════════════════════════════════════
   Converts an array of NLP-pipeline tokens into a valid PostgreSQL tsquery
   string for the 'simple' dictionary.

   Rules:
     • Strip everything except Unicode letters, digits — prevents tsquery
       syntax injection and ensures 'simple' dictionary accepts each lexeme.
     • Cap at 30 terms to keep query complexity bounded.
     • Return null when the cleaned list is empty (triggers trigram-only mode).
   ─────────────────────────────────────────────────────────────────────── */

/**
 * Build an OR tsquery string: "term1 | term2 | term3"
 * Used for the broad expanded-token match (any synonym fires).
 */
function buildOrTsQuery(tokens: readonly string[]): string | null {
  const lexemes = tokens
    .map(t => t.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase())
    .filter(t => t.length > 1);
  if (lexemes.length === 0) return null;
  return [...new Set(lexemes)].slice(0, 30).join(" | ");
}

/**
 * Build an AND tsquery string: "term1 & term2"
 * Used for the precision boost — products matching ALL base tokens rank higher.
 */
function buildAndTsQuery(tokens: readonly string[]): string | null {
  const lexemes = tokens
    .map(t => t.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase())
    .filter(t => t.length > 1);
  if (lexemes.length === 0) return null;
  return [...new Set(lexemes)].slice(0, 10).join(" & ");
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROUTE 1 — GET /api/search
   ═══════════════════════════════════════════════════════════════════════════
   Legacy search endpoint — dialect-enhanced LIKE + trigram scoring.
   ─────────────────────────────────────────────────────────────────────── */
router.get("/search", async (req, res): Promise<void> => {
  const raw = String(req.query.q ?? "").trim();
  if (raw.length < 2) { res.json([]); return; }

  const rawLimit = parseInt(String(req.query.limit ?? "10"), 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 50 ? rawLimit : 10;

  const intent = parseIntent(raw);
  const term = normalizeArabic(raw);
  const likePattern = `%${term}%`;
  const expandedLike = `%${normalizeArabic(intent.expandedQuery)}%`;

  trackQuery(raw);

  const pb = makeParamBuilder();
  const pTerm        = pb.add(term);
  const pLike        = pb.add(likePattern);
  const pExpanded    = pb.add(intent.expandedQuery);
  const pExpandedLike= pb.add(expandedLike);
  const pMappedCat   = pb.add(intent.mappedCategory?.toLowerCase() ?? null);
  const pLimit       = pb.add(limit);

  const { rows } = await pool.query(
    `WITH scored AS (
      SELECT
        p.id, p.seller_id,
        u.name  AS seller_name,
        p.name, p.description,
        p.price::text,
        p.discount_percent::text,
        p.category, p.subcategory, p.stock,
        p.image_url, p.featured, p.name_ar, p.created_at,
        GREATEST(
          CASE WHEN ${pMappedCat}::text IS NOT NULL
               AND lower(p.category) = ${pMappedCat}::text THEN 1.00 ELSE 0 END,
          CASE WHEN lower(p.name) = ${pTerm}             THEN 0.95 ELSE 0 END,
          CASE WHEN lower(p.name) LIKE ${pTerm} || '%'   THEN 0.90 ELSE 0 END,
          CASE WHEN lower(p.name) LIKE ${pLike}          THEN 0.80 ELSE 0 END,
          word_similarity(${pTerm}, lower(p.name))                    * 0.75,
          CASE WHEN lower(COALESCE(p.name_ar,'')) LIKE ${pLike}
                                                          THEN 0.80 ELSE 0 END,
          word_similarity(${pTerm}, lower(COALESCE(p.name_ar,'')))    * 0.75,
          CASE WHEN lower(COALESCE(p.search_tokens,'')) LIKE ${pExpandedLike}
                                                          THEN 0.55 ELSE 0 END,
          word_similarity(${pExpanded}, lower(COALESCE(p.search_tokens,''))) * 0.50,
          CASE WHEN lower(p.description) LIKE ${pLike}   THEN 0.30 ELSE 0 END,
          word_similarity(${pTerm}, lower(p.description))             * 0.20
        ) AS score
      FROM products p
      INNER JOIN users u ON u.id = p.seller_id
      WHERE p.stock > 0
        AND (
          lower(p.name)                          LIKE ${pLike}
          OR lower(COALESCE(p.name_ar,''))        LIKE ${pLike}
          OR lower(COALESCE(p.search_tokens,''))  LIKE ${pExpandedLike}
          OR lower(p.description)                 LIKE ${pLike}
          OR (${pMappedCat}::text IS NOT NULL AND lower(p.category) = ${pMappedCat}::text)
          OR word_similarity(${pTerm}, lower(p.name)) > 0.20
          OR word_similarity(${pTerm}, lower(COALESCE(p.name_ar,''))) > 0.20
        )
    )
    SELECT * FROM scored WHERE score > 0
    ORDER BY score DESC
    LIMIT ${pLimit}`,
    pb.values,
  );

  const result = rows.map((r: any) => ({
    id: r.id,
    sellerId: r.seller_id,
    sellerName: r.seller_name ?? "Unknown",
    name: r.name,
    description: r.description,
    price: parseFloat(r.price),
    discountPercent: r.discount_percent ? parseFloat(r.discount_percent) : null,
    finalPrice: computeFinalPrice(parseFloat(r.price), r.discount_percent ? parseFloat(r.discount_percent) : null),
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

/* ═══════════════════════════════════════════════════════════════════════════
   ROUTE 2 — GET /api/search/suggestions
   ═══════════════════════════════════════════════════════════════════════════
   Text-intent phrases only. Response: { suggestions[], categories[], stores[], trending[] }
   ─────────────────────────────────────────────────────────────────────── */
router.get("/search/suggestions", async (req, res): Promise<void> => {
  const raw = String(req.query.q ?? "").trim();
  const term = normalizeArabic(raw);
  const likePattern = `%${term}%`;

  const trendingPromise = pool.query<{ query: string; count: number }>(
    `SELECT query, count FROM search_queries ORDER BY count DESC, last_searched DESC LIMIT 6`,
  );

  if (raw.length < 2) {
    const trending = await trendingPromise;
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.json({ suggestions: [], categories: [], stores: [], trending: trending.rows });
    return;
  }

  const intent = parseIntent(raw);
  const expandedLike = `%${normalizeArabic(intent.expandedQuery)}%`;

  const [productNamesRes, storesRes, trendingRes] = await Promise.all([
    pool.query<{ name: string; name_ar: string | null; category: string; subcategory: string | null }>(
      `SELECT DISTINCT p.name, p.name_ar, p.category, p.subcategory
       FROM products p
       WHERE p.stock > 0
         AND (
           lower(p.name)                          LIKE $1
           OR lower(COALESCE(p.name_ar,''))        LIKE $1
           OR lower(COALESCE(p.search_tokens,''))  LIKE $2
           OR lower(p.category)                    LIKE $1
           OR lower(COALESCE(p.subcategory,''))     LIKE $1
           OR ($3::text IS NOT NULL AND lower(p.category) = $3::text)
           OR word_similarity($4, lower(p.name))  > 0.25
         )
       LIMIT 24`,
      [likePattern, expandedLike, intent.mappedCategory?.toLowerCase() ?? null, term],
    ),
    pool.query<{ user_id: number; store_name: string | null; store_slug: string | null; store_logo: string | null; city: string | null }>(
      `SELECT sa.user_id, sa.store_name, sa.store_slug, sa.store_logo, sa.city
       FROM seller_applications sa
       WHERE sa.status = 'approved'
         AND sa.store_name IS NOT NULL
         AND lower(COALESCE(sa.store_name,'')) LIKE $1
       ORDER BY lower(sa.store_name) ASC LIMIT 3`,
      [likePattern],
    ),
    trendingPromise,
  ]);

  const seen = new Set<string>();
  const suggestions: { text: string; textAr: string | null }[] = [];

  function addSuggestion(text: string, textAr: string | null) {
    if (suggestions.length >= 7) return;
    const key = normalizeArabic(textAr ?? text).slice(0, 50);
    const engKey = text.toLowerCase().slice(0, 50);
    if (seen.has(key) || seen.has(engKey)) return;
    seen.add(key); seen.add(engKey);
    suggestions.push({ text, textAr });
  }

  if (intent.expandedTerms.length > 0) {
    for (const kw of intent.expandedTerms.slice(0, 3)) addSuggestion(kw, null);
  }

  for (const row of productNamesRes.rows) {
    const arName = row.name_ar ?? null;
    const enName = row.name;
    if (arName) {
      const normAr = normalizeArabic(arName);
      if (normAr.includes(term)) { addSuggestion(enName, arName); continue; }
    }
    if (enName.toLowerCase().includes(raw.toLowerCase())) addSuggestion(enName, arName);
  }

  if (suggestions.length < 5) {
    const subcatCounts: Record<string, number> = {};
    for (const row of productNamesRes.rows) {
      if (row.subcategory) subcatCounts[row.subcategory] = (subcatCounts[row.subcategory] ?? 0) + 1;
    }
    Object.entries(subcatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([sc]) => addSuggestion(`${raw} ${sc}`, null));
  }

  const normRaw = normalizeArabic(raw);
  const priorityCat = intent.mappedCategory;
  const categories = [
    ...MAIN_CATEGORY_SLUGS.filter(s => s === priorityCat),
    ...MAIN_CATEGORY_SLUGS.filter(s => s !== priorityCat && (
      s.toLowerCase().includes(raw.toLowerCase()) ||
      (CATEGORY_LABELS[s]?.en ?? "").toLowerCase().includes(raw.toLowerCase()) ||
      normalizeArabic(CATEGORY_LABELS[s]?.ar ?? "").includes(normRaw)
    )),
  ]
    .slice(0, 4)
    .map(slug => ({
      slug,
      labelEn: CATEGORY_LABELS[slug]?.en ?? slug,
      labelAr: CATEGORY_LABELS[slug]?.ar ?? slug,
    }));

  const stores = storesRes.rows.map(r => ({
    userId: r.user_id,
    storeName: r.store_name ?? "",
    storeSlug: r.store_slug ?? null,
    storeLogo: r.store_logo ?? null,
    city: r.city ?? null,
  }));

  res.setHeader("Cache-Control", "public, max-age=5, stale-while-revalidate=15");
  res.json({ suggestions, categories, stores, trending: trendingRes.rows });
});

/* ═══════════════════════════════════════════════════════════════════════════
   ROUTE 3 — GET /api/search/results  (NLP + FTS + trigram hybrid engine)
   ═══════════════════════════════════════════════════════════════════════════

   ARCHITECTURE — three complementary scoring layers applied per product:

   ┌─────────────────────────────────────────────────────────────────────────┐
   │ Layer 1 — PostgreSQL Full-Text Search  (ts_rank_cd × 0.65)             │
   │   • processSearchQuery() produces NLP-expanded tokens                  │
   │   • Syrian dialect dictionary adds further keyword expansions           │
   │   • All terms merged into an OR tsquery against fts_vector             │
   │     (fts_vector is a weighted tsvector: A=name, B=category,            │
   │      C=search_tokens, D=description — maintained by a DB trigger)      │
   │   • ts_rank_cd with normalization flag 32 (÷ doc length)               │
   │                                                                         │
   │ Layer 2 — AND precision boost  (+0.20 when ALL base tokens match)      │
   │   • Rewards products mentioning every base concept from the query      │
   │                                                                         │
   │ Layer 3 — pg_trgm trigram similarity  (word_similarity × 0.55)        │
   │   • Fuzzy / typo-tolerant fallback for novel or mis-spelled terms      │
   │   • Also activates for queries whose tokens produce no FTS hits        │
   │   • Uses GIN trigram indexes → sub-millisecond                         │
   │                                                                         │
   │ final_score = GREATEST(                                                 │
   │   fts_score * 0.65 + and_boost + trgm_score * 0.25 + cat_score,       │
   │   trgm_score * 0.45,   ← pure-trigram floor for typos                 │
   │   cat_score            ← category-intent floor for dialect queries     │
   │ )                                                                       │
   └─────────────────────────────────────────────────────────────────────────┘

   SELLER GATE: INNER JOIN users (account_status='active') AND
                INNER JOIN seller_applications (status='approved')

   INTENT MODIFIERS:
     cheap   → ORDER BY final_price ASC
     premium → ORDER BY avg_rating DESC
     used    → WHERE search_tokens/name LIKE '%مستعمل%' OR '%used%'

   PAGINATION: COUNT(*) OVER() returns total across all matched rows.

   Query params:
     q          Search query (required, min 2 chars)
     page       Page number, default 1
     limit      Per-page count, default 20 (max 50)
     category   Filter to exact category slug
     priceMin   Minimum price (SYP)
     priceMax   Maximum price (SYP)
     sortBy     relevance | price_asc | price_desc | newest | rating
   ─────────────────────────────────────────────────────────────────────── */
router.get("/search/results", async (req, res): Promise<void> => {
  /* ── 1. Early-exit guard ───────────────────────────────────────────── */
  const raw = String(req.query.q ?? "").trim();
  if (raw.length < 2) {
    res.json({
      results: [], total: 0, page: 1, limit: 20, totalPages: 0,
      intent: { modifiers: [], mappedCategory: null, expandedTerms: [] },
    });
    return;
  }

  /* ── 2. Pagination & filter params ─────────────────────────────────── */
  const rawPage  = parseInt(String(req.query.page  ?? "1"),  10);
  const rawLimit = parseInt(String(req.query.limit ?? "20"), 10);
  const page   = Number.isFinite(rawPage)  && rawPage  >= 1             ? rawPage  : 1;
  const limit  = Number.isFinite(rawLimit) && rawLimit >= 1 && rawLimit <= 50 ? rawLimit : 20;
  const offset = (page - 1) * limit;

  const filterCategory = req.query.category ? String(req.query.category) : null;
  const filterPriceMin = req.query.priceMin  ? parseFloat(String(req.query.priceMin))  : null;
  const filterPriceMax = req.query.priceMax  ? parseFloat(String(req.query.priceMax))  : null;
  const sortBy = String(req.query.sortBy ?? "relevance");

  /* ── 3. Dual NLP pipeline ───────────────────────────────────────────── */

  // 3a. Dialect dictionary — intent modifiers + dialect category + expanded keywords
  const intent = parseIntent(raw);

  // 3b. NLP pipeline — Arabic normalization, sticky tokens, cross-language bridge
  const nlp = processSearchQuery(raw);

  /* ── 4. Merge all expansion sources ────────────────────────────────── */
  // Union of: NLP expanded tokens + dialect keywords + raw normalized term
  const term = normalizeArabic(raw);   // kept for trigram scoring

  const allExpandedTokens: string[] = [
    ...nlp.expandedTokens,
    ...intent.expandedTerms.map(t => normalizeArabic(t)),
    term,
  ];

  // Build PostgreSQL tsquery strings
  const tsqExpanded = buildOrTsQuery(allExpandedTokens);   // broad OR match
  const tsqBase     = buildAndTsQuery(nlp.baseTokens);     // precision AND boost

  /* ── 5. Intent modifier overrides ──────────────────────────────────── */
  const effectiveSort =
    intent.modifiers.includes("cheap")   ? "price_asc" :
    intent.modifiers.includes("premium") ? "rating"    :
    sortBy;

  trackQuery(raw);

  /* ── 6. Parameterised query builder ─────────────────────────────────── */
  const pb = makeParamBuilder();

  // tsquery params (nullable — triggers trigram-only fallback if null)
  const pTsqExpanded  = pb.add(tsqExpanded);    // used in FTS @@ and ts_rank_cd
  const pTsqBase      = pb.add(tsqBase);        // used in AND precision boost
  // Trigram params
  const pTerm         = pb.add(term);
  const pLike         = pb.add(`%${term}%`);
  // Dialect category param
  const pMappedCat    = pb.add(intent.mappedCategory?.toLowerCase() ?? null);

  /* Optional extra WHERE filters */
  const extraWhere: string[] = [];

  if (intent.modifiers.includes("used")) {
    extraWhere.push(`(
      lower(COALESCE(p.search_tokens,'')) LIKE '%مستعمل%'
      OR lower(p.name) LIKE '%used%'
      OR lower(COALESCE(p.name_ar,'')) LIKE '%مستعمل%'
    )`);
  }
  if (filterCategory) {
    extraWhere.push(`lower(p.category) = ${pb.add(filterCategory.toLowerCase())}`);
  }
  if (filterPriceMin !== null && !isNaN(filterPriceMin)) {
    extraWhere.push(`p.price::numeric >= ${pb.add(filterPriceMin)}`);
  }
  if (filterPriceMax !== null && !isNaN(filterPriceMax)) {
    extraWhere.push(`p.price::numeric <= ${pb.add(filterPriceMax)}`);
  }

  const extraWhereSQL = extraWhere.length > 0 ? `AND ${extraWhere.join(" AND ")}` : "";

  /* ORDER BY — final_price alias computed in scored CTE */
  const orderBySQL =
    effectiveSort === "price_asc"  ? "final_price ASC,  final_score DESC" :
    effectiveSort === "price_desc" ? "final_price DESC, final_score DESC" :
    effectiveSort === "newest"     ? "p_created_at DESC"                  :
    effectiveSort === "rating"     ? "avg_rating DESC, final_score DESC"  :
    /* relevance */                  "final_score DESC, p_featured DESC";

  const pLimit  = pb.add(limit);
  const pOffset = pb.add(offset);

  /* ── 7. Core SQL — NLP + FTS + trigram hybrid ───────────────────────── */
  const { rows } = await pool.query(
    `
    /* ── Pre-compute tsquery objects exactly once ───────────────────────── */
    WITH ts_params AS (
      SELECT
        CASE WHEN ${pTsqExpanded}::text IS NOT NULL
          THEN to_tsquery('simple', ${pTsqExpanded}::text)
          ELSE NULL
        END AS expanded_q,
        CASE WHEN ${pTsqBase}::text IS NOT NULL
          THEN to_tsquery('simple', ${pTsqBase}::text)
          ELSE NULL
        END AS base_q
    ),

    /* ── Candidate scan + three-layer scoring ───────────────────────────── */
    candidate AS (
      SELECT
        p.id,
        p.seller_id,
        p.name,
        p.name_ar,
        p.description,
        p.price::numeric                                                         AS raw_price,
        p.discount_percent::numeric                                              AS raw_discount,
        p.price::numeric * (1.0 - COALESCE(p.discount_percent::numeric, 0) / 100.0)
                                                                                 AS final_price,
        p.category,
        p.subcategory,
        p.stock,
        p.image_url,
        p.image_urls,
        p.featured                                                               AS p_featured,
        p.created_at                                                             AS p_created_at,
        sa.store_name,
        sa.store_slug,
        sa.store_logo,
        u.name                                                                   AS seller_name,

        /* Layer 1 — Full-text search (weighted A/B/C/D tsvector, GIN-indexed)  */
        CASE
          WHEN tsp.expanded_q IS NOT NULL
            AND p.fts_vector IS NOT NULL
            AND p.fts_vector @@ tsp.expanded_q
          THEN ts_rank_cd(p.fts_vector, tsp.expanded_q, 32)
          ELSE 0.0
        END                                                                      AS fts_score,

        /* Layer 2 — AND precision boost: all base tokens present              */
        CASE
          WHEN tsp.base_q IS NOT NULL
            AND p.fts_vector IS NOT NULL
            AND p.fts_vector @@ tsp.base_q
          THEN 0.20
          ELSE 0.0
        END                                                                      AS and_boost,

        /* Layer 3 — Trigram similarity: typo-tolerant, covers novel terms      */
        GREATEST(
          word_similarity(${pTerm}, lower(p.name)),
          word_similarity(${pTerm}, lower(COALESCE(p.name_ar, ''))),
          similarity(${pTerm},      lower(p.name))               * 0.85,
          similarity(${pTerm},      lower(COALESCE(p.name_ar,''))) * 0.85
        )                                                                        AS trgm_score,

        /* Category intent: dialect dictionary maps query → DB category          */
        CASE
          WHEN ${pMappedCat}::text IS NOT NULL
            AND lower(p.category) = ${pMappedCat}::text
          THEN 0.80
          ELSE 0.0
        END                                                                      AS cat_score

      FROM products p
      CROSS JOIN ts_params tsp
      /* ── Strict seller gate ────────────────────────────────────────────── */
      INNER JOIN users u
        ON  u.id = p.seller_id
        AND u.account_status = 'active'
      INNER JOIN seller_applications sa
        ON  sa.user_id = p.seller_id
        AND sa.status  = 'approved'
      WHERE
        p.stock > 0
        /* Candidate filter: at least one scoring layer must fire           */
        AND (
          /* FTS hit via GIN index — fast, bilingual, NLP-expanded           */
          (tsp.expanded_q IS NOT NULL AND p.fts_vector IS NOT NULL
            AND p.fts_vector @@ tsp.expanded_q)
          /* Trigram fallback — catches typos and terms not in the FTS dict   */
          OR word_similarity(${pTerm}, lower(p.name))                  > 0.14
          OR word_similarity(${pTerm}, lower(COALESCE(p.name_ar, ''))) > 0.14
          /* LIKE fallback — guarantees exact partial matches always appear   */
          OR lower(p.name)                     LIKE ${pLike}
          OR lower(COALESCE(p.name_ar, ''))    LIKE ${pLike}
          /* Dialect category gate — broad match for colloquial category terms */
          OR (${pMappedCat}::text IS NOT NULL
              AND lower(p.category) = ${pMappedCat}::text)
        )
        ${extraWhereSQL}
    ),

    /* ── Combine three layers into a single composite score ─────────────── */
    scored AS (
      SELECT *,
        GREATEST(
          /* Primary path: FTS-led with trigram supplement                   */
          fts_score * 0.65 + and_boost + trgm_score * 0.25 + cat_score * 0.10,
          /* Trigram-only floor: activates when FTS has no hit (novel terms)  */
          trgm_score * 0.45,
          /* Category-intent floor: dialect queries always show category hits */
          cat_score
        ) AS final_score
      FROM candidate
    ),

    /* ── Score gate + window-count for pagination metadata ──────────────── */
    paged AS (
      SELECT *, COUNT(*) OVER() AS total_count
      FROM scored
      WHERE final_score > 0.02
    )

    /* ── Enrich with ratings + variant flag ─────────────────────────────── */
    SELECT
      pg.*,
      COALESCE(r.avg_rating,   0)::numeric(3,1) AS avg_rating,
      COALESCE(r.review_count, 0)               AS review_count,
      EXISTS(
        SELECT 1 FROM product_variants pv WHERE pv.product_id = pg.id LIMIT 1
      )                                         AS has_variants
    FROM paged pg
    LEFT JOIN (
      SELECT
        product_id,
        AVG(rating)::numeric(3,1) AS avg_rating,
        COUNT(*)                  AS review_count
      FROM reviews
      GROUP BY product_id
    ) r ON r.product_id = pg.id
    ORDER BY ${orderBySQL}
    LIMIT ${pLimit} OFFSET ${pOffset}
    `,
    pb.values,
  );

  /* ── 8. Pagination metadata ─────────────────────────────────────────── */
  const total = rows.length > 0 ? parseInt(String(rows[0].total_count), 10) : 0;

  /* ── 9. Response mapper ─────────────────────────────────────────────── */
  const results = rows.map((r: any) => ({
    id:              r.id,
    name:            r.name,
    nameAr:          r.name_ar      ?? null,
    price:           parseFloat(r.raw_price),
    discountPercent: r.raw_discount  ? parseFloat(r.raw_discount) : null,
    finalPrice:      parseFloat(r.final_price),
    category:        r.category,
    subcategory:     r.subcategory  ?? null,
    stock:           r.stock,
    imageUrl:        r.image_url    ?? null,
    imageUrls:       (r.image_urls  ?? []) as string[],
    featured:        r.p_featured,
    isBestDeal:      r.raw_discount ? parseFloat(r.raw_discount) >= 20 : false,
    hasVariants:     !!r.has_variants,
    averageRating:   parseFloat(r.avg_rating),
    reviewCount:     parseInt(String(r.review_count), 10),
    seller: {
      id:        r.seller_id,
      name:      r.seller_name  ?? "Unknown",
      storeName: r.store_name   ?? null,
      storeSlug: r.store_slug   ?? null,
      storeLogo: r.store_logo   ?? null,
    },
    createdAt: r.p_created_at instanceof Date
      ? r.p_created_at.toISOString()
      : String(r.p_created_at),
    score: Math.round(parseFloat(r.final_score) * 1000) / 1000,
  }));

  res.setHeader("Cache-Control", "public, max-age=5, stale-while-revalidate=15");
  res.json({
    results,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    intent: {
      modifiers:       intent.modifiers,
      mappedCategory:  intent.mappedCategory,
      expandedTerms:   intent.expandedTerms,
      /* New fields for frontend intent chips */
      nlpBaseTokens:   nlp.baseTokens,
      nlpExpandedCount: nlp.expandedTokens.length,
      primaryLanguage: nlp.primaryLanguage,
    },
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   ROUTE 4 — GET /api/search/trending
   ═══════════════════════════════════════════════════════════════════════════ */
router.get("/search/trending", async (_req, res): Promise<void> => {
  const { rows } = await pool.query<{ query: string; count: number }>(
    `SELECT query, count FROM search_queries ORDER BY count DESC LIMIT 12`,
  );
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
  res.json(rows.map(r => ({ query: r.query, count: r.count })));
});

/* ═══════════════════════════════════════════════════════════════════════════
   ROUTE 5 — POST /api/search/track-click
   ═══════════════════════════════════════════════════════════════════════════ */
router.post("/search/track-click", async (req, res): Promise<void> => {
  const { term } = req.body as { term?: string };
  if (term && typeof term === "string" && term.trim().length >= 2) trackQuery(term.trim());
  res.json({ ok: true });
});

export default router;
