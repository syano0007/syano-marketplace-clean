import { useState } from "react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProduct, getListProductsQueryKey, getGetSellerDashboardQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
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
  ChevronLeft, ChevronRight, Info, CheckCircle2, Plus, Trash2,
  ImageIcon, Tag, Package, FileText, Layers,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CATEGORIES } from "@/lib/categories";
import { VariantBuilder, buildVariantPayload, type AttributeGroup, type VariantRow } from "@/components/VariantBuilder";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Please select a category"),
  subcategory: z.string().optional(),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProductFormValues = z.infer<typeof productSchema>;

function isValidUrl(str: string): boolean {
  try { new URL(str); return true; } catch { return false; }
}

function SectionCard({
  icon: Icon, title, description, children, className,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card shadow-sm overflow-hidden", className)}>
      <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </div>
  );
}

export default function NewProduct() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const lang = i18n.language;

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const selectedCategory = CATEGORIES.find((c) => c.slug === selectedCategorySlug);

  const { format } = useCurrency();
  const [discountPct, setDiscountPct] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variantGroups, setVariantGroups] = useState<AttributeGroup[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      subcategory: "",
      stock: 0,
      imageUrl: "",
    },
  });

  const createProduct = useCreateProduct();

  const addGalleryUrl = () => {
    if (galleryUrls.length < 5) setGalleryUrls([...galleryUrls, ""]);
  };
  const removeGalleryUrl = (index: number) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
  };
  const updateGalleryUrl = (index: number, value: string) => {
    const updated = [...galleryUrls];
    updated[index] = value;
    setGalleryUrls(updated);
  };

  const onSubmit = (data: ProductFormValues) => {
    if (pricingError) {
      toast({ title: pricingError, variant: "destructive" });
      return;
    }
    const cleanGallery = galleryUrls.filter((u) => u.trim() !== "" && isValidUrl(u));
    const payload = {
      ...data,
      subcategory: data.subcategory || null,
      imageUrl: data.imageUrl || null,
      imageUrls: cleanGallery.length > 0 ? cleanGallery : null,
    };
    createProduct.mutate({ data: payload as any }, {
      onSuccess: async (created: any) => {
        if (discountPct > 0) {
          const resp = await fetch(`/api/products/${created.id}/discount`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token ?? ""}`,
            },
            body: JSON.stringify({ discountPercent: discountPct }),
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            toast({ title: t("seller_products.discount_update_failed"), description: err.message ?? `Status ${resp.status}`, variant: "destructive" });
            return;
          }
        }
        if (variantsEnabled && variantGroups.length > 0 && variantRows.length > 0) {
          try {
            await fetch(`/api/products/${created.id}/variants/bulk`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token ?? ""}`,
              },
              body: JSON.stringify(buildVariantPayload(variantGroups, variantRows)),
            });
          } catch (_) {}
        }
        toast({ title: t("seller_products.created") });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSellerDashboardQueryKey() });
        setLocation("/seller/products");
      },
      onError: (error: any) => {
        toast({ title: t("seller_products.create_failed"), description: error.message, variant: "destructive" });
      },
    });
  };

  const onInvalid = () => {
    const firstEl = document.querySelector<HTMLElement>("[aria-invalid='true'], [data-error='true']");
    if (firstEl) firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const isPending = createProduct.isPending;

  return (
    <Layout>
      <div className="container py-6 max-w-2xl">
        <Link
          href="/seller/products"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <BackIcon className="h-4 w-4 me-1" />
          {t("seller_products.back")}
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          {t("seller_products.new_title")}
        </h1>

        <Form {...form}>
          <form
            id="new-product-form"
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-4 pb-24 md:pb-4"
          >

            {/* ── 1. Images ─────────────────────────────────────── */}
            <SectionCard icon={ImageIcon} title={t("seller_products.images_section")}>
              {/* Cover image */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("seller_products.cover_image")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("seller_products.image_url_placeholder")}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    {field.value && isValidUrl(field.value) && (
                      <div className="mt-2 rounded-xl overflow-hidden border aspect-video bg-muted">
                        <img src={field.value} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("seller_products.gallery_label")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("seller_products.gallery_desc")}</p>
                  </div>
                  {galleryUrls.length < 5 && (
                    <Button type="button" variant="outline" size="sm" onClick={addGalleryUrl} className="shrink-0 h-9">
                      <Plus className="h-3.5 w-3.5 me-1.5" />
                      {t("seller_products.add_image")}
                    </Button>
                  )}
                </div>

                {galleryUrls.length === 0 && (
                  <button
                    type="button"
                    className="w-full border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors touch-manipulation"
                    onClick={addGalleryUrl}
                  >
                    <Plus className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t("seller_products.add_gallery_prompt")}</p>
                  </button>
                )}

                {galleryUrls.map((url, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <div className="h-14 w-14 rounded-xl border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {url && isValidUrl(url) ? (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <Input
                      placeholder={t("seller_products.image_url_placeholder")}
                      value={url}
                      onChange={(e) => updateGalleryUrl(index, e.target.value)}
                      className="flex-1 h-11"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGalleryUrl(index)}
                      className="shrink-0 h-11 w-11 text-muted-foreground hover:text-destructive touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── 2. Basic Information ──────────────────────────── */}
            <SectionCard icon={Package} title={t("seller_products.product_name")}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">{t("seller_products.product_name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("seller_products.product_name_placeholder")}
                        className="h-11 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            {/* ── 3. Category ──────────────────────────────────── */}
            <SectionCard
              icon={CheckCircle2}
              title={t("seller_products.category_section_title")}
              description={t("seller_products.category_section_desc")}
            >
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("seller_products.main_category")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        setSelectedCategorySlug(val);
                        form.setValue("subcategory", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={t("seller_products.select_category")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {CATEGORIES.map((cat) => (
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
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={t("seller_products.select_subcategory")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[260px]">
                          {selectedCategory.subcategories.map((sub) => (
                            <SelectItem key={sub.slug} value={sub.slug}>
                              {lang === "ar" ? sub.ar : sub.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        {t("seller_products.subcategory_optional")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedCategory && selectedCategory.attributes.length > 0 && (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                    <p className="text-xs font-semibold text-primary">
                      {t("seller_products.suggested_attributes")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("seller_products.suggested_attributes_desc")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategory.attributes.map((attr) => (
                      <Badge key={attr.key} variant="secondary" className="text-xs font-medium">
                        {lang === "ar" ? attr.ar : attr.en}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ── 4. Pricing ───────────────────────────────────── */}
            <SectionCard
              icon={Tag}
              title={t("seller_products.pricing_section_title")}
              description={t("seller_products.pricing_section_desc")}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("seller_products.original_price_label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number" step="0.01" min="0" placeholder="10000"
                          className="h-11"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            field.onChange(val);
                            const sp = parseFloat((val * (1 - discountPct / 100)).toFixed(2));
                            setSalePrice(sp);
                            setPricingError(null);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("seller_products.sale_price_label")}
                  </label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={salePrice || ""}
                    placeholder="8000"
                    className={cn("h-11", pricingError ? "border-destructive focus-visible:ring-destructive" : "")}
                    onChange={(e) => {
                      const sp = parseFloat(e.target.value) || 0;
                      setSalePrice(sp);
                      const orig = form.getValues("price");
                      if (orig > 0 && sp > orig) {
                        setPricingError(t("seller_products.sale_exceeds_original"));
                        setDiscountPct(0);
                      } else {
                        setPricingError(null);
                        if (orig > 0) {
                          const dp = parseFloat(((1 - sp / orig) * 100).toFixed(1));
                          setDiscountPct(Math.min(90, Math.max(0, dp)));
                        }
                      }
                    }}
                  />
                  {pricingError && (
                    <p className="text-xs font-medium text-destructive">{pricingError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("seller_products.discount_pct_label")}
                  </label>
                  <div className="relative">
                    <Input
                      type="number" step="0.1" min="0" max="90"
                      value={discountPct || ""}
                      placeholder="0"
                      className="h-11 pe-8"
                      onChange={(e) => {
                        const dp = Math.min(90, Math.max(0, parseFloat(e.target.value) || 0));
                        setDiscountPct(dp);
                        const orig = form.getValues("price");
                        const sp = parseFloat((orig * (1 - dp / 100)).toFixed(2));
                        setSalePrice(sp);
                        setPricingError(null);
                      }}
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("seller_products.discount_pct_hint")}</p>
                </div>
              </div>

              {discountPct > 0 && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl">
                  <Tag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {t("seller_products.price_preview_on_sale", {
                      price: format(salePrice),
                      percent: Number.isInteger(discountPct) ? discountPct : discountPct.toFixed(1),
                    })}
                  </span>
                </div>
              )}
            </SectionCard>

            {/* ── 5. Inventory ─────────────────────────────────── */}
            <SectionCard icon={Package} title={t("seller_products.initial_stock")}>
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">{t("seller_products.initial_stock")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" placeholder="10" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            {/* ── 6. Variants ──────────────────────────────────── */}
            <SectionCard icon={Layers} title={t("variants.section_title")} description={t("variants.section_desc")}>
              <div className="flex items-center gap-3">
                <span className={cn("text-sm font-medium transition-colors duration-200", variantsEnabled ? "text-primary" : "text-muted-foreground")}>
                  {variantsEnabled ? t("variants.toggle_on") : t("variants.toggle_off")}
                </span>
                <button
                  type="button"
                  aria-pressed={variantsEnabled}
                  onClick={() => setVariantsEnabled((p) => !p)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 touch-manipulation",
                    variantsEnabled ? "bg-primary shadow-sm shadow-primary/30" : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] duration-200"
                    style={{ left: variantsEnabled ? 26 : 2 }}
                  />
                </button>
              </div>

              {variantsEnabled && (
                <VariantBuilder
                  groups={variantGroups}
                  onGroupsChange={setVariantGroups}
                  variants={variantRows}
                  onVariantsChange={setVariantRows}
                />
              )}

              {variantsEnabled && variantRows.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {t("variants.stock_note")}
                </p>
              )}
            </SectionCard>

            {/* ── 7. Description ───────────────────────────────── */}
            <SectionCard icon={FileText} title={t("seller_products.description")}>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">{t("seller_products.description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("seller_products.description_placeholder")}
                        className="min-h-[140px] text-base leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            {/* ── Desktop actions ───────────────────────────────── */}
            <div className="hidden md:flex justify-end gap-3 pt-2">
              <Link href="/seller/products">
                <Button variant="outline" type="button">{t("seller_products.cancel_btn")}</Button>
              </Link>
              <Button type="submit" disabled={isPending} className="min-w-[140px]">
                {isPending ? t("seller_products.creating") : t("seller_products.create_btn")}
              </Button>
            </div>

            {/* ── Mobile sticky save bar ────────────────────────── */}
            <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur-sm border-t shadow-lg px-4 py-3">
              <div className="flex gap-3 items-center max-w-2xl mx-auto">
                <Link href="/seller/products">
                  <Button variant="outline" type="button" className="h-12 px-5 shrink-0">
                    {t("seller_products.cancel_btn")}
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-12 text-base font-semibold"
                >
                  {isPending ? t("seller_products.creating") : t("seller_products.create_btn")}
                </Button>
              </div>
            </div>

          </form>
        </Form>
      </div>
    </Layout>
  );
}
