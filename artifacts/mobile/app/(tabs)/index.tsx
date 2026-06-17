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
  useGetCart,
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

// ─── Shared Section Header ───────────────────────────────────────────────────
interface SectionHeaderProps {
  label: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  colors: ReturnType<typeof useColors>;
}
function SectionHeader({ label, onSeeAll, seeAllLabel, colors }: SectionHeaderProps) {
  return (
    <View style={sectionStyles.row}>
      <Text style={[sectionStyles.label, { color: colors.foreground }]}>{label}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text style={[sectionStyles.seeAll, { color: colors.primary }]}>
            {seeAllLabel ?? t("home.categories_see_all")} →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Rich Section Header (eyebrow + h2 + see-all, matches web pattern) ───────
interface RichSectionHeaderProps {
  eyebrow: string;
  title: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  colors: ReturnType<typeof useColors>;
}
function RichSectionHeader({ eyebrow, title, onSeeAll, seeAllLabel, colors }: RichSectionHeaderProps) {
  return (
    <View style={richHeaderStyles.container}>
      <Text style={[richHeaderStyles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
      <View style={richHeaderStyles.titleRow}>
        <Text style={[richHeaderStyles.title, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll}>
            <Text style={[richHeaderStyles.seeAll, { color: colors.primary }]}>
              {seeAllLabel ?? t("home.categories_see_all")} →
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Hero Banner Section ─────────────────────────────────────────────────────
const HERO_IMAGES = [
  "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop",
  "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop",
  "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop",
  "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop",
  "https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop",
];

function HeroBannerSection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const locale = getLocale();
  const isAr = locale === "ar";
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlideIdx((i) => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={[heroStyles.container, { borderColor: colors.border }]}>
      {/* Background image carousel */}
      <Image source={{ uri: HERO_IMAGES[slideIdx] }} style={heroStyles.bgImage} resizeMode="cover" />
      {/* Dark overlay so text stays readable */}
      <View style={heroStyles.darkOverlay} />
      {/* Subtle emerald glow blobs */}
      <View style={heroStyles.glowOverlay} pointerEvents="none">
        <View style={heroStyles.glow1} />
        <View style={heroStyles.glow2} />
      </View>

      {/* Discount badge — top left, mirrors web */}
      <View style={[heroStyles.discountBadge, { backgroundColor: colors.primary }]}>
        <Text style={heroStyles.discountBadgeText}>{isAr ? "خصم لغاية 50%" : "Up to 50% Off"}</Text>
      </View>

      <View style={heroStyles.content}>
        {/* SYANO brand badge */}
        <View style={[heroStyles.badge, { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.25)" }]}>
          <View style={[heroStyles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[heroStyles.badgeText, { color: "#fff" }]}>SYANO</Text>
        </View>

        {/* Tagline — matches web gradient headline style */}
        <Text style={[heroStyles.tagline, { color: "#fff", textAlign: isAr ? "right" : "left" }]}>
          {t("home.hero_tagline")}
        </Text>
        <Text style={[heroStyles.subtitle, { color: "rgba(255,255,255,0.8)", textAlign: isAr ? "right" : "left" }]}>
          {t("home.hero_subtitle")}
        </Text>

        {/* CTA Buttons — matches web "Shop Now" + "Explore Stores" */}
        <View style={[heroStyles.ctaRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <Pressable
            style={({ pressed }) => [heroStyles.ctaPrimary, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Text style={heroStyles.ctaPrimaryText}>{t("home.shop_now")}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [heroStyles.ctaSecondary, { borderColor: "rgba(255,255,255,0.35)", opacity: pressed ? 0.75 : 1 }]}
            onPress={() => router.push("/store-directory" as any)}
          >
            <Text style={heroStyles.ctaSecondaryText}>{t("home.explore_stores")}</Text>
          </Pressable>
        </View>

        {/* Stats row — value + label, matches web 3-stat pattern */}
        <View style={[heroStyles.statsRow, { borderTopColor: "rgba(255,255,255,0.18)" }]}>
          <HeroStat value={t("home.stats_sellers")} label={t("home.hero_stat_stores")} colors={colors} />
          <View style={[heroStyles.statDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
          <HeroStat value={t("home.stats_products")} label={t("home.hero_stat_products")} colors={colors} />
          <View style={[heroStyles.statDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
          <HeroStat value={t("home.stats_customers")} label={t("home.hero_stat_customers")} colors={colors} />
        </View>

        {/* Carousel progress dots */}
        <View style={heroStyles.dotsRow}>
          {HERO_IMAGES.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => setSlideIdx(i)}
              style={[heroStyles.slideDot, { width: i === slideIdx ? 20 : 6, backgroundColor: i === slideIdx ? colors.primary : "rgba(255,255,255,0.4)" }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function HeroStat({ value, label, colors }: { value: string; label?: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={heroStyles.statItem}>
      <Text style={[heroStyles.statValue, { color: colors.primary }]}>{value}</Text>
      {label ? <Text style={heroStyles.statLabel}>{label}</Text> : null}
    </View>
  );
}

// ─── Category Grid Section ───────────────────────────────────────────────────
const CATEGORY_DEFS = [
  { nameEn: "Electronics",          nameAr: "الإلكترونيات",    img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop&auto=format&q=80", color: "#3b82f6", slug: "Electronics",          countKey: "home.categories_count_electronics" as const },
  { nameEn: "Fashion",              nameAr: "الأزياء",          img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop&auto=format&q=80", color: "#ec4899", slug: "Fashion",               countKey: "home.categories_count_fashion"      as const },
  { nameEn: "Beauty",               nameAr: "التجميل",          img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop&auto=format&q=80", color: "#f59e0b", slug: "Beauty & Personal Care", countKey: "home.categories_count_beauty"       as const },
  { nameEn: "Home & Kitchen",       nameAr: "المنزل والمطبخ",  img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&auto=format&q=80", color: "#8b5cf6", slug: "Home & Kitchen",         countKey: "home.categories_count_home"         as const },
  { nameEn: "Sports",               nameAr: "الرياضة",          img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop&auto=format&q=80", color: "#10b981", slug: "Sports & Fitness",       countKey: "home.categories_count_sports"       as const },
  { nameEn: "Accessories",          nameAr: "الإكسسوارات",     img: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&h=300&fit=crop&auto=format&q=80", color: "#f97316", slug: "Accessories",            countKey: "home.categories_count_accessories"  as const },
  { nameEn: "Phones",               nameAr: "الهواتف",          img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop&auto=format&q=80", color: "#06b6d4", slug: "Electronics",          countKey: "home.categories_count_phones"       as const },
  { nameEn: "Computers",            nameAr: "الحواسيب",         img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop&auto=format&q=80", color: "#a855f7", slug: "Electronics",          countKey: "home.categories_count_computers"    as const },
];

interface CategoryGridProps {
  colors: ReturnType<typeof useColors>;
  onSelectCategory: (slug: string) => void;
}

function CategoryGridSection({ colors, onSelectCategory }: CategoryGridProps) {
  const locale = getLocale();
  const isAr = locale === "ar";

  return (
    <View style={[catGridStyles.container, { backgroundColor: colors.background }]}>
      <RichSectionHeader
        eyebrow={t("home.categories_eyebrow")}
        title={t("home.categories_title")}
        onSeeAll={() => router.push("/categories")}
        seeAllLabel={t("home.categories_see_all")}
        colors={colors}
      />
      <View style={catGridStyles.grid}>
        {CATEGORY_DEFS.map((cat, i) => (
          <Pressable
            key={`${cat.slug}-${i}`}
            style={({ pressed }) => [catGridStyles.cell, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => { onSelectCategory(cat.slug); void Haptics.selectionAsync(); }}
          >
            <Image source={{ uri: cat.img }} style={catGridStyles.img} resizeMode="cover" />
            <View style={catGridStyles.overlay} />
            <View style={[catGridStyles.colorBar, { backgroundColor: cat.color }]} />
            <View style={catGridStyles.textWrap}>
              <Text style={catGridStyles.catName} numberOfLines={1}>
                {isAr ? cat.nameAr : cat.nameEn}
              </Text>
              <Text style={catGridStyles.catCount} numberOfLines={1}>
                {t(cat.countKey)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Countdown Timer ─────────────────────────────────────────────────────────
function CountdownTimer({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [time, setTime] = useState({ h: 8, m: 24, s: 37 });
  useEffect(() => {
    const id = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <View style={dealStyles.timerRow}>
      <Ionicons name="timer-outline" size={13} color={colors.primary} />
      <Text style={[dealStyles.timerLabel, { color: colors.mutedForeground }]}>{t("home.deals_ends_in")}</Text>
      {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
        <React.Fragment key={i}>
          <View style={[dealStyles.timerChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[dealStyles.timerVal, { color: colors.foreground }]}>{v}</Text>
          </View>
          {i < 2 && <Text style={[dealStyles.timerColon, { color: colors.mutedForeground }]}>:</Text>}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Deal Mini Card ───────────────────────────────────────────────────────────
interface DealMiniCardProps {
  product: Product;
  colors: ReturnType<typeof useColors>;
  onAddToCart: (id: number) => void;
}
function DealMiniCard({ product, colors, onAddToCart }: DealMiniCardProps) {
  const img = (product.imageUrls as string[] | null)?.[0] ?? "";
  const price = (product as any).finalPrice ?? product.price ?? 0;
  const original = (product as any).originalPrice ?? null;
  const disc = (product as any).discountPercent ?? null;
  const hasDisc = disc != null && disc > 0;
  const locale = getLocale();
  const name = locale === "ar" && (product as any).nameAr ? (product as any).nameAr : product.name;

  return (
    <Pressable
      style={[dealStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/product/${product.id}` as any)}
    >
      <View style={dealStyles.imgWrap}>
        {img ? (
          <Image source={{ uri: img }} style={dealStyles.img} resizeMode="cover" />
        ) : (
          <View style={[dealStyles.img, { backgroundColor: colors.secondary }]} />
        )}
        {hasDisc && (
          <View style={dealStyles.discBadge}>
            <Text style={dealStyles.discText}>-{Math.round(disc)}%</Text>
          </View>
        )}
      </View>
      <View style={dealStyles.info}>
        <Text style={[dealStyles.dealName, { color: colors.foreground }]} numberOfLines={2}>{name}</Text>
        <View style={dealStyles.priceRow}>
          <Text style={[dealStyles.price, { color: colors.primary }]}>${Number(price).toFixed(2)}</Text>
          {hasDisc && original && (
            <Text style={[dealStyles.original, { color: colors.mutedForeground }]}>${Number(original).toFixed(2)}</Text>
          )}
        </View>
        <Pressable
          style={[dealStyles.addBtn, { backgroundColor: colors.primary }]}
          onPress={(e) => { e.stopPropagation?.(); onAddToCart(product.id); }}
        >
          <Ionicons name="cart-outline" size={13} color="#000" />
          <Text style={dealStyles.addBtnText}>{t("cart.add_to_cart")}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─── Featured Deals Section ───────────────────────────────────────────────────
interface FeaturedDealsSectionProps {
  products: Product[];
  colors: ReturnType<typeof useColors>;
  onAddToCart: (id: number) => void;
}
function FeaturedDealsSection({ products, colors, onAddToCart }: FeaturedDealsSectionProps) {
  const deals = products.filter((p) => (p as any).discountPercent > 0).slice(0, 6);
  if (deals.length === 0) return null;

  return (
    <View style={[dealStyles.section, { backgroundColor: colors.background }]}>
      <View style={dealStyles.header}>
        <RichSectionHeader
          eyebrow={t("home.deals_eyebrow")}
          title={t("home.deals_title")}
          onSeeAll={() => router.push("/(tabs)/index" as any)}
          seeAllLabel={t("home.deals_see_all")}
          colors={colors}
        />
        <CountdownTimer colors={colors} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={dealStyles.list}
        decelerationRate="fast"
      >
        {deals.map((p) => (
          <DealMiniCard key={p.id} product={p} colors={colors} onAddToCart={onAddToCart} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Featured Stores Section ──────────────────────────────────────────────────
const STATIC_STORES = [
  { id: 1, name: "تك ستور سوريا", nameEn: "Tech Store Syria", taglineAr: "أحدث الإلكترونيات والأجهزة الذكية", taglineEn: "Latest electronics & smart devices", categoryAr: "إلكترونيات", categoryEn: "Electronics", rating: 4.9, reviews: 1840, productCount: 3240, coverImg: "https://images.unsplash.com/photo-1684395882817-030e24c0322a?w=600&h=200&fit=crop&auto=format&q=80", logoColor: "#3b82f6", logoInitial: "ت", verified: true },
  { id: 2, name: "دار الأناقة", nameEn: "Elegance House",     taglineAr: "أزياء فاخرة وموضة معاصرة للجميع",  taglineEn: "Luxury fashion & contemporary style", categoryAr: "أزياء",       categoryEn: "Fashion",     rating: 4.8, reviews: 2210, productCount: 1890, coverImg: "https://images.unsplash.com/photo-1768745294179-693a07a3f054?w=600&h=200&fit=crop&auto=format&q=80", logoColor: "#ec4899", logoInitial: "د", verified: true },
  { id: 3, name: "بيت الديكور",   nameEn: "Décor Home",        taglineAr: "أثاث عصري وإكسسوارات منزلية راقية", taglineEn: "Modern furniture & premium home décor", categoryAr: "ديكور منزلي", categoryEn: "Home Decor",  rating: 4.7, reviews: 956,  productCount: 2140, coverImg: "https://images.unsplash.com/photo-1724582586529-62622e50c0b3?w=600&h=200&fit=crop&auto=format&q=80", logoColor: "#8b5cf6", logoInitial: "ب", verified: true },
];

function FeaturedStoresSection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const locale = getLocale();
  const isAr = locale === "ar";

  return (
    <View style={[storeStyles.section, { backgroundColor: colors.background }]}>
      <RichSectionHeader
        eyebrow={t("home.stores_eyebrow")}
        title={t("home.stores_title")}
        onSeeAll={() => router.push("/store-directory" as any)}
        seeAllLabel={t("home.stores_see_all")}
        colors={colors}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={storeStyles.list}
        decelerationRate="fast"
      >
        {STATIC_STORES.map((store) => (
          <Pressable
            key={store.id}
            style={({ pressed }) => [storeStyles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push("/store-directory" as any)}
          >
            <View style={storeStyles.coverWrap}>
              <Image source={{ uri: store.coverImg }} style={storeStyles.cover} resizeMode="cover" />
              <View style={storeStyles.coverOverlay} />
              {store.verified && (
                <View style={[storeStyles.verifiedBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
                  <View style={[storeStyles.verifiedDot, { backgroundColor: colors.primary }]} />
                  <Text style={[storeStyles.verifiedText, { color: colors.primary }]}>{t("home.stores_verified")}</Text>
                </View>
              )}
            </View>
            <View style={storeStyles.cardBody}>
              <View style={storeStyles.logoRow}>
                <View style={[storeStyles.logoCircle, { backgroundColor: store.logoColor + "22", borderColor: store.logoColor + "44" }]}>
                  <Text style={[storeStyles.logoInitial, { color: store.logoColor }]}>{store.logoInitial}</Text>
                </View>
                <View style={storeStyles.ratingWrap}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={[storeStyles.rating, { color: colors.foreground }]}>{store.rating}</Text>
                  <Text style={[storeStyles.reviewCount, { color: colors.mutedForeground }]}>({store.reviews.toLocaleString()})</Text>
                </View>
              </View>
              <Text style={[storeStyles.storeName, { color: colors.foreground }]} numberOfLines={1}>
                {isAr ? store.name : store.nameEn}
              </Text>
              {/* Tagline — matches web store card description */}
              <Text style={[storeStyles.storeTagline, { color: colors.mutedForeground }]} numberOfLines={2}>
                {isAr ? store.taglineAr : store.taglineEn}
              </Text>
              <View style={[storeStyles.divider, { borderTopColor: colors.border }]} />
              <View style={storeStyles.statsRow}>
                <Ionicons name="cube-outline" size={11} color={colors.mutedForeground} />
                <Text style={[storeStyles.statsText, { color: colors.mutedForeground }]}>
                  {store.productCount.toLocaleString()} {t("home.stores_products")}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Join CTA Section ─────────────────────────────────────────────────────────
function JoinCTASection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { isAuthenticated } = useAuth();
  const locale = getLocale();
  const isAr = locale === "ar";

  return (
    <View style={[joinStyles.section, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <View style={joinStyles.header}>
        <View style={[joinStyles.badge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}>
          <Text style={[joinStyles.badgeText, { color: colors.primary }]}>SYANO</Text>
        </View>
        <Text style={[joinStyles.title, { color: colors.foreground, textAlign: isAr ? "right" : "center" }]}>{t("home.join_title")}</Text>
        <Text style={[joinStyles.subtitle, { color: colors.mutedForeground, textAlign: isAr ? "right" : "center" }]}>{t("home.join_subtitle")}</Text>
      </View>
      <View style={joinStyles.cardsRow}>
        <Pressable
          style={({ pressed }) => [joinStyles.card, joinStyles.sellerCard, { borderColor: colors.primary + "33", opacity: pressed ? 0.88 : 1 }]}
          onPress={() => router.push(isAuthenticated ? "/seller-apply" : "/login")}
        >
          <View style={[joinStyles.iconWrap, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "25" }]}>
            <Ionicons name="storefront-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[joinStyles.cardTitle, { color: colors.foreground }]}>{t("home.join_seller_title")}</Text>
          <Text style={[joinStyles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={3}>{t("home.join_seller_desc")}</Text>
          <View style={joinStyles.ctaRow}>
            <Text style={[joinStyles.ctaText, { color: colors.primary }]}>{t("home.join_seller_cta")}</Text>
            <Ionicons name={isAr ? "chevron-back" : "chevron-forward"} size={14} color={colors.primary} />
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [joinStyles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 }]}
          onPress={() => router.push(isAuthenticated ? "/courier-apply" : "/login")}
        >
          <View style={[joinStyles.iconWrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="bicycle-outline" size={24} color={colors.mutedForeground} />
          </View>
          <Text style={[joinStyles.cardTitle, { color: colors.foreground }]}>{t("home.join_courier_title")}</Text>
          <Text style={[joinStyles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={3}>{t("home.join_courier_desc")}</Text>
          <View style={joinStyles.ctaRow}>
            <Text style={[joinStyles.ctaText, { color: colors.mutedForeground }]}>{t("home.join_courier_cta")}</Text>
            <Ionicons name={isAr ? "chevron-back" : "chevron-forward"} size={14} color={colors.mutedForeground} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Mini Product Card (existing, unchanged) ──────────────────────────────────
function MiniProductCard({ product, colors, onAddToCart, style }: { product: Product; colors: ReturnType<typeof useColors>; onAddToCart: (id: number) => void; style?: object }) {
  const locale = getLocale();
  const img = (product.imageUrls as string[] | null)?.[0] ?? "";
  const price = (product as any).finalPrice ?? product.price ?? 0;
  const disc = (product as any).discountPercent ?? null;
  const hasDisc = disc != null && disc > 0;
  const name = locale === "ar" && (product as any).nameAr ? (product as any).nameAr : product.name;

  return (
    <Pressable
      style={({ pressed }) => [miniStyles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 }, style]}
      onPress={() => router.push(`/product/${product.id}` as any)}
    >
      <View style={miniStyles.imgWrap}>
        {img ? (
          <Image source={{ uri: img }} style={miniStyles.img} resizeMode="cover" />
        ) : (
          <View style={[miniStyles.img, { backgroundColor: colors.secondary }]} />
        )}
        {hasDisc && (
          <View style={miniStyles.badge}>
            <Text style={miniStyles.badgeText}>-{Math.round(disc)}%</Text>
          </View>
        )}
      </View>
      <View style={miniStyles.info}>
        <Text style={[miniStyles.name, { color: colors.foreground }]} numberOfLines={2}>{name}</Text>
        <Text style={[miniStyles.price, { color: colors.primary }]}>${Number(price).toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

// ─── Homepage Header (with all sections) ─────────────────────────────────────
interface HomepageHeaderProps {
  topPad: number;
  colors: ReturnType<typeof useColors>;
  search: string;
  setSearch: (v: string) => void;
  setDebouncedSearch: (v: string) => void;
  searchFocused: boolean;
  setSearchFocused: (v: boolean) => void;
  handleSearchChange: (v: string) => void;
  mobileSuggestions: MobileSuggestions | null;
  setMobileSuggestions: (v: MobileSuggestions | null) => void;
  categories: string[];
  activeCategory: string | null;
  setActiveCategory: (v: string | null) => void;
  bestSellers: Product[];
  newArrivals: Product[];
  isLoadingBestSellers: boolean;
  isLoadingNewArrivals: boolean;
  trending: Product[];
  isLoadingTrending: boolean;
  cartCount: number;
  onAddToCart: (id: number) => void;
}

function HomepageHeader({
  topPad, colors, search, setSearch, setDebouncedSearch,
  searchFocused, setSearchFocused, handleSearchChange,
  mobileSuggestions, setMobileSuggestions,
  categories, activeCategory, setActiveCategory,
  bestSellers, newArrivals, isLoadingBestSellers, isLoadingNewArrivals,
  trending, isLoadingTrending,
  cartCount, onAddToCart,
}: HomepageHeaderProps) {
  const locale = getLocale();
  const isAr = locale === "ar";

  const handleSuggestionTextClick = useCallback((text: string) => {
    setSearch(text);
    setDebouncedSearch(text);
    setSearchFocused(false);
    setMobileSuggestions(null);
  }, [setSearch, setDebouncedSearch, setSearchFocused, setMobileSuggestions]);

  const suggestions = mobileSuggestions?.suggestions ?? [];
  const catSuggestions = mobileSuggestions?.categories ?? [];

  return (
    <View style={{ backgroundColor: colors.background }}>
      {/* ── Top Row ── */}
      <View style={[styles.shopHeader, { paddingTop: topPad + 10, paddingBottom: 4, borderBottomWidth: 0 }]}>
        <View style={styles.homeTopRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{t("home.discover")}</Text>
            <Text style={[styles.shopTitle, { color: colors.foreground }]}>SYANO</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* Cart badge */}
            <Pressable
              style={[styles.searchIconBtn, { backgroundColor: colors.card, borderColor: colors.border, position: "relative" }]}
              onPress={() => router.push("/(tabs)/cart" as any)}
            >
              <Ionicons name="cart-outline" size={20} color={colors.foreground} />
              {cartCount > 0 && (
                <View style={[headerStyles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={headerStyles.badgeNum}>{cartCount > 9 ? "9+" : String(cartCount)}</Text>
                </View>
              )}
            </Pressable>
            {/* Notification bell */}
            <Pressable
              style={[styles.searchIconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/notifications" as any)}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        {/* ── Search Bar ── */}
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: searchFocused ? colors.primary : colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={t("common.search_placeholder")}
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            returnKeyType="search"
            textAlign={isAr ? "right" : "left"}
          />
          {search.length > 0 && (
            <Pressable onPress={() => { setSearch(""); setDebouncedSearch(""); setMobileSuggestions(null); }}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* ── Suggestions Overlay ── */}
        {searchFocused && (suggestions.length > 0 || catSuggestions.length > 0) && (
          <View style={[suggStyles.overlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {catSuggestions.slice(0, 2).map((c) => (
              <Pressable key={c.slug} style={[suggStyles.row, { borderBottomColor: colors.border }]}
                onPress={() => { setActiveCategory(c.slug); setSearchFocused(false); }}>
                <Ionicons name="grid-outline" size={14} color={colors.primary} />
                <Text style={[suggStyles.rowText, { color: colors.foreground }]} numberOfLines={1}>
                  {isAr && c.labelAr ? c.labelAr : c.labelEn}
                </Text>
                <Text style={[suggStyles.catBadge, { color: colors.primary, borderColor: colors.primary + "44" }]}>
                  {isAr ? "فئة" : "cat"}
                </Text>
              </Pressable>
            ))}
            {suggestions.slice(0, 5).map((s, i) => (
              <Pressable key={i} style={[suggStyles.row, { borderBottomColor: colors.border }]}
                onPress={() => handleSuggestionTextClick(isAr && s.textAr ? s.textAr : s.text)}>
                <Ionicons name="search-outline" size={14} color={colors.mutedForeground} />
                <Text style={[suggStyles.rowText, { color: colors.foreground }]} numberOfLines={1}>
                  {isAr && s.textAr ? s.textAr : s.text}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={quickStyles.row}>
          <Pressable
            style={({ pressed }) => [quickStyles.btn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
            onPress={() => router.push("/store-directory" as any)}
          >
            <Ionicons name="storefront-outline" size={14} color={colors.primary} />
            <Text style={[quickStyles.btnText, { color: colors.foreground }]} numberOfLines={1}>{t("home.browse_stores")}</Text>
            <Ionicons name={isAr ? "chevron-back" : "chevron-forward"} size={12} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [quickStyles.btn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
            onPress={() => router.push("/categories" as any)}
          >
            <Ionicons name="grid-outline" size={14} color={colors.primary} />
            <Text style={[quickStyles.btnText, { color: colors.foreground }]} numberOfLines={1}>{t("home.categories")}</Text>
            <Ionicons name={isAr ? "chevron-back" : "chevron-forward"} size={12} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* ── Hero Banner ── */}
      <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
        <HeroBannerSection colors={colors} />
      </View>

      {/* ── Hot Deals / Best Sellers carousel ── */}
      <View style={heroStyles2.container}>
        <RichSectionHeader
          eyebrow={t("home.hot_deals_eyebrow")}
          title={t("home.hot_deals_title")}
          onSeeAll={() => setActiveCategory(null)}
          seeAllLabel={t("home.categories_see_all")}
          colors={colors}
        />
        {isLoadingBestSellers ? (
          <View style={heroStyles2.loading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={heroStyles2.list} decelerationRate="fast">
            {bestSellers.map((p) => (
              <MiniProductCard key={p.id} product={p} colors={colors} onAddToCart={onAddToCart} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Popular Categories Grid ── */}
      <CategoryGridSection colors={colors} onSelectCategory={(slug) => setActiveCategory(slug)} />

      {/* ── Featured Deals with countdown ── */}
      <FeaturedDealsSection products={bestSellers} colors={colors} onAddToCart={onAddToCart} />

      {/* ── Trusted Stores ── */}
      <FeaturedStoresSection colors={colors} />

      {/* ── New Arrivals ── */}
      <View style={heroStyles2.container}>
        <RichSectionHeader
          eyebrow={t("home.arrivals_eyebrow")}
          title={t("home.arrivals_title")}
          onSeeAll={() => setActiveCategory(null)}
          seeAllLabel={t("home.categories_see_all")}
          colors={colors}
        />
        {isLoadingNewArrivals ? (
          <View style={heroStyles2.loading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={heroStyles2.list} decelerationRate="fast">
            {newArrivals.map((p) => (
              <MiniProductCard key={p.id} product={p} colors={colors} onAddToCart={onAddToCart} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Trending Now ── */}
      <View style={heroStyles2.container}>
        <RichSectionHeader
          eyebrow={t("home.trending_eyebrow")}
          title={t("home.trending_title")}
          onSeeAll={() => setActiveCategory(null)}
          seeAllLabel={t("home.categories_see_all")}
          colors={colors}
        />
        {isLoadingTrending ? (
          <View style={heroStyles2.loading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={heroStyles2.list} decelerationRate="fast">
            {trending.map((p) => (
              <MiniProductCard key={p.id} product={p} colors={colors} onAddToCart={onAddToCart} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Join CTA ── */}
      <JoinCTASection colors={colors} />

      {/* ── All Products Header ── */}
      <View style={[heroStyles2.allProductsHeader, { borderBottomColor: colors.border }]}>
        <Text style={[heroStyles2.allTitle, { color: colors.foreground }]}>{t("home.all_products")}</Text>
      </View>
    </View>
  );
}

// ─── Customer Shop ─────────────────────────────────────────────────────────────
function CustomerShop() {
  const colors = useColors();
  const { topPad, tabBarHeight } = useScreenLayout();
  const { isAuthenticated, isCustomer, isSeller, isAdmin, isCourier, token } = useAuth();
  const locale = getLocale();
  const isAr = locale === "ar";

  const [search, setSearch]                   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory]   = useState<string | null>(null);
  const [sortBy, setSortBy]                   = useState<MobileSortOption>("newest");
  const [minRating, setMinRating]             = useState(0);
  const [inStock, setInStock]                 = useState(false);
  const [onSale, setOnSale]                   = useState(false);
  const [priceMin, setPriceMin]               = useState<number | null>(null);
  const [priceMax, setPriceMax]               = useState<number | null>(null);
  const [searchFocused, setSearchFocused]     = useState(false);
  const [mobileSuggestions, setMobileSuggestions] = useState<MobileSuggestions | null>(null);
  const [searchIntent, setSearchIntent]       = useState<string | null>(null);
  const [relatedSearches, setRelatedSearches] = useState<{ query: string }[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [tempMin, setTempMin]                 = useState("");
  const [tempMax, setTempMax]                 = useState("");

  const isShopMode = debouncedSearch.length > 0 || activeCategory !== null || minRating > 0 || inStock || sortBy !== "newest" || onSale || priceMin != null || priceMax != null;

  const { data: categoriesData } = useListCategories();
  const categories = useMemo(() => (categoriesData?.map((c: any) => (isAr && c.labelAr ? c.labelAr : c.label)) ?? []), [categoriesData, isAr]);

  const { data: bestSellersData, isLoading: isLoadingBestSellers } = useGetBestSellers(8);
  const bestSellers: Product[] = useMemo(() => (bestSellersData as any)?.products ?? (Array.isArray(bestSellersData) ? bestSellersData : []), [bestSellersData]);

  const { data: newArrivalsData, isLoading: isLoadingNewArrivals } = useListProducts({ limit: 8, sortBy: "newest" });
  const newArrivals: Product[] = useMemo(() => newArrivalsData ?? [], [newArrivalsData]);

  const { data: trendingData, isLoading: isLoadingTrending } = useListProducts({ limit: 8, sortBy: "highest_rated" });
  const trending: Product[] = useMemo(() => trendingData ?? [], [trendingData]);

  const { data: cartData } = useGetCart({ query: { enabled: isAuthenticated && isCustomer } as any });
  const cartCount = useMemo(() => (cartData as any)?.items?.length ?? 0, [cartData]);

  const queryParams = useMemo(() => ({
    search: debouncedSearch || undefined,
    category: activeCategory ?? undefined,
    sortBy,
    minRating: minRating > 0 ? minRating : undefined,
    inStock: inStock || undefined,
    onSale: onSale || undefined,
    minPrice: priceMin ?? undefined,
    maxPrice: priceMax ?? undefined,
    limit: 30,
  }), [debouncedSearch, activeCategory, sortBy, minRating, inStock, onSale, priceMin, priceMax]);

  const { data: products = [], isLoading, isRefetching, refetch } = useListProducts(
    queryParams,
    { query: { enabled: isShopMode } as any },
  );

  const addToCartMutation = useAddToCart({
    mutation: {
      onSuccess: () => {},
      onError: () => {},
    },
  });

  const handleAddToCart = useCallback((productId: number) => {
    if (isSeller || isAdmin || isCourier) return;
    if (isAuthenticated && isCustomer) {
      addToCartMutation.mutate({ data: { productId, quantity: 1, variantId: null } });
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isAuthenticated, isCustomer, isSeller, isAdmin, isCourier, addToCartMutation]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setDebouncedSearch(text);
      if (text.length >= 2) {
        try {
          const url = `${getBaseUrl()}/api/search/suggestions?q=${encodeURIComponent(text)}&lang=${locale}&limit=5`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setMobileSuggestions({
              suggestions: data.suggestions ?? [],
              categories: data.categories ?? [],
            });
            setSearchIntent(data.intent ?? null);
            setRelatedSearches(data.relatedSearches ?? []);
          }
        } catch {}
      } else {
        setMobileSuggestions(null);
        setSearchIntent(null);
      }
    }, 200);
  }, [locale]);

  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <View style={styles.cardWrapper}>
      <ProductCard product={item as any} />
    </View>
  ), []);

  const shopHeader = (
    <View style={[styles.shopHeader, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
      <View style={styles.shopTitleRow}>
        <Text style={[styles.shopTitle, { color: colors.foreground }]}>
          {activeCategory ?? (onSale ? (isAr ? "عروض" : "On Sale") : (isAr ? "البحث" : "Search"))}
        </Text>
        <Pressable
          style={[styles.clearAllBtn, { borderColor: colors.border }]}
          onPress={() => { setSearch(""); setDebouncedSearch(""); setActiveCategory(null); setMinRating(0); setInStock(false); setSortBy("newest"); setOnSale(false); setPriceMin(null); setPriceMax(null); }}
        >
          <Ionicons name="close" size={12} color={colors.mutedForeground} />
          <Text style={[styles.clearAllText, { color: colors.mutedForeground }]}>{isAr ? "مسح" : "Clear"}</Text>
        </Pressable>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: searchFocused ? colors.primary : colors.border }]}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder={t("common.search_placeholder")}
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={handleSearchChange}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          returnKeyType="search"
          textAlign={isAr ? "right" : "left"}
        />
        {search.length > 0 && (
          <Pressable onPress={() => { setSearch(""); setDebouncedSearch(""); setMobileSuggestions(null); }}>
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {searchFocused && (mobileSuggestions?.suggestions?.length ?? 0) > 0 && (
        <View style={[suggStyles.overlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(mobileSuggestions?.categories ?? []).slice(0, 2).map((c) => (
            <Pressable key={c.slug} style={[suggStyles.row, { borderBottomColor: colors.border }]}
              onPress={() => { setActiveCategory(c.slug); setSearchFocused(false); }}>
              <Ionicons name="grid-outline" size={14} color={colors.primary} />
              <Text style={[suggStyles.rowText, { color: colors.foreground }]} numberOfLines={1}>
                {isAr && c.labelAr ? c.labelAr : c.labelEn}
              </Text>
              <Text style={[suggStyles.catBadge, { color: colors.primary, borderColor: colors.primary + "44" }]}>
                {isAr ? "فئة" : "cat"}
              </Text>
            </Pressable>
          ))}
          {(mobileSuggestions?.suggestions ?? []).slice(0, 5).map((s, i) => (
            <Pressable key={i} style={[suggStyles.row, { borderBottomColor: colors.border }]}
              onPress={() => { const text = isAr && s.textAr ? s.textAr : s.text; setSearch(text); setDebouncedSearch(text); setSearchFocused(false); }}>
              <Ionicons name="search-outline" size={14} color={colors.mutedForeground} />
              <Text style={[suggStyles.rowText, { color: colors.foreground }]} numberOfLines={1}>
                {isAr && s.textAr ? s.textAr : s.text}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {Object.entries(MOBILE_SORT_LABELS).map(([key, labels]) => {
          const active = sortBy === key;
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [styles.sortChip, { backgroundColor: active ? colors.primary + "22" : colors.secondary, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 }]}
              onPress={() => { setSortBy(key as MobileSortOption); void Haptics.selectionAsync(); }}
            >
              <Text style={[styles.sortChipText, { color: active ? colors.primary : colors.mutedForeground }]}>
                {isAr ? labels.ar : labels.en}
              </Text>
            </Pressable>
          );
        })}
        {categoriesData?.map((c: any) => {
          const label = isAr && c.labelAr ? c.labelAr : c.label;
          const active = activeCategory === c.label;
          return (
            <Pressable
              key={c.label}
              style={({ pressed }) => [styles.categoryChip, { backgroundColor: active ? colors.primary : colors.secondary, borderWidth: 1, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 }]}
              onPress={() => { setActiveCategory(active ? null : c.label); void Haptics.selectionAsync(); }}
            >
              <Text style={[styles.chipText, { color: active ? colors.primaryForeground : colors.foreground }]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
        <Pressable
          style={({ pressed }) => [
            styles.sortChip,
            { backgroundColor: (priceMin != null || priceMax != null) ? colors.primary + "22" : colors.secondary, borderColor: (priceMin != null || priceMax != null) ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={() => { setTempMin(priceMin != null ? String(priceMin) : ""); setTempMax(priceMax != null ? String(priceMax) : ""); setShowFilterPanel(true); }}
        >
          <Ionicons name="options-outline" size={12} color={(priceMin != null || priceMax != null) ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.sortChipText, { color: (priceMin != null || priceMax != null) ? colors.primary : colors.mutedForeground }]}>
            {(priceMin != null || priceMax != null) ? `$${priceMin ?? 0}–${priceMax != null ? "$" + priceMax : "∞"}` : t("shop.price_range")}
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
      cartCount={cartCount}
      onAddToCart={handleAddToCart}
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
        data={isShopMode ? products : []}
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
          isShopMode ? (
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
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
        }
        renderItem={renderProductItem}
      />

      {/* ── Price Filter Panel Modal ── */}
      <Modal visible={showFilterPanel} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFilterPanel(false)}>
        <KeyboardAvoidingView style={[styles.shopContainer, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[styles.shopHeader, { paddingTop: 20, borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: 16 }]}>
            <Text style={[styles.shopTitle, { color: colors.foreground, fontSize: 18 }]}>{t("shop.price_range")}</Text>
            <Pressable onPress={() => setShowFilterPanel(false)} style={[styles.searchIconBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="close" size={18} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.clearAllText, { color: colors.mutedForeground, marginBottom: 6 }]}>{t("shop.price_min_placeholder")}</Text>
                <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: colors.mutedForeground }}>$</Text>
                  <TextInput style={[styles.searchInput, { color: colors.foreground }]} value={tempMin} onChangeText={setTempMin} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.mutedForeground} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.clearAllText, { color: colors.mutedForeground, marginBottom: 6 }]}>{t("shop.price_max_placeholder")}</Text>
                <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: colors.mutedForeground }}>$</Text>
                  <TextInput style={[styles.searchInput, { color: colors.foreground }]} value={tempMax} onChangeText={setTempMax} keyboardType="numeric" placeholder="∞" placeholderTextColor={colors.mutedForeground} />
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
                style={({ pressed }) => [styles.clearAllBtn, { flex: 2, justifyContent: "center", backgroundColor: colors.primary, borderColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                onPress={() => {
                  const mn = parseFloat(tempMin); const mx = parseFloat(tempMax);
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

// ─── Stat Card (Seller Dashboard) ────────────────────────────────────────────
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

// ─── Seller Dashboard ─────────────────────────────────────────────────────────
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
                {data.lowStockProducts > 1 ? t("profile.low_stock_plural", { count: String(data.lowStockProducts) }) : t("profile.low_stock", { count: String(data.lowStockProducts) })}
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
                    <Text style={[dashStyles.orderMeta, { color: colors.mutedForeground }]}>{order.customerName} · {new Date(order.createdAt).toLocaleDateString()}</Text>
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

// ─── StyleSheets ─────────────────────────────────────────────────────────────
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

const sectionStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 16, fontWeight: "700" as const },
  seeAll: { fontSize: 13, fontWeight: "600" as const },
});

const headerStyles = StyleSheet.create({
  badge: { position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeNum: { color: "#000", fontSize: 9, fontWeight: "800" as const },
});

const heroStyles = StyleSheet.create({
  container: { borderRadius: 16, borderWidth: 1, overflow: "hidden", position: "relative", minHeight: 220 },
  bgImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" } as any,
  darkOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.58)" },
  glowOverlay: { position: "absolute", inset: 0 } as any,
  glow1: { position: "absolute", top: -30, left: "25%", width: 200, height: 120, borderRadius: 100, backgroundColor: "#10b98110" },
  glow2: { position: "absolute", bottom: -20, right: "20%", width: 150, height: 80, borderRadius: 75, backgroundColor: "#10b9810a" },
  discountBadge: { position: "absolute", top: 14, left: 14, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, zIndex: 10 },
  discountBadgeText: { color: "#000", fontSize: 11, fontWeight: "800" as const },
  content: { padding: 20, gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1 },
  tagline: { fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.5, lineHeight: 30 },
  subtitle: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  ctaRow: { flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap" },
  ctaPrimary: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  ctaPrimaryText: { color: "#000", fontSize: 14, fontWeight: "700" as const },
  ctaSecondary: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  ctaSecondaryText: { color: "#fff", fontSize: 13, fontWeight: "500" as const },
  statsRow: { flexDirection: "row", alignItems: "center", paddingTop: 14, marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 14, fontWeight: "800" as const },
  statLabel: { fontSize: 10, fontWeight: "400" as const, color: "rgba(255,255,255,0.7)", textAlign: "center" as const },
  statDivider: { width: 1, height: 28 },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 12 },
  slideDot: { height: 4, borderRadius: 2 },
});

const heroStyles2 = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4, gap: 0 },
  loading: { height: 130, alignItems: "center", justifyContent: "center" },
  list: { gap: 10, paddingBottom: 4 },
  allProductsHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 8 },
  allTitle: { fontSize: 18, fontWeight: "700" as const },
});

const catGridStyles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingTop: 20, paddingBottom: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: "48%", aspectRatio: 4 / 3, borderRadius: 12, overflow: "hidden", position: "relative" },
  img: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" } as any,
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.42)" },
  colorBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2 },
  textWrap: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10 },
  catName: { color: "#fff", fontSize: 13, fontWeight: "700" as const },
  catCount: { color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: "400" as const, marginTop: 2 },
});

const dealStyles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  header: { gap: 8, marginBottom: 4 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  timerLabel: { fontSize: 11, fontWeight: "500" as const },
  timerChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  timerVal: { fontSize: 12, fontWeight: "700" as const, fontVariant: ["tabular-nums" as any] },
  timerColon: { fontSize: 12, fontWeight: "700" as const },
  list: { gap: 10, paddingBottom: 6, paddingRight: 4 },
  card: { width: 145, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  imgWrap: { width: "100%", aspectRatio: 1, position: "relative", overflow: "hidden" },
  img: { width: "100%", height: "100%" },
  discBadge: { position: "absolute", top: 6, right: 6, backgroundColor: "#10b981", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  discText: { color: "#000", fontSize: 10, fontWeight: "800" as const },
  info: { padding: 8, gap: 4 },
  dealName: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  price: { fontSize: 14, fontWeight: "800" as const },
  original: { fontSize: 11, textDecorationLine: "line-through" as const },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 5, borderRadius: 7, marginTop: 2 },
  addBtnText: { color: "#000", fontSize: 11, fontWeight: "700" as const },
});

const storeStyles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  list: { gap: 10, paddingBottom: 6, paddingRight: 4 },
  card: { width: 220, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  coverWrap: { height: 90, position: "relative" },
  cover: { width: "100%", height: "100%" },
  coverOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" },
  verifiedBadge: { position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  verifiedDot: { width: 5, height: 5, borderRadius: 3 },
  verifiedText: { fontSize: 10, fontWeight: "600" as const },
  cardBody: { padding: 12, gap: 4 },
  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  logoCircle: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  logoInitial: { fontSize: 16, fontWeight: "900" as const },
  ratingWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  rating: { fontSize: 12, fontWeight: "700" as const },
  reviewCount: { fontSize: 11 },
  storeName: { fontSize: 14, fontWeight: "800" as const },
  storeCategory: { fontSize: 12 },
  storeTagline: { fontSize: 11, lineHeight: 15, marginTop: 2, marginBottom: 2 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, marginVertical: 6 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statsText: { fontSize: 11 },
});

const joinStyles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 16 },
  header: { alignItems: "center", gap: 8, marginBottom: 20 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18, textAlign: "center", opacity: 0.8 },
  cardsRow: { flexDirection: "row", gap: 10 },
  card: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  sellerCard: { backgroundColor: "#10b98108" },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: "800" as const },
  cardDesc: { fontSize: 12, lineHeight: 17, opacity: 0.75 },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  ctaText: { fontSize: 12, fontWeight: "700" as const },
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
  banner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  bannerText: { fontSize: 12, fontWeight: "600" as const, flex: 1 },
});

const quickStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginTop: 4 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
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

const richHeaderStyles = StyleSheet.create({
  container: { marginBottom: 14 },
  eyebrow: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1.2, textTransform: "uppercase" as const, marginBottom: 4 },
  titleRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.5, flex: 1 },
  seeAll: { fontSize: 13, fontWeight: "600" as const },
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
