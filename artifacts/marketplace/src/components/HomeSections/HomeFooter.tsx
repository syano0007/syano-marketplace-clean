import { Instagram, Twitter, Facebook, Youtube, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Twitter, label: "X (Twitter)", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
];

const paymentMethods = ["VISA", "MasterCard", "PayPal", "SyriaTel Cash"];

export function HomeFooter() {
  const { t, i18n } = useTranslation();

  const footerLinks = {
    marketplace: {
      titleKey: "home.footer.marketplace_title",
      links: [
        { labelKey: "home.footer.link_all_products", href: "/shop" },
        { labelKey: "home.footer.link_deals", href: "/shop?hasDiscount=true" },
        { labelKey: "home.footer.link_trusted_stores", href: "/sellers/directory" },
        { labelKey: "home.footer.link_new_products", href: "/shop" },
        { labelKey: "home.footer.link_bestsellers", href: "/shop?sortBy=best_selling" },
      ],
    },
    seller: {
      titleKey: "home.footer.sellers_title",
      links: [
        { labelKey: "home.footer.link_open_store", href: "/seller/apply" },
        { labelKey: "home.footer.link_seller_dashboard", href: "/seller/dashboard" },
        { labelKey: "home.footer.link_commission", href: "/seller/commission" },
        { labelKey: "home.footer.link_returns", href: "/returns-policy" },
        { labelKey: "home.footer.link_help", href: "/help" },
      ],
    },
    company: {
      titleKey: "home.footer.company_title",
      links: [
        { labelKey: "home.footer.link_about", href: "/about" },
        { labelKey: "home.footer.link_shipping", href: "/shipping" },
        { labelKey: "home.footer.link_privacy", href: "/privacy-policy" },
        { labelKey: "home.footer.link_terms_page", href: "/terms-of-use" },
        { labelKey: "home.footer.link_contact", href: "/contact" },
      ],
    },
  };

  return (
    <footer dir={i18n.dir()} style={{ fontFamily: "'Cairo', sans-serif" }} className="bg-background border-t border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="py-10 md:py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="col-span-2 md:col-span-3 lg:col-span-4">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 800 }} className="text-black text-sm">S</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, letterSpacing: "0.08em" }} className="text-foreground text-lg">SYANO</div>
                <div style={{ fontWeight: 400, fontSize: "var(--font-2xs)" }} className="text-emerald-400/70 tracking-widest">سوق سوريا</div>
              </div>
            </div>
            <p style={{ fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.8 }} className="text-muted-foreground mb-8 max-w-[280px]">
              {t("home.footer.tagline")}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label} className="w-9 h-9 rounded-xl bg-muted/40 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground/70 hover:bg-muted/80 hover:border-border transition-all duration-200">
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-1" />

          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key} className="lg:col-span-2">
              <h4 style={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.02em" }} className="text-foreground mb-5">{t(section.titleKey)}</h4>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link href={link.href} style={{ fontWeight: 400, fontSize: "0.8125rem" }} className="text-muted-foreground hover:text-foreground/65 transition-colors duration-200">
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-3 lg:col-span-3">
            <h4 style={{ fontWeight: 700, fontSize: "0.875rem" }} className="text-foreground mb-2">{t("home.footer.newsletter_title")}</h4>
            <p style={{ fontWeight: 400, fontSize: "0.8125rem" }} className="text-muted-foreground mb-4 leading-relaxed">{t("home.footer.newsletter_desc")}</p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder={t("home.footer.newsletter_placeholder")}
                style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 400, fontSize: "0.8125rem" }}
                className="w-full bg-muted/40 border border-border focus:border-emerald-500/40 rounded-xl px-4 py-3 text-foreground/70 placeholder:text-muted-foreground/50 outline-none transition-colors"
              />
              <button style={{ fontWeight: 700, fontSize: "0.8125rem" }} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black w-full py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20">
                {t("home.footer.subscribe")} <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 text-center sm:text-start">
          <p style={{ fontWeight: 400, fontSize: "0.8125rem" }} className="text-muted-foreground/60">{t("home.footer.copyright")}</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {paymentMethods.map((method) => (
              <div key={method} style={{ fontWeight: 700, fontSize: "var(--font-2xs)", letterSpacing: "0.05em" }} className="px-2.5 py-1 bg-muted/40 border border-border text-muted-foreground/60 rounded-md">
                {method}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            <Link href="/privacy-policy" style={{ fontWeight: 400, fontSize: "var(--font-xs-up)" }} className="text-muted-foreground/60 hover:text-foreground/50 transition-colors">{t("home.footer.privacy")}</Link>
            <Link href="/terms-of-use" style={{ fontWeight: 400, fontSize: "var(--font-xs-up)" }} className="text-muted-foreground/60 hover:text-foreground/50 transition-colors">{t("home.footer.terms")}</Link>
            <Link href="/cookies" style={{ fontWeight: 400, fontSize: "var(--font-xs-up)" }} className="text-muted-foreground/60 hover:text-foreground/50 transition-colors">{t("home.footer.cookies")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
