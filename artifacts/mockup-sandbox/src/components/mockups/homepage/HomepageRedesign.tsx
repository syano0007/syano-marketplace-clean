import { useState, useEffect, useRef } from "react";

/* ── GLOBAL CSS ───────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes kenBurns {
    0%   { transform: scale(1)    translate(0%,0%); }
    40%  { transform: scale(1.07) translate(-1.2%,0.8%); }
    70%  { transform: scale(1.04) translate(0.8%,-0.5%); }
    100% { transform: scale(1)    translate(0%,0%); }
  }
  @keyframes floatA {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-9px); }
  }
  @keyframes floatC {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-6px); }
  }

  /* Scroll reveal */
  .sr { opacity: 0; transform: translateY(26px); transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1); }
  .sr.visible { opacity: 1; transform: translateY(0); }
  .sr-scale { opacity: 0; transform: scale(0.97); transition: opacity 0.5s ease, transform 0.5s ease; }
  .sr-scale.visible { opacity: 1; transform: scale(1); }

  /* Card hover */
  .sy-card { transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.24s ease, border-color 0.2s ease; }
  .sy-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.55); border-color: rgba(16,185,129,0.18) !important; }
  .sy-cat { transition: transform 0.22s ease; cursor: pointer; }
  .sy-cat:hover { transform: scale(1.025); }
  .sy-cat:hover img { filter: brightness(0.5) contrast(1.15) !important; }

  /* Add-to-cart button */
  .sy-atc { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #10b981; transition: background 0.18s, color 0.18s; }
  .sy-atc:hover { background: #10b981 !important; color: #fff !important; }

  /* Store CTA */
  .sy-store-cta { background: none; border: 1px solid rgba(255,255,255,0.1); color: #d1d5db; transition: border-color 0.18s, background 0.18s; }
  .sy-store-cta:hover { border-color: rgba(16,185,129,0.4) !important; background: rgba(16,185,129,0.06) !important; color: #10b981 !important; }

  /* heart */
  .sy-heart { background: rgba(10,10,10,0.65); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.09); color: #9ca3af; transition: color 0.18s, background 0.18s; }
  .sy-heart:hover { color: #f87171 !important; background: rgba(248,113,113,0.12) !important; }
`;

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
  { name: "تك ستور سوريا", desc: "أحدث الإلكترونيات والأجهزة الذكية",  cat: "إلكترونيات",  cnt: "3,240", followers: "12.4K", letter: "ت", bg: "#0f4c81", rating: 4.9, rev: 1840, img: "https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "دار الأناقة",   desc: "أزياء فاخرة وموضة معاصرة للجميع",    cat: "موضة وملابس", cnt: "1,890", followers: "8.2K",  letter: "د", bg: "#6d28d9", rating: 4.8, rev: 2210, img: "https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "بيت الديكور",   desc: "أثاث عصري وإكسسوارات منزلية راقية",  cat: "منزل وديكور", cnt: "2,140", followers: "6.7K",  letter: "ب", bg: "#7c3aed", rating: 4.7, rev: 956,  img: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600" },
];

const TRENDING = [
  { name: "لاب توب بلاك إيشن",    cat: "حواسيب",      seller: "تك ستور سوريا", rating: 4.7, rev: 213, price: "720,000", img: "https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=600",  hot: false },
  { name: "هاتف بريميوم Pro Max",  cat: "هواتف ذكية",  seller: "تك ستور سوريا", rating: 4.8, rev: 892, price: "850,000", img: "https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&w=600", hot: true  },
  { name: "ساعة كرونوغراف سيلفر", cat: "ساعات",       seller: "دار الأناقة",   rating: 4.9, rev: 341, price: "198,000", img: "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600",  hot: true  },
];

const SMALL_ARRIVALS = [
  { name: "عطر الأوبسيديان الليلي", cat: "عطور",        price: "89,500", days: "1 يوم",  img: "https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=300" },
  { name: "ديكور منزلي مودرن",      cat: "منزل وديكور", price: "56,000", days: "3 أيام", img: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=300" },
];

/* ── HELPERS ─────────────────────────────────────────── */
function Stars({ n, size = 12 }: { n: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1.5 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} style={{ width: size, height: size, color: i <= n ? "#f59e0b" : "#2d2d2d" }} fill="currentColor" viewBox="0 0 20 20">
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
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca3af" }}>
      <svg style={{ width: 13, height: 13, color: "#10b981", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span>تنتهي خلال</span>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
        {[z(t.h), z(t.m), z(t.s)].map((v, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontFamily: "monospace", fontWeight: 700, fontSize: 12, padding: "2px 6px", borderRadius: 5 }}>{v}</span>
            {i < 2 && <span style={{ color: "#10b981", fontWeight: 900, fontSize: 11 }}>:</span>}
          </span>
        ))}
      </span>
    </div>
  );
}

function StoreIcon() {
  return (
    <svg style={{ width: 24, height: 24, color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 2L3 7l10 5 10-5-10-5zM3 17l10 5 10-5M3 12l10 5 10-5" />
    </svg>
  );
}
function BikeIcon() {
  return (
    <svg style={{ width: 24, height: 24, color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4c-1.5 0-2.5 1-3 2l-4 8h2l1-2h8l1 2h2l-4-8c-.5-1-1.5-2-3-2zm0 2l2 4h-4l2-4zM6 14a3 3 0 100 6 3 3 0 000-6zm12 0a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
  );
}

/* ── SCROLL REVEAL HOOK ──────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

/* Stagger-reveal: applies sr class + delay to each child */
function useStagger(count: number, delay = 60) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    children.forEach((child, i) => {
      child.style.opacity = "0";
      child.style.transform = "translateY(22px)";
      child.style.transition = `opacity 0.5s ${i * delay}ms cubic-bezier(0.22,1,0.36,1), transform 0.5s ${i * delay}ms cubic-bezier(0.22,1,0.36,1)`;
    });
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach(child => { child.style.opacity = "1"; child.style.transform = "translateY(0)"; });
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, [count, delay]);
  return ref;
}

/* ━━━ SECTION HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* Noon/Trendyol style — lean, clean, not dominant */
function SectionHeader({ sup, title, linkText }: { sup: string; title: string; linkText: string }) {
  const ref = useReveal(0.3);
  return (
    <div ref={ref} className="sr" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
      {/* Title block — FIRST in DOM = RIGHT in RTL */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.3px", lineHeight: 1 }}>{title}</h2>
        <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>{sup}</span>
      </div>
      {/* Link — SECOND in DOM = LEFT in RTL */}
      <button style={{ color: "#6b7280", fontSize: 12, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s", flexShrink: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = "#10b981")}
        onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
      >← {linkText}</button>
    </div>
  );
}

/* ━━━ MAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function HomepageRedesign() {
  const maxW = { maxWidth: 1280, margin: "0 auto", padding: "0 48px" };
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById("syano-scroll-root");
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 20);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  /* section reveal refs */
  const catRef     = useReveal();
  const dealsRef   = useReveal();
  const storesRef  = useReveal();
  const trendRef   = useReveal();
  const newRef     = useReveal();
  const ctaRef     = useReveal();

  /* stagger grid refs */
  const catGrid     = useStagger(8, 50);
  const dealsGrid   = useStagger(4, 65);
  const storesGrid  = useStagger(3, 80);
  const trendGrid   = useStagger(3, 80);

  return (
    <div id="syano-scroll-root" dir="rtl" style={{ fontFamily: "'Segoe UI', Tahoma, system-ui, sans-serif", background: "#080808", color: "#fff", minHeight: "100vh", overflowX: "hidden", overflowY: "auto", height: "100vh" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Grid texture */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />

      {/* ━━━ NAVBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav style={{ background: scrolled ? "rgba(8,8,8,0.97)" : "rgba(8,8,8,0.88)", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.04)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(24px)", transition: "background 0.3s ease,border-color 0.3s ease,box-shadow 0.3s ease", boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.4)" : "none" }}>
        <div style={{ ...maxW, height: 64, display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#fff" }}>S</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.4px", lineHeight: 1.1, color: "#fff" }}>SYANO</div>
              <div style={{ fontSize: 9, color: "#6b7280", lineHeight: 1 }}>سوق سوريا</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {[{ l: "الرئيسية", active: true }, { l: "الفئات ▾", active: false }, { l: "المتاجر", active: false }, { l: "العروض", active: false }].map(({ l, active }) => (
              <button key={l} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: active ? 600 : 400, background: active ? "rgba(255,255,255,0.07)" : "transparent", color: active ? "#fff" : "#9ca3af", border: active ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent", cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <input placeholder="ابحث عن منتجات، متاجر، أو فئات..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 42px 9px 16px", fontSize: 13, color: "#9ca3af", outline: "none", boxSizing: "border-box", textAlign: "right" }} />
            <svg style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#6b7280" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginRight: "auto", flexShrink: 0 }}>
            <button style={{ fontSize: 13, color: "#d1d5db", background: "none", border: "none", cursor: "pointer", padding: "7px 12px" }}>تسجيل الدخول</button>
            <button style={{ fontSize: 13, fontWeight: 700, background: "#10b981", color: "#fff", border: "none", borderRadius: 9, padding: "8px 20px", cursor: "pointer" }}>إنشاء حساب</button>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: 620, zIndex: 1 }}>
        <div style={{ position: "absolute", top: -100, right: "20%", width: 700, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(16,185,129,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: "5%", width: 500, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(245,158,11,0.04) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ ...maxW, display: "flex", alignItems: "center", minHeight: 620, gap: 0 }}>
          {/* TEXT col — first = RIGHT */}
          <div style={{ width: 490, flexShrink: 0, display: "flex", flexDirection: "column", gap: 22, paddingTop: 40, paddingBottom: 60, textAlign: "right" }}>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 100, border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", fontSize: 11, fontWeight: 600, background: "rgba(16,185,129,0.06)" }}>✦ سوق سوريا الرقمي</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.2px", color: "#fff" }}>
              اكتشف آلاف<br />
              المنتجات من<br />
              <span style={{ color: "#10b981" }}>المتاجر السورية</span>
            </h1>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 14, lineHeight: 1.75, fontWeight: 400 }}>منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة تجمع أفضل المتاجر السورية في مكان واحد.</p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button style={{ padding: "12px 28px", borderRadius: 10, background: "#10b981", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>تسوق الآن ←</button>
              <button style={{ padding: "12px 28px", borderRadius: 10, background: "transparent", color: "#d1d5db", fontSize: 14, fontWeight: 400, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>استكشف المتاجر</button>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", alignItems: "flex-start" }}>
              {[{ n: "+12,000", l: "عميل راضٍ" }, { n: "+25,000", l: "منتج فاعل" }, { n: "+500", l: "متاجر نشطة" }].map((s, i) => (
                <div key={s.l} style={{ flex: 1, textAlign: "right", paddingInlineEnd: i < 2 ? 18 : 0, paddingInlineStart: i > 0 ? 18 : 0, borderInlineStart: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1, whiteSpace: "nowrap" }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3, fontWeight: 400 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* IMAGE col — second = LEFT */}
          <div style={{ flex: 1, position: "relative", height: 560, marginRight: 48 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden" }}>
              <img src="https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5) contrast(1.15)", animation: "kenBurns 24s ease-in-out infinite", transformOrigin: "center center", willChange: "transform" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,transparent 35%,#080808 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,8,8,0.6) 0%,transparent 45%)" }} />
            </div>
            {/* Float top */}
            <div style={{ position: "absolute", top: 32, left: 28, zIndex: 2, background: "rgba(12,12,12,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "11px 14px", display: "flex", gap: 10, alignItems: "center", width: 210, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "floatA 5s ease-in-out infinite", willChange: "transform" }}>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>عطار ديور سوهاج</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>75,000 <span style={{ color: "#10b981", fontSize: 10, fontWeight: 400 }}>ل.س</span></div>
                <Stars n={5} size={11} />
              </div>
              <img src="https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            </div>
            {/* Float mid */}
            <div style={{ position: "absolute", top: 200, left: 20, zIndex: 2, background: "rgba(12,12,12,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "11px 14px", display: "flex", gap: 10, alignItems: "center", width: 188, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "floatC 7s 1.5s ease-in-out infinite", willChange: "transform" }}>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>مومية رالية</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>38,500 <span style={{ color: "#10b981", fontSize: 10, fontWeight: 400 }}>ل.س</span></div>
              </div>
              <img src="https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            </div>
            {/* Float bottom */}
            <div style={{ position: "absolute", bottom: 44, left: 44, zIndex: 2, background: "rgba(12,12,12,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "11px 14px", display: "flex", gap: 10, alignItems: "center", width: 222, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "floatA 6s 3s ease-in-out infinite", willChange: "transform" }}>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>ساعة خضرية فاخرة</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>142,000 <span style={{ color: "#10b981", fontSize: 10, fontWeight: 400 }}>ل.س</span></div>
                <div style={{ fontSize: 10, color: "#10b981", display: "flex", alignItems: "center", gap: 3 }}>● متوفر الآن</div>
              </div>
              <img src="https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            </div>
            <div style={{ position: "absolute", top: 120, right: 60, zIndex: 2, background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 800, padding: "5px 13px", borderRadius: 100 }}>خصم ٨٠٪</div>
          </div>
        </div>
      </section>

      {/* ━━━ CATEGORIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "70px 0 60px" }}>
        <div style={maxW}>
          <div ref={catRef} className="sr">
            <SectionHeader sup="تصفح حسب الفئة" title="الفئات الأكثر شيوعاً" linkText="عرض الكل" />
          </div>
          <div ref={catGrid} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {CATEGORIES.map(c => (
              <div key={c.name} className="sy-cat" style={{ position: "relative", height: 200, borderRadius: 14, overflow: "hidden" }}>
                <img src={c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.38) contrast(1.1)", display: "block", transition: "filter 0.3s ease" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.1) 60%,transparent 100%)" }} />
                <div style={{ position: "absolute", bottom: 0, right: 0, padding: "0 14px 14px", textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>{c.count} منتج</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURED DEALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 60px" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 800, height: 400, background: "radial-gradient(ellipse,rgba(16,185,129,0.03) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={maxW}>
          <div ref={dealsRef} className="sr">
            {/* Deals header — custom layout */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.3px", lineHeight: 1 }}>عروض مميزة</h2>
                <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>عروض حصرية</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Timer />
                <button style={{ color: "#6b7280", fontSize: 12, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>← كل العروض</button>
              </div>
            </div>
          </div>

          {/* Deal cards grid */}
          <div ref={dealsGrid} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {DEALS.map(d => (
              <div key={d.name} className="sy-card" style={{ background: "#0d0d0d", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column" }}>
                {/* Image zone */}
                <div style={{ position: "relative", height: 186, flexShrink: 0 }}>
                  <img src={d.img} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(13,13,13,0.55) 0%,transparent 50%)" }} />
                  {/* Discount pill — top left */}
                  <span style={{ position: "absolute", top: 10, left: 10, background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 100, letterSpacing: "0.2px" }}>-{d.disc}%</span>
                  {/* Label badge — top right */}
                  <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)", color: "#e5e7eb", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" }}>{d.badge}</span>
                  {/* Heart — bottom right of image */}
                  <button className="sy-heart" style={{ position: "absolute", bottom: 10, left: 10, width: 28, height: 28, borderRadius: "50%", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>♡</button>
                </div>

                {/* Card body */}
                <div style={{ padding: "12px 13px 13px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Category */}
                  <div style={{ fontSize: 10, color: "#6b7280", textAlign: "right", marginBottom: 4, fontWeight: 500, letterSpacing: "0.02em" }}>{d.cat}</div>
                  {/* Product name */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", textAlign: "right", lineHeight: 1.4, marginBottom: 8, flex: 1 }}>{d.name}</div>
                  {/* Rating */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: "#6b7280" }}>({d.rev})</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#e5e7eb" }}>{d.rating}</span>
                    <Stars n={Math.floor(d.rating)} size={11} />
                  </div>
                  {/* Price row */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: "#6b7280", textDecoration: "line-through" }}>{d.orig} ل.س</span>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#10b981", lineHeight: 1 }}>{d.price}</span>
                      <span style={{ fontSize: 10, color: "#6b7280", marginRight: 3 }}> ل.س</span>
                    </div>
                  </div>
                  {/* CTA */}
                  <button className="sy-atc" style={{ width: "100%", fontSize: 12, fontWeight: 700, padding: "9px", borderRadius: 8, cursor: "pointer", letterSpacing: "0.01em" }}>أضف للسلة</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ TRUSTED STORES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 60px" }}>
        <div style={maxW}>
          <div ref={storesRef} className="sr">
            <SectionHeader sup="شركاؤنا التجاريون" title="متاجر موثوقة" linkText="جميع المتاجر" />
          </div>
          <div ref={storesGrid} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {STORES.map(s => (
              <div key={s.name} className="sy-card" style={{ background: "#0d0d0d", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Banner */}
                <div style={{ position: "relative", height: 120 }}>
                  <img src={s.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.3)", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,#0d0d0d 0%,transparent 55%)" }} />
                  {/* Verified badge */}
                  <span style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 3, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, backdropFilter: "blur(8px)" }}>
                    <svg style={{ width: 9, height: 9 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    موثوق
                  </span>
                  {/* Avatar — centered at bottom */}
                  <div style={{ position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)", width: 48, height: 48, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", border: "2px solid #0d0d0d", boxShadow: "0 4px 16px rgba(0,0,0,0.5)", flexShrink: 0 }}>{s.letter}</div>
                </div>
                {/* Body */}
                <div style={{ padding: "32px 16px 16px", textAlign: "center" }}>
                  {/* Store name */}
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>{s.name}</div>
                  {/* Rating row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 8 }}>
                    <Stars n={Math.floor(s.rating)} size={11} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb" }}>{s.rating}</span>
                    <span style={{ fontSize: 10, color: "#6b7280" }}>({s.rev})</span>
                  </div>
                  {/* Description */}
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "#9ca3af", lineHeight: 1.6, fontWeight: 400 }}>{s.desc}</p>
                  {/* Stats row */}
                  <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1, textAlign: "center", paddingInlineEnd: 12, borderInlineStart: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{s.cnt}</div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>منتج</div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center", paddingInlineStart: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{s.followers}</div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>متابع</div>
                    </div>
                  </div>
                  {/* CTA */}
                  <button className="sy-store-cta" style={{ width: "100%", padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    زيارة المتجر
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ TRENDING PRODUCTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 60px" }}>
        <div style={maxW}>
          <div ref={trendRef} className="sr">
            <SectionHeader sup="الأعلى تقييماً هذا الأسبوع" title="المنتجات الرائجة" linkText="عرض الكل" />
          </div>
          <div ref={trendGrid} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {TRENDING.map(p => (
              <div key={p.name} className="sy-card" style={{ background: "#0d0d0d", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ position: "relative", height: 290 }}>
                  <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.7)" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(13,13,13,0.92) 0%,transparent 50%)" }} />
                  {p.hot && (
                    <span style={{ position: "absolute", top: 12, right: 12, background: "#10b981", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100, display: "flex", alignItems: "center", gap: 3 }}>↑ رائج</span>
                  )}
                  <button className="sy-heart" style={{ position: "absolute", top: 12, left: 12, width: 30, height: 30, borderRadius: "50%", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>♡</button>
                  {/* Info overlay on image */}
                  <div style={{ position: "absolute", bottom: 0, right: 0, left: 0, padding: "0 14px 14px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{p.cat}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{p.seller}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Stars n={Math.floor(p.rating)} size={10} />
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>({p.rev})</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{p.price}</span>
                        <span style={{ fontSize: 10, color: "#9ca3af", marginRight: 3 }}> ل.س</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Card footer */}
                <div style={{ padding: "10px 13px 13px" }}>
                  <button className="sy-atc" style={{ width: "100%", fontSize: 12, fontWeight: 700, padding: "9px", borderRadius: 8, cursor: "pointer" }}>أضف للسلة</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ NEW ARRIVALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 60px" }}>
        <div style={maxW}>
          <div ref={newRef} className="sr">
            <SectionHeader sup="أضيف لنا" title="وصل حديثاً" linkText="الجديد كل يوم" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14 }}>
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 380 }}>
              <img src="https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=900" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.32) contrast(1.1)", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.1) 55%)" }} />
              <div style={{ position: "absolute", top: 18, right: 18 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", padding: "4px 11px", borderRadius: 100, fontWeight: 600 }}>↑ جديد منذ 2 أيام</span>
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, left: 0, padding: "0 24px 24px", textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 5, fontWeight: 400 }}>إلكترونيات</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 10, lineHeight: 1.2 }}>مجموعة تقنية بريميوم 2025</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>(12 تقييم)</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>4.8</span>
                  <Stars n={5} size={12} />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>435,000 <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af" }}>ل.س</span></div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SMALL_ARRIVALS.map(a => (
                <div key={a.name} style={{ background: "#0d0d0d", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", display: "flex", height: 183 }}>
                  <div style={{ flex: 1, padding: "16px", textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: "#10b981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", padding: "2px 7px", borderRadius: 100, marginBottom: 6, fontWeight: 600 }}>● منذ {a.days}</span>
                      <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3, fontWeight: 400 }}>{a.cat}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0", lineHeight: 1.35 }}>{a.name}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>{a.price} <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af" }}>ل.س</span></div>
                  </div>
                  <div style={{ width: 140, flexShrink: 0 }}>
                    <img src={a.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.7)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ JOIN CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 60px" }}>
        <div style={maxW}>
          <div ref={ctaRef} className="sr-scale">
            <div style={{ background: "#0a0a0a", borderRadius: 24, border: "1px solid rgba(255,255,255,0.07)", padding: "64px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse,rgba(16,185,129,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 16px", borderRadius: 100, border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 12, fontWeight: 600, marginBottom: 20, background: "rgba(16,185,129,0.06)" }}>انضم إلى سيانو</span>
              <h2 style={{ margin: "0 0 12px", fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.4px" }}>كن جزءاً من السوق السوري</h2>
              <p style={{ margin: "0 0 40px", color: "#9ca3af", fontSize: 14, fontWeight: 400 }}>سواء كنت بائعاً أو مندوب توصيل، هناك مكان لك في سيانو.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 720, margin: "0 auto" }}>
                {[
                  { Icon: StoreIcon, title: "ابدأ البيع على سيانو", desc: "افتح متجرك الإلكتروني وتواصل مع آلاف المشترين في جميع أنحاء سوريا", link: "إنشاء متجري" },
                  { Icon: BikeIcon,  title: "انضم كمندوب توصيل",   desc: "حقق دخلاً إضافياً من خلال توصيل الطلبات في مدينتك بمرونة كاملة في عملك", link: "التسجيل كمندوب" },
                ].map(c => (
                  <div key={c.title} style={{ background: "#111", borderRadius: 16, padding: "32px 28px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><c.Icon /></div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{c.title}</div>
                    <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7, marginBottom: 20, fontWeight: 400 }}>{c.desc}</p>
                    <button style={{ background: "none", border: "none", color: "#10b981", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, margin: "0 auto" }}>{c.link} ←</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#060606", position: "relative", zIndex: 1 }}>
        <div style={{ ...maxW, padding: "64px 48px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", marginBottom: 14 }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>SYANO</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#fff" }}>S</div>
              </div>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.75, marginBottom: 18, fontWeight: 400 }}>منصة التجارة الإلكترونية السورية الأولى التي تجمع أفضل المتاجر والمنتجات في مكان واحد</p>
              <div style={{ display: "flex", gap: 7, justifyContent: "flex-end", marginBottom: 28 }}>
                {[{ i: "▶", label: "YouTube" }, { i: "f", label: "Facebook" }, { i: "𝕏", label: "Twitter" }, { i: "◉", label: "Instagram" }].map(s => (
                  <button key={s.label} title={s.label} style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>{s.i}</button>
                ))}
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 5, textAlign: "right" }}>اشترك في النشرة البريدية</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12, textAlign: "right", fontWeight: 400 }}>أحدث العروض والمنتجات مباشرة إلى بريدك</div>
                <input placeholder="بريدك الإلكتروني..." style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "#d1d5db", outline: "none", marginBottom: 8, textAlign: "right" }} />
                <button style={{ width: "100%", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← اشترك</button>
              </div>
            </div>
            {[
              { title: "السوق",     links: ["جميع المنتجات","العروض والتخفيضات","المتاجر الموثوقة","المنتجات الجديدة","الأكثر مبيعاً"] },
              { title: "للبائعين", links: ["افتح متجرك","لوحة التاجر","خطط العمولة","سياسة المراجعات","مركز المساعدة"] },
              { title: "الشركة",   links: ["من نحن","التوصيل والشحن","سياسة الخصوصية","الشروط والأحكام","تواصل معنا"] },
            ].map(col => (
              <div key={col.title} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 18 }}>{col.title}</div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  {col.links.map(l => <li key={l}><a href="#" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", fontWeight: 400 }}>{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ ...maxW, padding: "14px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 7 }}>
              {["SyriaTel Cash","PayPal","MasterCard","VISA"].map(p => (
                <span key={p} style={{ fontSize: 10, color: "#4b5563", background: "rgba(255,255,255,0.03)", padding: "3px 9px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.05)" }}>{p}</span>
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
