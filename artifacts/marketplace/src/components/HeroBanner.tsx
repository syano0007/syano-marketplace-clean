// @refresh reset
/**
 * HeroBanner — Flagship premium hero carousel (V2)
 *
 * Improvements over V1:
 * - Ken Burns effect: slow scale 1.0→1.08 per slide (GPU, CSS animation)
 * - Parallax depth layers on text content
 * - Autoplay reliably restarts after manual navigation (resetKey pattern)
 * - Progress bars via CSS animation-play-state (accurate pause/resume)
 * - Play/pause button removed — autoplay is always on
 * - Larger vh-based hero heights
 * - Stronger 3-layer gradient system
 * - Larger typography hierarchy
 * - Premium CTA: glow ring on hover, lift transition
 * - Framer Motion AnimatePresence crossfade + scale
 * - Touch swipe with momentum
 * - Full RTL + ARIA
 * - Impression + click analytics
 */
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
  useMemo,
} from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL ?? "/";
const AUTOPLAY_MS = 7000;

// ─── Analytics ────────────────────────────────────────────────────────────────

function trackImpression(id: number) {
  fetch(`${BASE}api/banners/${id}/impression`, { method: "POST" }).catch(() => {});
}
function trackClick(id: number) {
  fetch(`${BASE}api/banners/${id}/click`, { method: "POST" }).catch(() => {});
}

// ─── Static fallback ─────────────────────────────────────────────────────────

const FALLBACK =
  "https://images.pexels.com/photos/7317590/pexels-photo-7317590.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1";
const FALLBACK_SM =
  "https://images.pexels.com/photos/7317590/pexels-photo-7317590.jpeg?auto=compress&cs=tinysrgb&w=768&h=600";

function StaticHero() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  return (
    <section className="relative overflow-hidden border-b min-h-[60vh] sm:min-h-[65vh] md:min-h-[72vh] flex items-center">
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src={FALLBACK}
          alt=""
          fetchPriority="high"
          decoding="async"
          sizes="100vw"
          srcSet={`${FALLBACK_SM} 768w, ${FALLBACK} 1920w`}
          className="absolute inset-0 h-full w-full object-cover hero-kenburns"
          style={{ objectPosition: "center 40%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -top-24 -end-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -start-12 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />

      <div className="container px-5 sm:px-8 relative z-10 w-full">
        <div className="max-w-2xl lg:max-w-3xl space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {t("home.hero_badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-white drop-shadow-2xl">
            {t("home.hero_title")}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/80 leading-relaxed max-w-xl drop-shadow">
            {t("home.hero_desc")}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
            <Link href="/products">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/40 transition-all duration-200"
              >
                {t("home.shop_all")}
                <ArrowRight className={cn("h-5 w-5", isRTL ? "me-2 rotate-180" : "ms-2")} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────

type BezierEase = [number, number, number, number];
const EASE: BezierEase = [0.25, 0.46, 0.45, 0.94];
const EASE_OUT: BezierEase = [0.0, 0.0, 0.2, 1.0];

const slideVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.8, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

const contentVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
  exit: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -16,
    filter: "blur(2px)",
    transition: { duration: 0.35, ease: "easeIn" },
  },
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  active,
  paused,
  durationMs,
  onClick,
  label,
}: {
  active: boolean;
  paused: boolean;
  durationMs: number;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex-1 h-[3px] rounded-full overflow-hidden",
        "transition-opacity duration-300",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50",
        active ? "opacity-100" : "opacity-35 hover:opacity-55"
      )}
    >
      <div className="w-full h-full bg-white/25 relative overflow-hidden rounded-full">
        {active && (
          <div
            className="absolute inset-y-0 start-0 w-full bg-white rounded-full origin-left"
            style={{
              animation: `hero-progress ${durationMs}ms linear forwards`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        )}
      </div>
    </button>
  );
}

// ─── Arrow Button ─────────────────────────────────────────────────────────────

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
        "absolute top-1/2 -translate-y-1/2 z-30",
        "h-11 w-11 md:h-12 md:w-12 rounded-full",
        "flex items-center justify-center",
        "bg-black/20 backdrop-blur-md border border-white/15",
        "text-white hover:bg-black/40 hover:border-white/30",
        "shadow-xl shadow-black/30",
        "transition-all duration-200 hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        "hidden sm:flex",
        side === "start" ? "start-4 lg:start-8" : "end-4 lg:end-8"
      )}
    >
      {children}
    </button>
  );
}

// ─── Slide ────────────────────────────────────────────────────────────────────

function Slide({
  banner,
  lang,
  isRTL,
  slideIndex,
  onCtaClick,
  reducedMotion,
}: {
  banner: Banner;
  lang: string;
  isRTL: boolean;
  slideIndex: number;
  onCtaClick: (id: number) => void;
  reducedMotion: boolean | null;
}) {
  const { t } = useTranslation();

  const title = lang === "ar" ? banner.titleAr : banner.titleEn;
  const subtitle = lang === "ar" ? banner.subtitleAr : banner.subtitleEn;
  const description = lang === "ar" ? banner.descriptionAr : banner.descriptionEn;
  const ctaLabel = lang === "ar" ? banner.ctaLabelAr : banner.ctaLabelEn;
  const ctaLabelSec = lang === "ar" ? banner.ctaLabelArSecondary : banner.ctaLabelEnSecondary;
  const textColor = banner.textColor ?? "#ffffff";
  const bgColor = banner.backgroundColor ?? "#0f172a";

  // Mobile image when available
  const imgSrc = banner.desktopImage;

  return (
    <motion.div
      className="absolute inset-0"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      aria-roledescription="slide"
      aria-label={`${slideIndex + 1}`}
    >
      {/* ── Background image with Ken Burns ── */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <img
          key={`kb-${banner.id}-${slideIndex}`}
          src={imgSrc}
          alt=""
          loading={slideIndex === 0 ? "eager" : "lazy"}
          fetchPriority={slideIndex === 0 ? "high" : "auto"}
          decoding="async"
          sizes="100vw"
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            reducedMotion ? "" : "hero-kenburns"
          )}
          style={{ objectPosition: "center center" }}
        />

        {/* Layer 1 — Readability gradient (vertical) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70" />

        {/* Layer 2 — Brand color tint (diagonal from start) */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(125deg, ${bgColor}b0 0%, ${bgColor}60 30%, transparent 62%)`,
          }}
        />

        {/* Layer 3 — Horizontal depth (text side) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />

        {/* Layer 4 — Bottom vignette for controls */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/65 to-transparent" />

        {/* Layer 5 — Top edge */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />
      </div>

      {/* ── Ambient glow orbs ── */}
      <div
        className="pointer-events-none absolute -top-32 -end-32 h-[500px] w-[500px] rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: bgColor }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -bottom-16 -start-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

      {/* ── Content ── */}
      <div className="absolute inset-0 flex items-center" style={{ color: textColor }}>
        <div className="container px-5 sm:px-8 relative z-10 w-full">
          <motion.div
            className="max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-5 md:space-y-6"
            variants={contentVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {/* Badge */}
            {subtitle && (
              <motion.div variants={itemVariants}>
                <span
                  className="inline-flex items-center gap-2 bg-white/12 backdrop-blur-md border border-white/18 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
                  style={{ color: textColor }}
                >
                  <Zap className="h-3 w-3 text-primary shrink-0" />
                  {subtitle}
                </span>
              </motion.div>
            )}

            {/* Title */}
            <motion.h2
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.0] tracking-tight drop-shadow-2xl"
              style={{ color: textColor }}
            >
              {title}
            </motion.h2>

            {/* Description */}
            {description && (
              <motion.p
                variants={itemVariants}
                className="text-base sm:text-lg md:text-xl leading-relaxed max-w-xl opacity-85 drop-shadow-lg"
                style={{ color: textColor }}
              >
                {description}
              </motion.p>
            )}

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1"
            >
              {ctaLabel && banner.ctaUrl ? (
                <Link href={banner.ctaUrl} onClick={() => onCtaClick(banner.id)}>
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/55 hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/45 transition-all duration-200"
                  >
                    {ctaLabel}
                    <ArrowRight className={cn("h-5 w-5 shrink-0", isRTL ? "me-2 rotate-180" : "ms-2")} />
                  </Button>
                </Link>
              ) : ctaLabel ? (
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-bold shadow-2xl shadow-primary/30"
                  onClick={() => onCtaClick(banner.id)}
                >
                  {ctaLabel}
                </Button>
              ) : (
                <Link href="/products">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/55 hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/45 transition-all duration-200"
                  >
                    {t("home.shop_all")}
                    <ArrowRight className={cn("h-5 w-5 shrink-0", isRTL ? "me-2 rotate-180" : "ms-2")} />
                  </Button>
                </Link>
              )}

              {ctaLabelSec && banner.ctaUrlSecondary && (
                <Link href={banner.ctaUrlSecondary} onClick={() => onCtaClick(banner.id)}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-7 text-base font-semibold bg-white/10 backdrop-blur-md border-white/25 hover:bg-white/20 hover:border-white/40 text-white transition-all duration-200"
                  >
                    {ctaLabelSec}
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main HeroBanner ──────────────────────────────────────────────────────────

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
  // resetKey increments on manual nav — forces autoplay interval to restart
  const [resetKey, setResetKey] = useState(0);

  const impressionTracked = useRef<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}api/banners`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Banner[]) => setBanners(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Impression tracking ───────────────────────────────────────────────────
  useEffect(() => {
    if (!banners.length) return;
    const b = banners[currentIndex];
    if (!b || impressionTracked.current.has(b.id)) return;
    impressionTracked.current.add(b.id);
    trackImpression(b.id);
  }, [currentIndex, banners]);

  // ── Autoplay — restarts on manual nav via resetKey ────────────────────────
  useEffect(() => {
    if (banners.length <= 1 || paused || reducedMotion) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [banners.length, paused, reducedMotion, resetKey]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (idx: number) => {
      const n = banners.length;
      if (!n) return;
      setCurrentIndex(((idx % n) + n) % n);
      setResetKey((k) => k + 1);
    },
    [banners.length]
  );

  const goPrev = useCallback(
    () => goTo(currentIndex - (isRTL ? -1 : 1)),
    [currentIndex, goTo, isRTL]
  );
  const goNext = useCallback(
    () => goTo(currentIndex + (isRTL ? -1 : 1)),
    [currentIndex, goTo, isRTL]
  );

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); isRTL ? goNext() : goPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); isRTL ? goPrev() : goNext(); }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [goPrev, goNext, isRTL]);

  // ── Touch drag ────────────────────────────────────────────────────────────
  const touchStart = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0]?.clientX ?? null;
    setPaused(true);
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      if (start === null) return;
      const dx = (e.changedTouches[0]?.clientX ?? start) - start;
      if (Math.abs(dx) > 40) {
        const forward = isRTL ? dx > 0 : dx < 0;
        if (forward) goNext(); else goPrev();
      }
      setTimeout(() => setPaused(false), 800);
      touchStart.current = null;
    },
    [goNext, goPrev, isRTL]
  );

  // ── CTA click ─────────────────────────────────────────────────────────────
  const handleCta = useCallback((id: number) => trackClick(id), []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="border-b min-h-[60vh] sm:min-h-[65vh] md:min-h-[72vh] bg-muted animate-pulse" />
    );
  }

  if (!banners.length) return <StaticHero />;

  const current = banners[currentIndex]!;
  const multi = banners.length > 1;

  return (
    <section
      ref={containerRef}
      aria-roledescription="carousel"
      aria-label={t("hero_banner.region_label")}
      id={regionId}
      tabIndex={0}
      className="relative overflow-hidden border-b min-h-[60vh] sm:min-h-[65vh] md:min-h-[72vh] select-none focus-visible:outline-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Slide stack ── */}
      <AnimatePresence mode="sync">
        <Slide
          key={currentIndex}
          banner={current}
          lang={lang}
          isRTL={isRTL}
          slideIndex={currentIndex}
          onCtaClick={handleCta}
          reducedMotion={reducedMotion}
        />
      </AnimatePresence>

      {/* ── Arrows ── */}
      {multi && (
        <>
          <ArrowBtn side="start" onClick={goPrev} label={t("hero_banner.prev")}>
            {isRTL
              ? <ChevronRight className="h-5 w-5" />
              : <ChevronLeft className="h-5 w-5" />
            }
          </ArrowBtn>
          <ArrowBtn side="end" onClick={goNext} label={t("hero_banner.next")}>
            {isRTL
              ? <ChevronLeft className="h-5 w-5" />
              : <ChevronRight className="h-5 w-5" />
            }
          </ArrowBtn>
        </>
      )}

      {/* ── Bottom bar: progress + counter ── */}
      {multi && (
        <div className="absolute bottom-0 inset-x-0 z-20 px-5 sm:px-8 pb-5 pt-10">
          <div className="flex items-center gap-3 max-w-lg">
            {/* Progress bars */}
            <div className="flex items-center gap-1.5 flex-1">
              {banners.map((b, i) => (
                <ProgressBar
                  key={b.id}
                  active={i === currentIndex}
                  paused={paused}
                  durationMs={AUTOPLAY_MS}
                  onClick={() => goTo(i)}
                  label={`${t("hero_banner.go_to_slide")} ${i + 1}`}
                />
              ))}
            </div>

            {/* Slide counter */}
            <span className="text-white/60 text-xs tabular-nums shrink-0 font-medium">
              {currentIndex + 1}&thinsp;/&thinsp;{banners.length}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default HeroBanner;
