import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useUpdateProduct, useGetProduct,
  getListProductsQueryKey, getGetProductQueryKey, getGetSellerDashboardQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, ChevronRight, Trash2, ImageIcon,
  Tag, Package, FileText, Layers, Camera, X,
  Bold, Italic, List, Link2, ChevronDown, ChevronUp, Plus,
  CheckCircle2, Info,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/categories";
import {
  VariantBuilder, buildVariantPayload, type AttributeGroup, type VariantRow,
} from "@/components/VariantBuilder";

function isValidUrl(s: string) { try { new URL(s); return true; } catch { return false; } }

// ─── Reusable section card ───────────────────────────────────────────────────
function Sec({
  icon: Icon, title, subtitle, children, iconBg = "bg-primary/10", iconColor = "text-primary",
}: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode;
  iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3.5 border-b flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold leading-snug">{title}</p>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepBar({ labels }: { labels: string[] }) {
  return (
    <div className="flex overflow-x-auto border-b bg-background" style={{ scrollbarWidth: "none" }}>
      {labels.map((label, i) => (
        <div key={i} className={cn(
          "flex flex-col items-center gap-1.5 px-3 py-2.5 shrink-0",
          i === 0 ? "text-primary border-b-2 border-primary" : "text-muted-foreground/60",
        )}>
          <span className={cn(
            "h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center",
            i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground/80",
          )}>{i + 1}</span>
          <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Description toolbar ─────────────────────────────────────────────────────
function DescToolbar({ onFormat }: { onFormat: (b: string, a?: string, block?: boolean) => void }) {
  const actions = [
    { icon: Bold,   label: "Bold",   b: "**", a: "**",      block: false },
    { icon: Italic, label: "Italic", b: "_",  a: "_",      block: false },
    { icon: List,   label: "List",   b: "• ", a: "",       block: true  },
    { icon: Link2,  label: "Link",   b: "[",  a: "](url)", block: false },
  ] as const;
  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b flex-wrap bg-muted/20">
      {actions.map(({ icon: Icon, label, b, a, block }) => (
        <button
          key={label} type="button" title={label}
          onClick={() => onFormat(b, a as string, block as boolean)}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors touch-manipulation"
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

// ─── Spec parsing ────────────────────────────────────────────────────────────
function parseSpecs(desc: string) {
  const specs: { id: string; key: string; value: string }[] = [];
  const remaining: string[] = [];
  for (const line of desc.split("\n")) {
    const m = line.match(/^([^:\n]{1,60}):\s*(.+)$/);
    if (m && !line.startsWith("http") && !line.startsWith("www")) {
      specs.push({ id: `sp-${Date.now()}-${Math.random()}`, key: m[1].trim(), value: m[2].trim() });
    } else {
      remaining.push(line);
    }
  }
  return { specs, description: remaining.join("\n").replace(/^\n+/, "").trim() };
}

export default function EditProduct() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const lang = i18n.language;

  const { token } = useAuth();
  const { format } = useCurrency();
  const [discountPct, setDiscountPct] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Images
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [pendingImg, setPendingImg] = useState("");
  const [showImgInput, setShowImgInput] = useState(false);

  // Category
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  const selectedCategory = CATEGORIES.find(c => c.slug === selectedCategorySlug);

  // Variants
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variantGroups, setVariantGroups] = useState<AttributeGroup[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [variantExpanded, setVariantExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Specs
  const [specs, setSpecs] = useState<{ id: string; key: string; value: string }[]>([]);
  const addSpec = () => setSpecs(p => [...p, { id: `sp-${Date.now()}`, key: "", value: "" }]);
  const removeSpec = (id: string) => setSpecs(p => p.filter(s => s.id !== id));
  const updateSpec = (id: string, f: "key" | "value", v: string) =>
    setSpecs(p => p.map(s => s.id === id ? { ...s, [f]: v } : s));

  const descRef = useRef<HTMLTextAreaElement>(null);

  const productSchema = z.object({
    name: z.string().min(2, t("seller_products.name_min")),
    description: z.string().min(1, t("seller_products.desc_min")),
    price: z.coerce.number().min(0.01, t("seller_products.price_min")),
    category: z.string().min(1, t("seller_products.category_min")),
    subcategory: z.string().optional(),
    imageUrl: z.string().url(t("seller_products.url_invalid")).optional().or(z.literal("")),
  });
  type ProductFormValues = z.infer<typeof productSchema>;

  const { data: product, isLoading } = useGetProduct(id, {
    query: { queryKey: getGetProductQueryKey(id), enabled: !!id },
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", price: 0, category: "", subcategory: "", imageUrl: "" },
  });

  const coverUrl = form.watch("imageUrl") || "";

  useEffect(() => {
    if (!product) return;
    const catSlug = product.category || "";
    setSelectedCategorySlug(catSlug);

    // Parse specs from description
    const { specs: parsedSpecs, description: cleanDesc } = parseSpecs(product.description || "");
    setSpecs(parsedSpecs);

    form.reset({
      name: product.name,
      description: cleanDesc,
      price: product.price,
      category: catSlug,
      subcategory: (product as any).subcategory || "",
      imageUrl: product.imageUrl || "",
    });
    setGalleryUrls(product.imageUrls ?? []);
    const dp = product.discountPercent ?? 0;
    setDiscountPct(dp);
    setSalePrice(parseFloat((product.price * (1 - dp / 100)).toFixed(2)));

    const apiGroups = (product as any).variantGroups ?? [];
    if (apiGroups.length > 0) {
      setVariantsEnabled(true);
      setVariantExpanded(false);
      setVariantGroups(apiGroups.map((g: any) => ({
        id: `grp-${g.id}`, name: g.name,
        values: (g.options ?? []).map((o: any) => o.value),
      })));
      setVariantRows((product as any).variants?.map((v: any) => ({
        id: `var-${v.id}`,
        combination: (v.options ?? []).map((o: any) => ({ groupName: o.groupName, value: o.value })),
        label: v.label, sku: v.sku ?? "", price: v.price ?? null,
        compareAtPrice: v.compareAtPrice ?? null, barcode: v.barcode ?? "",
        weightGrams: v.weightGrams ?? null, stock: v.stock,
        images: (v.images ?? []).map((i: any) => (typeof i === "string" ? i : i?.url)).filter(Boolean),
        active: v.active,
      })) ?? []);
    }
  }, [product?.id]);

  const updateProduct = useUpdateProduct();

  // Image helpers
  const addImage = useCallback(() => {
    const url = pendingImg.trim();
    if (!url || !isValidUrl(url)) return;
    if (!coverUrl) { form.setValue("imageUrl", url); }
    else if (galleryUrls.length < 9) { setGalleryUrls(p => [...p, url]); }
    setPendingImg("");
    setShowImgInput(false);
  }, [pendingImg, coverUrl, galleryUrls, form]);

  const removeImage = useCallback((isCover: boolean, idx: number) => {
    if (isCover) {
      if (galleryUrls.length > 0) {
        form.setValue("imageUrl", galleryUrls[0]);
        setGalleryUrls(g => g.slice(1));
      } else {
        form.setValue("imageUrl", "");
      }
    } else {
      setGalleryUrls(g => g.filter((_, i) => i !== idx));
    }
  }, [galleryUrls, form]);

  // Description formatting
  const insertFormat = useCallback((before: string, after = before, blockMode = false) => {
    const el = descRef.current;
    if (!el) return;
    const s = el.selectionStart; const e = el.selectionEnd;
    const cur = form.getValues("description") || "";
    const selected = cur.substring(s, e);
    let newVal: string; let newCursor: number;
    if (blockMode) {
      const lineStart = cur.lastIndexOf("\n", s - 1) + 1;
      newVal = cur.substring(0, lineStart) + before + cur.substring(lineStart);
      newCursor = s + before.length;
    } else {
      newVal = cur.substring(0, s) + before + selected + after + cur.substring(e);
      newCursor = s + before.length;
    }
    form.setValue("description", newVal, { shouldValidate: false });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCursor, e === s ? newCursor : e + before.length);
    });
  }, [form]);

  const onSubmit = async (data: ProductFormValues) => {
    if (pricingError) { toast({ title: pricingError, variant: "destructive" }); return; }
    setIsSaving(true);
    try {
      const specLines = specs
        .filter(s => s.key.trim() && s.value.trim())
        .map(s => `${s.key.trim()}: ${s.value.trim()}`);
      const fullDesc = specLines.length > 0
        ? [...specLines, "", data.description].join("\n").trim()
        : data.description;

      const cleanGallery = galleryUrls.filter(u => u.trim() && isValidUrl(u));
      await updateProduct.mutateAsync({
        id,
        data: {
          ...data,
          description: fullDesc,
          subcategory: data.subcategory || null,
          imageUrl: data.imageUrl || null,
          imageUrls: cleanGallery.length > 0 ? cleanGallery : null,
        } as any,
      });

      const discResp = await fetch(`/api/products/${id}/discount`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ discountPercent: discountPct > 0 ? discountPct : null }),
      });
      if (!discResp.ok) {
        const err = await discResp.json().catch(() => ({}));
        toast({ title: t("seller_products.discount_update_failed"), description: err.message ?? "", variant: "destructive" });
        return;
      }

      if (variantsEnabled && variantGroups.length > 0 && variantRows.length > 0) {
        const vResp = await fetch(`/api/products/${id}/variants/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
          body: JSON.stringify(buildVariantPayload(variantGroups, variantRows)),
        });
        if (!vResp.ok) {
          const err = await vResp.json().catch(() => ({}));
          toast({ title: t("variants.save_failed", "Failed to save variants"), description: err.error ?? "", variant: "destructive" });
          return;
        }
      } else if (!variantsEnabled) {
        await fetch(`/api/products/${id}/variants`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
      }

      toast({ title: t("seller_products.updated") });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: getGetSellerDashboardQueryKey() });
      setLocation("/seller/products");
    } catch (err: any) {
      toast({ title: t("seller_products.update_failed"), description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalid = () => {
    const el = document.querySelector<HTMLElement>("[aria-invalid='true']");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const stepLabels = [
    t("seller_products.step_basic"),
    t("seller_products.step_pricing"),
    t("seller_products.step_variants"),
    t("seller_products.step_specs"),
    t("seller_products.step_publish"),
  ];

  const allImages = [
    ...(coverUrl && isValidUrl(coverUrl) ? [{ url: coverUrl, isCover: true, idx: -1 }] : []),
    ...galleryUrls.map((url, idx) => ({ url, isCover: false, idx })).filter(img => img.url && isValidUrl(img.url)),
  ];

  if (isLoading) {
    return <Layout><div className="container py-12 text-center text-muted-foreground">{t("common.loading")}</div></Layout>;
  }

  return (
    <Layout>
      <div className="w-full">
        {/* Back + title bar */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b bg-background">
          <Link href="/seller/products">
            <button
              type="button"
              className="h-9 w-9 rounded-xl border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors touch-manipulation shrink-0"
            >
              <BackIcon className="h-4 w-4" />
            </button>
          </Link>
          <h1 className="text-lg font-bold tracking-tight flex-1 min-w-0 truncate">
            {t("seller_products.edit_title")}
          </h1>
        </div>

        <StepBar labels={stepLabels} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="pb-28">
            <div className="px-3 pt-4 space-y-3 max-w-3xl mx-auto">

              {/* ── 1. Product Images ─────────────────────────── */}
              <Sec icon={Camera} title={t("seller_products.images_section")} iconBg="bg-emerald-500/10" iconColor="text-emerald-600">
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {/* Upload button */}
                  <button
                    type="button"
                    onClick={() => setShowImgInput(p => !p)}
                    className={cn(
                      "h-28 w-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center shrink-0 gap-1.5 touch-manipulation transition-colors",
                      showImgInput ? "border-primary/60 bg-primary/8" : "border-primary/30 bg-primary/5 hover:border-primary/60",
                    )}
                  >
                    <Camera className="h-8 w-8 text-primary/60" />
                    <span className="text-[10px] font-semibold text-primary/70 text-center leading-tight px-1">
                      {t("seller_products.upload_area_label")}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60">{t("seller_products.upload_area_hint")}</span>
                  </button>

                  {allImages.map(({ url, isCover, idx }) => (
                    <div key={isCover ? "cover" : idx} className="h-28 w-28 rounded-2xl border bg-muted overflow-hidden relative shrink-0">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {isCover && (
                        <span className="absolute bottom-1 start-1 text-[8px] font-bold bg-primary text-primary-foreground rounded px-1 py-0.5">
                          {lang === "ar" ? "غلاف" : "Cover"}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(isCover, idx)}
                        className="absolute top-1.5 end-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center touch-manipulation"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {allImages.length === 0 && (
                    <div className="h-28 w-28 rounded-2xl border-2 border-dashed border-muted-foreground/15 bg-muted/30 flex flex-col items-center justify-center shrink-0 gap-1.5">
                      <ImageIcon className="h-7 w-7 text-muted-foreground/30" />
                      <span className="text-[9px] text-muted-foreground/50">{t("seller_products.no_images_yet")}</span>
                    </div>
                  )}
                </div>

                {showImgInput && (
                  <div className="flex gap-2 items-center pt-1">
                    <Input
                      value={pendingImg}
                      onChange={e => setPendingImg(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
                      placeholder={t("seller_products.image_url_placeholder")}
                      className="h-12 flex-1 text-base"
                      autoFocus
                    />
                    <Button type="button" onClick={addImage} className="h-12 px-5 shrink-0">{t("common.add")}</Button>
                    <button
                      type="button"
                      onClick={() => { setShowImgInput(false); setPendingImg(""); }}
                      className="h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-xl border hover:bg-muted/60 transition-colors touch-manipulation"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </Sec>

              {/* ── 2. Basic Information ──────────────────────── */}
              <Sec icon={Package} title={t("seller_products.product_name")} iconBg="bg-blue-500/10" iconColor="text-blue-600">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("seller_products.product_name")} <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input className="h-12 text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Sec>

              {/* ── 3. Category ───────────────────────────────── */}
              <Sec
                icon={CheckCircle2}
                title={t("seller_products.category_section_title")}
                subtitle={t("seller_products.category_section_desc")}
                iconBg="bg-violet-500/10"
                iconColor="text-violet-600"
              >
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("seller_products.main_category")} <span className="text-destructive">*</span></FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={val => {
                          field.onChange(val);
                          setSelectedCategorySlug(val);
                          form.setValue("subcategory", "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder={t("seller_products.select_category")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.slug} value={cat.slug}>
                              {lang === "ar" ? cat.ar : cat.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedCategory && (
                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("seller_products.subcategory")}</FormLabel>
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder={t("seller_products.select_subcategory")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[260px]">
                            {selectedCategory.subcategories.map(sub => (
                              <SelectItem key={sub.slug} value={sub.slug}>
                                {lang === "ar" ? sub.ar : sub.en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">{t("seller_products.subcategory_optional")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedCategory && selectedCategory.attributes.length > 0 && (
                  <div className="p-3.5 bg-primary/5 border border-primary/10 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                      <p className="text-xs font-semibold text-primary">{t("seller_products.suggested_attributes")}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{t("seller_products.suggested_attributes_desc")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCategory.attributes.map(attr => (
                        <Badge key={attr.key} variant="secondary" className="text-xs font-medium">
                          {lang === "ar" ? attr.ar : attr.en}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Sec>

              {/* ── 4. Pricing ────────────────────────────────── */}
              <Sec
                icon={Tag}
                title={t("seller_products.pricing_section_title")}
                subtitle={t("seller_products.pricing_section_desc")}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-600"
              >
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          {t("seller_products.original_price_label")} <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number" step="0.01" min="0"
                            className="h-12 text-base tabular-nums"
                            {...field}
                            value={field.value || ""}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              field.onChange(val);
                              setSalePrice(parseFloat((val * (1 - discountPct / 100)).toFixed(2)));
                              setPricingError(null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none block">{t("seller_products.sale_price_label")}</label>
                    <Input
                      type="number" step="0.01" min="0"
                      value={salePrice || ""}
                      className={cn("h-12 text-base tabular-nums", pricingError ? "border-destructive" : "")}
                      onChange={e => {
                        const sp = parseFloat(e.target.value) || 0;
                        setSalePrice(sp);
                        const orig = form.getValues("price");
                        if (orig > 0 && sp > orig) {
                          setPricingError(t("seller_products.sale_exceeds_original")); setDiscountPct(0);
                        } else {
                          setPricingError(null);
                          if (orig > 0) setDiscountPct(Math.min(90, Math.max(0, parseFloat(((1 - sp / orig) * 100).toFixed(1)))));
                        }
                      }}
                    />
                    {pricingError && <p className="text-xs text-destructive">{pricingError}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none block">{t("seller_products.discount_pct_label")}</label>
                  <div className="relative">
                    <Input
                      type="number" step="0.1" min="0" max="90" placeholder="0"
                      value={discountPct || ""}
                      className="h-12 text-base pe-9 tabular-nums"
                      onChange={e => {
                        const dp = Math.min(90, Math.max(0, parseFloat(e.target.value) || 0));
                        setDiscountPct(dp);
                        setSalePrice(parseFloat((form.getValues("price") * (1 - dp / 100)).toFixed(2)));
                        setPricingError(null);
                      }}
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("seller_products.discount_pct_hint")}</p>
                </div>

                {discountPct > 0 && (
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 rounded-xl">
                    <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {t("seller_products.price_preview_on_sale", {
                        price: format(salePrice),
                        percent: Number.isInteger(discountPct) ? discountPct : discountPct.toFixed(1),
                      })}
                    </span>
                  </div>
                )}
              </Sec>

              {/* ── 5. Inventory (read-only) ──────────────────── */}
              <Sec icon={Package} title={t("seller_products.stock_col")} iconBg="bg-orange-500/10" iconColor="text-orange-600">
                <div className="h-12 px-4 border rounded-xl bg-muted/30 flex items-center gap-3">
                  <span className="text-lg font-bold tabular-nums text-foreground">{product?.stock ?? 0}</span>
                  <span className="text-sm text-muted-foreground">{t("seller_products.stock_managed")}</span>
                </div>
              </Sec>

              {/* ── 6. Variants ───────────────────────────────── */}
              <Sec
                icon={Layers}
                title={t("variants.section_title")}
                subtitle={t("variants.section_desc")}
                iconBg="bg-indigo-500/10"
                iconColor="text-indigo-600"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{t("variants.has_variants_label", "تفعيل الفاريانت")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {variantsEnabled ? t("variants.toggle_on") : t("variants.toggle_off")}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={variantsEnabled}
                    onClick={() => {
                      setVariantsEnabled(p => !p);
                      if (!variantsEnabled) setVariantExpanded(true);
                    }}
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 touch-manipulation",
                      variantsEnabled ? "bg-primary" : "bg-muted-foreground/30",
                    )}
                  >
                    <span
                      className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-[left] duration-200"
                      style={{ left: variantsEnabled ? 22 : 3 }}
                    />
                  </button>
                </div>

                {variantsEnabled && (
                  <div className="space-y-3">
                    {variantGroups.length > 0 && (
                      <div className="flex flex-wrap gap-2 items-center">
                        {variantGroups.map(g => (
                          <span key={g.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                            {g.name}
                            {g.values.length > 0 && (
                              <span className="text-xs font-bold bg-primary text-primary-foreground rounded-md px-1.5">{g.values.length}</span>
                            )}
                          </span>
                        ))}
                        {variantRows.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {t("seller_products.show_variants_detail", { count: variantRows.length })}
                          </span>
                        )}
                      </div>
                    )}

                    <Button
                      type="button" variant="outline" size="sm"
                      onClick={() => setVariantExpanded(p => !p)}
                      className="h-10 w-full gap-2 font-medium"
                    >
                      {variantExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {variantExpanded ? t("seller_products.hide_variants_detail") : t("seller_products.manage_variants")}
                    </Button>

                    {variantExpanded && (
                      <div className="pt-2 border-t">
                        <VariantBuilder
                          groups={variantGroups}
                          onGroupsChange={setVariantGroups}
                          variants={variantRows}
                          onVariantsChange={setVariantRows}
                        />
                      </div>
                    )}

                    {variantRows.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{t("variants.stock_note")}</p>
                    )}
                  </div>
                )}
              </Sec>

              {/* ── 7. Specifications ─────────────────────────── */}
              <Sec
                icon={FileText}
                title={t("seller_products.specs_section")}
                subtitle={t("seller_products.specs_section_desc")}
                iconBg="bg-teal-500/10"
                iconColor="text-teal-600"
              >
                {specs.map((spec, si) => (
                  <div key={spec.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        {si === 0 && <p className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "الخاصية" : "Attribute"}</p>}
                        <Input
                          value={spec.key}
                          onChange={e => updateSpec(spec.id, "key", e.target.value)}
                          placeholder={t("seller_products.spec_key_placeholder")}
                          className="h-11 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        {si === 0 && <p className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "القيمة" : "Value"}</p>}
                        <Input
                          value={spec.value}
                          onChange={e => updateSpec(spec.id, "value", e.target.value)}
                          placeholder={t("seller_products.spec_value_placeholder")}
                          className="h-11 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSpec(spec.id)}
                      className={cn(
                        "h-11 w-11 flex items-center justify-center rounded-xl border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors touch-manipulation",
                        si === 0 && "mt-5",
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSpec}
                  className="w-full h-11 border-2 border-dashed border-primary/25 rounded-xl text-sm font-medium text-primary/70 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors touch-manipulation flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t("seller_products.add_spec")}
                </button>
              </Sec>

              {/* ── 8. Description ────────────────────────────── */}
              <Sec
                icon={FileText}
                title={t("seller_products.description")}
                subtitle={t("seller_products.description_section_desc")}
                iconBg="bg-rose-500/10"
                iconColor="text-rose-600"
              >
                <div className="rounded-xl border overflow-hidden">
                  <DescToolbar onFormat={insertFormat} />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            className="min-h-[180px] rounded-none border-0 text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                            {...field}
                            ref={el => {
                              field.ref(el);
                              (descRef as any).current = el;
                            }}
                          />
                        </FormControl>
                        <FormMessage className="px-3 pb-2" />
                      </FormItem>
                    )}
                  />
                </div>
              </Sec>

              {/* ── Desktop actions ───────────────────────────── */}
              <div className="hidden md:flex justify-end gap-3 pt-2 pb-4">
                <Link href="/seller/products">
                  <Button variant="outline" type="button" className="h-12 px-6">{t("seller_products.cancel_btn")}</Button>
                </Link>
                <Button type="submit" disabled={isSaving} className="h-12 px-8 font-semibold min-w-[160px]">
                  {isSaving ? t("seller_products.saving") : t("seller_products.save_btn")}
                </Button>
              </div>

            </div>

            {/* ── Mobile sticky bar ─────────────────────────── */}
            <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-t shadow-xl">
              <div className="px-3 py-3 flex gap-2.5 items-center max-w-3xl mx-auto">
                <Link href="/seller/products" className="shrink-0">
                  <Button variant="outline" type="button" className="h-13 px-4 text-sm font-medium" style={{ height: "52px" }}>
                    {t("seller_products.cancel_btn")}
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 font-semibold text-base"
                  style={{ height: "52px" }}
                >
                  {isSaving ? t("seller_products.saving") : t("seller_products.save_btn")}
                </Button>
              </div>
            </div>

          </form>
        </Form>
      </div>
    </Layout>
  );
}
