import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
  fetch(`${getBaseUrl()}/search/click`, {
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
  const addToCart = useAddToCart();
  const suggestTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(text: string) {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(text), 400);
  }

  // Fetch suggestions when typing ≥ 2 chars; also captures searchLogId for CTR
  useEffect(() => {
    if (suggestTimeout.current) clearTimeout(suggestTimeout.current);
    if (debouncedSearch.length < 2) {
      setMobileSuggestions({ suggestions: [], categories: [] });
      setSearchLogId(null);
      return;
    }
    suggestTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/search/suggestions?q=${encodeURIComponent(debouncedSearch)}`);
        if (!res.ok) return;
        const data = await res.json() as { suggestions?: SuggestionItem[]; categories?: CategorySuggestion[]; searchLogId?: number | null };
        setMobileSuggestions({
          suggestions: data.suggestions ?? [],
          categories: data.categories ?? [],
        });
        setSearchLogId(typeof data.searchLogId === "number" ? data.searchLogId : null);
      } catch { /* network error — stay silent */ }
    }, 100);
    return () => { if (suggestTimeout.current) clearTimeout(suggestTimeout.current); };
  }, [debouncedSearch]);

  // Fetch related searches when search query is active
  useEffect(() => {
    if (debouncedSearch.length < 2) { setRelatedSearches([]); return; }
    let cancelled = false;
    fetch(`${getBaseUrl()}/search/related?q=${encodeURIComponent(debouncedSearch)}&limit=5`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled && d?.related) setRelatedSearches(d.related); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const { data: categories = [] } = useListCategories();
  const {
    data: products = [],
    isLoading,
    refetch,
    isRefetching,
  } = useListProducts({
    category: activeCategory ?? undefined,
    search: debouncedSearch || undefined,
    sortBy,
    minRating: minRating > 0 ? minRating : undefined,
    inStock: inStock || undefined,
  } as any);

  const handleAddToCart = useCallback((product: Product) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
  }, [addToCart]);

  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <View style={styles.cardWrapper}>
      <ProductCard
        product={item}
        onAddToCart={handleAddToCart}
        onCardPress={debouncedSearch.length >= 2 && searchLogId != null ? () => recordMobileSearchClick(searchLogId) : undefined}
      />
    </View>
  ), [handleAddToCart, debouncedSearch, searchLogId]);

  // Shop header lives inside the FlatList as ListHeaderComponent so it
  // scrolls naturally with the product list instead of being pinned above it.
  const shopHeader = (
    <View
      style={[
        styles.shopHeader,
        {
          paddingTop: topPad + 8,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.shopTitle, { color: colors.foreground }]}>{t("shop.title")}</Text>
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
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
          <Pressable
            onPress={() => {
              setSearch("");
              setDebouncedSearch("");
            }}
          >
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* ── Search suggestion overlay ── */}
      {searchFocused && search.length >= 2 && (mobileSuggestions.suggestions.length > 0 || mobileSuggestions.categories.length > 0) && (
        <View style={[suggStyles.overlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {mobileSuggestions.suggestions.slice(0, 5).map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[suggStyles.row, { borderBottomColor: colors.border }]}
              onPress={() => {
                const text = s.text;
                setSearch(text);
                setDebouncedSearch(text);
                setSearchFocused(false);
                setMobileSuggestions({ suggestions: [], categories: [] });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={14} color={colors.mutedForeground} />
              <Text style={[suggStyles.rowText, { color: colors.foreground }]} numberOfLines={1}>
                {s.text}
              </Text>
            </TouchableOpacity>
          ))}
          {mobileSuggestions.categories.slice(0, 2).map((cat) => (
            <TouchableOpacity
              key={cat.slug}
              style={[suggStyles.row, { borderBottomColor: colors.border }]}
              onPress={() => {
                setSearchFocused(false);
                setSearch("");
                setDebouncedSearch("");
                setMobileSuggestions({ suggestions: [], categories: [] });
                router.push(`/(tabs)/shop?category=${encodeURIComponent(cat.slug)}` as any);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="layers-outline" size={14} color="#60a5fa" />
              <Text style={[suggStyles.rowText, { color: colors.foreground }]} numberOfLines={1}>
                {cat.labelEn}
              </Text>
              <Text style={[suggStyles.catBadge, { color: colors.mutedForeground, borderColor: colors.border }]}>
                category
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Category chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        decelerationRate="fast"
      >
        <Pressable
          style={({ pressed }) => [
            styles.categoryChip,
            {
              backgroundColor:
                activeCategory === null ? colors.primary : colors.secondary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => setActiveCategory(null)}
        >
          <Text
            style={[
              styles.chipText,
              { color: activeCategory === null ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {t("shop.all")}
          </Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            style={({ pressed }) => [
              styles.categoryChip,
              {
                backgroundColor: activeCategory === cat ? colors.primary : colors.secondary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => setActiveCategory(cat === activeCategory ? null : cat)}
          >
            <Text
              style={[
                styles.chipText,
                { color: activeCategory === cat ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Sort chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.categoryScroll, { paddingTop: 0 }]}
        decelerationRate="fast"
      >
        {(Object.keys(MOBILE_SORT_LABELS) as MobileSortOption[]).map((opt) => {
          const active = sortBy === opt;
          return (
            <Pressable
              key={opt}
              style={({ pressed }) => [
                styles.sortChip,
                {
                  backgroundColor: active ? "#10B98122" : colors.secondary,
                  borderColor: active ? "#10B981" : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={() => setSortBy(opt)}
            >
              <Text style={[styles.sortChipText, { color: active ? "#10B981" : colors.mutedForeground }]}>
                {MOBILE_SORT_LABELS[opt][getLocale()] ?? MOBILE_SORT_LABELS[opt].en}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Filter chips row (rating + inStock) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.categoryScroll, { paddingTop: 0 }]}
        decelerationRate="fast"
      >
        {/* inStock toggle */}
        <Pressable
          style={({ pressed }) => [
            styles.sortChip,
            {
              backgroundColor: inStock ? "#10B98122" : colors.secondary,
              borderColor: inStock ? "#10B981" : colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          onPress={() => setInStock((v) => !v)}
        >
          <Text style={[styles.sortChipText, { color: inStock ? "#10B981" : colors.mutedForeground }]}>
            ✓ {t("shop.in_stock")}
          </Text>
        </Pressable>
        {/* Rating chips */}
        {[4, 3].map((star) => {
          const active = minRating === star;
          return (
            <Pressable
              key={star}
              style={({ pressed }) => [
                styles.sortChip,
                {
                  backgroundColor: active ? "#F59E0B22" : colors.secondary,
                  borderColor: active ? "#F59E0B" : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={() => setMinRating(active ? 0 : star)}
            >
              <Text style={[styles.sortChipText, { color: active ? "#F59E0B" : colors.mutedForeground }]}>
                ★ {star}+
              </Text>
            </Pressable>
          );
        })}
        {/* Clear all filters */}
        {(minRating > 0 || inStock || sortBy !== "newest") && (
          <Pressable
            style={({ pressed }) => [
              styles.sortChip,
              { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={() => { setMinRating(0); setInStock(false); setSortBy("newest"); }}
          >
            <Text style={[styles.sortChipText, { color: colors.mutedForeground }]}>✕ {t("shop.clear_filters")}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );

  const relatedSearchesFooter = debouncedSearch.length >= 2 && relatedSearches.length > 0 ? (
    <View style={[relStyles.container, { borderTopColor: colors.border }]}>
      <Text style={[relStyles.title, { color: colors.mutedForeground }]}>{t("shop.related_searches")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={relStyles.chipRow}>
        {relatedSearches.map((r) => (
          <Pressable
            key={r.query}
            style={({ pressed }) => [relStyles.chip, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
            onPress={() => {
              setSearch(r.query);
              setDebouncedSearch(r.query);
              setSearchFocused(false);
            }}
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
        ListHeaderComponent={shopHeader}
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
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t("shop.no_products")}
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
        renderItem={renderProductItem}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        statStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
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
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: tabBarHeight,
        paddingHorizontal: 16,
        gap: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={colors.primary}
        />
      }
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
              <Text style={[dashStyles.sectionTitle, { color: colors.foreground }]}>
                {t("profile.recent_orders")}
              </Text>
              {data.recentOrders.slice(0, 3).map((order) => (
                <Pressable
                  key={order.id}
                  style={({ pressed }) => [
                    dashStyles.recentOrder,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  onPress={() => router.push("/(tabs)/orders")}
                >
                  <View>
                    <Text style={[dashStyles.orderId, { color: colors.foreground }]}>
                      {t("profile.order_id", { id: String(order.id) })}
                    </Text>
                    <Text style={[dashStyles.orderMeta, { color: colors.mutedForeground }]}>
                      {order.customerName} · {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View>
                    <Text style={[dashStyles.orderTotal, { color: colors.foreground }]}>
                      ${order.total.toFixed(2)}
                    </Text>
                    <Text style={{ color: "#F59E0B", fontSize: 12, textAlign: "right" }}>
                      {order.status}
                    </Text>
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
  shopHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  shopTitle: { fontSize: 26, fontWeight: "700" as const },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 14 },
  categoryScroll: { gap: 8, paddingVertical: 2 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: { fontSize: 13, fontWeight: "500" as const },
  grid: { gap: 10 },
  row: { gap: 10, paddingHorizontal: 12 },
  cardWrapper: { flex: 1 },
  emptyContainer: {
    alignItems: "center",
    gap: 8,
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyText: { fontSize: 15 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipText: { fontSize: 12, fontWeight: "500" as const },
});

const suggStyles = StyleSheet.create({
  overlay: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: -4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, fontSize: 13.5 },
  catBadge: {
    fontSize: 10,
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
});

const relStyles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500" as const },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    minHeight: 100,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: 22, fontWeight: "700" as const, marginTop: 4 },
  label: { fontSize: 12 },
});

const dashStyles = StyleSheet.create({
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertText: { fontSize: 13, flex: 1 },
  sectionTitle: { fontSize: 17, fontWeight: "700" as const, marginBottom: 10 },
  recentOrder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  orderId: { fontSize: 14, fontWeight: "600" as const },
  orderMeta: { fontSize: 12, marginTop: 2 },
  orderTotal: { fontSize: 15, fontWeight: "700" as const, textAlign: "right" },
});
