import React, { useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import {
  useListProducts,
  useGetPublicSettings,
  getListProductsQueryKey,
  getGetPublicSettingsQueryKey,
} from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { useSEO } from "@/hooks/useSEO";
import { useSellerOnboarding } from "@/hooks/useSellerOnboarding";
import { useCourierOnboarding } from "@/hooks/useCourierOnboarding";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useCountdown } from "@/hooks/use-countdown";
import { ProductCard } from "@/components/ProductCard";
import { HeroV4 } from "@/components/HeroV4";

/* ─────────────────────────────────────────────────────────
   SCOPED CSS — keyframes + utility classes (no global reset)
   ───────────────────────────────────────────────────────── */
const PAGE_CSS = `
  @keyframes syKenBurns {
    0%   { transform: scale(1)    translate(0%,0%); }
    40%  { transform: scale(1.06) translate(-1%,0.6%); }
    70%  { transform: scale(1.04) translate(0.5%,-0.4%); }
    100% { transform: scale(1)    translate(0%,0%); }
  }
  @keyframes syFloatA { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-9px); } }
  @keyframes syFloatB { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
  @keyframes syFloatC { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-11px); } }

  /* ── Light / Dark page wrapper ────────────────────────────────── */
  .sy-page { background:#f8fafc; color:#111827; }
  .dark .sy-page { background:#080808; color:#fff; }

  /* ── Section title inherits page color ─────────────────────────── */
  .sy-title { color:inherit; }

  /* ── Card base — bg swaps per theme ────────────────────────────── */
  .sy-card-bg { background:#fff; border-color:rgba(0,0,0,0.08) !important; }
  .dark .sy-card-bg { background:#0b0b0b; border-color:rgba(255,255,255,0.06) !important; }

  /* ── Card text ─────────────────────────────────────────────────── */
  .sy-card-name { color:#111827; }
  .dark .sy-card-name { color:#f0f0f0; }
  .sy-card-muted { color:#4b5563; }
  .dark .sy-card-muted { color:#9ca3af; }

  /* ── Store card CTA ────────────────────────────────────────────── */
  .sy-store-cta { background:none; border:1px solid rgba(0,0,0,0.1); color:#4b5563; transition:border-color 0.22s,color 0.22s,background 0.22s; }
  .dark .sy-store-cta { border-color:rgba(255,255,255,0.1); color:#9ca3af; }
  .sy-store-cta:hover { border-color:rgba(16,185,129,0.45) !important; color:#10b981 !important; background:rgba(16,185,129,0.04) !important; }

  /* ── CTA section ───────────────────────────────────────────────── */
  .sy-cta-section { background:#f1f5f9; border-color:rgba(0,0,0,0.07) !important; }
  .dark .sy-cta-section { background:#0a0a0a; border-color:rgba(255,255,255,0.07) !important; }
  .sy-cta-btn { background:#fff !important; border:1px solid rgba(0,0,0,0.08) !important; border-radius:16px; padding:38px 28px; text-align:center; cursor:pointer; transition:border-color 0.25s,background 0.25s; width:100%; }
  .dark .sy-cta-btn { background:#111 !important; border-color:rgba(255,255,255,0.06) !important; }
  .sy-cta-btn:hover { border-color:rgba(16,185,129,0.3) !important; background:rgba(16,185,129,0.04) !important; }

  /* ── Add to cart buttons ───────────────────────────────────────── */
  .sy-add-dark { background:rgba(0,0,0,0.05); border:1px solid rgba(0,0,0,0.12); color:#374151; transition:background 0.22s,color 0.22s,border-color 0.22s; }
  .dark .sy-add-dark { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1); color:#9ca3af; }
  .sy-add-dark:hover { background:#10b981 !important; color:#fff !important; border-color:#10b981 !important; }

  .sy-add-green { background:#10b981; border:none; color:#fff; transition:background 0.22s; }
  .sy-add-green:hover { background:#059669 !important; }

  /* ── Wishlist heart ────────────────────────────────────────────── */
  .sy-heart { background:rgba(10,10,10,0.75); backdrop-filter:blur(14px); border:1px solid rgba(255,255,255,0.09); color:#6b7280; transition:color 0.2s,background 0.2s; }
  .sy-heart:hover { color:#f87171 !important; background:rgba(248,113,113,0.12) !important; }

  /* ── Category hover ────────────────────────────────────────────── */
  .sy-cat { cursor:pointer; overflow:hidden; transition:transform 0.3s cubic-bezier(0.22,1,0.36,1); }
  .sy-cat:hover { transform:scale(1.028); }
  .sy-cat:hover img { filter:brightness(0.45) contrast(1.1) !important; }

  /* ── View all link ─────────────────────────────────────────────── */
  .sy-view-all { color:#6b7280; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:5px; white-space:nowrap; transition:color 0.2s; padding-bottom:8px; flex-shrink:0; }
  .sy-view-all:hover { color:#10b981; }

  /* ── Scroll-reveal ─────────────────────────────────────────────── */
  .sy-sr {
    opacity:0; transform:translateY(32px);
    transition: opacity 1.2s cubic-bezier(0.22,1,0.36,1), transform 1.2s cubic-bezier(0.22,1,0.36,1);
    will-change: transform,opacity;
  }
  .sy-sr.visible { opacity:1; transform:translateY(0); }

  .sy-sr-card {
    opacity:0; transform:translateY(28px);
    transition: opacity 1.05s cubic-bezier(0.22,1,0.36,1), transform 1.05s cubic-bezier(0.22,1,0.36,1);
    will-change: transform,opacity;
  }
  .sy-sr-card.visible { opacity:1; transform:translateY(0); }

  /* ── Card hover ────────────────────────────────────────────────── */
  .sy-card {
    transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.25s ease;
  }
  .sy-card:hover { transform:translateY(-6px); box-shadow:0 24px 56px rgba(0,0,0,0.18); border-color:rgba(16,185,129,0.25) !important; }
  .dark .sy-card:hover { box-shadow:0 24px 56px rgba(0,0,0,0.7); }

  /* Mobile responsive */
  @media (max-width: 900px) {
    .sy-hero-img  { display:none !important; }
    .sy-hero-text { width:100% !important; }
    .sy-deals-grid  { grid-template-columns:repeat(2,1fr) !important; }
    .sy-stores-grid { grid-template-columns:1fr !important; }
    .sy-trend-grid  { grid-template-columns:1fr !important; }
    .sy-arrivals-grid { grid-template-columns:1fr !important; }
    .sy-cta-grid    { grid-template-columns:1fr !important; }
  }
  @media (max-width: 600px) {
    .sy-cat-grid    { grid-template-columns:repeat(2,1fr) !important; }
    .sy-deals-grid  { grid-template-columns:1fr !important; }
  }
`;

/* ─────────────────────────────────────────────────────────
   LAYOUT CONSTANTS
   ───────────────────────────────────────────────────────── */
const MAX_W = { maxWidth:1260, margin:"0 auto", padding:"0 clamp(24px,5vw,64px)" } as const;
const SEC_PB = 80;
const TITLE_STYLE: React.CSSProperties = { margin:0, fontSize:"clamp(32px,3.5vw,52px)", fontWeight:800, color:"inherit", letterSpacing:"-0.8px", lineHeight:1.08 };
const SUP_STYLE: React.CSSProperties = { display:"block", fontSize:12, fontWeight:600, color:"#10b981", letterSpacing:"0.05em", marginBottom:10 };

/* ─────────────────────────────────────────────────────────
   BADGE COLOR MAP
   ───────────────────────────────────────────────────────── */
const BADGE_COLORS: Record<string,{bg:string;color:string;border:string}> = {
  "حصري":          { bg:"rgba(109,40,217,0.85)",  color:"#e9d5ff", border:"rgba(139,92,246,0.4)"  },
  "جديد":           { bg:"rgba(30,64,175,0.85)",   color:"#bfdbfe", border:"rgba(59,130,246,0.4)"  },
  "عرض محدود":     { bg:"rgba(31,41,55,0.90)",    color:"#d1d5db", border:"rgba(107,114,128,0.4)" },
  "الأكثر مبيعاً": { bg:"rgba(120,53,15,0.88)",  color:"#fde68a", border:"rgba(217,119,6,0.45)"  },
};

/* ─────────────────────────────────────────────────────────
   STATIC FALLBACK DATA
   ───────────────────────────────────────────────────────── */
const CATS = [
  { nameAr:"إلكترونيات",     slug:"Electronics",            count:"12,450", img:"https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"موضة وملابس",    slug:"Fashion",                count:"8,320",  img:"https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"عطور وجمال",     slug:"Beauty & Personal Care", count:"3,650",  img:"https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"منزل وديكور",    slug:"Home & Kitchen",         count:"6,780",  img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"رياضة وأحذية",   slug:"Sports & Fitness",       count:"5,230",  img:"https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"ساعات فاخرة",    slug:"Accessories",            count:"2,890",  img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"هواتف ذكية",     slug:"Electronics",            count:"4,120",  img:"https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"حواسيب ولابتوب", slug:"Electronics",            count:"3,470",  img:"https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=600" },
] as const;

const STATIC_DEALS = [
  { id:"s1", nameAr:"ساعة كلاسيكية ذهبية",  cat:"ساعات فاخرة",  price:"142,500", orig:"237,000", disc:40, badge:"الأكثر مبيعاً", rating:4.9, rev:284, img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { id:"s2", nameAr:"حذاء نايكي رياضي",      cat:"رياضة وأحذية", price:"58,000",  orig:"82,000",  disc:29, badge:"عرض محدود",     rating:4.7, rev:512, img:"https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { id:"s3", nameAr:"مجموعة تقنية متكاملة",  cat:"إلكترونيات",   price:"385,000", orig:"550,000", disc:30, badge:"جديد",           rating:4.8, rev:196, img:"https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { id:"s4", nameAr:"عطر أوبسيديان إلكسير",  cat:"عطور وجمال",   price:"96,000",  orig:"148,000", disc:35, badge:"حصري",           rating:4.6, rev:89,  img:"https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=500" },
];

const STATIC_STORES = [
  { name:"تك ستور سوريا", desc:"أحدث الإلكترونيات والأجهزة الذكية",  cat:"إلكترونيات",  cnt:"3,240", letter:"ت", bg:"#0f4c81", rating:4.9, rev:1840, img:"https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600",    slug:"/products", isVerified:true },
  { name:"دار الأناقة",   desc:"أزياء فاخرة وموضة معاصرة للجميع",    cat:"موضة وملابس", cnt:"1,890", letter:"د", bg:"#6d28d9", rating:4.8, rev:2210, img:"https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=600", slug:"/products", isVerified:true },
  { name:"بيت الديكور",   desc:"أثاث عصري وإكسسوارات منزلية راقية",  cat:"منزل وديكور", cnt:"2,140", letter:"ب", bg:"#7c3aed", rating:4.7, rev:956,  img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600",  slug:"/products", isVerified:true },
];

const STATIC_TRENDING = [
  { id:"t1", nameAr:"ساعة كرونوغراف سيلفر", cat:"ساعات الفخامة", seller:"دار الأناقة",   rating:4.9, rev:341, price:"198,000", img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600",  hot:true,  href:"/products" },
  { id:"t2", nameAr:"هاتف بريميوم Pro Max",  cat:"هواتف ذكية",   seller:"تك ستور سوريا", rating:4.8, rev:892, price:"850,000", img:"https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&w=600", hot:true,  href:"/products" },
  { id:"t3", nameAr:"لاب توب بلاك إيشن",    cat:"حواسيب",       seller:"تك ستور سوريا", rating:4.7, rev:213, price:"720,000", img:"https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=600",  hot:false, href:"/products" },
];

/* ─────────────────────────────────────────────────────────
   FEATURED STORE TYPE
   ───────────────────────────────────────────────────────── */
interface FeaturedStore {
  sellerId: number;
  storeName: string;
  storeSlug: string | null;
  storeLogo: string | null;
  storeBanner: string | null;
  accentColor: string | null;
  categories: string[];
  city: string | null;
  isVerified: boolean;
  productsCount: number;
  followersCount: number;
  averageRating: number;
  reviewsCount: number;
}

/* ─────────────────────────────────────────────────────────
   HELPERS / ATOMS
   ───────────────────────────────────────────────────────── */
function Stars({ n, size = 13 }: { n: number; size?: number }) {
  const starPath = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
  return (
    <span style={{ display:"inline-flex", gap:1.5, flexShrink:0 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} style={{ width:size, height:size, color:i<=n?"#f59e0b":"#2a2a2a" }} fill="currentColor" viewBox="0 0 20 20">
          <path d={starPath} />
        </svg>
      ))}
    </span>
  );
}

function CompactRating({ rating, rev }: { rating: number; rev: number }) {
  const starPath = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
      <span style={{ fontSize:10, color:"#6b7280" }}>({rev})</span>
      <span style={{ fontSize:11, fontWeight:700, color:"#e5e7eb" }}>{rating}</span>
      <svg style={{ width:11, height:11, color:"#f59e0b" }} fill="currentColor" viewBox="0 0 20 20"><path d={starPath} /></svg>
    </div>
  );
}

function VerifyCheckSVG() {
  return <svg style={{ width:9, height:9 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
}
function BoxIconSVG() {
  return <svg style={{ width:11, height:11, color:"#6b7280", flexShrink:0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
}
function ExternalLinkSVG() {
  return <svg style={{ width:12, height:12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
}
function StoreIconSVG() {
  return <svg style={{ width:22, height:22, color:"#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 2L3 7l10 5 10-5-10-5zM3 17l10 5 10-5M3 12l10 5 10-5" /></svg>;
}
function BikeIconSVG() {
  return <svg style={{ width:22, height:22, color:"#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4c-1.5 0-2.5 1-3 2l-4 8h2l1-2h8l1 2h2l-4-8c-.5-1-1.5-2-3-2zm0 2l2 4h-4l2-4zM6 14a3 3 0 100 6 3 3 0 000-6zm12 0a3 3 0 100 6 3 3 0 000-6z" /></svg>;
}

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL HOOKS
   ───────────────────────────────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

function useStagger(count: number, stagger = 110) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    children.forEach((ch, i) => {
      ch.classList.add("sy-sr-card");
      ch.style.transitionDelay = `${i * stagger}ms`;
    });
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { children.forEach(ch => ch.classList.add("visible")); obs.disconnect(); }
    }, { threshold:0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [count, stagger]);
  return ref;
}

/* ─────────────────────────────────────────────────────────
   SECTION HEADER
   ───────────────────────────────────────────────────────── */
function SectionHeader({ sup, title, href }: { sup: string; title: string; href: string }) {
  const ref = useReveal(0.2);
  return (
    <div ref={ref} className="sy-sr" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:36 }}>
      <div style={{ textAlign:"right" }}>
        <span style={SUP_STYLE}>{sup}</span>
        <h2 style={TITLE_STYLE}>{title}</h2>
      </div>
      <Link href={href} className="sy-view-all">← عرض الكل</Link>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 2 — CATEGORIES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function CategoriesSection() {
  const catGrid = useStagger(8, 60);
  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB, paddingTop:SEC_PB }}>
      <div style={MAX_W}>
        <SectionHeader sup="تصفح حسب الفئة" title="الفئات الأكثر شيوعاً" href="/products" />
        <div ref={catGrid} className="sy-cat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {CATS.map(c => (
            <Link key={c.nameAr} href={`/products?category=${encodeURIComponent(c.slug)}`} style={{ textDecoration:"none" }}>
              <div className="sy-cat" style={{ position:"relative", height:168, borderRadius:12, overflow:"hidden" }}>
                <img src={c.img} alt={c.nameAr} loading="lazy" decoding="async" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(0.34) contrast(1.1)", display:"block", transition:"filter 0.3s" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.08) 55%,transparent 100%)" }} />
                <div style={{ position:"absolute", bottom:0, right:0, padding:"0 14px 13px", textAlign:"right" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:2 }}>{c.nameAr}</div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{c.count} منتج</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 3 — FEATURED DEALS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
type DealCardData = {
  id: string | number;
  nameAr: string;
  cat: string;
  price: string;
  orig: string;
  disc: number;
  badge: string;
  rating: number;
  rev: number;
  img: string;
  href: string;
};

function apiProductToDeal(p: import("@workspace/api-client-react").Product): DealCardData {
  const pr = p.price;
  const or = (p as any).compareAtPrice ?? pr;
  const discFromCompare = or > pr ? Math.round((1 - pr / or) * 100) : 0;
  const disc = discFromCompare > 0 ? discFromCompare : ((p as any).discountPercent ?? 0);
  const img = (p as any).imageUrls?.[0] ?? "";
  const badge = p.isBestDeal ? "الأكثر مبيعاً" : disc >= 30 ? "حصري" : "عرض محدود";
  return {
    id: p.id,
    nameAr: (p as any).nameAr ?? p.name,
    cat: p.category ?? "منتجات",
    price: pr.toLocaleString(),
    orig: or.toLocaleString(),
    disc,
    badge,
    rating: Math.round(((p as any).averageRating ?? 4.5) * 10) / 10,
    rev: (p as any).reviewsCount ?? 0,
    img,
    href: `/products/${p.id}`,
  };
}

function DealCardItem({ d }: { d: DealCardData }) {
  const bc = BADGE_COLORS[d.badge] ?? BADGE_COLORS["عرض محدود"];
  return (
    <Link href={d.href} style={{ textDecoration:"none", display:"flex", flexDirection:"column", height:"100%" }}>
      <div className="sy-card sy-card-bg" style={{ borderRadius:16, overflow:"hidden", border:"1px solid", display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ position:"relative", height:260, flexShrink:0 }}>
          {d.img
            ? <img src={d.img} alt={d.nameAr} loading="lazy" decoding="async" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            : <div style={{ width:"100%", height:"100%", background:"#161616", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>🛍</div>
          }
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(11,11,11,0.55) 0%,transparent 52%)" }} />
          {d.disc > 0 && <span style={{ position:"absolute", top:12, left:12, background:"#10b981", color:"#fff", fontSize:11, fontWeight:800, padding:"3px 10px", borderRadius:100 }}>-{d.disc}%</span>}
          <span style={{ position:"absolute", top:12, right:12, background:bc.bg, color:bc.color, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:5, border:`1px solid ${bc.border}`, backdropFilter:"blur(8px)" }}>{d.badge}</span>
          <button className="sy-heart" style={{ position:"absolute", bottom:12, left:12, width:30, height:30, borderRadius:"50%", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={e => e.preventDefault()}>♡</button>
        </div>
        <div style={{ padding:"13px 16px 16px", flex:1, display:"flex", flexDirection:"column" }}>
          <div className="sy-card-muted" style={{ fontSize:10, textAlign:"right", marginBottom:4, fontWeight:500, letterSpacing:"0.03em" }}>{d.cat}</div>
          <div className="sy-card-name" style={{ fontSize:17, fontWeight:800, textAlign:"right", lineHeight:1.35, marginBottom:9, flex:1 }}>{d.nameAr}</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", marginBottom:13 }}>
            <CompactRating rating={d.rating} rev={d.rev} />
          </div>
          {/* Bottom row: Price (visual RIGHT) · أضف (visual LEFT) in RTL */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:18, fontWeight:900, color:"#10b981", lineHeight:1 }}>{d.price} <span style={{ fontSize:10, color:"#6b7280", fontWeight:400 }}>ل.س</span></div>
              {d.disc > 0 && <div style={{ fontSize:10, color:"#6b7280", textDecoration:"line-through", marginTop:2 }}>{d.orig} ل.س</div>}
            </div>
            <button className="sy-add-dark" style={{ borderRadius:8, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }} onClick={e => e.preventDefault()}>أضف</button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DealsSection({ hotDeals, isLoading, flashFormatted }: {
  hotDeals: import("@workspace/api-client-react").Product[];
  isLoading: boolean;
  flashFormatted: string;
}) {
  const revealHeader = useReveal();
  const dealsGrid = useStagger(4, 100);

  const dealCards: DealCardData[] = hotDeals.length >= 4
    ? hotDeals.slice(0, 4).map(apiProductToDeal)
    : [
        ...hotDeals.map(apiProductToDeal),
        ...STATIC_DEALS.slice(hotDeals.length, 4).map(d => ({ ...d, href:"/products" })),
      ];

  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:800, height:400, background:"radial-gradient(ellipse,rgba(16,185,129,0.028) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={MAX_W}>
        {/* Custom header (link + timer stacked on left) */}
        <div ref={revealHeader} className="sy-sr" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:36 }}>
          <div style={{ textAlign:"right" }}>
            <span style={SUP_STYLE}>عروض حصرية</span>
            <h2 style={TITLE_STYLE}>عروض مميزة</h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-start", paddingBottom:8 }}>
            <Link href="/products?hasDiscount=true" className="sy-view-all" style={{ paddingBottom:0 }}>← كل العروض</Link>
            {/* Real flash-sale countdown */}
            <div style={{ display:"flex", alignItems:"center", gap:6, color:"#9ca3af" }}>
              <svg style={{ width:12, height:12, color:"#10b981", flexShrink:0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span style={{ whiteSpace:"nowrap", fontSize:11 }}>تنتهي خلال</span>
              <div dir="ltr" style={{ display:"flex", alignItems:"center", gap:2 }}>
                {flashFormatted.split(":").map((v, i) => (
                  <span key={i} style={{ display:"flex", alignItems:"center", gap:2 }}>
                    <span style={{ background:"#161616", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontFamily:"monospace", fontWeight:700, fontSize:11, padding:"2px 6px", borderRadius:4, letterSpacing:1 }}>{v}</span>
                    {i < 2 && <span style={{ color:"#10b981", fontWeight:900, fontSize:12 }}>:</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div ref={dealsGrid} className="sy-deals-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          {isLoading
            ? STATIC_DEALS.map(d => (
                <div key={d.id} style={{ background:"#0b0b0b", borderRadius:16, border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
                  <div style={{ height:260, background:"#111" }} />
                  <div style={{ padding:"13px 16px" }}>
                    <div style={{ height:8, background:"#161616", borderRadius:4, width:"40%", marginBottom:10 }} />
                    <div style={{ height:14, background:"#161616", borderRadius:4, width:"85%", marginBottom:8 }} />
                    <div style={{ height:8, background:"#161616", borderRadius:4, width:"55%" }} />
                  </div>
                </div>
              ))
            : dealCards.map((d, i) => <DealCardItem key={String(d.id ?? i)} d={d} />)
          }
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 4 — TRUSTED STORES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
type StoreCardData = {
  name: string; desc: string; cat: string; cnt: string;
  letter: string; bg: string; rating: number; rev: number;
  img: string; slug: string; isVerified: boolean;
};

function PremiumStoreCard({ s }: { s: StoreCardData }) {
  return (
    <Link href={s.slug} style={{ textDecoration:"none" }}>
      <div className="sy-card sy-card-bg" style={{ borderRadius:16, overflow:"hidden", border:"1px solid" }}>
        {/* Banner */}
        <div style={{ position:"relative", height:152 }}>
          {s.img
            ? <img src={s.img} alt="" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(0.22)", display:"block" }} />
            : <div style={{ width:"100%", height:"100%", background:s.bg, opacity:0.3 }} />
          }
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#0b0b0b 0%,transparent 48%)" }} />
          {s.isVerified && (
            <span style={{ position:"absolute", top:12, right:12, display:"flex", alignItems:"center", gap:3, background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.32)", color:"#10b981", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:100, backdropFilter:"blur(8px)" }}>
              <VerifyCheckSVG />موثوق
            </span>
          )}
          {/* Avatar — bottom RIGHT, 52×52 rounded-square */}
          <div style={{ position:"absolute", bottom:-26, right:16, width:52, height:52, borderRadius:13, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:21, fontWeight:900, color:"#fff", border:"2px solid #0b0b0b", boxShadow:"0 4px 18px rgba(0,0,0,0.6)", flexShrink:0, zIndex:2 }}>
            {s.letter}
          </div>
        </div>
        {/* Body */}
        <div style={{ padding:"34px 18px 18px", textAlign:"right" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-start", marginBottom:8 }}>
            <CompactRating rating={s.rating} rev={s.rev} />
          </div>
          <div className="sy-card-name" style={{ fontSize:17, fontWeight:700, marginBottom:6 }}>{s.name}</div>
          <p className="sy-card-muted" style={{ margin:"0 0 14px", fontSize:12, lineHeight:1.65 }}>{s.desc}</p>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:5, marginBottom:18, paddingTop:12, borderTop:"1px solid rgba(128,128,128,0.15)" }}>
            <span style={{ fontSize:12, color:"#9ca3af" }}>{s.cat} · {s.cnt} منتج</span>
            <BoxIconSVG />
          </div>
          <button className="sy-store-cta" style={{ width:"100%", padding:"10px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
            <ExternalLinkSVG />زيارة المتجر
          </button>
        </div>
      </div>
    </Link>
  );
}

function StoresSection() {
  const storesGrid = useStagger(3, 115);
  const [featuredStores, setFeaturedStores] = React.useState<FeaturedStore[]>([]);
  const [loadingStores, setLoadingStores] = React.useState(true);

  React.useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/sellers/featured`)
      .then(r => r.ok ? r.json() : [])
      .then((d: FeaturedStore[]) => setFeaturedStores(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => {})
      .finally(() => setLoadingStores(false));
  }, []);

  const displayStores: StoreCardData[] = featuredStores.length > 0
    ? featuredStores.map(s => ({
        name: s.storeName,
        desc: (s.categories ?? []).slice(0, 2).join(" · ") || "متجر متنوع",
        cat: (s.categories ?? [])[0] || "متنوع",
        cnt: (s.productsCount ?? 0).toLocaleString(),
        letter: s.storeName.charAt(0),
        bg: s.accentColor ?? "#059669",
        rating: Math.round((s.averageRating || 4.5) * 10) / 10,
        rev: s.reviewsCount,
        img: s.storeBanner ?? s.storeLogo ?? "",
        slug: s.storeSlug ? `/store/${s.storeSlug}` : "/products",
        isVerified: s.isVerified,
      }))
    : STATIC_STORES;

  if (loadingStores) {
    return (
      <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
        <div style={MAX_W}>
          <SectionHeader sup="شركاؤنا التجاريون" title="متاجر موثوقة" href="/products" />
          <div className="sy-stores-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {STATIC_STORES.map(s => (
              <div key={s.name} style={{ background:"#0b0b0b", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden" }}>
                <div style={{ height:152, background:"#111" }} />
                <div style={{ padding:"34px 18px 18px" }}>
                  <div style={{ height:8, background:"#161616", borderRadius:4, width:"40%", marginBottom:10 }} />
                  <div style={{ height:14, background:"#161616", borderRadius:4, width:"70%", marginBottom:8 }} />
                  <div style={{ height:10, background:"#161616", borderRadius:4, width:"90%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={MAX_W}>
        <SectionHeader sup="شركاؤنا التجاريون" title="متاجر موثوقة" href="/products" />
        <div ref={storesGrid} className="sy-stores-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {displayStores.map((s, i) => <PremiumStoreCard key={s.name + i} s={s} />)}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 5 — TRENDING PRODUCTS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
type TrendCardData = {
  id: string | number;
  nameAr: string; cat: string; seller: string;
  rating: number; rev: number; price: string;
  img: string; hot: boolean; href: string;
};

function apiProductToTrend(p: import("@workspace/api-client-react").Product, idx: number): TrendCardData {
  return {
    id: p.id,
    nameAr: (p as any).nameAr ?? p.name,
    cat: p.category ?? "منتجات",
    seller: (p as any).storeName ?? "متجر سيانو",
    rating: Math.round(((p as any).averageRating ?? 4.5) * 10) / 10,
    rev: (p as any).reviewsCount ?? 0,
    price: p.price.toLocaleString(),
    img: (p as any).imageUrls?.[0] ?? "",
    hot: idx < 2,
    href: `/products/${p.id}`,
  };
}

function TrendingSection({ products }: { products: import("@workspace/api-client-react").Product[] }) {
  const trendGrid = useStagger(3, 115);

  const cards: TrendCardData[] = products.length >= 3
    ? products.slice(0, 3).map(apiProductToTrend)
    : [...products.map(apiProductToTrend), ...STATIC_TRENDING.slice(products.length, 3)];

  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={MAX_W}>
        <SectionHeader sup="الأعلى تقييماً هذا الأسبوع" title="المنتجات الرائجة" href="/products" />
        <div ref={trendGrid} className="sy-trend-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {cards.map((p, i) => (
            <Link key={String(p.id ?? i)} href={p.href} style={{ textDecoration:"none" }}>
              <div className="sy-card sy-card-bg" style={{ borderRadius:16, overflow:"hidden", border:"1px solid" }}>
                <div style={{ position:"relative", height:310 }}>
                  {p.img
                    ? <img src={p.img} alt={p.nameAr} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", filter:"brightness(0.62)" }} />
                    : <div style={{ width:"100%", height:"100%", background:"#161616" }} />
                  }
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(11,11,11,0.97) 0%,rgba(11,11,11,0.1) 48%,transparent 70%)" }} />
                  {p.hot && <span style={{ position:"absolute", top:12, left:12, background:"#10b981", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 11px", borderRadius:100 }}>↑ رائج</span>}
                  <button className="sy-heart" style={{ position:"absolute", top:12, right:12, width:30, height:30, borderRadius:"50%", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={e => e.preventDefault()}>♡</button>
                  <div style={{ position:"absolute", bottom:0, right:0, left:0, padding:"0 16px 14px", textAlign:"right" }}>
                    <div style={{ fontSize:10, color:"#9ca3af", marginBottom:4 }}>{p.cat} · {p.seller}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:10, lineHeight:1.3 }}>{p.nameAr}</div>
                    {/* Stars (visual RIGHT) · Price (visual LEFT) in RTL */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <Stars n={Math.floor(p.rating)} size={13} />
                        <span style={{ fontSize:10, color:"#9ca3af" }}>({p.rev})</span>
                      </div>
                      <span style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{p.price} <span style={{ fontSize:10, color:"#9ca3af", fontWeight:400 }}>ل.س</span></span>
                    </div>
                  </div>
                </div>
                {/* GREEN "أضف للسلة" — ref 243 */}
                <div style={{ padding:"10px 14px 14px" }}>
                  <button className="sy-add-green" style={{ width:"100%", fontSize:12, fontWeight:700, padding:"10px", borderRadius:8, cursor:"pointer" }} onClick={e => e.preventDefault()}>أضف للسلة</button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 6 — NEW ARRIVALS (asymmetric)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const STATIC_SMALL_ARRIVALS = [
  { nameAr:"عطر الأوبسيديان الليلي", cat:"عطور",        price:"89,500", img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=300", href:"/products" },
  { nameAr:"ديكور منزلي مودرن",      cat:"منزل وديكور", price:"56,000", img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=300", href:"/products" },
];

type SmallArrivalCard = { nameAr: string; cat: string; price: string; img: string; href: string; };

function NewArrivalsSection({ newArrivals }: { newArrivals: import("@workspace/api-client-react").Product[] }) {
  const revealLarge = useReveal();
  const revealSmall = useReveal();

  const large = newArrivals[0];
  const largeHref = large ? `/products/${large.id}` : "/products";
  const largeImg = large
    ? ((large as any).imageUrls?.[0] ?? "https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=900")
    : "https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=900";
  const largeName  = large ? ((large as any).nameAr ?? large.name) : "مجموعة تقنية بريميوم 2025";
  const largeCat   = large?.category ?? "إلكترونيات";
  const largePrice = large ? large.price.toLocaleString() : "435,000";
  const largeRev   = (large as any)?.reviewsCount ?? 12;
  const largeRating = ((large as any)?.averageRating ?? 4.8).toFixed(1);

  const smalls: SmallArrivalCard[] = newArrivals.slice(1, 3).length >= 2
    ? newArrivals.slice(1, 3).map(p => ({
        nameAr: (p as any).nameAr ?? p.name,
        cat: p.category ?? "منتجات",
        price: p.price.toLocaleString(),
        img: (p as any).imageUrls?.[0] ?? "",
        href: `/products/${p.id}`,
      }))
    : STATIC_SMALL_ARRIVALS;

  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={MAX_W}>
        <SectionHeader sup="أضيف لنا" title="وصل حديثاً" href="/products" />
        <div className="sy-arrivals-grid" style={{ display:"grid", gridTemplateColumns:"1fr 356px", gap:14 }}>
          {/* Large card — first DOM = visual RIGHT in RTL */}
          <Link href={largeHref} style={{ textDecoration:"none" }}>
            <div ref={revealLarge} className="sy-sr" style={{ position:"relative", borderRadius:18, overflow:"hidden", minHeight:386 }}>
              <img src={largeImg} alt="" loading="lazy" style={{ width:"100%", height:"100%", minHeight:386, objectFit:"cover", filter:"brightness(0.26) contrast(1.12)", display:"block" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.97) 0%,rgba(0,0,0,0.02) 55%)" }} />
              <div style={{ position:"absolute", top:20, right:20 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, color:"#10b981", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.28)", padding:"4px 13px", borderRadius:100, fontWeight:600 }}>↑ جديد</span>
              </div>
              <div style={{ position:"absolute", bottom:0, right:0, left:0, padding:"0 28px 28px", textAlign:"right" }}>
                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:7 }}>{largeCat}</div>
                <div style={{ fontSize:26, fontWeight:800, color:"#fff", marginBottom:11, lineHeight:1.2 }}>{largeName}</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:6, marginBottom:10 }}>
                  <span style={{ fontSize:11, color:"#9ca3af" }}>({largeRev} تقييم)</span>
                  <span style={{ fontSize:12, fontWeight:600, color:"#fff" }}>{largeRating}</span>
                  <Stars n={5} size={12} />
                </div>
                <div style={{ fontSize:26, fontWeight:900, color:"#10b981" }}>{largePrice} <span style={{ fontSize:13, fontWeight:400, color:"#9ca3af" }}>ل.س</span></div>
              </div>
            </div>
          </Link>

          {/* Small cards stack — second DOM = visual LEFT in RTL */}
          <div ref={revealSmall} className="sy-sr" style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {smalls.map((a, i) => (
              <Link key={i} href={a.href} style={{ textDecoration:"none" }}>
                <div className="sy-card sy-card-bg" style={{ borderRadius:16, overflow:"hidden", border:"1px solid", display:"flex", height:182, transition:"border-color 0.25s" }}>
                  {/* Text — first DOM = visual RIGHT in RTL */}
                  <div style={{ flex:1, padding:"16px 18px", textAlign:"right", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                    <div>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, color:"#10b981", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.18)", padding:"2px 8px", borderRadius:100, marginBottom:7, fontWeight:600 }}>● جديد</span>
                      <div className="sy-card-muted" style={{ fontSize:10, marginBottom:4 }}>{a.cat}</div>
                      <div className="sy-card-name" style={{ fontSize:15, fontWeight:700, lineHeight:1.35 }}>{a.nameAr}</div>
                    </div>
                    <div style={{ fontSize:19, fontWeight:800, color:"#10b981" }}>{a.price} <span style={{ fontSize:11, fontWeight:400, color:"#9ca3af" }}>ل.س</span></div>
                  </div>
                  {/* Image — second DOM = visual LEFT in RTL */}
                  <div style={{ width:140, flexShrink:0 }}>
                    {a.img
                      ? <img src={a.img} alt="" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", filter:"brightness(0.7)" }} />
                      : <div style={{ width:"100%", height:"100%", background:"#161616" }} />
                    }
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 7 — JOIN CTA
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function JoinCTASection() {
  const revealCard = useReveal();
  const { handleOpenYourStore } = useSellerOnboarding();
  const { handleBecomeCourier } = useCourierOnboarding();

  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={MAX_W}>
        <div ref={revealCard} className="sy-sr">
          <div className="sy-cta-section" style={{ borderRadius:24, border:"1px solid", padding:"clamp(40px,5vw,72px) clamp(28px,5vw,64px)", textAlign:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-50, left:"50%", transform:"translateX(-50%)", width:600, height:300, background:"radial-gradient(ellipse,rgba(16,185,129,0.055) 0%,transparent 70%)", pointerEvents:"none" }} />
            <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 16px", borderRadius:100, border:"1px solid rgba(16,185,129,0.3)", color:"#10b981", fontSize:11, fontWeight:600, marginBottom:22, background:"rgba(16,185,129,0.06)" }}>انضم إلى سيانو</span>
            <h2 style={{ ...TITLE_STYLE, marginBottom:14, display:"block" }}>كن جزءاً من السوق السوري</h2>
            <p style={{ margin:"0 0 48px", color:"#9ca3af", fontSize:14, lineHeight:1.75 }}>سواء كنت بائعاً أو مندوب توصيل، هناك مكان لك في سيانو.</p>
            <div className="sy-cta-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, maxWidth:720, margin:"0 auto" }}>
              {/* Seller */}
              <button onClick={handleOpenYourStore} className="sy-cta-btn">
                <div style={{ width:54, height:54, borderRadius:"50%", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}><StoreIconSVG /></div>
                <div className="sy-card-name" style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>ابدأ البيع على سيانو</div>
                <p className="sy-card-muted" style={{ fontSize:13, lineHeight:1.75, marginBottom:24 }}>افتح متجرك الإلكتروني وتواصل مع آلاف المشترين في جميع أنحاء سوريا</p>
                <span style={{ color:"#10b981", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:4, justifyContent:"center" }}>إنشاء متجري ←</span>
              </button>
              {/* Courier */}
              <button onClick={handleBecomeCourier} className="sy-cta-btn">
                <div style={{ width:54, height:54, borderRadius:"50%", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}><BikeIconSVG /></div>
                <div className="sy-card-name" style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>انضم كمندوب توصيل</div>
                <p className="sy-card-muted" style={{ fontSize:13, lineHeight:1.75, marginBottom:24 }}>حقق دخلاً إضافياً من خلال توصيل الطلبات في مدينتك بمرونة كاملة في عملك</p>
                <span style={{ color:"#10b981", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:4, justifyContent:"center" }}>التسجيل كمندوب ←</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 8 — RECENTLY VIEWED (dark styled)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function RecentlyViewedDark({ items, onClear }: {
  items: import("@/hooks/useRecentlyViewed").RecentlyViewedProduct[];
  onClear: () => void;
}) {
  const ref = useReveal();
  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={MAX_W}>
        <div ref={ref} className="sy-sr" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:28 }}>
          <div style={{ textAlign:"right" }}>
            <span style={SUP_STYLE}>تصفحتها مؤخراً</span>
            <h2 style={{ ...TITLE_STYLE, fontSize:"clamp(24px,2.5vw,36px)" }}>شاهدتها مؤخراً</h2>
          </div>
          <button onClick={onClear} style={{ color:"#6b7280", fontSize:13, background:"none", border:"1px solid rgba(255,255,255,0.08)", padding:"6px 14px", borderRadius:8, cursor:"pointer" }}>مسح السجل</button>
        </div>
        <div className="product-grid">
          {items.map(p => <ProductCard key={p.id} product={p as any} />)}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN PAGE EXPORT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function Home() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const { data: products, isLoading: isLoadingProducts } = useListProducts(
    {},
    {
      query: {
        staleTime: 3 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: getListProductsQueryKey({}),
      },
    },
  );

  useSEO({
    title: lang === "ar"
      ? "سيانو — أول سوق إلكتروني في سوريا"
      : "Syano — Syria's First Online Marketplace",
    description: lang === "ar"
      ? "تسوّق من بائعين موثوقين عبر حلب وسوريا. إلكترونيات، أزياء، أدوات منزلية، توصيل سريع، دفع آمن."
      : "Shop electronics, fashion, beauty, home goods and more from vetted Syrian sellers.",
    canonical: "/",
  });

  const { data: publicSettings } = useGetPublicSettings({
    query: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      queryKey: getGetPublicSettingsQueryKey(),
    },
  });

  const getFlashSaleTarget = useCallback(() => {
    if (publicSettings?.flashSaleEnd) return new Date(publicSettings.flashSaleEnd);
    const ms = 24 * 60 * 60 * 1000;
    return new Date(Math.ceil(Date.now() / ms) * ms);
  }, [publicSettings?.flashSaleEnd]);

  const { formatted: flashFormatted } = useCountdown(getFlashSaleTarget);

  const hotDeals   = products?.filter(p => p.isBestDeal).slice(0, 4) ?? [];
  const newArrivals = products?.slice(0, 8) ?? [];
  const trending    = products?.slice(0, 3) ?? [];

  const { recentlyViewed, clearHistory } = useRecentlyViewed();

  return (
    <Layout>
      <style>{PAGE_CSS}</style>
      {/* Dark premium homepage wrapper */}
      <div dir="rtl" className="sy-page" style={{ fontFamily:"'Cairo','Segoe UI',system-ui,sans-serif", minHeight:"100vh" }}>
        <HeroV4 />
        <CategoriesSection />
        <DealsSection hotDeals={hotDeals} isLoading={isLoadingProducts} flashFormatted={flashFormatted} />
        <StoresSection />
        <TrendingSection products={trending} />
        <NewArrivalsSection newArrivals={newArrivals} />
        <JoinCTASection />
        {recentlyViewed.length > 0 && (
          <RecentlyViewedDark items={recentlyViewed} onClear={clearHistory} />
        )}
      </div>
    </Layout>
  );
}
