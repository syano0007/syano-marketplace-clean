import { useState, useEffect } from "react";

/* ── DATA ────────────────────────────────────────────── */
const CATEGORIES = [
  { name: "إلكترونيات",      count: "12,450", img: "https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "موضة وملابس",     count: "8,320",  img: "https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "عطور وجمال",      count: "3,650",  img: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "منزل وديكور",     count: "6,780",  img: "https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "رياضة وأحذية",    count: "5,230",  img: "https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "ساعات فاخرة",     count: "2,890",  img: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "هواتف ذكية",      count: "4,120",  img: "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "حواسيب ولابتوب",  count: "3,470",  img: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=500" },
];

const DEALS = [
  { name: "عطر أوبسيديان إلكسير",  cat: "عطور وجمال",    price: "96,000",  orig: "148,000", disc: 35, badge: "حصري",          rating: 4.6, rev: 89,  img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { name: "مجموعة تقنية متكاملة",  cat: "إلكترونيات",    price: "385,000", orig: "550,000", disc: 30, badge: "جديد",           rating: 4.8, rev: 196, img: "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { name: "حذاء نايكي رياضي",      cat: "رياضة وأحذية",  price: "58,000",  orig: "82,000",  disc: 29, badge: "عرض محدود",      rating: 4.7, rev: 512, img: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { name: "ساعة كلاسيكية ذهبية",   cat: "ساعات فاخرة",   price: "142,500", orig: "237,000", disc: 40, badge: "الأكثر مبيعاً",  rating: 4.9, rev: 284, img: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400" },
];

const STORES = [
  { name: "تك ستور سوريا", desc: "أحدث الإلكترونيات والأجهزة الذكية",   cat: "إلكترونيات",  cnt: "3,240", letter: "ت", bg: "#0f172a", rating: 4.9, rev: 1840, img: "https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "دار الأناقة",   desc: "أزياء فاخرة وموضة معاصرة للجميع",     cat: "موضة وملابس", cnt: "1,890", letter: "د", bg: "#4c1d95", rating: 4.8, rev: 2210, img: "https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "بيت الديكور",   desc: "أثاث عصري وإكسسوارات منزلية راقية",   cat: "منزل وديكور", cnt: "2,140", letter: "ب", bg: "#6d28d9", rating: 4.7, rev: 956,  img: "https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=600" },
];

const TRENDING = [
  { name: "لاب توب بلاك إيشن",     cat: "حواسيب",      seller: "تك ستور سوريا", rating: 4.7, rev: 213, price: "720,000", img: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=500",      hot: false },
  { name: "هاتف بريميوم Pro Max",   cat: "هواتف ذكية",  seller: "تك ستور سوريا", rating: 4.8, rev: 892, price: "850,000", img: "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=500", hot: true  },
  { name: "ساعة كرونوغراف سيلفر",  cat: "ساعات فاخرة", seller: "دار الأناقة",    rating: 4.9, rev: 341, price: "198,000", img: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500", hot: true  },
];

const SMALL_ARRIVALS = [
  { name: "عطر الأوبسيديان الليلي", cat: "عطور",        price: "89,500", days: "1 يوم",  img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { name: "ديكور منزلي مودرن",      cat: "منزل وديكور", price: "56,000", days: "3 أيام", img: "https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=200" },
];

/* ── HELPERS ─────────────────────────────────────────── */
function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-px">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= n ? "text-emerald-400" : "text-gray-700"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function Timer() {
  const [t, setT] = useState({ h: 18, m: 24, s: 8 });
  useEffect(() => {
    const iv = setInterval(() => setT(p => {
      let { h, m, s } = p; s--;
      if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) h = 0;
      return { h, m, s };
    }), 1000);
    return () => clearInterval(iv);
  }, []);
  const z = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-400">
      <span>تنتهي خلال</span>
      <span className="flex items-center gap-1">
        {[z(t.h), z(t.m), z(t.s)].map((v, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="bg-[#1a1a1a] border border-white/10 text-white font-mono font-bold text-sm px-2 py-0.5 rounded-md">{v}</span>
            {i < 2 && <span className="text-emerald-400 font-bold text-base">:</span>}
          </span>
        ))}
      </span>
    </div>
  );
}

/* ── COMPONENT ───────────────────────────────────────── */
export function HomepageRedesign() {
  return (
    <div dir="rtl" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#080808", color: "#fff", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ━━━ NAVBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav style={{ background: "rgba(8,8,8,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 20 }}>
          {/* Logo — RTL: rightmost */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#fff" }}>S</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.5px", lineHeight: 1 }}>SYANO</div>
              <div style={{ fontSize: 9, color: "#6b7280", lineHeight: 1 }}>سوق سوريا</div>
            </div>
          </div>
          {/* Nav links */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {["الرئيسية", "الفئات ▾", "المتاجر", "العروض"].map((l, i) => (
              <button key={l} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: i === 0 ? "rgba(255,255,255,0.08)" : "transparent", color: i === 0 ? "#fff" : "#9ca3af", border: "none", cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          {/* Search */}
          <div style={{ flex: 1, maxWidth: 520, margin: "0 auto", position: "relative" }}>
            <input placeholder="ابحث عن منتجات، متاجر، أو فئات..."
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "9px 16px 9px 40px", fontSize: 13, color: "#d1d5db", outline: "none", boxSizing: "border-box" }} />
            <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#6b7280" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          {/* Auth — RTL: leftmost */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginRight: "auto", flexShrink: 0 }}>
            <button style={{ fontSize: 13, color: "#d1d5db", background: "none", border: "none", cursor: "pointer", padding: "6px 12px" }}>تسجيل الدخول</button>
            <button style={{ fontSize: 13, fontWeight: 700, background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", cursor: "pointer" }}>إنشاء حساب</button>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* RTL: text on RIGHT (first in DOM), image on LEFT (second in DOM) */}
      <section style={{ background: "#080808", minHeight: 600, position: "relative", overflow: "hidden" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", top: 0, right: "30%", width: 500, height: 400, borderRadius: "50%", background: "#10b981", opacity: 0.04, filter: "blur(100px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: "10%", width: 350, height: 350, borderRadius: "50%", background: "#f59e0b", opacity: 0.025, filter: "blur(90px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", minHeight: 600 }}>
          {/* ── TEXT COLUMN (first = RIGHT in RTL) ── */}
          <div style={{ width: "42%", flexShrink: 0, display: "flex", flexDirection: "column", gap: 22, paddingTop: 40, paddingBottom: 40, textAlign: "right" }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignSelf: "flex-start" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(16,185,129,0.35)", color: "#10b981", fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: "#10b981" }}>✦</span> سوق سوريا الرقمي
              </span>
            </div>
            {/* Headline */}
            <h1 style={{ margin: 0, fontSize: 64, fontWeight: 900, lineHeight: 1.1, color: "#fff" }}>
              اكتشف آلاف<br />
              المنتجات من<br />
              <span style={{ color: "#10b981" }}>المتاجر السورية</span>
            </h1>
            {/* Subtitle */}
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 15, lineHeight: 1.7, maxWidth: 380 }}>
              منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة تجمع أفضل المتاجر السورية في مكان واحد.
            </p>
            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button style={{ padding: "14px 28px", borderRadius: 12, background: "#10b981", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>تسوق الآن ←</button>
              <button style={{ padding: "14px 28px", borderRadius: 12, background: "transparent", color: "#d1d5db", fontSize: 14, fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>استكشف المتاجر</button>
            </div>
            {/* Stats */}
            <div style={{ display: "flex", gap: 0, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 4 }}>
              {[
                { n: "12,000+", l: "عميل راضٍ" },
                { n: "25,000+", l: "منتج فاعل" },
                { n: "500+",    l: "متاجر نشط" },
              ].map((s, i) => (
                <div key={s.l} style={{ paddingLeft: i < 2 ? 32 : 0, paddingRight: i > 0 ? 32 : 0, borderRight: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── IMAGE COLUMN (second = LEFT in RTL) ── */}
          <div style={{ flex: 1, position: "relative", height: 520, marginRight: 32 }}>
            {/* Main image */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 20, overflow: "hidden" }}>
              <img src="https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=900" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }} />
              {/* Gradient overlay: fade towards right (where text is, RTL = text is on right) */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 30%, #080808 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,0.5) 0%, transparent 50%)" }} />
            </div>

            {/* Floating card — top */}
            <div style={{ position: "absolute", top: 28, left: 24, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center", width: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <img src="https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              <div style={{ textAlign: "right", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>عطار ديور سوهاج</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>75,000 <span style={{ color: "#10b981", fontSize: 11, fontWeight: 400 }}>ل.س</span></div>
                <Stars n={4} />
              </div>
            </div>

            {/* Floating card — middle */}
            <div style={{ position: "absolute", bottom: 120, left: 16, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center", width: 185, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <img src="https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              <div style={{ textAlign: "right", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>مومية رالية</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>38,500 <span style={{ color: "#10b981", fontSize: 11, fontWeight: 400 }}>ل.س</span></div>
              </div>
            </div>

            {/* Floating card — bottom */}
            <div style={{ position: "absolute", bottom: 36, left: 60, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center", width: 210, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <img src="https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              <div style={{ textAlign: "right", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>ساعة خضرية فاخرة</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>142,000 <span style={{ color: "#10b981", fontSize: 11, fontWeight: 400 }}>ل.س</span></div>
                <div style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}>● متوفر الآن</div>
              </div>
            </div>

            {/* Discount badge */}
            <div style={{ position: "absolute", top: 110, right: 32, background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 100 }}>خصم %٨٠</div>
          </div>
        </div>
      </section>

      {/* ━━━ CATEGORIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <button style={{ color: "#6b7280", fontSize: 13, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>← عرض الكل</button>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#10b981", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>تصفح حسب الفئة</div>
            <h2 style={{ margin: 0, fontSize: 40, fontWeight: 900, color: "#fff" }}>الفئات الأكثر شيوعاً</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {CATEGORIES.map(c => (
            <div key={c.name} style={{ position: "relative", height: 210, borderRadius: 16, overflow: "hidden", cursor: "pointer" }}>
              <img src={c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)" }} />
              <div style={{ position: "absolute", bottom: 0, right: 0, padding: "0 16px 16px", textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#d1d5db", marginTop: 2 }}>{c.count} منتج</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ FEATURED DEALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "8px 24px 56px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
            <button style={{ color: "#6b7280", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>← كل العروض</button>
            <Timer />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#10b981", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>عروض حصرية</div>
            <h2 style={{ margin: 0, fontSize: 40, fontWeight: 900, color: "#fff" }}>عروض مميزة</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {DEALS.map(d => (
            <div key={d.name} style={{ background: "#111", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ position: "relative", height: 220 }}>
                <img src={d.img} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <span style={{ position: "absolute", top: 12, right: 12, background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>-{d.disc}%</span>
                <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)" }}>{d.badge}</span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{d.cat}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>{d.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Stars n={Math.floor(d.rating)} />
                  <span style={{ fontSize: 11, color: "#6b7280" }}>({d.rev}) {d.rating}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#6b7280", textDecoration: "line-through" }}>{d.orig} ل.س</div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: "#10b981" }}>{d.price} <span style={{ fontSize: 11, fontWeight: 400, color: "#10b981" }}>ل.س</span></div>
                  </div>
                  <button style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "#d1d5db", fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 10, cursor: "pointer" }}>أضف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ TRUSTED STORES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "8px 24px 56px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <button style={{ color: "#6b7280", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>← جميع المتاجر</button>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#10b981", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>شركاؤنا التجاريون</div>
            <h2 style={{ margin: 0, fontSize: 40, fontWeight: 900, color: "#fff" }}>متاجر موثوقة</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {STORES.map(s => (
            <div key={s.name} style={{ background: "#111", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Banner */}
              <div style={{ position: "relative", height: 148 }}>
                <img src={s.img} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5)", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #111 0%, transparent 60%)" }} />
                {/* Verified badge */}
                <span style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 4, background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100 }}>✓ موثوق</span>
                {/* Avatar */}
                <div style={{ position: "absolute", bottom: -20, right: 20, width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", border: "2px solid #111", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>{s.letter}</div>
              </div>
              {/* Body */}
              <div style={{ padding: "28px 16px 16px", textAlign: "right" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Stars n={Math.floor(s.rating)} />
                    <span style={{ fontSize: 11, color: "#6b7280" }}>({s.rev})</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{s.name}</div>
                </div>
                <p style={{ margin: "6px 0 10px", fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>{s.desc}</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
                  <span>📦 {s.cnt} منتج</span>
                  <span style={{ background: "rgba(255,255,255,0.06)", padding: "2px 10px", borderRadius: 100 }}>{s.cat}</span>
                </div>
                <button style={{ width: "100%", padding: "10px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, background: "none", color: "#d1d5db", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>↗ زيارة المتجر</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ TRENDING PRODUCTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "8px 24px 56px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <button style={{ color: "#6b7280", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>← عرض الكل</button>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#10b981", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>الأعلى تقييماً هذا الأسبوع</div>
            <h2 style={{ margin: 0, fontSize: 40, fontWeight: 900, color: "#fff" }}>المنتجات الرائجة</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {TRENDING.map(p => (
            <div key={p.name} style={{ background: "#111", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ position: "relative", height: 300 }}>
                <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                {p.hot && (
                  <span style={{ position: "absolute", top: 12, right: 12, background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, display: "flex", alignItems: "center", gap: 4 }}>↑ رائج</span>
                )}
                <button style={{ position: "absolute", top: 12, left: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "none", color: "#d1d5db", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>♡</button>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2, textAlign: "right" }}>{p.seller} · {p.cat}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8, textAlign: "right" }}>{p.name}</div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>({p.rev})</span>
                  <Stars n={Math.floor(p.rating)} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>أضف للسلة</button>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", textAlign: "right" }}>{p.price} <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>ل.س</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ NEW ARRIVALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* RTL: large card first (RIGHT), small cards second (LEFT) */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "8px 24px 56px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <button style={{ color: "#6b7280", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>← الجديد كل يوم</button>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#10b981", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>أضيف لنا</div>
            <h2 style={{ margin: 0, fontSize: 40, fontWeight: 900, color: "#fff" }}>وصل حديثاً</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          {/* Large card — first in DOM = RIGHT in RTL */}
          <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", height: 320 }}>
            <img src="https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=800" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5)", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 50%)" }} />
            <div style={{ position: "absolute", top: 16, right: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", padding: "4px 10px", borderRadius: 100 }}>↑ جديد منذ 2 أيام</span>
            </div>
            <div style={{ position: "absolute", bottom: 0, right: 0, padding: "0 24px 24px", textAlign: "right", width: "100%", boxSizing: "border-box" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>إلكترونيات</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8 }}>مجموعة تقنية بريميوم 2025</div>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>(12 تقييم)</span>
                <Stars n={5} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>4.8</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981" }}>435,000 <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af" }}>ل.س</span></div>
            </div>
          </div>

          {/* Small cards — second = LEFT in RTL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SMALL_ARRIVALS.map(a => (
              <div key={a.name} style={{ background: "#111", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", display: "flex", height: 148 }}>
                {/* Text on right (RTL first), image on left (RTL second) */}
                <div style={{ flex: 1, padding: "16px", textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: 10, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 100, display: "inline-block", marginBottom: 4 }}>● منذ {a.days}</span>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{a.cat}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 4, lineHeight: 1.3 }}>{a.name}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#10b981" }}>{a.price} <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af" }}>ل.س</span></div>
                </div>
                <div style={{ width: 130, flexShrink: 0 }}>
                  <img src={a.img} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ JOIN CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "8px 24px 56px" }}>
        <div style={{ background: "#0e0e0e", borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)", padding: "64px 48px", textAlign: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 100, border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 12, fontWeight: 600, marginBottom: 20 }}>انضم إلى سيانو</span>
          <h2 style={{ margin: "0 0 12px", fontSize: 44, fontWeight: 900, color: "#fff" }}>كن جزءاً من السوق السوري</h2>
          <p style={{ margin: "0 0 40px", color: "#9ca3af", fontSize: 15 }}>سواء كنت بائعاً أو مندوب توصيل، هناك مكان لك في سيانو.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 720, margin: "0 auto" }}>
            {[
              { icon: "🏪", title: "ابدأ البيع على سيانو", desc: "افتح متجرك الإلكتروني وتواصل مع آلاف المشترين في جميع أنحاء سوريا", link: "إنشاء متجري" },
              { icon: "🛵", title: "انضم كمندوب توصيل", desc: "حقق دخلاً إضافياً من خلال توصيل الطلبات في مدينتك بمرونة كاملة في عملك", link: "التسجيل كمندوب" },
            ].map(c => (
              <div key={c.title} style={{ background: "#161616", borderRadius: 18, padding: "36px 28px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{c.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 12 }}>{c.title}</div>
                <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7, marginBottom: 20 }}>{c.desc}</p>
                <button style={{ background: "none", border: "none", color: "#10b981", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, margin: "0 auto" }}>{c.link} ←</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#060606" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "56px 24px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32 }}>
            {/* Brand */}
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", marginBottom: 12 }}>
                <span style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>SYANO</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#fff" }}>S</div>
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7, marginBottom: 16 }}>منصة التجارة الإلكترونية السورية الأولى التي تجمع أفضل المتاجر والمنتجات في مكان واحد</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 28 }}>
                {["▶", "f", "𝕏", "📷"].map(ic => (
                  <button key={ic} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 12, cursor: "pointer" }}>{ic}</button>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>اشترك في النشرة البريدية</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>أحدث العروض والمنتجات مباشرة إلى بريدك</div>
                <input placeholder="بريدك الإلكتروني..." style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 12px", fontSize: 12, color: "#d1d5db", outline: "none", marginBottom: 8, textAlign: "right" }} />
                <button style={{ width: "100%", background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← اشترك</button>
              </div>
            </div>
            {/* Link columns */}
            {[
              { title: "السوق",     links: ["جميع المنتجات","العروض والتخفيضات","المتاجر الموثوقة","المنتجات الجديدة","الأكثر مبيعاً"] },
              { title: "للبائعين", links: ["افتح متجرك","لوحة التاجر","خطط العمولة","سياسة المراجعات","مركز المساعدة"] },
              { title: "الشركة",   links: ["من نحن","التوصيل والشحن","سياسة الخصوصية","الشروط والأحكام","تواصل معنا"] },
            ].map(col => (
              <div key={col.title} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>{col.title}</div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => <li key={l}><a href="#" style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}>{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["SyriaTel Cash","PayPal","MasterCard","VISA"].map(p => (
                <span key={p} style={{ fontSize: 10, color: "#4b5563", background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>{p}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              {["الخصوصية","الشروط","الكوكيز"].map(l => (
                <a key={l} href="#" style={{ fontSize: 11, color: "#4b5563", textDecoration: "none" }}>{l}</a>
              ))}
              <span style={{ fontSize: 11, color: "#4b5563" }}>© SYANO 2025 — جميع الحقوق محفوظة</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
