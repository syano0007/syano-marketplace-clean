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
  Timer,
  Flame,
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
} from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { ProductCard } from "@/components/ProductCard";
import { useTranslation } from "react-i18next";
import { useSEO } from "@/hooks/useSEO";
import { useSellerOnboarding } from "@/hooks/useSellerOnboarding";
import { useCourierOnboarding } from "@/hooks/useCourierOnboarding";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { HeroV4 } from "@/components/HeroV4";

/* ── Popular category cards ──────────────────────────────────────── */

const POPULAR_CATEGORIES = [
  {
    slug: "Electronics",
    en: "Electronics",
    ar: "الإلكترونيات",
    Icon: Cpu,
    iconBg: "bg-blue-500",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80&auto=format&fit=crop",
  },
  {
    slug: "Fashion",
    en: "Fashion",
    ar: "الأزياء",
    Icon: Shirt,
    iconBg: "bg-pink-500",
    img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&q=80&auto=format&fit=crop",
  },
  {
    slug: "Home & Kitchen",
    en: "Home",
    ar: "المنزل",
    Icon: HomeIcon,
    iconBg: "bg-amber-500",
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=80&auto=format&fit=crop",
  },
  {
    slug: "Beauty & Personal Care",
    en: "Beauty",
    ar: "الجمال",
    Icon: Sparkles,
    iconBg: "bg-rose-500",
    img: "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    slug: "Sports & Fitness",
    en: "Sports",
    ar: "الرياضة",
    Icon: Dumbbell,
    iconBg: "bg-green-500",
    img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=80&auto=format&fit=crop",
  },
  {
    slug: "Gaming & Entertainment",
    en: "Gaming",
    ar: "الألعاب",
    Icon: Gamepad2,
    iconBg: "bg-violet-500",
    img: "https://images.pexels.com/photos/4317157/pexels-photo-4317157.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    slug: "Supermarket & Grocery",
    en: "Grocery",
    ar: "البقالة",
    Icon: ShoppingBasket,
    iconBg: "bg-emerald-500",
    img: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&q=80&auto=format&fit=crop",
  },
  {
    slug: "Automotive",
    en: "Automotive",
    ar: "السيارات",
    Icon: Car,
    iconBg: "bg-slate-500",
    img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&q=80&auto=format&fit=crop",
  },
] as const;

/* ── Popular categories row ─────────────────────────────────────── */

function PopularCategoriesSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div id="categories" className="border-b bg-background">
      <div className="container px-4 py-5 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">
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
              <div className="flex flex-col items-center gap-2 w-[72px] sm:w-20 group cursor-pointer">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-border/40 group-hover:border-primary/40 transition-colors shadow-sm">
                  {img ? (
                    <img
                      src={img}
                      alt={lang === "ar" ? ar : en}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors text-center leading-tight line-clamp-2">
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

/* ── Flash Sale countdown badge ─────────────────────────────────── */

function FlashSaleTimerBadge({ formatted }: { formatted: string }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-rose-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full tabular-nums">
      <Timer className="h-3 w-3 shrink-0" />
      <span className="opacity-80">{t("home.flash_sale_ends_in")}</span>
      <span dir="ltr">{formatted}</span>
    </span>
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
  const { t } = useTranslation();
  const { formatted: flashSaleFormatted } = useCountdown(getFlashSaleTarget);

  return (
    <section className="py-10 md:py-14 border-b bg-gradient-to-br from-rose-950/20 via-background to-background cv-section">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-5 md:mb-7">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0">
                <Flame className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <h2 className="heading-section">{t("home.deals_title")}</h2>
            </div>
            <FlashSaleTimerBadge formatted={flashSaleFormatted} />
          </div>
          <Link
            href="/products?hasDiscount=true"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
          >
            {t("home.view_all_deals")}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>
        <div className="product-grid">
          {isLoadingProducts
            ? Array(4)
                .fill(0)
                .map((_, i) => <ProductSkeleton key={i} />)
            : hotDeals.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  flashSaleEndsIn={flashSaleFormatted}
                />
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
    <div className="flex items-center justify-between mb-5 md:mb-7">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="heading-section">{title}</h2>
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

/* ── Trusted Stores section (premium cards) ─────────────────────── */

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

function StoreSkeleton() {
  return (
    <div className="w-[168px] sm:w-[185px] flex-shrink-0 rounded-2xl border border-border/50 bg-card overflow-hidden animate-pulse">
      <div className="h-[92px] bg-muted" />
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
      <div className="w-[168px] sm:w-[185px] rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200 group cursor-pointer">
        {/* Cover image */}
        <div className="relative h-[88px] overflow-hidden">
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
          {/* Subtle bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/25 to-transparent" />
        </div>

        {/* Logo overlapping cover */}
        <div className="px-3 -mt-4 relative z-10">
          {s.storeLogo ? (
            <img
              src={s.storeLogo}
              alt={s.storeName}
              className="h-9 w-9 rounded-xl object-cover border-2 border-background shadow-md"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="h-9 w-9 rounded-xl border-2 border-background shadow-md flex items-center justify-center text-white font-black text-sm"
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
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {s.averageRating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-foreground tabular-nums">
                  {s.averageRating.toFixed(1)}
                </span>
              </span>
            )}
            {s.productsCount > 0 && (
              <span className="text-muted-foreground/70">
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
        setStores(Array.isArray(d) ? d.slice(0, 6) : []),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && stores.length === 0) return null;

  return (
    <section className="py-10 md:py-14 border-b bg-background cv-section">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-5 md:mb-7">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="heading-section">
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

        {/* Horizontal scroll — all breakpoints */}
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

/* ── Trust strip (appears ONCE — in the join section) ───────────── */

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

        {/* ────────────────────────────────────────────────────
            1. HERO — cinematic full-width
        ──────────────────────────────────────────────────── */}
        <HeroV4 />

        {/* ────────────────────────────────────────────────────
            2. POPULAR CATEGORIES — horizontal chip scroll
        ──────────────────────────────────────────────────── */}
        <PopularCategoriesSection />

        {/* ────────────────────────────────────────────────────
            3. HOT DEALS — flash sale products
        ──────────────────────────────────────────────────── */}
        {(isLoadingProducts || hotDeals.length > 0) && (
          <HotDealsSection
            hotDeals={hotDeals}
            isLoadingProducts={isLoadingProducts}
            getFlashSaleTarget={getFlashSaleTarget}
          />
        )}

        {/* ────────────────────────────────────────────────────
            4. VERIFIED STORES — premium horizontal scroll
        ──────────────────────────────────────────────────── */}
        <VerifiedStoresSection />

        {/* ────────────────────────────────────────────────────
            5. BEST SELLERS — ranked by purchase volume
        ──────────────────────────────────────────────────── */}
        {(isLoadingBestSellers || bestSellers.length > 0) && (
          <section className="py-10 md:py-14 border-b bg-muted/10 cv-section">
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

        {/* ────────────────────────────────────────────────────
            6. NEW ARRIVALS — most recently listed
        ──────────────────────────────────────────────────── */}
        <section className="py-10 md:py-14 border-b cv-section">
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

        {/* ────────────────────────────────────────────────────
            7. RECENTLY VIEWED — personalised, localStorage
        ──────────────────────────────────────────────────── */}
        {recentlyViewed.length > 0 && (
          <section className="py-10 md:py-14 border-b cv-section">
            <div className="container px-4">
              <div className="flex items-center justify-between mb-5 md:mb-7">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="heading-section">
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

        {/* ────────────────────────────────────────────────────
            8. JOIN SYANO — seller + courier recruitment
               Trust strip appears HERE — the single place
               where marketplace promises are displayed.
        ──────────────────────────────────────────────────── */}
        <section className="py-12 md:py-16 bg-muted/10 border-b">
          <div className="container px-4 space-y-8">

            {/* Heading */}
            <div className="text-center space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold">
                {lang === "ar"
                  ? "انضم إلى منظومة سيانو"
                  : "Join the Syano Ecosystem"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === "ar"
                  ? "ابدأ البيع أو كن مندوب توصيل وحقق المزيد من الأرباح"
                  : "Start selling or become a courier and grow your income"}
              </p>
            </div>

            {/* CTA cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Seller */}
              <div className="flex flex-col justify-between gap-4 bg-card border rounded-2xl p-5 md:p-6 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{t("home.sell_cta_title")}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {t("home.sell_cta_desc")}
                    </p>
                  </div>
                </div>
                <Button
                  className="h-9 px-5 text-sm font-semibold w-full"
                  onClick={handleOpenYourStore}
                >
                  {t("home.sell_cta_btn")}
                  <ArrowRight className="ms-2 h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
              </div>

              {/* Courier */}
              <div className="flex flex-col justify-between gap-4 bg-card border rounded-2xl p-5 md:p-6 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">
                      {t("home.courier_cta_title")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {t("home.courier_cta_desc")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-9 px-5 text-sm font-semibold w-full"
                  onClick={handleBecomeCourier}
                >
                  {t("home.courier_cta_btn")}
                  <ArrowRight className="ms-2 h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
              </div>
            </div>

            {/* Trust strip — the ONE location for marketplace promises */}
            <div className="border-t pt-7">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {TRUST_ITEMS.map(({ Icon, ar, en, subAr, subEn }) => (
                  <div
                    key={en}
                    className="flex flex-col items-center text-center gap-2"
                  >
                    <div className="h-9 w-9 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {lang === "ar" ? ar : en}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
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
