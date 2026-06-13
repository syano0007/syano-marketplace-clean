import { useState, useEffect } from "react";

/* ── DATA ────────────────────────────────────────────── */
const CATEGORIES = [
  { name: "إلكترونيات",      count: "12,450", img: "https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "موضة وملابس",     count: "8,320",  img: "https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "عطور وجمال",      count: "3,650",  img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "منزل وديكور",     count: "6,780",  img: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "رياضة وأحذية",    count: "5,230",  img: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "ساعات فاخرة",     count: "2,890",  img: "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "هواتف ذكية",      count: "4,120",  img: "https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "حواسيب ولابتوب",  count: "3,470",  img: "https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=600" },
];

const DEALS = [
  { name: "عطر أوبسيديان إلكسير",  cat: "عطور وجمال",   price: "96,000",  orig: "148,000", disc: 35, badge: "حصري",         rating: 4.6, rev: 89,  img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { name: "مجموعة تقنية متكاملة",  cat: "إلكترونيات",   price: "385,000", orig: "550,000", disc: 30, badge: "جديد",          rating: 4.8, rev: 196, img: "https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { name: "حذاء نايكي رياضي",      cat: "رياضة وأحذية", price: "58,000",  orig: "82,000",  disc: 29, badge: "عرض محدود",     rating: 4.7, rev: 512, img: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400" },
  { name: "ساعة كلاسيكية ذهبية",  cat: "ساعات فاخرة",  price: "142,500", orig: "237,000", disc: 40, badge: "الأكثر مبيعاً", rating: 4.9, rev: 284, img: "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400" },
];

const STORES = [
  { name: "تك ستور سوريا", desc: "أحدث الإلكترونيات والأجهزة الذكية",  cat: "إلكترونيات",  cnt: "3,240", letter: "ت", bg: "#0f4c81", rating: 4.9, rev: 1840, img: "https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "دار الأناقة",   desc: "أزياء فاخرة وموضة معاصرة للجميع",    cat: "موضة وملابس", cnt: "1,890", letter: "د", bg: "#6d28d9", rating: 4.8, rev: 2210, img: "https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "بيت الديكور",   desc: "أثاث عصري وإكسسوارات منزلية راقية",  cat: "منزل وديكور", cnt: "2,140", letter: "ب", bg: "#7c3aed", rating: 4.7, rev: 956,  img: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600" },
];

const TRENDING = [
  { name: "لاب توب بلاك إيشن",     cat: "حواسيب",      seller: "تك ستور سوريا", rating: 4.7, rev: 213, price: "720,000", img: "https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=600",  hot: false },
  { name: "هاتف بريميوم Pro Max",   cat: "هواتف ذكية",  seller: "تك ستور سوريا", rating: 4.8, rev: 892, price: "850,000", img: "https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&w=600", hot: true  },
  { name: "ساعة كرونوغراف سيلفر",  cat: "ساعات",       seller: "دار الأناقة",    rating: 4.9, rev: 341, price: "198,000", img: "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600",  hot: true  },
];

const SMALL_ARRIVALS = [
  { name: "عطر الأوبسيديان الليلي", cat: "عطور",        price: "89,500", days: "1 يوم",  img: "https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=300" },
  { name: "ديكور منزلي مودرن",      cat: "منزل وديكور", price: "56,000", days: "3 أيام", img: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=300" },
];

/* ── HELPERS ─────────────────────────────────────────── */
function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} style={{ width: size, height: size, color: i <= n ? "#10b981" : "#374151" }} fill="currentColor" viewBox="0 0 20 20">
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9ca3af" }}>
      <svg style={{ width: 14, height: 14, color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span>تنتهي خلال</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {[z(t.h), z(t.m), z(t.s)].map((v, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontFamily: "monospace", fontWeight: 700, fontSize: 14, padding: "3px 8px", borderRadius: 6 }}>{v}</span>
            {i < 2 && <span style={{ color: "#10b981", fontWeight: 900 }}>:</span>}
          </span>
        ))}
      </span>
    </div>
  );
}

/* ── SVG ICONS for CTA ───────────────────────────────── */
function StoreIcon() {
  return (
    <svg style={{ width: 28, height: 28, color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 2L3 7l10 5 10-5-10-5zM3 17l10 5 10-5M3 12l10 5 10-5" />
    </svg>
  );
}
function BikeIcon() {
  return (
    <svg style={{ width: 28, height: 28, color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4c-1.5 0-2.5 1-3 2l-4 8h2l1-2h8l1 2h2l-4-8c-.5-1-1.5-2-3-2zm0 2l2 4h-4l2-4zM6 14a3 3 0 100 6 3 3 0 000-6zm12 0a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
  );
}

/* ━━━ SECTION HEADER component ━━━━━━━━━━━━━━━━━━━━━━━━ */
function SectionHeader({ sup, title, linkText }: { sup: string; title: string; linkText: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
      {/* Title: FIRST in DOM = RIGHT in RTL */}
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#10b981", fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.05em" }}>{sup}</div>
        <h2 style={{ margin: 0, fontSize: 64, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-1px" }}>{title}</h2>
      </div>
      {/* Link: SECOND in DOM = LEFT in RTL */}
      <button style={{ color: "#6b7280", fontSize: 13, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>← {linkText}</button>
    </div>
  );
}

/* ── MAIN COMPONENT ──────────────────────────────────── */
export function HomepageRedesign() {
  const maxW = { maxWidth: 1280, margin: "0 auto", padding: "0 48px" };

  return (
    <div dir="rtl" style={{ fontFamily: "'Segoe UI', Tahoma, system-ui, sans-serif", background: "#080808", color: "#fff", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ━━━ GLOBAL GRID TEXTURE OVERLAY ━━━━━━━━━━━━━━━━━ */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
      }} />

      {/* ━━━ NAVBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav style={{ background: "rgba(8,8,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)" }}>
        <div style={{ ...maxW, height: 64, display: "flex", alignItems: "center", gap: 24 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: "#fff" }}>S</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.5px", lineHeight: 1.1, color: "#fff" }}>SYANO</div>
              <div style={{ fontSize: 9, color: "#6b7280", lineHeight: 1 }}>سوق سوريا</div>
            </div>
          </div>
          {/* Nav */}
          <div style={{ display: "flex", gap: 2 }}>
            {[
              { l: "الرئيسية", active: true },
              { l: "الفئات ▾", active: false },
              { l: "المتاجر", active: false },
              { l: "العروض", active: false },
            ].map(({ l, active }) => (
              <button key={l} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 14, fontWeight: active ? 700 : 400, background: active ? "rgba(255,255,255,0.07)" : "transparent", color: active ? "#fff" : "#9ca3af", border: active ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent", cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          {/* Search */}
          <div style={{ flex: 1, position: "relative" }}>
            <input placeholder="ابحث عن منتجات، متاجر، أو فئات..."
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 44px 10px 16px", fontSize: 13, color: "#9ca3af", outline: "none", boxSizing: "border-box", textAlign: "right" }} />
            <svg style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#6b7280" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          {/* Auth */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginRight: "auto", flexShrink: 0 }}>
            <button style={{ fontSize: 14, color: "#d1d5db", background: "none", border: "none", cursor: "pointer", padding: "8px 14px" }}>تسجيل الدخول</button>
            <button style={{ fontSize: 14, fontWeight: 700, background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "9px 22px", cursor: "pointer" }}>إنشاء حساب</button>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: 620, zIndex: 1 }}>
        {/* Cinematic ambient glows */}
        <div style={{ position: "absolute", top: -100, right: "20%", width: 700, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: "5%", width: 500, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(245,158,11,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "35%", width: 400, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ ...maxW, display: "flex", alignItems: "center", minHeight: 620, gap: 0 }}>

          {/* TEXT column — first in DOM = RIGHT in RTL */}
          <div style={{ width: 500, flexShrink: 0, display: "flex", flexDirection: "column", gap: 24, paddingTop: 40, paddingBottom: 60, textAlign: "right" }}>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", fontSize: 12, fontWeight: 600, background: "rgba(16,185,129,0.06)" }}>
                ✦ سوق سوريا الرقمي
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 72, fontWeight: 900, lineHeight: 1.05, letterSpacing: "-2px", color: "#fff" }}>
              اكتشف آلاف<br />
              المنتجات من<br />
              <span style={{ color: "#10b981" }}>المتاجر السورية</span>
            </h1>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 15, lineHeight: 1.75 }}>
              منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة تجمع أفضل المتاجر السورية في مكان واحد.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button style={{ padding: "13px 30px", borderRadius: 12, background: "#10b981", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>تسوق الآن ←</button>
              <button style={{ padding: "13px 30px", borderRadius: 12, background: "transparent", color: "#d1d5db", fontSize: 14, fontWeight: 500, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>استكشف المتاجر</button>
            </div>
            {/* Stats — use inline-start border for RTL dividers */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 28, display: "flex", alignItems: "flex-start" }}>
              {[
                { n: "+12,000", l: "عميل راضٍ" },
                { n: "+25,000", l: "منتج فاعل" },
                { n: "+500",    l: "متاجر نشط" },
              ].map((s, i) => (
                <div key={s.l} style={{ flex: 1, textAlign: "right", paddingInlineEnd: i < 2 ? 24 : 0, paddingInlineStart: i > 0 ? 24 : 0, borderInlineStart: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                  <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1, whiteSpace: "nowrap" }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* IMAGE column — second in DOM = LEFT in RTL */}
          <div style={{ flex: 1, position: "relative", height: 560, marginRight: 48 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden" }}>
              {/* Dark electronics gadgets flatlay */}
              <img
                src="https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=1000"
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5) contrast(1.15)" }}
              />
              {/* Gradient fade towards text side (right = RTL start) */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 35%, #080808 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,0.6) 0%, transparent 45%)" }} />
            </div>

            {/* Floating card — top left of image */}
            <div style={{ position: "absolute", top: 32, left: 28, zIndex: 2, background: "rgba(12,12,12,0.88)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", width: 218, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>عطار ديور سوهاج</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>75,000 <span style={{ color: "#10b981", fontSize: 11, fontWeight: 400 }}>ل.س</span></div>
                <Stars n={5} size={12} />
              </div>
              <img src="https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            </div>

            {/* Floating card — mid left */}
            <div style={{ position: "absolute", top: "42%", left: 20, transform: "translateY(-50%)", zIndex: 2, background: "rgba(12,12,12,0.88)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", width: 195, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>مومية رالية</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>38,500 <span style={{ color: "#10b981", fontSize: 11, fontWeight: 400 }}>ل.س</span></div>
              </div>
              <img src="https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            </div>

            {/* Floating card — bottom left */}
            <div style={{ position: "absolute", bottom: 44, left: 44, zIndex: 2, background: "rgba(12,12,12,0.88)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", width: 230, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>ساعة خضرية فاخرة</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>142,000 <span style={{ color: "#10b981", fontSize: 11, fontWeight: 400 }}>ل.س</span></div>
                <div style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>● متوفر الآن</div>
              </div>
              <img src="https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            </div>

            {/* Discount badge on image */}
            <div style={{ position: "absolute", top: 120, right: 60, zIndex: 2, background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 800, padding: "6px 14px", borderRadius: 100 }}>خصم ٨٠٪</div>
          </div>
        </div>
      </section>

      {/* ━━━ CATEGORIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 0" }}>
        <div style={maxW}>
          <SectionHeader sup="تصفح حسب الفئة" title="الفئات الأكثر شيوعاً" linkText="عرض الكل" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {CATEGORIES.map(c => (
              <div key={c.name} style={{ position: "relative", height: 260, borderRadius: 18, overflow: "hidden", cursor: "pointer" }}>
                <img src={c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.4) contrast(1.15)", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)" }} />
                <div style={{ position: "absolute", bottom: 0, right: 0, padding: "0 18px 20px", textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>{c.count} منتج</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURED DEALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 80px" }}>
        {/* Ambient glow for deals */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 800, height: 400, background: "radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={maxW}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
            {/* Title: FIRST = RIGHT in RTL */}
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#10b981", fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.05em" }}>عروض حصرية</div>
              <h2 style={{ margin: 0, fontSize: 64, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-1px" }}>عروض مميزة</h2>
            </div>
            {/* Timer + link: SECOND = LEFT in RTL */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
              <button style={{ color: "#6b7280", fontSize: 13, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>← كل العروض</button>
              <Timer />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {DEALS.map(d => (
              <div key={d.name} style={{ background: "#0e0e0e", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ position: "relative", height: 280 }}>
                  <img src={d.img} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.85)" }} />
                  {/* Discount badge: LEFT side of image */}
                  <span style={{ position: "absolute", top: 14, left: 14, background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 800, padding: "4px 12px", borderRadius: 100 }}>-{d.disc}%</span>
                  {/* Secondary label: RIGHT side of image */}
                  <span style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)" }}>{d.badge}</span>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", textAlign: "right", marginBottom: 6 }}>{d.cat}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", textAlign: "right", lineHeight: 1.3, marginBottom: 10 }}>{d.name}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>({d.rev}) {d.rating}</span>
                    <Stars n={Math.floor(d.rating)} size={13} />
                  </div>
                  {/* Bottom: price RIGHT (first in DOM=RIGHT in RTL), button LEFT (second=LEFT) */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#10b981", lineHeight: 1 }}>{d.price} <span style={{ fontSize: 12, fontWeight: 400 }}>ل.س</span></div>
                      <div style={{ fontSize: 11, color: "#6b7280", textDecoration: "line-through", marginTop: 3 }}>{d.orig} ل.س</div>
                    </div>
                    <button style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#d1d5db", fontSize: 13, fontWeight: 700, padding: "9px 20px", borderRadius: 10, cursor: "pointer" }}>أضف</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ TRUSTED STORES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 80px" }}>
        <div style={maxW}>
          <SectionHeader sup="شركاؤنا التجاريون" title="متاجر موثوقة" linkText="جميع المتاجر" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {STORES.map(s => (
              <div key={s.name} style={{ background: "#0e0e0e", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Banner */}
                <div style={{ position: "relative", height: 160 }}>
                  <img src={s.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.35)", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0e0e0e 0%, transparent 60%)" }} />
                  {/* موثوق badge — top RIGHT in RTL */}
                  <span style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 4, background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 800, padding: "5px 12px", borderRadius: 100 }}>● موثوق</span>
                  {/* Avatar — centered at bottom of image */}
                  <div style={{ position: "absolute", bottom: -26, left: "50%", transform: "translateX(-50%)", width: 52, height: 52, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff", border: "2px solid #0e0e0e", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>{s.letter}</div>
                </div>
                {/* Body */}
                <div style={{ padding: "36px 20px 20px", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>({s.rev})</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{s.rating}</span>
                      <Stars n={Math.floor(s.rating)} size={13} />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{s.name}</div>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>{s.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, fontSize: 12, color: "#6b7280" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span>📦</span>
                      <span>{s.cnt} منتج</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span>{s.cat}</span>
                      <span>■</span>
                    </div>
                  </div>
                  <button style={{ width: "100%", padding: "11px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "none", color: "#d1d5db", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>↗ زيارة المتجر</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ TRENDING PRODUCTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 80px" }}>
        <div style={maxW}>
          <SectionHeader sup="الأعلى تقييماً هذا الأسبوع" title="المنتجات الرائجة" linkText="عرض الكل" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {TRENDING.map(p => (
              <div key={p.name} style={{ background: "#0e0e0e", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ position: "relative", height: 360 }}>
                  <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.75)" }} />
                  {p.hot && (
                    <span style={{ position: "absolute", top: 16, right: 16, background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 100, display: "flex", alignItems: "center", gap: 4 }}>↑ رائج</span>
                  )}
                  <button style={{ position: "absolute", top: 16, left: 16, width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>♡</button>
                </div>
                <div style={{ padding: "18px 20px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{p.cat}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{p.seller}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", textAlign: "right", marginBottom: 10 }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginBottom: 18 }}>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>({p.rev})</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{p.rating}</span>
                    <Stars n={Math.floor(p.rating)} size={14} />
                  </div>
                  {/* Row: price RIGHT, button LEFT (RTL) */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>أضف للسلة</button>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{p.price}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>ل.س</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ NEW ARRIVALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* RTL: large card first in DOM (RIGHT), small column second (LEFT) */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 80px" }}>
        <div style={maxW}>
          <SectionHeader sup="أضيف لنا" title="وصل حديثاً" linkText="الجديد كل يوم" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
            {/* Large card — first = RIGHT in RTL */}
            <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", minHeight: 400 }}>
              <img src="https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=900" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.35) contrast(1.1)", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.1) 50%)" }} />
              <div style={{ position: "absolute", top: 20, right: 20 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", padding: "5px 12px", borderRadius: 100, fontWeight: 700 }}>↑ جديد منذ 2 أيام</span>
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, left: 0, padding: "0 28px 28px", textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>إلكترونيات</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12, lineHeight: 1.2 }}>مجموعة تقنية بريميوم 2025</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>(12 تقييم)</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>4.8</span>
                  <Stars n={5} size={14} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#10b981" }}>435,000 <span style={{ fontSize: 14, fontWeight: 400, color: "#9ca3af" }}>ل.س</span></div>
              </div>
            </div>

            {/* Small cards — second = LEFT in RTL */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {SMALL_ARRIVALS.map(a => (
                <div key={a.name} style={{ background: "#0e0e0e", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", display: "flex", height: 192 }}>
                  {/* Text: first in DOM = RIGHT in RTL */}
                  <div style={{ flex: 1, padding: "18px 18px", textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#10b981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: "3px 8px", borderRadius: 100, marginBottom: 8, fontWeight: 700 }}>● منذ {a.days}</span>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{a.cat}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{a.name}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#10b981" }}>{a.price} <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>ل.س</span></div>
                  </div>
                  {/* Image: second = LEFT in RTL */}
                  <div style={{ width: 150, flexShrink: 0 }}>
                    <img src={a.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.7)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ JOIN CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 80px" }}>
        <div style={maxW}>
          <div style={{ background: "#0a0a0a", borderRadius: 28, border: "1px solid rgba(255,255,255,0.07)", padding: "80px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 20px", borderRadius: 100, border: "1px solid rgba(16,185,129,0.35)", color: "#10b981", fontSize: 13, fontWeight: 700, marginBottom: 24, background: "rgba(16,185,129,0.06)" }}>انضم إلى سيانو</span>
            <h2 style={{ margin: "0 0 16px", fontSize: 60, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-1px" }}>كن جزءاً من السوق السوري</h2>
            <p style={{ margin: "0 0 56px", color: "#9ca3af", fontSize: 16 }}>سواء كنت بائعاً أو مندوب توصيل، هناك مكان لك في سيانو.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 760, margin: "0 auto" }}>
              {[
                { Icon: StoreIcon, title: "ابدأ البيع على سيانو", desc: "افتح متجرك الإلكتروني وتواصل مع آلاف المشترين في جميع أنحاء سوريا", link: "إنشاء متجري" },
                { Icon: BikeIcon,  title: "انضم كمندوب توصيل",   desc: "حقق دخلاً إضافياً من خلال توصيل الطلبات في مدينتك بمرونة كاملة في عملك", link: "التسجيل كمندوب" },
              ].map(c => (
                <div key={c.title} style={{ background: "#111", borderRadius: 20, padding: "40px 32px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <c.Icon />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 12 }}>{c.title}</div>
                  <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.7, marginBottom: 24 }}>{c.desc}</p>
                  <button style={{ background: "none", border: "none", color: "#10b981", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, margin: "0 auto" }}>{c.link} ←</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#060606", position: "relative", zIndex: 1 }}>
        <div style={{ ...maxW, padding: "72px 48px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40 }}>
            {/* Brand + Newsletter */}
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", marginBottom: 16 }}>
                <span style={{ fontWeight: 900, fontSize: 20, color: "#fff" }}>SYANO</span>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: "#fff" }}>S</div>
              </div>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.75, marginBottom: 20 }}>منصة التجارة الإلكترونية السورية الأولى التي تجمع أفضل المتاجر والمنتجات في مكان واحد</p>
              {/* Social icons */}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 32 }}>
                {[
                  { i: "▶", label: "YouTube" },
                  { i: "f", label: "Facebook" },
                  { i: "𝕏", label: "Twitter" },
                  { i: "◉", label: "Instagram" },
                ].map(s => (
                  <button key={s.label} title={s.label} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>{s.i}</button>
                ))}
              </div>
              {/* Newsletter */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6, textAlign: "right" }}>اشترك في النشرة البريدية</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14, textAlign: "right" }}>أحدث العروض والمنتجات مباشرة إلى بريدك</div>
                <input placeholder="بريدك الإلكتروني..."
                  style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#d1d5db", outline: "none", marginBottom: 10, textAlign: "right" }} />
                <button style={{ width: "100%", background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>← اشترك</button>
              </div>
            </div>
            {/* Link columns */}
            {[
              { title: "السوق",     links: ["جميع المنتجات","العروض والتخفيضات","المتاجر الموثوقة","المنتجات الجديدة","الأكثر مبيعاً"] },
              { title: "للبائعين", links: ["افتح متجرك","لوحة التاجر","خطط العمولة","سياسة المراجعات","مركز المساعدة"] },
              { title: "الشركة",   links: ["من نحن","التوصيل والشحن","سياسة الخصوصية","الشروط والأحكام","تواصل معنا"] },
            ].map(col => (
              <div key={col.title} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 20 }}>{col.title}</div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                  {col.links.map(l => <li key={l}><a href="#" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ ...maxW, padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["SyriaTel Cash","PayPal","MasterCard","VISA"].map(p => (
                <span key={p} style={{ fontSize: 11, color: "#4b5563", background: "rgba(255,255,255,0.03)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.05)" }}>{p}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              {["الخصوصية","الشروط","الكوكيز"].map(l => (
                <a key={l} href="#" style={{ fontSize: 12, color: "#4b5563", textDecoration: "none" }}>{l}</a>
              ))}
              <span style={{ fontSize: 12, color: "#4b5563" }}>© SYANO 2025 — جميع الحقوق محفوظة</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
