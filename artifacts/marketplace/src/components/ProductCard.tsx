import React from "react";
import { useLocation } from "wouter";
import { Product, getProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Timer, Heart, Star, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { calculateDiscountPercent } from "@/lib/pricing";
import { useWishlist } from "@/contexts/WishlistContext";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  flashSaleEndsIn?: string;
}

export const ProductCard = React.memo(function ProductCard({ product, flashSaleEndsIn }: ProductCardProps) {
  const { isCustomer, isAuthenticated, isSeller, isAdmin, isCourier } = useAuth();
  const { format } = useCurrency();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { addGuestItem } = useGuestCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const cardRef = React.useRef<HTMLDivElement>(null);
  const prefetchedRef = React.useRef(false);

  React.useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !prefetchedRef.current) {
          prefetchedRef.current = true;
          queryClient.prefetchQuery({
            queryKey: getGetProductQueryKey(product.id),
            queryFn: () => getProduct(product.id),
            staleTime: 2 * 60 * 1000,
          });
        }
      },
      { threshold: 0.1, rootMargin: "100px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product.id, queryClient]);

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        toast({
          title: t("product_detail.added_to_cart"),
          description: t("product_detail.added_desc", { qty: 1, name: product.name }),
        });
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
      onError: () => {
        toast({
          title: t("common.error"),
          description: t("product_detail.error_add"),
          variant: "destructive",
        });
      },
    },
  });

  const handleMouseEnter = () => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    queryClient.prefetchQuery({
      queryKey: getGetProductQueryKey(product.id),
      queryFn: () => getProduct(product.id),
      staleTime: 2 * 60 * 1000,
    });
  };

  const discPct = calculateDiscountPercent(product.price, product.finalPrice ?? product.price);
  const hasDiscount = discPct > 0;
  const avgRating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const isRated = avgRating > 0;
  const hasVariants = (product as any).hasVariants === true;

  const handleCustomerAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) {
      navigate(`/products/${product.id}`);
    } else {
      addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
    }
  };

  const handleGuestAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) {
      navigate(`/products/${product.id}`);
      return;
    }
    addGuestItem(product.id, null, 1);
    toast({
      title: t("product_detail.added_to_cart"),
      description: t("cart.guest_added_desc"),
    });
  };

  const showCart = isCustomer || !isAuthenticated;
  const cartDisabled =
    product.stock <= 0 ||
    (isCustomer && addToCart.isPending);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "group flex flex-col bg-card border border-border hover:border-border/80",
        "rounded-2xl overflow-hidden sy-card-elevated",
        "hover:-translate-y-1 transition-all duration-300",
        "cursor-pointer relative",
        product.stock <= 0 && "opacity-70"
      )}
      onClick={() => navigate(`/products/${product.id}`)}
      onMouseEnter={handleMouseEnter}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/products/${product.id}`)}
      aria-label={`View ${product.name}`}
    >
      {/* ── Image ─────────────────────────────────────────── */}
      <div className="relative aspect-square bg-muted overflow-hidden shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ filter: "brightness(var(--img-dim-product)) contrast(1.05)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
            <span className="text-xs font-medium px-2 text-center">{t("product_detail.no_image")}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 sy-overlay-light pointer-events-none" />

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 end-3 z-10">
            <div
              style={{ fontWeight: 700, fontSize: "11px" }}
              className="bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full"
            >
              -{discPct}%
            </div>
          </div>
        )}

        {/* Trending badge (when product is marked trending) */}
        {(product as any).isTrending && !hasDiscount && (
          <div className="absolute top-3 end-3 z-10">
            <div
              style={{ fontWeight: 700, fontSize: "11px" }}
              className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full backdrop-blur-sm"
            >
              <TrendingUp className="w-3 h-3" />
              {t("home.trending.trending_badge")}
            </div>
          </div>
        )}

        {/* Wishlist button */}
        <button
          className={cn(
            "absolute top-3 start-3 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all duration-200",
            isWishlisted
              ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
              : "bg-black/40 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
          )}
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        >
          <Heart className={cn("w-3.5 h-3.5", isWishlisted && "fill-rose-400")} />
        </button>

        {/* Flash sale countdown bar */}
        {flashSaleEndsIn && (
          <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-center gap-1 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 tabular-nums">
            <Timer className="h-2.5 w-2.5 shrink-0" />
            <span className="opacity-80">{t("home.deals.ends_in")}</span>
            <span dir="ltr">{flashSaleEndsIn}</span>
          </div>
        )}
      </div>

      {/* ── Card body ─────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">

        {/* Category + Store row */}
        <div className="flex items-center justify-between mb-2">
          <p style={{ fontWeight: 500, fontSize: "11px" }} className="text-muted-foreground truncate">
            {product.category}
          </p>
          <p style={{ fontWeight: 400, fontSize: "11px" }} className="text-muted-foreground/70 truncate ms-2 shrink-0 max-w-[45%]">
            {product.sellerName}
          </p>
        </div>

        {/* Title — 2-line clamp with fixed height so all cards align */}
        <h3
          style={{ fontWeight: 700, fontSize: "15px", lineHeight: 1.4, minHeight: "2.8em" }}
          className="text-foreground mb-3 group-hover:text-emerald-400 transition-colors duration-200 line-clamp-2"
        >
          {product.name}
        </h3>

        {/* Rating — always rendered to keep consistent card height */}
        <div className="flex items-center gap-1.5 mb-3" style={{ minHeight: "18px" }}>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, j) => (
              <Star
                key={j}
                className={cn(
                  "w-3 h-3",
                  isRated && j < Math.floor(avgRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-foreground/10"
                )}
              />
            ))}
          </div>
          <span style={{ fontWeight: 600, fontSize: "12px" }} className="text-foreground/50">
            {isRated
              ? `${avgRating.toFixed(1)}${reviewCount > 0 ? ` (${reviewCount})` : ""}`
              : "—"}
          </span>
        </div>

        {/* Price + Add-to-cart — pushed to bottom */}
        <div className="flex items-center justify-between mt-auto gap-2">
          <div className="min-w-0">
            {hasDiscount && (
              <p className="text-[11px] text-muted-foreground line-through leading-none mb-0.5" translate="no">
                {format(product.price)}
              </p>
            )}
            <div
              style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.02em" }}
              className="text-emerald-400 leading-tight"
              translate="no"
            >
              {format(hasDiscount ? product.finalPrice : product.price)}
            </div>
          </div>

          {showCart && (
            <button
              onClick={isCustomer ? handleCustomerAddToCart : handleGuestAddToCart}
              disabled={cartDisabled}
              style={{ fontWeight: 600, fontSize: "13px" }}
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-2.5 sm:px-4 py-2 rounded-xl transition-all duration-200 border border-emerald-500/20 hover:border-emerald-500 disabled:opacity-50 shrink-0"
              aria-label={hasVariants ? t("products.choose_options") : t("product_detail.add_to_cart")}
            >
              {isCustomer && addToCart.isPending ? (
                <div className="w-3.5 h-3.5 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="whitespace-nowrap">
                {t("home.trending.add")}
              </span>
            </button>
          )}
        </div>

        {/* Stock warnings */}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="mt-2 text-[10px] font-medium text-destructive">
            {t("products.only_left", { count: product.stock })}
          </div>
        )}
        {product.stock <= 0 && (
          <div className="mt-2 text-[10px] font-medium text-muted-foreground">
            {t("products.out_of_stock")}
          </div>
        )}
      </div>
    </motion.div>
  );
});
