import { useState, useEffect } from "react";

const PRIMARY = "#059669";
const PRIMARY_DARK = "#047857";
const PRIMARY_LIGHT = "#d1fae5";
const HERO_BG = "#0f172a";
const BG = "#F9FAFB";
const CARD_BG = "#ffffff";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const BORDER = "#E5E7EB";

const MOCK_CATEGORIES = [
  { id: 1, name: "Electronics", icon: "💻", color: "#3B82F6", count: 2840 },
  { id: 2, name: "Fashion", icon: "👗", color: "#EC4899", count: 5210 },
  { id: 3, name: "Home & Kitchen", icon: "🏠", color: "#F59E0B", count: 1930 },
  { id: 4, name: "Beauty", icon: "💄", color: "#8B5CF6", count: 1120 },
  { id: 5, name: "Sports", icon: "⚽", color: "#10B981", count: 870 },
  { id: 6, name: "Automotive", icon: "🚗", color: "#6B7280", count: 640 },
  { id: 7, name: "Gaming", icon: "🎮", color: "#7C3AED", count: 420 },
  { id: 8, name: "Grocery", icon: "🛒", color: "#F97316", count: 3100 },
];

const MOCK_DEALS = [
  { id: 1, name: "Samsung Galaxy S24 FE", nameAr: "سامسونج جالاكسي", price: 180000, originalPrice: 280000, discount: 36, image: "📱", rating: 4.8, sold: 124, badge: "🔥 Hot" },
  { id: 2, name: "Sony WH-1000XM5 Headphones", nameAr: "سماعات سوني", price: 120000, originalPrice: 200000, discount: 40, image: "🎧", rating: 4.9, sold: 89, badge: "⚡ Flash" },
  { id: 3, name: "Nike Air Max 270 Shoes", nameAr: "نايك إير ماكس", price: 45000, originalPrice: 75000, discount: 40, image: "👟", rating: 4.7, sold: 231, badge: "🔥 Hot" },
  { id: 4, name: "Apple iPad 10th Gen", nameAr: "آبل آيباد", price: 320000, originalPrice: 420000, discount: 24, image: "📱", rating: 4.8, sold: 67, badge: "✨ New" },
  { id: 5, name: "Dyson V15 Vacuum", nameAr: "مكنسة دايسون", price: 210000, originalPrice: 320000, discount: 34, image: "🌀", rating: 4.6, sold: 43, badge: "⚡ Flash" },
];

const MOCK_BEST_SELLERS = [
  { id: 1, rank: 1, name: "iPhone 15 Pro Max 256GB", price: 750000, image: "📱", rating: 4.9, reviews: 512, seller: "Tech Store SY", sold: 1240 },
  { id: 2, rank: 2, name: "Samsung 65\" QLED TV", price: 580000, image: "📺", rating: 4.8, reviews: 287, seller: "Electronics Hub", sold: 890 },
  { id: 3, rank: 3, name: "Nespresso Vertuo Coffee", price: 95000, image: "☕", rating: 4.7, reviews: 641, seller: "Home Essentials", sold: 2100 },
  { id: 4, rank: 4, name: "Xiaomi Mi Band 8 Pro", price: 32000, image: "⌚", rating: 4.6, reviews: 893, seller: "Smart Gadgets", sold: 3400 },
];

const MOCK_STORES = [
  { id: 1, name: "Tech Store SY", slug: "tech-store-sy", category: "Electronics", followers: 4820, products: 284, rating: 4.9, reviews: 1240, verified: true, tier: "business", joined: "2024", avatar: "T", color: "#3B82F6" },
  { id: 2, name: "Fashion House Aleppo", slug: "fashion-house", category: "Fashion & Apparel", followers: 3210, products: 512, rating: 4.8, reviews: 876, verified: true, tier: "verified", joined: "2024", avatar: "F", color: "#EC4899" },
  { id: 3, name: "Home & Living SY", slug: "home-living-sy", category: "Home & Kitchen", followers: 2180, products: 193, rating: 4.7, reviews: 542, verified: true, tier: "verified", joined: "2025", avatar: "H", color: "#F59E0B" },
  { id: 4, name: "Beauty Corner", slug: "beauty-corner", category: "Beauty & Care", followers: 1540, products: 147, rating: 4.9, reviews: 321, verified: true, tier: "basic", joined: "2025", avatar: "B", color: "#8B5CF6" },
];

const MOCK_NEW_ARRIVALS = [
  { id: 1, name: "Logitech MX Keys S Keyboard", price: 48000, image: "⌨️", rating: 4.8, reviews: 34, isNew: true, seller: "Tech Store SY" },
  { id: 2, name: "Instant Pot Duo 7-in-1", price: 85000, image: "🍲", rating: 4.7, reviews: 28, isNew: true, seller: "Home Essentials" },
  { id: 3, name: "Adidas Ultraboost 24", price: 62000, image: "👟", rating: 4.6, reviews: 19, isNew: true, seller: "Sports World" },
  { id: 4, name: "Canon EOS R50 Camera", price: 420000, image: "📷", rating: 4.9, reviews: 12, isNew: true, seller: "Photo Pro SY" },
  { id: 5, name: "LEGO Technic Bugatti", price: 180000, image: "🧩", rating: 4.8, reviews: 8, isNew: true, seller: "Toys & Fun" },
  { id: 6, name: "Fossil Gen 6 Smartwatch", price: 95000, image: "⌚", rating: 4.5, reviews: 22, isNew: true, seller: "Smart Gadgets" },
];

const EXPLORE_CATEGORIES = [
  { name: "Electronics", icon: "💻", color: "#1E40AF", bg: "linear-gradient(135deg,#1e3a8a,#3b82f6)", count: 2840 },
  { name: "Fashion", icon: "👗", color: "#9D174D", bg: "linear-gradient(135deg,#831843,#ec4899)", count: 5210 },
  { name: "Home & Kitchen", icon: "🏠", color: "#92400E", bg: "linear-gradient(135deg,#78350f,#f59e0b)", count: 1930 },
  { name: "Beauty & Care", icon: "💄", color: "#5B21B6", bg: "linear-gradient(135deg,#4c1d95,#8b5cf6)", count: 1120 },
  { name: "Sports & Fitness", icon: "⚽", color: "#065F46", bg: "linear-gradient(135deg,#064e3b,#10b981)", count: 870 },
  { name: "Automotive", icon: "🚗", color: "#374151", bg: "linear-gradient(135deg,#1f2937,#6b7280)", count: 640 },
  { name: "Gaming", icon: "🎮", color: "#4C1D95", bg: "linear-gradient(135deg,#3b0764,#7c3aed)", count: 420 },
  { name: "Supermarket", icon: "🛒", color: "#C2410C", bg: "linear-gradient(135deg,#9a3412,#f97316)", count: 3100 },
  { name: "Books", icon: "📚", color: "#1E3A5F", bg: "linear-gradient(135deg,#1e3a5f,#60a5fa)", count: 760 },
  { name: "Toys & Games", icon: "🧸", color: "#7C2D12", bg: "linear-gradient(135deg,#7c2d12,#fb923c)", count: 540 },
  { name: "Health", icon: "💊", color: "#065F46", bg: "linear-gradient(135deg,#022c22,#34d399)", count: 820 },
  { name: "Furniture", icon: "🪑", color: "#44403C", bg: "linear-gradient(135deg,#292524,#78716c)", count: 380 },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#FBBF24", fontSize: 12 }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
    </span>
  );
}

function CountdownTimer() {
  const [time, setTime] = useState({ h: 4, m: 32, s: 17 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {[pad(time.h), pad(time.m), pad(time.s)].map((val, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{
            background: "#1f2937", color: "#fff", fontWeight: 700,
            fontSize: 18, padding: "4px 8px", borderRadius: 6, fontVariantNumeric: "tabular-nums",
            minWidth: 36, textAlign: "center",
          }}>{val}</span>
          {i < 2 && <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>:</span>}
        </span>
      ))}
    </div>
  );
}

function ProductCard({ product, showDiscount = false }: { product: any; showDiscount?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: CARD_BG, borderRadius: 16, border: `1px solid ${BORDER}`,
        overflow: "hidden", transition: "all 0.2s ease",
        boxShadow: hovered ? "0 8px 30px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-2px)" : "none",
        cursor: "pointer", display: "flex", flexDirection: "column",
      }}
    >
      <div style={{
        background: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
        height: 180, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 64, position: "relative",
      }}>
        {product.image}
        {showDiscount && product.discount && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: "#EF4444", color: "#fff",
            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
          }}>-{product.discount}%</span>
        )}
        {product.badge && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,0.7)", color: "#fff",
            fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
          }}>{product.badge}</span>
        )}
        {product.isNew && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: PRIMARY, color: "#fff",
            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
          }}>NEW</span>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{product.seller || "Syano Store"}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.4, minHeight: 40 }}>
          {product.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StarRating rating={product.rating} />
          <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>({product.reviews || product.sold || 0})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: PRIMARY }}>
            {product.price.toLocaleString()} SYP
          </span>
          {showDiscount && product.originalPrice && (
            <span style={{ fontSize: 13, color: TEXT_SECONDARY, textDecoration: "line-through" }}>
              {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <button style={{
          marginTop: 8, background: PRIMARY, color: "#fff",
          border: "none", borderRadius: 8, padding: "9px 16px",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "background 0.15s",
          width: "100%",
        }}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function VerificationBadge({ tier }: { tier: string }) {
  const config: Record<string, { color: string; label: string }> = {
    business: { color: "#7C3AED", label: "Business" },
    verified: { color: PRIMARY, label: "Verified" },
    basic: { color: "#3B82F6", label: "Basic" },
  };
  const c = config[tier] || config.basic;
  return (
    <span style={{
      background: c.color + "18", color: c.color,
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
      border: `1px solid ${c.color}30`, display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      ✓ {c.label} Seller
    </span>
  );
}

export function HomepageV4() {
  const [lang] = useState("en");

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: BG, minHeight: "100vh", color: TEXT_PRIMARY }}>

      {/* ─── HEADER / NAVBAR ─── */}
      <header style={{
        background: "#fff", borderBottom: `1px solid ${BORDER}`,
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 20 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 18,
            }}>S</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: TEXT_PRIMARY }}>
              Syano <span style={{ color: TEXT_SECONDARY, fontSize: 14, fontWeight: 400 }}>سيانو</span>
            </span>
          </div>

          {/* Search bar */}
          <div style={{ flex: 1, maxWidth: 600, position: "relative" }}>
            <div style={{
              display: "flex", alignItems: "center",
              background: BG, border: `1.5px solid ${BORDER}`,
              borderRadius: 12, overflow: "hidden",
              transition: "border-color 0.15s",
            }}>
              <select style={{
                border: "none", background: "transparent", padding: "10px 12px",
                fontSize: 13, color: TEXT_SECONDARY, outline: "none", cursor: "pointer",
                borderRight: `1px solid ${BORDER}`, minWidth: 110,
              }}>
                <option>All Categories</option>
                <option>Electronics</option>
                <option>Fashion</option>
              </select>
              <input
                type="text"
                placeholder="Search products, brands, stores..."
                defaultValue=""
                style={{
                  flex: 1, border: "none", background: "transparent",
                  padding: "10px 14px", fontSize: 14, outline: "none", color: TEXT_PRIMARY,
                }}
              />
              <button style={{
                background: PRIMARY, border: "none", color: "#fff",
                padding: "10px 18px", cursor: "pointer", fontSize: 16, fontWeight: 700,
                transition: "background 0.15s",
              }}>🔍</button>
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button style={{ background: "none", border: "none", padding: "8px 10px", cursor: "pointer", color: TEXT_SECONDARY, fontSize: 13, borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }}>
              🌐 AR
            </button>
            <button style={{ background: "none", border: "none", padding: "8px 10px", cursor: "pointer", color: TEXT_SECONDARY, fontSize: 13, borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }}>
              $ USD
            </button>
            <button style={{ background: "none", border: "none", padding: "8px 10px", cursor: "pointer", fontSize: 18, color: TEXT_SECONDARY, borderRadius: 8, position: "relative" }}>
              🛒
              <span style={{
                position: "absolute", top: 4, right: 4, background: PRIMARY,
                color: "#fff", width: 16, height: 16, borderRadius: 8,
                fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              }}>3</span>
            </button>
            <button style={{
              background: "none", border: `1.5px solid ${BORDER}`, color: TEXT_PRIMARY,
              padding: "8px 18px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600,
            }}>Log in</button>
            <button style={{
              background: PRIMARY, border: "none", color: "#fff",
              padding: "9px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600,
            }}>Sign up</button>
          </div>
        </div>
      </header>

      {/* ─── HERO + PRODUCT MOSAIC ─── */}
      <section style={{ background: HERO_BG, position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 0, minHeight: 460 }}>
          {/* Left: Brand Statement */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 48px 48px 0", gap: 24 }}>
            {/* Chip */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, maxWidth: "fit-content" }}>
              <span style={{
                background: `${PRIMARY}22`, border: `1px solid ${PRIMARY}44`,
                color: PRIMARY, fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                ✦ Syria's First Online Marketplace
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 style={{ fontSize: 56, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.1, letterSpacing: "-1px" }}>
                Everything in
              </h1>
              <h1 style={{ fontSize: 56, fontWeight: 800, color: PRIMARY, margin: 0, lineHeight: 1.1, letterSpacing: "-1px" }}>
                Aleppo.
              </h1>
            </div>

            <p style={{ color: "#94A3B8", fontSize: 18, margin: 0, lineHeight: 1.6 }}>
              Fast delivery · Trusted sellers · Best prices in Syria
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button style={{
                background: PRIMARY, border: "none", color: "#fff",
                padding: "14px 32px", borderRadius: 12, cursor: "pointer",
                fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
              }}>
                Shop All →
              </button>
              <button style={{
                background: "transparent", border: "2px solid rgba(255,255,255,0.2)",
                color: "#fff", padding: "14px 32px", borderRadius: 12, cursor: "pointer",
                fontSize: 16, fontWeight: 600,
              }}>
                Browse Categories
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 32, paddingTop: 8 }}>
              {[
                { label: "Active Sellers", value: "1,200+" },
                { label: "Products", value: "50,000+" },
                { label: "Deliveries", value: "98%" },
              ].map(stat => (
                <div key={stat.label}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 22 }}>{stat.value}</div>
                  <div style={{ color: "#64748B", fontSize: 13 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product Mosaic */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderLeft: "1px solid rgba(255,255,255,0.08)", padding: 20, display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B", padding: "8px 0 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>TOP PRODUCTS</span>
              <span style={{ color: PRIMARY, cursor: "pointer" }}>View all →</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
              {[
                { name: "Galaxy S24", price: "180,000 SYP", icon: "📱", tag: "-36%", bg: "linear-gradient(135deg,#1e3a8a,#3b82f6)" },
                { name: "AirPods Pro", price: "95,000 SYP", icon: "🎧", tag: "Best Seller", bg: "linear-gradient(135deg,#1e1b4b,#6366f1)" },
                { name: "Nike Air Max", price: "45,000 SYP", icon: "👟", tag: "-40%", bg: "linear-gradient(135deg,#064e3b,#059669)" },
                { name: "iPad 10th Gen", price: "320,000 SYP", icon: "📱", tag: "New", bg: "linear-gradient(135deg,#312e81,#8b5cf6)" },
              ].map((p, i) => (
                <div key={i} style={{
                  background: p.bg, borderRadius: 14, padding: 14,
                  display: "flex", flexDirection: "column", gap: 8, cursor: "pointer",
                  transition: "transform 0.15s", position: "relative", overflow: "hidden",
                }}>
                  <span style={{
                    position: "absolute", top: 10, right: 10,
                    background: "rgba(0,0,0,0.5)", color: "#fff",
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                  }}>{p.tag}</span>
                  <span style={{ fontSize: 40 }}>{p.icon}</span>
                  <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{p.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust Strip */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            {[
              { icon: "🚚", label: "Fast Delivery", sub: "1–3 days across Aleppo" },
              { icon: "🔒", label: "Secure Payments", sub: "100% buyer protection" },
              { icon: "✅", label: "Verified Sellers", sub: "Every store is screened" },
            ].map(t => (
              <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                <div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{t.label}</div>
                  <div style={{ color: "#64748B", fontSize: 12 }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORY CHIPS ─── */}
      <section style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px", display: "flex", gap: 10, alignItems: "center", overflowX: "auto" }}>
          {MOCK_CATEGORIES.map((cat, i) => (
            <button key={cat.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: i === 0 ? PRIMARY : "transparent",
              border: `1.5px solid ${i === 0 ? PRIMARY : BORDER}`,
              color: i === 0 ? "#fff" : TEXT_PRIMARY,
              padding: "8px 16px", borderRadius: 24, cursor: "pointer",
              fontSize: 13, fontWeight: 500, flexShrink: 0,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}>
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
          <button style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "transparent", border: `1.5px solid ${BORDER}`,
            color: TEXT_SECONDARY, padding: "8px 16px", borderRadius: 24,
            cursor: "pointer", fontSize: 13, fontWeight: 500, flexShrink: 0,
          }}>All →</button>
        </div>
      </section>

      {/* ─── TODAY'S DEALS ─── */}
      <section style={{ padding: "48px 0 40px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, margin: 0 }}>
                  🔥 Today's Deals
                </h2>
                <p style={{ color: TEXT_SECONDARY, fontSize: 14, margin: "4px 0 0" }}>Flash sale — limited time offers</p>
              </div>
              <div style={{
                background: HERO_BG, borderRadius: 12, padding: "10px 18px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ color: "#94A3B8", fontSize: 12 }}>ENDS IN</span>
                <CountdownTimer />
              </div>
            </div>
            <button style={{ color: PRIMARY, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>View all deals →</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {MOCK_DEALS.map(p => <ProductCard key={p.id} product={p} showDiscount />)}
          </div>
        </div>
      </section>

      {/* ─── BEST SELLERS ─── */}
      <section style={{ padding: "48px 0 40px", background: BG }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, margin: 0 }}>
                🏆 Best Sellers
              </h2>
              <p style={{ color: TEXT_SECONDARY, fontSize: 14, margin: "4px 0 0" }}>Most popular products this week</p>
            </div>
            <button style={{ color: PRIMARY, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>See all →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {MOCK_BEST_SELLERS.map(p => (
              <div key={p.id} style={{
                background: CARD_BG, borderRadius: 16, border: `1px solid ${BORDER}`,
                padding: 20, display: "flex", gap: 16, alignItems: "center", cursor: "pointer",
                transition: "box-shadow 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${PRIMARY}18`, color: PRIMARY,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 16, flexShrink: 0,
                }}>#{p.rank}</div>
                <div style={{ fontSize: 40, flexShrink: 0 }}>{p.image}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <StarRating rating={p.rating} />
                    <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>({p.reviews})</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>{p.price.toLocaleString()} SYP</div>
                </div>
                <button style={{
                  background: PRIMARY, border: "none", color: "#fff",
                  width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 16, flexShrink: 0,
                }}>+</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VERIFIED STORES ─── */}
      <section style={{ padding: "48px 0 40px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, margin: 0 }}>
                ✅ Verified Stores
              </h2>
              <p style={{ color: TEXT_SECONDARY, fontSize: 14, margin: "4px 0 0" }}>Trusted sellers, guaranteed quality</p>
            </div>
            <button style={{ color: PRIMARY, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Browse all stores →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {MOCK_STORES.map(store => (
              <div key={store.id} style={{
                background: CARD_BG, borderRadius: 16, border: `1px solid ${BORDER}`,
                overflow: "hidden", cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                transition: "box-shadow 0.2s",
              }}>
                {/* Cover gradient */}
                <div style={{
                  height: 80,
                  background: `linear-gradient(135deg, ${store.color}33, ${store.color}11)`,
                  borderBottom: `1px solid ${BORDER}`,
                }} />
                <div style={{ padding: "0 20px 20px" }}>
                  {/* Avatar */}
                  <div style={{ marginTop: -28, marginBottom: 12 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 14,
                      background: `linear-gradient(135deg, ${store.color}, ${store.color}aa)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 800, fontSize: 22,
                      border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}>{store.avatar}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: TEXT_PRIMARY, marginBottom: 4 }}>{store.name}</div>
                      <VerificationBadge tier={store.tier} />
                    </div>
                    <button style={{
                      background: `${PRIMARY}12`, border: `1px solid ${PRIMARY}30`,
                      color: PRIMARY, padding: "6px 14px", borderRadius: 20,
                      cursor: "pointer", fontSize: 12, fontWeight: 600,
                    }}>+ Follow</button>
                  </div>
                  <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 12 }}>{store.category}</div>
                  <div style={{ display: "flex", gap: 20, borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
                    {[
                      { label: "Followers", value: store.followers.toLocaleString() },
                      { label: "Products", value: store.products },
                      { label: "Rating", value: `${store.rating} ★` },
                    ].map(stat => (
                      <div key={stat.label} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: TEXT_SECONDARY }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEW ARRIVALS ─── */}
      <section style={{ padding: "48px 0 40px", background: BG }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, margin: 0 }}>
                ✨ New Arrivals
              </h2>
              <p style={{ color: TEXT_SECONDARY, fontSize: 14, margin: "4px 0 0" }}>Just landed this week</p>
            </div>
            <button style={{ color: PRIMARY, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>View all →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {MOCK_NEW_ARRIVALS.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ─── EXPLORE CATEGORIES ─── */}
      <section style={{ padding: "48px 0 40px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, margin: 0 }}>
                Shop by Category
              </h2>
              <p style={{ color: TEXT_SECONDARY, fontSize: 14, margin: "4px 0 0" }}>Explore our full collection</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }} id="categories">
            {EXPLORE_CATEGORIES.map((cat, i) => (
              <div key={i} style={{
                background: cat.bg, borderRadius: 16, overflow: "hidden",
                cursor: "pointer", position: "relative",
                height: 160, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
              }}>
                <span style={{ fontSize: 44 }}>{cat.icon}</span>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, textAlign: "center", padding: "0 10px" }}>{cat.name}</div>
                <div style={{
                  position: "absolute", bottom: 10,
                  background: "rgba(255,255,255,0.15)", borderRadius: 20,
                  padding: "3px 10px", fontSize: 11, color: "rgba(255,255,255,0.8)",
                }}>{cat.count.toLocaleString()} items</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SELLER + COURIER CTA BAND ─── */}
      <section style={{ padding: "48px 0", background: BG }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Seller CTA */}
          <div style={{
            background: `linear-gradient(135deg, ${HERO_BG}, #1e3a5f)`,
            borderRadius: 20, padding: "36px 40px",
            display: "flex", flexDirection: "column", gap: 16,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ fontSize: 42 }}>🏪</div>
            <h3 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              Start Selling on Syano
            </h3>
            <p style={{ color: "#94A3B8", margin: 0, fontSize: 15, lineHeight: 1.6 }}>
              Join 1,200+ sellers already growing their business. Set up your store in minutes, reach thousands of buyers across Aleppo.
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ label: "No monthly fees", icon: "✓" }, { label: "Free store setup", icon: "✓" }, { label: "Fast payouts", icon: "✓" }].map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 6, color: PRIMARY, fontSize: 13, fontWeight: 600 }}>
                  <span>{f.icon}</span> {f.label}
                </div>
              ))}
            </div>
            <button style={{
              background: PRIMARY, border: "none", color: "#fff",
              padding: "14px 28px", borderRadius: 12, cursor: "pointer",
              fontSize: 15, fontWeight: 700, maxWidth: "fit-content",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              Open Your Store →
            </button>
          </div>

          {/* Courier CTA */}
          <div style={{
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            borderRadius: 20, padding: "36px 40px",
            display: "flex", flexDirection: "column", gap: 16,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ fontSize: 42 }}>🚴</div>
            <h3 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              Deliver for Syano
            </h3>
            <p style={{ color: "#94A3B8", margin: 0, fontSize: 15, lineHeight: 1.6 }}>
              Earn flexible income as a Syano courier. Deliver on your schedule, get paid weekly, and be part of Aleppo's fastest growing delivery network.
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ label: "Flexible hours", icon: "✓" }, { label: "Weekly payouts", icon: "✓" }, { label: "Easy onboarding", icon: "✓" }].map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 6, color: "#60A5FA", fontSize: 13, fontWeight: 600 }}>
                  <span>{f.icon}</span> {f.label}
                </div>
              ))}
            </div>
            <button style={{
              background: "#3B82F6", border: "none", color: "#fff",
              padding: "14px 28px", borderRadius: 12, cursor: "pointer",
              fontSize: 15, fontWeight: 700, maxWidth: "fit-content",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              Apply to Deliver →
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: HERO_BG, color: "#94A3B8", padding: "48px 0 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40 }}>
          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 18,
              }}>S</div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Syano <span style={{ color: "#94A3B8", fontSize: 14, fontWeight: 400 }}>سيانو</span></span>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, maxWidth: 260 }}>
              Aleppo's trusted online marketplace — shop Syria's finest products from verified sellers.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {["📧", "📱", "📍"].map((icon, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 16,
                }}>{icon}</div>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: "For Sellers", links: ["Start Selling", "Seller Dashboard", "Commission Rates", "Seller FAQ", "Seller Terms"] },
            { title: "Get to Know Us", links: ["About Syano", "Careers", "Press", "Blog", "Contact Us"] },
            { title: "Help & Support", links: ["Help Center", "Buyer Protection", "Returns Policy", "Track Order", "Privacy Policy"] },
          ].map(col => (
            <div key={col.title} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{col.title}</div>
              {col.links.map(link => (
                <a key={link} href="#" style={{ color: "#94A3B8", fontSize: 14, textDecoration: "none", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.color = PRIMARY)}
                  onMouseLeave={e => (e.currentTarget.style.color = "#94A3B8")}
                >{link}</a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 40, padding: "20px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 13 }}>© 2026 Syano. All rights reserved. Made with ♥ in Aleppo, Syria.</div>
            <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
              <a href="#" style={{ color: "#94A3B8", textDecoration: "none" }}>Privacy</a>
              <a href="#" style={{ color: "#94A3B8", textDecoration: "none" }}>Terms</a>
              <a href="#" style={{ color: "#94A3B8", textDecoration: "none" }}>Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
