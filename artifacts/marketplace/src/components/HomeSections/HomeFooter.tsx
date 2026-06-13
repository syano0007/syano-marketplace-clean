import { Instagram, Twitter, Facebook, Youtube, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const footerLinks = {
  marketplace: {
    title: "السوق",
    links: [
      { label: "جميع المنتجات", href: "/products" },
      { label: "العروض والتخفيضات", href: "/products?hasDiscount=true" },
      { label: "المتاجر الموثوقة", href: "/sellers/directory" },
      { label: "المنتجات الجديدة", href: "/products" },
      { label: "الأكثر مبيعاً", href: "/products" },
    ],
  },
  seller: {
    title: "للبائعين",
    links: [
      { label: "افتح متجرك", href: "/seller/apply" },
      { label: "لوحة التاجر", href: "/seller/dashboard" },
      { label: "خطط العمولة", href: "/seller/apply" },
      { label: "سياسة المرتجعات", href: "/" },
      { label: "مركز المساعدة", href: "/" },
    ],
  },
  company: {
    title: "الشركة",
    links: [
      { label: "من نحن", href: "/" },
      { label: "التوصيل والشحن", href: "/" },
      { label: "سياسة الخصوصية", href: "/" },
      { label: "الشروط والأحكام", href: "/" },
      { label: "تواصل معنا", href: "/" },
    ],
  },
};

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Twitter, label: "X (Twitter)", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
];

const paymentMethods = ["VISA", "MasterCard", "PayPal", "SyriaTel Cash"];

export function HomeFooter() {
  return (
    <footer style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }} className="bg-[#080808] border-t border-white/[0.06]">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="py-16 grid grid-cols-12 gap-10">
          <div className="col-span-4">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 800 }} className="text-black text-sm">S</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, letterSpacing: "0.08em" }} className="text-white text-lg">SYANO</div>
                <div style={{ fontWeight: 400, fontSize: "10px" }} className="text-emerald-400/70 tracking-widest">سوق سوريا</div>
              </div>
            </div>
            <p style={{ fontWeight: 400, fontSize: "14px", lineHeight: 1.8 }} className="text-white/35 mb-8 max-w-[280px]">
              منصة التجارة الإلكترونية السورية الأولى التي تجمع أفضل المتاجر والمنتجات في مكان واحد.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label} className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200">
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="col-span-1" />

          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key} className="col-span-2">
              <h4 style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "0.02em" }} className="text-white mb-5">{section.title}</h4>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} style={{ fontWeight: 400, fontSize: "13px" }} className="text-white/35 hover:text-white/65 transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-3">
            <h4 style={{ fontWeight: 700, fontSize: "14px" }} className="text-white mb-2">اشترك في النشرة البريدية</h4>
            <p style={{ fontWeight: 400, fontSize: "13px" }} className="text-white/35 mb-4 leading-relaxed">أحدث العروض والمنتجات مباشرة إلى بريدك.</p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="بريدك الإلكتروني..."
                style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif", fontWeight: 400, fontSize: "13px" }}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-emerald-500/40 rounded-xl px-4 py-3 text-white/70 placeholder-white/25 outline-none transition-colors"
              />
              <button style={{ fontWeight: 700, fontSize: "13px" }} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black w-full py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20">
                اشتراك <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-white/[0.05] flex items-center justify-between">
          <p style={{ fontWeight: 400, fontSize: "13px" }} className="text-white/25">© 2025 SYANO — جميع الحقوق محفوظة</p>
          <div className="flex items-center gap-4">
            {paymentMethods.map((method) => (
              <div key={method} style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em" }} className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.07] text-white/25 rounded-md">
                {method}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <a href="#" style={{ fontWeight: 400, fontSize: "12px" }} className="text-white/25 hover:text-white/50 transition-colors">الخصوصية</a>
            <a href="#" style={{ fontWeight: 400, fontSize: "12px" }} className="text-white/25 hover:text-white/50 transition-colors">الشروط</a>
            <a href="#" style={{ fontWeight: 400, fontSize: "12px" }} className="text-white/25 hover:text-white/50 transition-colors">الكوكيز</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
