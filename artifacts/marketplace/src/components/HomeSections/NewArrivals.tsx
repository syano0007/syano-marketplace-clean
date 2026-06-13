import { Star, ArrowLeft, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Product } from "@workspace/api-client-react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const STATIC = [
  { id: 1, name: "مجموعة تقنية بريميوم 2025", category: "إلكترونيات", price: "435,000", rating: 4.8, reviews: 12, daysAgo: 2, img: "https://images.unsplash.com/photo-1741851547702-cac24b2a0d13?w=600&h=450&fit=crop&auto=format&q=85" },
  { id: 2, name: "عطر الأوبسيديان الليلي", category: "عطور", price: "89,500", rating: 5.0, reviews: 7, daysAgo: 1, img: "https://images.unsplash.com/photo-1772191399367-91ed8d95664b?w=400&h=450&fit=crop&auto=format&q=85" },
  { id: 3, name: "ديكور منزلي مودرن", category: "منزل وديكور", price: "56,000", rating: 4.7, reviews: 23, daysAgo: 3, img: "https://images.unsplash.com/photo-1724582586529-62622e50c0b3?w=400&h=220&fit=crop&auto=format&q=85" },
  { id: 4, name: "فستان سهرة أنيق", category: "موضة", price: "78,000", rating: 4.9, reviews: 18, daysAgo: 1, img: "https://images.unsplash.com/photo-1704775986112-281c826c3ebd?w=400&h=220&fit=crop&auto=format&q=85" },
];

interface ArrivalData {
  id: number;
  name: string;
  category: string;
  price: string;
  rating: number;
  reviews: number;
  daysAgo: number;
  img: string;
  productId?: number;
}

export function NewArrivals({ newArrivals }: { newArrivals?: Product[] }) {
  const items: ArrivalData[] = newArrivals && newArrivals.length >= 4
    ? newArrivals.slice(0, 4).map((p, i) => {
        const imgs = (p as any).imageUrls as string[] | undefined;
        return {
          id: p.id,
          productId: p.id,
          name: p.name,
          category: p.category ?? STATIC[i % 4].category,
          price: Number(p.price).toLocaleString(),
          rating: STATIC[i % 4].rating,
          reviews: STATIC[i % 4].reviews,
          daysAgo: Math.floor(i / 2) + 1,
          img: imgs?.[0] ?? STATIC[i % 4].img,
        };
      })
    : STATIC;

  const main = items[0];
  const rest = items.slice(1, 4);

  return (
    <section style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }} className="bg-[#080808] py-28 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.12em" }} className="text-emerald-400 uppercase mb-3">أضيف للتو</p>
            <h2 style={{ fontWeight: 800, fontSize: "38px", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="text-white">وصل حديثاً</h2>
          </div>
          <Link href="/products" style={{ fontWeight: 600, fontSize: "14px" }} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors pb-1">
            الجديد كل يوم <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-3 grid-rows-2 gap-5 h-[560px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease }}
            className="col-span-2 row-span-2 group relative bg-[#0f0f0f] border border-white/[0.06] hover:border-white/[0.10] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-black/60"
          >
            <Link href={main.productId ? `/products/${main.productId}` : "/products"} className="block w-full h-full">
              <img src={main.img} alt={main.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: "brightness(0.55) contrast(1.1)" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/90 via-[#080808]/20 to-transparent" />
              <div className="absolute top-5 start-5">
                <div style={{ fontWeight: 700, fontSize: "12px" }} className="flex items-center gap-1.5 bg-emerald-500 text-black px-3 py-1.5 rounded-full">
                  <Zap className="w-3 h-3" /> جديد منذ {main.daysAgo} أيام
                </div>
              </div>
              <div className="absolute bottom-0 start-0 end-0 p-7">
                <p style={{ fontWeight: 500, fontSize: "12px", letterSpacing: "0.06em" }} className="text-emerald-400 uppercase mb-2">{main.category}</p>
                <h3 style={{ fontWeight: 800, fontSize: "28px", lineHeight: 1.3, letterSpacing: "-0.01em" }} className="text-white mb-3">{main.name}</h3>
                <div className="flex items-center gap-4">
                  <div style={{ fontWeight: 800, fontSize: "24px" }} className="text-emerald-400">
                    {main.price}
                    <span style={{ fontWeight: 500, fontSize: "13px" }} className="text-emerald-400/70 me-1"> ل.س</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span style={{ fontWeight: 700, fontSize: "14px" }} className="text-white/70">{main.rating}</span>
                    <span style={{ fontWeight: 400, fontSize: "13px" }} className="text-white/30">({main.reviews} تقييم)</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {rest.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease }}
              className="group relative bg-[#0f0f0f] border border-white/[0.06] hover:border-white/[0.10] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-black/60"
            >
              <Link href={product.productId ? `/products/${product.productId}` : "/products"} className="block w-full h-full">
                <img src={product.img} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ filter: "brightness(0.5) contrast(1.1)" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/90 via-[#080808]/20 to-transparent" />
                <div className="absolute top-3 start-3">
                  <div style={{ fontWeight: 700, fontSize: "10px" }} className="flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    منذ {product.daysAgo} {product.daysAgo === 1 ? "يوم" : "أيام"}
                  </div>
                </div>
                <div className="absolute bottom-0 start-0 end-0 p-4">
                  <p style={{ fontWeight: 500, fontSize: "10px" }} className="text-emerald-400/70 uppercase mb-1">{product.category}</p>
                  <h3 style={{ fontWeight: 700, fontSize: "15px", lineHeight: 1.3 }} className="text-white mb-2">{product.name}</h3>
                  <div style={{ fontWeight: 800, fontSize: "17px" }} className="text-emerald-400">
                    {product.price}
                    <span style={{ fontWeight: 500, fontSize: "11px" }} className="text-emerald-400/70 me-1"> ل.س</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
