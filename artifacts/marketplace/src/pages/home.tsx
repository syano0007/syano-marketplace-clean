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
  BookOpen,
  PawPrint,
  Download,
  Palette,
  Gem,
  Baby,
  Wrench,
  TreePine,
  Gift,
  BadgeCheck,
  Star,
} from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { ProductCard } from "@/components/ProductCard";
import { useTranslation } from "react-i18next";
import { CATEGORIES } from "@/lib/categories";
import { useSEO } from "@/hooks/useSEO";
import { useSellerOnboarding } from "@/hooks/useSellerOnboarding";
import { useCourierOnboarding } from "@/hooks/useCourierOnboarding";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { HeroV4 } from "@/components/HeroV4";

/* ── Icon map (keyed by icon name string in category data) ───── */
const ICON_MAP: Record<string, React.ElementType> = {
  Cpu,
  Shirt,
  Sparkles,
  Home: HomeIcon,
  ShoppingBasket,
  Dumbbell,
  Car,
  Gamepad2,
  BookOpen,
  PawPrint,
  Download,
  Palette,
  Gem,
  Baby,
  Wrench,
  TreePine,
  Gift,
};

/* ── Category photo map — verified Unsplash & Pexels URLs ───── */
const CATEGORY_IMAGES: Record<string, string> = {
  Electronics:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80&auto=format&fit=crop",
  Fashion:
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80&auto=format&fit=crop",
  "Beauty & Personal Care":
    "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
  "Home & Kitchen":
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80&auto=format&fit=crop",
  "Supermarket & Grocery":
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&q=80&auto=format&fit=crop",
  "Sports & Fitness":
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80&auto=format&fit=crop",
  Automotive:
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80&auto=format&fit=crop",
  "Gaming & Entertainment":
    "https://images.pexels.com/photos/4317157/pexels-photo-4317157.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
  "Books & Stationery":
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&q=80&auto=format&fit=crop",
  "Pet Supplies":
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80&auto=format&fit=crop",
  "Digital Products":
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80&auto=format&fit=crop",
  "Handmade & Crafts":
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80&auto=format&fit=crop",
  "Jewelry & Luxury":
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80&auto=format&fit=crop",
  "Baby & Kids":
    "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80&auto=format&fit=crop",
  "Tools & Construction":
    "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80&auto=format&fit=crop",
  "Garden & Outdoor":
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80&auto=format&fit=crop",
  "Gifts & Events":
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80&auto=format&fit=crop",
};

/* ── Popular category cards (matching reference design) ─────────── */

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

function PopularCategoriesSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div className="border-b bg-background">
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
                        if (parent) {
                          parent.classList.add(iconBg);
                          const icon = document.createElement("div");
                          icon.className = "absolute inset-0 flex items-center justify-center";
                          parent.appendChild(icon);
                        }
                      }}
                    />
                  ) : (
                    <div className={`absolute inset-0 ${iconBg} flex items-center justify-center`}>
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

/* ── Hot Deals section (isolated — owns countdown tick) ─────────── */

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
    <section className="py-12 md:py-16 border-b bg-gradient-to-br from-rose-950/25 via-background to-background cv-section">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                <Flame className="h-4 w-4 text-rose-500" />
              </div>
              <h2 className="heading-section">{t("home.deals_title")}</h2>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 bg-rose-500/15 text-rose-400 text-xs font-bold px-2.5 py-1 rounded-full">
              <Zap className="h-3 w-3" />
              {t("home.deals_badge")}
            </span>
            <FlashSaleTimerBadge formatted={flashSaleFormatted} />
          </div>
          <Link
            href="/products?hasDiscount=true"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
          >
            {t("home.view_all_deals")}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
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
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6 md:mb-8">
      <h2 className="heading-section">{title}</h2>
      <Link
        href={viewAllHref}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
      >
        {viewAllLabel}
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
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

/* ── Verified Stores section ─────────────────────────────────────── */

interface FeaturedStore {
  sellerId: number;
  storeName: string;
  storeSlug: string | null;
  storeLogo: string | null;
  accentColor: string | null;
  categories: string[];
  city: string | null;
  isVerified: boolean;
  productsCount: number;
  followersCount: number;
  averageRating: number;
  reviewsCount: number;
}

function StoreInitialAvatar({
  name,
  color,
}: {
  name: string;
  color: string | null;
}) {
  const bg = color ?? "#059669";
  const letter = (name ?? "?").charAt(0);
  return (
    <div
      className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0"
      style={{ background: `linear-gradient(135deg, ${bg}, ${bg}cc)` }}
    >
      {letter}
    </div>
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
      .then((d: FeaturedStore[]) => setStores(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && stores.length === 0) return null;

  return (
    <section className="py-10 md:py-14 border-b bg-background cv-section">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-5 md:mb-7">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BadgeCheck className="h-4 w-4 text-primary" />
            </div>
            <h2 className="heading-section">{t("home.verified_stores_title")}</h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
          >
            {t("home.view_all")}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border bg-card animate-pulse">
                <div className="h-12 w-12 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stores.map((s) => (
              <Link
                key={s.sellerId}
                href={s.storeSlug ? `/store/${s.storeSlug}` : "/products"}
              >
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 group cursor-pointer">
                  <StoreInitialAvatar name={s.storeName} color={s.accentColor} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {s.storeName}
                      </span>
                      {s.isVerified && (
                        <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.productsCount > 0
                        ? lang === "ar"
                          ? `${s.productsCount} منتج`
                          : `${s.productsCount} products`
                        : lang === "ar"
                          ? "متجر موثوق"
                          : "Verified store"}
                      {s.city ? ` · ${s.city}` : ""}
                    </div>
                  </div>
                  {s.averageRating > 0 && (
                    <div className="text-end shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-foreground">
                          {s.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        ({s.reviewsCount})
                      </div>
                    </div>
                  )}
                  <div className="shrink-0">
                    <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {lang === "ar" ? "زيارة" : "Visit"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

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

  /* Derived product lists */
  const newArrivals = products?.slice(0, 4) ?? [];
  const hotDeals = products?.filter((p) => p.isBestDeal).slice(0, 4) ?? [];

  /* Best Sellers */
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

        {/* ════════════════════════════════════════════════════
            HERO V4 — split layout, max 460px, no full-screen
            Banner enhancement layer activates when banners exist
        ════════════════════════════════════════════════════ */}
        <HeroV4 />

        {/* ════════════════════════════════════════════════════
            POPULAR CATEGORIES — scrollable card row
        ════════════════════════════════════════════════════ */}
        <PopularCategoriesSection />

        {/* ════════════════════════════════════════════════════
            HOT DEALS — flash sale products
        ════════════════════════════════════════════════════ */}
        {(isLoadingProducts || hotDeals.length > 0) && (
          <HotDealsSection
            hotDeals={hotDeals}
            isLoadingProducts={isLoadingProducts}
            getFlashSaleTarget={getFlashSaleTarget}
          />
        )}

        {/* ════════════════════════════════════════════════════
            BEST SELLERS — ranked by real purchase volume
        ════════════════════════════════════════════════════ */}
        {(isLoadingBestSellers || bestSellers.length > 0) && (
          <section className="py-12 md:py-16 border-b bg-muted/15 cv-section">
            <div className="container px-4">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-3">
                  <h2 className="heading-section">
                    {t("home.bestsellers_title")}
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    {t("home.bestsellers_badge")}
                  </span>
                </div>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
                >
                  {t("home.view_all")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </div>
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

        {/* ════════════════════════════════════════════════════
            VERIFIED STORES — featured seller cards
        ════════════════════════════════════════════════════ */}
        <VerifiedStoresSection />

        {/* ════════════════════════════════════════════════════
            NEW ARRIVALS — most recently listed products
        ════════════════════════════════════════════════════ */}
        <section className="py-12 md:py-16 border-b cv-section">
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

        {/* ════════════════════════════════════════════════════
            RECENTLY VIEWED — personalised from localStorage
        ════════════════════════════════════════════════════ */}
        {recentlyViewed.length > 0 && (
          <section className="py-12 md:py-16 border-b cv-section">
            <div className="container px-4">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h2 className="heading-section">
                    {t("home.recently_viewed_title")}
                  </h2>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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

        {/* ════════════════════════════════════════════════════
            BOTTOM CTAs — seller + courier recruitment
            Side-by-side on sm+, stacked on xs
        ════════════════════════════════════════════════════ */}
        <section className="py-12 md:py-16 bg-primary/5 border-b">
          <div className="container px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Seller CTA */}
              <div className="flex flex-col justify-between gap-4 bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {t("home.sell_cta_title")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {t("home.sell_cta_desc")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-10 px-5 font-semibold w-full"
                  onClick={handleOpenYourStore}
                >
                  {t("home.sell_cta_btn")}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>

              {/* Courier CTA */}
              <div className="flex flex-col justify-between gap-4 bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {t("home.courier_cta_title")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {t("home.courier_cta_desc")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-10 px-5 font-semibold w-full"
                  onClick={handleBecomeCourier}
                >
                  {t("home.courier_cta_btn")}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
