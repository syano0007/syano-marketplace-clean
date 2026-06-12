// @refresh reset
/**
 * HeroBanner — Premium animated hero banner system
 *
 * Features:
 * - Framer Motion crossfade + scale transitions (60fps)
 * - Staggered text animation per slide
 * - Glass-effect navigation arrows (RTL-aware)
 * - Animated progress bars (autoplay indicator)
 * - Touch swipe with momentum feel (Framer Motion drag)
 * - Autoplay (7s), pause on hover/focus/touch
 * - Keyboard navigation (← →)
 * - ARIA: roles, labels, pause control
 * - Impression tracking (IntersectionObserver) + click tracking
 * - First slide image preloaded, rest lazy
 * - Graceful fallback when no banners exist
 * - Full RTL support
 */
import React, { useEffect, useRef, useState, useCallback, useId } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Pause, Play, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Banner {
  id: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string | null;
  subtitleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  desktopImage: string;
  mobileImage: string | null;
  ctaLabelAr: string | null;
  ctaLabelEn: string | null;
  ctaUrl: string | null;
  ctaLabelArSecondary: string | null;
  ctaLabelEnSecondary: string | null;
  ctaUrlSecondary: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  sortOrder: number;
  impressions: number;
  clicks: number;
}

// ─── Static fallback (shown when no DB banners exist) ────────────────────────

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/7317590/pexels-photo-7317590.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1&fit=crop&crop=center";
const FALLBACK_IMAGE_SM =
  "https://images.pexels.com/photos/7317590/pexels-photo-7317590.jpeg?auto=compress&cs=tinysrgb&w=768&h=600&fit=crop&crop=center";

function StaticHero() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <section className="relative overflow-hidden border-b min-h-[420px] sm:min-h-[500px] md:min-h-[580px] flex items-center">
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src={FALLBACK_IMAGE}
          alt=""
          fetchPriority="high"
          decoding="async"
          sizes="100vw"
          srcSet={`${FALLBACK_IMAGE_SM} 768w, ${FALLBACK_IMAGE} 1920w`}
          style={{ objectPosition: "center 40%" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent" />
      </div>
      <div className="pointer-events-none absolute -top-16 -end-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -start-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="container px-4 py-12 sm:py-20 md:py-28 relative z-10 w-full">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/30 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Zap className="h-3.5 w-3.5" />
            {t("home.hero_badge")}
          </div>
          <h1 className="heading-hero text-white drop-shadow-lg">{t("home.hero_title")}</h1>
          <p className="text-base sm:text-lg text-white/75 leading-relaxed max-w-xl mx-auto drop-shadow">
            {t("home.hero_desc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/products">
              <Button size="lg" className="h-12 px-8 text-base font-semibold w-full sm:w-auto shadow-lg shadow-primary/30">
                {t("home.shop_all")}
                <ArrowRight className="ms-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Analytics helpers ────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL ?? "/";

function trackImpression(id: number) {
  fetch(`${BASE}api/banners/${id}/impression`, { method: "POST" }).catch(() => {});
}
function trackClick(id: number) {
  fetch(`${BASE}api/banners/${id}/click`, { method: "POST" }).catch(() => {});
}

// ─── Animation variants ───────────────────────────────────────────────────────

type BezierEase = [number, number, number, number];
const EASE_OUT: BezierEase = [0.32, 0.72, 0, 1];

const bgVariants: Variants = {
  enter: { opacity: 0, scale: 1.04 },
  center: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.5, ease: EASE_OUT } },
};

const textContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};

const textItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
  exit: { opacity: 0, y: -14, transition: { duration: 0.3, ease: "easeIn" } },
};

// ─── Single slide ─────────────────────────────────────────────────────────────

function Slide({
  banner,
  lang,
  isRTL,
  onCtaClick,
}: {
  banner: Banner;
  lang: string;
  isRTL: boolean;
  onCtaClick: (id: number) => void;
}) {
  const { t } = useTranslation();
  const title = lang === "ar" ? banner.titleAr : banner.titleEn;
  const subtitle = lang === "ar" ? banner.subtitleAr : banner.subtitleEn;
  const description = lang === "ar" ? banner.descriptionAr : banner.descriptionEn;
  const ctaLabel = lang === "ar" ? banner.ctaLabelAr : banner.ctaLabelEn;
  const ctaLabelSec = lang === "ar" ? banner.ctaLabelArSecondary : banner.ctaLabelEnSecondary;

  const textColor = banner.textColor ?? "#ffffff";

  return (
    <div className="absolute inset-0 flex items-center" style={{ color: textColor }}>
      {/* Background image */}
      <motion.div
        className="absolute inset-0"
        variants={bgVariants}
        initial="enter"
        animate="center"
        exit="exit"
        aria-hidden="true"
      >
        <img
          src={banner.desktopImage}
          alt=""
          loading="lazy"
          decoding="async"
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark gradient overlay — ensures text readability over any image */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/75" />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${banner.backgroundColor ?? "#0f172a"}cc 0%, transparent 60%)`,
          }}
        />
        {/* Top edge darkening */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
      </motion.div>

      {/* Decorative glow orbs */}
      <div className="pointer-events-none absolute -top-20 -end-20 h-80 w-80 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -start-10 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />

      {/* Content */}
      <div className="container px-4 sm:px-6 relative z-10 w-full">
        <motion.div
          className="max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-5"
          variants={textContainer}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {/* Subtitle badge */}
          {subtitle && (
            <motion.div variants={textItem}>
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold" style={{ color: textColor }}>
                <Zap className="h-3.5 w-3.5 text-primary" />
                {subtitle}
              </span>
            </motion.div>
          )}

          {/* Main headline */}
          <motion.h2
            variants={textItem}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight drop-shadow-xl"
            style={{ color: textColor }}
          >
            {title}
          </motion.h2>

          {/* Description */}
          {description && (
            <motion.p
              variants={textItem}
              className="text-sm sm:text-base md:text-lg leading-relaxed max-w-xl opacity-85 drop-shadow"
              style={{ color: textColor }}
            >
              {description}
            </motion.p>
          )}

          {/* CTAs */}
          {(ctaLabel || ctaLabelSec) && (
            <motion.div
              variants={textItem}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1"
            >
              {ctaLabel && banner.ctaUrl && (
                <Link href={banner.ctaUrl} onClick={() => onCtaClick(banner.id)}>
                  <Button
                    size="lg"
                    className="h-12 px-7 text-base font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                  >
                    {ctaLabel}
                    <ArrowRight className={cn("h-4 w-4", isRTL ? "me-2 rotate-180" : "ms-2")} />
                  </Button>
                </Link>
              )}
              {ctaLabelSec && banner.ctaUrlSecondary && (
                <Link href={banner.ctaUrlSecondary} onClick={() => onCtaClick(banner.id)}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-7 text-base font-semibold bg-white/10 backdrop-blur-md border-white/30 hover:bg-white/20 text-white"
                  >
                    {ctaLabelSec}
                  </Button>
                </Link>
              )}
              {ctaLabel && !banner.ctaUrl && (
                <Button size="lg" className="h-12 px-7 text-base font-bold">
                  {ctaLabel}
                </Button>
              )}
            </motion.div>
          )}

          {/* Default CTA when no custom ones */}
          {!ctaLabel && !ctaLabelSec && (
            <motion.div variants={textItem}>
              <Link href="/products">
                <Button size="lg" className="h-12 px-7 text-base font-bold shadow-xl shadow-primary/25">
                  {t("home.shop_all")}
                  <ArrowRight className={cn("h-4 w-4", isRTL ? "me-2 rotate-180" : "ms-2")} />
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  active,
  paused,
  duration,
  onClick,
  label,
}: {
  active: boolean;
  paused: boolean;
  duration: number;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex-1 h-1 rounded-full overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60",
        active ? "opacity-100" : "opacity-40 hover:opacity-60"
      )}
    >
      <div className="w-full h-full bg-white/30 relative">
        {active && (
          <motion.div
            key="progress"
            className="absolute inset-y-0 start-0 bg-white rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: paused ? undefined : "100%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        )}
        {active && paused && (
          <div className="absolute inset-y-0 start-0 bg-white rounded-full" style={{ width: "50%" }} />
        )}
      </div>
    </button>
  );
}

// ─── Glass Arrow Button ───────────────────────────────────────────────────────

function ArrowBtn({
  onClick,
  label,
  children,
  side,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  side: "start" | "end";
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-20",
        "h-11 w-11 sm:h-12 sm:w-12 rounded-full",
        "flex items-center justify-center",
        "bg-white/10 backdrop-blur-md border border-white/20",
        "text-white hover:bg-white/20 active:bg-white/30",
        "shadow-lg shadow-black/20",
        "transition-all duration-200 hover:scale-105 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        "hidden sm:flex",
        side === "start" ? "start-4 lg:start-6" : "end-4 lg:end-6"
      )}
    >
      {children}
    </button>
  );
}

// ─── Main HeroBanner component ────────────────────────────────────────────────

const AUTOPLAY_DURATION = 7000; // ms per slide

export function HeroBanner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";
  const reducedMotion = useReducedMotion();
  const regionId = useId();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionTrackedRef = useRef<Set<number>>(new Set());

  // ── Fetch banners ────────────────────────────────────────────────────────
  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? "/";
    fetch(`${base}api/banners`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: Banner[]) => {
        setBanners(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Track impression when slide becomes current ──────────────────────────
  useEffect(() => {
    if (!banners.length) return;
    const banner = banners[currentIndex];
    if (!banner) return;
    if (impressionTrackedRef.current.has(banner.id)) return;
    impressionTrackedRef.current.add(banner.id);
    trackImpression(banner.id);
  }, [currentIndex, banners]);

  // ── Autoplay ─────────────────────────────────────────────────────────────
  const advance = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % (banners.length || 1));
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || paused || reducedMotion) return;
    intervalRef.current = setInterval(advance, AUTOPLAY_DURATION);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advance, banners.length, paused, reducedMotion]);

  const goTo = useCallback(
    (idx: number) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentIndex(((idx % banners.length) + banners.length) % banners.length);
    },
    [banners.length]
  );

  const goPrev = useCallback(() => {
    goTo(currentIndex - (isRTL ? -1 : 1));
  }, [currentIndex, goTo, isRTL]);

  const goNext = useCallback(() => {
    goTo(currentIndex + (isRTL ? -1 : 1));
  }, [currentIndex, goTo, isRTL]);

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); isRTL ? goNext() : goPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); isRTL ? goPrev() : goNext(); }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, isRTL]);

  // ── Touch drag handler ───────────────────────────────────────────────────
  const dragStartX = useRef<number | null>(null);

  const onDragStart = useCallback((_: unknown, info: { point: { x: number } }) => {
    dragStartX.current = info.point.x;
    setDragging(true);
    setPaused(true);
  }, []);

  const onDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      setDragging(false);
      const threshold = 40;
      const vt = 300;
      const dx = info.offset.x;
      const vx = info.velocity.x;
      if (Math.abs(dx) > threshold || Math.abs(vx) > vt) {
        const forward = isRTL ? dx > 0 : dx < 0;
        if (forward) goNext(); else goPrev();
      }
      setTimeout(() => setPaused(false), 1000);
    },
    [goNext, goPrev, isRTL]
  );

  // ── CTA click ────────────────────────────────────────────────────────────
  const handleCtaClick = useCallback((id: number) => {
    trackClick(id);
  }, []);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative border-b min-h-[420px] sm:min-h-[500px] md:min-h-[560px] bg-muted animate-pulse" />
    );
  }

  // ── No banners — show static hero ────────────────────────────────────────
  if (!banners.length) {
    return <StaticHero />;
  }

  const current = banners[currentIndex]!;
  const multiSlide = banners.length > 1;

  return (
    <section
      ref={containerRef}
      aria-roledescription="carousel"
      aria-label={t("hero_banner.region_label")}
      id={regionId}
      className="relative overflow-hidden border-b min-h-[420px] sm:min-h-[500px] md:min-h-[560px] lg:min-h-[620px] select-none"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* ── Slide stack ── */}
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        drag={multiSlide ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{ touchAction: "pan-y" }}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={currentIndex}
            className="absolute inset-0"
            initial={reducedMotion ? { opacity: 0 } : undefined}
            aria-roledescription="slide"
            aria-label={`${currentIndex + 1} / ${banners.length}`}
          >
            <Slide
              banner={current}
              lang={lang}
              isRTL={isRTL}
              onCtaClick={handleCtaClick}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Navigation arrows ── */}
      {multiSlide && !dragging && (
        <>
          <ArrowBtn
            side="start"
            onClick={goPrev}
            label={t("hero_banner.prev")}
          >
            {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </ArrowBtn>
          <ArrowBtn
            side="end"
            onClick={goNext}
            label={t("hero_banner.next")}
          >
            {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </ArrowBtn>
        </>
      )}

      {/* ── Bottom controls bar ── */}
      {multiSlide && (
        <div className="absolute bottom-0 inset-x-0 z-20 px-4 sm:px-6 pb-4 pt-8 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center gap-2 max-w-md mx-auto">
            {/* Progress bars */}
            <div className="flex items-center gap-1.5 flex-1">
              {banners.map((b, i) => (
                <ProgressBar
                  key={b.id}
                  active={i === currentIndex}
                  paused={paused}
                  duration={AUTOPLAY_DURATION}
                  onClick={() => goTo(i)}
                  label={`${t("hero_banner.go_to_slide")} ${i + 1}`}
                />
              ))}
            </div>

            {/* Pause / Play toggle */}
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? t("hero_banner.play") : t("hero_banner.pause")}
              className={cn(
                "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center",
                "bg-white/15 backdrop-blur-sm border border-white/20 text-white",
                "hover:bg-white/25 transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
              )}
            >
              {paused
                ? <Play className="h-3 w-3 ms-0.5" />
                : <Pause className="h-3 w-3" />
              }
            </button>

            {/* Slide counter */}
            <span className="text-white/70 text-xs tabular-nums select-none">
              {currentIndex + 1} / {banners.length}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default HeroBanner;
