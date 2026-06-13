import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────
   REFERENCE GEOMETRY — pixel-measured from screenshot at 1024×576
   display scale ≈ 0.67× (design is 1440px, shown zoomed to ~980px)

   Actual design values at 1440px:
   • Left margin    : ~180px
   • Image width    : ~590px  (41% of 1440)
   • Gap            :  ~32px
   • Text panel     : ~640px
   • Right margin   :  ~38px
   • Total          : 180+590+32+640+38 = 1480 ≈ 1440 (≈ok)

   Implementation (1440px mockup):
   • Section padding: 36px top, 40px right, 28px bottom, 120px left
     → inner width = 1440 − 120 − 40 = 1280px
   • Image  : flex 0 0 46% → 589px
   • Gap    : 32px
   • Text   : flex 1 → 659px
   • Headline: clamp(52px, 6.5vw, 94px) → 93.6px at 1440px
     At this size Cairo-900 Arabic fits in 659px ✓

   CONFIRMED FROM REFERENCE:
   • CTA text color : #000000  (black on green)
   • Logo shape     : circle   (border-radius 50%)
   • Card thumbnail : circle   (border-radius 50%)
   • Auth buttons   : pill     (border-radius 100)
   • Grid dots      : rgba(255,255,255,0.016) — barely perceptible
   • Stats numbers  : #ffffff, clamp(36px, 4vw, 56px)
───────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { font-family: 'Cairo', 'Segoe UI', system-ui, sans-serif; }

  @keyframes heroFloatA  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)}  }
  @keyframes heroFloatB  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)}  }
  @keyframes heroFloatC  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
  @keyframes heroKenBurns {
    0%   { transform:scale(1)    translate(0%,   0%)   }
    50%  { transform:scale(1.04) translate(-0.8%,0.5%) }
    100% { transform:scale(1)    translate(0%,   0%)   }
  }

  .hm-page {
    background-color: #080808;
    background-image: radial-gradient(rgba(255,255,255,0.016) 1px, transparent 1px);
    background-size: 32px 32px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
`;

const SLIDES = [
  {
    id: "electronics",
    img: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "خصم ٨٠٪",
    cards: [
      { pos:{ top:36,  right:18   }, w:200, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"عطر ديور سوفاج",   price:"75,000",  stars:5,
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:205, left:14    }, w:172, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"هودية زاهية",      price:"38,500",
        img:"https://images.pexels.com/photos/1103832/pexels-photo-1103832.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:50, left:38  }, w:207, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"ساعة ذهبية فاخرة",price:"142,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "fashion",
    img: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "خصم ٣٥٪",
    cards: [
      { pos:{ top:36,  right:18   }, w:200, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"فستان حرير شيفون", price:"95,000",  stars:5,
        img:"https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:205, left:14    }, w:172, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"حقيبة جلدية فاخرة",price:"485,000",
        img:"https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:50, left:38  }, w:207, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"كعب ستيليتو مخملي",price:"185,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "perfumes",
    img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "عطور حصرية",
    cards: [
      { pos:{ top:36,  right:18   }, w:200, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"شانيل N°5",        price:"320,000", stars:5,
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:205, left:14    }, w:172, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"كريم لانكوم الليلي",price:"145,000",
        img:"https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:50, left:38  }, w:207, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"كريد أفينتوس",     price:"780,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "home",
    img: "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "ديكور راقي",
    cards: [
      { pos:{ top:36,  right:18   }, w:200, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"طقم أريكة ملكية",  price:"4,500,000", stars:4,
        img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:205, left:14    }, w:172, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"ثريا كريستال",     price:"2,800,000",
        img:"https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:50, left:38  }, w:207, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"سجادة بخارى حريرية",price:"3,200,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "jewelry",
    img: "https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "مجوهرات",
    cards: [
      { pos:{ top:36,  right:18   }, w:200, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"خاتم ألماس 18 قيراط",price:"12,800,000", stars:5,
        img:"https://images.pexels.com/photos/248077/pexels-photo-248077.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:205, left:14    }, w:172, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"سوار ذهب إيطالي",  price:"2,850,000",
        img:"https://images.pexels.com/photos/1413420/pexels-photo-1413420.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:50, left:38  }, w:207, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"قلادة لؤلؤ طبيعي", price:"9,500,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
];

const STATS = [
  { n:"12,000+", l:"عميل راضٍ" },
  { n:"25,000+", l:"منتج نشط"  },
  { n:"500+",    l:"متجر نشط"  },
];

type Card = typeof SLIDES[0]["cards"][0];

/* ── Floating card ──────────────────────────────────────── */
function FloatCard({ card }: { card: Card }) {
  return (
    <div style={{
      position:"absolute", ...(card.pos as object),
      zIndex:10, width:card.w,
      background:"rgba(6,6,6,0.93)",
      backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)",
      border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:15, padding:"11px 14px",
      display:"flex", gap:11, alignItems:"center",
      boxShadow:"0 18px 52px rgba(0,0,0,0.84), 0 4px 16px rgba(0,0,0,0.60)",
      animation:card.anim, direction:"rtl",
    }}>
      <div style={{ flex:1, textAlign:"right" }}>
        <div style={{ fontSize:10.5, color:"#5a626e", marginBottom:3 }}>{card.label}</div>
        <div style={{ fontSize:14, fontWeight:800, color:"#f3f3f3",
          marginBottom:(card.stars != null || card.avail) ? 4 : 0 }}>
          {card.price}{" "}
          <span style={{ color:"#10b981", fontSize:10, fontWeight:500 }}>ل.س</span>
        </div>
        {card.stars != null && (
          <div style={{ display:"flex", gap:1.5, justifyContent:"flex-end" }}>
            {Array.from({ length:card.stars }).map((_,i) => (
              <span key={i} style={{ fontSize:9.5, color:"#f59e0b" }}>★</span>
            ))}
          </div>
        )}
        {card.avail && (
          <div style={{ fontSize:9.5, color:"#10b981", display:"flex",
            alignItems:"center", gap:3, justifyContent:"flex-end" }}>
            {card.avail}
          </div>
        )}
      </div>
      {/* CIRCULAR thumbnail — confirmed from reference screenshot */}
      <img src={card.img} alt="" loading="lazy"
        style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
    </div>
  );
}

export function HeroMockup() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [paused,   setPaused]   = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, [paused]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48)
      setSlideIdx(i => diff > 0
        ? (i - 1 + SLIDES.length) % SLIDES.length
        : (i + 1) % SLIDES.length);
    touchStartX.current = null;
  };

  const slide = SLIDES[slideIdx];

  return (
    <div className="hm-page" dir="rtl">
      <style>{GLOBAL_CSS}</style>

      {/* ═══ NAVBAR ════════════════════════════════════════ */}
      <header style={{
        height:58, flexShrink:0,
        background:"rgba(6,6,6,0.97)",
        backdropFilter:"blur(16px)",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        display:"flex", alignItems:"center",
        padding:"0 36px", gap:24,
        justifyContent:"space-between",
      }}>
        {/* Logo — CIRCLE (confirmed from reference) */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:"50%",
            background:"linear-gradient(135deg,#10b981,#059669)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, fontWeight:900, color:"#fff",
          }}>S</div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:"#f3f3f3", lineHeight:1 }}>SYANO</div>
            <div style={{ fontSize:9, color:"#10b981", letterSpacing:"0.08em" }}>سوق سوريا</div>
          </div>
        </div>
        <nav style={{ display:"flex", gap:28, alignItems:"center" }}>
          {["الرئيسية","الفئات","المتاجر","العروض"].map((l,i) => (
            <span key={l} style={{ fontSize:13, color:i===0?"#f3f3f3":"#5a626e",
              cursor:"pointer", fontWeight:i===0?700:400 }}>{l}</span>
          ))}
        </nav>
        <div style={{ flex:1, maxWidth:360, margin:"0 24px",
          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:10, height:38,
          display:"flex", alignItems:"center", padding:"0 14px", gap:8 }}>
          <svg width={14} height={14} fill="none" stroke="#5a626e" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize:12, color:"#3d454e" }}>ابحث عن منتجات، متاجر أو فئات...</span>
        </div>
        {/* Auth — PILL shape (confirmed from reference) */}
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.14)",
            color:"#9ca3af", fontSize:12, padding:"8px 20px",
            borderRadius:100, cursor:"pointer" }}>
            تسجيل الدخول
          </button>
          <button style={{ background:"#10b981", border:"none",
            color:"#fff", fontSize:12, fontWeight:700,
            padding:"8px 20px", borderRadius:100, cursor:"pointer",
            boxShadow:"0 2px 14px rgba(16,185,129,0.38)" }}>
            إنشاء حساب
          </button>
        </div>
      </header>

      {/* ═══ HERO SECTION ══════════════════════════════════
          Asymmetric padding: 120px left creates the visible
          left gap seen in the reference (not a centered container).
          Inner width at 1440px: 1440 - 120 - 40 = 1280px.
          Image 46% = 589px | gap 32px | text = 659px. */}
      <section style={{
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        paddingTop:36, paddingBottom:28,
        paddingLeft:120, paddingRight:40,
      }}>
        <div
          style={{
            display:"flex", gap:32, alignItems:"stretch",
            direction:"ltr",    /* LTR: image is first=left, text is second=right */
            height:560,
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >

          {/* ══ IMAGE CARD ═══════════════════════════════
              46% of 1280px = 589px. Wider than previous 475px.
              Image panel dominates the visual balance. */}
          <div style={{
            flex:"0 0 46%",
            borderRadius:20, overflow:"hidden",
            position:"relative", background:"#060606",
            boxShadow:"0 24px 80px rgba(0,0,0,0.65), 0 4px 24px rgba(0,0,0,0.50)",
          }}>
            {SLIDES.map((sl, i) => (
              <div key={sl.id} style={{
                position:"absolute", inset:0,
                opacity: i === slideIdx ? 1 : 0,
                transition: i === slideIdx
                  ? "opacity 0.75s cubic-bezier(0.4,0,0.2,1)"
                  : "opacity 0.42s ease-in",
              }}>
                <img src={sl.img} alt="" loading={sl.id==="electronics"?"eager":"lazy"}
                  style={{ position:"absolute", inset:0, width:"100%", height:"100%",
                    objectFit:"cover", animation:"heroKenBurns 28s ease-in-out infinite" }} />
                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.35)" }} />
                <div style={{ position:"absolute", inset:"auto 0 0 0", height:"38%",
                  background:"linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 100%)" }} />
              </div>
            ))}

            {/* Right edge blend → seamless transition to #080808 text panel */}
            <div style={{
              position:"absolute", inset:"0 0 0 auto", width:"26%", zIndex:15,
              background:"linear-gradient(to left, #080808 0%, transparent 100%)",
              pointerEvents:"none",
            }} />

            {/* Floating product cards */}
            {slide.cards.map((card, i) => (
              <FloatCard key={`${slideIdx}-${i}`} card={card} />
            ))}

            {/* Discount badge */}
            <div style={{
              position:"absolute", top:124, left:30, zIndex:20,
              background:"#10b981", color:"#fff",
              fontSize:13, fontWeight:800,
              padding:"6px 16px", borderRadius:100,
              boxShadow:"0 4px 20px rgba(16,185,129,0.55), 0 2px 8px rgba(16,185,129,0.35)",
            }}>
              {slide.badge}
            </div>

            {/* Carousel dots */}
            <div style={{
              position:"absolute", bottom:14, left:0, right:0, zIndex:25,
              display:"flex", justifyContent:"center", gap:7,
            }}>
              {SLIDES.map((_,i) => (
                <button key={i} onClick={() => setSlideIdx(i)}
                  aria-label={`شريحة ${i+1}`}
                  style={{
                    border:"none", cursor:"pointer", padding:0, borderRadius:100,
                    transition:"all 0.3s",
                    background: i===slideIdx ? "#10b981" : "rgba(255,255,255,0.25)",
                    width: i===slideIdx ? 26 : 4, height:4,
                  }} />
              ))}
            </div>
          </div>

          {/* ══ TEXT PANEL ════════════════════════════════
              flex:1 → 659px at 1280px inner.
              overflow:hidden prevents any clipping at viewport edge. */}
          <div style={{
            flex:1, overflow:"hidden",
            display:"flex", flexDirection:"column", justifyContent:"center",
            position:"relative", direction:"rtl", paddingLeft:8,
          }}>
            {/* Ambient glow */}
            <div style={{
              position:"absolute", top:"-20%", left:"5%",
              width:380, height:380, borderRadius:"50%",
              background:"radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)",
              pointerEvents:"none",
            }} />

            <div style={{
              position:"relative", zIndex:1,
              display:"flex", flexDirection:"column", gap:16,
              textAlign:"right",
            }}>

              {/* Eyebrow badge */}
              <div>
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:7,
                  padding:"5px 14px", borderRadius:100,
                  border:"1px solid rgba(16,185,129,0.40)",
                  color:"#10b981", fontSize:11.5, fontWeight:600,
                  background:"rgba(16,185,129,0.07)",
                }}>
                  ✦ سوق سوريا الرقمي
                </span>
              </div>

              {/* ── HEADLINE ─────────────────────────────────
                  clamp(52px, 6.5vw, 94px) → 93.6px at 1440px
                  lineHeight 1.0 → lines nearly touching, very dominant
                  Each Arabic line ≈ 560-600px wide → fits in 659px ✓ */}
              <h1 style={{
                margin:0,
                fontSize:"clamp(52px, 6.5vw, 94px)",
                fontWeight:900,
                lineHeight:1.0,
                letterSpacing:"-2px",
                color:"#f3f3f3",
              }}>
                اكتشف آلاف<br />
                المنتجات من<br />
                <span style={{ color:"#10b981" }}>المتاجر السورية</span>
              </h1>

              {/* Description — tighter gap (12px) after headline matches reference */}
              <p style={{ margin:0, fontSize:14, lineHeight:1.75,
                maxWidth:400, color:"#5a626e" }}>
                منتجات متنوعة. متاجر موثوقة. وتجربة تسوق حديثة تجمع أفضل
                المتاجر السورية في مكان واحد.
              </p>

              {/* CTAs — CTA TEXT IS BLACK (confirmed from reference) */}
              <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                <a href="#" style={{
                  padding:"13px 28px", borderRadius:10,
                  background:"#10b981",
                  color:"#000000",
                  fontSize:14, fontWeight:700,
                  display:"inline-flex", alignItems:"center", gap:7,
                  textDecoration:"none",
                  boxShadow:"0 4px 28px rgba(16,185,129,0.42), 0 2px 10px rgba(16,185,129,0.28)",
                }}>
                  تسوق الآن
                  <svg style={{ width:14, height:14 }} fill="none"
                    stroke="#000000" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                {/* Ghost button — very faint border like reference */}
                <a href="#" style={{
                  padding:"13px 28px", borderRadius:10,
                  background:"transparent", color:"#9ca3af",
                  fontSize:14, fontWeight:500,
                  border:"1px solid rgba(255,255,255,0.09)",
                  textDecoration:"none",
                }}>
                  استكشف المتاجر
                </a>
              </div>

              {/* ── STATS ────────────────────────────────────
                  Numbers: clamp(36px, 4vw, 56px) → 57.6px at 1440px
                  Color: pure #ffffff (brighter/more dominant than #f3f3f3) */}
              <div style={{
                borderTop:"1px solid rgba(255,255,255,0.075)",
                paddingTop:20, marginTop:2,
                display:"flex", alignItems:"flex-start",
              }}>
                {STATS.map((s,i) => (
                  <div key={s.l} style={{
                    flex:1, minWidth:0, textAlign:"right",
                    paddingInlineEnd:  i < 2 ? 16 : 0,
                    paddingInlineStart: i > 0 ? 16 : 0,
                    borderInlineStartWidth: i > 0 ? 1 : 0,
                    borderInlineStartStyle:"solid",
                    borderInlineStartColor:"rgba(255,255,255,0.075)",
                  }}>
                    {/* Numbers: measured ~44-46px at design size (from reference pixel measurement) */}
                    <div style={{
                      fontSize:"clamp(32px, 3.2vw, 46px)",
                      fontWeight:900, lineHeight:1,
                      color:"#ffffff",
                      direction:"ltr", textAlign:"right",
                    }}>{s.n}</div>
                    <div style={{ fontSize:11.5, marginTop:5, color:"#5a626e" }}>{s.l}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
