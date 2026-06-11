import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useScreenLayout } from "@/hooks/useScreenLayout";
import { t } from "../../src/i18n";
import { getBaseUrl } from "@workspace/api-client-react";

interface StoreData {
  sellerId: number;
  storeName: string;
  storeSlug: string;
  storeDescription: string | null;
  storeLogo: string | null;
  storeBanner: string | null;
  sellerName: string;
  trustLevel: string;
  trustScore: number | null;
  verificationLevel: "none" | "basic" | "verified" | "business";
  isVerified?: boolean;
  verifiedAt?: string | null;
  memberSince: string;
  totalProducts: number;
  totalOrders: number;
  followerCount: number;
  orderCompletionRate: number;
  avgRating: number | null;
  reviewCount: number;
}

interface Product {
  id: number;
  name: string;
  nameAr?: string;
  price: number;
  compareAtPrice?: number;
  imageUrls?: string[];
  imageUrl?: string;
  category: string;
}

function VerificationBadge({ level }: { level: string }) {
  if (!level || level === "none") return null;

  const configs = {
    basic:    { label: t("trust.level_basic"),    bg: "#EFF6FF", text: "#2563EB", icon: "shield-outline" as const },
    verified: { label: t("trust.level_verified"),  bg: "#ECFDF5", text: "#059669", icon: "shield-checkmark-outline" as const },
    business: { label: t("trust.level_business"),  bg: "#F5F3FF", text: "#7C3AED", icon: "ribbon-outline" as const },
  };

  const cfg = configs[level as keyof typeof configs];
  if (!cfg) return null;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={11} color={cfg.text} />
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

function TrustBar({ score }: { score: number }) {
  const band =
    score >= 75 ? "#10B981" :
    score >= 50 ? "#3B82F6" :
    score >= 25 ? "#F59E0B" :
    "#9CA3AF";

  return (
    <View style={styles.trustBarContainer}>
      <View style={styles.trustBarTrack}>
        <View style={[styles.trustBarFill, { width: `${score}%`, backgroundColor: band }]} />
      </View>
      <Text style={styles.trustBarLabel}>{score}/100</Text>
    </View>
  );
}

function ProductCard({ product, colors, onPress }: { product: Product; colors: any; onPress: () => void }) {
  const imageUri = product.imageUrls?.[0] ?? product.imageUrl ?? null;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  return (
    <Pressable style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <View style={[styles.productImageWrapper, { backgroundColor: colors.muted }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <Ionicons name="cube-outline" size={32} color={colors.mutedForeground} />
        )}
        {discount != null && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>{product.name}</Text>
        <Text style={[styles.productPrice, { color: colors.foreground }]}>${product.price.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

export default function StoreScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tabBarHeight } = useScreenLayout();
  const [tab, setTab] = useState<"products" | "about">("products");

  const { data: storeData, isLoading: storeLoading } = useQuery<StoreData>({
    queryKey: ["store-by-slug", slug],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/sellers/store/${slug}`);
      if (!res.ok) throw new Error("Store not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: productsData } = useQuery<{ data: Product[] }>({
    queryKey: ["store-products", storeData?.sellerId],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/products?sellerId=${storeData!.sellerId}&limit=40`);
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
    enabled: !!storeData?.sellerId,
  });

  const products = productsData?.data ?? [];

  if (storeLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!storeData) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Store not found</Text>
      </View>
    );
  }

  const level = storeData.verificationLevel ?? "none";
  const trustScore = storeData.trustScore;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Back button */}
      <View style={[styles.backRow, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={[styles.bannerWrapper, { backgroundColor: colors.muted }]}>
          {storeData.storeBanner ? (
            <Image source={{ uri: storeData.storeBanner }} style={styles.banner} resizeMode="cover" />
          ) : (
            <View style={[styles.banner, { backgroundColor: colors.primary + "22" }]} />
          )}
        </View>

        {/* Store header */}
        <View style={[styles.headerCard, { backgroundColor: colors.background }]}>
          {/* Logo */}
          <View style={[styles.logoWrapper, { backgroundColor: colors.primary + "18", borderColor: colors.background }]}>
            {storeData.storeLogo ? (
              <Image source={{ uri: storeData.storeLogo }} style={styles.logo} resizeMode="cover" />
            ) : (
              <Text style={[styles.logoInitial, { color: colors.primary }]}>
                {storeData.storeName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Name + badge */}
          <View style={styles.nameRow}>
            <Text style={[styles.storeName, { color: colors.foreground }]}>{storeData.storeName}</Text>
            {level !== "none" && <VerificationBadge level={level} />}
          </View>
          <Text style={[styles.sellerName, { color: colors.mutedForeground }]}>{storeData.sellerName}</Text>

          {/* Trust score bar */}
          {trustScore != null && (
            <View style={styles.trustSection}>
              <Text style={[styles.trustLabel, { color: colors.mutedForeground }]}>{t("trust.trust_score")}</Text>
              <TrustBar score={trustScore} />
            </View>
          )}

          {/* Stats row */}
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            {[
              { label: t("store.followers", "Followers"), value: storeData.followerCount ?? 0 },
              { label: t("store.products", "Products"), value: storeData.totalProducts ?? 0 },
              { label: t("store.completion", "Completion"), value: `${storeData.orderCompletionRate ?? 0}%` },
            ].map(({ label, value }) => (
              <View key={label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          {(["products", "about"] as const).map((tabKey) => (
            <Pressable
              key={tabKey}
              style={[styles.tabBtn, tab === tabKey && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab(tabKey)}
            >
              <Text style={[styles.tabLabel, { color: tab === tabKey ? colors.primary : colors.mutedForeground }]}>
                {tabKey === "products" ? t("store.tab_products", "Products") : t("store.tab_about", "About")}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        {tab === "products" ? (
          products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t("store.no_products", "No products yet")}
              </Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  colors={colors}
                  onPress={() => router.push(`/product/${product.id}` as any)}
                />
              ))}
            </View>
          )
        ) : (
          <View style={styles.aboutSection}>
            {storeData.storeDescription ? (
              <Text style={[styles.aboutText, { color: colors.foreground }]}>{storeData.storeDescription}</Text>
            ) : (
              <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>
                {t("store.no_description", "No description provided.")}
              </Text>
            )}
            <View style={[styles.aboutInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { label: t("store.member_since", "Member since"), value: new Date(storeData.memberSince).getFullYear().toString() },
                ...(storeData.verifiedAt ? [{ label: t("store.verified_since", "Verified since"), value: new Date(storeData.verifiedAt ?? "").getFullYear().toString() }] : []),
              ].map(({ label, value }) => (
                <View key={label} style={[styles.aboutRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.aboutRowLabel, { color: colors.mutedForeground }]}>{label}</Text>
                  <Text style={[styles.aboutRowValue, { color: colors.foreground }]}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  loading:         { flex: 1, alignItems: "center", justifyContent: "center" },
  backRow:         { position: "absolute", top: 0, start: 0, end: 0, zIndex: 10, paddingHorizontal: 16, paddingBottom: 8 },
  backBtn:         { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.12)" },
  bannerWrapper:   { height: 140, overflow: "hidden" },
  banner:          { width: "100%", height: 140 },
  headerCard:      { paddingHorizontal: 16, paddingBottom: 16, marginTop: -20, borderRadius: 20 },
  logoWrapper:     { width: 72, height: 72, borderRadius: 20, borderWidth: 3, alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden" },
  logo:            { width: "100%", height: "100%" },
  logoInitial:     { fontSize: 28, fontWeight: "900" },
  nameRow:         { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  storeName:       { fontSize: 20, fontWeight: "900" },
  sellerName:      { fontSize: 13, marginTop: 2 },
  badge:           { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:       { fontSize: 11, fontWeight: "700" },
  trustSection:    { marginTop: 12 },
  trustLabel:      { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  trustBarContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  trustBarTrack:   { flex: 1, height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden" },
  trustBarFill:    { height: "100%", borderRadius: 3 },
  trustBarLabel:   { fontSize: 11, fontWeight: "700", color: "#6B7280", width: 36, textAlign: "right" },
  statsRow:        { flexDirection: "row", justifyContent: "space-around", paddingTop: 16, marginTop: 16, borderTopWidth: 1 },
  statItem:        { alignItems: "center" },
  statValue:       { fontSize: 18, fontWeight: "900" },
  statLabel:       { fontSize: 11, marginTop: 2 },
  tabs:            { flexDirection: "row", borderBottomWidth: 1, marginHorizontal: 16, marginTop: 8 },
  tabBtn:          { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabLabel:        { fontSize: 14, fontWeight: "700" },
  productsGrid:    { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8, paddingTop: 8, gap: 0 },
  productCard:     { width: "50%", padding: 6 },
  productImageWrapper: { height: 140, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8 },
  productImage:    { width: "100%", height: "100%" },
  discountBadge:   { position: "absolute", top: 6, end: 6, backgroundColor: "#EF4444", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountText:    { color: "#fff", fontSize: 10, fontWeight: "700" },
  productInfo:     { paddingHorizontal: 2 },
  productName:     { fontSize: 12, fontWeight: "600", marginBottom: 4, lineHeight: 16 },
  productPrice:    { fontSize: 14, fontWeight: "900" },
  emptyState:      { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText:       { fontSize: 14 },
  aboutSection:    { padding: 16 },
  aboutText:       { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  aboutInfo:       { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  aboutRow:        { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  aboutRowLabel:   { fontSize: 13 },
  aboutRowValue:   { fontSize: 13, fontWeight: "700" },
});
