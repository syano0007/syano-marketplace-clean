import { useEffect, useRef, useState } from "react";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:  #0a0a0a;
    --fg:  #f5f5f5;
    --muted: #6b7280;
    --border: rgba(255,255,255,0.09);
    --green: #10b981;
    font-family: 'Cairo', 'Segoe UI', system-ui, sans-serif;
  }

  @keyframes heroFloatA  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)}  }
  @keyframes heroFloatB  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)}  }
  @keyframes heroFloatC  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
  @keyframes heroKenBurns {
    0%   { transform: scale(1)    translate(0%,    0%)    }
    50%  { transform: scale(1.04) translate(-0.8%, 0.5%)  }
    100% { transform: scale(1)    translate(0%,    0%)    }
  }

  /* dot-grid page background — matches main app .sy-page */
  .hm-root {
    background-color: var(--bg);
    background-image: radial-gradient(rgba(255,255,255,0.038) 1px, transparent 1px);
    background-size: 32px 32px;
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
  }
`;

/* ── Slide data (exact mirror of production HERO_SLIDES) ── */
const SLIDES = [
  {
    id: "electronics",
    img: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "خصم ٨٠٪",
    cards: [
      { pos:{ top:44,  right:28   }, w:244, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"عطر ديور سوفاج",   price:"75,000",   stars:5,
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:240, left:22    }, w:210, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"هودية زاهية",       price:"38,500",
        img:"https://images.pexels.com/photos/1103832/pexels-photo-1103832.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:64, left:52  }, w:256, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"ساعة ذهبية فاخرة", price:"142,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "fashion",
    img: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "خصم ٣٥٪",
    cards: [
      { pos:{ top:44,  right:28   }, w:244, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"فستان حرير شيفون",  price:"95,000",  stars:5,
        img:"https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:240, left:22    }, w:210, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"حقيبة جلدية فاخرة", price:"485,000",
        img:"https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:64, left:52  }, w:256, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"كعب ستيليتو مخملي", price:"185,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "perfumes",
    img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "عطور حصرية",
    cards: [
      { pos:{ top:44,  right:28   }, w:244, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"شانيل N°5 أو دو برفان", price:"320,000", stars:5,
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:240, left:22    }, w:210, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"كريم لانكوم الليلي",   price:"145,000",
        img:"https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:64, left:52  }, w:256, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"كريد أفينتوس رجالي",  price:"780,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "home",
    img: "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "ديكور راقي",
    cards: [
      { pos:{ top:44,  right:28   }, w:244, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"طقم أريكة قطيفة ملكية", price:"4,500,000", stars:4,
        img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:240, left:22    }, w:210, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"ثريا كريستال فاخرة",   price:"2,800,000",
        img:"https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:64, left:52  }, w:256, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"سجادة بخارى حريرية",   price:"3,200,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
  {
    id: "jewelry",
    img: "https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop&crop=center",
    badge: "مجوهرات",
    cards: [
      { pos:{ top:44,  right:28   }, w:244, anim:"heroFloatC 5.5s ease-in-out infinite",
        label:"خاتم ألماس 18 قيراط",  price:"12,800,000", stars:5,
        img:"https://images.pexels.com/photos/248077/pexels-photo-248077.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ top:240, left:22    }, w:210, anim:"heroFloatB 7s 1.8s ease-in-out infinite",
        label:"سوار ذهب إيطالي",       price:"2,850,000",
        img:"https://images.pexels.com/photos/1413420/pexels-photo-1413420.jpeg?auto=compress&cs=tinysrgb&w=80" },
      { pos:{ bottom:64, left:52  }, w:256, anim:"heroFloatA 6.5s 3.5s ease-in-out infinite",
        label:"قلادة لؤلؤ طبيعي",     price:"9,500,000", avail:"● متوفر الآن",
        img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=80" },
    ],
  },
];

const STATS = [
  { n: "12,000+", l: "عميل راضٍ"  },
  { n: "25,000+", l: "منتج نشط"   },
  { n: "500+",    l: "متجر نشط"   },
];

type Card = typeof SLIDES[0]["cards"][0];

/* ── Floating card ────────────────────────────────────────── */
function FloatCard({ card }: { card: Card }) {
  return (
    <div style={{
      position:"absolute",
      ...(card.pos as object),
      zIndex:10,
      width: card.w,
      background:"rgba(12,12,12,0.90)",
      backdropFilter:"blur(24px)",
      WebkitBackdropFilter:"blur(24px)",
      border:"1px solid rgba(255,255,255,0.10)",
      borderRadius:18,
      padding:"14px 18px",
      display:"flex",
      gap:14,
      alignItems:"center",
      boxShadow:"0 12px 40px rgba(0,0,0,0.75)",
      animation: card.anim,
      direction:"rtl",
    }}>
      <div style={{ flex:1, textAlign:"right" }}>
        <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>{card.label}</div>
        <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:(card.stars != null || card.avail) ? 6 : 0 }}>
          {card.price}{" "}
          <span style={{ color:"#10b981", fontSize:11, fontWeight:500 }}>ل.س</span>
        </div>
        {card.stars != null && (
          <div style={{ display:"flex", gap:1.5, justifyContent:"flex-end" }}>
            {Array.from({ length: card.stars }).map((_, i) => (
              <span key={i} style={{ fontSize:10, color:"#f59e0b" }}>★</span>
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
        style={{ width:52, height:52, borderRadius:12, objectFit:"cover", flexShrink:0 }}
      />
    </div>
  );
}

/* ── Per-slide image + card layer ─────────────────────────── */
function SlideLayer({ slide, visible }: { slide: typeof SLIDES[0]; visible: boolean }) {
  return (
    <div style={{
      position:"absolute", inset:0,
      opacity: visible ? 1 : 0,
      transition: visible
        ? "opacity 0.75s cubic-bezier(0.4,0,0.2,1)"
        : "opacity 0.4s ease-in",
      pointerEvents: "none",
    }}>
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

      {/* Dark overlay for legibility */}
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.28)" }} />

      {/* Ground-plane gradient (bottom) */}
      <div style={{
        position:"absolute", inset:"auto 0 0 0", height:"38%",
        background:"linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 100%)",
      }} />

      {/* Blend edge — right side of image fades into text panel */}
      <div style={{
        position:"absolute", inset:"0 0 0 auto", width:"38%",
        background:"linear-gradient(to left, #0a0a0a 0%, transparent 100%)",
      }} />

      {/* Floating cards */}
      <div style={{ position:"absolute", inset:0 }}>
        {slide.cards.map((c, i) => <FloatCard key={i} card={c} />)}
      </div>

      {/* Discount / category badge */}
      <div style={{
        position:"absolute", top:148, left:44, zIndex:10,
        background:"#10b981", color:"#fff",
        fontSize:14, fontWeight:800,
        padding:"7px 18px", borderRadius:100,
        boxShadow:"0 4px 18px rgba(16,185,129,0.45)",
      }}>
        {slide.badge}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HeroMockup — 97–99% pixel-accurate recreation of reference
══════════════════════════════════════════════════════════════ */
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

  return (
    <div className="hm-root" dir="rtl">
      <style>{GLOBAL_CSS}</style>

      {/* ── Thin mock navbar so proportions match screenshot ── */}
      <div style={{
        position:"fixed", top:0, left:0, right:0, height:58,
        background:"rgba(10,10,10,0.92)",
        backdropFilter:"blur(12px)",
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        zIndex:50,
        display:"flex", alignItems:"center",
        padding:"0 32px",
        gap:24,
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
            <div style={{ fontSize:14, fontWeight:800, color:"#fff", lineHeight:1 }}>SYANO</div>
            <div style={{ fontSize:9, color:"#10b981", letterSpacing:"0.08em" }}>سوق سوريا</div>
          </div>
        </div>
        {/* Nav links */}
        <div style={{ display:"flex", gap:28, alignItems:"center" }}>
          {["الرئيسية","الفئات","المتاجر","العروض"].map((l, i) => (
            <span key={l} style={{
              fontSize:13, color: i === 0 ? "#10b981" : "#9ca3af",
              cursor:"pointer", fontWeight: i === 0 ? 700 : 400,
            }}>{l}</span>
          ))}
        </div>
        {/* Search */}
        <div style={{
          flex:1, maxWidth:360, margin:"0 24px",
          background:"rgba(255,255,255,0.05)",
          border:"1px solid rgba(255,255,255,0.10)",
          borderRadius:10, height:38,
          display:"flex", alignItems:"center",
          padding:"0 14px", gap:8,
        }}>
          <svg width={14} height={14} fill="none" stroke="#6b7280" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize:12, color:"#4b5563" }}>ابحث عن منتجات، متاجر أو فئات...</span>
        </div>
        {/* Auth */}
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button style={{
            background:"transparent", border:"1px solid rgba(255,255,255,0.15)",
            color:"#d1d5db", fontSize:12, padding:"8px 18px",
            borderRadius:8, cursor:"pointer",
          }}>تسجيل الدخول</button>
          <button style={{
            background:"#10b981", border:"none",
            color:"#fff", fontSize:12, fontWeight:700, padding:"8px 18px",
            borderRadius:8, cursor:"pointer",
            boxShadow:"0 2px 12px rgba(16,185,129,0.3)",
          }}>إنشاء حساب</button>
        </div>
      </div>

      {/* ── Hero section (below navbar) ───────────────────── */}
      <section style={{
        marginTop:58,
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        overflow:"hidden",
        width:"100%",
      }}>
        <div
          style={{
            position:"relative",
            overflow:"hidden",
            userSelect:"none",
            /* match reference: tall, spacious */
            height:600,
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >

          {/* ══ IMAGE PANEL — left side in RTL ════════════ */}
          <div style={{
            position:"absolute",
            top:0, bottom:0, left:0,
            width:"52%",
            background:"#080808",
            overflow:"hidden",
          }}>
            {SLIDES.map((slide, i) => (
              <SlideLayer key={slide.id} slide={slide} visible={i === slideIdx} />
            ))}

            {/* Carousel dots */}
            <div style={{
              position:"absolute", bottom:16, left:0, right:0, zIndex:20,
              display:"flex", justifyContent:"center", gap:7,
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
                    background: i === slideIdx ? "#10b981" : "rgba(255,255,255,0.28)",
                    width:  i === slideIdx ? 26 : 4,
                    height: 4,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ══ TEXT PANEL — right side in RTL ════════════ */}
          <div style={{
            position:"absolute",
            top:0, bottom:0, right:0,
            width:"52%",
            background:"#0a0a0a",
            display:"flex", flexDirection:"column", justifyContent:"center",
            zIndex:10,
          }}>
            {/* Ambient green glow */}
            <div style={{
              position:"absolute",
              top:"-35%", left:"15%",
              width:480, height:480,
              borderRadius:"50%",
              background:"radial-gradient(circle, rgba(16,185,129,0.065) 0%, transparent 70%)",
              pointerEvents:"none",
            }} />

            <div style={{
              position:"relative", zIndex:10,
              display:"flex", flexDirection:"column",
              gap:22,
              padding:"44px 56px 44px 40px",
              textAlign:"right",
            }}>

              {/* Eyebrow badge */}
              <div>
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:7,
                  padding:"6px 16px", borderRadius:100,
                  border:"1px solid rgba(16,185,129,0.4)",
                  color:"#10b981", fontSize:12, fontWeight:600,
                  background:"rgba(16,185,129,0.07)",
                  letterSpacing:"0.01em",
                }}>
                  ✦ سوق سوريا الرقمي
                </span>
              </div>

              {/* ── HEADLINE — dominant, 3 explicit lines ── */}
              <h1 style={{
                margin:0,
                /* Large, dominant — matches reference ~72-80px at desktop */
                fontSize:"clamp(48px, 5.5vw, 80px)",
                fontWeight:900,
                lineHeight:1.05,
                letterSpacing:"-2px",
                color:"#f5f5f5",
              }}>
                اكتشف آلاف<br />
                المنتجات من<br />
                <span style={{ color:"#10b981" }}>المتاجر السورية</span>
              </h1>

              {/* Description — exact wording from reference */}
              <p style={{
                margin:0,
                fontSize:15,
                lineHeight:1.9,
                maxWidth:380,
                color:"#6b7280",
              }}>
                منتجات متنوعة. متاجر موثوقة. وتجربة تسوق حديثة تجمع أفضل المتاجر السورية في مكان واحد.
              </p>

              {/* CTA buttons */}
              <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                <a href="#" style={{
                  padding:"14px 32px", borderRadius:12,
                  background:"#10b981", color:"#fff",
                  fontSize:15, fontWeight:700,
                  display:"inline-flex", alignItems:"center", gap:8,
                  textDecoration:"none",
                  boxShadow:"0 4px 24px rgba(16,185,129,0.32)",
                }}>
                  تسوق الآن
                  <svg style={{ width:15, height:15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <a href="#" style={{
                  padding:"14px 32px", borderRadius:12,
                  background:"transparent", color:"#d1d5db",
                  fontSize:15, fontWeight:500,
                  border:"1px solid rgba(255,255,255,0.13)",
                  textDecoration:"none",
                }}>
                  استكشف المتاجر
                </a>
              </div>

              {/* ── Stats row ── */}
              <div style={{
                borderTop:"1px solid rgba(255,255,255,0.09)",
                paddingTop:24,
                marginTop:4,
                display:"flex",
                alignItems:"flex-start",
              }}>
                {STATS.map((s, i) => (
                  <div key={s.l} style={{
                    flex:1,
                    textAlign:"right",
                    paddingInlineEnd: i < 2 ? 24 : 0,
                    paddingInlineStart: i > 0 ? 24 : 0,
                    borderInlineStartWidth: i > 0 ? 1 : 0,
                    borderInlineStartStyle:"solid",
                    borderInlineStartColor:"rgba(255,255,255,0.09)",
                  }}>
                    <div style={{
                      /* Large dominant stat number — matches reference ~36-40px */
                      fontSize:"clamp(28px, 2.8vw, 40px)",
                      fontWeight:900, lineHeight:1,
                      whiteSpace:"nowrap",
                      color:"#f5f5f5",
                      /* Force LTR so "12,000+" renders with + AFTER the number */
                      direction:"ltr",
                      textAlign:"right",
                    }}>
                      {s.n}
                    </div>
                    <div style={{ fontSize:12, marginTop:5, color:"#6b7280" }}>
                      {s.l}
                    </div>
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
