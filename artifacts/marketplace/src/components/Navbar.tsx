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
import { useGetCart, getGetCartQueryKey, useGetUnreadCount } from "@workspace/api-client-react";
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
  const { setTheme, theme, resolvedTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRtl = lang === "ar";
  const isDark = resolvedTheme === "dark";

  /* ── Theme-aware nav tokens ──────────────────────────────────────────── */
  const navFg         = isDark ? "text-white"          : "text-foreground";
  const navFgMuted    = isDark ? "text-white/50"        : "text-foreground/55";
  const navFgSub      = isDark ? "text-white/45"        : "text-foreground/50";
  const navHoverFg    = isDark ? "hover:text-white"     : "hover:text-foreground";
  const navHoverFgMid = isDark ? "hover:text-white/80"  : "hover:text-foreground/80";
  const navHoverBg    = isDark ? "hover:bg-white/[0.05]" : "hover:bg-foreground/[0.05]";
  const navDivider    = isDark ? "bg-white/[0.08]"      : "bg-foreground/[0.1]";
  const navBorder     = isDark ? "border-white/[0.08]"  : "border-foreground/[0.09]";
  const navBorderHov  = isDark ? "hover:border-white/[0.14]" : "hover:border-foreground/[0.16]";
  const navInputColor = isDark ? "rgba(255,255,255,0.75)" : "rgba(17,24,39,0.72)";
  const navSearchBg   = isDark
    ? "bg-white/[0.06] hover:bg-white/[0.08] focus-within:bg-white/[0.08] border border-white/[0.08] focus-within:border-white/[0.14]"
    : "bg-foreground/[0.04] hover:bg-foreground/[0.06] focus-within:bg-foreground/[0.06] border border-foreground/[0.09] focus-within:border-foreground/[0.16]";
  const navSearchIcon  = isDark ? "text-white/30"  : "text-foreground/35";
  const navXBtn        = isDark ? "text-white/30 hover:text-white/60"  : "text-foreground/35 hover:text-foreground/60";
  const navDropBg      = isDark ? "bg-[#111] border-white/[0.1]"       : "bg-popover border-border";
  const navDropText    = isDark ? "text-white/90"  : "text-foreground/90";
  const navDropSub     = isDark ? "text-white/35"  : "text-muted-foreground";
  const navDropMeta    = isDark ? "text-white/30"  : "text-foreground/30";
  const navDropRecent  = isDark ? "text-white/60"  : "text-foreground/65";
  const navSettingsBtn = isDark
    ? "text-white/50 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.14]"
    : "text-foreground/55 hover:text-foreground hover:bg-foreground/[0.05] border border-foreground/[0.09] hover:border-foreground/[0.16]";
  const navUserBtn     = isDark
    ? "bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.09] hover:border-white/[0.15]"
    : "bg-foreground/[0.04] border border-foreground/[0.1] hover:bg-foreground/[0.07] hover:border-foreground/[0.15]";
  const navLoginLink   = isDark
    ? "text-white/60 hover:text-white hover:bg-white/[0.06]"
    : "text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05]";

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
  const { data: unreadData } = useGetUnreadCount({ query: { enabled: isAuthenticated, refetchInterval: 15_000 } });
  const unreadMsgCount = unreadData?.unread ?? 0;

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

  /* ── Header style: theme-aware glassmorphism ─────────────────────────────── */
  const headerStyle: React.CSSProperties = isDark
    ? {
        background: scrolled ? "rgba(8,8,8,0.90)" : "rgba(8,8,8,0.78)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(255,255,255,0.04)",
        transition: "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        boxShadow: scrolled ? "0 4px 40px rgba(0,0,0,0.5)" : "none",
      }
    : {
        background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        transition: "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(0,0,0,0.04)" : "0 1px 0 rgba(0,0,0,0.05)",
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
        <div className="md:hidden flex h-[3.75rem] items-center justify-between px-4 gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Syano home">
            <img src="/syano-logo.png" alt="" width={30} height={30}
              className="h-[1.875rem] w-[1.875rem] object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" loading="eager" />
            <span style={{ fontWeight: 800, letterSpacing: "0.1em", fontSize: "1rem" }} className={` uppercase`}>SYANO</span>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            {!isAuthPage && (
              <button onClick={() => setSearchOpen(!searchOpen)}
                className={`h-10 w-10 flex items-center justify-center ${navFgMuted} ${navHoverFg} transition-colors`}>
                <Search className="h-[1.1rem] w-[1.1rem]" />
              </button>
            )}
            {isAuthenticated && <NotificationCenter />}
            {!isSeller && !isAdmin && !isCourier && (
              <Link href="/wishlist" className={`relative h-10 w-10 flex items-center justify-center ${navFgMuted} ${navHoverFg} transition-colors`}>
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-[1rem] w-[1rem] items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}
            {!isSeller && !isAdmin && !isCourier && (
              <Link href="/cart" className={`relative h-10 w-10 flex items-center justify-center ${navFgMuted} ${navHoverFg} transition-colors`}>
                <ShoppingCart className="h-5 w-5" />
                {visibleCartCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-[1rem] w-[1rem] items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                    {visibleCartCount}
                  </span>
                )}
              </Link>
            )}
            <SheetTrigger asChild>
              <button className={`h-10 w-10 flex items-center justify-center ${navFgMuted} ${navHoverFg} transition-colors`}>
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
              <form onSubmit={handleSearchSubmit} className={`flex items-center gap-2 ${isDark ? "bg-white/[0.07] border-white/[0.12]" : "bg-foreground/[0.05] border-foreground/[0.12]"} border rounded-xl px-3 h-10`}>
                <Search className={`w-4 h-4 ${navSearchIcon} shrink-0`} />
                <input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); }}
                  placeholder={isRtl ? "ابحث عن منتجات..." : "Search products..."}
                  style={{ fontFamily: "'Cairo', sans-serif", fontSize: "0.875rem", background: "transparent", outline: "none", border: "none", color: navInputColor, flex: 1 }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className={navXBtn}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
              {searchOpen && debouncedSearch.length >= 2 && suggestions.length > 0 && (
                <div className={`absolute top-full mt-1 left-0 right-0 ${navDropBg} rounded-xl shadow-2xl z-50 overflow-hidden`}>
                  {suggestions.slice(0, 5).map(p => (
                    <button key={p.id} onClick={() => handleSuggestionClick(p.id, p.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 ${navHoverBg} text-start`}>
                      {p.imageUrl && <img src={p.imageUrl} alt="" className={`h-8 w-8 rounded-lg object-cover border ${navBorder}`} />}
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600 }} className={`${navDropText} truncate`}>{p.name}</div>
                        <div style={{ fontSize: "11px" }} className={navDropSub}>{p.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ DESKTOP NAV (≥ md) ═════════════════════════════════════════════ */}
        <div
          className="container hidden md:grid h-[4rem] items-center gap-3"
          style={{ gridTemplateColumns: "auto 1fr auto" }}
          dir={isRtl ? "rtl" : "ltr"}
        >

          {/* ── COL 1 → renders on the RIGHT in RTL: Logo + Nav links ─────────── */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Logo — far right in RTL (first in DOM = rightmost in RTL flow) */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <img src="/syano-logo.png" alt="Syano" width={30} height={30}
                className="h-[1.875rem] w-[1.875rem] object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.75)] group-hover:drop-shadow-[0_0_18px_rgba(16,185,129,1)] transition-[filter] duration-200" loading="eager" />
              <div>
                <div style={{ fontWeight: 800, letterSpacing: "0.1em", fontSize: "0.9375rem", lineHeight: 1 }} className={`${navFg} uppercase`}>SYANO</div>
                <div style={{ fontWeight: 400, fontSize: "8px", letterSpacing: "0.16em" }} className="text-emerald-400/60 uppercase">سوق سوريا</div>
              </div>
            </Link>

            {/* Divider */}
            <div className={`h-5 w-px ${navDivider} mx-1`} />

            {/* Nav links — immediately left of logo in RTL */}
            <nav className="flex items-center gap-0.5">
              {navLinks.map(link => {
                const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href.split("?")[0]));
                return (
                  <Link key={link.href} href={link.href}
                    style={{ fontWeight: isActive ? 700 : 500, fontSize: "0.8125rem" }}
                    className={cn(
                      "px-3 py-2 rounded-lg transition-colors duration-150 whitespace-nowrap",
                      isActive ? "text-emerald-400 bg-emerald-500/[0.08]" : `${navFgSub} ${navHoverFgMid} ${navHoverBg}`
                    )}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ── COL 2 → CENTER: Search bar ───────────────────────────────────── */}
          {!isAuthPage ? (
            <div ref={searchRef} className="relative flex justify-center">
              <div className="relative w-full max-w-[18.75rem]">
                <form onSubmit={handleSearchSubmit}>
                  <div className={`flex items-center gap-2 ${navSearchBg} rounded-full h-9 px-3.5 transition-all duration-200`}>
                    <Search className={`w-3.5 h-3.5 ${navSearchIcon} shrink-0`} />
                    <input
                      ref={inputRef}
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                      onFocus={() => setSearchOpen(true)}
                      placeholder={isRtl ? "ابحث عن منتجات..." : "Search products..."}
                      style={{ fontFamily: "'Cairo', sans-serif", fontSize: "0.8125rem", background: "transparent", outline: "none", border: "none", color: navInputColor, flex: 1, minWidth: 0 }}
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => { setSearchQuery(""); setSearchOpen(false); }} className={`${navXBtn} shrink-0`}>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </form>

                {searchOpen && (debouncedSearch.length >= 2 || recentSearches.length > 0) && (
                  <div className={`absolute top-full mt-2 left-0 right-0 ${navDropBg} rounded-2xl shadow-2xl z-50 overflow-hidden`}>
                    {debouncedSearch.length >= 2 ? (
                      searchLoading && suggestions.length === 0 ? (
                        <div className={`p-4 text-sm ${navDropMeta} text-center flex items-center justify-center gap-2`}>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                          {isRtl ? "جاري البحث..." : "Searching..."}
                        </div>
                      ) : !suggestions || suggestions.length === 0 ? (
                        <div className={`p-4 text-sm ${navDropMeta} text-center`}>{isRtl ? "لا توجد نتائج" : "No results found"}</div>
                      ) : (
                        <div className="py-1.5 max-h-72 overflow-y-auto">
                          {suggestions.slice(0, 6).map(p => (
                            <button key={p.id} onClick={() => handleSuggestionClick(p.id, p.name)}
                              className={`w-full flex items-center gap-3 px-3.5 py-2.5 ${navHoverBg} transition-colors`} style={{ textAlign: isRtl ? "right" : "left" }}>
                              {p.imageUrl && <img src={p.imageUrl} alt="" className={`h-9 w-9 rounded-lg object-cover border ${navBorder} shrink-0`} />}
                              <div className="flex-1 min-w-0">
                                <div style={{ fontSize: "0.8125rem", fontWeight: 600 }} className={`${navDropText} truncate`}>{p.name}</div>
                                <div style={{ fontSize: "11px" }} className={navDropSub}>{p.category}</div>
                              </div>
                              <div style={{ fontSize: "0.8125rem", fontWeight: 700 }} className="text-emerald-400 shrink-0">{p.finalPrice.toLocaleString()} ل.س</div>
                            </button>
                          ))}
                          <button onClick={handleSearchSubmit as any}
                            className={`w-full px-3.5 py-2.5 text-sm text-emerald-400 font-semibold ${navHoverBg} transition-colors border-t ${navBorder} flex items-center gap-2`}>
                            <Search className="h-3.5 w-3.5" />
                            {isRtl ? `بحث عن "${debouncedSearch}"` : `Search for "${debouncedSearch}"`}
                          </button>
                        </div>
                      )
                    ) : recentSearches.length > 0 ? (
                      <div className="py-1.5">
                        <div className="flex items-center justify-between px-3.5 pt-2 pb-1">
                          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }} className={`${navDropMeta} uppercase flex items-center gap-1.5`}>
                            <Clock className="h-3 w-3" /> {isRtl ? "البحث السابق" : "Recent"}
                          </span>
                          <button onClick={clearRecentSearches} style={{ fontSize: "11px" }} className={`${navXBtn} transition-colors`}>
                            {isRtl ? "مسح الكل" : "Clear all"}
                          </button>
                        </div>
                        {recentSearches.map(s => (
                          <div key={s} className="flex items-center group">
                            <button onClick={() => { setSearchQuery(s); setSearchOpen(true); }}
                              className={`flex-1 flex items-center gap-2.5 px-3.5 py-2 ${navHoverBg} transition-colors`}>
                              <Clock className={`h-3.5 w-3.5 ${navDropMeta} shrink-0`} />
                              <span style={{ fontSize: "0.8125rem" }} className={`${navDropRecent} truncate`}>{s}</span>
                            </button>
                            <button onClick={() => removeRecentSearch(s)}
                              className={`px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity ${navXBtn}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : <div />}

          {/* ── COL 3 → renders on the LEFT in RTL: Actions + Auth buttons ──── */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Messages — authenticated users (not couriers) */}
            {isAuthenticated && !isCourier && (
              <Link
                href={isAdmin ? "/admin/messages" : isSeller ? "/seller/messages" : "/messages"}
                className={`relative h-9 w-9 flex items-center justify-center rounded-lg ${navSettingsBtn} transition-all duration-200`}
                aria-label={isRtl ? "الرسائل" : "Messages"}
              >
                <MessageCircle className="h-[1.0625rem] w-[1.0625rem]" />
                {unreadMsgCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-[1rem] w-[1rem] items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white pointer-events-none">
                    {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                  </span>
                )}
              </Link>
            )}

            {/* Wishlist — customers and guests (not sellers/admins/couriers) */}
            {!isSeller && !isAdmin && !isCourier && (
              <Link href="/wishlist"
                className={`relative h-9 w-9 flex items-center justify-center rounded-lg ${navSettingsBtn} transition-all duration-200`}
                aria-label={isRtl ? "قائمة الأمنيات" : "Wishlist"}>
                <Heart className="h-[1.0625rem] w-[1.0625rem]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-[1rem] w-[1rem] items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white pointer-events-none">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart — customers and guests */}
            {!isSeller && !isAdmin && !isCourier && (
              <Link href="/cart"
                className={`relative h-9 w-9 flex items-center justify-center rounded-lg ${navSettingsBtn} transition-all duration-200`}
                aria-label={isRtl ? "سلة التسوق" : "Cart"}>
                <ShoppingCart className="h-[1.0625rem] w-[1.0625rem]" />
                {visibleCartCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-[1rem] w-[1rem] items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black pointer-events-none">
                    {visibleCartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Settings dropdown — icon only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`h-9 w-9 flex items-center justify-center rounded-lg ${navSettingsBtn} transition-all duration-200`}
                  aria-label={isRtl ? "الإعدادات" : "Settings"}
                >
                  <Settings className="h-[1.0625rem] w-[1.0625rem]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="bg-popover border-border shadow-xl shadow-black/10 w-56 p-0 overflow-hidden">

                {/* Theme */}
                <div className="px-3 pt-3 pb-2">
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }} className="text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                    <Sun className="h-3 w-3" /> {isRtl ? "المظهر" : "Theme"}
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {([
                      { val: "light", ar: "فاتح", en: "Light" },
                      { val: "dark", ar: "داكن", en: "Dark" },
                      { val: "system", ar: "تلقائي", en: "Auto" },
                    ] as const).map(opt => (
                      <button key={opt.val} onClick={() => setTheme(opt.val)}
                        style={{ fontSize: "11px", fontWeight: 600 }}
                        className={cn(
                          "py-1.5 rounded-lg transition-colors",
                          theme === opt.val
                            ? "bg-emerald-500 text-black"
                            : "bg-secondary text-foreground/60 hover:bg-secondary/70 hover:text-foreground"
                        )}>
                        {isRtl ? opt.ar : opt.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border mx-3" />

                {/* Language */}
                <div className="px-3 py-2">
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }} className="text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> {isRtl ? "اللغة" : "Language"}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {([
                      { val: "ar", label: "العربية" },
                      { val: "en", label: "English" },
                    ] as const).map(opt => (
                      <button key={opt.val} onClick={() => switchLanguage(opt.val)}
                        style={{ fontSize: "11px", fontWeight: 600 }}
                        className={cn(
                          "py-1.5 rounded-lg transition-colors",
                          lang === opt.val
                            ? "bg-emerald-500 text-black"
                            : "bg-secondary text-foreground/60 hover:bg-secondary/70 hover:text-foreground"
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border mx-3" />

                {/* Currency */}
                <div className="px-3 py-2 pb-3">
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }} className="text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3" /> {isRtl ? "العملة" : "Currency"}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {([
                      { val: "SYP", label: "ل.س SYP" },
                      { val: "USD", label: "$ USD" },
                    ] as const).map(opt => (
                      <button key={opt.val} onClick={() => setCurrency(opt.val)}
                        style={{ fontSize: "11px", fontWeight: 600 }}
                        className={cn(
                          "py-1.5 rounded-lg transition-colors",
                          currency === opt.val
                            ? "bg-emerald-500 text-black"
                            : "bg-secondary text-foreground/60 hover:bg-secondary/70 hover:text-foreground"
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </DropdownMenuContent>
            </DropdownMenu>

            {/* Divider */}
            <div className={`w-px h-5 mx-0.5 ${navDivider}`} />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-2 h-9 ps-2 pe-3 rounded-full ${navUserBtn} transition-all duration-200`}>
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <span style={{ fontSize: "11px", fontWeight: 800 }} className="text-emerald-400">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, maxWidth: 80 }} className={`${navFgMuted} truncate`}>{user?.name}</span>
                    <ChevronDown className={`h-3 w-3 ${navDropMeta}`} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border shadow-xl shadow-black/10 w-52">
                  <div className="px-3 py-2.5 border-b border-border">
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700 }} className="text-foreground">{user?.name}</p>
                    <p style={{ fontSize: "11px" }} className="text-muted-foreground truncate" translate="no">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="text-foreground/70 focus:text-foreground focus:bg-muted/60 cursor-pointer mt-1">
                    <Link href={isAdmin ? "/admin" : isSeller ? "/seller/dashboard" : isCourier ? "/courier/dashboard" : "/customer/dashboard"}
                      className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> {t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  {isCustomer && (
                    <DropdownMenuItem asChild className="text-foreground/70 focus:text-foreground focus:bg-muted/60 cursor-pointer">
                      <Link href="/orders" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" /> {t("nav.orders")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={logout} className="text-rose-500 focus:text-rose-600 focus:bg-rose-500/[0.08] cursor-pointer">
                    <LogOut className="me-2 h-4 w-4" /> {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login"
                  style={{ fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.01em" }}
                  className={`h-9 px-4 flex items-center rounded-lg ${navLoginLink} transition-colors whitespace-nowrap`}>
                  {t("nav.login")}
                </Link>
                <Link href="/register"
                  style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.01em" }}
                  className="h-9 px-5 flex items-center rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] text-black transition-all duration-150 shadow-sm shadow-emerald-500/30 whitespace-nowrap">
                  {t("nav.signup")}
                </Link>
              </>
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
            {isCustomer && (
              <Link href="/messages" onClick={closeMobileMenu}>
                <div className={cn(
                  "flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                  location === "/messages" ? "bg-emerald-500/10 text-emerald-400" : "text-white/60 hover:text-white hover:bg-white/[0.06]",
                )}>
                  <span className="relative">
                    <MessageCircle className="h-5 w-5 shrink-0" />
                    {unreadMsgCount > 0 && (
                      <span className="absolute -top-1 -end-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
                        {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                      </span>
                    )}
                  </span>
                  {isRtl ? "الرسائل" : "Messages"}
                </div>
              </Link>
            )}
            {isSeller && (
              <Link href="/seller/messages" onClick={closeMobileMenu}>
                <div className={cn(
                  "flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                  location === "/seller/messages" ? "bg-emerald-500/10 text-emerald-400" : "text-white/60 hover:text-white hover:bg-white/[0.06]",
                )}>
                  <span className="relative">
                    <MessageCircle className="h-5 w-5 shrink-0" />
                    {unreadMsgCount > 0 && (
                      <span className="absolute -top-1 -end-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
                        {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                      </span>
                    )}
                  </span>
                  {isRtl ? "الرسائل" : "Messages"}
                </div>
              </Link>
            )}
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
