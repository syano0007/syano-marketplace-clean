import { Star, ArrowLeft, ShoppingBag, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState, useEffect } from "react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const STATIC_STORES = [
  { id: 1, name: "تك ستور سوريا", tagline: "أحدث الإلكترونيات والأجهزة الذكية", category: "إلكترونيات", rating: 4.9, reviews: 1840, productCount: "3,240", coverImg: "https://images.unsplash.com/photo-1684395882817-030e24c0322a?w=700&h=220&fit=crop&auto=format&q=80", logoColor: "#3b82f6", logoInitial: "ت", verified: true, slug: null },
  { id: 2, name: "دار الأناقة", tagline: "أزياء فاخرة وموضة معاصرة للجميع", category: "موضة وملابس", rating: 4.8, reviews: 2210, productCount: "1,890", coverImg: "https://images.unsplash.com/photo-1768745294179-693a07a3f054?w=700&h=220&fit=crop&auto=format&q=80", logoColor: "#ec4899", logoInitial: "د", verified: true, slug: null },
  { id: 3, name: "بيت الديكور", tagline: "أثاث عصري وإكسسوارات منزلية راقية", category: "منزل وديكور", rating: 4.7, reviews: 956, productCount: "2,140", coverImg: "https://images.unsplash.com/photo-1724582586529-62622e50c0b3?w=700&h=220&fit=crop&auto=format&q=80", logoColor: "#8b5cf6", logoInitial: "ب", verified: true, slug: null },
];

interface FeaturedStore {
  sellerId: number;
  storeName: string;
  storeSlug: string | null;
  storeLogo: string | null;
  storeBanner: string | null;
  accentColor: string | null;
  categories: string[];
  isVerified: boolean;
  productsCount: number;
  averageRating: number;
  reviewsCount: number;
}

interface StoreData {
  id: number;
  name: string;
  tagline: string;
  category: string;
  rating: number;
  reviews: number;
  productCount: string;
  coverImg: string;
  logoColor: string;
  logoInitial: string;
  verified: boolean;
  slug: string | null;
}

function StoreCard({ store, i }: { store: StoreData; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: i * 0.1, ease }}
      className="group bg-[#0f0f0f] border border-white/[0.06] hover:border-white/[0.10] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/60"
    >
      <div className="relative h-[160px] overflow-hidden bg-[#141414]">
        <img src={store.coverImg} alt={store.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: "brightness(0.5) contrast(1.1)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f]/80 to-transparent" />
        {store.verified && (
          <div className="absolute top-3 start-3">
            <div style={{ fontWeight: 600, fontSize: "11px" }} className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> موثّق
            </div>
          </div>
        )}
      </div>

      <div className="p-6 -mt-8 relative">
        <div className="flex items-end justify-between mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl" style={{ backgroundColor: `${store.logoColor}18`, border: `2px solid ${store.logoColor}30` }}>
            <span style={{ fontWeight: 900, fontSize: "24px", color: store.logoColor }}>{store.logoInitial}</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span style={{ fontWeight: 700, fontSize: "14px" }} className="text-white/80">{store.rating}</span>
            <span style={{ fontWeight: 400, fontSize: "12px" }} className="text-white/30">({store.reviews.toLocaleString()})</span>
          </div>
        </div>
        <h3 style={{ fontWeight: 800, fontSize: "19px" }} className="text-white mb-1">{store.name}</h3>
        <p style={{ fontWeight: 400, fontSize: "13px" }} className="text-white/40 mb-4 leading-relaxed">{store.tagline}</p>
        <div className="flex items-center gap-4 py-4 border-y border-white/[0.05] mb-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 text-white/25" />
            <span style={{ fontWeight: 600, fontSize: "13px" }} className="text-white/60">{store.productCount} منتج</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <span style={{ fontWeight: 400, fontSize: "13px" }} className="text-white/35">{store.category}</span>
        </div>
        <Link
          href={store.slug ? `/store/${store.slug}` : "/sellers/directory"}
          style={{ fontWeight: 700, fontSize: "14px" }}
          className="w-full flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/[0.14] text-white/70 hover:text-white py-3 rounded-xl transition-all duration-200"
        >
          <ExternalLink className="w-3.5 h-3.5" /> زيارة المتجر
        </Link>
      </div>
    </motion.div>
  );
}

export function TrustedStores() {
  const [stores, setStores] = useState<StoreData[]>(STATIC_STORES);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/sellers/featured`)
      .then(r => r.ok ? r.json() : null)
      .then((data: FeaturedStore[] | null) => {
        if (!data || !Array.isArray(data) || data.length === 0) return;
        const mapped: StoreData[] = data.slice(0, 3).map((s, i) => ({
          id: s.sellerId,
          name: s.storeName,
          tagline: (s.categories ?? []).join(" · ") || "متجر موثوق",
          category: (s.categories ?? [])[0] || "متنوع",
          rating: Math.round((s.averageRating || 4.5) * 10) / 10,
          reviews: s.reviewsCount,
          productCount: (s.productsCount ?? 0).toLocaleString(),
          coverImg: s.storeBanner ?? s.storeLogo ?? STATIC_STORES[i % 3].coverImg,
          logoColor: s.accentColor ?? STATIC_STORES[i % 3].logoColor,
          logoInitial: s.storeName.charAt(0),
          verified: s.isVerified,
          slug: s.storeSlug,
        }));
        setStores(mapped);
      })
      .catch(() => {});
  }, []);

  return (
    <section style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }} className="bg-[#080808] py-28 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.12em" }} className="text-emerald-400 uppercase mb-3">شركاؤنا التجاريون</p>
            <h2 style={{ fontWeight: 800, fontSize: "38px", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="text-white">متاجر موثوقة</h2>
          </div>
          <Link href="/sellers/directory" style={{ fontWeight: 600, fontSize: "14px" }} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors pb-1">
            جميع المتاجر <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {stores.map((store, i) => <StoreCard key={store.id} store={store} i={i} />)}
        </div>
      </div>
    </section>
  );
}
