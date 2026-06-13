// @refresh reset
import React, { useEffect, useState, useCallback, memo } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL ?? "/";
const BANNER_INTERVAL_MS = 6000;

const HERO_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80&auto=format&fit=crop",
  "https://images.pexels.com/photos/3617500/pexels-photo-3617500.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop",
];

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

const BrandStatement = memo(function BrandStatement() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";
  const [bgIndex, setBgIndex] = useState(0);

  return (
    <div className="relative h-full overflow-hidden select-none">
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

      {/* Deep cinematic overlay */}
      <div className="absolute inset-0 bg-black/55" />
      <div
        className="absolute inset-0"
        style={{
          background: isRTL
            ? "linear-gradient(to left, rgba(3,10,20,0.95) 0%, rgba(3,10,20,0.82) 38%, rgba(3,10,20,0.35) 65%, rgba(3,10,20,0.08) 100%)"
            : "linear-gradient(to right, rgba(3,10,20,0.95) 0%, rgba(3,10,20,0.82) 38%, rgba(3,10,20,0.35) 65%, rgba(3,10,20,0.08) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Content */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-center z-10",
          "px-6 sm:px-10 lg:px-16",
        )}
      >
        <div className="space-y-4 sm:space-y-5 max-w-[460px]">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/40 text-primary px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold w-fit">
            <Zap className="h-3 w-3 shrink-0" />
            {lang === "ar"
              ? "تجربة تسوق متكاملة"
              : "Syria's First Online Marketplace"}
          </div>

          {/* Headline */}
          {lang === "ar" ? (
            <h1 className="text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem] font-black text-white leading-[1.08] tracking-tight drop-shadow-2xl">
              اكتشف آلاف المنتجات
              <br />
              <span className="text-primary">من المتاجر السورية</span>
            </h1>
          ) : (
            <h1 className="text-[2rem] sm:text-4xl lg:text-[2.8rem] font-black text-white leading-[1.08] tracking-tight drop-shadow-2xl">
              Discover Thousands of
              <br />
              <span className="text-primary">Syrian Products.</span>
            </h1>
          )}

          {/* Supporting text */}
          <p className="text-sm sm:text-[15px] text-white/60 leading-relaxed max-w-[340px]">
            {lang === "ar"
              ? "منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة"
              : "Diverse products, trusted sellers, and a modern shopping experience."}
          </p>

          {/* CTA row */}
          <div className="flex flex-row items-center gap-3 flex-wrap pt-1">
            <Link href="/products">
              <Button
                size="lg"
                className="h-11 px-7 text-sm font-bold shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 rounded-xl"
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
            <a href="#categories">
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-6 text-sm font-semibold border-white/25 text-white hover:bg-white/10 hover:border-white/40 hover:-translate-y-0.5 transition-all duration-200 bg-transparent rounded-xl"
              >
                {lang === "ar" ? "الفئات" : "Browse"}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

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
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${isRTL ? "to left" : "to right"}, ${bgColor}e8 0%, ${bgColor}b0 38%, ${bgColor}60 60%, transparent 100%)`,
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div
        className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-16 z-10 space-y-4"
        style={{ color: textColor }}
      >
        {subtitle && (
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-65">
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
                className="h-11 px-7 text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all duration-200 rounded-xl"
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

      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute top-1/2 -translate-y-1/2 start-4 z-20 h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm border border-white/15 text-white flex items-center justify-center hover:bg-black/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
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
            className="absolute top-1/2 -translate-y-1/2 end-4 z-20 h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm border border-white/15 text-white flex items-center justify-center hover:bg-black/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            {isRTL ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-5 inset-x-0 z-20 flex items-center justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300 focus-visible:outline-none",
                i === current
                  ? "w-6 h-[4px] bg-white/90"
                  : "w-[4px] h-[4px] bg-white/30 hover:bg-white/55",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
});

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
      <div className="h-[380px] sm:h-[460px] lg:h-[540px]">
        {hasBanners ? (
          <BannerCarousel banners={banners} />
        ) : (
          <BrandStatement />
        )}
      </div>
    </section>
  );
}
