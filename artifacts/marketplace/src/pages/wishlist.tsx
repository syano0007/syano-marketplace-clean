import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Heart, ShoppingBag, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const BASE = import.meta.env.BASE_URL ?? "/";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const { ids, refetch } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }

    setLoading(true);

    if (isAuthenticated) {
      // Authenticated: fetch full wishlist from API
      fetch(`${BASE}api/wishlist`, {
        credentials: "include",
        headers: authHeaders(),
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setProducts(Array.isArray(data) ? data : []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    } else {
      // Guest: fetch each product by ID in parallel
      Promise.all(
        ids.map((id) =>
          fetch(`${BASE}api/products/${id}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      )
        .then((results) => setProducts(results.filter(Boolean)))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, ids.length]);

  const isEmpty = !loading && products.length === 0;

  return (
    <Layout>
      <div className="container py-8 max-w-6xl mx-auto" dir={isAr ? "rtl" : "ltr"}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isAr ? "قائمة المفضلة" : "My Wishlist"}
              </h1>
              {products.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? `${products.length} منتج محفوظ`
                    : `${products.length} saved product${products.length !== 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          </div>

          {products.length > 0 && (
            <Link href="/products">
              <Button variant="outline" size="sm" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                {isAr ? "تسوق المزيد" : "Shop More"}
              </Button>
            </Link>
          )}
        </div>

        {/* Guest login banner — shown when guest has items */}
        {!isAuthenticated && products.length > 0 && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3">
            <p className="text-sm font-medium text-foreground/80">
              {isAr
                ? "سجّل دخولك لحفظ قائمتك بشكل دائم على جميع أجهزتك"
                : "Sign in to save your wishlist permanently across all devices"}
            </p>
            <Link href="/login" className="shrink-0">
              <Button size="sm" className="gap-2 h-8 text-xs">
                <LogIn className="h-3.5 w-3.5" />
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </Button>
            </Link>
          </div>
        )}

        {/* Loading */}
        {loading && <WishlistSkeleton />}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
              <Heart className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground mb-2">
                {isAr ? "قائمة المفضلة فارغة" : "Your wishlist is empty"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? "انقر على قلب أي منتج لحفظه هنا"
                  : "Tap the heart on any product to save it here"}
              </p>
            </div>
            <Link href="/products">
              <Button className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                {isAr ? "تصفح المنتجات" : "Browse Products"}
              </Button>
            </Link>
          </div>
        )}

        {/* Product grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
