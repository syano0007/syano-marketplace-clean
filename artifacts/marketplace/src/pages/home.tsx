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
  .sy-page {
    background: #f8fafc;
    color: #111827;
    background-image:
      linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px);
    background-size: 44px 44px;
  }
  .dark .sy-page {
    background: #080808;
    color: #fff;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 44px 44px;
  }

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


  /* ── Category hover ────────────────────────────────────────────── */
  .sy-cat { cursor:pointer; overflow:hidden; transition:transform 0.3s cubic-bezier(0.22,1,0.36,1); }
  .sy-cat:hover { transform:scale(1.028); }
  .sy-cat img { filter:brightness(0.58) contrast(1.08); transition:filter 0.3s; }
  .dark .sy-cat img { filter:brightness(0.34) contrast(1.1); }
  .sy-cat:hover img { filter:brightness(0.50) contrast(1.08) !important; }
  .sy-cat-overlay { background:linear-gradient(to top,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.02) 55%,transparent 100%); }
  .dark .sy-cat-overlay { background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.08) 55%,transparent 100%); }

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
    .sy-stores-grid { grid-template-columns:1fr !important; }
    .sy-arrivals-grid { grid-template-columns:1fr !important; }
    .sy-cta-grid    { grid-template-columns:1fr !important; }
  }
  @media (max-width: 600px) {
    .sy-cat-grid    { grid-template-columns:repeat(2,1fr) !important; }
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
   STATIC FALLBACK DATA
   ───────────────────────────────────────────────────────── */
const CATS = [
  { nameAr:"إلكترونيات",     nameEn:"Electronics",     slug:"Electronics",            count:"12,450", img:"https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"موضة وملابس",    nameEn:"Fashion",          slug:"Fashion",                count:"8,320",  img:"https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"عطور وجمال",     nameEn:"Beauty & Care",    slug:"Beauty & Personal Care", count:"3,650",  img:"https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"منزل وديكور",    nameEn:"Home & Decor",     slug:"Home & Kitchen",         count:"6,780",  img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"رياضة وأحذية",   nameEn:"Sports",           slug:"Sports & Fitness",       count:"5,230",  img:"https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"ساعات فاخرة",    nameEn:"Accessories",      slug:"Accessories",            count:"2,890",  img:"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"هواتف ذكية",     nameEn:"Smartphones",      slug:"Electronics",            count:"4,120",  img:"https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { nameAr:"حواسيب ولابتوب", nameEn:"Computers",        slug:"Electronics",            count:"3,470",  img:"https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=600" },
] as const;


const STATIC_STORES = [
  { name:"تك ستور سوريا", desc:"أحدث الإلكترونيات والأجهزة الذكية",  cat:"إلكترونيات",  cnt:"3,240", letter:"ت", bg:"#0f4c81", rating:4.9, rev:1840, img:"https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600",    slug:"/products", isVerified:true },
  { name:"دار الأناقة",   desc:"أزياء فاخرة وموضة معاصرة للجميع",    cat:"موضة وملابس", cnt:"1,890", letter:"د", bg:"#6d28d9", rating:4.8, rev:2210, img:"https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=600", slug:"/products", isVerified:true },
  { name:"بيت الديكور",   desc:"أثاث عصري وإكسسوارات منزلية راقية",  cat:"منزل وديكور", cnt:"2,140", letter:"ب", bg:"#7c3aed", rating:4.7, rev:956,  img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600",  slug:"/products", isVerified:true },
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
        <svg key={i} style={{ width:size, height:size, color:i<=n?"#f59e0b":"rgba(128,128,128,0.22)" }} fill="currentColor" viewBox="0 0 20 20">
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const arrow = isRTL ? "←" : "→";
  return (
    <div ref={ref} className="sy-sr" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:36 }}>
      <div style={{ textAlign: isRTL ? "right" : "left" }}>
        <span style={SUP_STYLE}>{sup}</span>
        <h2 style={TITLE_STYLE}>{title}</h2>
      </div>
      <Link href={href} className="sy-view-all">{arrow} {t("home.view_all")}</Link>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 2 — CATEGORIES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function CategoriesSection({ products }: { products?: import("@workspace/api-client-react").Product[] }) {
  const catGrid = useStagger(8, 60);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const catDataMap = React.useMemo(() => {
    const map: Record<string, { count: number; img: string | null }> = {};
    (products ?? []).forEach(p => {
      const slug = p.category ?? "";
      if (!map[slug]) map[slug] = { count: 0, img: null };
      map[slug].count += 1;
      if (!map[slug].img) {
        const imgs = (p as any).imageUrls as string[] | undefined;
        map[slug].img = imgs?.[0] ?? null;
      }
    });
    return map;
  }, [products]);

  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB, paddingTop:SEC_PB }}>
      <div style={MAX_W}>
        <SectionHeader
          sup={t("home.categories_sup")}
          title={t("home.popular_categories_title")}
          href="/products"
        />
        <div ref={catGrid} className="sy-cat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {CATS.map(c => {
            const real = catDataMap[c.slug];
            const imgSrc = real?.img ?? c.img;
            const count = real && real.count > 0 ? real.count.toLocaleString() : c.count;
            const label = isRTL ? c.nameAr : c.nameEn;
            return (
              <Link key={c.nameAr} href={`/products?category=${encodeURIComponent(c.slug)}`} style={{ textDecoration:"none" }}>
                <div className="sy-cat" style={{ position:"relative", height:168, borderRadius:12, overflow:"hidden" }}>
                  <img src={imgSrc} alt={label} loading="lazy" decoding="async"
                    style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                  <div className="sy-cat-overlay" style={{ position:"absolute", inset:0 }} />
                  <div style={{ position:"absolute", bottom:0, right:0, left:0, padding:"0 14px 13px", textAlign: isRTL ? "right" : "left" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:11, color:"#9ca3af" }}>{count} {t("home.product_unit")}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 3 — FEATURED DEALS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function DealsSection({ hotDeals, isLoading, flashFormatted }: {
  hotDeals: import("@workspace/api-client-react").Product[];
  isLoading: boolean;
  flashFormatted: string;
}) {
  const revealHeader = useReveal();
  const dealsGrid = useStagger(4, 100);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const arrow = isRTL ? "←" : "→";

  if (!isLoading && hotDeals.length === 0) return null;

  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:800, height:400, background:"radial-gradient(ellipse,rgba(16,185,129,0.028) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={MAX_W}>
        <div ref={revealHeader} className="sy-sr" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:36 }}>
          <div style={{ textAlign: isRTL ? "right" : "left" }}>
            <span style={SUP_STYLE}>{t("home.deals_sup")}</span>
            <h2 style={TITLE_STYLE}>{t("home.deals_title")}</h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems: isRTL ? "flex-start" : "flex-end", paddingBottom:8 }}>
            <Link href="/products?hasDiscount=true" className="sy-view-all" style={{ paddingBottom:0 }}>{arrow} {t("home.view_all_deals")}</Link>
            <div style={{ display:"flex", alignItems:"center", gap:6, color:"#9ca3af" }}>
              <svg style={{ width:12, height:12, color:"#10b981", flexShrink:0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span style={{ whiteSpace:"nowrap", fontSize:11 }}>{t("home.deals_ends_in")}</span>
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

        <div ref={dealsGrid} className="product-grid">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ background:"var(--card)", borderRadius:12, border:"1px solid var(--border)", overflow:"hidden" }}>
                  <div style={{ aspectRatio:"1", background:"var(--secondary)" }} />
                  <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ height:8, background:"var(--secondary)", borderRadius:4, width:"40%" }} />
                    <div style={{ height:14, background:"var(--secondary)", borderRadius:4, width:"85%" }} />
                    <div style={{ height:8, background:"var(--secondary)", borderRadius:4, width:"55%" }} />
                  </div>
                </div>
              ))
            : hotDeals.map(p => <ProductCard key={p.id} product={p} flashSaleEndsIn={flashFormatted} />)
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  return (
    <Link href={s.slug} style={{ textDecoration:"none" }}>
      <div className="sy-card sy-card-bg" style={{ borderRadius:16, overflow:"hidden", border:"1px solid" }}>
        {/* Banner */}
        <div style={{ position:"relative", height:152 }}>
          {s.img
            ? <img src={s.img} alt="" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(0.22)", display:"block" }} />
            : <div style={{ width:"100%", height:"100%", background:s.bg, opacity:0.3 }} />
          }
          {/* Avatar */}
          <div style={{
            position:"absolute", bottom:-24, [isRTL ? "right" : "left"]:18,
            width:48, height:48, borderRadius:12,
            background:s.bg, border:"2px solid rgba(255,255,255,0.12)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20, fontWeight:800, color:"#fff", boxShadow:"0 4px 16px rgba(0,0,0,0.5)",
          }}>
            {s.letter}
          </div>
          {s.isVerified && (
            <div style={{
              position:"absolute", top:12, [isRTL ? "left" : "right"]:12,
              display:"flex", alignItems:"center", gap:4,
              background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.3)",
              borderRadius:100, padding:"3px 10px", fontSize:10, fontWeight:600, color:"#10b981",
            }}>
              <VerifyCheckSVG /> {t("home.verified_seller")}
            </div>
          )}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 55%)" }} />
          {s.rev > 0 && (
            <div style={{ position:"absolute", bottom:12, [isRTL ? "left" : "right"]:12 }}>
              <CompactRating rating={s.rating} rev={s.rev} />
            </div>
          )}
        </div>

        <div style={{ padding:"34px 18px 18px" }}>
          <div className="sy-card-name" style={{ fontSize:17, fontWeight:700, marginBottom:6 }}>{s.name}</div>
          <p className="sy-card-muted" style={{ margin:"0 0 14px", fontSize:12, lineHeight:1.65 }}>{s.desc}</p>
          <div style={{ display:"flex", alignItems:"center", justifyContent: isRTL ? "flex-end" : "flex-start", gap:5, marginBottom:18, paddingTop:12, borderTop:"1px solid rgba(128,128,128,0.15)" }}>
            <span style={{ fontSize:12, color:"#9ca3af" }}>{s.cat} · {s.cnt} {t("home.product_unit")}</span>
            <BoxIconSVG />
          </div>
          <button className="sy-store-cta" style={{ width:"100%", padding:"10px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
            <ExternalLinkSVG />{t("home.visit_store")}
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
  const { t } = useTranslation();

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
        desc: (s.categories ?? []).slice(0, 2).join(" · ") || t("home.store_misc"),
        cat: (s.categories ?? [])[0] || t("home.store_misc"),
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
          <SectionHeader sup={t("home.stores_sup")} title={t("home.verified_stores_title")} href="/products" />
          <div className="sy-stores-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {STATIC_STORES.map(s => (
              <div key={s.name} style={{ background:"var(--card)", borderRadius:16, border:"1px solid var(--border)", overflow:"hidden" }}>
                <div style={{ height:152, background:"var(--secondary)" }} />
                <div style={{ padding:"34px 18px 18px" }}>
                  <div style={{ height:8, background:"var(--secondary)", borderRadius:4, width:"40%", marginBottom:10 }} />
                  <div style={{ height:14, background:"var(--secondary)", borderRadius:4, width:"70%", marginBottom:8 }} />
                  <div style={{ height:10, background:"var(--secondary)", borderRadius:4, width:"90%" }} />
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
        <SectionHeader sup={t("home.stores_sup")} title={t("home.verified_stores_title")} href="/products" />
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
function TrendingSection({ products }: { products: import("@workspace/api-client-react").Product[] }) {
  const trendGrid = useStagger(3, 115);
  const { t } = useTranslation();

  if (products.length === 0) return null;

  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={MAX_W}>
        <SectionHeader sup={t("home.trending_sup")} title={t("home.trending_title")} href="/products" />
        <div ref={trendGrid} className="product-grid">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 6 — NEW ARRIVALS (asymmetric)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const STATIC_SMALL_ARRIVALS = [
  { nameAr:"عطر الأوبسيديان الليلي", nameEn:"Night Obsidian Perfume", cat:"عطور",        catEn:"Perfumes",    price:"89,500", img:"https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=300", href:"/products" },
  { nameAr:"ديكور منزلي مودرن",      nameEn:"Modern Home Decor",      cat:"منزل وديكور", catEn:"Home & Decor", price:"56,000", img:"https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=300", href:"/products" },
];

type SmallArrivalCard = { name: string; cat: string; price: string; img: string; href: string; };

function NewArrivalsSection({ newArrivals }: { newArrivals: import("@workspace/api-client-react").Product[] }) {
  const revealLarge = useReveal();
  const revealSmall = useReveal();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const large = newArrivals[0];
  const largeHref = large ? `/products/${large.id}` : "/products";
  const largeImg = large
    ? ((large as any).imageUrls?.[0] ?? "https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=900")
    : "https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=900";
  const largeName  = large ? ((isRTL ? (large as any).nameAr : null) ?? large.name) : (isRTL ? "مجموعة تقنية بريميوم 2025" : "Premium Tech Collection 2025");
  const largeCat   = large?.category ?? (isRTL ? "إلكترونيات" : "Electronics");
  const largePrice = large ? large.price.toLocaleString() : "435,000";
  const largeRev   = (large as any)?.reviewsCount ?? 0;
  const largeRating = ((large as any)?.averageRating ?? 0).toFixed(1);

  const smalls: SmallArrivalCard[] = newArrivals.slice(1, 3).length >= 2
    ? newArrivals.slice(1, 3).map(p => ({
        name: (isRTL ? (p as any).nameAr : null) ?? p.name,
        cat: p.category ?? (isRTL ? "منتجات" : "Products"),
        price: p.price.toLocaleString(),
        img: (p as any).imageUrls?.[0] ?? "",
        href: `/products/${p.id}`,
      }))
    : STATIC_SMALL_ARRIVALS.map(a => ({
        name: isRTL ? a.nameAr : a.nameEn,
        cat: isRTL ? a.cat : a.catEn,
        price: a.price,
        img: a.img,
        href: a.href,
      }));

  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={MAX_W}>
        <SectionHeader sup={t("home.arrivals_sup")} title={t("home.arrivals_title")} href="/products" />
        <div className="sy-arrivals-grid" style={{ display:"grid", gridTemplateColumns:"1fr 356px", gap:14 }}>
          {/* Large card */}
          <Link href={largeHref} style={{ textDecoration:"none" }}>
            <div ref={revealLarge} className="sy-sr" style={{ position:"relative", borderRadius:18, overflow:"hidden", minHeight:386 }}>
              <img src={largeImg} alt="" loading="lazy" style={{ width:"100%", height:"100%", minHeight:386, objectFit:"cover", filter:"brightness(0.26) contrast(1.12)", display:"block" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.97) 0%,rgba(0,0,0,0.02) 55%)" }} />
              <div style={{ position:"absolute", top:20, [isRTL ? "right" : "left"]:20 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, color:"#10b981", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.28)", padding:"4px 13px", borderRadius:100, fontWeight:600 }}>↑ {t("home.new_label")}</span>
              </div>
              <div style={{ position:"absolute", bottom:0, [isRTL ? "right" : "left"]:0, [isRTL ? "left" : "right"]:0, padding: isRTL ? "0 28px 28px" : "0 28px 28px", textAlign: isRTL ? "right" : "left" }}>
                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:7 }}>{largeCat}</div>
                <div style={{ fontSize:26, fontWeight:800, color:"#fff", marginBottom:11, lineHeight:1.2 }}>{largeName}</div>
                {parseFloat(largeRating) > 0 && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent: isRTL ? "flex-end" : "flex-start", gap:6, marginBottom:10 }}>
                    {largeRev > 0 && <span style={{ fontSize:11, color:"#9ca3af" }}>({largeRev})</span>}
                    <span style={{ fontSize:12, fontWeight:600, color:"#fff" }}>{largeRating}</span>
                    <Stars n={Math.round(parseFloat(largeRating))} size={12} />
                  </div>
                )}
                <div style={{ fontSize:26, fontWeight:900, color:"#10b981" }}>{largePrice} <span style={{ fontSize:13, fontWeight:400, color:"#9ca3af" }}>ل.س</span></div>
              </div>
            </div>
          </Link>

          {/* Small cards stack */}
          <div ref={revealSmall} className="sy-sr" style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {smalls.map((a, i) => (
              <Link key={i} href={a.href} style={{ textDecoration:"none" }}>
                <div className="sy-card sy-card-bg" style={{ borderRadius:16, overflow:"hidden", border:"1px solid", display:"flex", height:182, transition:"border-color 0.25s" }}>
                  {/* Text side */}
                  <div style={{ flex:1, padding:"16px 18px", textAlign: isRTL ? "right" : "left", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                    <div>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, color:"#10b981", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.18)", padding:"2px 8px", borderRadius:100, marginBottom:7, fontWeight:600 }}>● {t("home.new_label")}</span>
                      <div className="sy-card-muted" style={{ fontSize:10, marginBottom:4 }}>{a.cat}</div>
                      <div className="sy-card-name" style={{ fontSize:15, fontWeight:700, lineHeight:1.35 }}>{a.name}</div>
                    </div>
                    <div style={{ fontSize:19, fontWeight:800, color:"#10b981" }}>{a.price} <span style={{ fontSize:11, fontWeight:400, color:"#9ca3af" }}>ل.س</span></div>
                  </div>
                  {/* Image side */}
                  <div style={{ width:140, flexShrink:0 }}>
                    {a.img
                      ? <img src={a.img} alt="" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", filter:"brightness(0.7)" }} />
                      : <div style={{ width:"100%", height:"100%", background:"var(--secondary)" }} />
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const arrow = isRTL ? "←" : "→";

  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={MAX_W}>
        <div ref={revealCard} className="sy-sr">
          <div className="sy-cta-section" style={{ borderRadius:24, border:"1px solid", padding:"clamp(40px,5vw,72px) clamp(28px,5vw,64px)", textAlign:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-50, left:"50%", transform:"translateX(-50%)", width:600, height:300, background:"radial-gradient(ellipse,rgba(16,185,129,0.055) 0%,transparent 70%)", pointerEvents:"none" }} />
            <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 16px", borderRadius:100, border:"1px solid rgba(16,185,129,0.3)", color:"#10b981", fontSize:11, fontWeight:600, marginBottom:22, background:"rgba(16,185,129,0.06)" }}>{t("home.join_badge")}</span>
            <h2 style={{ ...TITLE_STYLE, marginBottom:14, display:"block" }}>{t("home.join_title")}</h2>
            <p style={{ margin:"0 0 48px", color:"#9ca3af", fontSize:14, lineHeight:1.75 }}>{t("home.join_desc")}</p>
            <div className="sy-cta-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, maxWidth:720, margin:"0 auto" }}>
              {/* Seller */}
              <button onClick={handleOpenYourStore} className="sy-cta-btn">
                <div style={{ width:54, height:54, borderRadius:"50%", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}><StoreIconSVG /></div>
                <div className="sy-card-name" style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>{t("home.sell_cta_title")}</div>
                <p className="sy-card-muted" style={{ fontSize:13, lineHeight:1.75, marginBottom:24 }}>{t("home.sell_cta_desc")}</p>
                <span style={{ color:"#10b981", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:4, justifyContent:"center" }}>{t("home.sell_cta_cta")} {arrow}</span>
              </button>
              {/* Courier */}
              <button onClick={handleBecomeCourier} className="sy-cta-btn">
                <div style={{ width:54, height:54, borderRadius:"50%", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}><BikeIconSVG /></div>
                <div className="sy-card-name" style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>{t("home.courier_cta_title")}</div>
                <p className="sy-card-muted" style={{ fontSize:13, lineHeight:1.75, marginBottom:24 }}>{t("home.courier_cta_desc")}</p>
                <span style={{ color:"#10b981", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:4, justifyContent:"center" }}>{t("home.courier_cta_cta")} {arrow}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 8 — RECENTLY VIEWED
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function RecentlyViewedSection({ items, onClear }: {
  items: import("@/hooks/useRecentlyViewed").RecentlyViewedProduct[];
  onClear: () => void;
}) {
  const ref = useReveal();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  return (
    <section style={{ position:"relative", zIndex:1, paddingBottom:SEC_PB }}>
      <div style={MAX_W}>
        <div ref={ref} className="sy-sr" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:28 }}>
          <div style={{ textAlign: isRTL ? "right" : "left" }}>
            <span style={SUP_STYLE}>{t("home.recently_viewed_sup")}</span>
            <h2 style={{ ...TITLE_STYLE, fontSize:"clamp(24px,2.5vw,36px)" }}>{t("home.recently_viewed_title")}</h2>
          </div>
          <button onClick={onClear} style={{ color:"#6b7280", fontSize:13, background:"none", border:"1px solid rgba(128,128,128,0.2)", padding:"6px 14px", borderRadius:8, cursor:"pointer" }}>{t("home.clear_history")}</button>
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
      <div dir={i18n.dir()} className="sy-page" style={{ fontFamily:"'Cairo','Segoe UI',system-ui,sans-serif", minHeight:"100vh" }}>
        <HeroV4 />
        <CategoriesSection products={products} />
        <DealsSection hotDeals={hotDeals} isLoading={isLoadingProducts} flashFormatted={flashFormatted} />
        <StoresSection />
        <TrendingSection products={trending} />
        <NewArrivalsSection newArrivals={newArrivals} />
        {recentlyViewed.length > 0 && (
          <RecentlyViewedSection items={recentlyViewed} onClear={clearHistory} />
        )}
        <JoinCTASection />
      </div>
    </Layout>
  );
}
