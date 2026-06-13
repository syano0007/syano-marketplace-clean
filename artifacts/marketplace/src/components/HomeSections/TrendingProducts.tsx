import { Star, Heart, ArrowLeft, TrendingUp, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@workspace/api-client-react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const STATIC_PRODUCTS = [
  { id: 0, name: "ساعة كرونوغراف سيلفر", category: "ساعات", store: "ساعات الفخامة", price: "198,000", rating: 4.9, reviews: 341, img: "https://images.unsplash.com/photo-1764243910471-4161c42fd29c?w=500&h=500&fit=crop&auto=format&q=85", trending: true },
  { id: 0, name: "هاتف بريميوم Pro Max", category: "هواتف ذكية", store: "تك ستور سوريا", price: "850,000", rating: 4.8, reviews: 892, img: "https://images.unsplash.com/photo-1625780289233-321883d99ac1?w=500&h=500&fit=crop&auto=format&q=85", trending: true },
  { id: 0, name: "لاب توب بلاك إيشن", category: "حواسيب", store: "تك ستور سوريا", price: "720,000", rating: 4.7, reviews: 213, img: "https://images.unsplash.com/photo-1587318684001-b29074817e81?w=500&h=500&fit=crop&auto=format&q=85", trending: false },
  { id: 0, name: "عطر كرستيان ديور", category: "عطور", store: "دار العطور", price: "112,000", rating: 4.9, reviews: 156, img: "https://images.unsplash.com/photo-1772191399367-91ed8d95664b?w=500&h=500&fit=crop&auto=format&q=85", trending: true },
  { id: 0, name: "حذاء رياضي فاخر", category: "أحذية", store: "سبورت هاوس", price: "65,000", rating: 4.6, reviews: 478, img: "https://images.unsplash.com/photo-1656164753657-8ff832063a71?w=500&h=500&fit=crop&auto=format&q=85", trending: false },
  { id: 0, name: "طقم إكسسوارات ذهبية", category: "مجوهرات", store: "دار الأناقة", price: "43,500", rating: 4.8, reviews: 89, img: "https://images.unsplash.com/photo-1624522032510-44b9b792d2a9?w=500&h=500&fit=crop&auto=format&q=85", trending: true },
];

interface ProductData {
  id: number;
  name: string;
  category: string;
  store: string;
  price: string;
  rating: number;
  reviews: number;
  img: string;
  trending: boolean;
}

function ProductCard({ product, i }: { product: ProductData; i: number }) {
  const [, navigate] = useLocation();
  const { isAuthenticated, isCustomer, isSeller, isAdmin, isCourier } = useAuth();
  const { addGuestItem } = useGuestCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const wishlisted = product.id > 0 ? isInWishlist(product.id) : false;

  const addToCartMutation = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "أُضيف إلى السلة ✓", description: product.name });
      },
    },
  });

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.id === 0) { navigate("/products"); return; }
    if (isSeller || isAdmin || isCourier) return;
    setAdding(true);
    if (isAuthenticated && isCustomer) {
      addToCartMutation.mutate({ data: { productId: product.id, quantity: 1, variantId: null } });
    } else {
      addGuestItem(product.id, null, 1);
      toast({ title: "أُضيف إلى السلة ✓", description: product.name });
    }
    setTimeout(() => setAdding(false), 800);
  }, [product, isAuthenticated, isCustomer, isSeller, isAdmin, isCourier, addGuestItem]);

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.id === 0) return;
    if (!isAuthenticated) { navigate("/login"); return; }
    toggleWishlist(product.id);
  }, [product.id, isAuthenticated, toggleWishlist, navigate]);

  const href = product.id > 0 ? `/products/${product.id}` : "/products";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: i * 0.07, ease }}
      className="group bg-[#0f0f0f] border border-white/[0.06] hover:border-white/[0.10] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1"
    >
      <Link href={href} className="block">
        <div className="relative aspect-square bg-[#141414] overflow-hidden cursor-pointer">
          <img src={product.img} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: "brightness(0.88) contrast(1.05)" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f]/50 to-transparent" />
          {product.trending && (
            <div className="absolute top-3 end-3">
              <div style={{ fontWeight: 700, fontSize: "11px" }} className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full backdrop-blur-sm">
                <TrendingUp className="w-3 h-3" /> رائج
              </div>
            </div>
          )}
          <button onClick={handleWishlist}
            className={`absolute top-3 start-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all duration-200 ${wishlisted ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "bg-black/40 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"}`}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-400" : ""}`} />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p style={{ fontWeight: 500, fontSize: "11px" }} className="text-white/30">{product.category}</p>
            <p style={{ fontWeight: 400, fontSize: "11px" }} className="text-white/25">{product.store}</p>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: "16px", lineHeight: 1.4 }} className="text-white mb-3 group-hover:text-emerald-400 transition-colors duration-200">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className={`w-3 h-3 ${j < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-white/10"}`} />
              ))}
            </div>
            <span style={{ fontWeight: 600, fontSize: "12px" }} className="text-white/50">{product.rating} ({product.reviews})</span>
          </div>
          <div className="flex items-center justify-between">
            <div style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.02em" }} className="text-emerald-400">
              {product.price}<span style={{ fontWeight: 500, fontSize: "12px" }} className="text-emerald-400/70 me-1"> ل.س</span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding}
              style={{ fontWeight: 600, fontSize: "13px" }}
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black px-4 py-2 rounded-xl transition-all duration-200 border border-emerald-500/20 hover:border-emerald-500 disabled:opacity-50"
            >
              {adding
                ? <div className="w-3.5 h-3.5 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
                : <ShoppingCart className="w-3.5 h-3.5" />}
              أضف
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function TrendingProducts({ products }: { products?: Product[] }) {
  const displayProducts: ProductData[] = products && products.length > 0
    ? products.slice(0, 6).map((p, i) => {
        const imgs = (p as any).imageUrls as string[] | undefined;
        return {
          id: p.id,
          name: p.name,
          category: p.category ?? STATIC_PRODUCTS[i % 6].category,
          store: STATIC_PRODUCTS[i % 6].store,
          price: Number(p.price).toLocaleString(),
          rating: STATIC_PRODUCTS[i % 6].rating,
          reviews: STATIC_PRODUCTS[i % 6].reviews,
          img: imgs?.[0] ?? STATIC_PRODUCTS[i % 6].img,
          trending: i % 3 !== 2,
        };
      })
    : STATIC_PRODUCTS;

  return (
    <section style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }} className="bg-[#080808] py-28 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.12em" }} className="text-emerald-400 uppercase mb-3">الأعلى تقييماً هذا الأسبوع</p>
            <h2 style={{ fontWeight: 800, fontSize: "38px", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="text-white">المنتجات الرائجة</h2>
          </div>
          <Link href="/products" style={{ fontWeight: 600, fontSize: "14px" }} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors pb-1">
            عرض الكل <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {displayProducts.map((product, i) => <ProductCard key={`${product.id}-${i}`} product={product} i={i} />)}
        </div>
      </div>
    </section>
  );
}
