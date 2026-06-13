// @refresh reset
/**
 * HeroV4 — Full-width cinematic hero (Homepage V4 refined)
 *
 * Desktop / Mobile layout:
 *   Single full-width column — no split mosaic
 *   Height: 380px mobile → 500px tablet → 560px desktop
 *
 * Banner enhancement layer:
 *   - 0 banners  → BrandStatement (premium dark cinematic background)
 *   - Banners exist → BannerCarousel (full-width, same dimensions)
 *
 * Trust strip: REMOVED (was redundant with inline hero trust)
 */
import React, {
  useEffect,
  useState,
  useCallback,
  memo,
} from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Zap,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL ?? "/";
const BANNER_INTERVAL_MS = 6000;

// Default hero backgrounds — night market / premium shopping scene
// Falls through list on error; last fallback is dark gradient (CSS)
const HERO_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80&auto=format&fit=crop",
  "https://images.pexels.com/photos/3617500/pexels-photo-3617500.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop",
];

// ─── Banner type (mirrors API response) ──────────────────────────────────────

interface Banner {
  id: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string | null;
  subtitleEn: string | null;
  ctaLabelAr: string | null;
  ctaLabelEn: string | null;
  ctaUrl: string | null;
  desktopImage: string;
  backgroundColor: string | null;
  textColor: string | null;
  sortOrder: number;
}

// ─── Inline trust bullets (used in BrandStatement) ───────────────────────────

const HERO_TRUST = [
  { ar: "بائعون موثوقون", en: "Verified Sellers" },
  { ar: "شحن سريع",      en: "Fast Delivery"    },
  { ar: "حماية المشتري", en: "Buyer Protection"  },
  { ar: "دفع آمن",       en: "Secure Payment"   },
] as const;

// ─── Brand statement (full-width cinematic, shown when no banners) ────────────

const BrandStatement = memo(function BrandStatement() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [bgIndex, setBgIndex] = useState(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(
      `/products${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`,
    );
  };

  return (
    <div className="relative h-full overflow-hidden select-none">
      {/* Background — cinematic image with cascade fallback */}
      {bgIndex < HERO_BACKGROUNDS.length ? (
        <img
          src={HERO_BACKGROUNDS[bgIndex]}
          alt=""
          loading="eager"
          decoding="async"
          onError={() => setBgIndex((i) => i + 1)}
          className="absolute inset-0 h-full w-full object-cover hero-kenburns"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950" />
      )}

      {/* Directional gradient — dark from content side */}
      <div
        className="absolute inset-0"
        style={{
          background: isRTL
            ? "linear-gradient(to left, rgba(5,15,30,0.88) 0%, rgba(5,15,30,0.72) 38%, rgba(5,15,30,0.35) 62%, rgba(5,15,30,0.10) 100%)"
            : "linear-gradient(to right, rgba(5,15,30,0.88) 0%, rgba(5,15,30,0.72) 38%, rgba(5,15,30,0.35) 62%, rgba(5,15,30,0.10) 100%)",
        }}
      />
      {/* Bottom depth */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Content overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-center z-10",
          "px-6 sm:px-10 lg:px-16",
        )}
      >
        <div className="space-y-4 sm:space-y-5 max-w-[420px]">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/40 text-primary px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold">
            <Zap className="h-3 w-3 shrink-0" />
            {lang === "ar"
              ? "أول سوق إلكتروني في سوريا"
              : "Syria's First Online Marketplace"}
          </div>

          {/* Headline */}
          {lang === "ar" ? (
            <h1 className="text-[2.1rem] sm:text-4xl lg:text-[2.8rem] font-black text-white leading-[1.1] tracking-tight drop-shadow-lg">
              سوق <span className="text-primary">سوريا</span>
              <br />
              كل ما تحتاجه
              <br />
              في مكان واحد
            </h1>
          ) : (
            <h1 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-black text-white leading-[1.08] tracking-tight drop-shadow-lg">
              Everything in{" "}
              <span className="text-primary">Aleppo.</span>
            </h1>
          )}

          {/* Subheadline */}
          <p className="text-sm sm:text-[15px] text-white/70 leading-relaxed">
            {lang === "ar"
              ? "منتجات عالية الجودة · توصيل سريع · دفع آمن"
              : "Fast delivery · Trusted sellers · Best prices in Syria"}
          </p>

          {/* Hero search bar */}
          <form
            onSubmit={handleSearch}
            className="flex items-stretch overflow-hidden rounded-xl border border-white/20 bg-black/30 backdrop-blur-md shadow-lg focus-within:border-primary transition-colors duration-200"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === "ar" ? "ابحث عن أي منتج..." : "Search products, brands..."
              }
              dir={isRTL ? "rtl" : "ltr"}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/45 outline-none min-w-0"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
              aria-label={lang === "ar" ? "بحث" : "Search"}
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* CTAs */}
          <div className="flex flex-row items-center gap-2.5 flex-wrap">
            <Link href="/products">
              <Button
                size="lg"
                className="h-10 sm:h-11 px-6 text-sm font-bold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all duration-200"
              >
                {t("home.shop_all")}
                <ArrowRight
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isRTL ? "me-2 rotate-180" : "ms-2",
                  )}
                />
              </Button>
            </Link>
            <a href="#categories">
              <Button
                size="lg"
                variant="outline"
                className="h-10 sm:h-11 px-5 text-sm font-semibold border-white/30 text-white hover:bg-white/10 hover:border-white/50 hover:-translate-y-0.5 transition-all duration-200 bg-transparent"
              >
                {lang === "ar" ? "الفئات" : "Browse Categories"}
              </Button>
            </a>
          </div>

          {/* Inline trust signals */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {HERO_TRUST.map((s) => (
              <span
                key={s.en}
                className="inline-flex items-center gap-1.5 text-[11px] text-white/60 font-medium"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {lang === "ar" ? s.ar : s.en}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Full-width banner carousel ───────────────────────────────────────────────

const BannerCarousel = memo(function BannerCarousel({
  banners,
}: {
  banners: Banner[];
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      const n = banners.length;
      setCurrent(((idx % n) + n) % n);
      setResetKey((k) => k + 1);
    },
    [banners.length],
  );

  const goPrev = useCallback(
    () => goTo(current - (isRTL ? -1 : 1)),
    [current, goTo, isRTL],
  );
  const goNext = useCallback(
    () => goTo(current + (isRTL ? -1 : 1)),
    [current, goTo, isRTL],
  );

  useEffect(() => {
    if (banners.length <= 1 || paused || reducedMotion) return;
    const id = setInterval(
      () => setCurrent((i) => (i + 1) % banners.length),
      BANNER_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [banners.length, paused, reducedMotion, resetKey]);

  const banner = banners[current];
  if (!banner) return <BrandStatement />;

  const title = lang === "ar" ? banner.titleAr : banner.titleEn;
  const subtitle = lang === "ar" ? banner.subtitleAr : banner.subtitleEn;
  const ctaLabel = lang === "ar" ? banner.ctaLabelAr : banner.ctaLabelEn;
  const bgColor = banner.backgroundColor ?? "#050f1e";
  const textColor = banner.textColor ?? "#ffffff";

  return (
    <div
      className="relative h-full overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide stack */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.75 } }}
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
        >
          <img
            key={`img-${banner.id}`}
            src={banner.desktopImage}
            alt=""
            loading="eager"
            decoding="async"
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              !reducedMotion && "hero-kenburns",
            )}
          />
          {/* Brand-colour directional gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${isRTL ? "to left" : "to right"}, ${bgColor}e0 0%, ${bgColor}a0 38%, ${bgColor}55 60%, transparent 100%)`,
            }}
          />
          {/* Bottom-to-top depth */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div
        className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-16 z-10 space-y-3"
        style={{ color: textColor }}
      >
        {subtitle && (
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
            {subtitle}
          </p>
        )}
        <h2
          className="text-2xl sm:text-3xl lg:text-[2.6rem] font-black leading-[1.1] tracking-tight drop-shadow-lg max-w-sm"
          style={{ color: textColor }}
        >
          {title}
        </h2>
        {ctaLabel && banner.ctaUrl && (
          <div className="pt-1">
            <Link href={banner.ctaUrl}>
              <Button
                size="lg"
                className="h-10 px-6 text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                onClick={() =>
                  fetch(`${BASE}api/banners/${banner.id}/click`, {
                    method: "POST",
                  }).catch(() => {})
                }
              >
                {ctaLabel}
                <ArrowRight
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isRTL ? "me-2 rotate-180" : "ms-2",
                  )}
                />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Prev / Next arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute top-1/2 -translate-y-1/2 start-3 z-20 h-8 w-8 rounded-full bg-black/25 backdrop-blur-sm border border-white/15 text-white flex items-center justify-center hover:bg-black/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            {isRTL ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={goNext}
            aria-label="Next slide"
            className="absolute top-1/2 -translate-y-1/2 end-3 z-20 h-8 w-8 rounded-full bg-black/25 backdrop-blur-sm border border-white/15 text-white flex items-center justify-center hover:bg-black/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            {isRTL ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </>
      )}

      {/* Minimal dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300 focus-visible:outline-none",
                i === current
                  ? "w-5 h-[4px] bg-white/80"
                  : "w-[4px] h-[4px] bg-white/30 hover:bg-white/50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Main HeroV4 ─────────────────────────────────────────────────────────────

export function HeroV4() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerLoading, setBannerLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}api/banners`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Banner[]) => setBanners(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setBannerLoading(false));
  }, []);

  const hasBanners = !bannerLoading && banners.length > 0;

  return (
    <section className="border-b overflow-hidden">
      {/* Single full-width column — no split mosaic */}
      <div className="h-[360px] sm:h-[440px] lg:h-[520px]">
        {hasBanners ? (
          <BannerCarousel banners={banners} />
        ) : (
          <BrandStatement />
        )}
      </div>
    </section>
  );
}
