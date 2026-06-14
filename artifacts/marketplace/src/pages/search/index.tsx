import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useListProducts } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/categories";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, SlidersHorizontal, X, Store, ChevronRight,
  Star, TrendingUp, Package, Layers, ArrowRight,
  Cpu, Shirt, Sparkles, Home as HomeIcon, ShoppingBasket, Dumbbell,
  Car, Gamepad2, BookOpen, PawPrint, Download, Palette,
  Gem, Baby, Wrench, TreePine, Gift,
} from "lucide-react";
import { Link } from "wouter";

const ICON_MAP: Record<string, React.ElementType> = {
  Cpu, Shirt, Sparkles, Home: HomeIcon, ShoppingBasket, Dumbbell,
  Car, Gamepad2, BookOpen, PawPrint, Download, Palette,
  Gem, Baby, Wrench, TreePine, Gift,
};

type SortOption = "newest" | "price_asc" | "price_desc" | "highest_rated" | "most_discounted" | "best_selling";
type ActiveTab = "products" | "stores" | "categories";

interface StoreResult {
  userId: number;
  storeName: string;
  storeSlug: string | null;
  storeLogo: string | null;
  categories: string[];
  city: string | null;
  followerCount: number;
  productCount: number;
  averageRating: number | null;
  totalReviews: number;
  trustScore: number | null;
}

const PAGE_SIZE = 24;

export default function SearchPage() {
  const { t, i18n } = useTranslation();
  const { currency, symbol, exchangeRate } = useCurrency();
  const lang = i18n.language;
  const isRtl = lang === "ar";
  const [location, navigate] = useLocation();

  const getInitialParams = () => {
    const sp2 = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const q = sp2.get("q") || sp2.get("search") || "";
    const cat = sp2.get("category") || undefined;
    const disc = sp2.get("hasDiscount") === "true";
    const rawSort = sp2.get("sortBy") || sp2.get("sort") || "newest";
    const sort = rawSort === "best_sellers" ? "best_selling" : rawSort as SortOption;
    return { q, cat, disc, sort };
  };
  const init = getInitialParams();

  const [query, setQuery] = useState(init.q);
  const [activeTab, setActiveTab] = useState<ActiveTab>("products");
  const [sortBy, setSortBy] = useState<SortOption>(init.sort);
  const [category, setCategory] = useState<string | undefined>(init.cat);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [hasDiscount, setHasDiscount] = useState(init.disc);
  const [inStock, setInStock] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<any[]>([]);
  const prevFilterKey = useRef("");

  const [stores, setStores] = useState<StoreResult[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 350);

  useSEO({
    title: debouncedQuery
      ? lang === "ar" ? `نتائج البحث عن "${debouncedQuery}"` : `Search results for "${debouncedQuery}"`
      : lang === "ar" ? "تسوق" : "Shop",
    description: lang === "ar"
      ? "اكتشف الآلاف من المنتجات والمتاجر السورية في سوق سيانو"
      : "Discover thousands of products and Syrian stores on Syano marketplace",
  });

  useEffect(() => {
    const sp2 = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const urlQ = sp2.get("q") || sp2.get("search") || "";
    const urlCat = sp2.get("category") || undefined;
    const urlDisc = sp2.get("hasDiscount") === "true";
    const rawSort = sp2.get("sortBy") || sp2.get("sort") || "";
    if (urlQ !== query) setQuery(urlQ);
    if (urlCat !== undefined && urlCat !== category) setCategory(urlCat);
    if (urlDisc && !hasDiscount) setHasDiscount(true);
    if (rawSort && rawSort !== sortBy) setSortBy((rawSort === "best_sellers" ? "best_selling" : rawSort) as SortOption);
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  const toUsd = (val: string) => {
    const n = parseFloat(val);
    return isNaN(n) ? undefined : currency === "SYP" ? n / exchangeRate : n;
  };

  const filterKey = [debouncedQuery, category, sortBy, minPriceInput, maxPriceInput, hasDiscount, inStock, minRating].join("|");

  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      setOffset(0);
      setAccumulated([]);
    }
  }, [filterKey]);

  const { data: pageData, isLoading: productsLoading, isFetching } = useListProducts({
    search: debouncedQuery || undefined,
    category: category && category !== "all" ? category : undefined,
    sortBy,
    minPrice: toUsd(minPriceInput),
    maxPrice: toUsd(maxPriceInput),
    hasDiscount: hasDiscount || undefined,
    inStock: inStock || undefined,
    minRating: minRating > 0 ? minRating : undefined,
    limit: PAGE_SIZE,
    offset,
  } as any);

  useEffect(() => {
    if (!pageData) return;
    if (offset === 0) {
      setAccumulated(pageData);
    } else {
      setAccumulated((prev) => {
        const seen = new Set(prev.map((p: any) => p.id));
        return [...prev, ...pageData.filter((p: any) => !seen.has(p.id))];
      });
    }
  }, [pageData, offset]);

  const products = accumulated;
  const hasMoreProducts = (pageData?.length ?? 0) >= PAGE_SIZE;

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setStores([]);
      return;
    }
    setStoresLoading(true);
    fetch(`/api/sellers/directory?search=${encodeURIComponent(debouncedQuery)}&limit=24`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => setStores(Array.isArray(data) ? data : []))
      .catch(() => setStores([]))
      .finally(() => setStoresLoading(false));
  }, [debouncedQuery]);

  const matchedCategories = CATEGORIES.filter((c) => {
    if (!debouncedQuery || debouncedQuery.length < 2) return false;
    const q = debouncedQuery.toLowerCase();
    return (
      c.slug.toLowerCase().includes(q) ||
      c.en.toLowerCase().includes(q) ||
      c.ar.includes(debouncedQuery) ||
      c.subcategories.some((s) => s.en.toLowerCase().includes(q) || s.ar.includes(debouncedQuery))
    );
  });

  const activeFilterCount = [
    category && category !== "all", sortBy !== "newest",
    minPriceInput, maxPriceInput, hasDiscount, inStock, minRating > 0,
  ].filter(Boolean).length;

  const SORT_LABELS: Record<SortOption, string> = {
    newest:          lang === "ar" ? "الأحدث" : "Newest",
    price_asc:       lang === "ar" ? "السعر: من الأرخص" : "Price: Low to High",
    price_desc:      lang === "ar" ? "السعر: من الأغلى" : "Price: High to Low",
    highest_rated:   lang === "ar" ? "الأعلى تقييماً" : "Highest Rated",
    most_discounted: lang === "ar" ? "أكبر خصم" : "Most Discounted",
    best_selling:    lang === "ar" ? "الأكثر مبيعاً" : "Best Selling",
  };

  const TAB_CONFIG: { key: ActiveTab; label: string; count: number; icon: React.ElementType }[] = [
    { key: "products",   label: lang === "ar" ? "المنتجات" : "Products",   count: products.length,          icon: Package },
    { key: "stores",     label: lang === "ar" ? "المتاجر" : "Stores",       count: stores.length,            icon: Store },
    { key: "categories", label: lang === "ar" ? "الفئات" : "Categories",  count: matchedCategories.length, icon: Layers },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const clearFilters = () => {
    setCategory(undefined); setSortBy("newest");
    setMinPriceInput(""); setMaxPriceInput("");
    setHasDiscount(false); setInStock(false); setMinRating(0);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* ── Search Header ─────────────────────────────────────── */}
        <div className="border-b border-border/60 bg-card/40 sticky top-[4rem] z-30">
          <div className="container py-3 px-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-1 bg-background border border-border/70 rounded-xl px-3.5 h-10 focus-within:border-emerald-500/60 transition-colors">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={lang === "ar" ? "ابحث عن منتجات أو متاجر..." : "Search products or stores..."}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                  autoFocus={!init.q}
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(""); navigate("/shop"); }}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button type="submit" size="sm" className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                {lang === "ar" ? "بحث" : "Search"}
              </Button>
            </form>

            {debouncedQuery && (
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">
                  {lang === "ar" ? `نتائج البحث عن ` : `Results for `}
                  <span className="font-semibold text-foreground">"{debouncedQuery}"</span>
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mt-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {TAB_CONFIG.map(({ key, label, count, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === key
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                  {count > 0 && (
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] text-center",
                      activeTab === key ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                    )}>{count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Products Tab ─────────────────────────────────────── */}
        {activeTab === "products" && (
          <div className="container px-4 py-6">
            <div className="flex flex-col lg:flex-row gap-6">

              {/* Sidebar Filters — desktop */}
              <aside className={cn(
                "hidden lg:block w-56 shrink-0 transition-all",
                filtersOpen && "block"
              )}>
                <div className="sticky top-[10rem] space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{lang === "ar" ? "الفلاتر" : "Filters"}</span>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                        {lang === "ar" ? "مسح الكل" : "Clear all"}
                      </button>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                      {lang === "ar" ? "الفئة" : "Category"}
                    </Label>
                    <Select value={category ?? "all"} onValueChange={(v) => setCategory(v === "all" ? undefined : v)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder={lang === "ar" ? "جميع الفئات" : "All categories"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{lang === "ar" ? "جميع الفئات" : "All categories"}</SelectItem>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {lang === "ar" ? c.ar : c.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort */}
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                      {lang === "ar" ? "ترتيب حسب" : "Sort by"}
                    </Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price */}
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                      {lang === "ar" ? "نطاق السعر" : "Price Range"} ({symbol})
                    </Label>
                    <div className="flex gap-2">
                      <Input type="number" min="0" value={minPriceInput}
                        onChange={(e) => setMinPriceInput(e.target.value)}
                        placeholder={lang === "ar" ? "من" : "Min"} className="h-8 text-sm" />
                      <Input type="number" min="0" value={maxPriceInput}
                        onChange={(e) => setMaxPriceInput(e.target.value)}
                        placeholder={lang === "ar" ? "إلى" : "Max"} className="h-8 text-sm" />
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                      {lang === "ar" ? "الحد الأدنى للتقييم" : "Min Rating"}
                    </Label>
                    <div className="flex gap-1 flex-wrap">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setMinRating(minRating === star ? 0 : star)}
                          className={cn(
                            "flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors",
                            minRating === star
                              ? "bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/50 dark:border-amber-600/60 dark:text-amber-400"
                              : "border-border text-muted-foreground hover:border-amber-300"
                          )}>
                          <Star className={cn("h-3 w-3", minRating === star ? "fill-amber-500 text-amber-500" : "")} />
                          {star}+
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Checkbox id="onSale" checked={hasDiscount} onCheckedChange={(c) => setHasDiscount(!!c)} />
                      <label htmlFor="onSale" className="text-sm cursor-pointer select-none">
                        {lang === "ar" ? "عروض وخصومات فقط" : "On Sale Only"}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="inStock" checked={inStock} onCheckedChange={(c) => setInStock(!!c)} />
                      <label htmlFor="inStock" className="text-sm cursor-pointer select-none">
                        {lang === "ar" ? "متوفر في المخزون" : "In Stock Only"}
                      </label>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                {/* Mobile filter bar */}
                <div className="flex items-center gap-2 mb-4 lg:hidden">
                  <button onClick={() => setFiltersOpen(!filtersOpen)}
                    className={cn(
                      "flex items-center gap-1.5 h-9 px-3.5 rounded-lg border text-sm font-medium transition-colors",
                      filtersOpen || activeFilterCount > 0
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}>
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    {lang === "ar" ? "الفلاتر" : "Filters"}
                    {activeFilterCount > 0 && (
                      <span className="bg-emerald-500 text-white rounded-full h-4 w-4 text-[10px] flex items-center justify-center font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="h-9 flex-1 text-sm max-w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
                      {lang === "ar" ? "مسح" : "Clear"}
                    </button>
                  )}
                </div>

                {/* Mobile expanded filters */}
                {filtersOpen && (
                  <div className="lg:hidden mb-4 p-4 bg-card rounded-xl border border-border/60 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                          {lang === "ar" ? "الفئة" : "Category"}
                        </Label>
                        <Select value={category ?? "all"} onValueChange={(v) => setCategory(v === "all" ? undefined : v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder={lang === "ar" ? "جميع الفئات" : "All"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{lang === "ar" ? "الكل" : "All"}</SelectItem>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c.slug} value={c.slug}>{lang === "ar" ? c.ar : c.en}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                          {lang === "ar" ? "السعر" : "Price"} ({symbol})
                        </Label>
                        <div className="flex gap-1">
                          <Input type="number" min="0" value={minPriceInput}
                            onChange={(e) => setMinPriceInput(e.target.value)}
                            placeholder={lang === "ar" ? "من" : "Min"} className="h-9 text-sm" />
                          <Input type="number" min="0" value={maxPriceInput}
                            onChange={(e) => setMaxPriceInput(e.target.value)}
                            placeholder={lang === "ar" ? "إلى" : "Max"} className="h-9 text-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox id="mOnSale" checked={hasDiscount} onCheckedChange={(c) => setHasDiscount(!!c)} />
                        <label htmlFor="mOnSale" className="text-sm">{lang === "ar" ? "عروض فقط" : "On Sale"}</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="mInStock" checked={inStock} onCheckedChange={(c) => setInStock(!!c)} />
                        <label htmlFor="mInStock" className="text-sm">{lang === "ar" ? "متوفر" : "In Stock"}</label>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider me-1 self-center">
                        {lang === "ar" ? "تقييم:" : "Rating:"}
                      </span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setMinRating(minRating === star ? 0 : star)}
                          className={cn(
                            "flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors",
                            minRating === star
                              ? "bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/50 dark:border-amber-600/60 dark:text-amber-400"
                              : "border-border text-muted-foreground"
                          )}>
                          <Star className={cn("h-3 w-3", minRating === star ? "fill-amber-500 text-amber-500" : "")} />
                          {star}+
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Grid */}
                {productsLoading && products.length === 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="rounded-2xl bg-muted/40 animate-pulse aspect-[3/4]" />
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="text-lg font-semibold text-foreground mb-1">
                      {lang === "ar" ? "لا توجد منتجات" : "No products found"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lang === "ar"
                        ? "حاول تغيير كلمات البحث أو الفلاتر"
                        : "Try different search terms or filters"}
                    </p>
                    {activeFilterCount > 0 && (
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                        {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {products.map((p: any) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                    {hasMoreProducts && (
                      <div className="flex justify-center mt-8">
                        <Button variant="outline" onClick={() => setOffset((o) => o + PAGE_SIZE)}
                          disabled={isFetching}
                          className="min-w-[140px]">
                          {isFetching
                            ? (lang === "ar" ? "جاري التحميل..." : "Loading...")
                            : (lang === "ar" ? "تحميل المزيد" : "Load more")}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Stores Tab ───────────────────────────────────────── */}
        {activeTab === "stores" && (
          <div className="container px-4 py-6">
            {storesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-muted/40 animate-pulse h-40" />
                ))}
              </div>
            ) : stores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Store className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-semibold text-foreground mb-1">
                  {lang === "ar" ? "لا توجد متاجر" : "No stores found"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? "حاول البحث بكلمة مختلفة" : "Try a different search term"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stores.map((s) => (
                  <Link key={s.userId} href={s.storeSlug ? `/store/${s.storeSlug}` : `/shop?sellerId=${s.userId}`}>
                    <div className="bg-card border border-border/60 rounded-2xl p-4 hover:border-emerald-500/40 hover:shadow-md transition-all group cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        {s.storeLogo ? (
                          <img src={s.storeLogo} alt={s.storeName}
                            className="h-12 w-12 rounded-xl object-cover border border-border/60 shrink-0" />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <Store className="h-6 w-6 text-emerald-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {s.storeName}
                          </div>
                          {s.city && (
                            <div className="text-xs text-muted-foreground truncate">{s.city}</div>
                          )}
                        </div>
                      </div>
                      {s.categories && s.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {s.categories.slice(0, 2).map((cat: string) => (
                            <span key={cat} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-muted-foreground">
                          {s.followerCount > 0 && `${s.followerCount} ${lang === "ar" ? "متابع" : "followers"}`}
                        </div>
                        <ChevronRight className={cn("h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity", isRtl && "rotate-180")} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Categories Tab ───────────────────────────────────── */}
        {activeTab === "categories" && (
          <div className="container px-4 py-6">
            {matchedCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Layers className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-semibold text-foreground mb-1">
                  {lang === "ar" ? "لا توجد فئات مطابقة" : "No categories found"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? "حاول البحث بكلمة مختلفة" : "Try a different search term"}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {matchedCategories.map((cat) => {
                  const Icon = ICON_MAP[cat.icon] ?? Package;
                  const matchingSubcats = cat.subcategories.filter((s) => {
                    const q = debouncedQuery.toLowerCase();
                    return s.en.toLowerCase().includes(q) || s.ar.includes(debouncedQuery);
                  });
                  return (
                    <div key={cat.slug} className="bg-card border border-border/60 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", cat.iconBg)}>
                          <Icon className={cn("h-5 w-5", cat.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground">{lang === "ar" ? cat.ar : cat.en}</div>
                          <div className="text-xs text-muted-foreground">
                            {cat.subcategories.length} {lang === "ar" ? "فئة فرعية" : "subcategories"}
                          </div>
                        </div>
                        <Link href={`/shop?category=${encodeURIComponent(cat.slug)}`}>
                          <Button variant="ghost" size="sm" className="gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                            {lang === "ar" ? "تصفح" : "Browse"}
                            <ArrowRight className={cn("h-3.5 w-3.5", isRtl && "rotate-180")} />
                          </Button>
                        </Link>
                      </div>
                      {matchingSubcats.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {matchingSubcats.map((sub) => (
                            <Link key={sub.slug} href={`/shop?category=${encodeURIComponent(cat.slug)}&subcategory=${encodeURIComponent(sub.slug)}`}>
                              <Badge variant="secondary" className="cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                {lang === "ar" ? sub.ar : sub.en}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* All categories when query matches broadly */}
                {matchedCategories.length < 5 && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-3">
                      {lang === "ar" ? "جميع الفئات" : "All Categories"}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {CATEGORIES.filter((c) => !matchedCategories.find((m) => m.slug === c.slug)).map((cat) => {
                        const Icon = ICON_MAP[cat.icon] ?? Package;
                        return (
                          <Link key={cat.slug} href={`/shop?category=${encodeURIComponent(cat.slug)}`}>
                            <div className="flex flex-col items-center gap-2 p-3 bg-card border border-border/60 rounded-xl hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer group">
                              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", cat.iconBg)}>
                                <Icon className={cn("h-5 w-5", cat.iconColor)} />
                              </div>
                              <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">
                                {lang === "ar" ? cat.ar : cat.en}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state — no query */}
        {!debouncedQuery && (
          <div className="container px-4 py-12 text-center">
            <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-xl font-semibold text-foreground mb-2">
              {lang === "ar" ? "اكتشف منتجاتنا" : "Discover our products"}
            </p>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {lang === "ar"
                ? "ابحث عن منتجات، تسوق بالفئات، أو اكتشف متاجر سورية متميزة"
                : "Search for products, browse categories, or discover top Syrian stores"}
            </p>

            {/* Category shortcuts */}
            <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-3xl mx-auto">
              {CATEGORIES.slice(0, 12).map((cat) => {
                const Icon = ICON_MAP[cat.icon] ?? Package;
                return (
                  <Link key={cat.slug} href={`/shop?category=${encodeURIComponent(cat.slug)}`}>
                    <div className="flex flex-col items-center gap-2 p-3 bg-card border border-border/60 rounded-xl hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer group">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", cat.iconBg)}>
                        <Icon className={cn("h-5 w-5", cat.iconColor)} />
                      </div>
                      <span className="text-[11px] font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">
                        {lang === "ar" ? cat.ar : cat.en}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
