import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  useListProducts,
  useGetPublicSettings,
  getListProductsQueryKey,
  getGetPublicSettingsQueryKey,
} from "@workspace/api-client-react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Truck,
  Zap,
  Store,
  Cpu,
  Shirt,
  Sparkles,
  Home as HomeIcon,
  ShoppingBasket,
  Dumbbell,
  Car,
  Gamepad2,
  BadgeCheck,
  Star,
  Clock,
  UtensilsCrossed,
} from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { ProductCard } from "@/components/ProductCard";
import { useTranslation } from "react-i18next";
import { useSEO } from "@/hooks/useSEO";
import { useSellerOnboarding } from "@/hooks/useSellerOnboarding";
import { useCourierOnboarding } from "@/hooks/useCourierOnboarding";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { HeroV4 } from "@/components/HeroV4";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   CATEGORY DATA — matches reference image order / labels exactly
──────────────────────────────────────────────────────────────────────────*/
const POPULAR_CATEGORIES = [
  {
    slug: "Electronics",
    en: "Electronics",
    ar: "الإلكترونيات",
    Icon: Cpu,
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=75&auto=format&fit=crop",
  },
  {
    slug: "Fashion",
    en: "Fashion",
    ar: "الأزياء",
    Icon: Shirt,
    img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&q=75&auto=format&fit=crop",
  },
  {
    slug: "Home & Kitchen",
    en: "Home",
    ar: "المنزل",
    Icon: HomeIcon,
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=75&auto=format&fit=crop",
  },
  {
    slug: "Beauty & Personal Care",
    en: "Beauty",
    ar: "الجمال",
    Icon: Sparkles,
    img: "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
  {
    slug: "Sports & Fitness",
    en: "Sports",
    ar: "الرياضة",
    Icon: Dumbbell,
    img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=75&auto=format&fit=crop",
  },
  {
    slug: "Gaming & Entertainment",
    en: "Gaming",
    ar: "الألعاب",
    Icon: Gamepad2,
    img: "https://images.pexels.com/photos/4317157/pexels-photo-4317157.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
  {
    slug: "Supermarket & Grocery",
    en: "Food",
    ar: "الطعام",
    Icon: UtensilsCrossed,
    img: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300&q=75&auto=format&fit=crop",
  },
  {
    slug: "Automotive",
    en: "Automotive",
    ar: "السيارات",
    Icon: Car,
    img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=300&q=75&auto=format&fit=crop",
  },
] as const;

/* ─────────────────────────────────────────────────────────────────────────
   1. POPULAR CATEGORIES SECTION
   Reference: wide rectangular cards (~130×115px), image fills card,
   NO icon badge overlay, category label BELOW the card.
──────────────────────────────────────────────────────────────────────────*/
function PopularCategoriesSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div id="categories" className="border-b bg-background">
      <div className="container px-4 py-5 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] sm:text-sm font-bold text-foreground">
            {t("home.popular_categories_title")}
          </h2>
          <Link
            href="/products"
            className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            {t("home.view_all")}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>

        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide pb-0.5">
          {POPULAR_CATEGORIES.map(({ slug, en, ar, img }) => (
            <Link
              key={slug}
              href={`/products?category=${encodeURIComponent(slug)}`}
              className="shrink-0"
            >
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                {/* Image tile — reference: ~130×115px, image fills, rounded ~12px */}
                <div className="relative w-[120px] sm:w-[135px] h-[105px] sm:h-[115px] rounded-xl overflow-hidden border border-border/30 group-hover:border-primary/40 transition-all duration-200">
                  <img
                    src={img}
                    alt={lang === "ar" ? ar : en}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                  />
                  {/* Subtle dark overlay for contrast */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors" />
                </div>
                {/* Label below tile — reference: white, ~12px, centered */}
                <span className="text-[12px] font-medium text-foreground/85 group-hover:text-primary transition-colors text-center leading-tight w-[120px] sm:w-[135px] truncate px-1">
                  {lang === "ar" ? ar : en}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COUNTDOWN — reference style: dark card bg + border, NOT colored blocks
──────────────────────────────────────────────────────────────────────────*/
function CountdownDisplay({ formatted }: { formatted: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [h = "00", m = "00", s = "00"] = formatted.split(":");
  const segments = [
    { v: h, label: lang === "ar" ? "ساعة" : "hrs" },
    { v: m, label: lang === "ar" ? "دقيقة" : "min" },
    { v: s, label: lang === "ar" ? "ثانية" : "sec" },
  ];
  return (
    <div className="inline-flex items-center gap-1" dir="ltr">
      {segments.map(({ v, label }, i) => (
        <React.Fragment key={label}>
          {i > 0 && (
            <span className="text-foreground/50 font-bold text-sm leading-none pb-2.5">:</span>
          )}
          <div className="flex flex-col items-center bg-card border border-border rounded-lg px-2 sm:px-2.5 py-1 min-w-[34px] sm:min-w-[38px] tabular-nums">
            <span className="text-[13px] sm:text-sm font-black text-foreground leading-none">{v}</span>
            <span className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5">{label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   2. HOT DEALS SECTION
   Reference: lightning + "عروض خلال:" + countdown RIGHT | "عرض الكل" LEFT
   Products: horizontal scroll, ~165px-wide cards
──────────────────────────────────────────────────────────────────────────*/
function HotDealsSection({
  hotDeals,
  isLoading,
  getTarget,
}: {
  hotDeals: import("@workspace/api-client-react").Product[];
  isLoading: boolean;
  getTarget: () => Date;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { formatted } = useCountdown(getTarget);

  return (
    <section className="py-5 sm:py-6 border-b bg-background">
      <div className="container px-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-[13px] sm:text-sm font-bold text-foreground">
                {lang === "ar" ? "عروض خلال:" : "Deals end in:"}
              </span>
            </div>
            <CountdownDisplay formatted={formatted} />
          </div>
          <Link
            href="/products?hasDiscount=true"
            className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1 shrink-0"
          >
            {t("home.view_all_deals")}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>

        {/* Horizontal scroll product row */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-0.5">
          {isLoading
            ? Array(5).fill(0).map((_, i) => (
                <div key={i} className="shrink-0 w-[155px] sm:w-[165px]">
                  <ProductSkeleton />
                </div>
              ))
            : hotDeals.map((p) => (
                <div key={p.id} className="shrink-0 w-[155px] sm:w-[165px]">
                  <ProductCard product={p} flashSaleEndsIn={formatted} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SKELETONS
──────────────────────────────────────────────────────────────────────────*/
function ProductSkeleton() {
  return (
    <div className="flex flex-col space-y-2.5 animate-pulse h-full">
      <div className="aspect-square bg-muted rounded-xl" />
      <div className="h-2.5 bg-muted rounded w-4/5" />
      <div className="h-2.5 bg-muted rounded w-1/2" />
      <div className="h-2.5 bg-muted rounded w-2/5" />
    </div>
  );
}

function StoreSkeleton() {
  return (
    <div className="shrink-0 w-[118px] sm:w-[128px] rounded-xl border border-border/50 bg-card overflow-hidden animate-pulse">
      <div className="h-[78px] bg-muted" />
      <div className="p-2 space-y-1.5">
        <div className="h-2.5 bg-muted rounded w-3/4" />
        <div className="h-2 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FEATURED STORE TYPE
──────────────────────────────────────────────────────────────────────────*/
interface FeaturedStore {
  sellerId: number;
  storeName: string;
  storeSlug: string | null;
  storeLogo: string | null;
  storeBanner: string | null;
  accentColor: string | null;
  categories: string[];
  city: string | null;
  isVerified: boolean;
  productsCount: number;
  followersCount: number;
  averageRating: number;
  reviewsCount: number;
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPACT STORE CARD — reference: ~128px wide, image fills top, text below
──────────────────────────────────────────────────────────────────────────*/
function StoreCardCompact({ s }: { s: FeaturedStore }) {
  const accent = s.accentColor ?? "#059669";
  const coverBg = `linear-gradient(135deg, ${accent}66 0%, ${accent}dd 100%)`;

  return (
    <Link href={s.storeSlug ? `/store/${s.storeSlug}` : "/products"} className="shrink-0">
      <div className="w-[118px] sm:w-[128px] rounded-xl border border-border/40 bg-card overflow-hidden hover:border-primary/45 hover:shadow-md transition-all duration-200 group cursor-pointer">
        {/* Cover */}
        <div className="relative h-[78px] sm:h-[84px] overflow-hidden">
          {s.storeBanner ? (
            <img
              src={s.storeBanner}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-400"
            />
          ) : (
            <div className="h-full w-full" style={{ background: coverBg }} />
          )}
          <div className="absolute inset-0 bg-black/20" />
          {/* Logo overlay bottom-start */}
          <div className="absolute bottom-1.5 start-1.5">
            {s.storeLogo ? (
              <img
                src={s.storeLogo}
                alt={s.storeName}
                className="h-7 w-7 rounded-md object-cover border border-background shadow-sm"
              />
            ) : (
              <div
                className="h-7 w-7 rounded-md border border-background shadow-sm flex items-center justify-center text-white font-black text-[11px]"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
              >
                {s.storeName.charAt(0)}
              </div>
            )}
          </div>
          {s.isVerified && (
            <div className="absolute top-1 end-1">
              <BadgeCheck className="h-3.5 w-3.5 text-primary drop-shadow" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-2 py-1.5 space-y-0.5">
          <p className="text-[12px] font-semibold text-foreground truncate group-hover:text-primary transition-colors leading-snug">
            {s.storeName}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {s.averageRating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-foreground tabular-nums">
                  {s.averageRating.toFixed(1)}
                </span>
              </span>
            )}
            {s.followersCount > 0 && (
              <span className="text-muted-foreground">{fmt(s.followersCount)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   3. COMBINED SECTION — Stores (LEFT ~53%) + New Products (RIGHT ~47%)
   Reference: two columns side by side with vertical divider, single section
──────────────────────────────────────────────────────────────────────────*/
function CombinedSection({
  newArrivals,
  isLoadingProducts,
}: {
  newArrivals: import("@workspace/api-client-react").Product[];
  isLoadingProducts: boolean;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";

  const [stores, setStores] = React.useState<FeaturedStore[]>([]);
  const [loadingStores, setLoadingStores] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/sellers/featured`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: FeaturedStore[]) => setStores(Array.isArray(d) ? d.slice(0, 8) : []))
      .catch(() => {})
      .finally(() => setLoadingStores(false));
  }, []);

  const scrollStores = (dir: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = 280;
    el.scrollBy({ left: dir === "next" ? (isRTL ? -step : step) : (isRTL ? step : -step), behavior: "smooth" });
  };

  const showStores = loadingStores || stores.length > 0;
  const showNewProducts = isLoadingProducts || newArrivals.length > 0;

  if (!showStores && !showNewProducts) return null;

  return (
    <section className="py-5 sm:py-6 border-b bg-background">
      <div className="container px-4">
        <div className="flex gap-4 md:gap-6">

          {/* ── LEFT: Verified Stores ──────────────────────────────── */}
          {showStores && (
            <div className="flex-1 min-w-0 md:max-w-[54%]">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <h2 className="text-[13px] sm:text-sm font-bold text-foreground">
                    {t("home.verified_stores_title")}
                  </h2>
                </div>
                <Link
                  href="/products"
                  className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  {t("home.view_all")}
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </Link>
              </div>

              {/* Scroll row with arrows */}
              <div className="relative">
                {/* Prev arrow */}
                <button
                  onClick={() => scrollStores("prev")}
                  aria-label="Scroll stores back"
                  className="absolute start-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 h-7 w-7 rounded-full bg-card border border-border/60 shadow flex items-center justify-center hover:border-primary/50 transition-colors"
                >
                  {isRTL ? (
                    <ChevronRight className="h-3.5 w-3.5 text-foreground" />
                  ) : (
                    <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
                  )}
                </button>

                <div
                  ref={scrollRef}
                  className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-0.5 px-1"
                >
                  {loadingStores
                    ? Array(4).fill(0).map((_, i) => <StoreSkeleton key={i} />)
                    : stores.map((s) => <StoreCardCompact key={s.sellerId} s={s} />)}
                </div>

                {/* Next arrow */}
                <button
                  onClick={() => scrollStores("next")}
                  aria-label="Scroll stores forward"
                  className="absolute end-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 h-7 w-7 rounded-full bg-card border border-border/60 shadow flex items-center justify-center hover:border-primary/50 transition-colors"
                >
                  {isRTL ? (
                    <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-foreground" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Vertical divider ─────────────────────────────────── */}
          {showStores && showNewProducts && (
            <div className="hidden md:block w-px bg-border/50 self-stretch shrink-0" />
          )}

          {/* ── RIGHT: New Products 2×2 ───────────────────────────── */}
          {showNewProducts && (
            <div className="hidden md:block md:w-[44%] lg:w-[43%] shrink-0">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full">
                    {lang === "ar" ? "جديد" : "New"}
                  </span>
                </div>
                <Link
                  href="/products"
                  className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  {t("home.view_all")}
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {isLoadingProducts
                  ? Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)
                  : newArrivals.slice(0, 4).map((p) => (
                      <div key={p.id} className="relative">
                        {/* "جديد" badge overlay */}
                        <div className="absolute top-2 start-2 z-10">
                          <span className="text-[10px] font-bold text-primary-foreground bg-primary px-1.5 py-0.5 rounded-md shadow-sm">
                            {lang === "ar" ? "جديد" : "New"}
                          </span>
                        </div>
                        <ProductCard product={p} />
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile: show new arrivals below stores as separate row */}
        {showNewProducts && (
          <div className="mt-4 md:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full">
                  {lang === "ar" ? "جديد" : "New"}
                </span>
              </div>
              <Link
                href="/products"
                className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                {t("home.view_all")}
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {isLoadingProducts
                ? Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)
                : newArrivals.slice(0, 4).map((p) => (
                    <div key={p.id} className="relative">
                      <div className="absolute top-2 start-2 z-10">
                        <span className="text-[10px] font-bold text-primary-foreground bg-primary px-1.5 py-0.5 rounded-md">
                          {lang === "ar" ? "جديد" : "New"}
                        </span>
                      </div>
                      <ProductCard product={p} />
                    </div>
                  ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   4. RECENTLY VIEWED
──────────────────────────────────────────────────────────────────────────*/
function RecentlyViewedSection({
  items,
  onClear,
}: {
  items: import("@/hooks/useRecentlyViewed").RecentlyViewedProduct[];
  onClear: () => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="py-5 sm:py-6 border-b bg-background">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-[13px] sm:text-sm font-bold text-foreground">
              {t("home.recently_viewed_title")}
            </h2>
          </div>
          <button
            onClick={onClear}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("home.recently_viewed_clear")}
          </button>
        </div>
        <div className="product-grid">
          {items.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   5. JOIN SYANO SECTION
   Reference: compact dark section, green truck image LEFT, text+2 CTAs RIGHT
   NO trust strip.
──────────────────────────────────────────────────────────────────────────*/
function JoinSyanoSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";
  const { handleOpenYourStore } = useSellerOnboarding();
  const { handleBecomeCourier } = useCourierOnboarding();

  return (
    <section className="bg-[#040c14] border-t border-white/5">
      <div className="container px-4 py-10 md:py-14">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">

          {/* ── LEFT / END: Green truck image ─── */}
          <div
            className={cn(
              "w-full md:w-[46%] shrink-0 relative rounded-2xl overflow-hidden",
              "h-[200px] sm:h-[240px] md:h-[220px]",
              isRTL ? "order-2 md:order-1" : "order-2 md:order-1",
            )}
          >
            {/* Van photo */}
            <img
              src="https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "brightness(0.55) saturate(0.7)" }}
            />
            {/* Green tint overlay */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(5,150,105,0.65) 0%, rgba(16,185,129,0.35) 50%, rgba(0,0,0,0.1) 100%)",
              }}
            />
            {/* Dark bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent rounded-b-2xl" />

            {/* Syano branding on image */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2.5 bg-black/30 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-sm font-black" style={{ color: "black" }}>S</span>
                </div>
                <div>
                  <p className="text-base font-black text-white leading-none">Syano</p>
                  <p className="text-[10px] text-white/60 mt-0.5">سوق سوريا</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm rounded-xl px-4 py-2 border border-primary/20">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-white">
                  {lang === "ar" ? "توصيل سريع لحلب" : "Fast Delivery in Aleppo"}
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT / START: Text + CTAs ─── */}
          <div
            className={cn(
              "flex-1 space-y-4",
              isRTL ? "order-1 md:order-2 text-right" : "order-1 md:order-2 text-left",
            )}
          >
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl lg:text-[1.7rem] font-black text-white leading-tight">
                {lang === "ar" ? "انضم إلى منظومة سيانو" : "Join the Syano Ecosystem"}
              </h2>
              <p className="text-sm text-white/55 leading-relaxed max-w-sm">
                {lang === "ar"
                  ? "ابدأ البيع أو كن مندوب توصيل وحقق المزيد من الأرباح"
                  : "Start selling or become a courier and grow your income"}
              </p>
            </div>

            {/* Buttons — reference: two CTAs side by side */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="h-11 px-7 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200 flex-1 sm:flex-none sm:min-w-[160px]"
                onClick={handleOpenYourStore}
              >
                <Store className="h-4 w-4 me-2 shrink-0" />
                {t("home.sell_cta_btn")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-7 text-sm font-semibold rounded-xl border-white/20 text-white hover:bg-white/8 hover:border-white/35 bg-transparent transition-all duration-200 flex-1 sm:flex-none sm:min-w-[160px]"
                onClick={handleBecomeCourier}
              >
                <Truck className="h-4 w-4 me-2 shrink-0" />
                {t("home.courier_cta_btn")}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE EXPORT
──────────────────────────────────────────────────────────────────────────*/
export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { data: products, isLoading: isLoadingProducts } = useListProducts(
    {},
    {
      query: {
        staleTime: 3 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: getListProductsQueryKey({}),
      },
    },
  );

  useSEO({
    title:
      lang === "ar"
        ? "سيانو — أول سوق إلكتروني في سوريا"
        : "Syano — Syria's First Online Marketplace",
    description:
      lang === "ar"
        ? "تسوّق من بائعين موثوقين عبر حلب وسوريا. إلكترونيات، أزياء، أدوات منزلية، توصيل سريع، دفع آمن."
        : "Shop electronics, fashion, beauty, home goods and more from vetted Syrian sellers.",
    canonical: "/",
  });

  const { data: publicSettings } = useGetPublicSettings({
    query: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      queryKey: getGetPublicSettingsQueryKey(),
    },
  });

  const getFlashSaleTarget = React.useCallback(() => {
    if (publicSettings?.flashSaleEnd) return new Date(publicSettings.flashSaleEnd);
    const ms = 24 * 60 * 60 * 1000;
    return new Date(Math.ceil(Date.now() / ms) * ms);
  }, [publicSettings?.flashSaleEnd]);

  const newArrivals = products?.slice(0, 8) ?? [];
  const hotDeals = products?.filter((p) => p.isBestDeal).slice(0, 6) ?? [];

  const { recentlyViewed, clearHistory } = useRecentlyViewed();

  return (
    <Layout>
      <div className="w-full">

        {/* 1. HERO ─────────────────────────────────────────────── */}
        <HeroV4 />

        {/* 2. POPULAR CATEGORIES ──────────────────────────────── */}
        <PopularCategoriesSection />

        {/* 3. HOT DEALS ───────────────────────────────────────── */}
        {(isLoadingProducts || hotDeals.length > 0) && (
          <HotDealsSection
            hotDeals={hotDeals}
            isLoading={isLoadingProducts}
            getTarget={getFlashSaleTarget}
          />
        )}

        {/* 4. COMBINED: STORES (left) + NEW ARRIVALS (right) ─── */}
        <CombinedSection
          newArrivals={newArrivals}
          isLoadingProducts={isLoadingProducts}
        />

        {/* 5. RECENTLY VIEWED ─────────────────────────────────── */}
        {recentlyViewed.length > 0 && (
          <RecentlyViewedSection items={recentlyViewed} onClear={clearHistory} />
        )}

        {/* 6. JOIN SYANO ──────────────────────────────────────── */}
        <JoinSyanoSection />

      </div>
    </Layout>
  );
}
