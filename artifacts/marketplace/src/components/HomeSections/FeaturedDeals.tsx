import { Star, ArrowLeft, Timer, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@workspace/api-client-react";

const STATIC_DEALS = [
  { id: 0, name: "ساعة كلاسيكية ذهبية", category: "ساعات فاخرة", price: "142,500", originalPrice: "237,000", discount: 40, rating: 4.9, reviews: 284, img: "https://images.unsplash.com/photo-1772949399808-7020b02896b9?w=400&h=400&fit=crop&auto=format&q=85", badge: "الأكثر مبيعاً", badgeColor: "#f59e0b" },
  { id: 0, name: "حذاء نايكي رياضي", category: "رياضة وأحذية", price: "58,000", originalPrice: "82,000", discount: 29, rating: 4.7, reviews: 512, img: "https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=400&h=400&fit=crop&auto=format&q=85", badge: "عرض محدود", badgeColor: "#10b981" },
  { id: 0, name: "مجموعة تقنية متكاملة", category: "إلكترونيات", price: "385,000", originalPrice: "550,000", discount: 30, rating: 4.8, reviews: 196, img: "https://images.unsplash.com/photo-1741851547702-cac24b2a0d13?w=400&h=400&fit=crop&auto=format&q=85", badge: "جديد", badgeColor: "#3b82f6" },
  { id: 0, name: "عطر أوبسيديان إليكسير", category: "عطور وجمال", price: "96,000", originalPrice: "148,000", discount: 35, rating: 4.6, reviews: 89, img: "https://images.unsplash.com/photo-1772191399367-91ed8d95664b?w=400&h=400&fit=crop&auto=format&q=85", badge: "حصري", badgeColor: "#8b5cf6" },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

function CountdownTimer() {
  const [time, setTime] = useState({ h: 8, m: 24, s: 37 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-2">
      <Timer className="w-4 h-4 text-emerald-400" />
      <span style={{ fontWeight: 400, fontSize: "13px" }} className="text-white/40">تنتهي خلال</span>
      <div className="flex items-center gap-1">
        {[pad(time.h), pad(time.m), pad(time.s)].map((val, i) => (
          <span key={i} className="flex items-center gap-1">
            <span style={{ fontWeight: 700, fontSize: "14px", fontVariantNumeric: "tabular-nums" }} className="bg-[#1a1a1a] text-white px-2 py-0.5 rounded-md min-w-[32px] text-center">{val}</span>
            {i < 2 && <span style={{ fontWeight: 700 }} className="text-white/30">:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

interface DealCardData {
  id: number;
  name: string;
  category: string;
  price: string;
  originalPrice: string;
  discount: number;
  rating: number;
  reviews: number;
  img: string;
  badge: string;
  badgeColor: string;
}

function DealCard({ deal, i }: { deal: DealCardData; i: number }) {
  const [, navigate] = useLocation();
  const { isAuthenticated, isCustomer, isSeller, isAdmin, isCourier } = useAuth();
  const { addGuestItem } = useGuestCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const addToCartMutation = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "أُضيف إلى السلة ✓", description: deal.name });
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّر الإضافة للسلة", variant: "destructive" });
      },
    },
  });

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deal.id === 0) { navigate("/products"); return; }
    if (isSeller || isAdmin || isCourier) return;
    setAdding(true);
    try {
      if (isAuthenticated && isCustomer) {
        addToCartMutation.mutate({ data: { productId: deal.id, quantity: 1, variantId: null } });
      } else {
        addGuestItem(deal.id, null, 1);
        toast({ title: "أُضيف إلى السلة ✓", description: deal.name });
      }
    } finally {
      setTimeout(() => setAdding(false), 800);
    }
  }, [deal, isAuthenticated, isCustomer, isSeller, isAdmin, isCourier, addGuestItem, navigate]);

  const href = deal.id > 0 ? `/products/${deal.id}` : "/products";

  return (
    <motion.div
      key={deal.id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: i * 0.08, ease }}
      className="group bg-[#0f0f0f] border border-white/[0.06] hover:border-white/[0.1] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1"
    >
      <Link href={href} className="block">
        <div className="relative aspect-square bg-[#141414] overflow-hidden cursor-pointer">
          <img src={deal.img} alt={deal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: "brightness(0.9) contrast(1.05)" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f]/60 to-transparent" />
          <div className="absolute top-3 end-3">
            <div style={{ fontWeight: 800, fontSize: "13px", backgroundColor: "#10b981" }} className="text-black px-2.5 py-1 rounded-full shadow-lg">
              -{deal.discount}%
            </div>
          </div>
          <div className="absolute top-3 start-3">
            <div style={{ fontWeight: 600, fontSize: "11px", backgroundColor: `${deal.badgeColor}22`, color: deal.badgeColor, border: `1px solid ${deal.badgeColor}44` }} className="px-2.5 py-1 rounded-full backdrop-blur-sm">
              {deal.badge}
            </div>
          </div>
        </div>
      </Link>
      <div className="p-5">
        <p style={{ fontWeight: 500, fontSize: "11px" }} className="text-white/30 mb-1.5">{deal.category}</p>
        <Link href={href}>
          <h3 style={{ fontWeight: 700, fontSize: "16px", lineHeight: 1.4 }} className="text-white mb-3 group-hover:text-emerald-400 transition-colors duration-200 cursor-pointer">
            {deal.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 mb-4">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
          <span style={{ fontWeight: 700, fontSize: "13px" }} className="text-white/80">{deal.rating}</span>
          <span style={{ fontWeight: 400, fontSize: "12px" }} className="text-white/30">({deal.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.02em" }} className="text-emerald-400">
              {deal.price}<span style={{ fontWeight: 500, fontSize: "12px" }} className="text-emerald-400/70 me-1"> ل.س</span>
            </div>
            <div style={{ fontWeight: 400, fontSize: "12px" }} className="text-white/25 line-through mt-0.5">{deal.originalPrice} ل.س</div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            style={{ fontWeight: 600, fontSize: "13px" }}
            className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-emerald-500/15 hover:text-emerald-400 text-white/60 px-3.5 py-2 rounded-xl transition-all duration-200 border border-white/[0.06] hover:border-emerald-500/30 disabled:opacity-50"
          >
            {adding ? <div className="w-3.5 h-3.5 border border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            أضف
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturedDeals({ hotDeals }: { hotDeals?: Product[] }) {
  const deals: DealCardData[] = hotDeals && hotDeals.length > 0
    ? hotDeals.slice(0, 4).map((p, i) => {
        const imgs = (p as any).imageUrls as string[] | undefined;
        const orig = p.compareAtPrice ? Number(p.compareAtPrice) : null;
        const curr = Number(p.price);
        const disc = orig ? Math.round((1 - curr / orig) * 100) : STATIC_DEALS[i % 4].discount;
        return {
          id: p.id,
          name: p.name,
          category: p.category ?? STATIC_DEALS[i % 4].category,
          price: curr.toLocaleString(),
          originalPrice: orig ? orig.toLocaleString() : STATIC_DEALS[i % 4].originalPrice,
          discount: disc > 0 ? disc : STATIC_DEALS[i % 4].discount,
          rating: STATIC_DEALS[i % 4].rating,
          reviews: STATIC_DEALS[i % 4].reviews,
          img: imgs?.[0] ?? STATIC_DEALS[i % 4].img,
          badge: STATIC_DEALS[i % 4].badge,
          badgeColor: STATIC_DEALS[i % 4].badgeColor,
        };
      })
    : STATIC_DEALS;

  return (
    <section style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }} className="bg-[#080808] py-28 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.12em" }} className="text-emerald-400 uppercase mb-3">عروض حصرية</p>
            <h2 style={{ fontWeight: 800, fontSize: "38px", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="text-white mb-4">عروض مميزة</h2>
            <CountdownTimer />
          </div>
          <Link href="/products?hasDiscount=true" style={{ fontWeight: 600, fontSize: "14px" }} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors pb-1">
            كل العروض <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {deals.map((deal, i) => <DealCard key={`${deal.id}-${i}`} deal={deal} i={i} />)}
        </div>
      </div>
    </section>
  );
}
