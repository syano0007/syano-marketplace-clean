// @refresh reset
/**
 * HeroV4 — Commerce-first split hero (Homepage V4)
 *
 * Desktop layout (lg+):
 *   [Brand statement / Banner carousel  1fr] | [Product mosaic  360px]
 *   Fixed height: 460px — no full-screen / 75vh behaviour
 *
 * Mobile layout (<lg):
 *   Brand statement — compact, min-h-[260px]
 *   (Product mosaic deferred to Deals section below the fold)
 *
 * Banner enhancement layer:
 *   - Fetches /api/banners silently on mount
 *   - 0 banners  → brand statement renders (no admin content required)
 *   - Banners exist → carousel replaces brand statement on left column
 *   - Right column (HeroProductMosaic) is ALWAYS rendered
 *
 * Trust strip: always visible, 3 signals, below the grid
 */
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  memo,
} from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Zap,
  ShieldCheck,
  Truck,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroProductMosaic } from "@/components/HeroProductMosaic";

const BASE = import.meta.env.BASE_URL ?? "/";
const BANNER_INTERVAL_MS = 6000;

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

// ─── Trust strip ─────────────────────────────────────────────────────────────

const TRUST_SIGNALS = [
  { icon: Truck,       en: "Fast Delivery",      ar: "توصيل سريع" },
  { icon: ShieldCheck, en: "Secure Payments",    ar: "دفع آمن" },
  { icon: BadgeCheck,  en: "Verified Sellers",   ar: "بائعون موثوقون" },
] as const;

const TrustStrip = memo(function TrustStrip() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div className="border-t border-border/60 bg-background">
      <div className="container px-4">
        <div className="flex items-center divide-x divide-border/50 rtl:divide-x-reverse">
          {TRUST_SIGNALS.map(({ icon: Icon, en, ar }) => (
            <div
              key={en}
              className="flex items-center gap-2 px-4 py-3 first:ps-0 last:pe-0 flex-1 justify-center sm:justify-start"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                {lang === "ar" ? ar : en}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ─── Brand statement (no banners) ────────────────────────────────────────────

const BrandStatement = memo(function BrandStatement() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";

  return (
    <div
      className="relative h-full flex flex-col justify-center px-6 sm:px-8 lg:px-10 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1a2744 50%, #0f172a 100%)",
      }}
    >
      {/* Dot-grid texture — no photography */}
      <div
        className="absolute inset-0 opacity-[0.055] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      {/* Brand-colour top accent bar */}
      <div
        className={cn(
          "absolute top-0 w-20 h-[3px] rounded-b-full",
          "bg-gradient-to-r from-primary to-primary/0",
          isRTL ? "end-0 scale-x-[-1]" : "start-0",
        )}
        aria-hidden="true"
      />

      {/* Bottom ambient glow */}
      <div
        className="absolute -bottom-12 -start-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-4 sm:space-y-5 max-w-sm">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 text-primary px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold">
          <Zap className="h-3 w-3 shrink-0" />
          {lang === "ar"
            ? "أول سوق إلكتروني في سوريا"
            : "Syria's First Online Marketplace"}
        </div>

        {/* Headline */}
        <h1 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-black text-white leading-[1.08] tracking-tight">
          {lang === "ar" ? (
            <>
              كل شيء في{" "}
              <span className="text-primary">حلب.</span>
            </>
          ) : (
            <>
              Everything in{" "}
              <span className="text-primary">Aleppo.</span>
            </>
          )}
        </h1>

        {/* Subheadline */}
        <p className="text-sm sm:text-[15px] text-white/60 leading-relaxed max-w-[280px]">
          {lang === "ar"
            ? "توصيل سريع · بائعون موثوقون · أفضل الأسعار"
            : "Fast delivery · Trusted sellers · Best prices in Syria"}
        </p>

        {/* CTAs */}
        <div className="flex flex-row items-center gap-2.5 pt-1 flex-wrap">
          <Link href="/products">
            <Button
              size="lg"
              className="h-10 sm:h-11 px-6 text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5 transition-all duration-200"
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
              className="h-10 sm:h-11 px-5 text-sm font-semibold bg-white/[0.07] border-white/20 text-white hover:bg-white/[0.13] hover:border-white/35 transition-all duration-200"
            >
              {lang === "ar" ? "الفئات" : "Browse Categories"}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
});

// ─── Mini banner carousel (enhancement layer when banners exist) ──────────────

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
  const bgColor = banner.backgroundColor ?? "#0f172a";
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
              background: `linear-gradient(${isRTL ? "to left" : "to right"}, ${bgColor}cc 0%, ${bgColor}70 38%, transparent 65%)`,
            }}
          />
          {/* Bottom-to-top depth */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div
        className="absolute inset-0 flex flex-col justify-center px-6 sm:px-8 lg:px-10 z-10 space-y-3"
        style={{ color: textColor }}
      >
        {subtitle && (
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-75">
            {subtitle}
          </p>
        )}
        <h2
          className="text-2xl sm:text-3xl lg:text-[2.2rem] font-black leading-[1.1] tracking-tight drop-shadow-lg max-w-xs"
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

      {/* Pill-dot progress indicators */}
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
                  ? "w-5 h-[5px] bg-white"
                  : "w-[5px] h-[5px] bg-white/40 hover:bg-white/65",
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
      {/*
       * Split grid:
       *   Desktop  — side-by-side, fixed 460px height
       *   Mobile   — left column only (product mosaic visible in Deals below)
       */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:h-[460px]">
        {/* LEFT: brand statement or banner carousel */}
        <div className="min-h-[260px] lg:h-full">
          {hasBanners ? (
            <BannerCarousel banners={banners} />
          ) : (
            <BrandStatement />
          )}
        </div>

        {/* RIGHT: product mosaic — desktop only */}
        <div className="hidden lg:block lg:h-full">
          <HeroProductMosaic />
        </div>
      </div>

      {/* Trust strip — always rendered */}
      <TrustStrip />
    </section>
  );
}
