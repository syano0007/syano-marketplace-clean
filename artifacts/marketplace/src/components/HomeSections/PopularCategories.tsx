import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const categories = [
  { id: 1, name: "إلكترونيات", count: "12,450 منتج", img: "https://images.unsplash.com/photo-1684395882817-030e24c0322a?w=500&h=360&fit=crop&auto=format&q=80", color: "#3b82f6", slug: "Electronics" },
  { id: 2, name: "موضة وملابس", count: "8,320 منتج", img: "https://images.unsplash.com/photo-1704775986112-281c826c3ebd?w=500&h=360&fit=crop&auto=format&q=80", color: "#ec4899", slug: "Fashion" },
  { id: 3, name: "عطور وجمال", count: "3,650 منتج", img: "https://images.unsplash.com/photo-1760860992203-85ca32536788?w=500&h=360&fit=crop&auto=format&q=80", color: "#f59e0b", slug: "Beauty & Personal Care" },
  { id: 4, name: "منزل وديكور", count: "6,780 منتج", img: "https://images.unsplash.com/photo-1724582586529-62622e50c0b3?w=500&h=360&fit=crop&auto=format&q=80", color: "#8b5cf6", slug: "Home & Kitchen" },
  { id: 5, name: "رياضة وأحذية", count: "5,230 منتج", img: "https://images.unsplash.com/photo-1656164753657-8ff832063a71?w=500&h=360&fit=crop&auto=format&q=80", color: "#10b981", slug: "Sports & Fitness" },
  { id: 6, name: "ساعات فاخرة", count: "2,890 منتج", img: "https://images.unsplash.com/photo-1772949399808-7020b02896b9?w=500&h=360&fit=crop&auto=format&q=80", color: "#f97316", slug: "Accessories" },
  { id: 7, name: "هواتف ذكية", count: "4,120 منتج", img: "https://images.unsplash.com/photo-1625780289233-321883d99ac1?w=500&h=360&fit=crop&auto=format&q=80", color: "#06b6d4", slug: "Electronics" },
  { id: 8, name: "حواسيب ولابتوب", count: "3,470 منتج", img: "https://images.unsplash.com/photo-1587318684001-b29074817e81?w=500&h=360&fit=crop&auto=format&q=80", color: "#a855f7", slug: "Electronics" },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function PopularCategories() {
  return (
    <section style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }} className="bg-[#080808] py-28">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.12em" }} className="text-emerald-400 uppercase mb-3">تصفح حسب الفئة</p>
            <h2 style={{ fontWeight: 800, fontSize: "38px", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="text-white">الفئات الأكثر شيوعاً</h2>
          </div>
          <Link href="/products" style={{ fontWeight: 600, fontSize: "14px" }} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors pb-1">
            عرض الكل <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
            >
              <Link href={`/products?category=${encodeURIComponent(cat.slug)}`} className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-[#111] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer block">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  style={{ filter: "brightness(0.45) contrast(1.1)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/95 via-[#080808]/30 to-transparent" />
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
                  <h3 style={{ fontWeight: 700, fontSize: "17px" }} className="text-white mb-1 transition-transform duration-300 group-hover:-translate-y-0.5">
                    {cat.name}
                  </h3>
                  <p style={{ fontWeight: 400, fontSize: "13px" }} className="text-white/40">{cat.count}</p>
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
