import { ArrowLeft, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import type { Product } from "@workspace/api-client-react";
import { TrendingCard, type TrendingProductData } from "@/components/TrendingCard";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const STATIC_PRODUCTS = [
  { id: 0, nameAr: "ساعة كرونوغراف سيلفر", categoryKey: "home.categories.watches", storeAr: "ساعات الفخامة", price: 198000, rating: 4.9, reviews: 341, img: "https://images.unsplash.com/photo-1764243910471-4161c42fd29c?w=500&h=500&fit=crop&auto=format&q=85", trending: true },
  { id: 0, nameAr: "هاتف بريميوم Pro Max", categoryKey: "home.categories.phones", storeAr: "تك ستور سوريا", price: 850000, rating: 4.8, reviews: 892, img: "https://images.unsplash.com/photo-1625780289233-321883d99ac1?w=500&h=500&fit=crop&auto=format&q=85", trending: true },
  { id: 0, nameAr: "لاب توب بلاك إيشن", categoryKey: "home.categories.computers", storeAr: "تك ستور سوريا", price: 720000, rating: 4.7, reviews: 213, img: "https://images.unsplash.com/photo-1587318684001-b29074817e81?w=500&h=500&fit=crop&auto=format&q=85", trending: false },
  { id: 0, nameAr: "عطر كرستيان ديور", categoryKey: "home.categories.beauty", storeAr: "دار العطور", price: 112000, rating: 4.9, reviews: 156, img: "https://images.unsplash.com/photo-1772191399367-91ed8d95664b?w=500&h=500&fit=crop&auto=format&q=85", trending: true },
  { id: 0, nameAr: "حذاء رياضي فاخر", categoryKey: "home.categories.sports", storeAr: "سبورت هاوس", price: 65000, rating: 4.6, reviews: 478, img: "https://images.unsplash.com/photo-1656164753657-8ff832063a71?w=500&h=500&fit=crop&auto=format&q=85", trending: false },
  { id: 0, nameAr: "طقم إكسسوارات ذهبية", categoryKey: "home.categories.watches", storeAr: "دار الأناقة", price: 43500, rating: 4.8, reviews: 89, img: "https://images.unsplash.com/photo-1624522032510-44b9b792d2a9?w=500&h=500&fit=crop&auto=format&q=85", trending: true },
];

export function TrendingProducts({ products }: { products?: Product[] }) {
  const { t, i18n } = useTranslation();

  const displayProducts: TrendingProductData[] = products && products.length > 0
    ? products.slice(0, 6).map((p, i) => {
        const imgs = (p as any).imageUrls as string[] | undefined;
        const s = STATIC_PRODUCTS[i % 6];
        return {
          id: p.id,
          name: p.name,
          categoryLabel: p.category ?? t(s.categoryKey),
          store: s.storeAr,
          price: Number(p.price),
          rating: s.rating,
          reviews: s.reviews,
          img: imgs?.[0] ?? s.img,
          trending: i % 3 !== 2,
        };
      })
    : STATIC_PRODUCTS.map(s => ({
        id: s.id,
        name: s.nameAr,
        categoryLabel: t(s.categoryKey),
        store: s.storeAr,
        price: s.price,
        rating: s.rating,
        reviews: s.reviews,
        img: s.img,
        trending: s.trending,
      }));

  return (
    <section dir={i18n.dir()} style={{ fontFamily: "'Cairo', sans-serif" }} className="bg-background py-28 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.12em" }} className="text-emerald-400 uppercase mb-3">{t("home.trending.eyebrow")}</p>
            <h2 style={{ fontWeight: 800, fontSize: "38px", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="text-foreground">{t("home.trending.title")}</h2>
          </div>
          <Link href="/products" style={{ fontWeight: 600, fontSize: "14px" }} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors pb-1">
            {t("home.trending.see_all")} <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {displayProducts.map((product, i) => (
            <TrendingCard key={`${product.id}-${i}`} product={product} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
