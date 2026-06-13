import { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────
   Self-contained dark-theme CSS tokens + keyframes
   (mirrors the main app's dark-mode :root vars exactly)
────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 96%;
    --muted-foreground: 0 0% 55%;
    --border: 0 0% 14%;
    --primary: 152 69% 40%;
    font-family: 'Cairo', system-ui, sans-serif;
  }

  @keyframes heroFloatA  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)}  }
  @keyframes heroFloatB  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)}  }
  @keyframes heroFloatC  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
  @keyframes heroKenBurns {
    0%   { transform: scale(1)    translate(0%,    0%)    }
    50%  { transform: scale(1.04) translate(-0.8%, 0.5%)  }
    100% { transform: scale(1)    translate(0%,    0%)    }
  }
  @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes fadeOut { from { opacity:1 } to { opacity:0 } }
  @keyframes dotPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.15); }
  }

  /* page grid pattern (matches .sy-page in main app) */
  .hero-page {
    background-color: hsl(var(--background));
    background-image:
      radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 32px 32px;
  }
`;

/* ── Hero slide data — mirrors production HERO_SLIDES exactly ─── */
const SLIDES = [
  {
    id: "electronics",
    img: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "خصم ٨٠٪",
    cards: [
      { pos:{ top:40, right:24  }, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"عطر ديور سوفاج",   price:"75,000",   stars:5,
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ top:218, left:20  }, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"جاكيت جلد فاخر",   price:"175,000",
        img:"https://images.pexels.com/photos/1103832/pexels-photo-1103832.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ bottom:56, left:48 }, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"ساعة ذهبية فاخرة", price:"142,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=60" },
    ],
  },
  {
    id: "fashion",
    img: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "خصم ٣٥٪",
    cards: [
      { pos:{ top:40, right:24  }, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"فستان حرير شيفون",  price:"95,000",  stars:5,
        img:"https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ top:218, left:20  }, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"حقيبة جلدية فاخرة", price:"485,000",
        img:"https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ bottom:56, left:48 }, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"كعب ستيليتو مخملي", price:"185,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=60" },
    ],
  },
  {
    id: "perfumes",
    img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "عطور حصرية",
    cards: [
      { pos:{ top:40, right:24  }, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"شانيل N°5 أو دو برفان", price:"320,000", stars:5,
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ top:218, left:20  }, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"كريم لانكوم الليلي",   price:"145,000",
        img:"https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ bottom:56, left:48 }, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"كريد أفينتوس رجالي",  price:"780,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" },
    ],
  },
  {
    id: "home",
    img: "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "ديكور راقي",
    cards: [
      { pos:{ top:40, right:24  }, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"طقم أريكة قطيفة ملكية", price:"4,500,000", stars:4,
        img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ top:218, left:20  }, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"ثريا كريستال فاخرة",   price:"2,800,000",
        img:"https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ bottom:56, left:48 }, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"سجادة بخارى حريرية",   price:"3,200,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=60" },
    ],
  },
  {
    id: "jewelry",
    img: "https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "مجوهرات",
    cards: [
      { pos:{ top:40, right:24  }, w:220, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"خاتم ألماس 18 قيراط",  price:"12,800,000", stars:5,
        img:"https://images.pexels.com/photos/248077/pexels-photo-248077.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ top:218, left:20  }, w:192, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"سوار ذهب إيطالي",       price:"2,850,000",
        img:"https://images.pexels.com/photos/1413420/pexels-photo-1413420.jpeg?auto=compress&cs=tinysrgb&w=60" },
      { pos:{ bottom:56, left:48 }, w:232, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"قلادة لؤلؤ طبيعي",     price:"9,500,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=60" },
    ],
  },
];

const STATS = [
  { n: "+12,000", l: "عميل راضٍ"   },
  { n: "+25,000", l: "منتج فاعل"   },
  { n: "+500",    l: "متاجر نشطة"  },
];

/* ── Floating card ──────────────────────────────────────── */
type CardData = typeof SLIDES[0]["cards"][0];

function FloatCard({ card }: { card: CardData }) {
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
      direction:"rtl",
    }}>
      <div style={{ flex:1, textAlign:"right" }}>
        <div style={{ fontSize:10, color:"#9ca3af", marginBottom:3 }}>{card.label}</div>
        <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:(card.stars != null || card.avail) ? 5 : 0 }}>
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

/* ── Slide image + cards layer (fades on transition) ─────── */
function SlideLayer({ slide, visible }: { slide: typeof SLIDES[0]; visible: boolean }) {
  return (
    <div
      style={{
        position:"absolute", inset:0,
        opacity: visible ? 1 : 0,
        transition: visible ? "opacity 0.7s ease-out" : "opacity 0.4s ease-in",
        pointerEvents: "none",
      }}
    >
      {/* Product image */}
      <img
        src={slide.img}
        alt=""
        loading={slide.id === "electronics" ? "eager" : "lazy"}
        style={{
          position:"absolute", inset:0,
          width:"100%", height:"100%",
          objectFit:"cover",
          animation:"heroKenBurns 28s ease-in-out infinite",
        }}
      />

      {/* Dark overlay */}
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.30)" }} />

      {/* Bottom fade */}
      <div style={{
        position:"absolute", inset:"auto 0 0 0", height:"33%",
        background:"linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
      }} />

      {/* Blend gradient (right edge → transparent so image merges into text panel) */}
      <div style={{
        position:"absolute", inset:"0 0 0 auto", width:"45%",
        background:"linear-gradient(to left, hsl(var(--background)) 0%, transparent 100%)",
      }} />

      {/* Floating product cards */}
      <div style={{ position:"absolute", inset:0 }}>
        {slide.cards.map((c, i) => <FloatCard key={i} card={c} />)}
      </div>

      {/* Discount / category badge */}
      <div style={{
        position:"absolute", top:135, left:40, zIndex:10,
        background:"#10b981", color:"#fff",
        fontSize:13, fontWeight:800,
        padding:"6px 16px", borderRadius:100,
        boxShadow:"0 4px 16px rgba(16,185,129,0.4)",
        fontFamily:"'Cairo', sans-serif",
      }}>
        {slide.badge}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main mockup component
════════════════════════════════════════════════════════════ */
export function HeroMockup() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  /* Auto-advance */
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, [paused]);

  /* Touch swipe */
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48)
      setSlideIdx(i => diff > 0 ? (i - 1 + SLIDES.length) % SLIDES.length : (i + 1) % SLIDES.length);
    touchStartX.current = null;
  };

  return (
    <div className="hero-page" dir="rtl" style={{ minHeight:"100vh", display:"flex", alignItems:"center" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Hero section ──────────────────────────────────── */}
      <section style={{ borderBottom:"1px solid hsl(var(--border))", overflow:"hidden", width:"100%" }}>
        <div
          ref={containerRef}
          style={{ position:"relative", overflow:"hidden", userSelect:"none", height:"clamp(420px,60vh,640px)" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >

          {/* ══ IMAGE PANEL — left side in RTL ══════════════ */}
          <div style={{
            position:"absolute", top:0, bottom:0, left:0,
            width:"56%",
            background:"#0a0a0a",
            overflow:"hidden",
          }}>
            {SLIDES.map((slide, i) => (
              <SlideLayer key={slide.id} slide={slide} visible={i === slideIdx} />
            ))}

            {/* Dot indicators */}
            <div style={{
              position:"absolute", bottom:12, left:0, right:0, zIndex:20,
              display:"flex", justifyContent:"center", gap:6,
            }}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  aria-label={`شريحة ${i + 1}`}
                  style={{
                    border:"none", cursor:"pointer", padding:0,
                    borderRadius:100,
                    transition:"all 0.3s",
                    background: i === slideIdx ? "#10b981" : "rgba(255,255,255,0.30)",
                    width:  i === slideIdx ? 24 : 3.5,
                    height: 3.5,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ══ TEXT PANEL — right side in RTL ══════════════ */}
          <div style={{
            position:"absolute", top:0, bottom:0, right:0,
            width:"48%",
            background:"hsl(var(--background))",
            display:"flex", flexDirection:"column", justifyContent:"center",
            zIndex:10,
          }}>
            {/* Ambient green glow */}
            <div style={{
              position:"absolute",
              top:"-30%", left:"20%",
              width:400, height:400,
              borderRadius:"50%",
              background:"radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)",
              pointerEvents:"none",
            }} />

            <div style={{
              position:"relative", zIndex:10,
              display:"flex", flexDirection:"column", gap:20,
              padding:"clamp(24px,4vw,52px) clamp(20px,4vw,56px)",
              textAlign:"right",
            }}>

              {/* Eyebrow badge */}
              <div>
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"5px 14px", borderRadius:100,
                  border:"1px solid rgba(16,185,129,0.4)",
                  color:"#10b981", fontSize:11, fontWeight:600,
                  background:"rgba(16,185,129,0.06)",
                }}>
                  ✦ سوق سوريا الرقمي
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                margin:0,
                fontSize:"clamp(26px,3.2vw,58px)",
                fontWeight:900,
                lineHeight:1.06,
                letterSpacing:"-1.5px",
                color:"hsl(var(--foreground))",
              }}>
                اكتشف آلاف المنتجات
                <br />من{" "}
                <span style={{ color:"#10b981" }}>المتاجر السورية</span>
              </h1>

              {/* Subtitle */}
              <p style={{
                margin:0,
                fontSize:13,
                lineHeight:1.85,
                maxWidth:360,
                color:"hsl(var(--muted-foreground))",
              }}>
                منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة تجمع أفضل المتاجر السورية.
              </p>

              {/* CTA buttons */}
              <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                <a
                  href="#"
                  style={{
                    padding:"13px 28px", borderRadius:12,
                    background:"#10b981", color:"#fff",
                    fontSize:14, fontWeight:700,
                    display:"inline-flex", alignItems:"center", gap:7,
                    textDecoration:"none",
                    boxShadow:"0 4px 20px rgba(16,185,129,0.28)",
                  }}
                >
                  تسوق الآن
                  <svg style={{ width:14, height:14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <a
                  href="#"
                  style={{
                    padding:"13px 28px", borderRadius:12,
                    background:"transparent",
                    color:"#d1d5db",
                    fontSize:14,
                    border:"1px solid rgba(255,255,255,0.12)",
                    textDecoration:"none",
                  }}
                >
                  استكشف المتاجر
                </a>
              </div>

              {/* Stats bar */}
              <div style={{
                borderTop:"1px solid hsl(var(--border))",
                paddingTop:22,
                marginTop:2,
                display:"flex",
                alignItems:"flex-start",
              }}>
                {STATS.map((s, i) => (
                  <div
                    key={s.l}
                    style={{
                      flex:1,
                      textAlign:"right",
                      paddingInlineEnd: i < 2 ? 20 : 0,
                      paddingInlineStart: i > 0 ? 20 : 0,
                      borderInlineStartWidth: i > 0 ? 1 : 0,
                      borderInlineStartStyle:"solid",
                      borderInlineStartColor:"hsl(var(--border))",
                    }}
                  >
                    <div style={{
                      fontSize:"clamp(20px,2.2vw,28px)",
                      fontWeight:900, lineHeight:1, whiteSpace:"nowrap",
                      color:"hsl(var(--foreground))",
                    }}>
                      {s.n}
                    </div>
                    <div style={{ fontSize:11, marginTop:4, color:"hsl(var(--muted-foreground))" }}>
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile dark overlay (shown when viewport < 768px) */}
          <div style={{
            position:"absolute", inset:0,
            background:"rgba(0,0,0,0.55)",
            pointerEvents:"none",
            display:"none",
          }} className="mobile-overlay" />
        </div>
      </section>
    </div>
  );
}
