import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────
   GEOMETRY ANALYSIS FROM REFERENCE SCREENSHOT (1024px viewport):
   • Left margin to image : ~130px  (13% of 1024)
   • Image width          : ~338px  (33% of 1024)
   • Gap image→text       : ~42px   ( 4% of 1024)
   • Text area width      : ~480px  (47% of 1024)
   • Right margin         : ~34px   ( 3% of 1024)
   • Image height         : ~440px  (inset, not full-bleed)
   • Section top pad      : ~55px   (above image)
   • Section bot pad      : ~22px   (below image bottom, stats reach edge)

   Scaled to 1440px mockup iframe:
   • Container max-width  : 1200px, centered → 120px auto margins each side
   • Inner h-padding      : 60px each side → total left offset = 180px ✓
   • Image flex           : 0 0 44%  → 476px
   • Gap                  : 48px
   • Text                 : flex 1   → ~616px
   • Image border-radius  : 20px (clearly visible in reference)
   • Section padding      : 48px top / 36px bottom
───────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { font-family: 'Cairo', 'Segoe UI', system-ui, sans-serif; }

  @keyframes heroFloatA  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)}  }
  @keyframes heroFloatB  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)}  }
  @keyframes heroFloatC  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
  @keyframes heroKenBurns {
    0%   { transform:scale(1)    translate(0%,    0%)   }
    50%  { transform:scale(1.04) translate(-0.8%, 0.5%) }
    100% { transform:scale(1)    translate(0%,    0%)   }
  }

  /* dot-grid — matches reference density/opacity */
  .hm-page {
    background-color: #080808;
    background-image: radial-gradient(rgba(255,255,255,0.024) 1px, transparent 1px);
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
      { pos:{ top:40,  right:22   }, w:232, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"عطر ديور سوفاج",   price:"75,000",  stars:5,
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:220, left:18    }, w:198, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"هودية زاهية",      price:"38,500",
        img:"https://images.pexels.com/photos/1103832/pexels-photo-1103832.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:58, left:44  }, w:240, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"ساعة ذهبية فاخرة",price:"142,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "fashion",
    img: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "خصم ٣٥٪",
    cards: [
      { pos:{ top:40,  right:22   }, w:232, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"فستان حرير شيفون", price:"95,000",  stars:5,
        img:"https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:220, left:18    }, w:198, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"حقيبة جلدية فاخرة",price:"485,000",
        img:"https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:58, left:44  }, w:240, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"كعب ستيليتو مخملي",price:"185,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "perfumes",
    img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "عطور حصرية",
    cards: [
      { pos:{ top:40,  right:22   }, w:232, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"شانيل N°5",        price:"320,000", stars:5,
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:220, left:18    }, w:198, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"كريم لانكوم الليلي",price:"145,000",
        img:"https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:58, left:44  }, w:240, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"كريد أفينتوس",     price:"780,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "home",
    img: "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "ديكور راقي",
    cards: [
      { pos:{ top:40,  right:22   }, w:232, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"طقم أريكة ملكية",  price:"4,500,000", stars:4,
        img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:220, left:18    }, w:198, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"ثريا كريستال",     price:"2,800,000",
        img:"https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:58, left:44  }, w:240, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"سجادة بخارى حريرية",price:"3,200,000",avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "jewelry",
    img: "https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "مجوهرات",
    cards: [
      { pos:{ top:40,  right:22   }, w:232, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"خاتم ألماس 18 قيراط",price:"12,800,000",stars:5,
        img:"https://images.pexels.com/photos/248077/pexels-photo-248077.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:220, left:18    }, w:198, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"سوار ذهب إيطالي",  price:"2,850,000",
        img:"https://images.pexels.com/photos/1413420/pexels-photo-1413420.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:58, left:44  }, w:240, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"قلادة لؤلؤ طبيعي", price:"9,500,000",avail:"● متوفر الآن",
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

/* ── Floating card ────────────────────────────────────────── */
function FloatCard({ card }: { card: Card }) {
  return (
    <div style={{
      position:"absolute", ...(card.pos as object),
      zIndex:10, width:card.w,
      background:"rgba(6,6,6,0.93)",
      backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)",
      border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:16, padding:"13px 16px",
      display:"flex", gap:12, alignItems:"center",
      boxShadow:"0 18px 52px rgba(0,0,0,0.84), 0 4px 16px rgba(0,0,0,0.60)",
      animation:card.anim, direction:"rtl",
    }}>
      <div style={{ flex:1, textAlign:"right" }}>
        <div style={{ fontSize:11, color:"#5a626e", marginBottom:4 }}>{card.label}</div>
        <div style={{ fontSize:15, fontWeight:800, color:"#f3f3f3",
          marginBottom:(card.stars != null || card.avail) ? 5 : 0 }}>
          {card.price}{" "}
          <span style={{ color:"#10b981", fontSize:11, fontWeight:500 }}>ل.س</span>
        </div>
        {card.stars != null && (
          <div style={{ display:"flex", gap:1.5, justifyContent:"flex-end" }}>
            {Array.from({ length:card.stars }).map((_,i) => (
              <span key={i} style={{ fontSize:10, color:"#f59e0b" }}>★</span>
            ))}
          </div>
        )}
        {card.avail && (
          <div style={{ fontSize:10, color:"#10b981", display:"flex",
            alignItems:"center", gap:3, justifyContent:"flex-end" }}>
            {card.avail}
          </div>
        )}
      </div>
      <img src={card.img} alt="" loading="lazy"
        style={{ width:50, height:50, borderRadius:11, objectFit:"cover", flexShrink:0 }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   HeroMockup — geometry rebuild to match reference exactly
   • flex-row layout (not position:absolute panels)
   • image is an inset rounded card, NOT full-bleed
   • container max-width 1200px with 60px h-padding
   • proper breathing room and 50/50 visual balance
════════════════════════════════════════════════════════════ */
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

      {/* ═══ NAVBAR ═══════════════════════════════════════ */}
      <header style={{
        height:58, flexShrink:0,
        background:"rgba(6,6,6,0.97)",
        backdropFilter:"blur(16px)",
        borderBottom:"1px solid rgba(255,255,255,0.065)",
        display:"flex", alignItems:"center",
        padding:"0 32px", gap:24,
        justifyContent:"space-between",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:"linear-gradient(135deg,#10b981,#059669)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, fontWeight:900, color:"#fff",
          }}>S</div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:"#f3f3f3", lineHeight:1 }}>SYANO</div>
            <div style={{ fontSize:9, color:"#10b981", letterSpacing:"0.08em" }}>سوق سوريا</div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{ display:"flex", gap:28, alignItems:"center" }}>
          {["الرئيسية","الفئات","المتاجر","العروض"].map((l,i) => (
            <span key={l} style={{ fontSize:13,
              color:i===0?"#10b981":"#5a626e",
              cursor:"pointer", fontWeight:i===0?700:400 }}>{l}</span>
          ))}
        </nav>
        {/* Search */}
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
        {/* Auth */}
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.12)",
            color:"#9ca3af", fontSize:12, padding:"8px 18px", borderRadius:8, cursor:"pointer" }}>
            تسجيل الدخول
          </button>
          <button style={{ background:"#10b981", border:"none", color:"#fff", fontSize:12,
            fontWeight:700, padding:"8px 18px", borderRadius:8, cursor:"pointer",
            boxShadow:"0 2px 14px rgba(16,185,129,0.38)" }}>
            إنشاء حساب
          </button>
        </div>
      </header>

      {/* ═══ HERO SECTION ═════════════════════════════════ */}
      <section style={{
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        /* top padding creates breathing room above image exactly like reference */
        padding:"48px 0 40px",
      }}>
        {/* ── Centered container: max-width 1200px ── */}
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 60px" }}>

          {/* ── Flex row: image LEFT, text RIGHT
               Fixed height (510px) matches reference proportions.
               direction:ltr → first DOM element = left visually. ── */}
          <div
            style={{ display:"flex", gap:48, alignItems:"stretch", direction:"ltr", height:510 }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >

            {/* ══ IMAGE CARD — inset with rounded corners ══ */}
            <div style={{
              flex:"0 0 44%",
              /* min-height ensures image card is tall enough */
              minHeight:500,
              borderRadius:20,
              overflow:"hidden",
              position:"relative",
              background:"#060606",
              /* Subtle shadow around image card */
              boxShadow:"0 24px 80px rgba(0,0,0,0.65), 0 4px 24px rgba(0,0,0,0.50)",
            }}>

              {/* Slide images (cross-fade) */}
              {SLIDES.map((sl, i) => (
                <div key={sl.id} style={{
                  position:"absolute", inset:0,
                  opacity: i === slideIdx ? 1 : 0,
                  transition: i === slideIdx
                    ? "opacity 0.75s cubic-bezier(0.4,0,0.2,1)"
                    : "opacity 0.42s ease-in",
                }}>
                  <img
                    src={sl.img} alt=""
                    loading={sl.id==="electronics"?"eager":"lazy"}
                    style={{
                      position:"absolute", inset:0,
                      width:"100%", height:"100%",
                      objectFit:"cover",
                      animation:"heroKenBurns 28s ease-in-out infinite",
                    }}
                  />
                  {/* Dark overlay */}
                  <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.35)" }} />
                  {/* Bottom ground-plane gradient */}
                  <div style={{
                    position:"absolute", inset:"auto 0 0 0", height:"38%",
                    background:"linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 100%)",
                  }} />
                </div>
              ))}

              {/* Blend gradient — right edge fades to page bg for seamless transition */}
              <div style={{
                position:"absolute", inset:"0 0 0 auto", width:"28%", zIndex:15,
                background:"linear-gradient(to left, #080808 0%, transparent 100%)",
                pointerEvents:"none",
              }} />

              {/* Floating product cards — current slide only */}
              {slide.cards.map((card, i) => (
                <FloatCard key={`${slideIdx}-${i}`} card={card} />
              ))}

              {/* Discount / category badge */}
              <div style={{
                position:"absolute", top:130, left:36, zIndex:20,
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

            {/* ══ TEXT PANEL — right side, RTL Arabic content ═ */}
            <div style={{
              flex:1,
              display:"flex", flexDirection:"column", justifyContent:"center",
              position:"relative",
              direction:"rtl",
              /* Physical left padding (space from image to text) */
              paddingLeft:8,
            }}>

              {/* Ambient glow */}
              <div style={{
                position:"absolute", top:"-30%", left:"10%",
                width:420, height:420, borderRadius:"50%",
                background:"radial-gradient(circle, rgba(16,185,129,0.055) 0%, transparent 70%)",
                pointerEvents:"none",
              }} />

              <div style={{
                position:"relative", zIndex:1,
                display:"flex", flexDirection:"column", gap:22,
                textAlign:"right",
              }}>

                {/* Eyebrow badge */}
                <div>
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:7,
                    padding:"6px 16px", borderRadius:100,
                    border:"1px solid rgba(16,185,129,0.42)",
                    color:"#10b981", fontSize:12, fontWeight:600,
                    background:"rgba(16,185,129,0.07)",
                  }}>
                    ✦ سوق سوريا الرقمي
                  </span>
                </div>

                {/* Headline — dominant, 3 lines */}
                <h1 style={{
                  margin:0,
                  fontSize:"clamp(48px, 5.5vw, 80px)",
                  fontWeight:900,
                  lineHeight:1.02,
                  letterSpacing:"-2.5px",
                  color:"#f3f3f3",
                }}>
                  اكتشف آلاف<br />
                  المنتجات من<br />
                  <span style={{ color:"#10b981" }}>المتاجر السورية</span>
                </h1>

                {/* Description */}
                <p style={{ margin:0, fontSize:15, lineHeight:1.9,
                  maxWidth:380, color:"#5a626e" }}>
                  منتجات متنوعة. متاجر موثوقة. وتجربة تسوق حديثة تجمع أفضل
                  المتاجر السورية في مكان واحد.
                </p>

                {/* CTAs */}
                <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                  <a href="#" style={{
                    padding:"14px 32px", borderRadius:12,
                    background:"#10b981", color:"#fff",
                    fontSize:15, fontWeight:700,
                    display:"inline-flex", alignItems:"center", gap:8,
                    textDecoration:"none",
                    boxShadow:"0 4px 28px rgba(16,185,129,0.42), 0 2px 10px rgba(16,185,129,0.28)",
                  }}>
                    تسوق الآن
                    <svg style={{ width:15, height:15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </a>
                  <a href="#" style={{
                    padding:"14px 32px", borderRadius:12,
                    background:"transparent", color:"#c4cdd8",
                    fontSize:15, fontWeight:500,
                    border:"1px solid rgba(255,255,255,0.13)",
                    textDecoration:"none",
                  }}>
                    استكشف المتاجر
                  </a>
                </div>

                {/* Stats */}
                <div style={{
                  borderTop:"1px solid rgba(255,255,255,0.075)",
                  paddingTop:24, marginTop:4,
                  display:"flex", alignItems:"flex-start",
                }}>
                  {STATS.map((s,i) => (
                    <div key={s.l} style={{
                      flex:1,
                      textAlign:"right",
                      paddingInlineEnd:  i < 2 ? 24 : 0,
                      paddingInlineStart: i > 0 ? 24 : 0,
                      borderInlineStartWidth: i > 0 ? 1 : 0,
                      borderInlineStartStyle:"solid",
                      borderInlineStartColor:"rgba(255,255,255,0.075)",
                    }}>
                      <div style={{
                        fontSize:"clamp(28px,2.8vw,40px)",
                        fontWeight:900, lineHeight:1, whiteSpace:"nowrap",
                        color:"#f3f3f3", direction:"ltr", textAlign:"right",
                      }}>{s.n}</div>
                      <div style={{ fontSize:12, marginTop:5, color:"#5a626e" }}>{s.l}</div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
