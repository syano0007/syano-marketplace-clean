import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useAddToCart,
  useGetSellerDashboard,
  useGetBestSellers,
  useListCategories,
  useListProducts,
  getBaseUrl,
} from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";

import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useScreenLayout } from "@/hooks/useScreenLayout";
import { t, getLocale } from "../../src/i18n";

interface SuggestionItem { text: string; textAr: string | null }
interface CategorySuggestion { slug: string; labelEn: string; labelAr: string }
interface MobileSuggestions { suggestions: SuggestionItem[]; categories: CategorySuggestion[] }

function recordMobileSearchClick(searchLogId: number): void {
  fetch(`${getBaseUrl()}/api/search/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ searchLogId }),
  }).catch(() => {});
}

export default function HomeScreen() {
  const { isSeller } = useAuth();
  return isSeller ? <SellerDashboard /> : <CustomerShop />;
}

type MobileSortOption = "newest" | "price_asc" | "price_desc" | "highest_rated";

const MOBILE_SORT_LABELS: Record<MobileSortOption, { en: string; ar: string }> = {
  newest:        { en: "Newest", ar: "الأحدث" },
  price_asc:     { en: "Price ↑", ar: "السعر ↑" },
  price_desc:    { en: "Price ↓", ar: "السعر ↓" },
  highest_rated: { en: "Top Rated", ar: "الأعلى تقييماً" },
};

// ── Mini horizontal product card for homepage sections ───────────────────────
function MiniProductCard({ product, colors, onPress }: { product: any; colors: any; onPress: () => void }) {
  const hasDiscount = product.discountPercent != null && product.discountPercent > 0;
  const imageUri = product.imageUrls?.[0] ?? product.imageUrl ?? null;
  return (
    <Pressable
      style={({ pressed }) => [miniStyles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
      onPress={onPress}
    >
      <View style={[miniStyles.imgWrap, { backgroundColor: colors.muted }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={miniStyles.img} resizeMode="cover" />
        ) : (
          <Ionicons name="cube-outline" size={28} color={colors.mutedForeground} />
        )}
        {hasDiscount && (
          <View style={miniStyles.badge}>
            <Text style={miniStyles.badgeText}>-{product.discountPercent}%</Text>
          </View>
        )}
      </View>
      <View style={miniStyles.info}>
        <Text style={[miniStyles.name, { color: colors.foreground }]} numberOfLines={2}>{product.name}</Text>
        <Text style={[miniStyles.price, { color: colors.primary }]}>${(product.finalPrice ?? product.price ?? 0).toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

// ── Homepage header (shown when no search/filter active) ──────────────────────
function HomepageHeader({
  topPad, colors, search, setSearch, setDebouncedSearch,
  searchFocused, setSearchFocused, handleSearchChange,
  mobileSuggestions, setMobileSuggestions,
  categories, activeCategory, setActiveCategory,
  bestSellers, newArrivals, isLoadingBestSellers, isLoadingNewArrivals,
  trending, isLoadingTrending,
}: any) {
  return (
    <View style={{ backgroundColor: colors.background }}>
      {/* ── Top bar ── */}
      <View style={[styles.shopHeader, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: "transparent" }]}>
        <View style={styles.homeTopRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{t("home.discover", "Discover")}</Text>
            <Text style={[styles.shopTitle, { color: colors.foreground }]}>SYANO</Text>
          </View>
          <Pressable
            style={[styles.searchIconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
          </Pressable>
        </View>
        {/* Search bar */}
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            testID="search-input"
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={t("common.search_placeholder")}
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {!!search && (
            <Pressable onPress={() => { setSearch(""); setDebouncedSearch(""); }}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        {/* Suggestion overlay */}
        {searchFocused && search.length >= 2 && (mobileSuggestions.suggestions.length > 0 || mobileSuggestions.categories.length > 0) && (
          <View style={[suggStyles.overlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {mobileSuggestions.suggestions.slice(0, 5).map((s: any, i: number) => (
              <TouchableOpacity
                key={i}
                style={[suggStyles.row, { borderBottomColor: colors.border }]}
                onPress={() => { setSearch(s.text); setDebouncedSearch(s.text); setSearchFocused(false); setMobileSuggestions({ suggestions: [], categories: [] }); }}
                activeOpacity={0.7}
              >
                <Ionicons name="search-outline" size={14} color={colors.mutedForeground} />
                <Text style={[suggStyles.rowText, { color: colors.foreground }]} numberOfLines={1}>{s.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* ── Quick Actions Row ── */}
        <View style={quickStyles.row}>
          <Pressable
            style={({ pressed }) => [quickStyles.btn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.push("/stores/index" as any)}
          >
            <Ionicons name="storefront-outline" size={14} color={colors.primary} />
            <Text style={[quickStyles.btnText, { color: colors.foreground }]}>{t("home.browse_stores")}</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [quickStyles.btn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.push("/categories" as any)}
          >
            <Ionicons name="grid-outline" size={14} color={colors.primary} />
            <Text style={[quickStyles.btnText, { color: colors.foreground }]}>{t("home.categories", "Categories")}</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* ── Hero carousel (best sellers as featured products) ── */}
      {(isLoadingBestSellers || (bestSellers && bestSellers.length > 0)) && (
        <View style={heroStyles.container}>
          <Text style={[heroStyles.sectionLabel, { color: colors.mutedForeground }]}>{t("home.hot_deals", "🔥 Hot Deals")}</Text>
          {isLoadingBestSellers ? (
            <View style={heroStyles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={bestSellers ?? []}
              keyExtractor={(item: any) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={heroStyles.list}
              renderItem={({ item }: { item: any }) => (
                <MiniProductCard
                  product={item}
                  colors={colors}
                  onPress={() => router.push(`/product/${item.id}` as any)}
                />
              )}
            />
          )}
        </View>
      )}

      {/* ── Categories grid ── */}
      <View style={heroStyles.container}>
        <Text style={[heroStyles.sectionLabel, { color: colors.mutedForeground }]}>{t("home.categories", "🗂 Browse Categories")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <Pressable
            style={({ pressed }) => [styles.categoryChip, { backgroundColor: activeCategory === null ? colors.primary : colors.secondary, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => setActiveCategory(null)}
          >
            <Text style={[styles.chipText, { color: activeCategory === null ? colors.primaryForeground : colors.foreground }]}>{t("shop.all")}</Text>
          </Pressable>
          {categories.map((cat: string) => (
            <Pressable
              key={cat}
              style={({ pressed }) => [styles.categoryChip, { backgroundColor: activeCategory === cat ? colors.primary : colors.secondary, opacity: pressed ? 0.8 : 1 }]}
              onPress={() => setActiveCategory(cat === activeCategory ? null : cat)}
            >
              <Text style={[styles.chipText, { color: activeCategory === cat ? colors.primaryForeground : colors.foreground }]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── New Arrivals ── */}
      {(isLoadingNewArrivals || (newArrivals && newArrivals.length > 0)) && (
        <View style={heroStyles.container}>
          <View style={heroStyles.sectionRow}>
            <Text style={[heroStyles.sectionLabel, { color: colors.mutedForeground }]}>{t("home.new_arrivals", "✨ New Arrivals")}</Text>
          </View>
          {isLoadingNewArrivals ? (
            <View style={heroStyles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={newArrivals ?? []}
              keyExtractor={(item: any) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={heroStyles.list}
              renderItem={({ item }: { item: any }) => (
                <MiniProductCard
                  product={item}
                  colors={colors}
                  onPress={() => router.push(`/product/${item.id}` as any)}
                />
              )}
            />
          )}
        </View>
      )}

      {/* ── Trending Now ── */}
      {(isLoadingTrending || (trending && trending.length > 0)) && (
        <View style={heroStyles.container}>
          <View style={heroStyles.sectionRow}>
            <Text style={[heroStyles.sectionLabel, { color: colors.mutedForeground }]}>{t("home.trending", "📈 Trending Now")}</Text>
          </View>
          {isLoadingTrending ? (
            <View style={heroStyles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={trending ?? []}
              keyExtractor={(item: any) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={heroStyles.list}
              renderItem={({ item }: { item: any }) => (
                <MiniProductCard
                  product={item}
                  colors={colors}
                  onPress={() => router.push(`/product/${item.id}` as any)}
                />
              )}
            />
          )}
        </View>
      )}

      {/* ── All Products heading ── */}
      <View style={[heroStyles.allProductsHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[heroStyles.allTitle, { color: colors.foreground }]}>{t("home.all_products", "All Products")}</Text>
      </View>
    </View>
  );
}

function CustomerShop() {
  const colors = useColors();
  const { topPad, tabBarHeight } = useScreenLayout();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSuggestions, setMobileSuggestions] = useState<MobileSuggestions>({ suggestions: [], categories: [] });
  const [searchLogId, setSearchLogId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<MobileSortOption>("newest");
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [relatedSearches, setRelatedSearches] = useState<Array<{ query: string; count: number }>>([]);
  const [onSale, setOnSale] = useState(false);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchIntent, setSearchIntent] = useState<string | null>(null);
  const [tempMin, setTempMin] = useState("");
  const [tempMax, setTempMax] = useState("");
  const addToCart = useAddToCart();
  const suggestTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isShopMode = debouncedSearch.length > 0 || activeCategory !== null || minRating > 0 || inStock || sortBy !== "newest" || onSale || priceMin != null || priceMax != null;

  function handleSearchChange(text: string) {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(text), 400);
  }

  useEffect(() => {
    if (suggestTimeout.current) clearTimeout(suggestTimeout.current);
    if (debouncedSearch.length < 2) {
      setMobileSuggestions({ suggestions: [], categories: [] });
      setSearchLogId(null);
      return;
    }
    suggestTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/api/search/suggestions?q=${encodeURIComponent(debouncedSearch)}`);
        if (!res.ok) return;
        const data = await res.json() as { suggestions?: SuggestionItem[]; categories?: CategorySuggestion[]; searchLogId?: number | null };
        setMobileSuggestions({ suggestions: data.suggestions ?? [], categories: data.categories ?? [] });
        setSearchLogId(typeof data.searchLogId === "number" ? data.searchLogId : null);
      } catch { /* silent */ }
    }, 100);
    return () => { if (suggestTimeout.current) clearTimeout(suggestTimeout.current); };
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedSearch.length < 2) { setRelatedSearches([]); return; }
    let cancelled = false;
    fetch(`${getBaseUrl()}/api/search/related?q=${encodeURIComponent(debouncedSearch)}&limit=5`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled && d?.related) setRelatedSearches(d.related); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedSearch.length < 2) { setSearchIntent(null); return; }
    let cancelled = false;
    fetch(`${getBaseUrl()}/api/search?q=${encodeURIComponent(debouncedSearch)}&limit=1`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: any) => {
        if (!cancelled) setSearchIntent(d?.detectedIntent ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const { data: categories = [] } = useListCategories();

  const { data: bestSellers, isLoading: isLoadingBestSellers } = useGetBestSellers(8, {
    query: { enabled: !isShopMode } as any,
  });

  const { data: newArrivals, isLoading: isLoadingNewArrivals } = useListProducts(
    { sortBy: "newest", limit: 8 } as any,
    { query: { enabled: !isShopMode } as any }
  );

  const { data: trendingRaw, isLoading: isLoadingTrending } = useListProducts(
    { sortBy: "highest_rated", limit: 8 } as any,
    { query: { enabled: !isShopMode } as any }
  );
  const trending = (trendingRaw as any)?.data ?? trendingRaw ?? [];

  const {
    data: rawProducts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useListProducts({
    category: activeCategory ?? undefined,
    search: debouncedSearch || undefined,
    sortBy,
    minRating: minRating > 0 ? minRating : undefined,
    inStock: inStock || undefined,
    minPrice: priceMin != null ? priceMin : undefined,
    maxPrice: priceMax != null ? priceMax : undefined,
  } as any);

  const products = useMemo(() => {
    const list: Product[] = Array.isArray(rawProducts)
      ? rawProducts
      : ((rawProducts as any)?.data ?? []);
    if (onSale) return list.filter((p) => (p as any).discountPercent != null && (p as any).discountPercent > 0);
    return list;
  }, [rawProducts, onSale]);

  const handleAddToCart = useCallback((product: Product) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
  }, [addToCart]);

  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <View style={styles.cardWrapper}>
      <ProductCard
        product={item}
        onAddToCart={handleAddToCart}
        onCardPress={debouncedSearch.length >= 2 && searchLogId != null ? () => recordMobileSearchClick(searchLogId!) : undefined}
      />
    </View>
  ), [handleAddToCart, debouncedSearch, searchLogId]);

  // Shop header (shown in shop mode / search mode)
  const shopHeader = (
    <View style={[styles.shopHeader, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.shopTitleRow}>
        <Text style={[styles.shopTitle, { color: colors.foreground }]}>{t("shop.title")}</Text>
        {isShopMode && (
          <Pressable
            style={[styles.clearAllBtn, { borderColor: colors.border }]}
            onPress={() => { setSearch(""); setDebouncedSearch(""); setActiveCategory(null); setMinRating(0); setInStock(false); setSortBy("newest"); setOnSale(false); setPriceMin(null); setPriceMax(null); }}
          >
            <Ionicons name="home-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.clearAllText, { color: colors.mutedForeground }]}>{t("home.home", "Home")}</Text>
          </Pressable>
        )}
      </View>
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          testID="search-input"
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder={t("common.search_placeholder")}
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {!!search && (
          <Pressable onPress={() => { setSearch(""); setDebouncedSearch(""); }}>
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {searchFocused && search.length >= 2 && (mobileSuggestions.suggestions.length > 0 || mobileSuggestions.categories.length > 0) && (
        <View style={[suggStyles.overlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {mobileSuggestions.suggestions.slice(0, 5).map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[suggStyles.row, { borderBottomColor: colors.border }]}
              onPress={() => { setSearch(s.text); setDebouncedSearch(s.text); setSearchFocused(false); setMobileSuggestions({ suggestions: [], categories: [] }); }}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={14} color={colors.mutedForeground} />
              <Text style={[suggStyles.rowText, { color: colors.foreground }]} numberOfLines={1}>{s.text}</Text>
            </TouchableOpacity>
          ))}
          {mobileSuggestions.categories.slice(0, 2).map((cat) => (
            <TouchableOpacity
              key={cat.slug}
              style={[suggStyles.row, { borderBottomColor: colors.border }]}
              onPress={() => { setSearchFocused(false); setSearch(""); setDebouncedSearch(""); setMobileSuggestions({ suggestions: [], categories: [] }); setActiveCategory(cat.slug); }}
              activeOpacity={0.7}
            >
              <Ionicons name="layers-outline" size={14} color="#60a5fa" />
              <Text style={[suggStyles.rowText, { color: colors.foreground }]} numberOfLines={1}>{cat.labelEn}</Text>
              <Text style={[suggStyles.catBadge, { color: colors.mutedForeground, borderColor: colors.border }]}>category</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll} decelerationRate="fast">
        <Pressable
          style={({ pressed }) => [styles.categoryChip, { backgroundColor: activeCategory === null ? colors.primary : colors.secondary, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[styles.chipText, { color: activeCategory === null ? colors.primaryForeground : colors.foreground }]}>{t("shop.all")}</Text>
        </Pressable>
        {categories.map((cat: string) => (
          <Pressable
            key={cat}
            style={({ pressed }) => [styles.categoryChip, { backgroundColor: activeCategory === cat ? colors.primary : colors.secondary, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => setActiveCategory(cat === activeCategory ? null : cat)}
          >
            <Text style={[styles.chipText, { color: activeCategory === cat ? colors.primaryForeground : colors.foreground }]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.categoryScroll, { paddingTop: 0 }]} decelerationRate="fast">
        {(Object.keys(MOBILE_SORT_LABELS) as MobileSortOption[]).map((opt) => {
          const active = sortBy === opt;
          return (
            <Pressable
              key={opt}
              style={({ pressed }) => [styles.sortChip, { backgroundColor: active ? "#10B98122" : colors.secondary, borderColor: active ? "#10B981" : colors.border, opacity: pressed ? 0.75 : 1 }]}
              onPress={() => setSortBy(opt)}
            >
              <Text style={[styles.sortChipText, { color: active ? "#10B981" : colors.mutedForeground }]}>
                {MOBILE_SORT_LABELS[opt][getLocale()] ?? MOBILE_SORT_LABELS[opt].en}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Intent banner ── */}
      {searchIntent && debouncedSearch.length >= 2 && (
        <View style={[intentStyles.banner, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
          <Ionicons name="sparkles-outline" size={13} color={colors.primary} />
          <Text style={[intentStyles.bannerText, { color: colors.primary }]}>
            {searchIntent === "on_sale"  ? t("shop.intent_on_sale")  :
             searchIntent === "cheap"   ? t("shop.intent_cheap")    :
             searchIntent === "premium" ? t("shop.intent_premium")  :
             searchIntent === "rating"  ? t("shop.intent_rating")   :
             searchIntent === "newest"  ? t("shop.intent_newest")   :
             searchIntent === "gift"    ? t("shop.intent_gift")     : null}
          </Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.categoryScroll, { paddingTop: 0 }]} decelerationRate="fast">
        {/* On Sale chip */}
        <Pressable
          style={({ pressed }) => [styles.sortChip, { backgroundColor: onSale ? "#EF444422" : colors.secondary, borderColor: onSale ? "#EF4444" : colors.border, opacity: pressed ? 0.75 : 1 }]}
          onPress={() => { setOnSale((v) => !v); void Haptics.selectionAsync(); }}
        >
          <Text style={[styles.sortChipText, { color: onSale ? "#EF4444" : colors.mutedForeground }]}>🏷 {t("shop.on_sale")}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.sortChip, { backgroundColor: inStock ? "#10B98122" : colors.secondary, borderColor: inStock ? "#10B981" : colors.border, opacity: pressed ? 0.75 : 1 }]}
          onPress={() => setInStock((v) => !v)}
        >
          <Text style={[styles.sortChipText, { color: inStock ? "#10B981" : colors.mutedForeground }]}>✓ {t("shop.in_stock")}</Text>
        </Pressable>
        {/* Price range chip */}
        <Pressable
          style={({ pressed }) => [
            styles.sortChip,
            {
              backgroundColor: (priceMin != null || priceMax != null) ? colors.primary + "22" : colors.secondary,
              borderColor: (priceMin != null || priceMax != null) ? colors.primary : colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          onPress={() => { setTempMin(priceMin != null ? String(priceMin) : ""); setTempMax(priceMax != null ? String(priceMax) : ""); setShowFilterPanel(true); }}
        >
          <Ionicons name="options-outline" size={12} color={(priceMin != null || priceMax != null) ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.sortChipText, { color: (priceMin != null || priceMax != null) ? colors.primary : colors.mutedForeground }]}>
            {(priceMin != null || priceMax != null)
              ? `$${priceMin ?? 0}–${priceMax != null ? "$" + priceMax : "∞"}`
              : t("shop.price_range")}
          </Text>
        </Pressable>
        {[4, 3].map((star) => {
          const active = minRating === star;
          return (
            <Pressable
              key={star}
              style={({ pressed }) => [styles.sortChip, { backgroundColor: active ? "#F59E0B22" : colors.secondary, borderColor: active ? "#F59E0B" : colors.border, opacity: pressed ? 0.75 : 1 }]}
              onPress={() => setMinRating(active ? 0 : star)}
            >
              <Text style={[styles.sortChipText, { color: active ? "#F59E0B" : colors.mutedForeground }]}>★ {star}+</Text>
            </Pressable>
          );
        })}
        {(minRating > 0 || inStock || sortBy !== "newest" || onSale || priceMin != null || priceMax != null) && (
          <Pressable
            style={({ pressed }) => [styles.sortChip, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
            onPress={() => { setMinRating(0); setInStock(false); setSortBy("newest"); setOnSale(false); setPriceMin(null); setPriceMax(null); }}
          >
            <Text style={[styles.sortChipText, { color: colors.mutedForeground }]}>✕ {t("shop.clear_filters")}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );

  const homepageHeader = (
    <HomepageHeader
      topPad={topPad}
      colors={colors}
      search={search}
      setSearch={setSearch}
      setDebouncedSearch={setDebouncedSearch}
      searchFocused={searchFocused}
      setSearchFocused={setSearchFocused}
      handleSearchChange={handleSearchChange}
      mobileSuggestions={mobileSuggestions}
      setMobileSuggestions={setMobileSuggestions}
      categories={categories}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      bestSellers={bestSellers}
      newArrivals={newArrivals}
      isLoadingBestSellers={isLoadingBestSellers}
      isLoadingNewArrivals={isLoadingNewArrivals}
      trending={trending}
      isLoadingTrending={isLoadingTrending}
    />
  );

  const relatedSearchesFooter = debouncedSearch.length >= 2 && relatedSearches.length > 0 ? (
    <View style={[relStyles.container, { borderTopColor: colors.border }]}>
      <Text style={[relStyles.title, { color: colors.mutedForeground }]}>{t("shop.related_searches")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={relStyles.chipRow}>
        {relatedSearches.map((r) => (
          <Pressable
            key={r.query}
            style={({ pressed }) => [relStyles.chip, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
            onPress={() => { setSearch(r.query); setDebouncedSearch(r.query); setSearchFocused(false); }}
          >
            <Ionicons name="search-outline" size={11} color={colors.mutedForeground} style={{ marginRight: 4 }} />
            <Text style={[relStyles.chipText, { color: colors.foreground }]} numberOfLines={1}>{r.query}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  ) : null;

  return (
    <View style={[styles.shopContainer, { backgroundColor: colors.background }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.grid, { paddingBottom: tabBarHeight }]}
        ListHeaderComponent={isShopMode ? shopHeader : homepageHeader}
        ListFooterComponent={relatedSearchesFooter}
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("shop.no_products")}</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
        }
        renderItem={renderProductItem}
      />

      {/* ── Price Filter Panel Modal ── */}
      <Modal
        visible={showFilterPanel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterPanel(false)}
      >
        <KeyboardAvoidingView
          style={[styles.shopContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.shopHeader, { paddingTop: 20, borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: 16 }]}>
            <Text style={[styles.shopTitle, { color: colors.foreground, fontSize: 18 }]}>{t("shop.price_range")}</Text>
            <Pressable onPress={() => setShowFilterPanel(false)} style={[styles.searchIconBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.clearAllText, { color: colors.mutedForeground, marginBottom: 6 }]}>{t("shop.price_min_placeholder")}</Text>
                <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: colors.mutedForeground }}>$</Text>
                  <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    value={tempMin}
                    onChangeText={setTempMin}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.clearAllText, { color: colors.mutedForeground, marginBottom: 6 }]}>{t("shop.price_max_placeholder")}</Text>
                <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: colors.mutedForeground }}>$</Text>
                  <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    value={tempMax}
                    onChangeText={setTempMax}
                    keyboardType="numeric"
                    placeholder="∞"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable
                style={({ pressed }) => [styles.clearAllBtn, { flex: 1, justifyContent: "center", borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
                onPress={() => { setTempMin(""); setTempMax(""); setPriceMin(null); setPriceMax(null); setShowFilterPanel(false); }}
              >
                <Text style={[styles.clearAllText, { color: colors.mutedForeground }]}>{t("shop.reset_filters")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.clearAllBtn,
                  { flex: 2, justifyContent: "center", backgroundColor: colors.primary, borderColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => {
                  const mn = parseFloat(tempMin);
                  const mx = parseFloat(tempMax);
                  setPriceMin(!isNaN(mn) && mn > 0 ? mn : null);
                  setPriceMax(!isNaN(mx) && mx > 0 ? mx : null);
                  setShowFilterPanel(false);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.clearAllText, { color: colors.primaryForeground, fontWeight: "700" as const }]}>{t("shop.apply_filters")}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; accent: string }) {
  const colors = useColors();
  return (
    <View style={[statStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: `${accent}22` }]}>
        <Ionicons name={icon} size={22} color={accent} />
      </View>
      <Text style={[statStyles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function SellerDashboard() {
  const colors = useColors();
  const { topPad, tabBarHeight } = useScreenLayout();
  const { data, isLoading, refetch, isRefetching } = useGetSellerDashboard();

  return (
    <ScrollView
      style={[styles.shopContainer, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: tabBarHeight, paddingHorizontal: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
    >
      <Text style={[styles.shopTitle, { color: colors.foreground }]}>{t("profile.dashboard_title")}</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : data ? (
        <>
          <View style={dashStyles.statsGrid}>
            <StatCard label={t("profile.stat_revenue")} value={`$${data.totalRevenue.toFixed(0)}`} icon="cash-outline" accent="#10B981" />
            <StatCard label={t("profile.stat_orders")} value={String(data.totalOrders)} icon="receipt-outline" accent="#3B82F6" />
            <StatCard label={t("profile.stat_products")} value={String(data.totalProducts)} icon="cube-outline" accent="#8B5CF6" />
            <StatCard label={t("profile.stat_pending")} value={String(data.pendingOrders)} icon="hourglass-outline" accent="#F59E0B" />
          </View>
          {data.lowStockProducts > 0 && (
            <View style={[dashStyles.alert, { backgroundColor: colors.card, borderColor: "#F59E0B" }]}>
              <Ionicons name="warning-outline" size={18} color="#F59E0B" />
              <Text style={[dashStyles.alertText, { color: colors.foreground }]}>
                {data.lowStockProducts > 1
                  ? t("profile.low_stock_plural", { count: String(data.lowStockProducts) })
                  : t("profile.low_stock", { count: String(data.lowStockProducts) })}
              </Text>
            </View>
          )}
          {data.recentOrders.length > 0 && (
            <View>
              <Text style={[dashStyles.sectionTitle, { color: colors.foreground }]}>{t("profile.recent_orders")}</Text>
              {data.recentOrders.slice(0, 3).map((order: any) => (
                <Pressable
                  key={order.id}
                  style={({ pressed }) => [dashStyles.recentOrder, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => router.push("/(tabs)/orders")}
                >
                  <View>
                    <Text style={[dashStyles.orderId, { color: colors.foreground }]}>{t("profile.order_id", { id: String(order.id) })}</Text>
                    <Text style={[dashStyles.orderMeta, { color: colors.mutedForeground }]}>
                      {order.customerName} · {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View>
                    <Text style={[dashStyles.orderTotal, { color: colors.foreground }]}>${order.total.toFixed(2)}</Text>
                    <Text style={{ color: "#F59E0B", fontSize: 12, textAlign: "right" }}>{order.status}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shopContainer: { flex: 1 },
  shopHeader: { paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, gap: 10 },
  homeTopRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  shopTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting: { fontSize: 12, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  shopTitle: { fontSize: 26, fontWeight: "700" as const },
  searchIconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  clearAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  clearAllText: { fontSize: 12, fontWeight: "500" as const },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, height: 42 },
  searchInput: { flex: 1, fontSize: 14 },
  categoryScroll: { gap: 8, paddingVertical: 2 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  chipText: { fontSize: 13, fontWeight: "500" as const },
  grid: { gap: 10 },
  row: { gap: 10, paddingHorizontal: 12 },
  cardWrapper: { flex: 1 },
  emptyContainer: { alignItems: "center", gap: 8, paddingTop: 60, paddingBottom: 40 },
  emptyText: { fontSize: 15 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  sortChipText: { fontSize: 12, fontWeight: "500" as const },
});

const heroStyles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "700" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  loading: { height: 140, alignItems: "center", justifyContent: "center" },
  list: { gap: 10, paddingBottom: 4 },
  allProductsHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 8 },
  allTitle: { fontSize: 18, fontWeight: "700" as const },
});

const miniStyles = StyleSheet.create({
  card: { width: 130, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  imgWrap: { width: "100%", aspectRatio: 1, alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  img: { width: "100%", height: "100%" },
  badge: { position: "absolute", top: 5, start: 5, backgroundColor: "#EF4444", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" as const },
  info: { padding: 8, gap: 3 },
  name: { fontSize: 12, fontWeight: "500" as const, lineHeight: 15 },
  price: { fontSize: 13, fontWeight: "800" as const },
});

const suggStyles = StyleSheet.create({
  overlay: { borderWidth: 1, borderRadius: 10, overflow: "hidden", marginTop: -4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, fontSize: 13.5 },
  catBadge: { fontSize: 10, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.4, borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
});

const intentStyles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  bannerText: { fontSize: 12, fontWeight: "600" as const, flex: 1 },
});

const quickStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnText: { flex: 1, fontSize: 12, fontWeight: "500" as const },
});

const relStyles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500" as const },
});

const statStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, gap: 6, minHeight: 100 },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 22, fontWeight: "700" as const, marginTop: 4 },
  label: { fontSize: 12 },
});

const dashStyles = StyleSheet.create({
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  alert: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  alertText: { fontSize: 13, flex: 1 },
  sectionTitle: { fontSize: 17, fontWeight: "700" as const, marginBottom: 10 },
  recentOrder: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  orderId: { fontSize: 14, fontWeight: "600" as const },
  orderMeta: { fontSize: 12, marginTop: 2 },
  orderTotal: { fontSize: 15, fontWeight: "700" as const, textAlign: "right" },
});
