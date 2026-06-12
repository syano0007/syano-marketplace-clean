import { useState, useEffect } from "react";

/* ─── Design Tokens (matching marketplace index.css) ─── */
const G = "#059669";       // primary green
const G_DARK = "#047857";
const G_LIGHT = "#ECFDF5";
const BG = "#F8FAFC";
const WHITE = "#FFFFFF";
const TEXT = "#111827";
const TEXT_2 = "#6B7280";
const BORDER = "#E5E7EB";
const HERO_BG = "#0F172A";
const RED = "#EF4444";

/* ─── Mock Data ─── */
const CATS = [
  { id:1, icon:"💻", name:"إلكترونيات", count:2356 },
  { id:2, icon:"👗", name:"أزياء",       count:1928 },
  { id:3, icon:"🏠", name:"المنزل والطبخ", count:2045 },
  { id:4, icon:"💄", name:"الجمال والعناية", count:1324 },
  { id:5, icon:"🚗", name:"السيارات",    count:982  },
  { id:6, icon:"🎭", name:"الرياضة والترفيه", count:1296 },
  { id:7, icon:"🧸", name:"الأطفال والألعاب", count:1874 },
  { id:8, icon:"🛒", name:"البقالة",     count:1102 },
];

const MOSAIC = [
  { name:"هاتف سامسونج جالاكسي A54", price:"1,299,000", old:"1,599,000", disc:19, icon:"📱", bg:"linear-gradient(135deg,#1e3a8a,#2563eb)" },
  { name:"ساعة ذكية Huawei Band 7",   price:"399,000",   old:"450,000",   disc:11, icon:"⌚", bg:"linear-gradient(135deg,#4c1d95,#7c3aed)" },
  { name:"سماعة سوني WH-CH520",       price:"499,000",   old:"660,000",   disc:24, icon:"🎧", bg:"linear-gradient(135deg,#064e3b,#059669)" },
  { name:"عطر دور سوهار 100 مل",      price:"599,000",   old:"660,000",   disc:9,  icon:"🧴", bg:"linear-gradient(135deg,#7c2d12,#dc2626)" },
];

const DEALS = [
  { id:1,  icon:"🎧", name:"ريدمي بودز 4 برو",        price:"299,000", old:"380,000", disc:21, rating:4.8, reviews:128, seller:"Tech Store" },
  { id:2,  icon:"☕", name:"ماكينة قهوة ميبيتا",       price:"1,399,000",old:"1,900,000",disc:26, rating:4.6, reviews:56, seller:"Home Hub" },
  { id:3,  icon:"👟", name:"حذاء نايكي رياضي",         price:"359,000", old:"400,000", disc:10, rating:4.7, reviews:231, seller:"Sports World" },
  { id:4,  icon:"📱", name:"شاومي ريدمي نوت 12",       price:"1,199,000",old:"1,400,000",disc:14, rating:4.5, reviews:87, seller:"Mobile Pro" },
  { id:5,  icon:"🍲", name:"طقم قدور فوري 10 قطع",     price:"399,000", old:"480,000", disc:17, rating:4.4, reviews:42, seller:"Kitchen Co" },
  { id:6,  icon:"🌀", name:"ساعة كاسيو الرجال",        price:"449,000", old:"500,000", disc:10, rating:4.6, reviews:64, seller:"Watch House" },
];

const BEST_SELLERS = [
  { id:1, icon:"📱", name:"هاتف آيفون 14 برو",          price:"2,599,000", rating:4.8, reviews:329, seller:"Apple Store SY" },
  { id:2, icon:"⌚", name:"ساعة آبل سيريز 9",            price:"1,649,000", rating:4.9, reviews:98,  seller:"Tech Center" },
  { id:3, icon:"🎧", name:"سماعة JBL Tune 510BT",       price:"299,000",   rating:4.7, reviews:37,  seller:"Electronics Hub" },
  { id:4, icon:"💻", name:"لابتوب HP Core i5",           price:"2,199,000", rating:4.6, reviews:74,  seller:"Computer World" },
  { id:5, icon:"🧴", name:"عطر طاقة كلاسيكية",          price:"399,000",   rating:4.5, reviews:113, seller:"Perfume Palace" },
  { id:6, icon:"🎮", name:"بلايستيشن 5",                price:"2,499,000", rating:4.9, reviews:86,  seller:"Gaming Zone SY" },
];

const STORES = [
  { id:1, avatar:"T", name:"متجر الشمر",       cat:"الإلكترونيات", rating:4.9, reviews:1256, tier:"business", color:"#2563eb", products:284 },
  { id:2, avatar:"ب", name:"بيت المطبخ",      cat:"أدوات المطبخ",  rating:4.8, reviews:892,  tier:"verified",  color:"#d97706", products:193 },
  { id:3, avatar:"م", name:"منزلك المصري",    cat:"المنزل والديكور",rating:4.7, reviews:1103, tier:"verified",  color:"#059669", products:147 },
  { id:4, avatar:"ج", name:"الجمال الطبيعي", cat:"العناية الشخصية",rating:4.9, reviews:765,  tier:"verified",  color:"#7c3aed", products:210 },
];

const NEW_ARRIVALS = [
  { id:1, icon:"📷", name:"كاميرا كانون EOS R50",  price:"2,599,000", rating:4.8, reviews:12 },
  { id:2, icon:"⌨️", name:"كيبورد لوجيتك MX Keys", price:"480,000",   rating:4.7, reviews:34 },
  { id:3, icon:"🎮", name:"يد تحكم Xbox الجديدة",  price:"299,000",   rating:4.6, reviews:8  },
  { id:4, icon:"🧴", name:"عطر فرزاتشي الجديد",   price:"650,000",   rating:4.5, reviews:22 },
  { id:5, icon:"👟", name:"اديداس ألترابوست 24",  price:"620,000",   rating:4.7, reviews:19 },
  { id:6, icon:"🍲", name:"طاجن ذكي 5 لتر",       price:"490,000",   rating:4.4, reviews:6  },
];

/* ─── Sub-components ─── */

function Stars({ r }: { r: number }) {
  return <span style={{ color:"#F59E0B", fontSize:11 }}>{"★".repeat(Math.floor(r))}{"☆".repeat(5-Math.floor(r))}</span>;
}

function Countdown() {
  const [t, setT] = useState({ h:12, m:45, s:30 });
  useEffect(() => {
    const iv = setInterval(() => setT(p => {
      let { h, m, s } = p;
      if (--s < 0) { s=59; if (--m < 0) { m=59; if (--h < 0) h=23; } }
      return { h, m, s };
    }), 1000);
    return () => clearInterval(iv);
  }, []);
  const pad = (n: number) => String(n).padStart(2,"0");
  return (
    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
      {[pad(t.h), pad(t.m), pad(t.s)].map((v,i) => (
        <span key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ background:HERO_BG, color:"#fff", fontWeight:700, fontSize:15, padding:"3px 7px", borderRadius:6, fontVariantNumeric:"tabular-nums" }}>{v}</span>
          {i<2 && <span style={{ color:TEXT, fontWeight:700 }}>:</span>}
        </span>
      ))}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const cfg: Record<string,{bg:string;color:string;label:string}> = {
    business:{ bg:"#EDE9FE", color:"#7C3AED", label:"موثوق" },
    verified: { bg:G_LIGHT,   color:G,          label:"موثوق" },
  };
  const c = cfg[tier] ?? cfg.verified;
  return (
    <span style={{ background:c.bg, color:c.color, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, border:`1px solid ${c.color}30` }}>
      ✓ {c.label}
    </span>
  );
}

function ProductCard({ p, showDisc=false }: { p:any; showDisc?:boolean }) {
  const [hov, setHov] = useState(false);
  const [wished, setWished] = useState(false);
  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background:WHITE, borderRadius:16, border:`1px solid ${BORDER}`,
        overflow:"hidden", display:"flex", flexDirection:"column",
        boxShadow: hov ? "0 8px 28px rgba(0,0,0,0.12)" : "0 1px 6px rgba(0,0,0,0.06)",
        transform: hov ? "translateY(-2px)" : "none",
        transition:"all 0.2s ease", cursor:"pointer", position:"relative",
      }}
    >
      {/* Image area */}
      <div style={{ background:"#F8FAFC", height:170, display:"flex", alignItems:"center", justifyContent:"center", fontSize:60, position:"relative" }}>
        {p.icon}
        {/* Discount badge */}
        {(showDisc && p.disc) && (
          <span style={{ position:"absolute", top:10, right:10, background:RED, color:"#fff", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20 }}>
            -{p.disc}%
          </span>
        )}
        {/* Heart */}
        <button
          onClick={e=>{e.stopPropagation();setWished(w=>!w);}}
          style={{ position:"absolute", top:10, left:10, background:"#fff", border:"none", borderRadius:20, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 1px 6px rgba(0,0,0,0.12)", fontSize:14, color: wished ? RED : TEXT_2 }}
        >
          {wished ? "♥" : "♡"}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding:"12px 14px 14px", flex:1, display:"flex", flexDirection:"column", gap:6 }}>
        <div style={{ fontSize:12, color:TEXT_2 }}>{p.seller || "متجر سيانو"}</div>
        <div style={{ fontSize:13, fontWeight:600, color:TEXT, lineHeight:1.45, minHeight:38, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {p.name}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <Stars r={p.rating} />
          <span style={{ fontSize:11, color:TEXT_2 }}>({p.reviews})</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
          <span style={{ fontSize:15, fontWeight:800, color:G }}>{p.price}</span>
          {showDisc && p.old && <span style={{ fontSize:12, color:TEXT_2, textDecoration:"line-through" }}>{p.old}</span>}
        </div>
        <button style={{ marginTop:6, background:G, color:"#fff", border:"none", borderRadius:10, padding:"9px 0", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          🛒 أضف للسلة
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function HomepageV4() {
  return (
    <div dir="rtl" style={{ fontFamily:"Cairo, system-ui, sans-serif", background:BG, color:TEXT, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        a { text-decoration: none; }
        input, select, button { font-family: inherit; }
      `}</style>

      {/* ══════════════════════════════════════════
          1. HEADER
      ══════════════════════════════════════════ */}
      <header style={{ background:WHITE, borderBottom:`1px solid ${BORDER}`, position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 10px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px", height:60, display:"flex", alignItems:"center", gap:16 }}>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${G},${G_DARK})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:18 }}>S</div>
            <div>
              <div style={{ fontWeight:900, fontSize:16, color:TEXT, lineHeight:1 }}>SYANO</div>
              <div style={{ fontSize:10, color:TEXT_2, lineHeight:1 }}>سوق سوريا</div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
            {["الرئيسية","الأقسام","العروض","وصل جديداً","عن سيانو"].map((l,i) => (
              <a key={l} href="#" style={{ padding:"6px 12px", fontSize:13, fontWeight: i===0 ? 700 : 500, color: i===0 ? G : TEXT, borderRadius:8, background: i===0 ? G_LIGHT : "transparent" }}>
                {l}
              </a>
            ))}
          </nav>

          {/* Search bar */}
          <div style={{ flex:1, display:"flex", alignItems:"center", background:"#F1F5F9", border:`1.5px solid ${BORDER}`, borderRadius:12, overflow:"hidden" }}>
            <button style={{ background:G, border:"none", color:"#fff", padding:"9px 16px", cursor:"pointer", fontSize:16, fontWeight:700, flexShrink:0 }}>🔍</button>
            <input placeholder="ابحث عن أي شيء..." style={{ flex:1, border:"none", background:"transparent", padding:"9px 14px", fontSize:13, outline:"none", color:TEXT }} />
            <select style={{ border:"none", background:"transparent", padding:"9px 12px", fontSize:12, color:TEXT_2, outline:"none", cursor:"pointer", borderRight:`1px solid ${BORDER}` }}>
              <option>كل الأقسام</option>
              <option>إلكترونيات</option>
              <option>أزياء</option>
            </select>
          </div>

          {/* Right icons */}
          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
            <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:TEXT_2, padding:"6px 10px", borderRadius:8 }}>🌐 AR</button>
            <button style={{ position:"relative", background:"none", border:"none", cursor:"pointer", fontSize:20, padding:"6px 10px" }}>
              🛒
              <span style={{ position:"absolute", top:2, right:2, background:RED, color:"#fff", width:15, height:15, borderRadius:8, fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>3</span>
            </button>
            <button style={{ background:"none", border:`1.5px solid ${BORDER}`, color:TEXT, padding:"7px 14px", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600 }}>تسجيل الدخول</button>
            <button style={{ background:G, border:"none", color:"#fff", padding:"8px 16px", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:700 }}>إنشاء حساب</button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          2. HERO + PRODUCT MOSAIC
      ══════════════════════════════════════════ */}
      <section style={{ background:`linear-gradient(135deg,${G_LIGHT} 0%,#EFF6FF 100%)`, borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"32px 20px", display:"grid", gridTemplateColumns:"1fr 480px", gap:32, alignItems:"center" }}>

          {/* RIGHT in RTL = rendered LEFT side */}
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Tag */}
            <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${G}18`, border:`1px solid ${G}30`, color:G, fontSize:12, fontWeight:700, padding:"5px 14px", borderRadius:20, maxWidth:"fit-content" }}>
              ✦ السوق الإلكتروني الأول في سوريا
            </span>

            {/* Headline */}
            <div>
              <h1 style={{ fontSize:44, fontWeight:900, color:TEXT, lineHeight:1.15, margin:0 }}>
                سوق سوريا
              </h1>
              <h1 style={{ fontSize:36, fontWeight:800, color:G, lineHeight:1.2, margin:"4px 0 0" }}>
                كل ما تحتاجه في مكان واحد
              </h1>
            </div>

            <p style={{ color:TEXT_2, fontSize:15, lineHeight:1.7, margin:0 }}>
              منتجات عالية الجودة من متاجر موثوقة<br />
              شحن سريع · حماية للمشتري · الدفع عند الاستلام
            </p>

            {/* Hero search bar */}
            <div style={{ display:"flex", alignItems:"center", background:WHITE, border:`2px solid ${G}`, borderRadius:14, overflow:"hidden", boxShadow:"0 4px 20px rgba(5,150,105,0.15)" }}>
              <button style={{ background:G, border:"none", color:"#fff", padding:"13px 20px", cursor:"pointer", fontSize:18, fontWeight:700, flexShrink:0 }}>🔍</button>
              <input placeholder="ابحث عن أي منتج..." style={{ flex:1, border:"none", background:"transparent", padding:"13px 16px", fontSize:15, outline:"none", color:TEXT, fontFamily:"inherit" }} />
            </div>

            {/* CTAs */}
            <div style={{ display:"flex", gap:12 }}>
              <button style={{ background:G, border:"none", color:"#fff", padding:"13px 28px", borderRadius:12, cursor:"pointer", fontSize:15, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
                تسوق الآن ←
              </button>
              <button style={{ background:WHITE, border:`2px solid ${G}`, color:G, padding:"13px 28px", borderRadius:12, cursor:"pointer", fontSize:15, fontWeight:700 }}>
                استعرض الفئات
              </button>
            </div>

            {/* Trust badges */}
            <div style={{ display:"flex", gap:20, flexWrap:"wrap", paddingTop:4 }}>
              {[
                { icon:"✅", label:"بائعون موثوقون" },
                { icon:"🚚", label:"شحن سريع" },
                { icon:"🛡️", label:"حماية المشتري" },
                { icon:"🔒", label:"دفع آمن" },
              ].map(t => (
                <div key={t.label} style={{ display:"flex", alignItems:"center", gap:6, color:TEXT_2, fontSize:13, fontWeight:600 }}>
                  <span>{t.icon}</span> {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* LEFT in RTL = rendered RIGHT = Product Mosaic */}
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:TEXT_2, marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>عرض الكل</span>
              <span style={{ color:G, cursor:"pointer" }}>عروض مميزة</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {MOSAIC.map((p,i) => (
                <div key={i} style={{ background:p.bg, borderRadius:16, padding:16, cursor:"pointer", position:"relative", overflow:"hidden", minHeight:155, display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:6 }}>
                  {/* Discount */}
                  <span style={{ position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.45)", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>
                    -{p.disc}%
                  </span>
                  {/* Icon */}
                  <span style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-65%)", fontSize:46 }}>{p.icon}</span>
                  {/* Info */}
                  <div style={{ color:"rgba(255,255,255,0.95)", fontSize:12, fontWeight:700, lineHeight:1.3 }}>{p.name}</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                    <span style={{ color:"#fff", fontWeight:800, fontSize:14 }}>{p.price}</span>
                    <span style={{ color:"rgba(255,255,255,0.6)", fontSize:11, textDecoration:"line-through" }}>{p.old}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. POPULAR CATEGORIES
      ══════════════════════════════════════════ */}
      <section style={{ background:WHITE, borderBottom:`1px solid ${BORDER}`, padding:"28px 0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:TEXT }}>الفئات الأكثر شيوعاً</h2>
            <a href="#" style={{ color:G, fontSize:13, fontWeight:600 }}>عرض الكل ←</a>
          </div>
          <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:4 }}>
            {CATS.map(c => (
              <div key={c.id} style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:10,
                background:BG, border:`1.5px solid ${BORDER}`, borderRadius:16,
                padding:"18px 24px", cursor:"pointer", flexShrink:0, minWidth:110,
                transition:"all 0.18s ease",
              }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=G;(e.currentTarget as HTMLElement).style.background=G_LIGHT;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=BORDER;(e.currentTarget as HTMLElement).style.background=BG;}}
              >
                <span style={{ fontSize:32 }}>{c.icon}</span>
                <div style={{ fontSize:13, fontWeight:700, color:TEXT, textAlign:"center", whiteSpace:"nowrap" }}>{c.name}</div>
                <div style={{ fontSize:11, color:TEXT_2 }}>{c.count.toLocaleString()} منتج</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. TODAY'S DEALS
      ══════════════════════════════════════════ */}
      <section style={{ background:WHITE, padding:"36px 0 32px", borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <h2 style={{ fontSize:20, fontWeight:800, color:TEXT }}>🔥 عروض اليوم</h2>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:HERO_BG, borderRadius:10, padding:"7px 14px" }}>
                <span style={{ color:"#94A3B8", fontSize:11, fontWeight:600 }}>تنتهي خلال</span>
                <Countdown />
              </div>
            </div>
            <a href="#" style={{ color:G, fontSize:13, fontWeight:600 }}>عرض الكل ←</a>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:14 }}>
            {DEALS.map(p => <ProductCard key={p.id} p={p} showDisc />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. BEST SELLERS
      ══════════════════════════════════════════ */}
      <section style={{ background:BG, padding:"36px 0 32px", borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:TEXT }}>🏆 الأكثر مبيعاً</h2>
            <a href="#" style={{ color:G, fontSize:13, fontWeight:600 }}>عرض الكل ←</a>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:14 }}>
            {BEST_SELLERS.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. VERIFIED STORES + SELLER CTA (side-by-side)
      ══════════════════════════════════════════ */}
      <section style={{ background:WHITE, padding:"36px 0 32px", borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px", display:"grid", gridTemplateColumns:"1fr 320px", gap:24 }}>

          {/* Verified stores */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <h2 style={{ fontSize:20, fontWeight:800, color:TEXT }}>✅ متاجر موثوقة</h2>
              <a href="#" style={{ color:G, fontSize:13, fontWeight:600 }}>عرض الكل ←</a>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {STORES.map(s => (
                <div key={s.id} style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:`linear-gradient(135deg,${s.color},${s.color}cc)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:20, flexShrink:0 }}>{s.avatar}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:15, color:TEXT }}>{s.name}</span>
                      <TierBadge tier={s.tier} />
                    </div>
                    <div style={{ fontSize:12, color:TEXT_2 }}>{s.cat} · {s.products} منتج</div>
                  </div>
                  <div style={{ textAlign:"left", flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <Stars r={s.rating} />
                      <span style={{ fontSize:12, fontWeight:700, color:TEXT }}>{s.rating}</span>
                    </div>
                    <div style={{ fontSize:11, color:TEXT_2 }}>({s.reviews} تقييم)</div>
                  </div>
                  <button style={{ background:G_LIGHT, border:`1px solid ${G}30`, color:G, padding:"7px 16px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:700, flexShrink:0 }}>
                    تابع
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Side CTA cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* Sell CTA */}
            <div style={{ background:`linear-gradient(135deg,${G},${G_DARK})`, borderRadius:18, padding:"24px 22px", display:"flex", flexDirection:"column", gap:14 }}>
              <span style={{ fontSize:36 }}>🏪</span>
              <h3 style={{ color:"#fff", fontSize:18, fontWeight:800, lineHeight:1.3, margin:0 }}>هل تريد بيع منتجاتك؟</h3>
              <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, lineHeight:1.6, margin:0 }}>
                انضم لأكثر من 1,200 بائع على سيانو وابدأ في الربح اليوم.
              </p>
              <button style={{ background:WHITE, border:"none", color:G, padding:"11px 20px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:800, maxWidth:"fit-content" }}>
                افتح متجرك الآن ←
              </button>
            </div>

            {/* Courier CTA */}
            <div style={{ background:`linear-gradient(135deg,#1e3a8a,#1e40af)`, borderRadius:18, padding:"24px 22px", display:"flex", flexDirection:"column", gap:14 }}>
              <span style={{ fontSize:36 }}>🚴</span>
              <h3 style={{ color:"#fff", fontSize:18, fontWeight:800, lineHeight:1.3, margin:0 }}>هل تريد العمل كمندوب؟</h3>
              <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, lineHeight:1.6, margin:0 }}>
                اعمل بمواعيدك، اكسب أسبوعياً، وكن جزءاً من فريق توصيل سيانو.
              </p>
              <button style={{ background:WHITE, border:"none", color:"#1e40af", padding:"11px 20px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:800, maxWidth:"fit-content" }}>
                سجّل الآن ←
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          7. NEW ARRIVALS
      ══════════════════════════════════════════ */}
      <section style={{ background:BG, padding:"36px 0 32px", borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:TEXT }}>✨ وصل جديداً</h2>
            <a href="#" style={{ color:G, fontSize:13, fontWeight:600 }}>عرض الكل ←</a>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:14 }}>
            {NEW_ARRIVALS.map(p => (
              <ProductCard key={p.id} p={{ ...p, seller:"جديد هذا الأسبوع", isNew:true }} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          8. EXPLORE CATEGORIES (Grid)
      ══════════════════════════════════════════ */}
      <section style={{ background:WHITE, padding:"36px 0 32px", borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:TEXT }}>تسوق حسب الفئة</h2>
            <a href="#" style={{ color:G, fontSize:13, fontWeight:600 }}>كل الفئات ←</a>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:12 }}>
            {[
              { icon:"💻", name:"إلكترونيات", bg:"linear-gradient(135deg,#1e3a8a,#3b82f6)" },
              { icon:"👗", name:"أزياء",       bg:"linear-gradient(135deg,#831843,#ec4899)" },
              { icon:"🏠", name:"المنزل",      bg:"linear-gradient(135deg,#78350f,#f59e0b)" },
              { icon:"💄", name:"الجمال",      bg:"linear-gradient(135deg,#4c1d95,#8b5cf6)" },
              { icon:"⚽", name:"الرياضة",     bg:"linear-gradient(135deg,#064e3b,#059669)" },
              { icon:"🚗", name:"السيارات",    bg:"linear-gradient(135deg,#1f2937,#6b7280)" },
              { icon:"🎮", name:"الألعاب",     bg:"linear-gradient(135deg,#3b0764,#7c3aed)" },
              { icon:"🛒", name:"البقالة",     bg:"linear-gradient(135deg,#9a3412,#f97316)" },
              { icon:"📚", name:"الكتب",       bg:"linear-gradient(135deg,#1e3a5f,#60a5fa)" },
              { icon:"🧸", name:"الأطفال",     bg:"linear-gradient(135deg,#7c2d12,#fb923c)" },
              { icon:"💊", name:"الصحة",       bg:"linear-gradient(135deg,#022c22,#34d399)" },
              { icon:"🪑", name:"الأثاث",      bg:"linear-gradient(135deg,#292524,#78716c)" },
              { icon:"📷", name:"التصوير",     bg:"linear-gradient(135deg,#0c4a6e,#0ea5e9)" },
              { icon:"🎵", name:"الموسيقى",    bg:"linear-gradient(135deg,#4a044e,#a21caf)" },
              { icon:"🐾", name:"الحيوانات",   bg:"linear-gradient(135deg,#365314,#84cc16)" },
              { icon:"🎁", name:"الهدايا",     bg:"linear-gradient(135deg,#881337,#f43f5e)" },
            ].map((c,i) => (
              <div key={i} style={{
                background:c.bg, borderRadius:14, height:110,
                display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:8, cursor:"pointer",
                transition:"transform 0.2s ease",
                boxShadow:"0 2px 8px rgba(0,0,0,0.12)",
              }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="scale(1.04)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="scale(1)";}}
              >
                <span style={{ fontSize:30 }}>{c.icon}</span>
                <span style={{ color:"#fff", fontWeight:700, fontSize:12, textAlign:"center", padding:"0 6px" }}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          9. APP DOWNLOAD STRIP
      ══════════════════════════════════════════ */}
      <section style={{ background:`linear-gradient(135deg,${HERO_BG},#1e3a5f)`, padding:"36px 0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24 }}>
          <div>
            <h3 style={{ color:"#fff", fontSize:22, fontWeight:800, margin:"0 0 8px" }}>تسوق في أي وقت ومن أي مكان</h3>
            <p style={{ color:"#94A3B8", fontSize:14, margin:0 }}>حمّل تطبيق سيانو الآن واستمتع بتجربة تسوق فريدة</p>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            {[{ label:"Google Play", icon:"▶" }, { label:"App Store", icon:"🍎" }].map(app => (
              <button key={app.label} style={{
                background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)",
                color:"#fff", borderRadius:12, padding:"12px 24px",
                cursor:"pointer", display:"flex", alignItems:"center", gap:10,
              }}>
                <span style={{ fontSize:22 }}>{app.icon}</span>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>حمّل على</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{app.label}</div>
                </div>
              </button>
            ))}
          </div>
          {/* Trust mini-stats */}
          <div style={{ display:"flex", gap:28 }}>
            {[
              { icon:"🏪", val:"1,200+", lab:"متجر موثوق" },
              { icon:"🚚", val:"24h",    lab:"توصيل سريع" },
              { icon:"🛡️", val:"100%",  lab:"دفع آمن" },
            ].map(s => (
              <div key={s.lab} style={{ textAlign:"center" }}>
                <div style={{ fontSize:20 }}>{s.icon}</div>
                <div style={{ color:"#fff", fontWeight:800, fontSize:18 }}>{s.val}</div>
                <div style={{ color:"#94A3B8", fontSize:11 }}>{s.lab}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          10. FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ background:HERO_BG, color:"#94A3B8", padding:"40px 0 0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px", display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:36 }}>
          {/* Brand */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,${G},${G_DARK})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:20 }}>S</div>
              <div>
                <div style={{ color:"#fff", fontWeight:900, fontSize:16 }}>SYANO</div>
                <div style={{ fontSize:11, color:"#64748B" }}>سوق سوريا</div>
              </div>
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, maxWidth:240 }}>
              السوق الإلكتروني الأول في سوريا — تسوق من آلاف المنتجات من متاجر موثوقة في حلب وكل سوريا.
            </p>
            <div style={{ display:"flex", gap:8 }}>
              {["📘","📸","🐦"].map((ic,i) => (
                <div key={i} style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:15 }}>{ic}</div>
              ))}
            </div>
          </div>

          {[
            { title:"للبائعين",      links:["ابدأ البيع","لوحة التحكم","العمولات","الأسئلة الشائعة","شروط البائع"] },
            { title:"تعرّف علينا",  links:["عن سيانو","فريق العمل","المدونة","اتصل بنا","الشراكات"] },
            { title:"المساعدة",     links:["مركز المساعدة","حماية المشتري","سياسة الإرجاع","تتبع الطلب","الخصوصية"] },
          ].map(col => (
            <div key={col.title} style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ color:"#fff", fontWeight:700, fontSize:15, marginBottom:4 }}>{col.title}</div>
              {col.links.map(l => (
                <a key={l} href="#" style={{ color:"#64748B", fontSize:13, cursor:"pointer" }}
                  onMouseEnter={e=>(e.currentTarget.style.color=G)}
                  onMouseLeave={e=>(e.currentTarget.style.color="#64748B")}
                >{l}</a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:36, padding:"18px 20px" }}>
          <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <div style={{ fontSize:12 }}>© 2026 SYANO سوق سوريا. جميع الحقوق محفوظة. صُنع بـ ♥ في حلب، سوريا.</div>
            <div style={{ display:"flex", gap:16, fontSize:12 }}>
              {["الخصوصية","الشروط","ملفات تعريف الارتباط"].map(l => (
                <a key={l} href="#" style={{ color:"#64748B" }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
