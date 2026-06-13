import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────
   GLOBAL CSS
   ───────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes kenBurns {
    0%   { transform: scale(1)    translate(0%,0%); }
    40%  { transform: scale(1.07) translate(-1.2%,0.8%); }
    70%  { transform: scale(1.04) translate(0.8%,-0.5%); }
    100% { transform: scale(1)    translate(0%,0%); }
  }
  @keyframes floatA {
    0%,100% { transform: translateY(0px) scale(1); }
    50%     { transform: translateY(-10px) scale(1.01); }
  }
  @keyframes floatC {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-7px); }
  }

  /* ── Premium scroll reveal ── */
  .sr {
    opacity: 0;
    transform: translateY(32px) scale(0.96);
    transition:
      opacity 0.85s cubic-bezier(0.16,1,0.3,1),
      transform 0.85s cubic-bezier(0.16,1,0.3,1);
    will-change: transform, opacity;
  }
  .sr.visible { opacity:1; transform:translateY(0) scale(1); }

  /* Cards get the same combined transform */
  .sr-card {
    opacity: 0;
    transform: translateY(28px) scale(0.96);
    transition:
      opacity 0.8s cubic-bezier(0.16,1,0.3,1),
      transform 0.8s cubic-bezier(0.16,1,0.3,1);
    will-change: transform, opacity;
  }
  .sr-card.visible { opacity:1; transform:translateY(0) scale(1); }

  /* ── Card hover ── */
  .sy-card {
    transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.28s ease,
                border-color 0.2s ease;
  }
  .sy-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 48px rgba(0,0,0,0.6);
    border-color: rgba(16,185,129,0.2) !important;
  }

  .sy-cat {
    transition: transform 0.22s ease;
    cursor: pointer;
    overflow: hidden;
  }
  .sy-cat:hover { transform: scale(1.025); }
  .sy-cat:hover img { filter: brightness(0.5) contrast(1.1) !important; }

  /* ── Deal card "أضف" button ── */
  .sy-add {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    color: #d1d5db;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
  }
  .sy-add:hover {
    background: #10b981 !important;
    color: #fff !important;
    border-color: #10b981 !important;
  }

  /* ── Heart ── */
  .sy-heart {
    background: rgba(10,10,10,0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.08);
    color: #6b7280;
    transition: color 0.18s, background 0.18s;
  }
  .sy-heart:hover { color:#f87171 !important; background:rgba(248,113,113,0.1) !important; }

  /* ── Store CTA ── */
  .sy-store-cta {
    background: none;
    border: 1px solid rgba(255,255,255,0.1);
    color: #9ca3af;
    transition: border-color 0.18s, color 0.18s;
  }
  .sy-store-cta:hover { border-color:rgba(16,185,129,0.4) !important; color:#10b981 !important; }
`;

/* ─────────────────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────────────────── */
const CATEGORIES = [
  { name:"إلكترونيات",     count:"12,450", img:"https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name:"موضة وملابس",    count:"8,320",  img:"https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name:"عطور وجمال",     count:"3,650",  img:"https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name:"منزل وديكور",    count:"6,780",  img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name:"رياضة وأحذية",   count:"5,230",  img:"https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name:"ساعات فاخرة",    count:"2,890",  img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name:"هواتف ذكية",     count:"4,120",  img:"https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name:"حواسيب ولابتوب", count:"3,470",  img:"https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=600" },
];

const DEALS = [
  { name:"عطر أوبسيديان إلكسير",  cat:"عطور وجمال",   price:"96,000",  orig:"148,000", disc:35, badge:"حصري",         rating:4.6, rev:89,  img:"https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name:"مجموعة تقنية متكاملة",  cat:"إلكترونيات",   price:"385,000", orig:"550,000", disc:30, badge:"جديد",          rating:4.8, rev:196, img:"https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name:"حذاء نايكي رياضي",      cat:"رياضة وأحذية", price:"58,000",  orig:"82,000",  disc:29, badge:"عرض محدود",     rating:4.7, rev:512, img:"https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name:"ساعة كلاسيكية ذهبية",  cat:"ساعات فاخرة",  price:"142,500", orig:"237,000", disc:40, badge:"الأكثر مبيعاً", rating:4.9, rev:284, img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=500" },
];

const STORES = [
  { name:"تك ستور سوريا", desc:"أحدث الإلكترونيات والأجهزة الذكية",  cat:"إلكترونيات",  cnt:"3,240", followers:"12.4K", letter:"ت", bg:"#0f4c81", rating:4.9, rev:1840, img:"https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name:"دار الأناقة",   desc:"أزياء فاخرة وموضة معاصرة للجميع",    cat:"موضة وملابس", cnt:"1,890", followers:"8.2K",  letter:"د", bg:"#6d28d9", rating:4.8, rev:2210, img:"https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name:"بيت الديكور",   desc:"أثاث عصري وإكسسوارات منزلية راقية",  cat:"منزل وديكور", cnt:"2,140", followers:"6.7K",  letter:"ب", bg:"#7c3aed", rating:4.7, rev:956,  img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600" },
];

const TRENDING = [
  { name:"لاب توب بلاك إيشن",    cat:"حواسيب",      seller:"تك ستور سوريا", rating:4.7, rev:213, price:"720,000", img:"https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=600",  hot:false },
  { name:"هاتف بريميوم Pro Max",  cat:"هواتف ذكية",  seller:"تك ستور سوريا", rating:4.8, rev:892, price:"850,000", img:"https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&w=600", hot:true  },
  { name:"ساعة كرونوغراف سيلفر", cat:"ساعات",       seller:"دار الأناقة",   rating:4.9, rev:341, price:"198,000", img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600",  hot:true  },
];

const SMALL_ARRIVALS = [
  { name:"عطر الأوبسيديان الليلي", cat:"عطور",        price:"89,500", days:"1 يوم",  img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=300" },
  { name:"ديكور منزلي مودرن",      cat:"منزل وديكور", price:"56,000", days:"3 أيام", img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=300" },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────── */
function Stars({ n, size = 12 }: { n:number; size?:number }) {
  return (
    <span style={{ display:"inline-flex", gap:1.5 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} style={{ width:size, height:size, color: i<=n ? "#f59e0b" : "#2a2a2a" }} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function Timer() {
  const [t, setT] = useState({ h:18, m:24, s:8 });
  useEffect(() => {
    const iv = setInterval(() => setT(p => {
      let { h,m,s } = p; s--;
      if (s<0){s=59;m--;} if(m<0){m=59;h--;} if(h<0)h=0;
      return {h,m,s};
    }), 1000);
    return () => clearInterval(iv);
  }, []);
  const z = (n:number) => String(n).padStart(2,"0");
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#9ca3af" }}>
      <svg style={{ width:13,height:13,color:"#10b981",flexShrink:0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span style={{ whiteSpace:"nowrap" }}>تنتهي خلال</span>
      <span style={{ display:"flex", alignItems:"center", gap:3 }}>
        {[z(t.h),z(t.m),z(t.s)].map((v,i) => (
          <span key={i} style={{ display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", fontFamily:"monospace", fontWeight:700, fontSize:12, padding:"2px 7px", borderRadius:5 }}>{v}</span>
            {i<2 && <span style={{ color:"#10b981", fontWeight:900 }}>:</span>}
          </span>
        ))}
      </span>
    </div>
  );
}

function StoreIcon() {
  return <svg style={{width:22,height:22,color:"#10b981"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 2L3 7l10 5 10-5-10-5zM3 17l10 5 10-5M3 12l10 5 10-5" /></svg>;
}
function BikeIcon() {
  return <svg style={{width:22,height:22,color:"#10b981"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4c-1.5 0-2.5 1-3 2l-4 8h2l1-2h8l1 2h2l-4-8c-.5-1-1.5-2-3-2zm0 2l2 4h-4l2-4zM6 14a3 3 0 100 6 3 3 0 000-6zm12 0a3 3 0 100 6 3 3 0 000-6z" /></svg>;
}

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL HOOKS
   ───────────────────────────────────────────────────────── */
function useReveal(threshold=0.1) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if(!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if(e.isIntersecting){ el.classList.add("visible"); obs.disconnect(); }
    },{ threshold });
    obs.observe(el);
    return () => obs.disconnect();
  },[threshold]);
  return ref;
}

/* Stagger children with premium combined transform */
function useStagger(count:number, stagger=100) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if(!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    children.forEach((ch,i) => {
      ch.classList.add("sr-card");
      ch.style.transitionDelay = `${i * stagger}ms`;
    });
    const obs = new IntersectionObserver(([e]) => {
      if(e.isIntersecting){
        children.forEach(ch => ch.classList.add("visible"));
        obs.disconnect();
      }
    },{ threshold:0.06 });
    obs.observe(el);
    return () => obs.disconnect();
  },[count, stagger]);
  return ref;
}

/* ─────────────────────────────────────────────────────────
   SECTION HEADER
   Matches reference exactly:
   • sup label: 12px green, separate line above title
   • title: 40px weight 800, right-aligned
   • "view all" link: left side, same vertical baseline as title
   ───────────────────────────────────────────────────────── */
const TITLE_STYLE = {
  margin:0,
  fontSize:40,
  fontWeight:800,
  color:"#fff",
  letterSpacing:"-0.5px",
  lineHeight:1.1,
} as const;

const SUP_STYLE = {
  display:"block",
  fontSize:12,
  fontWeight:600,
  color:"#10b981",
  letterSpacing:"0.04em",
  marginBottom:8,
} as const;

function SectionHeader({ sup, title, linkText }:{ sup:string; title:string; linkText:string }) {
  const ref = useReveal(0.25);
  return (
    <div ref={ref} className="sr" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:32 }}>
      {/* Title block — FIRST in DOM = RIGHT in RTL */}
      <div style={{ textAlign:"right" }}>
        <span style={SUP_STYLE}>{sup}</span>
        <h2 style={TITLE_STYLE}>{title}</h2>
      </div>
      {/* Link — SECOND in DOM = LEFT in RTL */}
      <button
        style={{ color:"#6b7280", fontSize:13, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, paddingBottom:6, flexShrink:0, transition:"color 0.2s" }}
        onMouseEnter={e=>(e.currentTarget.style.color="#10b981")}
        onMouseLeave={e=>(e.currentTarget.style.color="#6b7280")}
      >← {linkText}</button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   LAYOUT CONSTANTS — unified across all sections
   maxWidth 1260px, horizontal padding 64px
   ───────────────────────────────────────────────────────── */
const MAX_W = { maxWidth:1260, margin:"0 auto", padding:"0 64px" } as const;
/* Unified vertical section spacing */
const SEC_PB = 72; // padding-bottom for every section

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────── */
export function HomepageRedesign() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById("syano-scroll-root");
    if(!el) return;
    const fn = () => setScrolled(el.scrollTop > 20);
    el.addEventListener("scroll", fn, { passive:true });
    return () => el.removeEventListener("scroll", fn);
  },[]);

  /* Stagger grids */
  const catGrid    = useStagger(8,  60);
  const dealsGrid  = useStagger(4,  100);
  const storesGrid = useStagger(3,  110);
  const trendGrid  = useStagger(3,  110);

  return (
    <div
      id="syano-scroll-root"
      dir="rtl"
      style={{ fontFamily:"'Segoe UI',Tahoma,system-ui,sans-serif", background:"#080808", color:"#fff", minHeight:"100vh", overflowX:"hidden", overflowY:"auto", height:"100vh" }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* Grid texture */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)", backgroundSize:"72px 72px" }} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━ NAVBAR ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav style={{
        background: scrolled ? "rgba(8,8,8,0.97)" : "rgba(8,8,8,0.86)",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.04)",
        position:"sticky", top:0, zIndex:100,
        backdropFilter:"blur(24px)",
        transition:"background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
        boxShadow: scrolled ? "0 4px 40px rgba(0,0,0,0.45)" : "none",
      }}>
        <div style={{ ...MAX_W, height:64, display:"flex", alignItems:"center", gap:24 }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:36,height:36,borderRadius:9,background:"#10b981",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:"#fff" }}>S</div>
            <div>
              <div style={{ fontWeight:800,fontSize:17,letterSpacing:"-0.4px",lineHeight:1.1,color:"#fff" }}>SYANO</div>
              <div style={{ fontSize:9,color:"#6b7280",lineHeight:1 }}>سوق سوريا</div>
            </div>
          </div>
          {/* Nav */}
          <div style={{ display:"flex", gap:2 }}>
            {[{l:"الرئيسية",a:true},{l:"الفئات ▾",a:false},{l:"المتاجر",a:false},{l:"العروض",a:false}].map(({l,a})=>(
              <button key={l} style={{ padding:"6px 14px",borderRadius:7,fontSize:13,fontWeight:a?600:400,background:a?"rgba(255,255,255,0.07)":"transparent",color:a?"#fff":"#9ca3af",border:a?"1px solid rgba(255,255,255,0.1)":"1px solid transparent",cursor:"pointer" }}>{l}</button>
            ))}
          </div>
          {/* Search */}
          <div style={{ flex:1,position:"relative" }}>
            <input placeholder="ابحث عن منتجات، متاجر، أو فئات..."
              style={{ width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"9px 42px 9px 16px",fontSize:13,color:"#9ca3af",outline:"none",boxSizing:"border-box",textAlign:"right" }} />
            <svg style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#6b7280" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
            </svg>
          </div>
          {/* Auth */}
          <div style={{ display:"flex",gap:8,alignItems:"center",marginRight:"auto",flexShrink:0 }}>
            <button style={{ fontSize:13,color:"#d1d5db",background:"none",border:"none",cursor:"pointer",padding:"7px 12px" }}>تسجيل الدخول</button>
            <button style={{ fontSize:13,fontWeight:700,background:"#10b981",color:"#fff",border:"none",borderRadius:9,padding:"8px 20px",cursor:"pointer" }}>إنشاء حساب</button>
          </div>
        </div>
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position:"relative", overflow:"hidden", minHeight:640, zIndex:1 }}>
        {/* Ambient glows */}
        <div style={{ position:"absolute",top:-80,right:"18%",width:680,height:580,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(16,185,129,0.07) 0%,transparent 70%)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",bottom:0,left:"8%",width:460,height:360,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(245,158,11,0.04) 0%,transparent 70%)",pointerEvents:"none" }} />

        <div style={{ ...MAX_W, display:"flex", alignItems:"center", minHeight:640, gap:0 }}>

          {/* TEXT column — FIRST in DOM = RIGHT in RTL */}
          <div style={{ width:500, flexShrink:0, display:"flex", flexDirection:"column", gap:24, paddingTop:48, paddingBottom:64, textAlign:"right" }}>
            <div>
              <span style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:100,border:"1px solid rgba(16,185,129,0.4)",color:"#10b981",fontSize:11,fontWeight:600,background:"rgba(16,185,129,0.06)" }}>✦ سوق سوريا الرقمي</span>
            </div>
            <h1 style={{ margin:0, fontSize:60, fontWeight:900, lineHeight:1.08, letterSpacing:"-1.5px", color:"#fff" }}>
              اكتشف آلاف<br/>
              المنتجات من<br/>
              <span style={{ color:"#10b981" }}>المتاجر السورية</span>
            </h1>
            <p style={{ margin:0, color:"#9ca3af", fontSize:14, lineHeight:1.8, fontWeight:400 }}>
              منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة تجمع أفضل المتاجر السورية في مكان واحد.
            </p>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <button style={{ padding:"13px 30px",borderRadius:12,background:"#10b981",color:"#fff",fontSize:14,fontWeight:700,border:"none",cursor:"pointer" }}>تسوق الآن ←</button>
              <button style={{ padding:"13px 30px",borderRadius:12,background:"transparent",color:"#d1d5db",fontSize:14,fontWeight:400,border:"1px solid rgba(255,255,255,0.12)",cursor:"pointer" }}>استكشف المتاجر</button>
            </div>
            {/* Stats — right to left: +12,000 | +25,000 | +500 */}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:28, display:"flex", alignItems:"flex-start" }}>
              {[
                { n:"+12,000", l:"عميل راضٍ" },
                { n:"+25,000", l:"منتج فاعل" },
                { n:"+500",    l:"متاجر نشطة" },
              ].map((s,i)=>(
                <div key={s.l} style={{ flex:1,textAlign:"right", paddingInlineEnd:i<2?20:0, paddingInlineStart:i>0?20:0, borderInlineStart:i>0?"1px solid rgba(255,255,255,0.07)":"none" }}>
                  <div style={{ fontSize:28,fontWeight:900,color:"#fff",lineHeight:1,whiteSpace:"nowrap" }}>{s.n}</div>
                  <div style={{ fontSize:11,color:"#6b7280",marginTop:4,fontWeight:400 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* IMAGE column — SECOND in DOM = LEFT in RTL */}
          <div style={{ flex:1, position:"relative", height:600, marginRight:56 }}>
            <div style={{ position:"absolute",inset:0,borderRadius:24,overflow:"hidden" }}>
              <img
                src="https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=1000"
                alt=""
                style={{ width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.5) contrast(1.15)",animation:"kenBurns 24s ease-in-out infinite",transformOrigin:"center center",willChange:"transform" }}
              />
              {/* Gradient: fade to background on the right (text side) */}
              <div style={{ position:"absolute",inset:0,background:"linear-gradient(to right,transparent 30%,#080808 100%)" }} />
              <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(8,8,8,0.65) 0%,transparent 45%)" }} />
            </div>
            {/* Float top */}
            <div style={{ position:"absolute",top:36,left:32,zIndex:2,background:"rgba(10,10,10,0.9)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:16,padding:"12px 16px",display:"flex",gap:12,alignItems:"center",width:220,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"floatA 5s ease-in-out infinite",willChange:"transform" }}>
              <div style={{ flex:1,textAlign:"right" }}>
                <div style={{ fontSize:10,color:"#9ca3af",marginBottom:3 }}>عطار ديور سوهاج</div>
                <div style={{ fontSize:14,fontWeight:700,color:"#fff",marginBottom:5 }}>75,000 <span style={{ color:"#10b981",fontSize:10,fontWeight:400 }}>ل.س</span></div>
                <Stars n={5} size={11} />
              </div>
              <img src="https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width:44,height:44,borderRadius:10,objectFit:"cover",flexShrink:0 }} />
            </div>
            {/* Float mid */}
            <div style={{ position:"absolute",top:208,left:24,zIndex:2,background:"rgba(10,10,10,0.9)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:16,padding:"12px 16px",display:"flex",gap:12,alignItems:"center",width:196,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"floatC 7s 1.5s ease-in-out infinite",willChange:"transform" }}>
              <div style={{ flex:1,textAlign:"right" }}>
                <div style={{ fontSize:10,color:"#9ca3af",marginBottom:3 }}>مومية رالية</div>
                <div style={{ fontSize:14,fontWeight:700,color:"#fff" }}>38,500 <span style={{ color:"#10b981",fontSize:10,fontWeight:400 }}>ل.س</span></div>
              </div>
              <img src="https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width:44,height:44,borderRadius:10,objectFit:"cover",flexShrink:0 }} />
            </div>
            {/* Float bottom */}
            <div style={{ position:"absolute",bottom:52,left:48,zIndex:2,background:"rgba(10,10,10,0.9)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:16,padding:"12px 16px",display:"flex",gap:12,alignItems:"center",width:232,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"floatA 6s 3s ease-in-out infinite",willChange:"transform" }}>
              <div style={{ flex:1,textAlign:"right" }}>
                <div style={{ fontSize:10,color:"#9ca3af",marginBottom:3 }}>ساعة خضرية فاخرة</div>
                <div style={{ fontSize:14,fontWeight:700,color:"#fff",marginBottom:5 }}>142,000 <span style={{ color:"#10b981",fontSize:10,fontWeight:400 }}>ل.س</span></div>
                <div style={{ fontSize:10,color:"#10b981",display:"flex",alignItems:"center",gap:3 }}>● متوفر الآن</div>
              </div>
              <img src="https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width:44,height:44,borderRadius:10,objectFit:"cover",flexShrink:0 }} />
            </div>
            {/* Discount badge */}
            <div style={{ position:"absolute",top:128,right:64,zIndex:2,background:"#10b981",color:"#fff",fontSize:13,fontWeight:800,padding:"6px 14px",borderRadius:100 }}>خصم ٨٠٪</div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━ CATEGORIES ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB, paddingTop:SEC_PB }}>
        <div style={MAX_W}>
          <SectionHeader sup="تصفح حسب الفئة" title="الفئات الأكثر شيوعاً" linkText="عرض الكل" />
          <div ref={catGrid} style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {CATEGORIES.map(c=>(
              <div key={c.name} className="sy-cat" style={{ position:"relative", height:200, borderRadius:14, overflow:"hidden" }}>
                <img src={c.img} alt={c.name} style={{ width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.38) contrast(1.1)",display:"block",transition:"filter 0.3s ease" }} />
                <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.1) 60%,transparent 100%)" }} />
                <div style={{ position:"absolute",bottom:0,right:0,padding:"0 14px 14px",textAlign:"right" }}>
                  <div style={{ fontSize:14,fontWeight:700,color:"#fff",marginBottom:2 }}>{c.name}</div>
                  <div style={{ fontSize:11,color:"#9ca3af",fontWeight:400 }}>{c.count} منتج</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━ FEATURED DEALS ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
        <div style={{ position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:800,height:400,background:"radial-gradient(ellipse,rgba(16,185,129,0.035) 0%,transparent 70%)",pointerEvents:"none" }} />
        <div style={MAX_W}>
          {/* Deals header — matches screenshot: sup+title on RIGHT, link+timer on LEFT */}
          <div className="sr" ref={useReveal()} style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:32 }}>
            <div style={{ textAlign:"right" }}>
              <span style={SUP_STYLE}>عروض حصرية</span>
              <h2 style={TITLE_STYLE}>عروض مميزة</h2>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:10,alignItems:"flex-start",paddingBottom:6 }}>
              <button style={{ color:"#6b7280",fontSize:13,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"color 0.2s",whiteSpace:"nowrap" }}
                onMouseEnter={e=>(e.currentTarget.style.color="#10b981")}
                onMouseLeave={e=>(e.currentTarget.style.color="#6b7280")}
              >← كل العروض</button>
              <Timer />
            </div>
          </div>

          {/* Deal cards — matching reference: near-transparent bg, tall image, small أضف pill */}
          <div ref={dealsGrid} style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {DEALS.map(d=>(
              <div key={d.name} className="sy-card" style={{ background:"#0b0b0b", borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column" }}>
                {/* Image */}
                <div style={{ position:"relative", height:226, flexShrink:0 }}>
                  <img src={d.img} alt={d.name} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
                  {/* Subtle gradient */}
                  <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(11,11,11,0.45) 0%,transparent 50%)" }} />
                  {/* Discount % — left */}
                  <span style={{ position:"absolute",top:10,left:10,background:"#10b981",color:"#fff",fontSize:11,fontWeight:800,padding:"3px 9px",borderRadius:100 }}>-{d.disc}%</span>
                  {/* Label — right */}
                  <span style={{ position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",color:"#e5e7eb",fontSize:10,fontWeight:600,padding:"3px 8px",borderRadius:5,border:"1px solid rgba(255,255,255,0.1)" }}>{d.badge}</span>
                  {/* Heart — bottom left of image */}
                  <button className="sy-heart" style={{ position:"absolute",bottom:10,left:10,width:28,height:28,borderRadius:"50%",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>♡</button>
                </div>

                {/* Content */}
                <div style={{ padding:"14px 16px 16px", flex:1, display:"flex", flexDirection:"column" }}>
                  {/* Category */}
                  <div style={{ fontSize:10,color:"#6b7280",textAlign:"right",marginBottom:5,fontWeight:500,letterSpacing:"0.03em" }}>{d.cat}</div>
                  {/* Product name — large, matches reference */}
                  <div style={{ fontSize:17,fontWeight:800,color:"#fff",textAlign:"right",lineHeight:1.35,marginBottom:10,flex:1 }}>{d.name}</div>
                  {/* Rating */}
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"flex-end",gap:5,marginBottom:14 }}>
                    <span style={{ fontSize:10,color:"#6b7280" }}>({d.rev})</span>
                    <span style={{ fontSize:12,fontWeight:700,color:"#f5f5f5" }}>{d.rating}</span>
                    <Stars n={Math.floor(d.rating)} size={12} />
                  </div>
                  {/* Bottom row: [أضف pill LEFT] [price info RIGHT] — matches reference exactly */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                    {/* أضف button — small pill, LEFT in RTL (second in DOM) */}
                    <button className="sy-add" style={{ borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0 }}>أضف</button>
                    {/* Price — RIGHT in RTL (first in DOM) */}
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:18,fontWeight:900,color:"#10b981",lineHeight:1 }}>{d.price} <span style={{ fontSize:10,color:"#6b7280",fontWeight:400 }}>ل.س</span></div>
                      <div style={{ fontSize:10,color:"#6b7280",textDecoration:"line-through",marginTop:2 }}>{d.orig} ل.س</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━ TRUSTED STORES ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
        <div style={MAX_W}>
          <SectionHeader sup="شركاؤنا التجاريون" title="متاجر موثوقة" linkText="جميع المتاجر" />
          <div ref={storesGrid} style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {STORES.map(s=>(
              <div key={s.name} className="sy-card" style={{ background:"#0b0b0b", borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.06)" }}>
                {/* Banner */}
                <div style={{ position:"relative", height:120 }}>
                  <img src={s.img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.28)",display:"block" }} />
                  <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,#0b0b0b 0%,transparent 55%)" }} />
                  {/* Verified badge */}
                  <span style={{ position:"absolute",top:12,right:12,display:"flex",alignItems:"center",gap:3,background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.28)",color:"#10b981",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:100,backdropFilter:"blur(8px)" }}>
                    <svg style={{ width:9,height:9 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    موثوق
                  </span>
                  {/* Avatar */}
                  <div style={{ position:"absolute",bottom:-24,left:"50%",transform:"translateX(-50%)",width:48,height:48,borderRadius:12,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",border:"2px solid #0b0b0b",boxShadow:"0 4px 16px rgba(0,0,0,0.5)",flexShrink:0 }}>{s.letter}</div>
                </div>
                {/* Body */}
                <div style={{ padding:"34px 16px 18px", textAlign:"center" }}>
                  <div style={{ fontSize:15,fontWeight:700,color:"#f0f0f0",marginBottom:5 }}>{s.name}</div>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginBottom:8 }}>
                    <Stars n={Math.floor(s.rating)} size={12} />
                    <span style={{ fontSize:12,fontWeight:600,color:"#e5e7eb" }}>{s.rating}</span>
                    <span style={{ fontSize:10,color:"#6b7280" }}>({s.rev})</span>
                  </div>
                  <p style={{ margin:"0 0 14px",fontSize:12,color:"#9ca3af",lineHeight:1.65,fontWeight:400 }}>{s.desc}</p>
                  {/* Stats */}
                  <div style={{ display:"flex",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:14,marginBottom:14 }}>
                    <div style={{ flex:1,textAlign:"center",paddingInlineEnd:12,borderInlineStart:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize:14,fontWeight:700,color:"#fff" }}>{s.cnt}</div>
                      <div style={{ fontSize:10,color:"#6b7280",marginTop:2 }}>منتج</div>
                    </div>
                    <div style={{ flex:1,textAlign:"center",paddingInlineStart:12 }}>
                      <div style={{ fontSize:14,fontWeight:700,color:"#fff" }}>{s.followers}</div>
                      <div style={{ fontSize:10,color:"#6b7280",marginTop:2 }}>متابع</div>
                    </div>
                  </div>
                  {/* CTA */}
                  <button className="sy-store-cta" style={{ width:"100%",padding:"9px",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
                    <svg style={{ width:13,height:13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    زيارة المتجر
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━ TRENDING ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
        <div style={MAX_W}>
          <SectionHeader sup="الأعلى تقييماً هذا الأسبوع" title="المنتجات الرائجة" linkText="عرض الكل" />
          <div ref={trendGrid} style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {TRENDING.map(p=>(
              <div key={p.name} className="sy-card" style={{ background:"#0b0b0b", borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ position:"relative", height:295 }}>
                  <img src={p.img} alt={p.name} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block",filter:"brightness(0.7)" }} />
                  <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(11,11,11,0.93) 0%,transparent 52%)" }} />
                  {p.hot && (
                    <span style={{ position:"absolute",top:12,right:12,background:"#10b981",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:100 }}>↑ رائج</span>
                  )}
                  <button className="sy-heart" style={{ position:"absolute",top:12,left:12,width:30,height:30,borderRadius:"50%",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>♡</button>
                  {/* Overlay info */}
                  <div style={{ position:"absolute",bottom:0,right:0,left:0,padding:"0 16px 14px",textAlign:"right" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                      <div style={{ fontSize:10,color:"#9ca3af" }}>{p.cat} · {p.seller}</div>
                    </div>
                    <div style={{ fontSize:16,fontWeight:700,color:"#fff",marginBottom:8,lineHeight:1.3 }}>{p.name}</div>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                        <Stars n={Math.floor(p.rating)} size={11} />
                        <span style={{ fontSize:10,color:"#9ca3af" }}>({p.rev})</span>
                      </div>
                      <span style={{ fontSize:17,fontWeight:800,color:"#fff" }}>{p.price} <span style={{ fontSize:10,color:"#9ca3af",fontWeight:400 }}>ل.س</span></span>
                    </div>
                  </div>
                </div>
                <div style={{ padding:"10px 14px 14px" }}>
                  <button className="sy-add" style={{ width:"100%",fontSize:12,fontWeight:700,padding:"9px",borderRadius:8,cursor:"pointer" }}>أضف للسلة</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━ NEW ARRIVALS ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
        <div style={MAX_W}>
          <SectionHeader sup="أضيف لنا" title="وصل حديثاً" linkText="الجديد كل يوم" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 356px", gap:14 }}>
            {/* Large card — first = RIGHT */}
            <div className="sr" ref={useReveal()} style={{ position:"relative",borderRadius:18,overflow:"hidden",minHeight:386 }}>
              <img src="https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=900" alt="" style={{ width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.3) contrast(1.1)",display:"block" }} />
              <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.94) 0%,rgba(0,0,0,0.05) 55%)" }} />
              <div style={{ position:"absolute",top:20,right:20 }}>
                <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:11,color:"#10b981",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",padding:"4px 12px",borderRadius:100,fontWeight:600 }}>↑ جديد منذ 2 أيام</span>
              </div>
              <div style={{ position:"absolute",bottom:0,right:0,left:0,padding:"0 28px 28px",textAlign:"right" }}>
                <div style={{ fontSize:11,color:"#9ca3af",marginBottom:6,fontWeight:400 }}>إلكترونيات</div>
                <div style={{ fontSize:26,fontWeight:800,color:"#fff",marginBottom:10,lineHeight:1.2 }}>مجموعة تقنية بريميوم 2025</div>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6,marginBottom:10 }}>
                  <span style={{ fontSize:11,color:"#9ca3af" }}>(12 تقييم)</span>
                  <span style={{ fontSize:12,fontWeight:600,color:"#fff" }}>4.8</span>
                  <Stars n={5} size={12} />
                </div>
                <div style={{ fontSize:26,fontWeight:900,color:"#10b981" }}>435,000 <span style={{ fontSize:13,fontWeight:400,color:"#9ca3af" }}>ل.س</span></div>
              </div>
            </div>
            {/* Small cards — second = LEFT */}
            <div className="sr" ref={useReveal()} style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {SMALL_ARRIVALS.map(a=>(
                <div key={a.name} style={{ background:"#0b0b0b",borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)",display:"flex",height:186 }}>
                  <div style={{ flex:1,padding:"16px 16px",textAlign:"right",display:"flex",flexDirection:"column",justifyContent:"space-between" }}>
                    <div>
                      <span style={{ display:"inline-flex",alignItems:"center",gap:3,fontSize:10,color:"#10b981",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.18)",padding:"2px 7px",borderRadius:100,marginBottom:7,fontWeight:600 }}>● منذ {a.days}</span>
                      <div style={{ fontSize:10,color:"#6b7280",marginBottom:3,fontWeight:400 }}>{a.cat}</div>
                      <div style={{ fontSize:15,fontWeight:700,color:"#f0f0f0",lineHeight:1.35 }}>{a.name}</div>
                    </div>
                    <div style={{ fontSize:19,fontWeight:800,color:"#10b981" }}>{a.price} <span style={{ fontSize:11,fontWeight:400,color:"#9ca3af" }}>ل.س</span></div>
                  </div>
                  <div style={{ width:138,flexShrink:0 }}>
                    <img src={a.img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block",filter:"brightness(0.7)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━ JOIN CTA ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
        <div style={MAX_W}>
          <div className="sr" ref={useReveal()}>
            <div style={{ background:"#0a0a0a",borderRadius:24,border:"1px solid rgba(255,255,255,0.07)",padding:"72px 64px",textAlign:"center",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:-50,left:"50%",transform:"translateX(-50%)",width:600,height:300,background:"radial-gradient(ellipse,rgba(16,185,129,0.06) 0%,transparent 70%)",pointerEvents:"none" }} />
              <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"5px 16px",borderRadius:100,border:"1px solid rgba(16,185,129,0.3)",color:"#10b981",fontSize:11,fontWeight:600,marginBottom:20,background:"rgba(16,185,129,0.06)" }}>انضم إلى سيانو</span>
              <h2 style={{ ...TITLE_STYLE, marginBottom:12 }}>كن جزءاً من السوق السوري</h2>
              <p style={{ margin:"0 0 44px",color:"#9ca3af",fontSize:14,fontWeight:400,lineHeight:1.7 }}>سواء كنت بائعاً أو مندوب توصيل، هناك مكان لك في سيانو.</p>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:720,margin:"0 auto" }}>
                {[
                  { Icon:StoreIcon, title:"ابدأ البيع على سيانو",  desc:"افتح متجرك الإلكتروني وتواصل مع آلاف المشترين في جميع أنحاء سوريا",       link:"إنشاء متجري" },
                  { Icon:BikeIcon,  title:"انضم كمندوب توصيل",    desc:"حقق دخلاً إضافياً من خلال توصيل الطلبات في مدينتك بمرونة كاملة في عملك", link:"التسجيل كمندوب" },
                ].map(c=>(
                  <div key={c.title} style={{ background:"#111",borderRadius:16,padding:"36px 28px",border:"1px solid rgba(255,255,255,0.06)",textAlign:"center" }}>
                    <div style={{ width:52,height:52,borderRadius:"50%",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.18)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px" }}><c.Icon /></div>
                    <div style={{ fontSize:18,fontWeight:700,color:"#fff",marginBottom:10 }}>{c.title}</div>
                    <p style={{ fontSize:13,color:"#9ca3af",lineHeight:1.7,marginBottom:22,fontWeight:400 }}>{c.desc}</p>
                    <button style={{ background:"none",border:"none",color:"#10b981",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:3,margin:"0 auto" }}>{c.link} ←</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.05)",background:"#060606",position:"relative",zIndex:1 }}>
        <div style={{ ...MAX_W, padding:"64px 64px 52px" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr",gap:40 }}>
            {/* Brand */}
            <div style={{ textAlign:"right" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,justifyContent:"flex-end",marginBottom:14 }}>
                <span style={{ fontWeight:800,fontSize:18,color:"#fff" }}>SYANO</span>
                <div style={{ width:34,height:34,borderRadius:9,background:"#10b981",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:"#fff" }}>S</div>
              </div>
              <p style={{ fontSize:13,color:"#6b7280",lineHeight:1.75,marginBottom:20,fontWeight:400 }}>منصة التجارة الإلكترونية السورية الأولى</p>
              <div style={{ display:"flex",gap:7,justifyContent:"flex-end",marginBottom:28 }}>
                {[{i:"▶",l:"YouTube"},{i:"f",l:"Facebook"},{i:"𝕏",l:"Twitter"},{i:"◉",l:"Instagram"}].map(s=>(
                  <button key={s.l} title={s.l} style={{ width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"#9ca3af",fontSize:13,cursor:"pointer" }}>{s.i}</button>
                ))}
              </div>
              <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"18px" }}>
                <div style={{ fontSize:13,fontWeight:600,color:"#fff",marginBottom:5,textAlign:"right" }}>اشترك في النشرة البريدية</div>
                <div style={{ fontSize:12,color:"#6b7280",marginBottom:12,textAlign:"right",fontWeight:400 }}>أحدث العروض مباشرة إلى بريدك</div>
                <input placeholder="بريدك الإلكتروني..." style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"9px 12px",fontSize:12,color:"#d1d5db",outline:"none",marginBottom:8,textAlign:"right" }} />
                <button style={{ width:"100%",background:"#10b981",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer" }}>← اشترك</button>
              </div>
            </div>
            {/* Link columns */}
            {[
              { title:"السوق",     links:["جميع المنتجات","العروض والتخفيضات","المتاجر الموثوقة","المنتجات الجديدة","الأكثر مبيعاً"] },
              { title:"للبائعين", links:["افتح متجرك","لوحة التاجر","خطط العمولة","سياسة المراجعات","مركز المساعدة"] },
              { title:"الشركة",   links:["من نحن","التوصيل والشحن","سياسة الخصوصية","الشروط والأحكام","تواصل معنا"] },
            ].map(col=>(
              <div key={col.title} style={{ textAlign:"right" }}>
                <div style={{ fontSize:13,fontWeight:600,color:"#fff",marginBottom:18 }}>{col.title}</div>
                <ul style={{ listStyle:"none",margin:0,padding:0,display:"flex",flexDirection:"column",gap:12 }}>
                  {col.links.map(l=><li key={l}><a href="#" style={{ fontSize:13,color:"#6b7280",textDecoration:"none",fontWeight:400 }}>{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ ...MAX_W, padding:"14px 64px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex",gap:7 }}>
              {["SyriaTel Cash","PayPal","MasterCard","VISA"].map(p=>(
                <span key={p} style={{ fontSize:10,color:"#4b5563",background:"rgba(255,255,255,0.03)",padding:"3px 9px",borderRadius:5,border:"1px solid rgba(255,255,255,0.05)" }}>{p}</span>
              ))}
            </div>
            <span style={{ fontSize:11,color:"#4b5563" }}>© SYANO 2025 — جميع الحقوق محفوظة</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
