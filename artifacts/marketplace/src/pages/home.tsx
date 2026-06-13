import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  useListProducts,
  useGetBestSellers,
  useGetPublicSettings,
  getListProductsQueryKey,
  getGetBestSellersQueryKey,
  getGetPublicSettingsQueryKey,
} from "@workspace/api-client-react";
import {
  ArrowRight,
  Truck,
  Zap,
  Store,
  TrendingUp,
  Clock,
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
  ShieldCheck,
  Flame,
} from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { ProductCard } from "@/components/ProductCard";
import { useTranslation } from "react-i18next";
import { useSEO } from "@/hooks/useSEO";
import { useSellerOnboarding } from "@/hooks/useSellerOnboarding";
import { useCourierOnboarding } from "@/hooks/useCourierOnboarding";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { HeroV4 } from "@/components/HeroV4";

/* ── Popular category data ───────────────────────────────────────── */

const POPULAR_CATEGORIES = [
  {
    slug: "Electronics",
    en: "Electronics",
    ar: "الإلكترونيات",
    Icon: Cpu,
    iconBg: "bg-blue-500",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80&auto=format&fit=crop",
  },
  {
    slug: "Fashion",
    en: "Fashion",
    ar: "الأزياء",
    Icon: Shirt,
    iconBg: "bg-pink-500",
    img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&q=80&auto=format&fit=crop",
  },
  {
    slug: "Home & Kitchen",
    en: "Home",
    ar: "المنزل",
    Icon: HomeIcon,
    iconBg: "bg-amber-500",
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80&auto=format&fit=crop",
  },
  {
    slug: "Beauty & Personal Care",
    en: "Beauty",
    ar: "الجمال",
    Icon: Sparkles,
    iconBg: "bg-rose-500",
    img: "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
  {
    slug: "Sports & Fitness",
    en: "Sports",
    ar: "الرياضة",
    Icon: Dumbbell,
    iconBg: "bg-green-500",
    img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=80&auto=format&fit=crop",
  },
  {
    slug: "Gaming & Entertainment",
    en: "Gaming",
    ar: "الألعاب",
    Icon: Gamepad2,
    iconBg: "bg-violet-500",
    img: "https://images.pexels.com/photos/4317157/pexels-photo-4317157.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
  {
    slug: "Supermarket & Grocery",
    en: "Grocery",
    ar: "البقالة",
    Icon: ShoppingBasket,
    iconBg: "bg-emerald-500",
    img: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300&q=80&auto=format&fit=crop",
  },
  {
    slug: "Automotive",
    en: "Automotive",
    ar: "السيارات",
    Icon: Car,
    iconBg: "bg-slate-500",
    img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=300&q=80&auto=format&fit=crop",
  },
] as const;

/* ── Popular categories section ─────────────────────────────────── */

function PopularCategoriesSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div id="categories" className="border-b bg-background">
      <div className="container px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-sm sm:text-[15px] font-bold text-foreground">
            {t("home.popular_categories_title")}
          </h2>
          <Link
            href="/products"
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            {t("home.view_all")}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {POPULAR_CATEGORIES.map(({ slug, en, ar, Icon, iconBg, img }) => (
            <Link
              key={slug}
              href={`/products?category=${encodeURIComponent(slug)}`}
              className="shrink-0"
            >
              <div className="flex flex-col items-center gap-2 w-[84px] sm:w-[96px] group cursor-pointer">
                {/* Card tile */}
                <div className="relative w-full h-[84px] sm:h-[96px] rounded-2xl overflow-hidden border border-border/40 group-hover:border-primary/50 transition-all duration-200 shadow-sm group-hover:shadow-md">
                  {img ? (
                    <img
                      src={img}
                      alt={lang === "ar" ? ar : en}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-400"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) parent.classList.add(iconBg);
                      }}
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 ${iconBg} flex items-center justify-center`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                  )}
                  {/* Dark gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {/* Icon bottom-center */}
                  <div className="absolute bottom-1.5 inset-x-0 flex justify-center">
                    <div className={`h-5 w-5 rounded-md ${iconBg} flex items-center justify-center shadow-sm`}>
                      <Icon className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                </div>
                {/* Label below */}
                <span className="text-[11px] sm:text-xs font-semibold text-foreground/80 group-hover:text-primary transition-colors text-center leading-tight line-clamp-2 w-full px-1">
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

/* ── Flash Sale segmented countdown ─────────────────────────────── */

function FlashSaleCountdown({ formatted }: { formatted: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const parts = formatted.split(":");
  const h = parts[0] ?? "00";
  const m = parts[1] ?? "00";
  const s = parts[2] ?? "00";

  const segments = [
    { value: h, label: lang === "ar" ? "ساعة" : "hrs" },
    { value: m, label: lang === "ar" ? "دقيقة" : "min" },
    { value: s, label: lang === "ar" ? "ثانية" : "sec" },
  ];

  return (
    <div className="inline-flex items-center gap-1 sm:gap-1.5" dir="ltr">
      {segments.map(({ value, label }, i) => (
        <React.Fragment key={label}>
          {i > 0 && (
            <span className="text-rose-400 font-black text-base leading-none mb-2">:</span>
          )}
          <div className="flex flex-col items-center bg-rose-600 text-white rounded-lg px-2 sm:px-2.5 py-1 min-w-[34px] sm:min-w-[40px] tabular-nums shadow-sm">
            <span className="text-sm sm:text-base font-black leading-none tracking-tight">{value}</span>
            <span className="text-[8px] sm:text-[9px] opacity-80 mt-0.5 font-medium">{label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Hot Deals section ──────────────────────────────────────────── */

const HotDealsSection = React.memo(function HotDealsSection({
  hotDeals,
  isLoadingProducts,
  getFlashSaleTarget,
}: {
  hotDeals: import("@workspace/api-client-react").Product[];
  isLoadingProducts: boolean;
  getFlashSaleTarget: () => Date;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { formatted: flashSaleFormatted } = useCountdown(getFlashSaleTarget);

  return (
    <section className="py-8 sm:py-10 md:py-12 border-b bg-gradient-to-br from-rose-950/15 via-background to-background">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-5 md:mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0">
                <Flame className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <h2 className="text-sm sm:text-[15px] font-bold text-foreground">
                {t("home.deals_title")}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {lang === "ar" ? "عروض خلال:" : "Ends in:"}
              </span>
              <FlashSaleCountdown formatted={flashSaleFormatted} />
            </div>
          </div>
          <Link
            href="/products?hasDiscount=true"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
          >
            {t("home.view_all_deals")}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>
        {/* Horizontal scroll on mobile / grid on desktop */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:gap-4">
          {isLoadingProducts
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="shrink-0 w-[180px] sm:w-auto">
                    <ProductSkeleton />
                  </div>
                ))
            : hotDeals.map((p) => (
                <div key={p.id} className="shrink-0 w-[180px] sm:w-auto">
                  <ProductCard
                    product={p}
                    flashSaleEndsIn={flashSaleFormatted}
                  />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
});

/* ── Section header ─────────────────────────────────────────────── */

function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel,
  icon,
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5 md:mb-6">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm sm:text-[15px] font-bold text-foreground">{title}</h2>
      </div>
      <Link
        href={viewAllHref}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
      >
        {viewAllLabel}
        <ArrowRight className="h-3 w-3 rtl:rotate-180" />
      </Link>
    </div>
  );
}

/* ── Product skeleton ────────────────────────────────────────────── */

function ProductSkeleton() {
  return (
    <div className="flex flex-col space-y-3 animate-pulse">
      <div className="aspect-square bg-muted rounded-xl" />
      <div className="h-3 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="h-3 bg-muted rounded w-1/3" />
    </div>
  );
}

/* ── Store card ──────────────────────────────────────────────────── */

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

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function StoreSkeleton() {
  return (
    <div className="w-[185px] sm:w-[200px] flex-shrink-0 rounded-2xl border border-border/50 bg-card overflow-hidden animate-pulse">
      <div className="h-[100px] bg-muted" />
      <div className="p-3 space-y-2.5">
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-2.5 bg-muted rounded w-1/2" />
        <div className="h-7 bg-muted rounded-lg mt-1" />
      </div>
    </div>
  );
}

function StoreCard({ s, lang }: { s: FeaturedStore; lang: string }) {
  const accent = s.accentColor ?? "#059669";
  const coverBg = `linear-gradient(135deg, ${accent}55 0%, ${accent}cc 100%)`;

  return (
    <Link
      href={s.storeSlug ? `/store/${s.storeSlug}` : "/products"}
      className="shrink-0"
    >
      <div className="w-[185px] sm:w-[200px] rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-200 group cursor-pointer">
        {/* Cover image */}
        <div className="relative h-[100px] overflow-hidden">
          {s.storeBanner ? (
            <img
              src={s.storeBanner}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-full w-full" style={{ background: coverBg }} />
          )}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Logo overlapping cover */}
        <div className="px-3 -mt-5 relative z-10">
          {s.storeLogo ? (
            <img
              src={s.storeLogo}
              alt={s.storeName}
              className="h-10 w-10 rounded-xl object-cover border-2 border-background shadow-md"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="h-10 w-10 rounded-xl border-2 border-background shadow-md flex items-center justify-center text-white font-black text-sm"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
            >
              {s.storeName.charAt(0)}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-3 pt-1.5 pb-3 space-y-1.5">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-bold text-foreground truncate group-hover:text-primary transition-colors flex-1 min-w-0">
              {s.storeName}
            </span>
            {s.isVerified && (
              <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
            {s.averageRating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-foreground tabular-nums">
                  {s.averageRating.toFixed(1)}
                </span>
              </span>
            )}
            {s.followersCount > 0 && (
              <span className="flex items-center gap-0.5">
                <span>{formatFollowers(s.followersCount)}</span>
              </span>
            )}
            {s.productsCount > 0 && (
              <span className="text-muted-foreground/65">
                {lang === "ar" ? `${s.productsCount} منتج` : `${s.productsCount} items`}
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="pt-0.5">
            <span className="block text-center text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
              {lang === "ar" ? "زيارة المتجر" : "Visit Store"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function VerifiedStoresSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [stores, setStores] = React.useState<FeaturedStore[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/sellers/featured`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: FeaturedStore[]) =>
        setStores(Array.isArray(d) ? d.slice(0, 8) : []),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && stores.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 md:py-12 border-b bg-background">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-5 md:mb-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-sm sm:text-[15px] font-bold text-foreground">
              {t("home.verified_stores_title")}
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
          >
            {t("home.view_all")}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => <StoreSkeleton key={i} />)
            : stores.map((s) => (
                <StoreCard key={s.sellerId} s={s} lang={lang} />
              ))}
        </div>
      </div>
    </section>
  );
}

/* ── Trust items ─────────────────────────────────────────────────── */

const TRUST_ITEMS = [
  {
    Icon: Truck,
    ar: "توصيل سريع",
    en: "Fast Delivery",
    subAr: "لجميع أحياء حلب",
    subEn: "All areas in Aleppo",
  },
  {
    Icon: ShieldCheck,
    ar: "دفع آمن",
    en: "Secure Payment",
    subAr: "مدفوعات محمية",
    subEn: "Protected payments",
  },
  {
    Icon: BadgeCheck,
    ar: "بائعون موثوقون",
    en: "Verified Sellers",
    subAr: "جميع البائعين معتمدون",
    subEn: "All sellers vetted",
  },
  {
    Icon: Zap,
    ar: "دعم سريع",
    en: "Quick Support",
    subAr: "نحن دائماً هنا",
    subEn: "Always here for you",
  },
] as const;

/* ── Main page ───────────────────────────────────────────────────── */

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { handleOpenYourStore } = useSellerOnboarding();
  const { handleBecomeCourier } = useCourierOnboarding();

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
        : "Shop electronics, fashion, home goods & more",
    description:
      lang === "ar"
        ? "تسوّق من بائعين موثوقين عبر حلب وسوريا. إلكترونيات، أزياء، أدوات منزلية، توصيل سريع، دفع آمن."
        : "Syria's trusted online marketplace. Shop electronics, fashion, beauty, home goods and more from vetted Syrian sellers. Fast delivery, secure payments.",
    canonical: "/",
  });

  const newArrivals = products?.slice(0, 4) ?? [];
  const hotDeals = products?.filter((p) => p.isBestDeal).slice(0, 4) ?? [];

  const { data: bestSellersData, isLoading: isLoadingBestSellers } =
    useGetBestSellers(4, {
      query: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: getGetBestSellersQueryKey(4),
      },
    });
  const bestSellers = bestSellersData ?? [];

  const { recentlyViewed, clearHistory } = useRecentlyViewed();

  const { data: publicSettings } = useGetPublicSettings({
    query: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      queryKey: getGetPublicSettingsQueryKey(),
    },
  });

  const getFlashSaleTarget = React.useCallback(() => {
    if (publicSettings?.flashSaleEnd)
      return new Date(publicSettings.flashSaleEnd);
    const ms = 24 * 60 * 60 * 1000;
    return new Date(Math.ceil(Date.now() / ms) * ms);
  }, [publicSettings?.flashSaleEnd]);

  return (
    <Layout>
      <div className="w-full">

        {/* ── 1. HERO ──────────────────────────────────────────── */}
        <HeroV4 />

        {/* ── 2. POPULAR CATEGORIES ────────────────────────────── */}
        <PopularCategoriesSection />

        {/* ── 3. HOT DEALS ─────────────────────────────────────── */}
        {(isLoadingProducts || hotDeals.length > 0) && (
          <HotDealsSection
            hotDeals={hotDeals}
            isLoadingProducts={isLoadingProducts}
            getFlashSaleTarget={getFlashSaleTarget}
          />
        )}

        {/* ── 4. VERIFIED STORES ───────────────────────────────── */}
        <VerifiedStoresSection />

        {/* ── 5. BEST SELLERS ──────────────────────────────────── */}
        {(isLoadingBestSellers || bestSellers.length > 0) && (
          <section className="py-8 sm:py-10 md:py-12 border-b bg-muted/10">
            <div className="container px-4">
              <SectionHeader
                title={t("home.bestsellers_title")}
                viewAllHref="/products"
                viewAllLabel={t("home.view_all")}
                icon={
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                }
              />
              <div className="product-grid">
                {isLoadingBestSellers
                  ? Array(4)
                      .fill(0)
                      .map((_, i) => <ProductSkeleton key={i} />)
                  : bestSellers.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 6. NEW ARRIVALS ──────────────────────────────────── */}
        <section className="py-8 sm:py-10 md:py-12 border-b">
          <div className="container px-4">
            <SectionHeader
              title={t("home.arrivals_title")}
              viewAllHref="/products"
              viewAllLabel={t("home.view_all")}
            />
            <div className="product-grid">
              {isLoadingProducts
                ? Array(4)
                    .fill(0)
                    .map((_, i) => <ProductSkeleton key={i} />)
                : newArrivals.length === 0
                  ? (
                    <p className="col-span-full text-center text-muted-foreground py-10">
                      {t("home.no_products")}
                    </p>
                  )
                  : newArrivals.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
            </div>
          </div>
        </section>

        {/* ── 7. RECENTLY VIEWED ───────────────────────────────── */}
        {recentlyViewed.length > 0 && (
          <section className="py-8 sm:py-10 md:py-12 border-b">
            <div className="container px-4">
              <div className="flex items-center justify-between mb-5 md:mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm sm:text-[15px] font-bold text-foreground">
                    {t("home.recently_viewed_title")}
                  </h2>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("home.recently_viewed_clear")}
                </button>
              </div>
              <div className="product-grid">
                {recentlyViewed.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 8. JOIN SYANO — dark premium section ─────────────── */}
        <section className="relative overflow-hidden bg-[#0a1628] text-white">
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Green glow accent */}
          <div className="absolute -top-32 -start-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -end-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative container px-4 py-14 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

              {/* Left col: delivery truck visual */}
              <div className="relative order-2 md:order-1 rounded-2xl overflow-hidden aspect-[4/3] md:aspect-auto md:h-64 lg:h-72">
                <img
                  src="https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/70 via-transparent to-transparent rounded-2xl" />
                {/* Syano brand tag */}
                <div className="absolute bottom-4 start-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
                  <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
                    <span className="text-[10px] font-black text-white">S</span>
                  </div>
                  <span className="text-xs font-bold text-white">Syano</span>
                </div>
              </div>

              {/* Right col: text + CTAs */}
              <div className="order-1 md:order-2 space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 text-primary px-3 py-1 rounded-full text-[11px] font-semibold">
                    <Zap className="h-3 w-3" />
                    {lang === "ar" ? "انضم إلى المنظومة" : "Join the Ecosystem"}
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-black leading-tight">
                    {lang === "ar"
                      ? "انضم إلى منظومة سيانو"
                      : "Join the Syano Ecosystem"}
                  </h2>
                  <p className="text-sm sm:text-[15px] text-white/60 leading-relaxed">
                    {lang === "ar"
                      ? "ابدأ البيع أو كن مندوب توصيل وحقق المزيد من الأرباح"
                      : "Start selling or become a courier and grow your income"}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="h-11 px-7 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200"
                    onClick={handleOpenYourStore}
                  >
                    <Store className="h-4 w-4 me-2" />
                    {t("home.sell_cta_btn")}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 px-7 text-sm font-semibold rounded-xl border-white/20 text-white hover:bg-white/10 hover:border-white/35 bg-transparent transition-all duration-200"
                    onClick={handleBecomeCourier}
                  >
                    <Truck className="h-4 w-4 me-2" />
                    {t("home.courier_cta_btn")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Trust strip */}
            <div className="mt-12 pt-10 border-t border-white/10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-8">
                {TRUST_ITEMS.map(({ Icon, ar, en, subAr, subEn }) => (
                  <div
                    key={en}
                    className="flex flex-col items-center text-center gap-2.5"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                      <Icon className="h-4.5 w-4.5 text-primary" style={{ height: "1.125rem", width: "1.125rem" }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {lang === "ar" ? ar : en}
                      </p>
                      <p className="text-[11px] text-white/45 mt-0.5">
                        {lang === "ar" ? subAr : subEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
