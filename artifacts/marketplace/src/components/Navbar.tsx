// @refresh reset
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  ShoppingCart, LogOut, LayoutDashboard, Search, X, Globe, Sun, Moon, DollarSign,
  Menu, Home, Package, ClipboardList, Warehouse, Clock, MessageCircle,
  Users, Store, BarChart2, ScrollText, Settings, Heart, ChevronDown, Bike,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useWishlist } from "@/contexts/WishlistContext";
import { useTranslation } from "react-i18next";
import { applyDirection } from "@/i18n";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/use-search";

/* ── MobileNavLink ─────────────────────────────────────────────────────────── */
interface MobileNavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  location: string;
  onClose: () => void;
}

const MobileNavLink = React.memo(function MobileNavLink({ href, icon: Icon, label, location, onClose }: MobileNavLinkProps) {
  return (
    <Link href={href} onClick={onClose}>
      <div className={cn(
        "flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
        location === href || (href !== "/" && location.startsWith(href))
          ? "bg-emerald-500/10 text-emerald-400"
          : "text-white/60 hover:text-white hover:bg-white/[0.06]",
      )}>
        <Icon className="h-5 w-5 shrink-0" />
        {label}
      </div>
    </Link>
  );
});

export function Navbar() {
  const [location, navigate] = useLocation();
  const { user, logout, isAuthenticated, isCustomer, isSeller, isAdmin, isCourier } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { setTheme, theme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRtl = lang === "ar";

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("syano_recent_searches") || "[]"); } catch { return []; }
  });

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const switchLanguage = (l: string) => { i18n.changeLanguage(l); applyDirection(l); };

  useEffect(() => { applyDirection(i18n.language); }, [i18n.language]);
  useEffect(() => { if (searchOpen && inputRef.current) inputRef.current.focus(); }, [searchOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveRecentSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches(prev => {
      const next = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 6);
      try { localStorage.setItem("syano_recent_searches", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try { localStorage.removeItem("syano_recent_searches"); } catch {}
  }, []);

  const removeRecentSearch = useCallback((q: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(s => s !== q);
      try { localStorage.setItem("syano_recent_searches", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const { data: cart } = useGetCart({ query: { queryKey: getGetCartQueryKey(), enabled: isCustomer } });
  const cartItemCount = cart?.itemCount || 0;
  const { guestTotal } = useGuestCart();
  const visibleCartCount = isAuthenticated ? cartItemCount : guestTotal;

  const { results: suggestions, isLoading: searchLoading } = useSearch(debouncedSearch);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }, [searchQuery, navigate, saveRecentSearch]);

  const handleSuggestionClick = useCallback((productId: number, productName?: string) => {
    if (productName) saveRecentSearch(productName);
    navigate(`/products/${productId}`);
    setSearchOpen(false);
    setSearchQuery("");
  }, [navigate, saveRecentSearch]);

  const AUTH_PATHS = ["/login", "/register"];
  const isAuthPage = AUTH_PATHS.includes(location);

  const sellerLinks = useMemo(() => [
    { href: "/seller/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { href: "/seller/products", icon: Package, label: t("nav.products") },
    { href: "/seller/orders", icon: ClipboardList, label: t("nav.orders") },
    { href: "/seller/inventory", icon: Warehouse, label: t("nav.inventory") },
  ], [t]);

  const adminLinks = useMemo(() => [
    { href: "/admin", icon: LayoutDashboard, label: t("admin.nav_dashboard") },
    { href: "/admin/users", icon: Users, label: t("admin.nav_users") },
    { href: "/admin/sellers", icon: Store, label: t("admin.nav_sellers") },
    { href: "/admin/products", icon: Package, label: t("admin.nav_products") },
    { href: "/admin/orders", icon: ShoppingCart, label: t("admin.nav_orders") },
    { href: "/admin/analytics", icon: BarChart2, label: t("admin.nav_analytics") },
    { href: "/admin/logs", icon: ScrollText, label: t("admin.nav_logs") },
    { href: "/admin/settings", icon: Settings, label: t("admin.nav_settings") },
  ], [t]);

  const customerLinks = useMemo(() => [
    { href: "/customer/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { href: "/orders", icon: ClipboardList, label: t("nav.orders") },
  ], [t]);

  /* ── Header style: glassmorphism dark always ─────────────────────────────── */
  const headerStyle: React.CSSProperties = {
    background: scrolled ? "rgba(8,8,8,0.88)" : "rgba(8,8,8,0.75)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(255,255,255,0.04)",
    transition: "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
    boxShadow: scrolled ? "0 4px 40px rgba(0,0,0,0.5)" : "none",
  };

  const navLinks = isRtl
    ? [
      { href: "/", label: "الرئيسية" },
      { href: "/products", label: "المنتجات" },
      { href: "/sellers/directory", label: "المتاجر" },
      { href: "/products?hasDiscount=true", label: "العروض" },
    ]
    : [
      { href: "/", label: "Home" },
      { href: "/products", label: "Products" },
      { href: "/sellers/directory", label: "Stores" },
      { href: "/products?hasDiscount=true", label: "Deals" },
    ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full"
      style={{ ...headerStyle, fontFamily: "'Cairo', sans-serif" }}
    >
      {/* Safe area spacer for iOS notch */}
      <div aria-hidden="true" className="w-full md:hidden" style={{ height: "env(safe-area-inset-top, 0px)" }} />

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>

        {/* ══ MOBILE NAV (< md) ══════════════════════════════════════════════ */}
        <div className="md:hidden flex h-[60px] items-center justify-between px-4 gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Syano home">
            <img src="/syano-logo.png" alt="" width={30} height={30}
              className="h-[30px] w-[30px] object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" loading="eager" />
            <span style={{ fontWeight: 800, letterSpacing: "0.1em", fontSize: "16px" }} className="text-white uppercase">SYANO</span>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            {!isAuthPage && (
              <button onClick={() => setSearchOpen(!searchOpen)}
                className="h-10 w-10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <Search className="h-[1.1rem] w-[1.1rem]" />
              </button>
            )}
            {isAuthenticated && <NotificationCenter />}
            {isCustomer && (
              <Link href="/wishlist" className="relative h-10 w-10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}
            {!isSeller && !isAdmin && !isCourier && (
              <Link href="/cart" className="relative h-10 w-10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {visibleCartCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                    {visibleCartCount}
                  </span>
                )}
              </Link>
            )}
            <SheetTrigger asChild>
              <button className="h-10 w-10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </button>
            </SheetTrigger>
          </div>
        </div>

        {/* Mobile search expandable */}
        {searchOpen && !isAuthPage && (
          <div className="md:hidden px-4 pb-3">
            <div ref={searchRef} className="relative">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-white/[0.07] border border-white/[0.12] rounded-xl px-3 h-10">
                <Search className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); }}
                  placeholder={isRtl ? "ابحث عن منتجات..." : "Search products..."}
                  style={{ fontFamily: "'Cairo', sans-serif", fontSize: "14px", background: "transparent", outline: "none", border: "none", color: "rgba(255,255,255,0.8)", flex: 1 }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="text-white/30 hover:text-white/60">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
              {searchOpen && debouncedSearch.length >= 2 && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#141414] border border-white/[0.1] rounded-xl shadow-2xl z-50 overflow-hidden">
                  {suggestions.slice(0, 5).map(p => (
                    <button key={p.id} onClick={() => handleSuggestionClick(p.id, p.name)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] text-start">
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover border border-white/[0.08]" />}
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: "13px", fontWeight: 600 }} className="text-white truncate">{p.name}</div>
                        <div style={{ fontSize: "11px" }} className="text-white/35">{p.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ DESKTOP NAV (≥ md) ═════════════════════════════════════════════ */}
        <div className="container hidden md:flex h-[72px] items-center justify-between gap-4" dir={isRtl ? "rtl" : "ltr"}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <img src="/syano-logo.png" alt="Syano" width={32} height={32}
              className="h-8 w-8 object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.75)] group-hover:drop-shadow-[0_0_18px_rgba(16,185,129,1)] transition-[filter] duration-200" loading="eager" />
            <div>
              <div style={{ fontWeight: 800, letterSpacing: "0.1em", fontSize: "17px", lineHeight: 1 }} className="text-white uppercase">SYANO</div>
              <div style={{ fontWeight: 400, fontSize: "9px", letterSpacing: "0.16em" }} className="text-emerald-400/60 uppercase">سوق سوريا</div>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href.split("?")[0]));
              return (
                <Link key={link.href} href={link.href}
                  style={{ fontWeight: isActive ? 700 : 500, fontSize: "14px" }}
                  className={cn(
                    "px-3.5 py-2 rounded-lg transition-colors duration-150",
                    isActive ? "text-emerald-400 bg-emerald-500/[0.08]" : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
                  )}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Search pill */}
          {!isAuthPage && (
            <div ref={searchRef} className="relative flex-1 max-w-[420px]">
              <form onSubmit={handleSearchSubmit}>
                <div className="flex items-center gap-2.5 bg-white/[0.06] hover:bg-white/[0.08] focus-within:bg-white/[0.08] border border-white/[0.08] focus-within:border-white/[0.14] rounded-full h-10 px-4 transition-all duration-200">
                  <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder={isRtl ? "ابحث عن منتجات، متاجر..." : "Search products, stores..."}
                    style={{ fontFamily: "'Cairo', sans-serif", fontSize: "13px", background: "transparent", outline: "none", border: "none", color: "rgba(255,255,255,0.75)", flex: 1, minWidth: 0 }}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => { setSearchQuery(""); setSearchOpen(false); }} className="text-white/30 hover:text-white/60 shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </form>

              {/* Dropdown */}
              {searchOpen && (debouncedSearch.length >= 2 || recentSearches.length > 0) && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-[#111] border border-white/[0.1] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {debouncedSearch.length >= 2 ? (
                    searchLoading && suggestions.length === 0 ? (
                      <div className="p-4 text-sm text-white/40 text-center flex items-center justify-center gap-2">
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        {isRtl ? "جاري البحث..." : "Searching..."}
                      </div>
                    ) : !suggestions || suggestions.length === 0 ? (
                      <div className="p-4 text-sm text-white/40 text-center">{isRtl ? "لا توجد نتائج" : "No results found"}</div>
                    ) : (
                      <div className="py-1.5 max-h-72 overflow-y-auto">
                        {suggestions.slice(0, 6).map(p => (
                          <button key={p.id} onClick={() => handleSuggestionClick(p.id, p.name)}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/[0.05] transition-colors" style={{ textAlign: isRtl ? "right" : "left" }}>
                            {p.imageUrl && <img src={p.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover border border-white/[0.08] shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div style={{ fontSize: "13px", fontWeight: 600 }} className="text-white/90 truncate">{p.name}</div>
                              <div style={{ fontSize: "11px" }} className="text-white/35">{p.category}</div>
                            </div>
                            <div style={{ fontSize: "13px", fontWeight: 700 }} className="text-emerald-400 shrink-0">{p.finalPrice.toLocaleString()} ل.س</div>
                          </button>
                        ))}
                        <button onClick={handleSearchSubmit as any}
                          className="w-full px-3.5 py-2.5 text-sm text-emerald-400 font-semibold hover:bg-white/[0.04] transition-colors border-t border-white/[0.06] flex items-center gap-2">
                          <Search className="h-3.5 w-3.5" />
                          {isRtl ? `بحث عن "${debouncedSearch}"` : `Search for "${debouncedSearch}"`}
                        </button>
                      </div>
                    )
                  ) : recentSearches.length > 0 ? (
                    <div className="py-1.5">
                      <div className="flex items-center justify-between px-3.5 pt-2 pb-1">
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }} className="text-white/30 uppercase flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {isRtl ? "البحث السابق" : "Recent"}
                        </span>
                        <button onClick={clearRecentSearches} style={{ fontSize: "11px" }} className="text-white/30 hover:text-white/60 transition-colors">
                          {isRtl ? "مسح الكل" : "Clear all"}
                        </button>
                      </div>
                      {recentSearches.map(s => (
                        <div key={s} className="flex items-center group">
                          <button onClick={() => { setSearchQuery(s); setSearchOpen(true); }}
                            className="flex-1 flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/[0.04] transition-colors">
                            <Clock className="h-3.5 w-3.5 text-white/20 shrink-0" />
                            <span style={{ fontSize: "13px" }} className="text-white/60 truncate">{s}</span>
                          </button>
                          <button onClick={() => removeRecentSearch(s)}
                            className="px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/60">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Right controls */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 h-9 px-2.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors">
                  <Globe className="h-4 w-4" />
                  <span style={{ fontSize: "11px", fontWeight: 700 }}>{lang.toUpperCase()}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#111] border-white/[0.1] min-w-[120px]">
                <DropdownMenuItem onClick={() => switchLanguage("en")} className={cn("text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer", lang === "en" && "text-emerald-400 font-semibold")}>
                  🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLanguage("ar")} className={cn("text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer", lang === "ar" && "text-emerald-400 font-semibold")}>
                  🇸🇦 العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Currency */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 h-9 px-2.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors">
                  <span style={{ fontSize: "11px", fontWeight: 700 }} translate="no">{currency === "SYP" ? "ل.س" : "$"} {currency}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#111] border-white/[0.1] min-w-[130px]">
                <DropdownMenuItem onClick={() => setCurrency("SYP")} className={cn("text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer", currency === "SYP" && "text-emerald-400 font-semibold")}>
                  ل.س السوري
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrency("USD")} className={cn("text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer", currency === "USD" && "text-emerald-400 font-semibold")}>
                  $ دولار
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#111] border-white/[0.1]">
                <DropdownMenuItem onClick={() => setTheme("light")} className="text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer">{t("theme.light")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer">{t("theme.dark")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer">{t("theme.system")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            {isAuthenticated && <NotificationCenter />}

            {/* Wishlist */}
            {isCustomer && (
              <Link href="/wishlist" className="relative h-9 w-9 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors">
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            {!isSeller && !isAdmin && !isCourier && (
              <Link href="/cart" className="relative h-9 w-9 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors">
                <ShoppingCart className="h-4 w-4" />
                {visibleCartCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                    {visibleCartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Role shortcuts */}
            {isSeller && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-500/[0.1] border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/[0.15] transition-colors">
                    <Store className="h-3.5 w-3.5" />
                    <span style={{ fontSize: "12px", fontWeight: 700 }}>{isRtl ? "متجري" : "Store"}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#111] border-white/[0.1] w-48">
                  {sellerLinks.map(l => (
                    <DropdownMenuItem key={l.href} asChild className="text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer">
                      <Link href={l.href} className="flex items-center gap-2">
                        <l.icon className="h-4 w-4" /> {l.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {isCourier && (
              <Link href="/courier/dashboard"
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-blue-500/[0.1] border border-blue-500/20 text-blue-400 hover:bg-blue-500/[0.15] transition-colors">
                <Bike className="h-3.5 w-3.5" />
                <span style={{ fontSize: "12px", fontWeight: 700 }}>{isRtl ? "توصيلاتي" : "Deliveries"}</span>
              </Link>
            )}

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-purple-500/[0.1] border border-purple-500/20 text-purple-400 hover:bg-purple-500/[0.15] transition-colors">
                    <Settings className="h-3.5 w-3.5" />
                    <span style={{ fontSize: "12px", fontWeight: 700 }}>Admin</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#111] border-white/[0.1] w-48">
                  {adminLinks.map(l => (
                    <DropdownMenuItem key={l.href} asChild className="text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer">
                      <Link href={l.href} className="flex items-center gap-2">
                        <l.icon className="h-4 w-4" /> {l.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-9 ps-2 pe-3 rounded-full bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.09] hover:border-white/[0.15] transition-all duration-200">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <span style={{ fontSize: "11px", fontWeight: 800 }} className="text-emerald-400">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, maxWidth: 80 }} className="text-white/75 truncate">{user?.name}</span>
                    <ChevronDown className="h-3 w-3 text-white/30" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#111] border-white/[0.1] w-52">
                  <div className="px-3 py-2.5 border-b border-white/[0.07]">
                    <p style={{ fontSize: "13px", fontWeight: 700 }} className="text-white">{user?.name}</p>
                    <p style={{ fontSize: "11px" }} className="text-white/35 truncate" translate="no">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer mt-1">
                    <Link href={isAdmin ? "/admin" : isSeller ? "/seller/dashboard" : isCourier ? "/courier/dashboard" : "/customer/dashboard"}
                      className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> {t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  {isCustomer && (
                    <DropdownMenuItem asChild className="text-white/60 focus:text-white focus:bg-white/[0.06] cursor-pointer">
                      <Link href="/orders" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" /> {t("nav.orders")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/[0.07]" />
                  <DropdownMenuItem onClick={logout} className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/[0.08] cursor-pointer">
                    <LogOut className="me-2 h-4 w-4" /> {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ms-1">
                <Link href="/login"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                  className="h-9 px-4 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
                  {t("nav.login")}
                </Link>
                <Link href="/register"
                  style={{ fontSize: "13px", fontWeight: 700 }}
                  className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-colors shadow-lg shadow-emerald-500/20">
                  {t("nav.signup")}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ══ MOBILE DRAWER ════════════════════════════════════════════════════ */}
        <SheetContent side={isRtl ? "right" : "left"}
          className="w-[min(300px,78vw)] p-0 flex flex-col border-white/[0.08]"
          style={{ background: "#0d0d0d" }}
          aria-describedby={undefined}>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="relative flex flex-col items-center justify-center pt-10 pb-7 border-b border-white/[0.07] shrink-0 overflow-hidden">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />
            <img src="/syano-logo.png" alt="Syano" width={64} height={64}
              className="relative z-10 h-16 w-16 object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.75)]" loading="eager" />
            <p className="relative z-10 mt-3 text-xl font-black tracking-[0.28em] text-white uppercase">SYANO</p>
            <p className="relative z-10 mt-1 text-xs font-semibold tracking-[0.12em] text-emerald-400/60 uppercase">سوق سوريا</p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            <MobileNavLink href="/" icon={Home} label={isRtl ? "الرئيسية" : "Home"} location={location} onClose={closeMobileMenu} />
            <MobileNavLink href="/products" icon={Package} label={isRtl ? "المنتجات" : "Products"} location={location} onClose={closeMobileMenu} />
            <MobileNavLink href="/sellers/directory" icon={Store} label={isRtl ? "المتاجر" : "Stores"} location={location} onClose={closeMobileMenu} />
            {isAdmin && adminLinks.map(l => <MobileNavLink key={l.href} {...l} location={location} onClose={closeMobileMenu} />)}
            {isSeller && sellerLinks.map(l => <MobileNavLink key={l.href} {...l} location={location} onClose={closeMobileMenu} />)}
            {isCourier && <MobileNavLink href="/courier/dashboard" icon={Bike} label={isRtl ? "لوحة التوصيل" : "Courier"} location={location} onClose={closeMobileMenu} />}
            {isCustomer && customerLinks.map(l => <MobileNavLink key={l.href} {...l} location={location} onClose={closeMobileMenu} />)}
            {isCustomer && <MobileNavLink href="/cart" icon={ShoppingCart} label={isRtl ? "السلة" : "Cart"} location={location} onClose={closeMobileMenu} />}
            {isCustomer && <MobileNavLink href="/messages" icon={MessageCircle} label={isRtl ? "الرسائل" : "Messages"} location={location} onClose={closeMobileMenu} />}
          </div>

          <div className="px-3 py-2 border-t border-white/[0.07] space-y-0.5">
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }} className="text-white/25 uppercase px-3 mb-1 pt-1">
              {isRtl ? "التفضيلات" : "Preferences"}
            </p>
            {/* Language */}
            <div className="grid [grid-template-columns:auto_1fr_auto] items-center gap-x-3 px-3 min-h-[44px]">
              <Globe className="h-5 w-5 text-white/30" />
              <span style={{ fontSize: "14px", fontWeight: 500 }} className="text-white/60">{isRtl ? "اللغة" : "Language"}</span>
              <div className="flex gap-1">
                {["en", "ar"].map(l => (
                  <button key={l} onClick={() => switchLanguage(l)}
                    className={cn("px-2.5 py-0.5 rounded text-xs font-bold transition-colors",
                      lang === l ? "bg-emerald-500 text-black" : "bg-white/[0.07] text-white/40 hover:bg-white/[0.12]")}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {/* Currency */}
            <div className="grid [grid-template-columns:auto_1fr_auto] items-center gap-x-3 px-3 min-h-[44px]">
              <DollarSign className="h-5 w-5 text-white/30" />
              <span style={{ fontSize: "14px", fontWeight: 500 }} className="text-white/60">{isRtl ? "العملة" : "Currency"}</span>
              <div className="flex gap-1">
                {["USD", "SYP"].map(c => (
                  <button key={c} onClick={() => setCurrency(c as any)}
                    className={cn("px-2.5 py-0.5 rounded text-xs font-bold transition-colors",
                      currency === c ? "bg-emerald-500 text-black" : "bg-white/[0.07] text-white/40 hover:bg-white/[0.12]")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {/* Theme */}
            <div className="grid [grid-template-columns:auto_1fr_auto] items-center gap-x-3 px-3 min-h-[44px]">
              <Sun className="h-5 w-5 text-white/30" />
              <span style={{ fontSize: "14px", fontWeight: 500 }} className="text-white/60">{isRtl ? "المظهر" : "Theme"}</span>
              <div className="flex gap-1">
                {(["light", "dark", "system"] as const).map(tm => (
                  <button key={tm} onClick={() => setTheme(tm)}
                    className={cn("px-2 py-0.5 rounded text-xs font-bold transition-colors",
                      theme === tm ? "bg-emerald-500 text-black" : "bg-white/[0.07] text-white/40 hover:bg-white/[0.12]")}>
                    {tm[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-3 pb-safe-4 border-t border-white/[0.07] pt-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                    <span style={{ fontSize: "14px", fontWeight: 800 }} className="text-emerald-400">
                      {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: "14px", fontWeight: 600 }} className="text-white truncate">{user?.name}</p>
                    <p style={{ fontSize: "11px" }} className="text-white/30 truncate" translate="no">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors min-h-[44px]"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-1">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                  style={{ fontWeight: 600, fontSize: "14px" }}
                  className="flex items-center justify-center h-11 rounded-xl border border-white/[0.12] text-white/70 hover:text-white hover:border-white/[0.2] transition-colors">
                  {t("nav.login")}
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                  style={{ fontWeight: 700, fontSize: "14px" }}
                  className="flex items-center justify-center h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition-colors">
                  {t("nav.signup")}
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
