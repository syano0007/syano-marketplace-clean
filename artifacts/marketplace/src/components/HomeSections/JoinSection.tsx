import { Store, Bike, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useSellerOnboarding } from "@/hooks/useSellerOnboarding";
import { useCourierOnboarding } from "@/hooks/useCourierOnboarding";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function JoinSection() {
  const { handleOpenYourStore } = useSellerOnboarding();
  const { handleBecomeCourier } = useCourierOnboarding();

  return (
    <section style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }} className="bg-[#080808] py-24 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="relative rounded-3xl overflow-hidden bg-[#0d0d0d] border border-white/[0.07]">
          <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-emerald-500/[0.06] blur-[100px]" />
            <div className="absolute top-1/2 start-0 -translate-y-1/2 w-[300px] h-[200px] rounded-full bg-emerald-600/[0.04] blur-[80px]" />
            <div className="absolute top-1/2 end-0 -translate-y-1/2 w-[300px] h-[200px] rounded-full bg-emerald-600/[0.04] blur-[80px]" />
          </div>

          <div className="relative z-10 py-16 px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] mb-6">
                <span style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.08em" }} className="text-emerald-400 uppercase">انضم إلى سيانو</span>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "42px", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="text-white mb-4">
                كن جزءاً من السوق السوري
              </h2>
              <p style={{ fontWeight: 400, fontSize: "16px", lineHeight: 1.7 }} className="text-white/40 max-w-[500px] mx-auto">
                سواء كنت بائعاً أو مندوب توصيل، هناك مكان لك في سيانو.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-5 max-w-[780px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1, ease }}
                onClick={handleOpenYourStore}
                className="group relative bg-[#111]/80 border border-white/[0.08] hover:border-emerald-500/25 rounded-2xl p-7 cursor-pointer transition-all duration-300 hover:bg-[#131313]/80 hover:shadow-xl hover:shadow-emerald-500/[0.05]"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-500/15 transition-colors duration-300">
                  <Store className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: "20px" }} className="text-white mb-2">ابدأ البيع على سيانو</h3>
                <p style={{ fontWeight: 400, fontSize: "14px", lineHeight: 1.65 }} className="text-white/40 mb-6">
                  افتح متجرك الإلكتروني وتواصل مع آلاف المشترين في جميع أنحاء سوريا.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>إنشاء متجري</span>
                  <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,_rgba(16,185,129,0.06)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.2, ease }}
                onClick={handleBecomeCourier}
                className="group relative bg-[#111]/80 border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-7 cursor-pointer transition-all duration-300 hover:bg-[#131313]/80 hover:shadow-xl hover:shadow-black/40"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white/[0.08] transition-colors duration-300">
                  <Bike className="w-6 h-6 text-white/50 group-hover:text-white/70 transition-colors" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: "20px" }} className="text-white mb-2">انضم كمندوب توصيل</h3>
                <p style={{ fontWeight: 400, fontSize: "14px", lineHeight: 1.65 }} className="text-white/40 mb-6">
                  حقق دخلاً إضافياً من خلال توصيل الطلبات في مدينتك بمرونة كاملة في أوقات عملك.
                </p>
                <div className="flex items-center gap-2 text-white/40 group-hover:text-white/70 transition-colors">
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>التسجيل كمندوب</span>
                  <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
