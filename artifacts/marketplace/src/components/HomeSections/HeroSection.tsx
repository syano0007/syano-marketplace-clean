import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const HERO_MAIN_IMG = "https://images.unsplash.com/photo-1741851547702-cac24b2a0d13?w=900&h=900&fit=crop&auto=format&q=90";
const PERFUME_IMG = "https://images.unsplash.com/photo-1760860992203-85ca32536788?w=300&h=400&fit=crop&auto=format&q=90";
const WATCH_IMG = "https://images.unsplash.com/photo-1772949399808-7020b02896b9?w=280&h=280&fit=crop&auto=format&q=90";
const FASHION_IMG = "https://images.unsplash.com/photo-1704775986112-281c826c3ebd?w=260&h=340&fit=crop&auto=format&q=90";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function HeroSection() {
  return (
    <section
      style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      className="relative min-h-screen w-full bg-[#080808] flex items-center overflow-hidden pt-[72px]"
    >
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute left-1/4 bottom-0 w-[400px] h-[400px] rounded-full bg-emerald-600/[0.05] blur-[100px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-10 w-full flex items-center gap-16 min-h-[calc(100vh-72px)]">
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
            <Link
              href="/products"
              style={{ fontWeight: 700, fontSize: "15px" }}
              className="group flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-full transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-95"
            >
              تسوق الآن
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/sellers/directory"
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
                <div style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.02em" }} className="text-white">
                  {stat.value}
                </div>
                <div style={{ fontWeight: 400, fontSize: "13px" }} className="text-white/35 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease }}
          className="flex-1 relative min-h-[620px] max-w-[640px]"
        >
          <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_70%_60%_at_50%_55%,_rgba(16,185,129,0.12)_0%,_transparent_70%)]" />

          <div className="absolute inset-8 rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/60">
            <img
              src={HERO_MAIN_IMG}
              alt="منتجات تقنية فاخرة"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.85) contrast(1.05)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/60 via-transparent to-[#080808]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/40 via-transparent to-transparent" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="absolute top-6 right-2 z-10"
          >
            <div className="bg-[#111]/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-2xl shadow-black/50 w-[190px]">
              <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1a1a]">
                <img src={PERFUME_IMG} alt="عطر فاخر" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p style={{ fontWeight: 600, fontSize: "11px" }} className="text-white/70 truncate">عطر ديور سوفاج</p>
                <p style={{ fontWeight: 800, fontSize: "14px" }} className="text-emerald-400 mt-0.5">75,000 ل.س</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < 4 ? "bg-emerald-400" : "bg-white/20"}`} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="absolute bottom-14 left-2 z-10"
          >
            <div className="bg-[#111]/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-2xl shadow-black/50 w-[200px]">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1a1a]">
                <img src={WATCH_IMG} alt="ساعة فاخرة" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p style={{ fontWeight: 600, fontSize: "11px" }} className="text-white/70 truncate">ساعة ذهبية فاخرة</p>
                <p style={{ fontWeight: 800, fontSize: "14px" }} className="text-emerald-400 mt-0.5">142,000 ل.س</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span style={{ fontWeight: 400, fontSize: "10px" }} className="text-emerald-400/70">متوفر الآن</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="absolute top-1/2 -translate-y-1/2 left-0 z-10"
          >
            <div className="bg-[#111]/85 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 w-[110px]">
              <div className="h-[140px] bg-[#1a1a1a]">
                <img src={FASHION_IMG} alt="موضة فاخرة" className="w-full h-full object-cover" />
              </div>
              <div className="p-2.5">
                <p style={{ fontWeight: 600, fontSize: "10px" }} className="text-white/60 truncate">موضة راقية</p>
                <p style={{ fontWeight: 800, fontSize: "12px" }} className="text-emerald-400 mt-0.5">38,500 ل.س</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, rotate: -12, scale: 0.8 }}
            animate={{ opacity: 1, rotate: -12, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="absolute top-20 left-20 z-20"
          >
            <div style={{ fontWeight: 800, fontSize: "13px" }} className="bg-emerald-500 text-black px-3.5 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">
              خصم 40%
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
    </section>
  );
}
