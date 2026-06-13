import { ArrowLeft, Sparkles, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import type { Product } from "@workspace/api-client-react";

const FALLBACK_CARDS = [
  { id: 0, name: "عطر دبور سوفاج", price: "75,000", img: "https://images.unsplash.com/photo-1760860992203-85ca32536788?w=280&h=280&fit=crop&auto=format&q=90", available: true },
  { id: 0, name: "ساعة ذهبية فاخرة", price: "142,000", img: "https://images.unsplash.com/photo-1772949399808-7020b02896b9?w=280&h=280&fit=crop&auto=format&q=90", available: true },
  { id: 0, name: "موضة راقية", price: "38,500", img: "https://images.unsplash.com/photo-1704775986112-281c826c3ebd?w=280&h=280&fit=crop&auto=format&q=90", available: true },
];

const HERO_MAIN_IMG = "https://images.unsplash.com/photo-1741851547702-cac24b2a0d13?w=900&h=900&fit=crop&auto=format&q=90";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

interface CardData { id: number; name: string; price: string; img: string; available: boolean; }

export function HeroSection({ products }: { products: Product[] }) {
  const [activeCard, setActiveCard] = useState(0);

  const cards: CardData[] = products.length >= 3
    ? products.slice(0, 3).map(p => {
        const imgs = (p as any).imageUrls as string[] | undefined;
        return {
          id: p.id,
          name: p.name,
          price: Number(p.price).toLocaleString(),
          img: imgs?.[0] ?? FALLBACK_CARDS[0].img,
          available: ((p as any).stock ?? 1) > 0,
        };
      })
    : FALLBACK_CARDS;

  useEffect(() => {
    const t = setInterval(() => setActiveCard(c => (c + 1) % cards.length), 3200);
    return () => clearInterval(t);
  }, [cards.length]);

  return (
    <section
      style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      className="relative min-h-screen w-full bg-[#080808] flex items-center overflow-hidden pt-[72px]"
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute left-1/4 bottom-0 w-[400px] h-[400px] rounded-full bg-emerald-600/[0.05] blur-[100px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-10 w-full flex items-center gap-16 min-h-[calc(100vh-72px)]">
        {/* Text panel */}
        <div className="flex-1 max-w-[560px] py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] mb-8">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span style={{ fontWeight: 500, fontSize: "12px", letterSpacing: "0.06em" }} className="text-emerald-400 uppercase">
                سوق سوريا الرقمي
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            style={{ fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.01em" }}
            className="text-white mb-6"
          >
            <span className="block" style={{ fontSize: "clamp(40px, 4.5vw, 68px)" }}>اكتشف آلاف</span>
            <span className="block" style={{ fontSize: "clamp(40px, 4.5vw, 68px)" }}>المنتجات من</span>
            <span className="block bg-gradient-to-l from-emerald-400 to-emerald-300 bg-clip-text text-transparent" style={{ fontSize: "clamp(40px, 4.5vw, 68px)" }}>
              المتاجر السورية
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease }}
            style={{ fontWeight: 400, fontSize: "17px", lineHeight: 1.75 }}
            className="text-white/50 mb-10 max-w-[440px]"
          >
            منتجات متنوعة، متاجر موثوقة، وتجربة تسوق حديثة تجمع أفضل المتاجر السورية في مكان واحد.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.34, ease }}
            className="flex items-center gap-4"
          >
            <Link href="/products"
              style={{ fontWeight: 700, fontSize: "15px" }}
              className="group flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-full transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-95"
            >
              تسوق الآن
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
            <Link href="/sellers/directory"
              style={{ fontWeight: 500, fontSize: "14px" }}
              className="text-white/50 hover:text-white/80 transition-colors px-4 py-4"
            >
              استكشف المتاجر
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center gap-8 mt-14 pt-10 border-t border-white/[0.06]"
          >
            {[
              { value: "+500", label: "متجر نشط" },
              { value: "+25,000", label: "منتج متاح" },
              { value: "+12,000", label: "عميل راضٍ" },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.02em" }} className="text-white">{stat.value}</div>
                <div style={{ fontWeight: 400, fontSize: "13px" }} className="text-white/35 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Visual panel */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease }}
          className="flex-1 relative h-[600px] flex items-center justify-center"
        >
          {/* Main image */}
          <div className="relative w-[500px] h-[520px] rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black">
            <img src={HERO_MAIN_IMG} alt="Products" className="w-full h-full object-cover" style={{ filter: "brightness(0.6) contrast(1.1)" }} />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#080808]/60 to-transparent" />

            {/* Discount badge */}
            <div className="absolute top-6 start-6">
              <div style={{ fontWeight: 800, fontSize: "14px" }} className="bg-emerald-500 text-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">
                خصم 40%
              </div>
            </div>

            {/* Scrolling product card */}
            <div className="absolute top-6 end-6 w-[170px] bg-[#111]/80 backdrop-blur-md border border-white/[0.1] rounded-2xl p-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCard}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center gap-2.5"
                >
                  <img src={cards[activeCard].img} alt={cards[activeCard].name} className="w-10 h-10 rounded-lg object-cover border border-white/[0.08] shrink-0" />
                  <div className="min-w-0">
                    <p style={{ fontWeight: 600, fontSize: "11px", lineHeight: 1.3 }} className="text-white/80 truncate">{cards[activeCard].name}</p>
                    <p style={{ fontWeight: 800, fontSize: "12px" }} className="text-emerald-400 mt-0.5">{cards[activeCard].price} <span style={{ fontWeight: 400, fontSize: "10px" }}>ل.س</span></p>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex gap-1 mt-2.5">
                {cards.map((_, i) => (
                  <button key={i} onClick={() => setActiveCard(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${i === activeCard ? "bg-emerald-400 w-4" : "bg-white/20 w-2"}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Floating product cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="absolute bottom-16 start-0 w-[170px] bg-[#0f0f0f]/90 backdrop-blur-md border border-white/[0.1] rounded-2xl p-3 shadow-2xl shadow-black/50"
          >
            <Link href={cards[1]?.id ? `/products/${cards[1].id}` : "/products"} className="block">
              <div className="flex items-center gap-2.5">
                <img src={cards[1]?.img ?? FALLBACK_CARDS[1].img} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/[0.08] shrink-0" />
                <div className="min-w-0">
                  <p style={{ fontWeight: 500, fontSize: "10px" }} className="text-white/40 truncate">موضة راقية</p>
                  <p style={{ fontWeight: 800, fontSize: "12px" }} className="text-emerald-400">{cards[1]?.price ?? FALLBACK_CARDS[1].price} <span style={{ fontSize: "10px", fontWeight: 400 }}>ل.س</span></p>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease }}
            className="absolute bottom-4 end-6 w-[160px] bg-[#0f0f0f]/90 backdrop-blur-md border border-white/[0.1] rounded-2xl p-3 shadow-2xl shadow-black/50"
          >
            <Link href={cards[2]?.id ? `/products/${cards[2].id}` : "/products"} className="block">
              <div className="flex items-center gap-2.5">
                <img src={cards[2]?.img ?? FALLBACK_CARDS[2].img} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/[0.08] shrink-0" />
                <div className="min-w-0">
                  <p style={{ fontWeight: 500, fontSize: "10px" }} className="text-white/40 truncate">ساعة ذهبية</p>
                  <p style={{ fontWeight: 800, fontSize: "12px" }} className="text-emerald-400">{cards[2]?.price ?? FALLBACK_CARDS[2].price} <span style={{ fontSize: "10px", fontWeight: 400 }}>ل.س</span></p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span style={{ fontSize: "10px", fontWeight: 500 }} className="text-emerald-400/70">متوفر الآن</span>
              </div>
            </Link>
          </motion.div>

          {/* Shop icon badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7, ease }}
            className="absolute top-8 start-6 w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm"
          >
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
