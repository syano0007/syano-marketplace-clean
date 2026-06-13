// @refresh reset
import { useCallback } from "react";
import { useListProducts, useGetPublicSettings, getListProductsQueryKey, getGetPublicSettingsQueryKey } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { useSEO } from "@/hooks/useSEO";
import { HeroSection } from "@/components/HomeSections/HeroSection";
import { PopularCategories } from "@/components/HomeSections/PopularCategories";
import { FeaturedDeals } from "@/components/HomeSections/FeaturedDeals";
import { TrustedStores } from "@/components/HomeSections/TrustedStores";
import { TrendingProducts } from "@/components/HomeSections/TrendingProducts";
import { NewArrivals } from "@/components/HomeSections/NewArrivals";
import { JoinSection } from "@/components/HomeSections/JoinSection";
import { HomeFooter } from "@/components/HomeSections/HomeFooter";

export default function Home() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const { data: products } = useListProducts(
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

  const hotDeals    = products?.filter(p => p.isBestDeal).slice(0, 4) ?? [];
  const newArrivals = products?.slice(0, 4) ?? [];
  const trending    = products?.slice(0, 6) ?? [];

  return (
    <div
      className="min-h-screen bg-[#080808]"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
    >
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
      `}</style>

      <main>
        <HeroSection />
        <PopularCategories />
        <FeaturedDeals hotDeals={hotDeals} />
        <TrustedStores />
        <TrendingProducts products={trending} />
        <NewArrivals newArrivals={newArrivals} />
        <JoinSection />
      </main>

      <HomeFooter />
    </div>
  );
}
