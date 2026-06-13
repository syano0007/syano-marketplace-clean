// @refresh reset
import React, { useEffect, useState, useCallback, memo } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL ?? "/";
const BANNER_INTERVAL_MS = 6000;

/* ── Product mosaic items ─────────────────────────────────────────── */
const HERO_PRODUCTS = [
  {
    src: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    style: { left: "20%", top: "8%", width: "200px", height: "155px", transform: "rotate(-8deg)", zIndex: 4 },
  },
  {
    src: "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=280&h=280&fit=crop",
    style: { left: "47%", top: "4%", width: "118px", height: "118px", transform: "rotate(11deg)", zIndex: 3 },
  },
  {
    src: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=220&h=300&fit=crop",
    style: { left: "4%", top: "30%", width: "88px", height: "122px", transform: "rotate(-17deg)", zIndex: 2 },
  },
  {
    src: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=420&h=255&fit=crop",
    style: { left: "17%", top: "60%", width: "200px", height: "122px", transform: "rotate(5deg)", zIndex: 5 },
  },
  {
    src: "https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=320&h=240&fit=crop",
    style: { left: "45%", top: "53%", width: "138px", height: "104px", transform: "rotate(-9deg)", zIndex: 3 },
  },
  {
    src: "https://images.pexels.com/photos/2079438/pexels-photo-2079438.jpeg?auto=compress&cs=tinysrgb&w=280&h=210&fit=crop",
    style: { left: "3%", top: "3%", width: "110px", height: "83px", transform: "rotate(19deg)", zIndex: 2 },
  },
  {
    src: "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=260&h=340&fit=crop",
    style: { left: "39%", top: "30%", width: "82px", height: "108px", transform: "rotate(7deg)", zIndex: 4 },
  },
] as const;

/* ── Interface ────────────────────────────────────────────────────── */
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

/* ── Brand Statement (no banners) ─────────────────────────────────── */
const BrandStatement = memo(function BrandStatement() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";

  return (
    <div className="relative h-full overflow-hidden bg-black">

      {/* Product mosaic — hidden on mobile.
          In RTL the products appear on the LEFT (image end = physical left).
          In LTR we scaleX(-1) to mirror them to the RIGHT side. */}
      <div
        className="absolute inset-0 hidden md:block pointer-events-none"
        style={isRTL ? undefined : { transform: "scaleX(-1)" }}
      >
        {HERO_PRODUCTS.map((p, i) => (
          <img
            key={i}
            src={p.src}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            className="absolute rounded-xl lg:rounded-2xl object-cover shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
            style={p.style as React.CSSProperties}
          />
        ))}

        {/* Green ambient glow */}
        <div
          className="absolute rounded-full blur-3xl pointer-events-none"
          style={{
            left: "25%",
            top: "20%",
            width: "250px",
            height: "250px",
            background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* On mobile: dark gradient background */}
      <div className="absolute inset-0 md:hidden bg-gradient-to-br from-slate-900 via-black to-emerald-950/30" />

      {/* Gradient overlay: transparent on IMAGE side → near-black on TEXT side.
          RTL: text is on RIGHT → dark from right.
          LTR: text is on LEFT  → dark from left.  */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background: isRTL
            ? "linear-gradient(to left, transparent 0%, rgba(0,0,0,0.45) 32%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.99) 100%)"
            : "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 32%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.99) 100%)",
        }}
      />
      {/* Mobile gradient */}
      <div className="absolute inset-0 md:hidden" style={{ background: "rgba(0,0,0,0.55)" }} />

      {/* Syano brand mark — always in the image area (the non-text side) */}
      <div
        className={cn(
          "absolute top-5 hidden md:flex items-center gap-1.5 z-10",
          isRTL ? "left-5" : "right-5",
        )}
      >
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
          <span className="text-xs font-black" style={{ color: "black" }}>S</span>
        </div>
        <span className="text-sm font-bold text-white/60">Syano</span>
      </div>

      {/* Navigation arrows */}
      <button
        aria-label="Previous"
        className="absolute top-1/2 -translate-y-1/2 start-3 z-20 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
      >
        {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
      <button
        aria-label="Next"
        className="absolute top-1/2 -translate-y-1/2 end-3 z-20 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
      >
        {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full transition-all",
              i === 0 ? "w-6 h-[3.5px] bg-primary" : "w-[3.5px] h-[3.5px] bg-white/30",
            )}
          />
        ))}
      </div>

      {/* ── Text content — positioned at RTL-start (right in Arabic) ── */}
      <div
        className={cn(
          "absolute inset-y-0 flex flex-col justify-center z-10 px-5 sm:px-8 md:px-10 lg:px-14",
          "w-full md:w-[52%]",
          isRTL ? "right-0" : "left-0",
        )}
      >
        <div className="space-y-3 sm:space-y-4 max-w-[420px]">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/40 text-primary px-3 py-1 rounded-full text-[11px] font-semibold w-fit">
            <Zap className="h-3 w-3 shrink-0" />
            {lang === "ar" ? "تجربة تسوق متكاملة" : "Syria's First Online Marketplace"}
          </div>

          {/* Headline */}
          {lang === "ar" ? (
            <h1 className="text-[2.5rem] sm:text-[3.2rem] lg:text-[3.8rem] font-black text-white leading-[1.03] tracking-tight drop-shadow-2xl">
              اكتشف آلاف المنتجات
              <br />
              <span className="text-primary">من المتاجر السورية</span>
            </h1>
          ) : (
            <h1 className="text-[2rem] sm:text-[2.8rem] lg:text-[3.2rem] font-black text-white leading-[1.05] tracking-tight drop-shadow-2xl">
              Discover Thousands
              <br />
              <span className="text-primary">of Syrian Products.</span>
            </h1>
          )}

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-white/50 leading-relaxed max-w-[300px]">
            {lang === "ar"
              ? "منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة"
              : "Diverse products, trusted sellers, and a modern shopping experience."}
          </p>

          {/* Single CTA */}
          <div className="pt-1">
            <Link href="/products">
              <Button
                size="lg"
                className="h-11 sm:h-12 px-8 sm:px-10 text-sm font-bold rounded-xl shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all duration-200"
              >
                {lang === "ar" ? "تسوق الآن" : "Shop Now"}
                <ArrowRight
                  className={cn("h-4 w-4 shrink-0", isRTL ? "me-2 rotate-180" : "ms-2")}
                />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ── Banner Carousel (when API returns banners) ───────────────────── */
const BannerCarousel = memo(function BannerCarousel({ banners }: { banners: Banner[] }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const goTo = useCallback(
    (idx: number) => {
      const n = banners.length;
      setCurrent(((idx % n) + n) % n);
      setResetKey((k) => k + 1);
    },
    [banners.length],
  );

  const goPrev = useCallback(() => goTo(current - (isRTL ? -1 : 1)), [current, goTo, isRTL]);
  const goNext = useCallback(() => goTo(current + (isRTL ? -1 : 1)), [current, goTo, isRTL]);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(() => setCurrent((i) => (i + 1) % banners.length), BANNER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [banners.length, paused, resetKey]);

  const banner = banners[current];
  if (!banner) return <BrandStatement />;

  const title = lang === "ar" ? banner.titleAr : banner.titleEn;
  const subtitle = lang === "ar" ? banner.subtitleAr : banner.subtitleEn;
  const ctaLabel = lang === "ar" ? banner.ctaLabelAr : banner.ctaLabelEn;
  const bgColor = banner.backgroundColor ?? "#000000";
  const textColor = banner.textColor ?? "#ffffff";

  return (
    <div
      className="relative h-full overflow-hidden select-none bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6 } }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          <img
            src={banner.desktopImage}
            alt=""
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${isRTL ? "to left" : "to right"}, ${bgColor}e0 0%, ${bgColor}a0 38%, ${bgColor}50 60%, transparent 100%)`,
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div
        className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-14 z-10 space-y-3"
        style={{ color: textColor }}
      >
        {subtitle && (
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-60">{subtitle}</p>
        )}
        <h2
          className="text-2xl sm:text-3xl lg:text-[2.8rem] font-black leading-[1.05] tracking-tight drop-shadow-lg max-w-sm"
          style={{ color: textColor }}
        >
          {title}
        </h2>
        {ctaLabel && banner.ctaUrl && (
          <Link href={banner.ctaUrl}>
            <Button
              size="lg"
              className="h-11 px-8 text-sm font-bold rounded-xl mt-1 hover:-translate-y-0.5 transition-all duration-200"
              onClick={() =>
                fetch(`${BASE}api/banners/${banner.id}/click`, { method: "POST" }).catch(() => {})
              }
            >
              {ctaLabel}
              <ArrowRight className={cn("h-4 w-4 shrink-0", isRTL ? "me-2 rotate-180" : "ms-2")} />
            </Button>
          </Link>
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous"
            className="absolute top-1/2 -translate-y-1/2 start-3 z-20 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={goNext}
            aria-label="Next"
            className="absolute top-1/2 -translate-y-1/2 end-3 z-20 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <div className="absolute bottom-4 inset-x-0 z-20 flex justify-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "rounded-full transition-all",
                  i === current
                    ? "w-6 h-[3.5px] bg-primary"
                    : "w-[3.5px] h-[3.5px] bg-white/30 hover:bg-white/55",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});

/* ── Main HeroV4 export ───────────────────────────────────────────── */
export function HeroV4() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${BASE}api/banners`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Banner[]) => setBanners(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <section className="border-b overflow-hidden bg-black">
      <div className="h-[340px] sm:h-[400px] lg:h-[440px]">
        {loaded && banners.length > 0 ? (
          <BannerCarousel banners={banners} />
        ) : (
          <BrandStatement />
        )}
      </div>
    </section>
  );
}
