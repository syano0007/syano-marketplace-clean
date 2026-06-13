// @refresh reset
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL ?? "/";
const BANNER_INTERVAL_MS = 6_000;
const SLIDE_INTERVAL_MS  = 5_000;

/* ── DB Banner interface ──────────────────────────────────────────── */
interface Banner {
  id: number;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string | null;
  subtitleEn?: string | null;
  desktopImage: string;
  mobileImage?: string | null;
  backgroundColor?: string | null;
  ctaUrl?: string | null;
}

/* ── Floating card type ───────────────────────────────────────────── */
interface SlideCard {
  pos: React.CSSProperties;
  w: number;
  anim: string;
  label: string;
  price: string;
  stars?: number;
  avail?: string;
  img: string;
}

/* ── Built-in hero slides — shown as carousel when no DB banners ─── */
interface HeroSlide {
  id: string;
  img: string;
  badge: string;
  cards: [SlideCard, SlideCard, SlideCard];
}

const HERO_SLIDES: HeroSlide[] = [
  /* ① Electronics */
  {
    id: "electronics",
    img: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "خصم ٨٠٪",
    cards: [
      { pos:{ top:40,  right:24  }, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"عطر ديور سوفاج",   price:"75,000",   stars:5,
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ top:218, left:20   }, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"جاكيت جلد فاخر",   price:"175,000",
        img:"https://images.pexels.com/photos/1103832/pexels-photo-1103832.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ bottom:56,left:48  }, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"ساعة ذهبية فاخرة", price:"142,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=60" },
    ],
  },
  /* ② Fashion */
  {
    id: "fashion",
    img: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "خصم ٣٥٪",
    cards: [
      { pos:{ top:40,  right:24  }, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"فستان حرير شيفون",  price:"95,000",   stars:5,
        img:"https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ top:218, left:20   }, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"حقيبة جلدية فاخرة", price:"485,000",
        img:"https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ bottom:56,left:48  }, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"كعب ستيليتو مخملي", price:"185,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=60" },
    ],
  },
  /* ③ Perfumes & Beauty */
  {
    id: "perfumes",
    img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "عطور حصرية",
    cards: [
      { pos:{ top:40,  right:24  }, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"شانيل N°5 أو دو برفان", price:"320,000", stars:5,
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ top:218, left:20   }, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"كريم لانكوم الليلي",   price:"145,000",
        img:"https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ bottom:56,left:48  }, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"كريد أفينتوس رجالي",  price:"780,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" },
    ],
  },
  /* ④ Home & Living */
  {
    id: "home",
    img: "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "ديكور راقي",
    cards: [
      { pos:{ top:40,  right:24  }, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"طقم أريكة قطيفة ملكية", price:"4,500,000", stars:4,
        img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ top:218, left:20   }, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"ثريا كريستال فاخرة",   price:"2,800,000",
        img:"https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ bottom:56,left:48  }, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"سجادة بخارى حريرية",   price:"3,200,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=60" },
    ],
  },
  /* ⑤ Accessories & Jewelry */
  {
    id: "jewelry",
    img: "https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "مجوهرات",
    cards: [
      { pos:{ top:40,  right:24  }, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"خاتم ألماس 18 قيراط",  price:"12,800,000", stars:5,
        img:"https://images.pexels.com/photos/248077/pexels-photo-248077.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ top:218, left:20   }, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"سوار ذهب إيطالي",       price:"2,850,000",
        img:"https://images.pexels.com/photos/1413420/pexels-photo-1413420.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ bottom:56,left:48  }, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"قلادة لؤلؤ طبيعي",     price:"9,500,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=60" },
    ],
  },
];

/* ── Floating card component ──────────────────────────────────────── */
function FloatCard({ card }: { card: SlideCard }) {
  return (
    <div style={{
      position:"absolute",
      ...(card.pos as object),
      zIndex:10,
      width:card.w,
      background:"rgba(10,10,10,0.88)",
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      border:"1px solid rgba(255,255,255,0.09)",
      borderRadius:16,
      padding:"12px 16px",
      display:"flex",
      gap:12,
      alignItems:"center",
      boxShadow:"0 8px 32px rgba(0,0,0,0.7)",
      animation:card.anim,
    }}>
      <div style={{ flex:1, textAlign:"right" }}>
        <div style={{ fontSize:10, color:"#9ca3af", marginBottom:3 }}>{card.label}</div>
        <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom: card.stars || card.avail ? 5 : 0 }}>
          {card.price}{" "}
          <span style={{ color:"#10b981", fontSize:10, fontWeight:400 }}>ل.س</span>
        </div>
        {card.stars != null && (
          <div style={{ display:"flex", gap:1, justifyContent:"flex-end" }}>
            {Array.from({ length: card.stars }).map((_, i) => (
              <span key={i} style={{ fontSize:9, color:"#f59e0b" }}>★</span>
            ))}
          </div>
        )}
        {card.avail && (
          <div style={{ fontSize:10, color:"#10b981", display:"flex", alignItems:"center", gap:3, justifyContent:"flex-end" }}>
            {card.avail}
          </div>
        )}
      </div>
      <img
        src={card.img}
        alt=""
        loading="lazy"
        style={{ width:44, height:44, borderRadius:10, objectFit:"cover", flexShrink:0 }}
      />
    </div>
  );
}

/* ── Floating cards layer (fades as unit on slide change) ─────────── */
function FloatingCardsLayer({
  cards, badge, layerKey,
}: {
  cards: [SlideCard, SlideCard, SlideCard];
  badge: string;
  layerKey: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={layerKey}
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity:0 }}
        animate={{ opacity:1, transition:{ duration:0.55, delay:0.25 } }}
        exit={{ opacity:0, transition:{ duration:0.22 } }}
      >
        {cards.map((card, i) => <FloatCard key={i} card={card} />)}

        {/* Discount / category badge */}
        <div style={{
          position:"absolute", top:135, left:40, zIndex:10,
          background:"#10b981", color:"#fff",
          fontSize:13, fontWeight:800,
          padding:"6px 16px", borderRadius:100,
          boxShadow:"0 4px 16px rgba(16,185,129,0.4)",
        }}>
          {badge}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HeroV4 — Split hero layout:
   • RIGHT (RTL): badge · headline · CTAs · stats bar   [unchanged]
   • LEFT  (RTL): image carousel — DB banners or built-in slides
                  with per-slide animated floating product cards
   ═══════════════════════════════════════════════════════════════════ */
export function HeroV4() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";

  /* ── DB banners state ───────────────────────────────────────────── */
  const [banners, setBanners]     = useState<Banner[]>([]);
  const [loaded, setLoaded]       = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [resetKey, setResetKey]   = useState(0);

  /* ── Built-in slides state ──────────────────────────────────────── */
  const [slideIdx, setSlideIdx]   = useState(0);

  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Fetch DB banners ───────────────────────────────────────────── */
  useEffect(() => {
    fetch(`${BASE}api/banners`)
      .then(r => r.ok ? r.json() : [])
      .then((d: unknown) => setBanners(Array.isArray(d) ? (d as Banner[]) : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  /* ── Track impression ───────────────────────────────────────────── */
  const trackImpression = useCallback((idx: number) => {
    const b = banners[idx];
    if (!b) return;
    fetch(`${BASE}api/banners/${b.id}/impression`, { method:"POST" }).catch(() => {});
  }, [banners]);

  const goToBanner = useCallback((idx: number) => {
    const n = banners.length;
    const next = ((idx % n) + n) % n;
    setBannerIdx(next);
    setResetKey(k => k + 1);
    trackImpression(next);
  }, [banners.length, trackImpression]);

  const goBannerPrev = useCallback(() => goToBanner(bannerIdx - 1), [bannerIdx, goToBanner]);
  const goBannerNext = useCallback(() => goToBanner(bannerIdx + 1), [bannerIdx, goToBanner]);

  useEffect(() => { trackImpression(0); }, [trackImpression]);

  /* ── DB banners auto-play ───────────────────────────────────────── */
  useEffect(() => {
    if (banners.length <= 1 || bannerPaused) return;
    const id = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), BANNER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [banners.length, bannerPaused, resetKey]);

  /* ── Built-in slides auto-play ──────────────────────────────────── */
  useEffect(() => {
    if (banners.length > 0 || bannerPaused) return; // banners take priority
    const id = setInterval(() => setSlideIdx(i => (i + 1) % HERO_SLIDES.length), SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [banners.length, bannerPaused]);

  /* ── Keyboard navigation ────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current?.matches(":hover")) return;
      if (banners.length > 0) {
        if (e.key === "ArrowLeft")  isRTL ? goBannerNext() : goBannerPrev();
        if (e.key === "ArrowRight") isRTL ? goBannerPrev() : goBannerNext();
      } else {
        if (e.key === "ArrowLeft")  setSlideIdx(i => isRTL ? (i + 1) % HERO_SLIDES.length : (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
        if (e.key === "ArrowRight") setSlideIdx(i => isRTL ? (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length : (i + 1) % HERO_SLIDES.length);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [banners.length, goBannerPrev, goBannerNext, isRTL]);

  /* ── Touch swipe ────────────────────────────────────────────────── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) {
      if (banners.length > 0) {
        isRTL ? (diff > 0 ? goBannerPrev() : goBannerNext()) : (diff > 0 ? goBannerNext() : goBannerPrev());
      } else {
        setSlideIdx(i => diff > 0
          ? (isRTL ? (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length : (i + 1) % HERO_SLIDES.length)
          : (isRTL ? (i + 1) % HERO_SLIDES.length : (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length),
        );
      }
    }
    touchStartX.current = null;
  }, [banners.length, goBannerPrev, goBannerNext, isRTL]);

  /* ── Derived values ─────────────────────────────────────────────── */
  const hasBanners      = banners.length > 1;
  const bgImg           = loaded && banners.length > 0 ? banners[bannerIdx]?.desktopImage ?? null : null;
  const showBuiltin     = loaded && banners.length === 0;
  const currentSlide    = HERO_SLIDES[slideIdx];
  const cardsKey        = bgImg
    ? `banner-${bannerIdx}`          // changes per banner
    : `slide-${slideIdx}`;           // changes per built-in slide
  const activeCards: [SlideCard, SlideCard, SlideCard] = bgImg
    ? [
        { pos:{top:40,right:24}, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
          label:"عطر ديور سوفاج",   price:"75,000",   stars:5,
          img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" },
        { pos:{top:218,left:20}, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
          label:"جاكيت جلد فاخر",   price:"175,000",
          img:"https://images.pexels.com/photos/1103832/pexels-photo-1103832.jpeg?auto=compress&cs=tinysrgb&w=60" },
        { pos:{bottom:56,left:48}, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
          label:"ساعة ذهبية فاخرة", price:"142,000", avail:"● متوفر الآن",
          img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=60" },
      ]
    : currentSlide.cards;
  const activeBadge = bgImg ? "خصم ٨٠٪" : currentSlide.badge;

  const STATS = [
    { n:"+12,000", l: isRTL ? "عميل راضٍ"    : "Happy Customers"  },
    { n:"+25,000", l: isRTL ? "منتج فاعل"    : "Active Products"  },
    { n:"+500",    l: isRTL ? "متاجر نشطة"   : "Active Stores"    },
  ];

  return (
    <section className="border-b overflow-hidden">
      {/* ── Keyframes + theme tokens ─────────────────────────────── */}
      <style>{`
        @keyframes heroFloatA  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)}  }
        @keyframes heroFloatB  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)}  }
        @keyframes heroFloatC  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
        @keyframes heroKenBurns{ 0%{transform:scale(1) translate(0%,0%)} 50%{transform:scale(1.04) translate(-0.8%,0.5%)} 100%{transform:scale(1) translate(0%,0%)} }
        .hero-v4-panel    { background: hsl(var(--background)); }
        .hero-v4-blend-r  { background: linear-gradient(to left,  hsl(var(--background)) 0%, transparent 100%); }
        .hero-v4-blend-l  { background: linear-gradient(to right, hsl(var(--background)) 0%, transparent 100%); }
        .hero-v4-headline { color: hsl(var(--foreground)); }
        .hero-v4-sub      { color: hsl(var(--muted-foreground)); }
        .hero-v4-stat-n   { color: hsl(var(--foreground)); }
        .hero-v4-stat-l   { color: hsl(var(--muted-foreground)); }
        .hero-v4-divider  { border-color: hsl(var(--border)); }
        .hero-v4-glow     { background: radial-gradient(circle, rgba(16,185,129,0.055) 0%, transparent 70%); }
        .dark .hero-v4-glow { background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%); }
      `}</style>

      {/* ── Main hero area ───────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative overflow-hidden select-none"
        style={{ height:"clamp(420px,60vh,640px)" }}
        onMouseEnter={() => setBannerPaused(true)}
        onMouseLeave={() => setBannerPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* ══ IMAGE PANEL (visual LEFT in RTL) ════════════════════ */}
        <div
          className="absolute inset-y-0"
          style={{ [isRTL ? "left" : "right"]:0, width:"56%", background:"#0a0a0a" }}
        >
          {/* ── DB banner image (priority) ────────────────────── */}
          <AnimatePresence mode="sync">
            {bgImg && (
              <motion.img
                key={`banner-${bannerIdx}`}
                src={bgImg}
                alt=""
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ animation:"heroKenBurns 28s ease-in-out infinite" }}
                initial={{ opacity:0 }}
                animate={{ opacity:1, transition:{ duration:0.7, ease:"easeOut" } }}
                exit={{ opacity:0, transition:{ duration:0.4 } }}
              />
            )}
          </AnimatePresence>

          {/* ── Built-in carousel (fallback when no DB banners) ── */}
          {showBuiltin && (
            <AnimatePresence mode="sync">
              <motion.img
                key={`slide-${slideIdx}`}
                src={currentSlide.img}
                alt=""
                loading={slideIdx === 0 ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ animation:"heroKenBurns 28s ease-in-out infinite" }}
                initial={{ opacity:0 }}
                animate={{ opacity:1, transition:{ duration:0.7, ease:"easeOut" } }}
                exit={{ opacity:0, transition:{ duration:0.45 } }}
              />
            </AnimatePresence>
          )}

          {/* Dark overlay — deepen image so cards are legible */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />

          {/* Bottom ground-plane gradient */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
            style={{ background:"linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)" }}
          />

          {/* Blend gradient — merges image into text panel */}
          <div
            className={`absolute inset-y-0 pointer-events-none ${isRTL ? "hero-v4-blend-r" : "hero-v4-blend-l"}`}
            style={{ [isRTL ? "right" : "left"]:0, width:"45%" }}
          />

          {/* ── Floating product cards — animated per slide/banner ── */}
          {(bgImg || showBuiltin) && (
            <div className="absolute inset-0 hidden md:block">
              <FloatingCardsLayer
                cards={activeCards}
                badge={activeBadge}
                layerKey={cardsKey}
              />
            </div>
          )}

          {/* ── Dot indicators ─────────────────────────────────── */}
          {hasBanners && (
            <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center gap-1.5 pointer-events-auto">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToBanner(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === bannerIdx
                      ? "w-6 h-[3.5px] bg-primary"
                      : "w-[3.5px] h-[3.5px] bg-white/30 hover:bg-white/55",
                  )}
                />
              ))}
            </div>
          )}
          {showBuiltin && HERO_SLIDES.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center gap-1.5 pointer-events-auto">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === slideIdx
                      ? "w-6 h-[3.5px] bg-primary"
                      : "w-[3.5px] h-[3.5px] bg-white/30 hover:bg-white/55",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* ══ TEXT PANEL (visual RIGHT in RTL) — UNCHANGED ════════ */}
        <div
          className="hero-v4-panel absolute inset-y-0 flex flex-col justify-center z-10"
          style={{ [isRTL ? "right" : "left"]:0, width:"48%" }}
        >
          {/* Ambient green glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="hero-v4-glow" style={{
              position:"absolute", top:"-30%", right:"20%",
              width:"400px", height:"400px", borderRadius:"50%",
              pointerEvents:"none",
            }} />
          </div>

          <div
            className="relative z-10 flex flex-col gap-4 sm:gap-5"
            style={{
              padding:"clamp(24px,4vw,52px) clamp(20px,4vw,56px)",
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {/* Eyebrow badge */}
            <div>
              <span style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"5px 14px", borderRadius:100,
                border:"1px solid rgba(16,185,129,0.4)",
                color:"#10b981", fontSize:11, fontWeight:600,
                background:"rgba(16,185,129,0.06)",
              }}>
                ✦ {isRTL ? "سوق سوريا الرقمي" : "Syria's Premier Marketplace"}
              </span>
            </div>

            {/* Headline */}
            <h1 className="hero-v4-headline" style={{
              margin:0,
              fontSize:"clamp(26px,3.2vw,58px)",
              fontWeight:900,
              lineHeight:1.06,
              letterSpacing:"-1.5px",
            }}>
              {isRTL ? (
                <>اكتشف آلاف المنتجات<br />من <span style={{color:"#10b981"}}>المتاجر السورية</span></>
              ) : (
                <>Discover Thousands<br />of <span style={{color:"#10b981"}}>Syrian Products.</span></>
              )}
            </h1>

            {/* Subtitle */}
            <p className="hero-v4-sub" style={{ margin:0, fontSize:13, lineHeight:1.85, maxWidth:360 }}>
              {isRTL
                ? "منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة تجمع أفضل المتاجر السورية."
                : "Diverse products, trusted sellers, and a modern shopping experience."}
            </p>

            {/* CTA buttons */}
            <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <Link
                href="/products"
                style={{
                  padding:"13px 28px", borderRadius:12,
                  background:"#10b981", color:"#fff",
                  fontSize:14, fontWeight:700,
                  display:"inline-flex", alignItems:"center", gap:7,
                  textDecoration:"none",
                  boxShadow:"0 4px 20px rgba(16,185,129,0.28)",
                  transition:"background 0.2s, transform 0.15s",
                }}
              >
                {isRTL ? "تسوق الآن" : "Shop Now"}
                <svg style={{ width:14, height:14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d={isRTL ? "M10 19l-7-7m0 0l7-7m-7 7h18" : "M14 5l7 7m0 0l-7 7m7-7H3"} />
                </svg>
              </Link>
              <Link
                href="/stores"
                style={{
                  padding:"13px 28px", borderRadius:12,
                  background:"transparent", color:"#d1d5db",
                  fontSize:14, border:"1px solid rgba(255,255,255,0.12)",
                  textDecoration:"none", transition:"border-color 0.2s, color 0.2s",
                }}
              >
                {isRTL ? "استكشف المتاجر" : "Browse Stores"}
              </Link>
            </div>

            {/* Stats bar */}
            <div className="hero-v4-divider" style={{
              borderTopWidth:1, borderTopStyle:"solid",
              paddingTop:22, marginTop:2,
              display:"flex", alignItems:"flex-start",
            }}>
              {STATS.map((s, i) => (
                <div
                  key={s.l}
                  className={i > 0 ? "hero-v4-divider" : ""}
                  style={{
                    flex:1,
                    textAlign: isRTL ? "right" : "left",
                    paddingInlineEnd: i < 2 ? 20 : 0,
                    paddingInlineStart: i > 0 ? 20 : 0,
                    borderInlineStartWidth: i > 0 ? 1 : 0,
                    borderInlineStartStyle:"solid",
                  }}
                >
                  <div className="hero-v4-stat-n" style={{ fontSize:"clamp(20px,2.2vw,28px)", fontWeight:900, lineHeight:1, whiteSpace:"nowrap" }}>{s.n}</div>
                  <div className="hero-v4-stat-l" style={{ fontSize:11, marginTop:4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ Navigation arrows — DB banners only ════════════════ */}
        {hasBanners && (
          <>
            <button
              onClick={goBannerPrev}
              aria-label="Previous slide"
              className="absolute top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-black/75 transition-colors"
              style={{ [isRTL ? "right" : "left"]:"calc(44% + 10px)" }}
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <button
              onClick={goBannerNext}
              aria-label="Next slide"
              className="absolute top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-black/75 transition-colors"
              style={{ [isRTL ? "left" : "right"]:12 }}
            >
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </>
        )}

        {/* Mobile: dark overlay over full image */}
        <div
          className="absolute inset-0 md:hidden pointer-events-none"
          style={{ background:"rgba(0,0,0,0.55)" }}
        />
      </div>
    </section>
  );
}
