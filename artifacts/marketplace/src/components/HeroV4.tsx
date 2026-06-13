// @refresh reset
import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Zap,
  Headphones,
  ShieldCheck,
  CreditCard,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL ?? "/";
const BANNER_INTERVAL_MS = 6_000;

/* ── Banner interface — matches hero_banners DB table ─────────────── */
interface Banner {
  id: number;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string | null;
  subtitleEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  ctaLabelAr?: string | null;
  ctaLabelEn?: string | null;
  ctaUrl?: string | null;
  ctaLabelArSecondary?: string | null;
  ctaLabelEnSecondary?: string | null;
  ctaUrlSecondary?: string | null;
  desktopImage: string;
  mobileImage?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  sortOrder: number;
}

/* ── Product mosaic — curated dark-luxury product photography ─────── */
// Positions are percentages within the *visual-area div* (left half in RTL).
// For LTR, the visual-area div is mirrored with scaleX(-1); individual images
// counter-mirror so the products are not horizontally flipped.
const MOSAIC_PRODUCTS = [
  // Dominant: premium over-ear headphones — centre (dark bg → full brightness)
  {
    src: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
    style: { left: "28%", top: "8%", width: "210px", height: "210px", transform: "rotate(-5deg)", zIndex: 6, filter: "brightness(0.92) contrast(1.08)" },
  },
  // Watch — lower-left (dark studio bg)
  {
    src: "https://images.pexels.com/photos/1034069/pexels-photo-1034069.jpeg?auto=compress&cs=tinysrgb&w=280&h=280&fit=crop",
    style: { left: "7%", top: "54%", width: "155px", height: "155px", transform: "rotate(8deg)", zIndex: 4, filter: "brightness(0.9) contrast(1.1)" },
  },
  // Perfume — upper far-left (mixed bg — darken to blend)
  {
    src: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=200&h=285&fit=crop",
    style: { left: "2%", top: "7%", width: "98px", height: "145px", transform: "rotate(-14deg)", zIndex: 3, filter: "brightness(0.82) contrast(1.05) saturate(0.9)" },
  },
  // Camera — lower-right of visual area (dark atmospheric bg)
  {
    src: "https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=320&h=230&fit=crop",
    style: { left: "52%", top: "60%", width: "162px", height: "116px", transform: "rotate(6deg)", zIndex: 3, filter: "brightness(0.88) contrast(1.1)" },
  },
  // Sneakers — bottom-wide (studio bg → darken heavily to blend with dark hero)
  {
    src: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=360&h=220&fit=crop",
    style: { left: "17%", top: "72%", width: "195px", height: "119px", transform: "rotate(-4deg)", zIndex: 2, filter: "brightness(0.72) contrast(1.08) saturate(0.88)" },
  },
  // Phone — upper-right of visual area (dark bg)
  {
    src: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=220&h=340&fit=crop",
    style: { left: "66%", top: "5%", width: "105px", height: "168px", transform: "rotate(12deg)", zIndex: 5, filter: "brightness(0.9) contrast(1.05)" },
  },
] as const;

/* ── Trust strip data ────────────────────────────────────────────── */
const TRUST_ITEMS = [
  { Icon: Headphones, ar: { label: "دعم سريع", desc: "خدمة عملاء متاحة دائماً" }, en: { label: "Fast Support", desc: "Always available" } },
  { Icon: ShieldCheck, ar: { label: "تاجر موثوق", desc: "متاجر موثقة ومضمونة" }, en: { label: "Trusted Sellers", desc: "Verified & certified" } },
  { Icon: CreditCard, ar: { label: "دفع آمن", desc: "طرق دفع آمنة ومتعددة" }, en: { label: "Secure Payment", desc: "Multiple secure methods" } },
  { Icon: Truck, ar: { label: "توصيل سريع", desc: "لكافة المناطق السورية" }, en: { label: "Fast Delivery", desc: "Across all Syria" } },
] as const;

/* ── TrustStrip ──────────────────────────────────────────────────── */
const TrustStrip = memo(function TrustStrip() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/5 bg-card/40">
      {TRUST_ITEMS.map(({ Icon, ar, en }) => (
        <div
          key={ar.label}
          className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b sm:border-b-0 border-white/5 sm:border-s sm:first:border-s-0"
        >
          <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] sm:text-[13px] font-semibold text-foreground leading-tight">
              {lang === "ar" ? ar.label : en.label}
            </p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground/70 leading-tight mt-0.5 truncate">
              {lang === "ar" ? ar.desc : en.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
});

/* ── ProductMosaic ───────────────────────────────────────────────── */
// Rendered inside the visual-area div (absolute inset-0).
// isRTL=false → parent div has scaleX(-1) → individual images counter-flip
// so image content is always un-mirrored.
const ProductMosaic = memo(function ProductMosaic({ isRTL }: { isRTL: boolean }) {
  return (
    <div
      className="absolute inset-0 hidden md:block pointer-events-none overflow-hidden"
      style={isRTL ? undefined : { transform: "scaleX(-1)" }}
    >
      {/* Green LED platform glow — mimics reference's green surface light */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "26%",
          bottom: "6%",
          width: "180px",
          height: "40px",
          background: "radial-gradient(ellipse, rgba(16,185,129,0.75) 0%, transparent 80%)",
          filter: "blur(14px)",
          borderRadius: "50%",
        }}
      />
      {/* Warm amber glow — mimics reference's floor lamp */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: "-8%",
          top: "-15%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(251,191,36,0.09) 0%, transparent 65%)",
        }}
      />

      {/* Product images */}
      {MOSAIC_PRODUCTS.map((p, i) => (
        <img
          key={i}
          src={p.src}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className="absolute rounded-2xl object-cover"
          style={{
            left: p.style.left,
            top: p.style.top,
            width: p.style.width,
            height: p.style.height,
            zIndex: p.style.zIndex,
            // For LTR: parent is scaleX(-1); counter-flip each image so it
            // renders correctly oriented, just repositioned to the right side.
            transform: isRTL
              ? p.style.transform
              : `scaleX(-1) ${p.style.transform}`,
            // Per-image filter: darker products blend cleanly into the dark hero.
            // Light-background product shots are dimmed so they integrate without
            // the "floating white card" effect.
            filter: p.style.filter,
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.95), 0 8px 24px rgba(0,0,0,0.7)",
          }}
        />
      ))}
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   BrandStatement — default hero (no admin banners).
   Visually matches the reference design:
     • Dark luxury background (vertical stripe panel pattern)
     • Cinematic green + amber ambient lighting
     • Product mosaic on visual side (left RTL / right LTR)
     • Typography hierarchy: badge → headline → subtitle → CTA
   Fully dynamic — text is real React nodes, CTA is a real <Button>.
──────────────────────────────────────────────────────────────────────────── */
const BrandStatement = memo(function BrandStatement() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";

  return (
    <div className="relative h-full bg-black overflow-hidden">

      {/* ── BG layer 1: base gradient ──────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/60 via-black to-zinc-950" />

      {/* ── BG layer 2: vertical panel stripe (reference wall texture) ── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.045,
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,1) 0px, rgba(255,255,255,1) 1px, transparent 1px, transparent 58px)",
        }}
      />

      {/* ── BG layer 3: green ambient fill on visual side ─────────────── */}
      <div
        className="absolute inset-y-0 pointer-events-none"
        style={{
          [isRTL ? "left" : "right"]: 0,
          width: "55%",
          background: isRTL
            ? "radial-gradient(ellipse at 35% 65%, rgba(16,185,129,0.08) 0%, transparent 65%)"
            : "radial-gradient(ellipse at 65% 65%, rgba(16,185,129,0.08) 0%, transparent 65%)",
        }}
      />

      {/* ── Visual area (md+): product mosaic ─────────────────────────── */}
      {/* left half in RTL, right half in LTR */}
      <div
        className="absolute inset-y-0 hidden md:block"
        style={{ [isRTL ? "left" : "right"]: 0, width: "55%" }}
      >
        <ProductMosaic isRTL={isRTL} />
      </div>

      {/* ── Gradient blend: visual side → text side ───────────────────── */}
      {/* Desktop: directional gradient creates smooth text background */}
      <div
        className="absolute inset-0 hidden md:block pointer-events-none"
        style={{
          background: isRTL
            ? "linear-gradient(to right, transparent 0%, transparent 22%, rgba(0,0,0,0.5) 38%, rgba(0,0,0,0.95) 52%, #000 100%)"
            : "linear-gradient(to left,  transparent 0%, transparent 22%, rgba(0,0,0,0.5) 38%, rgba(0,0,0,0.95) 52%, #000 100%)",
        }}
      />
      {/* Mobile: uniform dark overlay (no product area) */}
      <div className="absolute inset-0 md:hidden pointer-events-none bg-gradient-to-b from-black/80 via-black/60 to-black/85" />

      {/* ── Text column ───────────────────────────────────────────────── */}
      <div
        className={cn(
          "absolute inset-y-0 z-10 flex flex-col justify-center",
          "px-5 sm:px-8 md:px-10 lg:px-14",
          "w-full md:w-[52%] lg:w-[50%]",
          isRTL ? "right-0" : "left-0",
        )}
      >
        <div className="flex flex-col gap-3 sm:gap-4">

          {/* Eyebrow badge */}
          <div className="inline-flex w-fit items-center gap-1.5 bg-primary/12 border border-primary/30 text-primary px-3 py-[5px] rounded-full">
            <Zap className="h-3 w-3 shrink-0" />
            <span className="text-[11px] sm:text-xs font-semibold">
              {lang === "ar" ? "تجربة تسوق متكاملة" : "Syria's Premier Marketplace"}
            </span>
          </div>

          {/* Headline — two lines, second line in primary green */}
          {lang === "ar" ? (
            <h1 className="text-[2.1rem] sm:text-[2.7rem] md:text-[3rem] lg:text-[3.5rem] xl:text-[3.8rem] font-black text-white leading-[1.04] tracking-tight">
              اكتشف آلاف المنتجات
              <br />
              <span className="text-primary">من المتاجر السورية</span>
            </h1>
          ) : (
            <h1 className="text-[1.85rem] sm:text-[2.3rem] md:text-[2.7rem] lg:text-[3.1rem] xl:text-[3.5rem] font-black text-white leading-[1.05] tracking-tight">
              Discover Thousands
              <br />
              <span className="text-primary">of Syrian Products.</span>
            </h1>
          )}

          {/* Subtitle — hidden on very small screens to prevent clutter */}
          <p className="hidden sm:block text-xs sm:text-sm text-white/55 leading-relaxed max-w-[300px] md:max-w-[340px]">
            {lang === "ar"
              ? "منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة."
              : "Diverse products, trusted sellers, and a modern shopping experience."}
          </p>

          {/* Primary CTA */}
          <div className="pt-1">
            <Link href="/products">
              <Button
                size="lg"
                className="h-10 sm:h-12 px-6 sm:px-9 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                {lang === "ar" ? "تسوق الآن" : "Shop Now"}
                <ArrowRight
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isRTL ? "me-2 rotate-180" : "ms-2",
                  )}
                />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   BannerCarousel — admin-controlled dynamic banners.

   Features:
   ✓ Autoplay (6 s, pause on hover)
   ✓ Infinite loop navigation (prev/next buttons)
   ✓ Dot progress indicators (pill on active, dot on inactive)
   ✓ Touch swipe support (>48 px threshold)
   ✓ Keyboard arrow navigation (Left/Right, RTL-aware)
   ✓ Impression tracking → POST /api/banners/:id/impression
   ✓ Click tracking     → POST /api/banners/:id/click
   ✓ Secondary CTA support (ctaLabelArSecondary / ctaUrlSecondary)
   ✓ Per-banner backgroundColor + textColor overrides
   ✓ RTL-aware layout (text right / image left in AR)
──────────────────────────────────────────────────────────────────────────── */
const BannerCarousel = memo(function BannerCarousel({
  banners,
}: {
  banners: Banner[];
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trackImpression = useCallback(
    (idx: number) => {
      const b = banners[idx];
      if (!b) return;
      fetch(`${BASE}api/banners/${b.id}/impression`, { method: "POST" }).catch(
        () => {},
      );
    },
    [banners],
  );

  const goTo = useCallback(
    (idx: number) => {
      const n = banners.length;
      const next = ((idx % n) + n) % n;
      setCurrent(next);
      setResetKey((k) => k + 1);
      trackImpression(next);
    },
    [banners.length, trackImpression],
  );

  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);
  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);

  // Track first banner impression on mount
  useEffect(() => {
    trackImpression(0);
  }, [trackImpression]);

  // Autoplay
  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(
      () => setCurrent((i) => (i + 1) % banners.length),
      BANNER_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [banners.length, paused, resetKey]);

  // Keyboard navigation — active only while the mouse is inside the hero
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current?.matches(":hover")) return;
      if (e.key === "ArrowLeft") { isRTL ? goNext() : goPrev(); }
      if (e.key === "ArrowRight") { isRTL ? goPrev() : goNext(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext, isRTL]);

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 48) {
        if (isRTL) { diff > 0 ? goPrev() : goNext(); }
        else       { diff > 0 ? goNext() : goPrev(); }
      }
      touchStartX.current = null;
    },
    [goPrev, goNext, isRTL],
  );

  const b = banners[current];
  if (!b) return <BrandStatement />;

  const title     = lang === "ar" ? b.titleAr       : b.titleEn;
  const subtitle  = lang === "ar" ? (b.subtitleAr  ?? null) : (b.subtitleEn  ?? null);
  const ctaLabel  = lang === "ar" ? (b.ctaLabelAr  ?? null) : (b.ctaLabelEn  ?? null);
  const ctaLabel2 = lang === "ar" ? (b.ctaLabelArSecondary ?? null) : (b.ctaLabelEnSecondary ?? null);
  const ctaUrl    = b.ctaUrl ?? "/products";
  const ctaUrl2   = b.ctaUrlSecondary ?? null;
  const bgHex     = b.backgroundColor ?? "#000000";
  const textHex   = b.textColor ?? "#ffffff";
  const imgSrc    = b.desktopImage;

  return (
    <div
      ref={containerRef}
      className="relative h-full bg-black overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image — animated fade between slides */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.55 } }}
          exit={{ opacity: 0, transition: { duration: 0.38 } }}
        >
          <img
            src={imgSrc}
            alt=""
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Text-side gradient — uses banner's own bg colour */}
          <div
            className="absolute inset-0"
            style={{
              background: isRTL
                ? `linear-gradient(to left, transparent 12%, ${bgHex}a0 42%, ${bgHex}ef 62%, ${bgHex}fd 100%)`
                : `linear-gradient(to right, transparent 12%, ${bgHex}a0 42%, ${bgHex}ef 62%, ${bgHex}fd 100%)`,
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Text column */}
      <div
        className={cn(
          "absolute inset-y-0 flex flex-col justify-center z-10",
          "px-5 sm:px-8 md:px-10 lg:px-14",
          "w-full sm:w-[58%] md:w-[52%]",
          isRTL ? "right-0" : "left-0",
        )}
        style={{ color: textHex }}
      >
        <div className="flex flex-col gap-3">
          {subtitle && (
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: textHex, opacity: 0.6 }}
            >
              {subtitle}
            </p>
          )}

          <h2
            className="text-[1.9rem] sm:text-[2.4rem] md:text-[2.75rem] lg:text-[3rem] font-black leading-[1.06] tracking-tight drop-shadow-lg"
            style={{ color: textHex }}
          >
            {title}
          </h2>

          {(ctaLabel || ctaLabel2) && (
            <div className="flex flex-wrap gap-3 pt-1">
              {ctaLabel && (
                <Link href={ctaUrl}>
                  <Button
                    size="lg"
                    className="h-10 sm:h-12 px-6 sm:px-9 text-sm font-bold rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    onClick={() =>
                      fetch(`${BASE}api/banners/${b.id}/click`, {
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
              )}
              {ctaLabel2 && ctaUrl2 && (
                <Link href={ctaUrl2}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-10 sm:h-12 px-6 sm:px-8 text-sm font-semibold rounded-xl border-white/20 hover:bg-white/8 hover:border-white/35 bg-transparent transition-all duration-200"
                    style={{ color: textHex }}
                  >
                    {ctaLabel2}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation arrows — only shown when there are multiple slides */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute top-1/2 -translate-y-1/2 start-3 z-20 h-9 w-9 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={goNext}
            aria-label="Next slide"
            className="absolute top-1/2 -translate-y-1/2 end-3 z-20 h-9 w-9 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </>
      )}

      {/* Dot/pill progress indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current
                  ? "w-6 h-[3.5px] bg-primary"
                  : "w-[3.5px] h-[3.5px] bg-white/30 hover:bg-white/55",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
});

/* ── HeroV4 — main export ────────────────────────────────────────── */
export function HeroV4() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${BASE}api/banners`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: unknown) => setBanners(Array.isArray(d) ? (d as Banner[]) : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <section className="border-b bg-black overflow-hidden">
      {/* Hero content area — h scales with breakpoint */}
      <div className="h-[310px] sm:h-[370px] md:h-[450px] lg:h-[510px]">
        {loaded && banners.length > 0 ? (
          <BannerCarousel banners={banners} />
        ) : (
          <BrandStatement />
        )}
      </div>
      {/* Trust strip — always visible; no duplication with homepage sections */}
      <TrustStrip />
    </section>
  );
}
