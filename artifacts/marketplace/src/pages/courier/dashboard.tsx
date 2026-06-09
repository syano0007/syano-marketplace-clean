import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Truck, Package, CheckCircle2, DollarSign, MapPin, Phone,
  User, Star, ChevronRight, ArrowRight,
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
interface Assignment {
  id: number;
  orderId: number;
  status: string;
  assignedAt: string;
  pickedUpAt: string | null;
  orderStatus: string;
  shippingAddress: string;
  customerPhone: string | null;
  city: string | null;
  deliveryNotes: string | null;
  deliveryFee: number | null;
  total: number;
}
interface Earnings {
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
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("courier.phone_placeholder")}
              required
            />
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
            <Input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Al-Aziziyeh"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "…" : t("courier.submit_apply")}
          </Button>
        </form>
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const [acting, setActing] = useState(false);

  const isAssigned = assignment.orderStatus === "courier_assigned";
  const isPickedUp  = assignment.orderStatus === "picked_up";

  const handlePickup = async () => {
    if (!confirm(t("courier.pickup_confirm", { id: assignment.orderId }))) return;
    setActing(true);
    try {
      const res = await fetch(`/api/couriers/assignments/${assignment.id}/pickup`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      toast({ title: t("courier.pickup_success") });
      onAction();
    } catch (err: any) {
      toast({ title: err.message ?? t("common.error"), variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const handleDeliver = async () => {
    if (!confirm(t("courier.deliver_confirm", { id: assignment.orderId }))) return;
    setActing(true);
    try {
      const res = await fetch(`/api/couriers/assignments/${assignment.id}/deliver`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      toast({ title: t("courier.deliver_success") });
      onAction();
    } catch (err: any) {
      toast({ title: err.message ?? t("common.error"), variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b bg-muted/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" translate="no">#{assignment.orderId}</span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-semibold",
            isPickedUp
              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
          )}>
            {isPickedUp ? t("orders.status_picked_up") : t("orders.status_courier_assigned")}
          </span>
        </div>
        {assignment.deliveryFee != null && (
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400" translate="no">
            +${(assignment.deliveryFee * 0.8).toFixed(2)}
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-foreground leading-snug">{assignment.shippingAddress}</p>
        </div>
        {assignment.customerPhone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <a href={`tel:${assignment.customerPhone}`} className="text-sm text-primary hover:underline" translate="no">
              {assignment.customerPhone}
            </a>
          </div>
        )}
        {assignment.deliveryNotes && (
          <p className="text-xs text-muted-foreground italic">{assignment.deliveryNotes}</p>
        )}
      </div>

      <div className="px-5 pb-4">
        {isAssigned && (
          <Button onClick={handlePickup} disabled={acting} className="w-full gap-2">
            <Package className="h-4 w-4" />
            {acting ? "…" : t("courier.mark_pickup")}
          </Button>
        )}
        {isPickedUp && (
          <Button onClick={handleDeliver} disabled={acting} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <CheckCircle2 className="h-4 w-4" />
            {acting ? "…" : t("courier.mark_delivered")}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
export default function CourierDashboard() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"deliveries" | "earnings">("deliveries");
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

  const { data: earnings } = useQuery<Earnings>({
    queryKey: ["courier-earnings"],
    queryFn: () => fetch("/api/couriers/earnings", { headers }).then((r) => r.json()),
    enabled: !!token && profile?.status === "approved" && tab === "earnings",
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

  // No profile yet — show apply form
  if ((profileError as any)?.message === "no_profile" || !profile) {
    return (
      <Layout>
        <div className="container py-10 max-w-2xl">
          <ApplyForm token={token!} onApplied={refetchProfile} />
        </div>
      </Layout>
    );
  }

  // Pending approval
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

  // Suspended
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

  // Approved — full dashboard
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
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">{t("courier.completed")}</p>
            <p className="text-xl font-black mt-0.5">{profile.completedDeliveries}</p>
          </div>
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">{t("courier.total_earnings")}</p>
            <p className="text-xl font-black mt-0.5" translate="no">${(earnings?.totalEarnings ?? 0).toFixed(2)}</p>
          </div>
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">{t("delivery.col_rating")}</p>
            <p className="text-xl font-black mt-0.5">{profile.rating ? profile.rating.toFixed(1) : "—"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["deliveries", "earnings"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold border transition-colors",
                tab === k ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {k === "deliveries" ? t("courier.my_deliveries") : t("courier.earnings_title")}
            </button>
          ))}
        </div>

        {/* Deliveries tab */}
        {tab === "deliveries" && (
          <div className="space-y-3">
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
                onAction={() => { refetchAssignments(); refetchProfile(); }}
              />
            ))}
          </div>
        )}

        {/* Earnings tab */}
        {tab === "earnings" && (
          <div className="space-y-3">
            {!earnings || earnings.transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-2xl text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">{t("courier.no_transactions")}</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
