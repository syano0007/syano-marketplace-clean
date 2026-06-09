---
name: Variant system architecture
description: Full Amazon/Shopify-grade product variant system — schema, API contract, gallery switching, absolute pricing, and UI patterns.
---

## DB Schema (5 tables + variant_images)

- `product_variant_groups` (id, productId, name, position)
- `product_variant_options` (id, groupId, value, position)
- `product_variants` (id, productId, sku, price ABSOLUTE, compare_at_price, price_adjustment LEGACY, barcode, weight_grams, dimensions, stock, image_url LEGACY, active)
- `product_variant_values` (variantId, optionId) — join table
- `variant_images` (id, variant_id, url, position, option_value_id nullable FK)

Plus: `cart_items.variantId`, `order_items.variantId` + `order_items.variantDetails` (JSONB snapshots label at order time).

**Why:** Relational design. priceAdjustment kept for backward compat with old variants. variant_images enables multi-image per variant for gallery switching.

## Pricing model (Shopify/Amazon style)

- `variant.price` = ABSOLUTE selling price (null = inherit: product.price + priceAdjustment × discount)
- `variant.compareAtPrice` = crossed-out original price (null = no strikethrough)
- PDP resolves: `effectiveSellPrice`, `effectiveCompareAt`, `hasDiscount`, `displayDiscountPct`
- Leave price null → legacy path uses product.discountPercent

**Why:** Clean per-variant pricing without chained adjustments. Supports mix of legacy + new variants.

## Gallery switching (buyer PDP, products/[id].tsx)

- First variant group (index 0, typically "Color") drives gallery switching
- On first-group option select: collect images from ALL variants sharing that optionId → deduplicate → replace gallery
- Fallback order: resolved variant images → product imageUrl + imageUrls
- `window.history.replaceState` updates URL query params on selection (`?Color=Red&Size=M`)
- `setActiveImage(null)` triggered when `selectedFirstOptionId` changes (reset thumbnail)

## API (routes/variants.ts)

- `buildVariantData(productId)` — 3 queries via batch inArray (no N+1). Each variant includes `images: { id, url, position, optionValueId }[]`
- `POST /products/:id/variants/bulk` — Deletes all groups (cascade), re-creates everything. Accepts `{ groups[], variants[{ price, compareAtPrice, barcode, weightGrams, images[], ...}] }`. Syncs products.stock to sum of variant stocks.
- `PATCH /products/:id/variants/:variantId` — Partial update; replaces entire images array if provided.
- Cart: PATCH/DELETE `/api/cart/items/:cartItemId` (NOT `:productId`).

## VariantBuilder.tsx (seller UI) — Shopify/Amazon-grade rewrite June 2026

Exports: `AttributeGroup`, `VariantRow`, `cartesianVariants()`, `buildVariantPayload()`, `VariantBuilder`

**AttributeGroup added `enabled?: boolean`** (optional, defaults true). `cartesianVariants` and `buildVariantPayload` both filter `enabled !== false`. Backward compatible.

VariantRow fields: `id, combination, label, sku, price: number|null, compareAtPrice: number|null, barcode, weightGrams: number|null, stock, images: string[], active`

UI features (new):
- **Section 1**: Preset picker chips — 🎨 Color 📏 Size 💾 Storage 🧠 RAM 🧵 Material ✨ Style 📦 Model 🏷️ Edition ✏️ Custom. Chips grey out (with checkmark) when that group already added. "Custom" opens inline text input.
- **Section 2**: Added group cards with drag-and-drop (HTML5 draggable), collapse/expand, enable/disable toggle, delete, smart suggestion chips, color swatches for color-type groups.
- **Color swatch mode**: isColorGroup() detects Color/Colour/اللون/الألوان; getColorHex() maps 30+ EN+AR names to CSS hex. Shows colored circles instead of text chips for known colors; suggestion chips also show color dot.
- **Right sidebar**: Live preview — combo count, formula (3 × 4 × 3 = 12), variant list with color dots/status badges, stats (total/active/inactive), tips panel. Sticky on XL screens.
- **Section 4**: Generate button + variant table. Bulk action bar: set price/compare/stock (with Set button each), Enable/Disable all, Delete selected. Per-row: checkbox, color dot/image count, price, compare, stock, SKU, toggle. Expandable images per variant (up to 8 URLs).
- Two-column layout: `grid-cols-1 xl:grid-cols-[1fr_280px]` (builder left, preview right).
- `buildVariantPayload(groups, rows)` converts VariantBuilder state to API format — unchanged contract.

**Why:** Matched the provided mockup showing Arabic RTL seller UX. No backend changes.

## Toggle RTL Fix — FINAL (June 2026, Session 2)

**Root cause (two failed attempts, both wrong):**
1. First attempt: `flex + ms-[26px]/ms-[2px]` (margin-inline-start) — under `direction:rtl` the flex main-axis reverses, so ms-[26px] ON pushes the thumb off the far end of the track.
2. Second attempt: `ltr:left-[2px] ltr:translate-x-[24px] / rtl:right-[2px] rtl:-translate-x-[24px]` — variant-prefixed Tailwind classes don't combine cleanly with `position:absolute` when `direction` cascades from `<html>`.

**Correct fix (VariantBuilder.tsx Toggle component, as of Session 2):**
```tsx
<button className="relative h-6 w-11 rounded-full ...">
  <span
    className="absolute top-1 h-4 w-4 rounded-full bg-white ..."
    style={{ left: on ? 26 : 2 }}
  />
</button>
```
- Track: `w-11` = 44px, `h-6` = 24px. Thumb: `w-4 h-4` = 16px. Vertical center: `top-1` = 4px.
- OFF: left=2px → thumb at 2–18px. ON: left=26px → thumb at 26–42px. Max=42 < 44px. Escape impossible.
- Uses `transition-[left]` for smooth animation. Direction-agnostic — never query i18n in Toggle.
- Toggle visually NOT mirrored in RTL (matches iOS/WhatsApp: green-right = ON in all directions).

**Why margin-inline-start and Tailwind RTL direction-variants both fail here:** Any property that depends on logical axis resolution (margin-inline, translate-x, left/right in RTL block) is unreliable when `direction: rtl` cascades from `<html>` into a `position:relative` containing block. The only bulletproof solution is physical pixel `left` via inline style.

## Inline toggle fix — applies to ALL seller product pages

Both Add Product (`new.tsx`) and Edit Product (`seller/products/[id]/edit.tsx`) define their OWN inline toggle for the "Product Variants" on/off switch (NOT using VariantBuilder's Toggle component). Both had the same broken pattern:
```tsx
// BROKEN (inline-flex + translateX escapes in RTL):
className="relative inline-flex h-6 w-11 items-center rounded-full ..."
<span className={`inline-block ... ${enabled ? "translate-x-6" : "translate-x-1"}`} />

// FIXED (same position:absolute pattern as VariantBuilder.tsx Toggle):
className="relative h-6 w-11 rounded-full ..."
<span className="absolute top-1 h-4 w-4 ..." style={{ left: variantsEnabled ? 26 : 2 }} />
```
**Status (June 2026):** Both new.tsx (fixed earlier) and edit.tsx (fixed in workspace recovery) now use the absolute-position pattern. VariantBuilder.tsx internal Toggle component is also correct.

**Why:** `inline-flex + direction:rtl` repositions the inline child at the RIGHT edge; translateX(24px) then escapes. Physical `left` via inline style is direction-agnostic.

**Rule:** Any toggle in this codebase must use `position:relative` track + `position:absolute` thumb + inline `style={{ left: N }}`. Never use flex+translate-x or margin-inline-start for toggle thumb positioning.

## Edit page (seller/products/[id]/edit.tsx)

- Loads existing variants from product.variantGroups + product.variants (already in GET /products/:id via buildVariantData)
- Converts API → VariantBuilder format in useEffect([product?.id])
- Uses mutateAsync + sequential fetch calls (discount then variants) in async onSubmit
- DELETE /variants called when variantsEnabled toggled off

## new.tsx

Already calls `buildVariantPayload(variantGroups, variantRows)` in onSuccess — no changes needed.

## Backward Compatibility

- Old products without variants: hasVariants = false, all effective* fall back to product.*
- Old variants without price: price=null → legacy priceAdjustment + product discount path
- Cart items without variants: variantDetails optional
