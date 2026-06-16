import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ClipboardList, Search, Package, User, Store, Truck,
  Clock, CheckCircle2, AlertCircle, XCircle, ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryMission {
  id: number;
  orderId: number;
  sellerId: number;
  customerId: number;
  courierId: number | null;
  status: string;
  deliveryFee: string | null;
  deliverySize: string;
  pickupAddress: string;
  dropoffAddress: string;
  createdAt: string;
  sellerName: string | null;
  storeName: string | null;
  customerName: string | null;
  courierName: string | null;
  courierPhone: string | null;
}

interface MissionsResponse {
  data: DeliveryMission[];
  total: number;
  page: number;
  limit: number;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string; icon: React.ElementType }> = {
  PENDING:    { label: "Pending",    labelAr: "في الانتظار",   color: "text-yellow-400 bg-yellow-400/10",  icon: Clock },
  ASSIGNED:   { label: "Assigned",   labelAr: "تم التعيين",    color: "text-blue-400 bg-blue-400/10",      icon: Truck },
  ACCEPTED:   { label: "Accepted",   labelAr: "مقبولة",        color: "text-indigo-400 bg-indigo-400/10",  icon: CheckCircle2 },
  PICKED_UP:  { label: "Picked Up",  labelAr: "تم الاستلام",   color: "text-purple-400 bg-purple-400/10",  icon: Package },
  IN_TRANSIT: { label: "In Transit", labelAr: "في الطريق",     color: "text-orange-400 bg-orange-400/10",  icon: Truck },
  DELIVERED:  { label: "Delivered",  labelAr: "تم التسليم",    color: "text-emerald-400 bg-emerald-400/10",icon: CheckCircle2 },
  FAILED:     { label: "Failed",     labelAr: "فشل",           color: "text-red-400 bg-red-400/10",        icon: AlertCircle },
  CANCELLED:  { label: "Cancelled",  labelAr: "ملغاة",         color: "text-gray-400 bg-gray-400/10",      icon: XCircle },
};

const SIZE_LABELS: Record<string, { en: string; ar: string }> = {
  SMALL:  { en: "Small",  ar: "صغير" },
  MEDIUM: { en: "Medium", ar: "متوسط" },
  LARGE:  { en: "Large",  ar: "كبير" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDeliveryMissions() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const isRtl = i18n.language === "ar";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<MissionsResponse>({
    queryKey: ["admin", "delivery-missions", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/delivery-missions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch delivery missions");
      return res.json();
    },
  });

  const { data: statsData } = useQuery<Record<string, number>>({
    queryKey: ["admin", "delivery-missions", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/delivery-missions/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return {};
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const missions = data?.data ?? [];
  const total    = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const filtered = search
    ? missions.filter((m) =>
        String(m.id).includes(search) ||
        String(m.orderId).includes(search) ||
        m.sellerName?.toLowerCase().includes(search.toLowerCase()) ||
        m.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        m.courierName?.toLowerCase().includes(search.toLowerCase())
      )
    : missions;

  const statuses = Object.keys(STATUS_CONFIG);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">
              {isRtl ? "مهام التوصيل" : "Delivery Missions"}
            </h1>
            <p className="text-sm text-gray-400">
              {isRtl ? "سجل مهام التوصيل للطلبات" : "Record of all delivery missions"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              className="pl-9 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              placeholder={isRtl ? "بحث..." : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setStatusFilter(""); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                !statusFilter
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-300",
              )}
            >
              {isRtl ? "الكل" : "All"}
            </button>
            {statuses.map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    statusFilter === s
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-300",
                  )}
                >
                  {isRtl ? cfg.labelAr : cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status counter cards */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
          {(["PENDING","ASSIGNED","ACCEPTED","PICKED_UP","IN_TRANSIT","DELIVERED","FAILED","CANCELLED"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const StatusIcon = cfg.icon;
            const cnt = statsData?.[s] ?? 0;
            const isActive = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(isActive ? "" : s); setPage(1); }}
                className={cn(
                  "rounded-xl border p-3 text-center flex flex-col items-center gap-1 transition-all",
                  isActive
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-gray-800 bg-gray-900/60 hover:border-gray-700"
                )}
              >
                <StatusIcon className={cn("w-4 h-4", cfg.color.split(" ")[0])} />
                <p className={cn("text-lg font-bold", isActive ? "text-emerald-300" : cnt > 0 ? "text-white" : "text-gray-600")}>
                  {cnt}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">
                  {isRtl ? cfg.labelAr : cfg.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Stats summary */}
        <div className="text-sm text-gray-400">
          {isRtl ? `${total} مهمة` : `${total} mission${total !== 1 ? "s" : ""}`}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/80">
                <tr className="text-gray-400 text-left border-b border-gray-800">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    {isRtl ? "المعرّف" : "Mission ID"}
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    {isRtl ? "الطلب" : "Order ID"}
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    {isRtl ? "البائع" : "Seller"}
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    {isRtl ? "العميل" : "Customer"}
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    {isRtl ? "المندوب" : "Courier"}
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    {isRtl ? "الحالة" : "Status"}
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    {isRtl ? "الحجم" : "Delivery Size"}
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    {isRtl ? "تاريخ الإنشاء" : "Created At"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      {isRtl ? "جارٍ التحميل..." : "Loading..."}
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>{isRtl ? "لا توجد مهام توصيل بعد" : "No delivery missions yet"}</p>
                    </td>
                  </tr>
                )}
                {filtered.map((m) => {
                  const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.PENDING;
                  const StatusIcon = cfg.icon;
                  const sizeLabel = SIZE_LABELS[m.deliverySize] ?? { en: m.deliverySize, ar: m.deliverySize };
                  const createdAt = new Date(m.createdAt).toLocaleDateString(
                    isRtl ? "ar-SY" : "en-US",
                    { year: "numeric", month: "short", day: "numeric" },
                  );
                  return (
                    <tr key={m.id} className="hover:bg-gray-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-emerald-400 font-medium">
                        #{m.id}
                      </td>
                      <td className="px-4 py-3 text-gray-300 font-mono">
                        #{m.orderId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span className="text-gray-200 truncate max-w-[120px]">
                            {m.storeName ?? m.sellerName ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span className="text-gray-200 truncate max-w-[120px]">
                            {m.customerName ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {m.courierName ? (
                          <div className="flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="text-gray-200 truncate max-w-[100px]">{m.courierName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs italic">
                            {isRtl ? "غير معيّن" : "Unassigned"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium", cfg.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {isRtl ? cfg.labelAr : cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {isRtl ? sizeLabel.ar : sizeLabel.en}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {createdAt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-900 border border-gray-700 text-gray-300 disabled:opacity-40 hover:bg-gray-800 transition-colors"
            >
              {isRtl ? "السابق" : "Prev"}
            </button>
            <span className="text-sm text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-900 border border-gray-700 text-gray-300 disabled:opacity-40 hover:bg-gray-800 transition-colors"
            >
              {isRtl ? "التالي" : "Next"}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
