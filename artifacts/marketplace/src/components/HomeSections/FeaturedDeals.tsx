import { Star, ArrowLeft, Timer, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@workspace/api-client-react";

const STATIC_DEALS = [
  { id: 0, nameAr: "ساعة كلاسيكية ذهبية", categoryKey: "home.categories.watches", price: 142500, originalPrice: 237000, discount: 40, rating: 4.9, reviews: 284, img: "https://images.unsplash.com/photo-1772949399808-7020b02896b9?w=400&h=400&fit=crop&auto=format&q=85", badgeKey: "home.deals.badge_bestseller", badgeColor: "#f59e0b" },
  { id: 0, nameAr: "حذاء نايكي رياضي", categoryKey: "home.categories.sports", price: 58000, originalPrice: 82000, discount: 29, rating: 4.7, reviews: 512, img: "https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=400&h=400&fit=crop&auto=format&q=85", badgeKey: "home.deals.badge_limited", badgeColor: "#10b981" },
  { id: 0, nameAr: "مجموعة تقنية متكاملة", categoryKey: "home.categories.electronics", price: 385000, originalPrice: 550000, discount: 30, rating: 4.8, reviews: 196, img: "https://images.unsplash.com/photo-1741851547702-cac24b2a0d13?w=400&h=400&fit=crop&auto=format&q=85", badgeKey: "home.deals.badge_new", badgeColor: "#3b82f6" },
  { id: 0, nameAr: "عطر أوبسيديان إليكسير", categoryKey: "home.categories.beauty", price: 96000, originalPrice: 148000, discount: 35, rating: 4.6, reviews: 89, img: "https://images.unsplash.com/photo-1772191399367-91ed8d95664b?w=400&h=400&fit=crop&auto=format&q=85", badgeKey: "home.deals.badge_exclusive", badgeColor: "#8b5cf6" },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

function CountdownTimer() {
  const { t } = useTranslation();
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
      <span style={{ fontWeight: 400, fontSize: "13px" }} className="text-muted-foreground">{t("home.deals.ends_in")}</span>
      <div className="flex items-center gap-1">
        {[pad(time.h), pad(time.m), pad(time.s)].map((val, i) => (
          <span key={i} className="flex items-center gap-1">
            <span style={{ fontWeight: 700, fontSize: "14px", fontVariantNumeric: "tabular-nums" }} className="bg-muted text-foreground px-2 py-0.5 rounded-md min-w-[32px] text-center">{val}</span>
            {i < 2 && <span style={{ fontWeight: 700 }} className="text-muted-foreground">:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

interface DealCardData {
  id: number;
  name: string;
  categoryLabel: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  img: string;
  badge: string;
  badgeColor: string;
}

function DealCard({ deal, i }: { deal: DealCardData; i: number }) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { isAuthenticated, isCustomer, isSeller, isAdmin, isCourier } = useAuth();
  const { addGuestItem } = useGuestCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const addToCartMutation = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: t("cart.added_title", "Added to cart ✓"), description: deal.name });
      },
      onError: () => {
        toast({ title: t("common.error"), description: t("cart.add_error", "Could not add to cart"), variant: "destructive" });
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
        toast({ title: t("cart.added_title", "Added to cart ✓"), description: deal.name });
      }
    } finally {
      setTimeout(() => setAdding(false), 800);
    }
  }, [deal, isAuthenticated, isCustomer, isSeller, isAdmin, isCourier, addGuestItem, navigate, t]);

  const href = deal.id > 0 ? `/products/${deal.id}` : "/products";

  return (
    <motion.div
      key={deal.id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: i * 0.08, ease }}
      className="group bg-card border border-border hover:border-border/80 rounded-2xl overflow-hidden transition-all duration-300 sy-card-elevated hover:-translate-y-1"
    >
      <Link href={href} className="block">
        <div className="relative aspect-square bg-muted overflow-hidden cursor-pointer">
          <img src={deal.img} alt={deal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: "brightness(var(--img-dim-product)) contrast(1.05)" }} />
          <div className="absolute inset-0 sy-overlay-medium" />
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
        <p style={{ fontWeight: 500, fontSize: "11px" }} className="text-muted-foreground mb-1.5">{deal.categoryLabel}</p>
        <Link href={href}>
          <h3 style={{ fontWeight: 700, fontSize: "16px", lineHeight: 1.4 }} className="text-foreground mb-3 group-hover:text-emerald-400 transition-colors duration-200 cursor-pointer">
            {deal.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 mb-4">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
          <span style={{ fontWeight: 700, fontSize: "13px" }} className="text-foreground/80">{deal.rating}</span>
          <span style={{ fontWeight: 400, fontSize: "12px" }} className="text-muted-foreground">({deal.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.02em" }} className="text-emerald-400" translate="no">
              {format(deal.price)}
            </div>
            <div style={{ fontWeight: 400, fontSize: "12px" }} className="text-muted-foreground line-through mt-0.5" translate="no">{format(deal.originalPrice)}</div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            style={{ fontWeight: 600, fontSize: "13px" }}
            className="flex items-center gap-1.5 bg-muted/60 hover:bg-emerald-500/15 hover:text-emerald-400 text-foreground/60 px-3.5 py-2 rounded-xl transition-all duration-200 border border-border hover:border-emerald-500/30 disabled:opacity-50"
          >
            {adding ? <div className="w-3.5 h-3.5 border border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            {t("home.deals.add")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturedDeals({ hotDeals }: { hotDeals?: Product[] }) {
  const { t, i18n } = useTranslation();

  const deals: DealCardData[] = hotDeals && hotDeals.length > 0
    ? hotDeals.slice(0, 4).map((p, i) => {
        const imgs = (p as any).imageUrls as string[] | undefined;
        const orig = (p as any).compareAtPrice ? Number((p as any).compareAtPrice) : null;
        const curr = Number(p.price);
        const disc = orig ? Math.round((1 - curr / orig) * 100) : STATIC_DEALS[i % 4].discount;
        const s = STATIC_DEALS[i % 4];
        return {
          id: p.id,
          name: p.name,
          categoryLabel: p.category ?? t(s.categoryKey),
          price: curr,
          originalPrice: orig ?? s.originalPrice,
          discount: disc > 0 ? disc : s.discount,
          rating: s.rating,
          reviews: s.reviews,
          img: imgs?.[0] ?? s.img,
          badge: t(s.badgeKey),
          badgeColor: s.badgeColor,
        };
      })
    : STATIC_DEALS.map(s => ({
        id: s.id,
        name: s.nameAr,
        categoryLabel: t(s.categoryKey),
        price: s.price,
        originalPrice: s.originalPrice,
        discount: s.discount,
        rating: s.rating,
        reviews: s.reviews,
        img: s.img,
        badge: t(s.badgeKey),
        badgeColor: s.badgeColor,
      }));

  return (
    <section dir={i18n.dir()} style={{ fontFamily: "'Cairo', sans-serif" }} className="sy-section-alt py-12 md:py-20 lg:py-28 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 md:mb-10 lg:mb-14">
          <div>
            <p style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.12em" }} className="text-emerald-400 uppercase mb-3">{t("home.deals.eyebrow")}</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="text-foreground mb-4">{t("home.deals.title")}</h2>
            <CountdownTimer />
          </div>
          <Link href="/products?hasDiscount=true" style={{ fontWeight: 600, fontSize: "14px" }} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors pb-1">
            {t("home.deals.see_all")} <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {deals.map((deal, i) => <DealCard key={`${deal.id}-${i}`} deal={deal} i={i} />)}
        </div>
      </div>
    </section>
  );
}
