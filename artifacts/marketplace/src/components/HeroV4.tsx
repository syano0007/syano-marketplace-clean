// @refresh reset
import React, { useEffect, useState, useCallback, memo } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Approved hero banner asset — exact image, no modifications.
// 1717×916 px · aspect ratio 1.875:1
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — vite handles PNG imports via vite/client types
import heroBannerImg from "@assets/ChatGPT_Image_Jun_13,_2026,_06_57_40_AM_1781323131642.png";

const BASE = import.meta.env.BASE_URL ?? "/";
const BANNER_INTERVAL_MS = 6000;

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

/* ── Brand Statement — approved hero image + transparent CTA overlay ─ */
// The image (1717×916 px) already contains all visual content baked in:
//   • Arabic headline, subtitle, badge (left side)
//   • Luxury product showcase (right side)
//   • Trust-badge strip (bottom)
//   • "تسوق الآن ←" CTA button — visible but NOT interactive
//
// This component adds a transparent, keyboard-accessible <Link> positioned
// EXACTLY over the printed button so users can click it.
//
// Pixel scan of the source PNG detected the green button fill at:
//   x = 101–369  →  left=5.88%  width=15.6%
//   y = 510–567  →  top=55.7%   height=6.2%
// Comfortable padding (+0.5%) added to cover anti-aliased button edges.
//
// The outer container uses aspectRatio:"1717/916" (no maxHeight) so these
// CSS percentages map 1:1 to the image regardless of viewport width.
const BrandStatement = memo(function BrandStatement() {
  return (
    <div className="relative w-full h-full bg-black">
      {/* Exact approved image — zero visual modifications */}
      <img
        src={heroBannerImg as string}
        alt="Syano — اكتشف آلاف المنتجات من المتاجر السورية"
        loading="eager"
        decoding="async"
        // @ts-ignore fetchPriority not yet in all TS libs
        fetchPriority="high"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "fill" }}
      />

      {/* ── Transparent CTA overlay ────────────────────────────────────
          Covers the "تسوق الآن ←" button printed in the image.
          Invisible to sighted users — the image button IS the visual.
          Provides real interactivity, keyboard focus ring, and touch target.

          Position derivation (1717×916 source image):
            left  = 101 / 1717 = 5.88% → using 5.5% (slight inset for comfort)
            top   = 510 / 916  = 55.7% → using 55.5%
            width = 268 / 1717 = 15.6% → using 16.5% (adds ~15px each side)
            height = 57 / 916  = 6.2%  → using 8%   (adds padding zone)

          minHeight/minWidth enforce a 44px WCAG touch target on mobile
          where 8% of a ~200px banner would be too small to tap. ──────── */}
      <Link
        href="/products"
        aria-label="تسوق الآن — Shop Now"
        className="absolute cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-0"
        style={{
          left: "5.5%",
          top: "55.5%",
          width: "16.5%",
          height: "8%",
          minHeight: "44px",
          minWidth: "100px",
          background: "transparent",
          borderRadius: "10px",
        }}
      >
        <span className="sr-only">تسوق الآن</span>
      </Link>
    </div>
  );
});

/* ── Banner Carousel (when API returns admin-managed banners) ─────── */
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
// Container uses aspect-ratio 1717/916 (exact image dimensions) so the
// banner renders at its natural proportions.
// maxHeight: 620px caps height on ultra-wide screens.
// minHeight: 200px keeps a reasonable floor on very narrow viewports.
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
      {/* Pure aspect-ratio container — NO maxHeight, NO minHeight.
          The container always has width:100% and height = width × (916/1717).
          This guarantees the CTA overlay percentages map 1:1 to the source image
          at every viewport width, so the invisible button never drifts. */}
      <div
        className="relative w-full"
        style={{ aspectRatio: "1717/916" }}
      >
        {loaded && banners.length > 0 ? (
          <BannerCarousel banners={banners} />
        ) : (
          <BrandStatement />
        )}
      </div>
    </section>
  );
}
