import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getBaseUrl } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { t } from "../../src/i18n";

interface CourierStats {
  status: "ONLINE" | "OFFLINE" | "BUSY";
  walletBalance: number;
  successRate: number;
  activeAssignments: number;
  totalDeliveries: number;
  pendingOffers: number;
}

interface MissionOffer {
  id: number;
  orderId: number;
  deliveryFee: number;
  yourCut: number;
  distance: number | null;
  pickupAddress: string;
  deliveryAddress: string;
  expiresAt: string;
}

function StatCard({ icon, label, value, color, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={[stCard.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[stCard.icon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[stCard.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[stCard.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const stCard = StyleSheet.create({
  card: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 4, alignItems: "center" },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 16, fontWeight: "700" },
  label: { fontSize: 11, textAlign: "center" },
});

export default function CourierDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { formatPrice } = useSettings();

  const [stats, setStats] = useState<CourierStats | null>(null);
  const [offers, setOffers] = useState<MissionOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [accepting, setAccepting] = useState<number | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [profileRes, offersRes] = await Promise.all([
        fetch(`${getBaseUrl()}/couriers/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getBaseUrl()}/couriers/offers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (profileRes.ok) setStats((await profileRes.json()) as CourierStats);
      if (offersRes.ok) setOffers((await offersRes.json()) as MissionOffer[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const toggleStatus = async () => {
    if (!stats) return;
    const newStatus = stats.status === "ONLINE" ? "OFFLINE" : "ONLINE";
    setToggling(true);
    try {
      const r = await fetch(`${getBaseUrl()}/couriers/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (r.ok) setStats((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch { Alert.alert("Failed to update status"); }
    finally { setToggling(false); }
  };

  const handleAcceptOffer = async (offer: MissionOffer) => {
    setAccepting(offer.id);
    try {
      const r = await fetch(`${getBaseUrl()}/couriers/offers/${offer.id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        Alert.alert("Mission accepted!", "Head to the pickup location.", [
          { text: "OK", onPress: () => router.push("/courier/missions") },
        ]);
        void load(true);
      } else {
        const d = (await r.json()) as { error?: string };
        Alert.alert(d.error ?? "Failed to accept offer");
      }
    } catch { Alert.alert("Failed to accept offer"); }
    finally { setAccepting(null); }
  };

  const handleRejectOffer = async (offerId: number) => {
    try {
      await fetch(`${getBaseUrl()}/couriers/offers/${offerId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      void load(true);
    } catch { /* ignore */ }
  };

  const isOnline = stats?.status === "ONLINE";
  const isBusy = stats?.status === "BUSY";

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => load(true)} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("courier_dash.title")}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: isOnline || isBusy ? "#10B98122" : "#EF444422" }]}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? "#10B981" : isBusy ? "#F59E0B" : "#EF4444" }]} />
            <Text style={[styles.statusText, { color: isOnline ? "#10B981" : isBusy ? "#F59E0B" : "#EF4444" }]}>
              {isBusy ? "Busy" : isOnline ? t("courier_dash.status_online") : t("courier_dash.status_offline")}
            </Text>
          </View>
        </View>
        {!isBusy && (
          <Pressable
            style={[styles.toggleBtn, { backgroundColor: isOnline ? "#EF444422" : colors.primary }]}
            onPress={toggleStatus}
            disabled={toggling}
          >
            {toggling ? (
              <ActivityIndicator size="small" color={isOnline ? "#EF4444" : colors.primaryForeground} />
            ) : (
              <Text style={[styles.toggleBtnText, { color: isOnline ? "#EF4444" : colors.primaryForeground }]}>
                {isOnline ? t("courier_dash.go_offline") : t("courier_dash.go_online")}
              </Text>
            )}
          </Pressable>
        )}
      </View>

      <View style={{ padding: 16, gap: 16 }}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard icon="wallet-outline" label={t("courier_dash.wallet")} value={formatPrice(stats?.walletBalance ?? 0)} color="#10B981" colors={colors} />
          <StatCard icon="checkmark-circle-outline" label={t("courier_dash.success_rate")} value={`${((stats?.successRate ?? 0) * 100).toFixed(0)}%`} color="#3B82F6" colors={colors} />
          <StatCard icon="car-outline" label="Deliveries" value={String(stats?.totalDeliveries ?? 0)} color="#8B5CF6" colors={colors} />
        </View>

        {/* Quick Nav */}
        <View style={styles.quickNav}>
          <Pressable
            style={[styles.quickNavBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/courier/missions")}
          >
            <Ionicons name="car-outline" size={22} color={colors.primary} />
            <Text style={[styles.quickNavLabel, { color: colors.foreground }]}>{t("courier_dash.missions")}</Text>
            {(stats?.activeAssignments ?? 0) > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>{stats?.activeAssignments}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={[styles.quickNavBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/courier/history")}
          >
            <Ionicons name="time-outline" size={22} color={colors.primary} />
            <Text style={[styles.quickNavLabel, { color: colors.foreground }]}>{t("courier_dash.history")}</Text>
          </Pressable>
        </View>

        {/* Pending Offers */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("courier_dash.offers")}</Text>
          {offers.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="hourglass-outline" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("courier_dash.waiting")}</Text>
            </View>
          ) : (
            <View style={styles.offersList}>
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  colors={colors}
                  formatPrice={formatPrice}
                  onAccept={() => handleAcceptOffer(offer)}
                  onReject={() => handleRejectOffer(offer.id)}
                  accepting={accepting === offer.id}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function OfferCard({ offer, colors, formatPrice, onAccept, onReject, accepting }: {
  offer: MissionOffer;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  formatPrice: (v: number) => string;
  onAccept: () => void;
  onReject: () => void;
  accepting: boolean;
}) {
  return (
    <View style={[styles.offerCard, { backgroundColor: colors.card, borderColor: colors.primary + "66" }]}>
      <View style={styles.offerHeader}>
        <Text style={[styles.offerId, { color: colors.foreground }]}>
          {t("courier_dash.order_ref").replace("{{id}}", String(offer.orderId))}
        </Text>
        <Text style={[styles.offerEarnings, { color: colors.primary }]}>
          {formatPrice(offer.yourCut)}
        </Text>
      </View>
      <View style={styles.offerAddresses}>
        <View style={styles.offerAddr}>
          <Ionicons name="location-outline" size={14} color="#10B981" />
          <Text style={[styles.offerAddrText, { color: colors.foreground }]} numberOfLines={1}>
            {offer.pickupAddress}
          </Text>
        </View>
        <View style={styles.offerAddr}>
          <Ionicons name="navigate-outline" size={14} color="#EF4444" />
          <Text style={[styles.offerAddrText, { color: colors.foreground }]} numberOfLines={1}>
            {offer.deliveryAddress}
          </Text>
        </View>
      </View>
      {offer.distance != null && (
        <Text style={[styles.offerDistance, { color: colors.mutedForeground }]}>
          {offer.distance.toFixed(1)} km · {t("courier_dash.fee")}: {formatPrice(offer.deliveryFee)}
        </Text>
      )}
      <View style={styles.offerActions}>
        <Pressable style={[styles.rejectBtn, { borderColor: colors.destructive }]} onPress={onReject}>
          <Text style={[styles.rejectText, { color: colors.destructive }]}>{t("courier_dash.reject")}</Text>
        </Pressable>
        <Pressable style={[styles.acceptBtn, { backgroundColor: colors.primary }]} onPress={onAccept} disabled={accepting}>
          {accepting ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : (
            <Text style={[styles.acceptText, { color: colors.primaryForeground }]}>{t("courier_dash.accept")}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  statusIndicator: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4, alignSelf: "flex-start" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  toggleBtnText: { fontSize: 13, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10 },
  quickNav: { flexDirection: "row", gap: 10 },
  quickNavBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  quickNavLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  badge: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 14 },
  offersList: { gap: 12 },
  offerCard: { borderRadius: 14, borderWidth: 2, padding: 14, gap: 10 },
  offerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  offerId: { fontSize: 14, fontWeight: "600" },
  offerEarnings: { fontSize: 18, fontWeight: "700" },
  offerAddresses: { gap: 6 },
  offerAddr: { flexDirection: "row", alignItems: "center", gap: 6 },
  offerAddrText: { flex: 1, fontSize: 13 },
  offerDistance: { fontSize: 12 },
  offerActions: { flexDirection: "row", gap: 10 },
  rejectBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  rejectText: { fontSize: 14, fontWeight: "600" },
  acceptBtn: { flex: 2, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  acceptText: { fontSize: 14, fontWeight: "700" },
});
