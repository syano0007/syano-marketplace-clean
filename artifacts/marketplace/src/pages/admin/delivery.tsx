import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Truck, MapPin, User, Package, CheckCircle2, AlertCircle,
  Plus, Pencil, Trash2, X, Star, Phone,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReadyOrder {
  id: number;
  customerName: string;
  shippingAddress: string;
  customerPhone: string | null;
  city: string | null;
  deliveryFee: number | null;
  total: number;
  createdAt: string;
  updatedAt: string;
}
interface ActiveDelivery {
  assignmentId: number;
  orderId: number;
  assignmentStatus: string;
  assignedAt: string;
  pickedUpAt: string | null;
  courierName: string;
  orderStatus: string;
  shippingAddress: string;
  deliveryFee: number | null;
}
interface CourierRow {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: string;
  active: boolean;
  phone: string;
  vehicleType: string;
  district: string | null;
  rating: number | null;
  completedDeliveries: number;
  createdAt: string;
}
interface Zone {
  id: number;
  nameEn: string;
  nameAr: string;
  fee: number;
  active: boolean;
  createdAt: string;
}

// ─── Status badge ──────────────────────────────────────────────────────────────
const COURIER_STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  suspended:"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// ─── Zone form ─────────────────────────────────────────────────────────────────
function ZoneForm({ zone, onSave, onCancel, token }: {
  zone?: Zone | null;
  onSave: () => void;
  onCancel: () => void;
  token: string;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [nameEn, setNameEn] = useState(zone?.nameEn ?? "");
  const [nameAr, setNameAr] = useState(zone?.nameAr ?? "");
  const [fee, setFee] = useState(String(zone?.fee ?? "0"));
  const [active, setActive] = useState(zone?.active !== false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nameEn.trim() || !nameAr.trim()) { toast({ title: t("delivery.zone_name_en") + " required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = zone ? `/api/admin/delivery-zones/${zone.id}` : "/api/admin/delivery-zones";
      const method = zone ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nameEn: nameEn.trim(), nameAr: nameAr.trim(), fee: parseFloat(fee) || 0, active }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: t("delivery.zone_saved") });
      onSave();
    } catch (err: any) {
      toast({ title: err.message ?? t("common.error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-muted/30 border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t("delivery.zone_name_en")}</label>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Aleppo Center" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t("delivery.zone_name_ar")}</label>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: حلب المركز" dir="rtl" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t("delivery.zone_fee")}</label>
          <Input type="number" step="0.5" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              active ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn("pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform", active ? "translate-x-5" : "translate-x-0")}
            />
          </button>
          <span className="text-sm text-muted-foreground">{t("delivery.zone_active")}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "…" : t("delivery.save")}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>{t("delivery.cancel")}</Button>
      </div>
    </div>
  );
}

// ─── Assign courier dialog ─────────────────────────────────────────────────────
function AssignCourierForm({ orderId, couriers, onAssign, onCancel, token }: {
  orderId: number;
  couriers: CourierRow[];
  onAssign: () => void;
  onCancel: () => void;
  token: string;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [courierId, setCourierId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const approved = couriers.filter((c) => c.status === "approved");

  const handleAssign = async () => {
    if (!courierId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-courier`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courierId: parseInt(courierId) }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast({ title: t("delivery.assign_success") });
      onAssign();
    } catch (err: any) {
      toast({ title: err.message ?? t("delivery.assign_error"), variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
      <select
        value={courierId}
        onChange={(e) => setCourierId(e.target.value)}
        className="w-full h-9 px-3 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">{t("delivery.select_courier")}</option>
        {approved.map((c) => (
          <option key={c.id} value={c.id}>
            {c.userName} — {c.vehicleType} {c.district ? `(${c.district})` : ""}
          </option>
        ))}
      </select>
      {approved.length === 0 && <p className="text-xs text-muted-foreground">{t("delivery.no_couriers")}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAssign} disabled={!courierId || assigning}>{assigning ? "…" : t("delivery.assign")}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDelivery() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lang = i18n.language;

  const [tab, setTab] = useState<"ready" | "active" | "couriers" | "zones">("ready");
  const [assigningOrderId, setAssigningOrderId] = useState<number | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null | "new">(null);

  const headers = { Authorization: `Bearer ${token}` };

  const { data: readyOrders = [], refetch: refetchReady } = useQuery<ReadyOrder[]>({
    queryKey: ["admin-delivery-ready"],
    queryFn: () => fetch("/api/admin/delivery/ready-orders", { headers }).then((r) => r.json()),
    enabled: !!token && tab === "ready",
    refetchInterval: 15_000,
  });

  const { data: activeDeliveries = [], refetch: refetchActive } = useQuery<ActiveDelivery[]>({
    queryKey: ["admin-delivery-active"],
    queryFn: () => fetch("/api/admin/delivery/active", { headers }).then((r) => r.json()),
    enabled: !!token && tab === "active",
    refetchInterval: 15_000,
  });

  const { data: couriers = [], refetch: refetchCouriers } = useQuery<CourierRow[]>({
    queryKey: ["admin-couriers"],
    queryFn: () => fetch("/api/admin/couriers", { headers }).then((r) => r.json()),
    enabled: !!token,
  });

  const { data: zones = [], refetch: refetchZones } = useQuery<Zone[]>({
    queryKey: ["admin-delivery-zones"],
    queryFn: () => fetch("/api/admin/delivery-zones", { headers }).then((r) => r.json()),
    enabled: !!token,
  });

  const updateCourier = async (courierId: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/couriers/${courierId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const label = status === "approved"
        ? t("delivery.courier_approved")
        : status === "rejected"
          ? t("delivery.courier_rejected")
          : t("delivery.courier_suspended");
      toast({ title: label });
      refetchCouriers();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const deleteZone = async (zoneId: number) => {
    if (!confirm(t("delivery.confirm_delete"))) return;
    try {
      await fetch(`/api/admin/delivery-zones/${zoneId}`, { method: "DELETE", headers });
      toast({ title: t("delivery.zone_deleted") });
      refetchZones();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const TABS = [
    { key: "ready",   label: t("delivery.tab_ready"),   count: readyOrders.length },
    { key: "active",  label: t("delivery.tab_active"),  count: activeDeliveries.length },
    { key: "couriers",label: t("delivery.tab_couriers"), count: couriers.length },
    { key: "zones",   label: t("delivery.tab_zones"),   count: zones.length },
  ] as const;

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6" /> {t("delivery.title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("delivery.subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors",
                tab === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {label}
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                tab === key ? "bg-white/20 text-white" : "bg-muted"
              )}>{count}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Ready for Pickup ──────────────────────────────────────── */}
        {tab === "ready" && (
          <div className="space-y-3">
            {readyOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-2xl text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground text-sm">{t("delivery.ready_orders_empty")}</p>
              </div>
            ) : readyOrders.map((order) => (
              <div key={order.id} className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm" translate="no">#{order.id}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <MapPin className="h-3 w-3" /> {t("orders.status_ready_for_pickup")}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{order.shippingAddress}</p>
                    {order.customerPhone && (
                      <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1" translate="no">
                        <Phone className="h-3 w-3" />{order.customerPhone}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-bold" translate="no">${order.total.toFixed(2)}</span>
                    {order.deliveryFee != null && (
                      <span className="text-xs text-muted-foreground" translate="no">{t("delivery.col_fee")}: ${order.deliveryFee.toFixed(2)}</span>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setAssigningOrderId(assigningOrderId === order.id ? null : order.id)}
                      className="gap-1.5"
                    >
                      <User className="h-3.5 w-3.5" />
                      {t("delivery.assign")}
                    </Button>
                  </div>
                </div>
                {assigningOrderId === order.id && (
                  <div className="px-5 pb-4">
                    <AssignCourierForm
                      orderId={order.id}
                      couriers={couriers}
                      token={token!}
                      onAssign={() => { setAssigningOrderId(null); refetchReady(); refetchActive(); }}
                      onCancel={() => setAssigningOrderId(null)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Active Deliveries ─────────────────────────────────────── */}
        {tab === "active" && (
          <div className="space-y-3">
            {activeDeliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-2xl text-center">
                <Truck className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground text-sm">{t("delivery.active_empty")}</p>
              </div>
            ) : activeDeliveries.map((d) => (
              <div key={d.assignmentId} className="bg-card border rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm" translate="no">#{d.orderId}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-semibold",
                      d.orderStatus === "picked_up" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                      {d.orderStatus === "picked_up" ? t("orders.status_picked_up") : t("orders.status_courier_assigned")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{d.shippingAddress}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{d.courierName}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.pickedUpAt ? t("orders.status_picked_up") : t("orders.status_courier_assigned")}
                    </p>
                  </div>
                </div>
                {d.deliveryFee != null && (
                  <span className="text-sm font-bold shrink-0" translate="no">${d.deliveryFee.toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Couriers ──────────────────────────────────────────────── */}
        {tab === "couriers" && (
          <div className="space-y-3">
            {couriers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-2xl text-center">
                <User className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground text-sm">{t("delivery.couriers_empty")}</p>
              </div>
            ) : couriers.map((courier) => (
              <div key={courier.id} className="bg-card border rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm">{courier.userName}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold border", COURIER_STATUS_COLORS[courier.status])}>
                      {t(`delivery.status_${courier.status}`)}
                    </span>
                    {courier.active && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {t("courier.status_online")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground" translate="no">{courier.userEmail}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{t(`delivery.vehicle_${courier.vehicleType}`)}</span>
                    {courier.district && <span>· {courier.district}</span>}
                    <span>· {t("delivery.col_deliveries")}: {courier.completedDeliveries}</span>
                    {courier.rating && (
                      <span className="flex items-center gap-0.5">
                        · <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {courier.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {courier.status !== "approved" && courier.status !== "rejected" && (
                    <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700" onClick={() => updateCourier(courier.id, "approved")}>
                      {t("delivery.approve")}
                    </Button>
                  )}
                  {courier.status === "pending" && (
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600" onClick={() => updateCourier(courier.id, "rejected")}>
                      {t("delivery.reject")}
                    </Button>
                  )}
                  {courier.status === "approved" && (
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => updateCourier(courier.id, "suspended")}>
                      {t("delivery.suspend")}
                    </Button>
                  )}
                  {courier.status === "suspended" && (
                    <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700" onClick={() => updateCourier(courier.id, "approved")}>
                      {t("delivery.approve")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Delivery Zones ────────────────────────────────────────── */}
        {tab === "zones" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setEditingZone("new")} className="gap-1.5">
                <Plus className="h-4 w-4" /> {t("delivery.add_zone")}
              </Button>
            </div>

            {editingZone === "new" && (
              <ZoneForm
                zone={null}
                token={token!}
                onSave={() => { setEditingZone(null); refetchZones(); }}
                onCancel={() => setEditingZone(null)}
              />
            )}

            {zones.length === 0 && editingZone !== "new" ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-2xl text-center">
                <MapPin className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground text-sm">{t("delivery.zones_empty")}</p>
              </div>
            ) : zones.map((zone) => (
              <div key={zone.id}>
                {editingZone !== "new" && editingZone?.id === zone.id ? (
                  <ZoneForm
                    zone={zone}
                    token={token!}
                    onSave={() => { setEditingZone(null); refetchZones(); }}
                    onCancel={() => setEditingZone(null)}
                  />
                ) : (
                  <div className="bg-card border rounded-xl px-5 py-3.5 flex items-center gap-4">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{lang === "ar" ? zone.nameAr : zone.nameEn}</p>
                        {!zone.active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{lang === "ar" ? zone.nameEn : zone.nameAr}</p>
                    </div>
                    <span className="font-bold text-sm shrink-0" translate="no">${zone.fee.toFixed(2)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingZone(zone)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => deleteZone(zone.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
