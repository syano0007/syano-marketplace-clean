import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Truck, Package, CheckCircle2, DollarSign, MapPin, Phone,
  User, Star, AlertTriangle, Store, ShoppingBag, Calendar,
  TrendingUp, Award, History, XCircle, AlertCircle, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CourierProfile {
  id: number;
  status: "pending" | "approved" | "suspended";
  active: boolean;
  phone: string;
  vehicleType: string;
  district: string | null;
  rating: number | null;
  completedDeliveries: number;
}
interface ProductSnap { name: string; quantity: number; unitPrice: number; }
interface Assignment {
  id: number;
  orderId: number;
  status: string;
  assignedAt: string;
  pickedUpAt: string | null;
  orderStatus: string;
  orderDate: string;
  shippingAddress: string;
  city: string | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryNotes: string | null;
  deliveryFee: number | null;
  total: number;
  storeName: string | null;
  sellerName: string | null;
  sellerPhone: string | null;
  zoneNameEn: string | null;
  zoneNameAr: string | null;
  products: ProductSnap[];
  notes: string | null;
}
interface EarningsPeriod { earnings: number; deliveries: number; }
interface Earnings {
  today:     EarningsPeriod;
  thisWeek:  EarningsPeriod;
  thisMonth: EarningsPeriod;
  allTime:   EarningsPeriod;
  walletBalance: number;
  performance: {
    totalDeliveries: number;
    totalFailed:     number;
    successRate:     number;
    avgPerDay:       number;
    lifetimeEarnings: number;
  };
  totalEarnings: number;
  completedDeliveries: number;
  transactions: {
    id: number;
    orderId: number | null;
    amount: number;
    type: string;
    notes: string | null;
    createdAt: string;
  }[];
}
interface HistoryItem {
  id: number;
  orderId: number;
  status: "delivered" | "delivery_failed";
  assignedAt: string;
  deliveredAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  orderTotal: number;
  deliveryFee: number;
  yourCut: number;
  shippingAddress: string;
  customerName: string | null;
  customerPhone: string | null;
  orderDate: string;
  zoneNameEn: string | null;
  zoneNameAr: string | null;
  products: { name: string; quantity: number }[];
}

// ─── Failure reasons ──────────────────────────────────────────────────────────
const FAILURE_REASONS = [
  "courier.failure_unavailable",
  "courier.failure_wrong_address",
  "courier.failure_rejected",
  "courier.failure_unreachable",
  "courier.failure_other",
] as const;

// ─── Apply form ───────────────────────────────────────────────────────────────
function ApplyForm({ token, onApplied }: { token: string; onApplied: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("motorcycle");
  const [district, setDistrict] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { toast({ title: t("courier.phone_label") + " required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/couriers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: phone.trim(), vehicleType, district: district.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      toast({ title: t("courier.apply_success") });
      onApplied();
    } catch (err: any) {
      toast({ title: err.message ?? t("courier.apply_error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{t("courier.apply_title")}</h2>
            <p className="text-sm text-muted-foreground">{t("courier.apply_subtitle")}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{t("courier.apply_desc")}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">{t("courier.phone_label")}</label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("courier.phone_placeholder")} required />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">{t("courier.vehicle_label")}</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="motorcycle">{t("delivery.vehicle_motorcycle")}</option>
              <option value="scooter">{t("delivery.vehicle_scooter")}</option>
              <option value="car">{t("delivery.vehicle_car")}</option>
              <option value="bicycle">{t("delivery.vehicle_bicycle")}</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">{t("courier.district_label")}</label>
            <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Al-Aziziyeh" />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "…" : t("courier.submit_apply")}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Failure reason modal ─────────────────────────────────────────────────────
function FailureReasonModal({ orderId, onConfirm, onCancel, acting }: {
  orderId: number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  acting: boolean;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
          <h3 className="font-bold text-base">{t("courier.failure_modal_title")}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t("courier.failure_modal_desc", { id: orderId })}</p>
        <div className="space-y-2">
          {FAILURE_REASONS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(t(key))}
              className={cn(
                "w-full text-start text-sm px-3 py-2.5 rounded-xl border transition-all",
                selected === t(key)
                  ? "border-orange-400 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
                  : "border-border bg-muted/30 hover:bg-muted/60 text-foreground"
              )}
            >
              {t(key)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected || acting}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            {acting ? "…" : t("courier.failure_confirm_btn")}
          </Button>
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delivery card ─────────────────────────────────────────────────────────────
function DeliveryCard({ assignment, token, onAction }: {
  assignment: Assignment;
  token: string;
  onAction: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [acting, setActing] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);

  const isAssigned  = assignment.orderStatus === "courier_assigned";
  const isPickedUp  = assignment.orderStatus === "picked_up";
  const isOutForDel = assignment.orderStatus === "out_for_delivery";

  const doAction = async (endpoint: string, body?: object) => {
    setActing(true);
    try {
      const res = await fetch(`/api/couriers/assignments/${assignment.id}/${endpoint}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      onAction();
    } catch (err: any) {
      toast({ title: err.message ?? t("common.error"), variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const handlePickup        = () => doAction("pickup");
  const handleStartDelivery = () => doAction("start-delivery");
  const handleDeliver       = () => doAction("deliver");
  const handleFailDelivery  = (reason: string) => {
    setShowFailModal(false);
    doAction("fail-delivery", { failureReason: reason });
  };

  const statusLabel = isPickedUp
    ? t("orders.status_picked_up")
    : isOutForDel
      ? t("orders.status_out_for_delivery")
      : t("orders.status_courier_assigned");

  const statusCls = isOutForDel
    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
    : isPickedUp
      ? "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400"
      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";

  const orderDateFmt = new Date(assignment.orderDate).toLocaleDateString();

  return (
    <>
      {showFailModal && (
        <FailureReasonModal
          orderId={assignment.orderId}
          onConfirm={handleFailDelivery}
          onCancel={() => setShowFailModal(false)}
          acting={acting}
        />
      )}

      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        {/* ── Card header ── */}
        <div className="px-5 py-3.5 border-b bg-muted/20 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-black text-base" translate="no">#{assignment.orderId}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", statusCls)}>
              {statusLabel}
            </span>
          </div>
          <div className="text-end">
            <span className="text-sm font-bold" translate="no">${assignment.total.toFixed(2)}</span>
            {assignment.deliveryFee != null && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block" translate="no">
                +${(assignment.deliveryFee * 0.8).toFixed(2)} {t("courier.your_cut")}
              </span>
            )}
          </div>
        </div>

        {/* ── Pickup info (store / seller) ── */}
        <div className="px-5 pt-4 pb-3 border-b border-dashed border-border/60">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t("courier.pickup_section")}</p>
          <div className="space-y-1.5">
            {assignment.storeName && (
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold">{assignment.storeName}</span>
              </div>
            )}
            {assignment.sellerName && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{assignment.sellerName}</span>
              </div>
            )}
            {assignment.sellerPhone && (
              <a href={`tel:${assignment.sellerPhone}`} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline" translate="no">
                <Phone className="h-3.5 w-3.5" />{assignment.sellerPhone}
              </a>
            )}
            {/* Products list */}
            {assignment.products.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {assignment.products.slice(0, 4).map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">
                    <ShoppingBag className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate max-w-[110px]">{p.name}</span>
                    {p.quantity > 1 && <span className="font-semibold">×{p.quantity}</span>}
                  </span>
                ))}
                {assignment.products.length > 4 && (
                  <span className="text-[11px] text-muted-foreground px-1">+{assignment.products.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Customer / delivery info ── */}
        <div className="px-5 pt-3 pb-3 border-b border-dashed border-border/60">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t("courier.delivery_section")}</p>
          <div className="space-y-1.5">
            {assignment.customerName && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold">{assignment.customerName}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-snug">{assignment.shippingAddress}</p>
            </div>
            {assignment.city && <p className="text-xs text-muted-foreground">{assignment.city}</p>}
            {(assignment.zoneNameEn || assignment.zoneNameAr) && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {i18n.language === "ar" ? assignment.zoneNameAr : assignment.zoneNameEn}
                </span>
              </div>
            )}
            {assignment.customerPhone && (
              <a href={`tel:${assignment.customerPhone}`} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline" translate="no">
                <Phone className="h-3.5 w-3.5" />{assignment.customerPhone}
              </a>
            )}
            {assignment.deliveryNotes && (
              <p className="text-xs text-muted-foreground italic bg-muted/30 rounded-lg px-2.5 py-1.5 mt-1">{assignment.deliveryNotes}</p>
            )}
          </div>
        </div>

        {/* ── Order meta ── */}
        <div className="px-5 py-3 border-b border-dashed border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {orderDateFmt}</span>
          <span className="font-medium">{t("courier.cod_label")}</span>
        </div>

        {/* ── Actions ── */}
        <div className="px-5 pb-4 pt-3 flex flex-col gap-2">
          {isAssigned && (
            <Button onClick={handlePickup} disabled={acting} className="w-full gap-2">
              <Package className="h-4 w-4" />
              {acting ? "…" : t("courier.mark_pickup")}
            </Button>
          )}
          {isPickedUp && (
            <Button onClick={handleStartDelivery} disabled={acting} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Truck className="h-4 w-4" />
              {acting ? "…" : t("courier.mark_out_for_delivery")}
            </Button>
          )}
          {isOutForDel && (
            <>
              <Button onClick={handleDeliver} disabled={acting} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="h-4 w-4" />
                {acting ? "…" : t("courier.mark_delivered")}
              </Button>
              <Button
                onClick={() => setShowFailModal(true)}
                disabled={acting}
                variant="outline"
                className="w-full gap-2 border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
              >
                <AlertTriangle className="h-4 w-4" />
                {acting ? "…" : t("courier.mark_failed")}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
export default function CourierDashboard() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"deliveries" | "history" | "earnings">("deliveries");
  const [toggling, setToggling] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
    error: profileError,
  } = useQuery<CourierProfile>({
    queryKey: ["courier-profile"],
    queryFn: async () => {
      const res = await fetch("/api/couriers/profile", { headers });
      if (res.status === 404) throw new Error("no_profile");
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const { data: assignments = [], refetch: refetchAssignments } = useQuery<Assignment[]>({
    queryKey: ["courier-assignments"],
    queryFn: () => fetch("/api/couriers/assignments", { headers }).then((r) => r.json()),
    enabled: !!token && profile?.status === "approved",
    refetchInterval: 20_000,
  });

  const { data: history = [] } = useQuery<HistoryItem[]>({
    queryKey: ["courier-history"],
    queryFn: () => fetch("/api/couriers/history", { headers }).then((r) => r.json()),
    enabled: !!token && profile?.status === "approved" && tab === "history",
  });

  const { data: earnings } = useQuery<Earnings>({
    queryKey: ["courier-earnings"],
    queryFn: () => fetch("/api/couriers/earnings", { headers }).then((r) => r.json()),
    enabled: !!token && profile?.status === "approved" && tab === "earnings",
    refetchInterval: 30_000,
  });

  const handleToggle = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      const res = await fetch("/api/couriers/profile/toggle", { method: "PATCH", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      refetchProfile();
    } catch {
      toast({ title: t("courier.toggle_error"), variant: "destructive" });
    } finally {
      setToggling(false);
    }
  };

  if (profileLoading) {
    return (
      <Layout>
        <div className="container py-10 max-w-2xl">
          <div className="space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (profileError && (profileError as any)?.message !== "no_profile") {
    return (
      <Layout>
        <div className="container py-20 max-w-2xl flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold text-foreground">{t("common.error_title")}</p>
          <p className="text-sm text-muted-foreground">{t("common.error_subtitle")}</p>
          <button
            onClick={() => refetchProfile()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />{t("common.retry")}
          </button>
        </div>
      </Layout>
    );
  }

  if ((profileError as any)?.message === "no_profile" || !profile) {
    return (
      <Layout>
        <div className="container py-10 max-w-2xl">
          <ApplyForm token={token!} onApplied={refetchProfile} />
        </div>
      </Layout>
    );
  }

  if (profile.status === "pending") {
    return (
      <Layout>
        <div className="container py-10 max-w-2xl">
          <div className="bg-card border rounded-2xl p-8 text-center shadow-sm">
            <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Truck className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t("courier.pending_title")}</h2>
            <p className="text-muted-foreground text-sm">{t("courier.pending_desc")}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (profile.status === "suspended") {
    return (
      <Layout>
        <div className="container py-10 max-w-2xl">
          <div className="bg-card border rounded-2xl p-8 text-center shadow-sm">
            <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Truck className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t("courier.suspended_title")}</h2>
            <p className="text-muted-foreground text-sm">{t("courier.suspended_desc")}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold">{t("courier.dashboard_title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("courier.dashboard_subtitle")}</p>
        </div>

        {/* Status card */}
        <div className="bg-card border rounded-2xl p-4 mb-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center",
              profile.active ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted"
            )}>
              <Truck className={cn("h-5 w-5", profile.active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
            </div>
            <div>
              <p className="font-semibold text-sm">{profile.active ? t("courier.status_online") : t("courier.status_offline")}</p>
              <p className="text-xs text-muted-foreground">{t(`delivery.vehicle_${profile.vehicleType}`)}{profile.district ? ` · ${profile.district}` : ""}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant={profile.active ? "outline" : "default"}
            onClick={handleToggle}
            disabled={toggling}
            className={cn(!profile.active && "bg-emerald-600 hover:bg-emerald-700 text-white")}
          >
            {toggling ? "…" : profile.active ? t("courier.go_offline") : t("courier.go_online")}
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-[11px] text-muted-foreground leading-tight">{t("courier.completed")}</p>
            <p className="text-xl font-black mt-0.5">{profile.completedDeliveries}</p>
          </div>
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-[11px] text-muted-foreground leading-tight">{t("courier.earnings_today")}</p>
            <p className="text-xl font-black mt-0.5 text-emerald-600 dark:text-emerald-400" translate="no">${(earnings?.today?.earnings ?? 0).toFixed(2)}</p>
          </div>
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-[11px] text-muted-foreground leading-tight">{t("courier.total_earnings")}</p>
            <p className="text-xl font-black mt-0.5" translate="no">${(earnings?.allTime?.earnings ?? earnings?.totalEarnings ?? 0).toFixed(2)}</p>
          </div>
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-[11px] text-muted-foreground leading-tight">{t("delivery.col_rating")}</p>
            <p className="text-xl font-black mt-0.5">{profile.rating ? profile.rating.toFixed(1) : "—"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-0.5">
          <button
            onClick={() => setTab("deliveries")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap",
              tab === "deliveries" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {t("courier.my_deliveries")}{assignments.length > 0 ? ` (${assignments.length})` : ""}
          </button>
          <button
            onClick={() => setTab("history")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap",
              tab === "history" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {t("courier.history_tab")}
          </button>
          <button
            onClick={() => setTab("earnings")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap",
              tab === "earnings" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {t("courier.earnings_title")}
          </button>
        </div>

        {/* Deliveries tab */}
        {tab === "deliveries" && (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-2xl text-center">
                <Truck className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <h3 className="font-semibold mb-1">{t("courier.no_deliveries")}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{t("courier.no_deliveries_desc")}</p>
              </div>
            ) : assignments.map((a) => (
              <DeliveryCard
                key={a.id}
                assignment={a}
                token={token!}
                onAction={() => { refetchAssignments(); refetchProfile(); queryClient.invalidateQueries({ queryKey: ["courier-earnings"] }); }}
              />
            ))}
          </div>
        )}

        {/* History tab */}
        {tab === "history" && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-2xl text-center">
                <History className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <h3 className="font-semibold mb-1">{t("courier.history_empty_title")}</h3>
                <p className="text-sm text-muted-foreground">{t("courier.history_empty_desc")}</p>
              </div>
            ) : history.map((h) => {
              const isDelivered = h.status === "delivered";
              const date = new Date(h.deliveredAt ?? h.failedAt ?? h.assignedAt).toLocaleDateString();
              const zoneName = i18n.language === "ar" ? h.zoneNameAr : h.zoneNameEn;
              return (
                <div key={h.id} className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm" translate="no">#{h.orderId}</span>
                      {isDelivered ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> {t("orders.status_delivered")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="h-3 w-3" /> {t("courier.history_failed")}
                        </span>
                      )}
                      {zoneName && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />{zoneName}
                        </span>
                      )}
                    </div>
                    <div className="text-end">
                      {isDelivered && (
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400" translate="no">+${h.yourCut.toFixed(2)}</span>
                      )}
                      <span className="text-xs text-muted-foreground block flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" /> {date}
                      </span>
                    </div>
                  </div>
                  {!isDelivered && h.failureReason && (
                    <div className="px-4 py-2 bg-red-50 dark:bg-red-950/20 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <p className="text-xs text-red-700 dark:text-red-400">{h.failureReason}</p>
                    </div>
                  )}
                  <div className="px-4 py-3 flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground leading-snug truncate">{h.shippingAddress}</p>
                      {h.customerName && <p className="text-xs text-muted-foreground mt-0.5">{h.customerName}</p>}
                      {h.products.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {h.products.slice(0, 3).map((p, i) => (
                            <span key={i} className="text-[11px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">
                              {p.name}{p.quantity > 1 ? ` ×${p.quantity}` : ""}
                            </span>
                          ))}
                          {h.products.length > 3 && <span className="text-[11px] text-muted-foreground px-1">+{h.products.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Earnings tab */}
        {tab === "earnings" && (
          <div className="space-y-4">
            {/* Time-period earnings breakdown */}
            {earnings && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t("courier.period_today"),      data: earnings.today },
                    { label: t("courier.period_this_week"),  data: earnings.thisWeek },
                    { label: t("courier.period_this_month"), data: earnings.thisMonth },
                    { label: t("courier.period_all_time"),   data: earnings.allTime },
                  ].map(({ label, data }) => (
                    <div key={label} className="bg-card border rounded-xl p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400" translate="no">${(data?.earnings ?? 0).toFixed(2)}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {data?.deliveries ?? 0} {t("delivery.col_deliveries")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Performance metrics */}
                {earnings.performance && (
                  <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">{t("courier.performance_title")}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-muted-foreground">{t("courier.perf_success_rate")}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${earnings.performance.successRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{earnings.performance.successRate.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">{t("courier.perf_avg_per_day")}</p>
                        <p className="text-sm font-bold" translate="no">${earnings.performance.avgPerDay.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">{t("courier.perf_total_deliveries")}</p>
                        <p className="text-sm font-bold">{earnings.performance.totalDeliveries}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">{t("courier.perf_failed")}</p>
                        <p className={cn("text-sm font-bold", earnings.performance.totalFailed > 0 ? "text-red-500" : "text-muted-foreground")}>
                          {earnings.performance.totalFailed}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Transactions */}
            {(!earnings || earnings.transactions.length === 0) && !earnings && (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-2xl text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">{t("courier.no_transactions")}</p>
              </div>
            )}
            {earnings && earnings.transactions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t("courier.recent_transactions")}</h3>
                {earnings.transactions.map((tx) => (
                  <div key={tx.id} className="bg-card border rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {tx.orderId ? t("courier.transaction_delivery", { id: tx.orderId }) : tx.notes}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400" translate="no">+${tx.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
