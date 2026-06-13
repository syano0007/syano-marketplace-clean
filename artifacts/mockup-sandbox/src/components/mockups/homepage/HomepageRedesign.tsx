import { useState, useEffect } from "react";

const GREEN = "#10b981";

const NAV_LINKS = ["الرئيسية", "الفئات", "المتاجر", "العروض"];

const CATEGORIES = [
  { name: "إلكترونيات", count: "12,450", img: "https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "موضة وملابس", count: "8,320", img: "https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "عطور وجمال", count: "3,650", img: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "منزل وديكور", count: "6,780", img: "https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "رياضة وأحذية", count: "5,230", img: "https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "ساعات فاخرة", count: "2,890", img: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "هواتف ذكية", count: "4,120", img: "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { name: "حواسيب ولابتوب", count: "3,470", img: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600" },
];

const DEALS = [
  { name: "عطر أوبسيديان إلكسير", cat: "عطور وجمال", price: "96,000", orig: "148,000", disc: 35, badge: "حصري", rating: 4.6, reviews: 89, img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "مجموعة تقنية متكاملة", cat: "إلكترونيات", price: "385,000", orig: "550,000", disc: 30, badge: "جديد", rating: 4.8, reviews: 196, img: "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "حذاء نايكي رياضي", cat: "رياضة وأحذية", price: "58,000", orig: "82,000", disc: 29, badge: "عرض محدود", rating: 4.7, reviews: 512, img: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "ساعة كلاسيكية ذهبية", cat: "ساعات فاخرة", price: "142,500", orig: "237,000", disc: 40, badge: "الأكثر مبيعاً", rating: 4.9, reviews: 284, img: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500" },
];

const STORES = [
  { name: "تك ستور سوريا", desc: "أحدث الإلكترونيات والأجهزة الذكية", cat: "إلكترونيات", count: "3,240", letter: "ت", color: "#1e293b", rating: 4.9, reviews: 1840, img: "https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=700" },
  { name: "دار الأناقة", desc: "أزياء فاخرة وموضة معاصرة للجميع", cat: "موضة وملابس", count: "1,890", letter: "د", color: "#4c1d95", rating: 4.8, reviews: 2210, img: "https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=700" },
  { name: "بيت الديكور", desc: "أثاث عصري وإكسسوارات منزلية راقية", cat: "منزل وديكور", count: "2,140", letter: "ب", color: "#7c3aed", rating: 4.7, reviews: 956, img: "https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=700" },
];

const TRENDING = [
  { name: "لاب توب بلاك إيشن", cat: "حواسيب", seller: "تك ستور سوريا", rating: 4.7, reviews: 213, price: "720,000", img: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600", trending: false },
  { name: "هاتف بريميوم Pro Max", cat: "هواتف ذكية", seller: "تك ستور سوريا", rating: 4.8, reviews: 892, price: "850,000", img: "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=600", trending: true },
  { name: "ساعة كرونوغراف سيلفر", cat: "ساعات فاخرة", seller: "دار الأناقة", rating: 4.9, reviews: 341, price: "198,000", img: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=600", trending: true },
];

const ARRIVALS_SMALL = [
  { name: "عطر الأوبسيديان الليلي", cat: "عطور", price: "89,500", days: "1 يوم", img: "https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=300" },
  { name: "ديكور منزلي مودرن", cat: "منزل وديكور", price: "56,000", days: "3 أيام", img: "https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=300" },
];

const ARRIVALS_FEATURED = {
  name: "مجموعة تقنية بريميوم 2025", cat: "إلكترونيات", rating: 4.8, reviews: 12, price: "435,000", days: "2 أيام",
  img: "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=800"
};

const FOOTER_COLS = [
  { title: "السوق", links: ["جميع المنتجات", "العروض والتخفيضات", "المتاجر الموثوقة", "المنتجات الجديدة", "الأكثر مبيعاً"] },
  { title: "للبائعين", links: ["افتح متجرك", "لوحة التاجر", "خطط العمولة", "سياسة المراجعات", "مركز المساعدة"] },
  { title: "الشركة", links: ["من نحن", "التوصيل والشحن", "سياسة الخصوصية", "الشروط والأحكام", "تواصل معنا"] },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.floor(rating) ? "fill-emerald-400 text-emerald-400" : "fill-gray-600 text-gray-600"}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Countdown() {
  const [time, setTime] = useState({ h: 18, m: 24, s: 8 });
  useEffect(() => {
    const t = setInterval(() => setTime(p => {
      let { h, m, s } = p;
      s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) h = 0;
      return { h, m, s };
    }), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-2 text-sm text-gray-300">
      <span>تنتهي خلال:</span>
      {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="bg-gray-800 text-white font-mono font-bold px-2 py-1 rounded text-base">{v}</span>
          {i < 2 && <span className="text-emerald-400 font-bold">:</span>}
        </span>
      ))}
    </div>
  );
}

export function HomepageRedesign() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#080808] text-white font-sans overflow-x-hidden">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-base" style={{ background: GREEN }}>S</div>
            <span className="font-black text-lg tracking-tight text-white">SYANO</span>
            <span className="text-[10px] text-gray-500 -mt-3 mr-0.5">سوق سوريا</span>
          </div>
          {/* Nav links */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {NAV_LINKS.map((l, i) => (
              <button key={l} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${i === 0 ? "text-white bg-white/10" : "text-gray-400 hover:text-white"}`}>
                {l}{i === 1 && <span className="mr-1 text-xs">▾</span>}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="flex-1 max-w-lg mx-auto">
            <div className="relative">
              <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 placeholder-gray-500 pr-10 focus:outline-none focus:border-emerald-500/50" placeholder="ابحث عن منتجات، متاجر، أو فئات..." />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          {/* Auth */}
          <div className="flex items-center gap-2 flex-shrink-0 mr-auto">
            <button className="text-sm text-gray-300 hover:text-white px-3 py-1.5">تسجيل الدخول</button>
            <button className="text-sm font-semibold px-4 py-1.5 rounded-xl text-white" style={{ background: GREEN }}>إنشاء حساب</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative min-h-[580px] overflow-hidden bg-[#080808]">
        {/* subtle bg glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[600px] h-[400px] rounded-full opacity-[0.04]" style={{ background: GREEN, filter: "blur(120px)" }} />
          <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full opacity-[0.03] bg-amber-400" style={{ filter: "blur(100px)" }} />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 relative z-10 flex items-center min-h-[580px]">
          {/* LEFT — product mosaic */}
          <div className="flex-1 relative h-[520px] hidden md:block">
            {/* Main mosaic image */}
            <div className="absolute inset-4 rounded-2xl overflow-hidden">
              <img src="https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=700" alt="" className="w-full h-full object-cover brightness-75" />
              <div className="absolute inset-0 bg-gradient-to-l from-[#080808] via-transparent to-transparent" />
            </div>
            {/* Floating product card 1 — top */}
            <div className="absolute top-8 right-8 bg-[#111]/90 backdrop-blur border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-2xl w-52">
              <img src="https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className="text-[11px] text-gray-400">عطار ديور سوهاج</p>
                <p className="text-sm font-bold text-white">75,000 <span className="text-[10px] font-normal text-emerald-400">ل.س</span></p>
                <StarRating rating={4.5} />
              </div>
            </div>
            {/* Floating product card 2 — mid-left */}
            <div className="absolute bottom-32 right-6 bg-[#111]/90 backdrop-blur border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-2xl w-48">
              <img src="https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className="text-[11px] text-gray-400">مومية رالية</p>
                <p className="text-sm font-bold text-white">38,500 <span className="text-[10px] font-normal text-emerald-400">ل.س</span></p>
              </div>
            </div>
            {/* Floating card 3 — bottom */}
            <div className="absolute bottom-10 right-20 bg-[#111]/90 backdrop-blur border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-2xl w-54">
              <img src="https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className="text-[11px] text-gray-400">ساعة خضرية فاخرة</p>
                <p className="text-sm font-bold text-white">142,000 <span className="text-[10px] font-normal text-emerald-400">ل.س</span></p>
                <p className="text-[9px] text-emerald-400 mt-0.5">● متوفر الآن</p>
              </div>
            </div>
            {/* Discount badge */}
            <div className="absolute top-28 left-8 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: GREEN }}>خصم %٨٠</div>
          </div>

          {/* RIGHT — text content */}
          <div className="w-full md:w-[48%] flex flex-col gap-6 md:pr-8 py-16">
            {/* Badge */}
            <div className="inline-flex self-start">
              <span className="px-3 py-1.5 rounded-full text-xs font-medium border text-emerald-400 border-emerald-500/40 flex items-center gap-1.5">
                <span style={{ color: GREEN }}>✦</span> سوق سوريا الرقمي
              </span>
            </div>
            {/* Headline */}
            <div>
              <h1 className="text-5xl font-black leading-[1.15] text-white">
                اكتشف آلاف<br />المنتجات من<br />
                <span style={{ color: GREEN }}>المتاجر السورية</span>
              </h1>
            </div>
            {/* Subtitle */}
            <p className="text-gray-400 text-base leading-relaxed max-w-sm">
              منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة تجمع أفضل المتاجر السورية في مكان واحد.
            </p>
            {/* CTAs */}
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 rounded-xl text-white font-bold text-sm" style={{ background: GREEN }}>
                تسوق الآن ←
              </button>
              <button className="px-6 py-3 rounded-xl text-gray-300 font-semibold text-sm border border-white/15 hover:border-white/30">
                استكشف المتاجر
              </button>
            </div>
            {/* Stats */}
            <div className="flex items-center gap-8 pt-2 border-t border-white/8">
              {[
                { num: "12,000+", label: "عميل راضٍ" },
                { num: "25,000+", label: "منتج فاعل" },
                { num: "500+", label: "متاجر نشط" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-white">{s.num}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── POPULAR CATEGORIES ─────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 py-16">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
            ← عرض الكل
          </button>
          <div className="text-right">
            <p className="text-xs font-medium mb-1" style={{ color: GREEN }}>تصفح حسب الفئة</p>
            <h2 className="text-3xl font-black text-white">الفئات الأكثر شيوعاً</h2>
          </div>
        </div>
        {/* Grid */}
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map(cat => (
            <div key={cat.name} className="relative h-44 rounded-2xl overflow-hidden cursor-pointer group">
              <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 right-0 p-4 text-right">
                <p className="text-white font-bold text-base">{cat.name}</p>
                <p className="text-gray-300 text-xs mt-0.5">{cat.count} منتج</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED DEALS ─────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 py-8 pb-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div className="flex flex-col items-start gap-2">
            <button className="text-sm text-gray-400">← كل العروض</button>
            <Countdown />
          </div>
          <div className="text-right">
            <p className="text-xs font-medium mb-1" style={{ color: GREEN }}>عروض حصرية</p>
            <h2 className="text-3xl font-black text-white">عروض مميزة</h2>
          </div>
        </div>
        {/* Cards */}
        <div className="grid grid-cols-4 gap-4">
          {DEALS.map(d => (
            <div key={d.name} className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/20 transition-colors group">
              <div className="relative h-52 overflow-hidden">
                <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: GREEN }}>-{d.disc}%</span>
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur text-white border border-white/10">{d.badge}</span>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-1">{d.cat}</p>
                <h3 className="font-bold text-white text-base leading-tight mb-2">{d.name}</h3>
                <div className="flex items-center gap-1.5 mb-3">
                  <StarRating rating={d.rating} />
                  <span className="text-xs text-gray-500">({d.reviews}) {d.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/8 text-gray-300 hover:bg-white/15">أضف</button>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 line-through">{d.orig} ل.س</p>
                    <p className="text-base font-black" style={{ color: GREEN }}>{d.price} <span className="text-xs font-normal">ل.س</span></p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUSTED STORES ─────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 py-8 pb-16">
        <div className="flex items-end justify-between mb-8">
          <button className="text-sm text-gray-400">← جميع المتاجر</button>
          <div className="text-right">
            <p className="text-xs font-medium mb-1" style={{ color: GREEN }}>شركاؤنا التجاريون</p>
            <h2 className="text-3xl font-black text-white">متاجر موثوقة</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {STORES.map(s => (
            <div key={s.name} className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/20 transition-colors">
              {/* Banner */}
              <div className="relative h-36">
                <img src={s.img} alt={s.name} className="w-full h-full object-cover brightness-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                {/* Verified badge */}
                <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ background: GREEN }}>
                  ✓ موثوق
                </span>
                {/* Logo avatar */}
                <div className="absolute -bottom-5 right-4 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg" style={{ background: s.color }}>
                  {s.letter}
                </div>
              </div>
              <div className="p-4 pt-7 text-right">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <StarRating rating={s.rating} />
                    <span className="text-xs text-gray-500">({s.reviews})</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{s.name}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">{s.desc}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">📦 {s.count} منتج</span>
                  <span className="bg-white/6 px-2 py-0.5 rounded-full">{s.cat}</span>
                </div>
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold border border-white/15 text-gray-300 hover:border-emerald-500/40 hover:text-white transition-colors flex items-center justify-center gap-2">
                  ↗ زيارة المتجر
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRENDING PRODUCTS ──────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 py-8 pb-16">
        <div className="flex items-end justify-between mb-8">
          <button className="text-sm text-gray-400">← عرض الكل</button>
          <div className="text-right">
            <p className="text-xs font-medium mb-1" style={{ color: GREEN }}>الأعلى تقييماً هذا الأسبوع</p>
            <h2 className="text-3xl font-black text-white">المنتجات الرائجة</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {TRENDING.map(p => (
            <div key={p.name} className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/20 transition-colors group">
              <div className="relative h-72 overflow-hidden">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {p.trending && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: GREEN }}>
                    ↑ رائج
                  </span>
                )}
                <button className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-gray-300 hover:text-red-400">♡</button>
              </div>
              <div className="p-5 text-right">
                <p className="text-xs text-gray-500 mb-0.5">{p.seller} · {p.cat}</p>
                <h3 className="font-bold text-white text-lg leading-tight mb-2">{p.name}</h3>
                <div className="flex items-center justify-end gap-1.5 mb-4">
                  <span className="text-xs text-gray-500">({p.reviews})</span>
                  <StarRating rating={p.rating} />
                </div>
                <div className="flex items-center justify-between">
                  <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: GREEN }}>أضف للسلة</button>
                  <p className="text-xl font-black text-white">{p.price} <span className="text-sm font-normal text-gray-400">ل.س</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEW ARRIVALS ───────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 py-8 pb-16">
        <div className="flex items-end justify-between mb-8">
          <button className="text-sm text-gray-400">← الجديد كل يوم</button>
          <div className="text-right">
            <p className="text-xs font-medium mb-1" style={{ color: GREEN }}>أضيف لنا</p>
            <h2 className="text-3xl font-black text-white">وصل حديثاً</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {/* Left column — 2 small cards */}
          <div className="flex flex-col gap-4">
            {ARRIVALS_SMALL.map(a => (
              <div key={a.name} className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 flex items-stretch h-36 hover:border-emerald-500/20 transition-colors">
                <div className="flex-1 p-4 text-right flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full mb-1">
                      ● منذ {a.days}
                    </span>
                    <p className="text-xs text-gray-500">{a.cat}</p>
                    <h4 className="font-bold text-white text-sm leading-tight mt-1">{a.name}</h4>
                  </div>
                  <p className="text-base font-black" style={{ color: GREEN }}>{a.price} <span className="text-xs font-normal text-gray-400">ل.س</span></p>
                </div>
                <div className="w-32 flex-shrink-0">
                  <img src={a.img} alt={a.name} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
          {/* Right — large featured */}
          <div className="col-span-2 relative rounded-2xl overflow-hidden group h-80">
            <img src={ARRIVALS_FEATURED.img} alt={ARRIVALS_FEATURED.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute top-4 right-4">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                ↑ جديد منذ {ARRIVALS_FEATURED.days}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 p-6 text-right w-full">
              <p className="text-xs text-gray-400 mb-1">{ARRIVALS_FEATURED.cat}</p>
              <h3 className="text-2xl font-black text-white mb-2">{ARRIVALS_FEATURED.name}</h3>
              <div className="flex items-center justify-end gap-2 mb-3">
                <span className="text-xs text-gray-400">({ARRIVALS_FEATURED.reviews} تقييم)</span>
                <StarRating rating={ARRIVALS_FEATURED.rating} />
                <span className="text-xs font-bold text-white">{ARRIVALS_FEATURED.rating}</span>
              </div>
              <p className="text-2xl font-black" style={{ color: GREEN }}>{ARRIVALS_FEATURED.price} <span className="text-sm font-normal text-gray-400">ل.س</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 py-8 pb-16">
        <div className="bg-[#0e0e0e] rounded-3xl border border-white/5 p-12 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border text-emerald-400 border-emerald-500/30 mb-6">
            انضم إلى سيانو
          </span>
          <h2 className="text-4xl font-black text-white mb-3">كن جزءاً من السوق السوري</h2>
          <p className="text-gray-400 text-base mb-10">سواء كنت بائعاً أو مندوب توصيل، هناك مكان لك في سيانو.</p>
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: "🏪", title: "ابدأ البيع على سيانو", desc: "افتح متجرك الإلكتروني وتواصل مع آلاف المشترين في جميع أنحاء سوريا", link: "إنشاء متجري" },
              { icon: "🛵", title: "انضم كمندوب توصيل", desc: "حقق دخلاً إضافياً من خلال توصيل الطلبات في مدينتك بمرونة كاملة في عملك", link: "التسجيل كمندوب" },
            ].map(c => (
              <div key={c.title} className="bg-[#161616] rounded-2xl p-8 text-center border border-white/6 hover:border-emerald-500/20 transition-colors">
                <div className="text-4xl mb-4">{c.icon}</div>
                <h3 className="text-xl font-black text-white mb-3">{c.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{c.desc}</p>
                <button className="text-sm font-semibold flex items-center justify-center gap-1.5 mx-auto" style={{ color: GREEN }}>
                  {c.link} ←
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#060606]">
        <div className="max-w-[1400px] mx-auto px-6 py-14">
          <div className="grid grid-cols-4 gap-10">
            {/* Brand col */}
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-4">
                <span className="font-black text-lg text-white">SYANO</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: GREEN }}>S</div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-5">منصة التجارة الإلكترونية السورية الأولى التي تجمع أفضل المتاجر والمنتجات في مكان واحد</p>
              <div className="flex items-center gap-2 justify-end">
                {["▶", "f", "𝕏", "📷"].map(icon => (
                  <button key={icon} className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center text-gray-400 hover:text-white text-xs">{icon}</button>
                ))}
              </div>
              {/* Newsletter */}
              <div className="mt-8">
                <h4 className="font-bold text-white text-sm mb-1">اشترك في النشرة البريدية</h4>
                <p className="text-xs text-gray-500 mb-3">أحدث العروض والمنتجات مباشرة إلى بريدك</p>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 placeholder-gray-600 mb-2 text-right focus:outline-none" placeholder="بريدك الإلكتروني..." />
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: GREEN }}>← اشترك</button>
              </div>
            </div>
            {/* Link columns */}
            {FOOTER_COLS.map(col => (
              <div key={col.title} className="text-right">
                <h4 className="font-bold text-white text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(l => <li key={l}><a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom bar */}
        <div className="border-t border-white/5">
          <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {["SyriaTel Cash", "PayPal", "MasterCard", "VISA"].map(p => (
                <span key={p} className="text-[10px] text-gray-600 bg-white/4 px-2 py-1 rounded border border-white/6">{p}</span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              {["الخصوصية", "الشروط", "الكوكيز"].map(l => (
                <a key={l} href="#" className="text-[10px] text-gray-600 hover:text-gray-400">{l}</a>
              ))}
              <span className="text-[10px] text-gray-600">© SYANO 2025 — جميع الحقوق محفوظة</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
