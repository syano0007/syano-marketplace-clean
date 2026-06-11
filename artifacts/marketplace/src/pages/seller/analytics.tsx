// @refresh reset
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, Minus,
  DollarSign, ShoppingBag, Users, Star, Package,
  Truck, UserCheck, Heart, BarChart2,
  Download, ChevronDown, RefreshCw, Lightbulb,
  CheckCircle, XCircle, Clock,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Layout } from "@/components/Layout";
import { SellerNav } from "@/components/SellerNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Types ──────────────────────────────────────────────────── */
interface KPIData { value: number; prev: number; change: number | null; }
interface AnalyticsSummary {
  period: { from: string; to: string };
  kpis: {
    totalOrders: KPIData; completedOrders: KPIData; cancelledOrders: KPIData;
    refundedOrders: KPIData; grossRevenue: KPIData; avgOrderValue: KPIData;
    followers: KPIData; storeRating: KPIData;
  };
  orderStatusBreakdown: { status: string; count: number }[];
  topProducts: { productId: number; productName: string; imageUrl: string | null; viewCount: number; unitsSold: number; revenue: number }[];
  customers: { unique: number; returning: number; new: number; repeatRate: number; avgOrdersPerCustomer: number; prevUnique: number; change: number | null };
  delivery: { totalDelivered: number; totalFailed: number; successRate: number; avgDeliveryHours: number; cancellationRate: number };
  growth: { totalFollowers: number; newFollowers: number; prevFollowers: number; followerChange: number | null; totalReviews: number; avgRating: number; newReviews: number; prevReviews: number; reviewChange: number | null };
}
interface RevenuePoint { date: string; revenue: number; orders: number; aov: number; }
interface RevenueChartData { granularity: string; points: RevenuePoint[]; }
type DatePreset = "today" | "yesterday" | "7d" | "30d" | "90d" | "this_month" | "last_month" | "this_year";
type Granularity = "day" | "week" | "month";

/* ─── Date helpers ───────────────────────────────────────────── */
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}
function getPresetRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "today":      return { from: today, to: now };
    case "yesterday": {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      const ye = new Date(y); ye.setHours(23, 59, 59, 999);
      return { from: y, to: ye };
    }
    case "7d": {
      const f = new Date(today); f.setDate(f.getDate() - 6);
      return { from: f, to: now };
    }
    case "30d": {
      const f = new Date(today); f.setDate(f.getDate() - 29);
      return { from: f, to: now };
    }
    case "90d": {
      const f = new Date(today); f.setDate(f.getDate() - 89);
      return { from: f, to: now };
    }
    case "this_month": {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: f, to: now };
    }
    case "last_month": {
      const f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const t = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from: f, to: t };
    }
    case "this_year": {
      const f = new Date(now.getFullYear(), 0, 1);
      return { from: f, to: now };
    }
  }
}
function formatChartDate(dateStr: string, gran: Granularity, lang: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const locale = lang === "ar" ? "ar-SY" : "en-US";
  if (gran === "month") return d.toLocaleDateString(locale, { month: "short", year: "2-digit" });
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}
function formatDateLabel(dateStr: string, lang: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString(lang === "ar" ? "ar-SY" : "en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── CSV export ─────────────────────────────────────────────── */
function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ─── STATUS colors ──────────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  delivered:        "#10b981",
  pending:          "#f59e0b",
  confirmed:        "#3b82f6",
  preparing:        "#06b6d4",
  ready_for_pickup: "#0891b2",
  courier_assigned: "#6366f1",
  out_for_delivery: "#8b5cf6",
  cancelled:        "#ef4444",
  delivery_failed:  "#f97316",
  returned:         "#ec4899",
  refunded:         "#a855f7",
};
const PIE_FALLBACK = "#94a3b8";

/* ─── Trend badge ────────────────────────────────────────────── */
function TrendBadge({ change, t }: { change: number | null; t: (k: string, o?: Record<string, unknown>) => string }) {
  if (change === null) return <span className="text-xs text-muted-foreground">{t("seller_analytics.no_prev")}</span>;
  if (change === 0)    return <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="h-3 w-3" />0%</span>;
  const up = change > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{change}%
    </span>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────── */
interface KPICardProps {
  label: string; value: string; kpi: KPIData; icon: React.ReactNode;
  sub?: string; accent?: string; t: (k: string, o?: Record<string, unknown>) => string;
}
function KPICard({ label, value, kpi, icon, sub, accent = "text-primary", t }: KPICardProps) {
  return (
    <div className="bg-card border rounded-xl p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-primary/8 ${accent}`}>{icon}</div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <TrendBadge change={kpi.change} t={t} />
        <span className="text-xs text-muted-foreground">{t("seller_analytics.vs_prev")}</span>
      </div>
    </div>
  );
}

/* ─── Date preset picker ─────────────────────────────────────── */
interface DatePickerProps {
  preset: DatePreset; from: Date; to: Date;
  onPreset: (p: DatePreset) => void;
  onCustom: (from: Date, to: Date) => void;
  t: (k: string) => string; lang: string;
}
function DatePicker({ preset, from, to, onPreset, onCustom, t, lang }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(toDateStr(from));
  const [customTo, setCustomTo] = useState(toDateStr(to));
  const presets: { key: DatePreset; label: string }[] = [
    { key: "today",      label: t("seller_analytics.preset_today") },
    { key: "yesterday",  label: t("seller_analytics.preset_yesterday") },
    { key: "7d",         label: t("seller_analytics.preset_7d") },
    { key: "30d",        label: t("seller_analytics.preset_30d") },
    { key: "90d",        label: t("seller_analytics.preset_90d") },
    { key: "this_month", label: t("seller_analytics.preset_this_month") },
    { key: "last_month", label: t("seller_analytics.preset_last_month") },
    { key: "this_year",  label: t("seller_analytics.preset_this_year") },
  ];
  const selectedLabel = presets.find(p => p.key === preset)?.label ?? `${formatDateLabel(customFrom, lang)} — ${formatDateLabel(customTo, lang)}`;

  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="gap-2 font-medium" onClick={() => setOpen(v => !v)}>
        <BarChart2 className="h-4 w-4 text-muted-foreground" />
        {selectedLabel}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      {open && (
        <div className={`absolute top-full mt-1 z-50 bg-popover border rounded-xl shadow-lg p-3 w-72 ${lang === "ar" ? "left-0" : "right-0"}`}>
          <div className="grid grid-cols-2 gap-1 mb-3">
            {presets.map(p => (
              <button key={p.key} onClick={() => { onPreset(p.key); setOpen(false); }}
                className={`px-2.5 py-1.5 rounded-lg text-sm font-medium text-start transition-colors ${preset === p.key ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("seller_analytics.custom_range")}</p>
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="flex-1 h-8 rounded-lg border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none" />
              <span className="text-muted-foreground text-xs">—</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="flex-1 h-8 rounded-lg border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none" />
            </div>
            <Button size="sm" className="w-full" onClick={() => {
              if (customFrom && customTo) { onCustom(new Date(customFrom), new Date(customTo)); setOpen(false); }
            }}>{t("seller_analytics.apply")}</Button>
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

/* ─── Granularity toggle ─────────────────────────────────────── */
function GranularityToggle({ value, onChange, t }: { value: Granularity; onChange: (g: Granularity) => void; t: (k: string) => string }) {
  const opts: { key: Granularity; label: string }[] = [
    { key: "day",   label: t("seller_analytics.gran_day") },
    { key: "week",  label: t("seller_analytics.gran_week") },
    { key: "month", label: t("seller_analytics.gran_month") },
  ];
  return (
    <div className="flex items-center rounded-lg border p-0.5 bg-muted/40">
      {opts.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${value === o.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Custom Tooltip ─────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, formatCurrency, t }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border rounded-xl shadow-lg px-3 py-2.5 text-sm min-w-[140px]">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium tabular-nums" style={{ color: p.color }}>
            {p.dataKey === "revenue" ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Section card wrapper ───────────────────────────────────── */
function SectionCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─── Stat row ───────────────────────────────────────────────── */
function StatRow({ icon, label, value, accent = "" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center bg-muted ${accent}`}>{icon}</div>
        {label}
      </div>
      <span className="font-semibold text-sm tabular-nums text-foreground">{value}</span>
    </div>
  );
}

/* ─── Skeleton section ───────────────────────────────────────── */
function SectionSkeleton() {
  return (
    <div className="bg-card border rounded-xl p-5 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/* ─── Insights generator ─────────────────────────────────────── */
function generateInsights(summary: AnalyticsSummary, format: (n: number) => string, t: (k: string, o?: Record<string, unknown>) => string): string[] {
  const insights: string[] = [];
  const { kpis, topProducts, customers, delivery, growth } = summary;

  if (kpis.grossRevenue.change !== null && kpis.grossRevenue.change !== 0) {
    const dir = kpis.grossRevenue.change > 0 ? t("seller_analytics.insight_up") : t("seller_analytics.insight_down");
    insights.push(t("seller_analytics.insight_revenue", { dir, pct: Math.abs(kpis.grossRevenue.change) }));
  }
  if (topProducts.length > 0 && kpis.grossRevenue.value > 0) {
    const top = topProducts[0];
    const share = ((top.revenue / kpis.grossRevenue.value) * 100).toFixed(0);
    insights.push(t("seller_analytics.insight_top_product", { name: top.productName, share, revenue: format(top.revenue) }));
  }
  if (delivery.cancellationRate > 10) {
    insights.push(t("seller_analytics.insight_cancellation_high", { rate: delivery.cancellationRate }));
  } else if (kpis.cancelledOrders.value === 0 && kpis.totalOrders.value > 0) {
    insights.push(t("seller_analytics.insight_no_cancellations"));
  }
  if (delivery.totalDelivered > 0) {
    insights.push(t("seller_analytics.insight_delivery_rate", { rate: delivery.successRate }));
  }
  if (growth.newFollowers > 0) {
    insights.push(t("seller_analytics.insight_followers", { count: growth.newFollowers }));
  }
  if (customers.repeatRate > 0) {
    insights.push(t("seller_analytics.insight_repeat", { rate: customers.repeatRate }));
  }
  if (kpis.avgOrderValue.change !== null && kpis.avgOrderValue.change > 5) {
    insights.push(t("seller_analytics.insight_aov_up", { pct: kpis.avgOrderValue.change }));
  }
  return insights;
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function SellerAnalytics() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const dir = i18n.dir();
  const { format: formatCurrency } = useCurrency();
  const { token } = useAuth();

  const [preset, setPreset] = useState<DatePreset>("30d");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => getPresetRange("30d"));
  const [granularity, setGranularity] = useState<Granularity>("day");

  const fromStr = useMemo(() => toDateStr(dateRange.from), [dateRange.from]);
  const toStr   = useMemo(() => toDateStr(dateRange.to),   [dateRange.to]);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const handlePreset = useCallback((p: DatePreset) => {
    setPreset(p);
    setDateRange(getPresetRange(p));
  }, []);
  const handleCustom = useCallback((from: Date, to: Date) => {
    setPreset("30d");
    setDateRange({ from, to });
  }, []);

  /* ── Queries ── */
  const summaryQuery = useQuery<AnalyticsSummary>({
    queryKey: ["seller-analytics-summary", fromStr, toStr],
    queryFn: async () => {
      const r = await fetch(`/api/dashboard/seller/analytics/summary?from=${fromStr}&to=${toStr}`, { headers });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    staleTime: 60_000,
  });

  const chartQuery = useQuery<RevenueChartData>({
    queryKey: ["seller-analytics-chart", fromStr, toStr, granularity],
    queryFn: async () => {
      const r = await fetch(`/api/dashboard/seller/analytics/revenue-chart?from=${fromStr}&to=${toStr}&granularity=${granularity}`, { headers });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    staleTime: 60_000,
  });

  const s = summaryQuery.data;
  const chart = chartQuery.data;
  const isLoading = summaryQuery.isLoading;

  /* ── Chart X-axis tick formatter ── */
  const tickFormatter = useCallback((d: string) => formatChartDate(d, granularity, lang), [granularity, lang]);

  /* ── Status label ── */
  const statusLabel = useCallback((st: string) => t(`seller_orders.status_${st}`, st.replace(/_/g, " ")), [t]);

  /* ── Pie chart ── */
  const pieData = useMemo(() => (s?.orderStatusBreakdown ?? []).filter(d => d.count > 0).map(d => ({
    name: statusLabel(d.status),
    value: d.count,
    color: STATUS_COLORS[d.status] ?? PIE_FALLBACK,
  })), [s, statusLabel]);

  /* ── Top products bar data ── */
  const productBarData = useMemo(() => (s?.topProducts ?? []).map(p => ({
    name: p.productName.length > 18 ? p.productName.slice(0, 18) + "…" : p.productName,
    fullName: p.productName,
    revenue: p.revenue,
    unitsSold: p.unitsSold,
    imageUrl: p.imageUrl,
  })), [s]);

  /* ── Insights ── */
  const insights = useMemo(() => s ? generateInsights(s, formatCurrency, t) : [], [s, formatCurrency, t]);

  /* ── CSV export ── */
  const handleExportRevenue = useCallback(() => {
    if (!chart?.points) return;
    downloadCSV(chart.points.map(p => ({ date: p.date, revenue: p.revenue, orders: p.orders, avg_order_value: p.aov })), `revenue-${fromStr}-${toStr}.csv`);
  }, [chart, fromStr, toStr]);
  const handleExportProducts = useCallback(() => {
    if (!s?.topProducts) return;
    downloadCSV(s.topProducts.map(p => ({ product_id: p.productId, product_name: p.productName, units_sold: p.unitsSold, revenue: p.revenue, views: p.viewCount })), `products-${fromStr}-${toStr}.csv`);
  }, [s, fromStr, toStr]);

  return (
    <Layout hideFooter>
      <SellerNav />
      <div className="container max-w-7xl px-4 sm:px-6 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t("seller_analytics.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {s ? `${formatDateLabel(s.period.from, lang)} — ${formatDateLabel(s.period.to, lang)}` : t("seller_analytics.loading_period")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { summaryQuery.refetch(); chartQuery.refetch(); }}>
              <RefreshCw className={`h-3.5 w-3.5 ${summaryQuery.isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t("seller_analytics.refresh")}</span>
            </Button>
            <DatePicker preset={preset} from={dateRange.from} to={dateRange.to} onPreset={handlePreset} onCustom={handleCustom} t={t} lang={lang} />
          </div>
        </div>

        {/* ── Error ── */}
        {summaryQuery.isError && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
            {t("seller_analytics.error_load")}
          </div>
        )}

        {/* ── KPI Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoading ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-xl p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          )) : s ? (<>
            <KPICard label={t("seller_analytics.kpi_revenue")}   value={formatCurrency(s.kpis.grossRevenue.value)}   kpi={s.kpis.grossRevenue}   icon={<DollarSign   className="h-4 w-4" />} t={t} />
            <KPICard label={t("seller_analytics.kpi_orders")}    value={String(s.kpis.totalOrders.value)}             kpi={s.kpis.totalOrders}    icon={<ShoppingBag  className="h-4 w-4" />} t={t} accent="text-blue-600" />
            <KPICard label={t("seller_analytics.kpi_aov")}       value={formatCurrency(s.kpis.avgOrderValue.value)}  kpi={s.kpis.avgOrderValue}  icon={<BarChart2    className="h-4 w-4" />} t={t} accent="text-violet-600" />
            <KPICard label={t("seller_analytics.kpi_completed")} value={String(s.kpis.completedOrders.value)}        kpi={s.kpis.completedOrders} icon={<CheckCircle className="h-4 w-4" />} t={t} accent="text-emerald-600" />
            <KPICard label={t("seller_analytics.kpi_cancelled")} value={String(s.kpis.cancelledOrders.value)}        kpi={s.kpis.cancelledOrders} icon={<XCircle     className="h-4 w-4" />} t={t} accent="text-red-500" />
            <KPICard label={t("seller_analytics.kpi_followers")} value={String(s.kpis.followers.value)}              kpi={s.kpis.followers}       icon={<Heart       className="h-4 w-4" />} t={t} accent="text-pink-500" />
            <KPICard label={t("seller_analytics.kpi_customers")} value={String(s.customers.unique)}                  kpi={{ value: s.customers.unique, prev: s.customers.prevUnique, change: s.customers.change }} icon={<Users className="h-4 w-4" />} t={t} accent="text-cyan-600" />
            <KPICard label={t("seller_analytics.kpi_rating")}    value={s.growth.avgRating > 0 ? `${s.growth.avgRating} ★` : "—"} kpi={s.kpis.storeRating} icon={<Star className="h-4 w-4" />} t={t} accent="text-amber-500" sub={s.growth.totalReviews > 0 ? t("seller_analytics.review_count", { count: s.growth.totalReviews }) : undefined} />
          </>) : null}
        </div>

        {/* ── Revenue Chart + Order Status Pie ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue + Orders area chart */}
          <SectionCard
            title={t("seller_analytics.chart_revenue_title")}
            subtitle={t("seller_analytics.chart_revenue_sub")}
            action={
              <div className="flex items-center gap-2">
                <GranularityToggle value={granularity} onChange={setGranularity} t={t} />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExportRevenue} title={t("seller_analytics.export_csv")}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            }
          >
            {chartQuery.isLoading ? <Skeleton className="h-56 w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chart?.points ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatCurrency(v)} width={dir === "rtl" ? 60 : 55} axisLine={false} tickLine={false} orientation={dir === "rtl" ? "right" : "left"} />
                  <YAxis yAxisId="ord" orientation={dir === "rtl" ? "left" : "right"} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={28} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} t={t} />} />
                  <Area yAxisId="rev" type="monotone" dataKey="revenue" name={t("seller_analytics.chart_revenue")} stroke="#10b981" strokeWidth={2} fill="url(#gradRevenue)" dot={false} />
                  <Area yAxisId="ord" type="monotone" dataKey="orders"  name={t("seller_analytics.chart_orders")}  stroke="#6366f1" strokeWidth={1.5} fill="url(#gradOrders)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          {/* Order status pie */}
          <SectionCard title={t("seller_analytics.chart_status_title")} subtitle={t("seller_analytics.chart_status_sub")}>
            {isLoading ? <Skeleton className="h-56 w-full" /> : pieData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">{t("seller_analytics.no_data")}</div>
            ) : (
              <div className="flex flex-col gap-3">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => v} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {pieData.slice(0, 8).map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="truncate">{d.name}</span>
                      <span className="font-semibold text-foreground ms-auto shrink-0">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Top Products + Customer Analytics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top products */}
          <SectionCard
            title={t("seller_analytics.products_title")}
            subtitle={t("seller_analytics.products_sub")}
            action={
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExportProducts} title={t("seller_analytics.export_csv")}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            }
          >
            {isLoading ? <Skeleton className="h-64 w-full" /> : productBarData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">{t("seller_analytics.no_data")}</div>
            ) : (
              <div className="space-y-2.5">
                {productBarData.slice(0, 5).map((p, i) => {
                  const maxRev = productBarData[0].revenue || 1;
                  const pct = Math.max(4, (p.revenue / maxRev) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="h-7 w-7 rounded-md object-cover border shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-foreground truncate" title={p.fullName}>{p.name}</span>
                        </div>
                        <div className="text-end shrink-0">
                          <div className="text-sm font-semibold tabular-nums">{formatCurrency(p.revenue)}</div>
                          <div className="text-xs text-muted-foreground">{p.unitsSold} {t("seller_analytics.units")}</div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {productBarData.length > 5 && (
                  <div className="h-48 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productBarData.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatCurrency(v)} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="revenue" name={t("seller_analytics.chart_revenue")} fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Customer analytics */}
          <SectionCard title={t("seller_analytics.customers_title")} subtitle={t("seller_analytics.customers_sub")}>
            {isLoading ? <Skeleton className="h-64 w-full" /> : s ? (
              <div className="space-y-1">
                <StatRow icon={<Users className="h-3.5 w-3.5" />}       label={t("seller_analytics.cust_unique")}  value={String(s.customers.unique)} />
                <StatRow icon={<UserCheck className="h-3.5 w-3.5" />}   label={t("seller_analytics.cust_returning")} value={String(s.customers.returning)} accent="text-emerald-600" />
                <StatRow icon={<Users className="h-3.5 w-3.5" />}       label={t("seller_analytics.cust_new")} value={String(s.customers.new)} accent="text-blue-600" />
                <StatRow icon={<BarChart2 className="h-3.5 w-3.5" />}   label={t("seller_analytics.cust_repeat_rate")} value={`${s.customers.repeatRate}%`} />
                <StatRow icon={<ShoppingBag className="h-3.5 w-3.5" />} label={t("seller_analytics.cust_avg_orders")} value={String(s.customers.avgOrdersPerCustomer)} />
                <div className="pt-3 mt-1 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("seller_analytics.cust_breakdown")}</p>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{s.customers.new}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t("seller_analytics.cust_new")}</div>
                    </div>
                    <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{s.customers.returning}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t("seller_analytics.cust_returning")}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </SectionCard>
        </div>

        {/* ── Delivery Analytics + Store Growth ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Delivery analytics */}
          <SectionCard title={t("seller_analytics.delivery_title")} subtitle={t("seller_analytics.delivery_sub")}>
            {isLoading ? <Skeleton className="h-52 w-full" /> : s ? (
              <div className="space-y-1">
                <StatRow icon={<CheckCircle className="h-3.5 w-3.5" />}  label={t("seller_analytics.dlv_delivered")}    value={String(s.delivery.totalDelivered)}  accent="text-emerald-600" />
                <StatRow icon={<XCircle className="h-3.5 w-3.5" />}       label={t("seller_analytics.dlv_failed")}       value={String(s.delivery.totalFailed)}     accent="text-red-500" />
                <StatRow icon={<Truck className="h-3.5 w-3.5" />}         label={t("seller_analytics.dlv_success_rate")} value={`${s.delivery.successRate}%`}       accent="text-blue-600" />
                <StatRow icon={<Clock className="h-3.5 w-3.5" />}         label={t("seller_analytics.dlv_avg_hours")}    value={s.delivery.avgDeliveryHours > 0 ? t("seller_analytics.hours", { n: s.delivery.avgDeliveryHours }) : "—"} />
                <StatRow icon={<XCircle className="h-3.5 w-3.5" />}       label={t("seller_analytics.dlv_cancel_rate")}  value={`${s.delivery.cancellationRate}%`}  accent="text-orange-500" />
                {s.delivery.totalDelivered + s.delivery.totalFailed > 0 && (
                  <div className="pt-2 mt-1">
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${s.delivery.successRate}%` }} />
                      <div className="h-full bg-red-400 transition-all" style={{ width: `${100 - s.delivery.successRate}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{t("seller_analytics.dlv_success_rate")}: {s.delivery.successRate}%</span>
                      <span>{t("seller_analytics.dlv_failed")}: {100 - s.delivery.successRate}%</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </SectionCard>

          {/* Store growth */}
          <SectionCard title={t("seller_analytics.growth_title")} subtitle={t("seller_analytics.growth_sub")}>
            {isLoading ? <Skeleton className="h-52 w-full" /> : s ? (
              <div className="space-y-1">
                <StatRow icon={<Heart className="h-3.5 w-3.5" />}   label={t("seller_analytics.growth_total_followers")} value={String(s.growth.totalFollowers)} accent="text-pink-500" />
                <StatRow icon={<TrendingUp className="h-3.5 w-3.5" />} label={t("seller_analytics.growth_new_followers")} value={String(s.growth.newFollowers)} accent="text-emerald-600" />
                <StatRow icon={<Star className="h-3.5 w-3.5" />}     label={t("seller_analytics.growth_total_reviews")} value={String(s.growth.totalReviews)} accent="text-amber-500" />
                <StatRow icon={<Star className="h-3.5 w-3.5" />}     label={t("seller_analytics.growth_new_reviews")}   value={String(s.growth.newReviews)} />
                <StatRow icon={<Star className="h-3.5 w-3.5" />}     label={t("seller_analytics.growth_avg_rating")}   value={s.growth.avgRating > 0 ? `${s.growth.avgRating} / 5` : "—"} accent="text-amber-500" />
                <div className="pt-2 mt-1 grid grid-cols-2 gap-3">
                  <div className="bg-pink-50 dark:bg-pink-950/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-pink-600 dark:text-pink-400 tabular-nums">{s.growth.newFollowers}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t("seller_analytics.growth_new_followers")}</div>
                    {s.growth.followerChange !== null && (
                      <div className="mt-1"><TrendBadge change={s.growth.followerChange} t={t} /></div>
                    )}
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{s.growth.newReviews}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t("seller_analytics.growth_new_reviews")}</div>
                    {s.growth.reviewChange !== null && (
                      <div className="mt-1"><TrendBadge change={s.growth.reviewChange} t={t} /></div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </SectionCard>
        </div>

        {/* ── Financial Summary ── */}
        {s && (
          <SectionCard title={t("seller_analytics.financial_title")} subtitle={t("seller_analytics.financial_sub")}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: t("seller_analytics.fin_gross_revenue"),   value: formatCurrency(s.kpis.grossRevenue.value),   color: "text-emerald-600" },
                { label: t("seller_analytics.fin_total_orders"),    value: String(s.kpis.totalOrders.value),            color: "text-blue-600" },
                { label: t("seller_analytics.fin_aov"),             value: formatCurrency(s.kpis.avgOrderValue.value),  color: "text-violet-600" },
                { label: t("seller_analytics.fin_cancelled_value"), value: String(s.kpis.cancelledOrders.value) + " " + t("seller_analytics.orders_unit"), color: "text-red-500" },
                { label: t("seller_analytics.fin_refunded"),        value: String(s.kpis.refundedOrders.value) + " " + t("seller_analytics.orders_unit"), color: "text-orange-500" },
              ].map((item, i) => (
                <div key={i} className="bg-muted/40 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold tabular-nums ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Insights Panel ── */}
        {insights.length > 0 && (
          <SectionCard title={t("seller_analytics.insights_title")} subtitle={t("seller_analytics.insights_sub")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl p-3">
                  <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Export ── */}
        <SectionCard title={t("seller_analytics.export_title")} subtitle={t("seller_analytics.export_sub")}>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2" onClick={handleExportRevenue} disabled={!chart?.points?.length}>
              <Download className="h-4 w-4" />
              {t("seller_analytics.export_revenue")}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportProducts} disabled={!s?.topProducts?.length}>
              <Download className="h-4 w-4" />
              {t("seller_analytics.export_products")}
            </Button>
          </div>
        </SectionCard>

      </div>
    </Layout>
  );
}
