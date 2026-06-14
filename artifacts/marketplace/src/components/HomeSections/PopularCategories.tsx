import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

const categoryDefs = [
  { nameKey: "home.categories.electronics", countKey: "home.categories.count_electronics", img: "https://images.unsplash.com/photo-1684395882817-030e24c0322a?w=500&h=360&fit=crop&auto=format&q=80", color: "#3b82f6", slug: "Electronics" },
  { nameKey: "home.categories.fashion", countKey: "home.categories.count_fashion", img: "https://images.unsplash.com/photo-1704775986112-281c826c3ebd?w=500&h=360&fit=crop&auto=format&q=80", color: "#ec4899", slug: "Fashion" },
  { nameKey: "home.categories.beauty", countKey: "home.categories.count_beauty", img: "https://images.unsplash.com/photo-1760860992203-85ca32536788?w=500&h=360&fit=crop&auto=format&q=80", color: "#f59e0b", slug: "Beauty & Personal Care" },
  { nameKey: "home.categories.home_decor", countKey: "home.categories.count_home_decor", img: "https://images.unsplash.com/photo-1724582586529-62622e50c0b3?w=500&h=360&fit=crop&auto=format&q=80", color: "#8b5cf6", slug: "Home & Kitchen" },
  { nameKey: "home.categories.sports", countKey: "home.categories.count_sports", img: "https://images.unsplash.com/photo-1656164753657-8ff832063a71?w=500&h=360&fit=crop&auto=format&q=80", color: "#10b981", slug: "Sports & Fitness" },
  { nameKey: "home.categories.watches", countKey: "home.categories.count_watches", img: "https://images.unsplash.com/photo-1772949399808-7020b02896b9?w=500&h=360&fit=crop&auto=format&q=80", color: "#f97316", slug: "Accessories" },
  { nameKey: "home.categories.phones", countKey: "home.categories.count_phones", img: "https://images.unsplash.com/photo-1625780289233-321883d99ac1?w=500&h=360&fit=crop&auto=format&q=80", color: "#06b6d4", slug: "Electronics" },
  { nameKey: "home.categories.computers", countKey: "home.categories.count_computers", img: "https://images.unsplash.com/photo-1587318684001-b29074817e81?w=500&h=360&fit=crop&auto=format&q=80", color: "#a855f7", slug: "Electronics" },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function PopularCategories() {
  const { t, i18n } = useTranslation();

  return (
    <section dir={i18n.dir()} style={{ fontFamily: "'Cairo', sans-serif" }} className="bg-background py-12 md:py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 md:mb-10 lg:mb-14">
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.12em" }} className="text-emerald-400 uppercase mb-3">{t("home.categories.eyebrow")}</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="text-foreground">{t("home.categories.title")}</h2>
          </div>
          <Link href="/products" style={{ fontWeight: 600, fontSize: "0.875rem" }} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors pb-1">
            {t("home.categories.see_all")} <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryDefs.map((cat, i) => (
            <motion.div
              key={cat.slug + i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
            >
              <Link href={`/products?category=${encodeURIComponent(cat.slug)}`} className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-card border border-border hover:border-border/60 transition-all duration-300 cursor-pointer block">
                <img
                  src={cat.img}
                  alt={t(cat.nameKey)}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  style={{ filter: "brightness(var(--img-dim-category)) contrast(1.1)" }}
                />
                <div className="absolute inset-0 sy-overlay-category" />
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(to right, ${cat.color}, transparent)` }}
                />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <div
                    className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                    style={{ backgroundColor: `${cat.color}22`, border: `1px solid ${cat.color}44` }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.0625rem" }} className="text-white mb-1 transition-transform duration-300 group-hover:-translate-y-0.5">
                    {t(cat.nameKey)}
                  </h3>
                  <p style={{ fontWeight: 400, fontSize: "0.8125rem" }} className="text-white/70">{t(cat.countKey)}</p>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.03] to-transparent" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
