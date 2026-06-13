// @refresh reset
import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  desktopImage: string;
  mobileImage?: string | null;
  backgroundColor?: string | null;
  ctaUrl?: string | null;
}

/* ── Product mosaic images — fallback when no banner images ──────── */
const MOSAIC_PRODUCTS = [
  {
    src: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
    style: { left: "28%", top: "8%", width: "210px", height: "210px", transform: "rotate(-5deg)", zIndex: 6, filter: "brightness(0.92) contrast(1.08)" },
  },
  {
    src: "https://images.pexels.com/photos/1034069/pexels-photo-1034069.jpeg?auto=compress&cs=tinysrgb&w=280&h=280&fit=crop",
    style: { left: "7%", top: "54%", width: "155px", height: "155px", transform: "rotate(8deg)", zIndex: 4, filter: "brightness(0.9) contrast(1.1)" },
  },
  {
    src: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=200&h=285&fit=crop",
    style: { left: "2%", top: "7%", width: "98px", height: "145px", transform: "rotate(-14deg)", zIndex: 3, filter: "brightness(0.82) contrast(1.05) saturate(0.9)" },
  },
  {
    src: "https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=320&h=230&fit=crop",
    style: { left: "52%", top: "60%", width: "162px", height: "116px", transform: "rotate(6deg)", zIndex: 3, filter: "brightness(0.88) contrast(1.1)" },
  },
  {
    src: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=360&h=220&fit=crop",
    style: { left: "17%", top: "72%", width: "195px", height: "119px", transform: "rotate(-4deg)", zIndex: 2, filter: "brightness(0.72) contrast(1.08) saturate(0.88)" },
  },
  {
    src: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=220&h=340&fit=crop",
    style: { left: "66%", top: "5%", width: "105px", height: "168px", transform: "rotate(12deg)", zIndex: 5, filter: "brightness(0.9) contrast(1.05)" },
  },
] as const;

/* ── Floating product cards — always shown over image panel ────────── */
const FLOAT_CARDS = [
  {
    id: "fc1",
    label: "عطر ديور سوفاج",
    sub: "75,000 ل.س",
    stars: 5,
    img: "https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60",
    posStyle: { top: 40, right: 24 } as React.CSSProperties,
    animDelay: "0s",
    animDur: "5.5s",
  },
  {
    id: "fc2",
    label: "جاكيت جلد بريميوم",
    sub: "38,500 ل.س",
    stars: 4,
    img: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=60",
    posStyle: { top: 218, left: 20 } as React.CSSProperties,
    animDelay: "1.8s",
    animDur: "7s",
  },
  {
    id: "fc3",
    label: "ساعة فاخرة",
    sub: "142,000 ل.س",
    badge: "● متوفر الآن",
    img: "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=60",
    posStyle: { bottom: 56, left: 48 } as React.CSSProperties,
    animDelay: "3.5s",
    animDur: "6.5s",
  },
] as const;

/* ── ProductMosaic — fallback visual panel ───────────────────────── */
const ProductMosaic = memo(function ProductMosaic({ isRTL }: { isRTL: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={isRTL ? undefined : { transform: "scaleX(-1)" }}
    >
      <div
        className="absolute pointer-events-none"
        style={{ left: "26%", bottom: "6%", width: "180px", height: "40px", background: "radial-gradient(ellipse,rgba(16,185,129,0.75) 0%,transparent 80%)", filter: "blur(14px)", borderRadius: "50%" }}
      />
      {MOSAIC_PRODUCTS.map((p, i) => (
        <img
          key={i}
          src={p.src}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className="absolute rounded-2xl object-cover"
          style={{
            left: p.style.left, top: p.style.top,
            width: p.style.width, height: p.style.height,
            zIndex: p.style.zIndex,
            transform: isRTL ? p.style.transform : `scaleX(-1) ${p.style.transform}`,
            filter: p.style.filter,
            boxShadow: "0 24px 64px rgba(0,0,0,0.95), 0 8px 24px rgba(0,0,0,0.7)",
          }}
        />
      ))}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   HeroV4 — Amazon/Noon/Trendyol split layout:
   • RIGHT (RTL): fixed text — badge, headline, CTAs, stats bar
   • LEFT  (RTL): rotating banner image (or product mosaic fallback)
                  with floating product cards always visible
   ═══════════════════════════════════════════════════════════════════ */
export function HeroV4() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = i18n.dir() === "rtl";

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${BASE}api/banners`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: unknown) => setBanners(Array.isArray(d) ? (d as Banner[]) : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const trackImpression = useCallback((idx: number) => {
    const b = banners[idx];
    if (!b) return;
    fetch(`${BASE}api/banners/${b.id}/impression`, { method: "POST" }).catch(() => {});
  }, [banners]);

  const goTo = useCallback((idx: number) => {
    const n = banners.length;
    const next = ((idx % n) + n) % n;
    setCurrent(next);
    setResetKey((k) => k + 1);
    trackImpression(next);
  }, [banners.length, trackImpression]);

  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);
  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => { trackImpression(0); }, [trackImpression]);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(() => setCurrent((i) => (i + 1) % banners.length), BANNER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [banners.length, paused, resetKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current?.matches(":hover")) return;
      if (e.key === "ArrowLeft")  { isRTL ? goNext() : goPrev(); }
      if (e.key === "ArrowRight") { isRTL ? goPrev() : goNext(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext, isRTL]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) {
      isRTL ? (diff > 0 ? goPrev() : goNext()) : (diff > 0 ? goNext() : goPrev());
    }
    touchStartX.current = null;
  }, [goPrev, goNext, isRTL]);

  const bgImg = loaded && banners.length > 0 ? banners[current]?.desktopImage ?? null : null;
  const hasBanners = banners.length > 1;

  const STATS = [
    { n: "+12,000", l: isRTL ? "عميل راضٍ"    : "Happy Customers"  },
    { n: "+25,000", l: isRTL ? "منتج فاعل"    : "Active Products"  },
    { n: "+500",    l: isRTL ? "متاجر نشطة"   : "Active Stores"    },
  ];

  return (
    <section className="border-b bg-black overflow-hidden">
      {/* Floating card keyframes */}
      <style>{`
        @keyframes heroFloatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes heroFloatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes heroFloatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
        @keyframes heroKenBurns { 0%{transform:scale(1) translate(0%,0%)} 50%{transform:scale(1.04) translate(-0.8%,0.5%)} 100%{transform:scale(1) translate(0%,0%)} }
      `}</style>

      {/* ── Main hero area ───────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative overflow-hidden select-none"
        style={{ height: "clamp(420px,60vh,640px)" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* ══ IMAGE PANEL (visual LEFT in RTL) ═══════════════════════ */}
        <div
          className="absolute inset-y-0"
          style={{
            [isRTL ? "left" : "right"]: 0,
            width: "56%",
            background: "#0a0a0a",
          }}
        >
          {/* Rotating banner image OR product mosaic fallback */}
          <AnimatePresence mode="sync">
            {bgImg ? (
              <motion.img
                key={`banner-${current}`}
                src={bgImg}
                alt=""
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ animation: "heroKenBurns 28s ease-in-out infinite" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.7, ease: "easeOut" } }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
              />
            ) : (
              <motion.div
                key="mosaic"
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.5 } }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-950" />
                <ProductMosaic isRTL={isRTL} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dark overlay — deepen image so cards + text are legible */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />

          {/* Bottom gradient — ground plane effect */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
               style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)" }} />

          {/* Blend gradient — merges image into text panel on the right/left junction */}
          <div
            className="absolute inset-y-0 pointer-events-none"
            style={{
              [isRTL ? "right" : "left"]: 0,
              width: "45%",
              background: isRTL
                ? "linear-gradient(to left, #080808 0%, rgba(8,8,8,0.82) 30%, rgba(8,8,8,0.5) 55%, transparent 100%)"
                : "linear-gradient(to right, #080808 0%, rgba(8,8,8,0.82) 30%, rgba(8,8,8,0.5) 55%, transparent 100%)",
            }}
          />

          {/* ── Floating product cards ─────────────────────────────── */}
          <div className="absolute inset-0 hidden md:block pointer-events-none">
            {/* Card 1 — top near-junction */}
            <div style={{
              position:"absolute", top:40, right:24, zIndex:10,
              background:"rgba(10,10,10,0.88)", backdropFilter:"blur(20px)",
              border:"1px solid rgba(255,255,255,0.09)", borderRadius:16,
              padding:"12px 16px", display:"flex", gap:12, alignItems:"center",
              width:220, boxShadow:"0 8px 32px rgba(0,0,0,0.7)",
              animation:"heroFloatC 5.5s ease-in-out infinite",
            }}>
              <div style={{ flex:1, textAlign:"right" }}>
                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:3 }}>عطر ديور سوفاج</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:5 }}>
                  75,000 <span style={{ color:"#10b981", fontSize:10, fontWeight:400 }}>ل.س</span>
                </div>
                <div style={{ display:"flex", gap:1, justifyContent:"flex-end" }}>
                  {Array.from({length:5}).map((_,i)=><span key={i} style={{fontSize:9,color:"#f59e0b"}}>★</span>)}
                </div>
              </div>
              <img src="https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width:44, height:44, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
            </div>

            {/* Card 2 — mid far-edge */}
            <div style={{
              position:"absolute", top:218, left:20, zIndex:10,
              background:"rgba(10,10,10,0.88)", backdropFilter:"blur(20px)",
              border:"1px solid rgba(255,255,255,0.09)", borderRadius:16,
              padding:"12px 16px", display:"flex", gap:12, alignItems:"center",
              width:192, boxShadow:"0 8px 32px rgba(0,0,0,0.7)",
              animation:"heroFloatB 7s 1.8s ease-in-out infinite",
            }}>
              <div style={{ flex:1, textAlign:"right" }}>
                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:3 }}>جاكيت جلد فاخر</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>
                  175,000 <span style={{ color:"#10b981", fontSize:10, fontWeight:400 }}>ل.س</span>
                </div>
              </div>
              <img src="https://images.pexels.com/photos/1103832/pexels-photo-1103832.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width:44, height:44, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
            </div>

            {/* Card 3 — bottom with green availability badge */}
            <div style={{
              position:"absolute", bottom:56, left:48, zIndex:10,
              background:"rgba(10,10,10,0.88)", backdropFilter:"blur(20px)",
              border:"1px solid rgba(255,255,255,0.09)", borderRadius:16,
              padding:"12px 16px", display:"flex", gap:12, alignItems:"center",
              width:232, boxShadow:"0 8px 32px rgba(0,0,0,0.7)",
              animation:"heroFloatA 6.5s 3.5s ease-in-out infinite",
            }}>
              <div style={{ flex:1, textAlign:"right" }}>
                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:3 }}>رولكس سابمارينر</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:5 }}>
                  142,000 <span style={{ color:"#10b981", fontSize:10, fontWeight:400 }}>ل.س</span>
                </div>
                <div style={{ fontSize:10, color:"#10b981", display:"flex", alignItems:"center", gap:3, justifyContent:"flex-end" }}>● متوفر الآن</div>
              </div>
              <img src="https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width:44, height:44, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
            </div>

            {/* Discount badge */}
            <div style={{
              position:"absolute", top:135, left:40, zIndex:10,
              background:"#10b981", color:"#fff", fontSize:13, fontWeight:800,
              padding:"6px 16px", borderRadius:100, boxShadow:"0 4px 16px rgba(16,185,129,0.4)",
            }}>
              خصم ٨٠٪
            </div>
          </div>

          {/* Dot indicators */}
          {hasBanners && (
            <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center gap-1.5 pointer-events-auto">
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

        {/* ══ TEXT PANEL (visual RIGHT in RTL) ════════════════════════ */}
        <div
          className="absolute inset-y-0 flex flex-col justify-center z-10"
          style={{
            [isRTL ? "right" : "left"]: 0,
            width: "48%",
            background: "linear-gradient(to bottom, #080808, #080808)",
          }}
        >
          {/* Ambient green glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{
              position:"absolute", top:"-30%", right:"20%",
              width:"400px", height:"400px", borderRadius:"50%",
              background:"radial-gradient(circle, rgba(16,185,129,0.055) 0%, transparent 70%)",
              pointerEvents:"none",
            }} />
          </div>

          <div
            className="relative z-10 flex flex-col gap-4 sm:gap-5"
            style={{
              padding: "clamp(24px,4vw,52px) clamp(20px,4vw,56px)",
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
            <h1 style={{
              margin:0,
              fontSize:"clamp(26px,3.2vw,58px)",
              fontWeight:900,
              lineHeight:1.06,
              letterSpacing:"-1.5px",
              color:"#fff",
            }}>
              {isRTL ? (
                <>اكتشف آلاف المنتجات<br />من <span style={{color:"#10b981"}}>المتاجر السورية</span></>
              ) : (
                <>Discover Thousands<br />of <span style={{color:"#10b981"}}>Syrian Products.</span></>
              )}
            </h1>

            {/* Subtitle */}
            <p style={{ margin:0, color:"rgba(255,255,255,0.55)", fontSize:13, lineHeight:1.85, maxWidth:360 }}>
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
                href="/products"
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
            <div style={{
              borderTop:"1px solid rgba(255,255,255,0.07)",
              paddingTop:22, marginTop:2,
              display:"flex", alignItems:"flex-start",
            }}>
              {STATS.map((s, i) => (
                <div
                  key={s.l}
                  style={{
                    flex:1,
                    textAlign: isRTL ? "right" : "left",
                    paddingInlineEnd: i < 2 ? 20 : 0,
                    paddingInlineStart: i > 0 ? 20 : 0,
                    borderInlineStart: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}
                >
                  <div style={{ fontSize:"clamp(20px,2.2vw,28px)", fontWeight:900, color:"#fff", lineHeight:1, whiteSpace:"nowrap" }}>{s.n}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ Navigation arrows — positioned over image panel ════════════ */}
        {/* Image panel spans 56% from the far side; arrows go just inside it */}
        {hasBanners && (
          <>
            {/* Arrow near the text/image junction — ~48% from text side */}
            <button
              onClick={goPrev}
              aria-label="Previous slide"
              className="absolute top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-black/75 transition-colors"
              style={{ [isRTL ? "right" : "left"]: "calc(44% + 10px)" }}
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            {/* Arrow at far edge of image panel */}
            <button
              onClick={goNext}
              aria-label="Next slide"
              className="absolute top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-black/75 transition-colors"
              style={{ [isRTL ? "left" : "right"]: 12 }}
            >
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </>
        )}

        {/* Mobile: fade text over full-width image */}
        <div
          className="absolute inset-0 md:hidden pointer-events-none"
          style={{ background: "rgba(0,0,0,0.55)" }}
        />

      </div>

    </section>
  );
}
