// @refresh reset
import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Zap, ImageIcon, X, ChevronDown, ChevronUp,
  GripVertical, Check, Pencil, Info, Eye, SlidersHorizontal,
  ChevronRight, ChevronLeft,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

// ─── Preset attribute types ────────────────────────────────────────────────────
const PRESETS = [
  {
    key: "color", icon: "🎨", name: "Color", nameAr: "اللون",
    suggestions:   ["Black","White","Gray","Silver","Gold","Blue","Red","Green","Yellow","Orange","Pink","Purple","Brown","Beige","Navy","Olive","Cream","Coral","Mint"],
    suggestionsAr: ["أسود","أبيض","رمادي","فضي","ذهبي","أزرق","أحمر","أخضر","أصفر","برتقالي","وردي","بنفسجي","بني","بيج","كحلي","زيتوني","كريمي","مرجاني","نعناعي"],
  },
  {
    key: "size", icon: "📏", name: "Size", nameAr: "المقاس",
    suggestions:   ["XS","S","M","L","XL","XXL","XXXL"],
    suggestionsAr: ["XS","S","M","L","XL","XXL","XXXL"],
  },
  {
    key: "storage", icon: "💾", name: "Storage", nameAr: "السعة",
    suggestions:   ["32GB","64GB","128GB","256GB","512GB","1TB","2TB"],
    suggestionsAr: ["32GB","64GB","128GB","256GB","512GB","1TB","2TB"],
  },
  {
    key: "ram", icon: "🧠", name: "RAM", nameAr: "الذاكرة",
    suggestions:   ["4GB","6GB","8GB","12GB","16GB","24GB","32GB"],
    suggestionsAr: ["4GB","6GB","8GB","12GB","16GB","24GB","32GB"],
  },
  {
    key: "material", icon: "🧵", name: "Material", nameAr: "الخامة",
    suggestions:   ["Cotton","Leather","Plastic","Wood","Glass","Metal","Polyester","Wool","Linen","Denim"],
    suggestionsAr: ["قطن","جلد","بلاستيك","خشب","زجاج","معدن","بوليستر","صوف","كتان","دنيم"],
  },
  {
    key: "style", icon: "✨", name: "Style", nameAr: "النمط",
    suggestions:   ["Classic","Modern","Sport","Casual","Premium","Formal","Vintage"],
    suggestionsAr: ["كلاسيكي","عصري","رياضي","كاجوال","مميز","رسمي","عتيق"],
  },
  {
    key: "model", icon: "📦", name: "Model", nameAr: "الموديل",
    suggestions:   [],
    suggestionsAr: [],
  },
  {
    key: "edition", icon: "🏷️", name: "Edition", nameAr: "الإصدار",
    suggestions:   ["Standard","Pro","Lite","Plus","Max","Ultra"],
    suggestionsAr: ["عادي","برو","لايت","بلس","ماكس","ألترا"],
  },
] as const;

type Preset = typeof PRESETS[number];

// Color name → CSS hex (EN + AR)
const COLOR_HEX: Record<string, string> = {
  black:"#1a1a1a", white:"#f8f8f8", gray:"#9ca3af", grey:"#9ca3af",
  silver:"#c4c4c4", gold:"#d97706", blue:"#3b82f6", red:"#ef4444",
  green:"#22c55e", yellow:"#eab308", orange:"#f97316", pink:"#ec4899",
  purple:"#a855f7", brown:"#78350f", navy:"#1e3a5f", teal:"#14b8a6",
  beige:"#e8dcc8", cream:"#fefce8", maroon:"#7f1d1d", olive:"#65a30d",
  coral:"#fb7185", mint:"#6ee7b7",
  أسود:"#1a1a1a", أبيض:"#f8f8f8", رمادي:"#9ca3af", فضي:"#c4c4c4",
  ذهبي:"#d97706", أزرق:"#3b82f6", أحمر:"#ef4444", أخضر:"#22c55e",
  أصفر:"#eab308", برتقالي:"#f97316", وردي:"#ec4899", بنفسجي:"#a855f7",
  بني:"#78350f", كحلي:"#1e3a5f", بيج:"#e8dcc8", كريمي:"#fefce8",
  زيتوني:"#65a30d", مرجاني:"#fb7185", نعناعي:"#6ee7b7",
};

const COLOR_GROUP_KEYS = new Set([
  "color","colour","colors","colours","اللون","الألوان","لون","ألوان",
]);

function isColorGroup(name: string) {
  return COLOR_GROUP_KEYS.has(name.toLowerCase().trim());
}
function getColorHex(value: string): string | null {
  return COLOR_HEX[value.toLowerCase().trim()] ?? COLOR_HEX[value.trim()] ?? null;
}
function findPreset(name: string): Preset | null {
  const lower = name.toLowerCase().trim();
  return (PRESETS as readonly Preset[]).find(
    p => p.name.toLowerCase() === lower || p.nameAr === name.trim() || p.key === lower,
  ) ?? null;
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface AttributeGroup {
  id: string;
  name: string;
  values: string[];
  enabled?: boolean;
}

export interface VariantRow {
  id: string;
  combination: { groupName: string; value: string }[];
  label: string;
  sku: string;
  price: number | null;
  compareAtPrice: number | null;
  barcode: string;
  weightGrams: number | null;
  stock: number;
  images: string[];
  active: boolean;
}

interface VariantBuilderProps {
  groups: AttributeGroup[];
  onGroupsChange: (groups: AttributeGroup[]) => void;
  variants: VariantRow[];
  onVariantsChange: (variants: VariantRow[]) => void;
  defaultStock?: number;
  hasVariants?: boolean;
  onHasVariantsChange?: (v: boolean) => void;
}

// ─── Exported helpers (unchanged public API) ───────────────────────────────────
export function cartesianVariants(groups: AttributeGroup[], defaultStock = 0): VariantRow[] {
  const valid = groups.filter(g =>
    g.name.trim() && g.values.some(v => v.trim()) && g.enabled !== false,
  );
  if (valid.length === 0) return [];
  let result: { groupName: string; value: string }[][] = [[]];
  for (const group of valid) {
    const next: { groupName: string; value: string }[][] = [];
    for (const existing of result) {
      for (const value of group.values.filter(v => v.trim())) {
        next.push([...existing, { groupName: group.name.trim(), value: value.trim() }]);
      }
    }
    result = next;
  }
  return result.map((combo, i) => ({
    id: `gen-${Date.now()}-${i}`,
    combination: combo,
    label: combo.map(c => c.value).join(" / "),
    sku: "", price: null, compareAtPrice: null, barcode: "",
    weightGrams: null, stock: defaultStock, images: [], active: true,
  }));
}

export function buildVariantPayload(groups: AttributeGroup[], variants: VariantRow[]) {
  const validGroups = groups.filter(g =>
    g.name.trim() && g.values.some(v => v.trim()) && g.enabled !== false,
  );
  return {
    groups: validGroups.map(g => ({
      name: g.name.trim(),
      options: g.values.filter(v => v.trim()).map(v => v.trim()),
    })),
    variants: variants.map(v => ({
      options: v.combination
        .map(c => {
          const gi = validGroups.findIndex(g => g.name.trim() === c.groupName);
          const g = validGroups[gi];
          const oi = g ? g.values.filter(x => x.trim()).findIndex(x => x.trim() === c.value) : -1;
          return { groupIndex: gi, optionIndex: oi };
        })
        .filter(o => o.groupIndex >= 0 && o.optionIndex >= 0),
      sku:            v.sku.trim() || undefined,
      price:          v.price != null && v.price > 0 ? v.price : undefined,
      compareAtPrice: v.compareAtPrice != null && v.compareAtPrice > 0 ? v.compareAtPrice : undefined,
      barcode:        v.barcode.trim() || undefined,
      weightGrams:    v.weightGrams != null && v.weightGrams > 0 ? v.weightGrams : undefined,
      stock:          Math.max(0, Math.round(v.stock)),
      images:         v.images.filter(u => u.trim()),
      active:         v.active,
    })),
  };
}

// ─── Toggle ────────────────────────────────────────────────────────────────────
// BULLETPROOF IMPLEMENTATION: position:absolute thumb with explicit physical
// left values. Completely direction-agnostic — does not rely on flex main-axis
// reversal in RTL or on margin-inline-start resolution.
//
// Geometry: track = w-11 (44px h-6 24px), thumb = w-4 (16px) h-4 (16px)
// Vertical center : top-1 = 4px  (because (24-16)/2 = 4px)
// OFF : left=2px  → thumb occupies 2–18px  → 26px clearance on end side  ✓
// ON  : left=26px → thumb occupies 26–42px → 2px clearance on end side   ✓
// Both values keep thumb inside the 44px track regardless of writing mode.
// Toggle visual is NOT direction-mirrored (matches iOS/WhatsApp convention).
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 touch-manipulation",
        on ? "bg-primary shadow-sm" : "bg-muted-foreground/30",
      )}
    >
      <span
        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] duration-200"
        style={{ left: on ? 26 : 2 }}
      />
    </button>
  );
}

// ─── InlineTagInput — styled as "+ Add X" ──────────────────────────────────────
function InlineTagInput({
  onAdd, placeholder,
}: { onAdd: (v: string) => void; placeholder?: string }) {
  const [val, setVal] = useState("");

  const submit = useCallback((raw: string) => {
    raw.split(/[,\n]+/).map(v => v.trim()).filter(Boolean).forEach(v => onAdd(v));
    setVal("");
  }, [onAdd]);

  return (
    <div className="relative">
      <Plus className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60 pointer-events-none" />
      <Input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            submit(val);
          }
        }}
        onPaste={e => {
          e.preventDefault();
          submit(e.clipboardData.getData("text"));
        }}
        placeholder={placeholder}
        className="ps-9 h-11 text-sm border-dashed border-primary/30 placeholder:text-muted-foreground/50 rounded-xl focus-visible:border-primary/60 transition-colors"
      />
    </div>
  );
}

// ─── TagInput (for generic use) ────────────────────────────────────────────────
function TagInput({
  onAdd, placeholder,
}: { onAdd: (v: string) => void; placeholder?: string }) {
  const [val, setVal] = useState("");
  const { t } = useTranslation();

  const submitValues = useCallback((raw: string) => {
    raw.split(/[,\n]+/).map(v => v.trim()).filter(Boolean).forEach(v => onAdd(v));
    setVal("");
  }, [onAdd]);

  return (
    <div className="relative">
      <Input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            submitValues(val);
          }
        }}
        onPaste={e => {
          e.preventDefault();
          submitValues(e.clipboardData.getData("text"));
        }}
        placeholder={placeholder ?? t("variants.tag_placeholder", "Type and press Enter or comma…")}
        className="h-9 text-sm"
      />
      <kbd className="absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5 text-[10px] text-muted-foreground/40 font-mono select-none">
        ↵
      </kbd>
    </div>
  );
}

// ─── ImagesList ─────────────────────────────────────────────────────────────────
function ImagesList({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const { t } = useTranslation();
  const addImage  = () => { if (images.length < 8) onChange([...images, ""]); };
  const removeImg = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const updateImg = (i: number, v: string) => { const n = [...images]; n[i] = v; onChange(n); };
  return (
    <div className="space-y-1.5">
      {images.map((url, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <div className="h-7 w-7 rounded border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {url ? (
              <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <ImageIcon className="h-3 w-3 text-muted-foreground/40" />
            )}
          </div>
          <Input value={url} onChange={e => updateImg(i, e.target.value)} placeholder={t("variants.image_url_placeholder", "Image URL")} className="h-7 text-xs flex-1" />
          <button type="button" onClick={() => removeImg(i)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors shrink-0">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {images.length < 8 && (
        <button type="button" onClick={addImage} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-1 min-h-[36px] touch-manipulation">
          <Plus className="h-3.5 w-3.5" />
          {t("variants.add_image", "Add image URL")}
        </button>
      )}
    </div>
  );
}

// ─── StepHeader ────────────────────────────────────────────────────────────────
function StepHeader({
  step, title, subtitle, right,
}: { step: number | string; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 sm:px-5 py-3.5 border-b bg-muted/20 rounded-t-2xl">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold shrink-0">
          {step}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="w-full sm:w-auto shrink-0">{right}</div>}
    </div>
  );
}

// ─── Preview Sidebar ───────────────────────────────────────────────────────────
function PreviewSidebar({
  groups, variants, combinationCount,
}: { groups: AttributeGroup[]; variants: VariantRow[]; combinationCount: number }) {
  const { t, i18n } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const isRtl = i18n.dir() === "rtl";

  const enabledGroups = groups.filter(g => g.enabled !== false && g.name.trim() && g.values.some(v => v.trim()));
  const activeCount   = variants.filter(v => v.active).length;
  const inactiveCount = variants.length - activeCount;
  const previewList   = showAll ? variants : variants.slice(0, 6);
  const ChevronNav    = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-4">
      {/* Card 1: Combination preview */}
      <div className="rounded-2xl border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-muted/20 rounded-t-2xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
            <Eye className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">{t("variants.preview_title", "معاينة التركيبات")}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("variants.preview_subtitle", "تتحدث المعاينة تلقائياً مع أي تغيير")}</p>
          </div>
          {combinationCount > 0 && (
            <Badge className="shrink-0 tabular-nums bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              {combinationCount} {t("variants.combo_unit", "تركيبة")}
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Formula box */}
          {enabledGroups.length > 0 && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-800/40 px-4 py-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-amber-800 dark:text-amber-300">
                <span className="text-xs text-amber-600 dark:text-amber-500 me-1">
                  {t("variants.formula_label", "عدد التركيبات =")}
                </span>
                {enabledGroups.map((g, i) => (
                  <span key={g.id} className="flex items-center gap-0.5">
                    <span className="font-bold">{g.values.filter(v => v.trim()).length}</span>
                    {i < enabledGroups.length - 1 && <span className="text-amber-400 dark:text-amber-600 mx-0.5">×</span>}
                  </span>
                ))}
                <span className="text-amber-400 dark:text-amber-600 mx-0.5">=</span>
                <span className="text-base font-extrabold text-amber-900 dark:text-amber-200">{combinationCount}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {enabledGroups.map(g => (
                  <span key={g.id} className="text-[11px] text-amber-700 dark:text-amber-400">
                    {g.name} ({g.values.filter(v => v.trim()).length})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Variant list */}
          {variants.length > 0 ? (
            <div className="space-y-0.5">
              {previewList.map(v => {
                const firstGroup = v.combination[0];
                const hex = firstGroup && isColorGroup(firstGroup.groupName) ? getColorHex(firstGroup.value) : null;
                const hasImg = v.images.filter(u => u.trim()).length > 0;
                return (
                  <div key={v.id} className="flex items-center gap-2.5 py-2 border-b border-border/40 last:border-0 group/row">
                    {/* Thumbnail */}
                    <div className="h-8 w-8 rounded-lg border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {hex ? (
                        <span className="h-full w-full block" style={{ backgroundColor: hex }} />
                      ) : hasImg ? (
                        <img
                          src={v.images.find(u => u.trim())}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <ImageIcon className="h-3 w-3 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Label */}
                    <span className="text-xs flex-1 min-w-0 truncate font-medium" dir={isRtl ? "rtl" : "ltr"}>{v.label}</span>

                    {/* Status badge */}
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
                      v.active
                        ? "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
                        : "text-muted-foreground border-border bg-muted/50",
                    )}>
                      {v.active ? t("variants.status_active", "نشط") : t("variants.status_inactive", "معطل")}
                    </span>

                    <ChevronNav className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                  </div>
                );
              })}

              {/* View all button */}
              {variants.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAll(p => !p)}
                  className="w-full mt-2 py-2 rounded-lg border border-border text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  {showAll
                    ? t("variants.show_less", "عرض أقل")
                    : t("variants.view_all_variants", "عرض كل {{count}} تركيبة", { count: variants.length })}
                </button>
              )}
            </div>
          ) : combinationCount > 0 ? (
            <div className="flex flex-col items-center py-6 text-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary/50" />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("variants.click_generate", "اضغط \"توليد التركيبات\" لإنشاء {{count}} تركيبة", { count: combinationCount })}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 text-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center">
                <Info className="h-4 w-4 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("variants.add_attrs_hint", "أضف مجموعات الخيارات لرؤية المعاينة")}
              </p>
            </div>
          )}

          {/* Stats row */}
          {variants.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              {[
                { label: t("variants.stat_total",    "الإجمالي"), value: variants.length, cls: "text-foreground" },
                { label: t("variants.stat_active",   "نشط"),     value: activeCount,     cls: "text-emerald-600 dark:text-emerald-400" },
                { label: t("variants.stat_inactive", "معطل"),    value: inactiveCount,   cls: "text-muted-foreground" },
              ].map(s => (
                <div key={s.label} className="text-center rounded-xl bg-muted/40 py-2">
                  <p className={cn("text-lg font-bold leading-tight tabular-nums", s.cls)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Tips */}
      <div className="rounded-2xl border bg-card shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold">{t("variants.tips_title", "نصائح مهمة")}</p>
        </div>
        <ul className="space-y-2">
          {[
            t("variants.tip1", "اختر فقط الخصائص المناسبة لمنتجك."),
            t("variants.tip2", "كلما كانت القيم دقيقة أصبح الاختيار أسهل على المشتري."),
            t("variants.tip3", "يمكنك تعديل أي قيمة أو إضافة المزيد لاحقاً."),
          ].map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary/50 text-sm leading-relaxed shrink-0 mt-0.5">•</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main VariantBuilder ───────────────────────────────────────────────────────
export function VariantBuilder({
  groups, onGroupsChange, variants, onVariantsChange, defaultStock = 0,
  hasVariants, onHasVariantsChange,
}: VariantBuilderProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  // Local UI state
  const [collapsed, setCollapsed]             = useState<Set<string>>(new Set());
  const [dragOverIdx, setDragOverIdx]         = useState<number | null>(null);
  const dragSrcIdx                            = useRef<number | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName]           = useState("");
  const customInputRef                        = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice]             = useState("");
  const [bulkCompare, setBulkCompare]         = useState("");
  const [bulkStock, setBulkStock]             = useState("");
  const [bulkSkuPrefix, setBulkSkuPrefix]     = useState("");
  const [expandedImgs, setExpandedImgs]       = useState<Set<string>>(new Set());

  // Computed
  const enabledGroups = useMemo(
    () => groups.filter(g => g.enabled !== false && g.name.trim() && g.values.some(v => v.trim())),
    [groups],
  );
  const combinationCount = useMemo(
    () => enabledGroups.length === 0
      ? 0
      : enabledGroups.reduce((acc, g) => acc * g.values.filter(v => v.trim()).length, 1),
    [enabledGroups],
  );

  // ── Group mutations ─────────────────────────────────────────────────────────
  const addPreset = useCallback((preset: Preset) => {
    if (groups.some(g => g.name.toLowerCase() === preset.name.toLowerCase() || g.name === preset.nameAr)) return;
    onGroupsChange([...groups, { id: `grp-${Date.now()}`, name: preset.name, values: [], enabled: true }]);
  }, [groups, onGroupsChange]);

  const addCustomGroup = useCallback(() => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    if (groups.some(g => g.name.toLowerCase() === trimmed.toLowerCase())) { setCustomName(""); setShowCustomInput(false); return; }
    onGroupsChange([...groups, { id: `grp-${Date.now()}`, name: trimmed, values: [], enabled: true }]);
    setCustomName("");
    setShowCustomInput(false);
  }, [customName, groups, onGroupsChange]);

  const removeGroup        = useCallback((id: string) => onGroupsChange(groups.filter(g => g.id !== id)), [groups, onGroupsChange]);
  const toggleGroupEnabled = useCallback((id: string) => onGroupsChange(groups.map(g => g.id === id ? { ...g, enabled: g.enabled === false ? true : false } : g)), [groups, onGroupsChange]);
  const toggleCollapsed    = useCallback((id: string) => setCollapsed(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }), []);

  const addValue    = useCallback((id: string, value: string) =>
    onGroupsChange(groups.map(g =>
      g.id === id && !g.values.map(v => v.toLowerCase()).includes(value.toLowerCase())
        ? { ...g, values: [...g.values, value] }
        : g,
    )), [groups, onGroupsChange]);

  const removeValue = useCallback((id: string, value: string) =>
    onGroupsChange(groups.map(g => g.id === id ? { ...g, values: g.values.filter(v => v !== value) } : g)),
  [groups, onGroupsChange]);

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const onDragStart = useCallback((idx: number) => { dragSrcIdx.current = idx; }, []);
  const onDragOver  = useCallback((e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); }, []);
  const onDrop      = useCallback((e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const srcIdx = dragSrcIdx.current;
    if (srcIdx !== null && srcIdx !== targetIdx) {
      const next = [...groups];
      const [moved] = next.splice(srcIdx, 1);
      next.splice(targetIdx, 0, moved);
      onGroupsChange(next);
    }
    dragSrcIdx.current = null;
    setDragOverIdx(null);
  }, [groups, onGroupsChange]);
  const onDragEnd   = useCallback(() => { dragSrcIdx.current = null; setDragOverIdx(null); }, []);

  // ── Generate ────────────────────────────────────────────────────────────────
  const generate = useCallback(() => {
    onVariantsChange(cartesianVariants(groups, defaultStock));
    setSelectedIds(new Set());
  }, [groups, defaultStock, onVariantsChange]);

  // ── Variant mutations ────────────────────────────────────────────────────────
  const updateVariant = useCallback((id: string, field: keyof VariantRow, value: unknown) =>
    onVariantsChange(variants.map(v => v.id === id ? { ...v, [field]: value } : v)),
  [variants, onVariantsChange]);

  const toggleSelect    = useCallback((id: string) => setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }), []);
  const allSelected     = variants.length > 0 && selectedIds.size === variants.length;
  const selectAll       = useCallback((checked: boolean) => setSelectedIds(checked ? new Set(variants.map(v => v.id)) : new Set()), [variants]);
  const toggleImgExpand = useCallback((id: string) => setExpandedImgs(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }), []);

  const applyBulk = useCallback((action: string) => {
    const ids = selectedIds.size > 0 ? selectedIds : new Set(variants.map(v => v.id));
    if (action === "delete") {
      onVariantsChange(variants.filter(v => !ids.has(v.id)));
      setSelectedIds(new Set());
      return;
    }
    onVariantsChange(variants.map(v => {
      if (!ids.has(v.id)) return v;
      if (action === "price"   && bulkPrice   !== "") return { ...v, price:          parseFloat(bulkPrice)   || null };
      if (action === "compare" && bulkCompare !== "") return { ...v, compareAtPrice: parseFloat(bulkCompare) || null };
      if (action === "stock"   && bulkStock   !== "") return { ...v, stock:           parseInt(bulkStock)    || 0 };
      if (action === "enable")  return { ...v, active: true };
      if (action === "disable") return { ...v, active: false };
      return v;
    }));
  }, [selectedIds, variants, bulkPrice, bulkCompare, bulkStock, onVariantsChange]);

  const applyBulkAll = useCallback(() => {
    const ids = selectedIds.size > 0 ? selectedIds : new Set(variants.map(v => v.id));
    let skuIdx = 0;
    onVariantsChange(variants.map(v => {
      if (!ids.has(v.id)) return v;
      const upd: Partial<VariantRow> = {};
      if (bulkPrice   !== "") upd.price          = parseFloat(bulkPrice)   || null;
      if (bulkCompare !== "") upd.compareAtPrice  = parseFloat(bulkCompare) || null;
      if (bulkStock   !== "") upd.stock           = parseInt(bulkStock)    || 0;
      if (bulkSkuPrefix !== "") {
        upd.sku = `${bulkSkuPrefix}-${String(++skuIdx).padStart(3, "0")}`;
      }
      return { ...v, ...upd };
    }));
  }, [selectedIds, variants, bulkPrice, bulkCompare, bulkStock, bulkSkuPrefix, onVariantsChange]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Global Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4 justify-between flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("variants.page_title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("variants.page_subtitle")}
          </p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 shadow-sm">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* ── Has Variants Toggle ────────────────────────────────────────────── */}
      {onHasVariantsChange && (
        <div className="inline-flex items-center gap-3 py-2.5 px-4 rounded-xl bg-muted/50 border">
          <Toggle
            on={hasVariants ?? true}
            onToggle={() => onHasVariantsChange(!(hasVariants ?? true))}
          />
          <span className="text-sm font-medium">
            {t("variants.has_variants_label")}
          </span>
        </div>
      )}

      {/*
        Two-column grid:
        DOM order: sidebar first → builder second
        xl: sidebar = CSS-left (in RTL = visual-right ✓)
        Mobile: builder top (order-first), sidebar bottom (order-last)
      */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <div className="order-last xl:order-first xl:sticky xl:top-4 xl:self-start">
          <PreviewSidebar
            groups={groups}
            variants={variants}
            combinationCount={combinationCount}
          />
        </div>

        {/* ── BUILDER SECTIONS ────────────────────────────────────────────── */}
        <div className="order-first xl:order-last space-y-4">

          {/* ── STEP 1: Add Attribute Group ──────────────────────────────── */}
          <div className="rounded-2xl border bg-card shadow-sm">
            <StepHeader
              step={1}
              title={t("variants.add_group_section", "إضافة مجموعة خيارات")}
            />
            <div className="p-5 space-y-4">

              {/* Preset chips */}
              <div className="flex flex-wrap gap-2">
                {(PRESETS as readonly Preset[]).map(preset => {
                  const exists = groups.some(
                    g => g.name.toLowerCase() === preset.name.toLowerCase() || g.name === preset.nameAr,
                  );
                  const label = isRtl ? preset.nameAr : preset.name;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      disabled={exists}
                      onClick={() => addPreset(preset)}
                      className={cn(
                        "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-150 select-none",
                        exists
                          ? "bg-primary/8 border-primary/20 text-primary/60 cursor-default"
                          : "bg-background hover:bg-primary/5 border-border hover:border-primary/40 text-foreground cursor-pointer hover:shadow-sm active:scale-95",
                      )}
                    >
                      <span className="text-base leading-none">{preset.icon}</span>
                      {label}
                      {exists && <Check className="h-3.5 w-3.5 text-primary/60 shrink-0" />}
                    </button>
                  );
                })}

                {/* Custom chip */}
                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => { setShowCustomInput(true); setTimeout(() => customInputRef.current?.focus(), 50); }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-muted-foreground/30 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all duration-150 cursor-pointer active:scale-95"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t("variants.custom", "مخصص")}
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap w-full mt-1">
                    <Input
                      ref={customInputRef}
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { e.preventDefault(); addCustomGroup(); }
                        if (e.key === "Escape") { setShowCustomInput(false); setCustomName(""); }
                      }}
                      placeholder={t("variants.custom_placeholder", "e.g. Language, Weight")}
                      className="h-9 text-sm flex-1 min-w-0"
                    />
                    <Button type="button" size="sm" className="h-9 px-4" onClick={addCustomGroup}>
                      {t("common.add", "Add")}
                    </Button>
                    <button type="button" onClick={() => { setShowCustomInput(false); setCustomName(""); }} className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0 touch-manipulation">
                      <X className="h-4 w-4" />
                    </button>
                    <p className="w-full text-xs text-muted-foreground mt-0.5">
                      {t("variants.custom_examples", "مثال: اللغة، الضمان، الطول، السعة")}
                    </p>
                  </div>
                )}
              </div>

              {groups.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("variants.preset_hint", "اختر نوع الخاصية المناسبة لمنتجك، أو أنشئ خاصية مخصصة.")}
                </p>
              )}
            </div>
          </div>

          {/* ── STEP 2: Added Groups ──────────────────────────────────────── */}
          {groups.length > 0 && (
            <div className="rounded-2xl border bg-card shadow-sm">
              <StepHeader
                step={2}
                title={t("variants.added_groups", "مجموعات الخيارات المضافة")}
              />
              <div className="p-5 space-y-3">
                {groups.map((group, gIdx) => {
                  const isCollapsed = collapsed.has(group.id);
                  const isEnabled   = group.enabled !== false;
                  const preset      = findPreset(group.name);
                  const isColor     = isColorGroup(group.name);
                  const isDragOver  = dragOverIdx === gIdx;

                  const suggestions = (() => {
                    if (!preset) return [] as string[];
                    const list = i18n.language === "ar" ? preset.suggestionsAr : preset.suggestions;
                    return (list as readonly string[]).filter(
                      s => !group.values.map(v => v.toLowerCase()).includes(s.toLowerCase()),
                    );
                  })();

                  return (
                    <div
                      key={group.id}
                      draggable
                      onDragStart={() => onDragStart(gIdx)}
                      onDragOver={e => onDragOver(e, gIdx)}
                      onDrop={e => onDrop(e, gIdx)}
                      onDragEnd={onDragEnd}
                      className={cn(
                        "rounded-xl border bg-background transition-all duration-150 shadow-sm",
                        isDragOver && "ring-2 ring-primary border-primary shadow-md scale-[1.01]",
                        !isEnabled && "opacity-60",
                      )}
                    >
                      {/* Group header — flex-wrap so action buttons drop below on very narrow screens */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-1.5 sm:gap-x-2.5 px-3 sm:px-4 py-2.5 sm:py-3 border-b bg-muted/10 rounded-t-xl">

                        {/* ── Start group: drag handle + number + emoji + name + count ── */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                          {/* Drag handle — hidden on mobile (touch devices can't drag) */}
                          <div className="hidden sm:block text-muted-foreground/25 hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing shrink-0 touch-none transition-colors">
                            <GripVertical className="h-4 w-4" />
                          </div>

                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                            {gIdx + 1}
                          </span>

                          {preset && <span className="text-base leading-none shrink-0">{preset.icon}</span>}

                          <span className="text-sm font-semibold min-w-0 truncate">
                            {group.name || t("variants.unnamed_group", "بدون اسم")}
                          </span>

                          {group.values.filter(v => v.trim()).length > 0 && (
                            <span className="text-[11px] text-primary font-bold bg-primary/10 rounded-lg px-2 py-0.5 tabular-nums shrink-0">
                              {group.values.filter(v => v.trim()).length}
                            </span>
                          )}
                        </div>

                        {/* ── End group: toggle + trash + collapse — stays together, wraps as unit ── */}
                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                          <Toggle on={isEnabled} onToggle={() => toggleGroupEnabled(group.id)} />

                          <button
                            type="button"
                            onClick={() => removeGroup(group.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground/40 transition-colors shrink-0 touch-manipulation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleCollapsed(group.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground/40 hover:text-foreground transition-colors shrink-0 touch-manipulation"
                          >
                            {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Group body */}
                      {!isCollapsed && (
                        <div className="p-4 space-y-3">
                          {/* Selected value pills */}
                          <div className="flex flex-wrap gap-2 min-h-[36px] items-start">
                            {group.values.length === 0 ? (
                              <span className="text-sm text-muted-foreground/50 italic self-center">
                                {t("variants.no_values", "لم يتم إضافة قيم بعد")}
                              </span>
                            ) : group.values.map(val => {
                              const hex = isColor ? getColorHex(val) : null;
                              if (hex) {
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => removeValue(group.id, val)}
                                    title={t("variants.click_to_remove", "انقر للإزالة")}
                                    className="group/v inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:border-destructive/40 bg-background transition-all duration-150 shadow-sm min-h-[36px] touch-manipulation"
                                  >
                                    <span
                                      className="h-4 w-4 rounded-full border border-black/10 dark:border-white/10 shrink-0 shadow-sm"
                                      style={{ backgroundColor: hex }}
                                    />
                                    <span className="text-sm font-medium">{val}</span>
                                    <X className="h-3 w-3 text-muted-foreground/30 group-hover/v:text-destructive/70 transition-colors" />
                                  </button>
                                );
                              }
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => removeValue(group.id, val)}
                                  title={t("variants.click_to_remove", "انقر للإزالة")}
                                  className="group/v inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-sm font-medium hover:border-destructive/40 transition-all duration-150 shadow-sm min-h-[36px] touch-manipulation"
                                >
                                  {val}
                                  <X className="h-3 w-3 text-muted-foreground/30 group-hover/v:text-destructive/70 transition-colors" />
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick-add suggestion pills */}
                          {suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="text-xs font-medium text-muted-foreground/60 shrink-0 me-1">
                                {t("variants.quick_add", "إضافة سريعة:")}
                              </span>
                              {suggestions.map(s => {
                                const hex = isColor ? getColorHex(s) : null;
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => addValue(group.id, s)}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-full border border-primary/25 text-primary/75 hover:bg-primary/8 hover:border-primary/50 hover:text-primary transition-all duration-150 min-h-[36px] touch-manipulation"
                                  >
                                    {hex ? (
                                      <span
                                        className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                                        style={{ backgroundColor: hex }}
                                      />
                                    ) : (
                                      <Plus className="h-2.5 w-2.5 shrink-0" />
                                    )}
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Inline tag input — styled as "+ إضافة X" */}
                          <InlineTagInput
                            onAdd={v => addValue(group.id, v)}
                            placeholder={
                              isColor
                                ? t("variants.add_color_placeholder", "إضافة لون")
                                : `${t("variants.add_value_prefix", "إضافة")} ${group.name}`
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add another group */}
                <button
                  type="button"
                  onClick={() => { setShowCustomInput(true); setTimeout(() => customInputRef.current?.focus(), 50); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-muted-foreground/25 hover:border-primary/40 hover:bg-primary/5 text-sm text-muted-foreground hover:text-primary transition-all duration-150"
                >
                  <Plus className="h-4 w-4" />
                  {t("variants.add_new_group", "إضافة مجموعة خيارات جديدة")}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Generate & Manage ─────────────────────────────────── */}
          <div className="rounded-2xl border bg-card shadow-sm">
            <StepHeader
              step={groups.length > 0 ? 4 : 2}
              title={t("variants.manage_section")}
              subtitle={variants.length > 0
                ? t("variants.manage_subtitle")
                : undefined}
              right={
                <Button
                  type="button"
                  onClick={generate}
                  disabled={combinationCount === 0}
                  size="sm"
                  className="gap-2 h-9 px-5 shrink-0 w-full sm:w-auto"
                >
                  <Zap className="h-3.5 w-3.5" />
                  {variants.length > 0
                    ? t("variants.regenerate")
                    : combinationCount > 0
                      ? t("variants.generate_n", { count: combinationCount })
                      : t("variants.generate")}
                </Button>
              }
            />
            <div className="p-5 space-y-4">

              {/* Formula display */}
              {enabledGroups.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {enabledGroups.map((g, i) => (
                    <span key={g.id} className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-muted border rounded-xl px-3 py-1.5 text-sm font-medium">
                        <span className="text-primary font-bold tabular-nums">{g.values.filter(v => v.trim()).length}</span>
                        <span className="text-muted-foreground text-xs">{g.name}</span>
                      </span>
                      {i < enabledGroups.length - 1 && (
                        <span className="text-muted-foreground/60 font-bold">×</span>
                      )}
                    </span>
                  ))}
                  <span className="text-muted-foreground/60 font-bold">=</span>
                  <span className="text-2xl font-extrabold text-primary tabular-nums">{combinationCount}</span>
                  <span className="text-sm text-muted-foreground">{t("variants.combinations_label", "تركيبة")}</span>
                </div>
              )}

              {combinationCount === 0 && groups.length > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {t("variants.no_groups_hint", "أضف قيماً لمجموعة خيارات واحدة على الأقل لتوليد التركيبات.")}
                </p>
              )}

              {/* Variant table */}
              {variants.length > 0 && (
                <div className="space-y-4 pt-2 border-t">

                  {/* ── Bulk action toolbar ── */}
                  <div className="rounded-xl border bg-muted/20 p-3 sm:p-4 space-y-3">
                    {/* Row 1: select all + enable/disable/delete */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none min-h-[40px] sm:min-h-0 touch-manipulation">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={e => selectAll(e.target.checked)}
                          className="h-4 w-4 rounded border-muted-foreground/30 accent-primary"
                        />
                        <span className="text-sm font-medium">{t("variants.select_all", "تحديد الكل")}</span>
                        {selectedIds.size > 0 && (
                          <Badge variant="secondary" className="text-xs tabular-nums">({selectedIds.size})</Badge>
                        )}
                      </label>

                      <div className="flex items-center gap-1.5 flex-wrap sm:ms-auto">
                        <Button
                          type="button" size="sm" variant="outline"
                          className="h-9 text-xs border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 touch-manipulation"
                          onClick={() => applyBulk("enable")}
                        >
                          {t("variants.enable_all", "تفعيل")}
                        </Button>
                        <Button
                          type="button" size="sm" variant="outline"
                          className="h-9 text-xs border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 touch-manipulation"
                          onClick={() => applyBulk("disable")}
                        >
                          {t("variants.disable_all", "تعطيل")}
                        </Button>
                        {selectedIds.size > 0 && (
                          <Button
                            type="button" size="sm" variant="destructive"
                            className="h-9 touch-manipulation"
                            onClick={() => applyBulk("delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Row 2: bulk field grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {t("variants.price_col", "السعر")}
                        </label>
                        <Input
                          type="number" step="0.01" min="0"
                          value={bulkPrice}
                          onChange={e => setBulkPrice(e.target.value)}
                          placeholder="—"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {t("variants.compare_col", "السعر قبل الخصم")}
                        </label>
                        <Input
                          type="number" step="0.01" min="0"
                          value={bulkCompare}
                          onChange={e => setBulkCompare(e.target.value)}
                          placeholder="—"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {t("variants.stock_col", "المخزون")}
                        </label>
                        <Input
                          type="number" min="0" step="1"
                          value={bulkStock}
                          onChange={e => setBulkStock(e.target.value)}
                          placeholder="—"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {t("variants.bulk_sku_prefix", "SKU Prefix")}
                        </label>
                        <Input
                          value={bulkSkuPrefix}
                          onChange={e => setBulkSkuPrefix(e.target.value)}
                          placeholder="SKU-"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    {/* Apply button */}
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 px-5 w-full sm:w-auto"
                      onClick={applyBulkAll}
                    >
                      {t("variants.apply_to_selected", "تطبيق على المحدد")}
                      {" "}
                      ({selectedIds.size > 0 ? selectedIds.size : variants.length})
                    </Button>
                  </div>

                  {/* ── Variant table ── */}
                  <div className="rounded-xl border">
                    {/* Table header — lg+ only (1024px, where 1fr col has ≥300px) */}
                    <div className="hidden lg:grid lg:grid-cols-[28px_52px_1fr_100px_100px_96px_116px_52px] gap-2 px-4 py-2.5 bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wide rounded-t-xl">
                      <span />
                      <span>{t("variants.image_col", "صورة")}</span>
                      <span>{t("variants.variant_label", "التركيبة")}</span>
                      <span>{t("variants.price_col", "السعر")}</span>
                      <span>{t("variants.compare_col", "قبل الخصم")}</span>
                      <span>{t("variants.stock_col", "المخزون")}</span>
                      <span>{t("variants.sku_col", "SKU")}</span>
                      <span>{t("variants.active_col", "الحالة")}</span>
                    </div>

                    <div className="divide-y">
                      {variants.map(v => {
                        const isImgsOpen = expandedImgs.has(v.id);
                        const imageCount = v.images.filter(u => u.trim()).length;
                        const firstGroup = v.combination[0];
                        const colorHex   = firstGroup && isColorGroup(firstGroup.groupName)
                          ? getColorHex(firstGroup.value)
                          : null;
                        const firstImg   = imageCount > 0 ? v.images.find(u => u.trim()) : null;

                        return (
                          <div
                            key={v.id}
                            className={cn(
                              "px-4 py-3 space-y-2.5 transition-colors duration-100",
                              "lg:px-4 lg:py-3",
                              selectedIds.has(v.id) && "bg-primary/5",
                            )}
                          >
                            {/* Main row */}
                            <div className="grid grid-cols-1 lg:grid-cols-[28px_52px_1fr_100px_100px_96px_116px_52px] gap-2 items-start lg:items-center">

                              {/*
                                Below lg: flex row — checkbox + image + label all in one line.
                                lg+: display:contents makes children participate directly in the parent grid.
                              */}
                              <div className="flex items-start gap-2 lg:contents">

                                {/* Checkbox */}
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(v.id)}
                                  onChange={() => toggleSelect(v.id)}
                                  className="h-4 w-4 rounded accent-primary mt-1.5 lg:mt-0 shrink-0"
                                />

                                {/* Image cell — 48×48 below lg (touch-friendly), 36px × full col on lg+ */}
                                <button
                                  type="button"
                                  onClick={() => toggleImgExpand(v.id)}
                                  className="h-12 w-12 lg:h-9 lg:w-full rounded-lg border bg-muted flex items-center justify-center shrink-0 hover:border-primary/50 transition-colors overflow-hidden touch-manipulation"
                                >
                                  {colorHex ? (
                                    <span className="h-full w-full block" style={{ backgroundColor: colorHex }} />
                                  ) : firstImg ? (
                                    <img
                                      src={firstImg}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <ImageIcon className="h-3 w-3 text-muted-foreground/40" />
                                      {imageCount > 0 && (
                                        <span className="text-[9px] text-primary font-bold">{imageCount}</span>
                                      )}
                                    </div>
                                  )}
                                </button>

                                {/* Variant label + below-lg fields */}
                                <div className="flex-1 min-w-0 lg:flex-none">
                                  <p className="text-sm font-semibold leading-snug">{v.label}</p>
                                  {/* Below-lg: card-style fields grid */}
                                  <div className="lg:hidden mt-3 rounded-xl border bg-muted/20 p-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{t("variants.price_col", "السعر")}</p>
                                        <Input
                                          type="number" step="0.01" min="0"
                                          value={v.price ?? ""}
                                          onChange={e => updateVariant(v.id, "price", e.target.value === "" ? null : parseFloat(e.target.value) || null)}
                                          placeholder={t("variants.price_inherit", "الأساسي")}
                                          className="h-10 text-xs"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{t("variants.compare_col", "قبل الخصم")}</p>
                                        <Input
                                          type="number" step="0.01" min="0"
                                          value={v.compareAtPrice ?? ""}
                                          onChange={e => updateVariant(v.id, "compareAtPrice", e.target.value === "" ? null : parseFloat(e.target.value) || null)}
                                          placeholder="—"
                                          className="h-10 text-xs"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{t("variants.stock_col", "المخزون")}</p>
                                        <Input
                                          type="number" min="0" step="1"
                                          value={v.stock}
                                          onChange={e => updateVariant(v.id, "stock", parseInt(e.target.value) || 0)}
                                          className="h-10 text-xs"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{t("variants.sku_col", "SKU")}</p>
                                        <Input
                                          value={v.sku}
                                          onChange={e => updateVariant(v.id, "sku", e.target.value)}
                                          placeholder="SKU"
                                          className="h-10 text-xs"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-0.5">
                                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{t("variants.active_col", "نشط")}</p>
                                      <Toggle on={v.active} onToggle={() => updateVariant(v.id, "active", !v.active)} />
                                    </div>
                                  </div>
                                </div>

                              </div>{/* end lg:contents */}

                              {/* lg+-only: individual grid cells */}
                              <Input
                                type="number" step="0.01" min="0"
                                value={v.price ?? ""}
                                onChange={e => updateVariant(v.id, "price", e.target.value === "" ? null : parseFloat(e.target.value) || null)}
                                placeholder={t("variants.price_inherit", "الأساسي")}
                                className="hidden lg:block h-8 text-xs w-full"
                              />
                              <Input
                                type="number" step="0.01" min="0"
                                value={v.compareAtPrice ?? ""}
                                onChange={e => updateVariant(v.id, "compareAtPrice", e.target.value === "" ? null : parseFloat(e.target.value) || null)}
                                placeholder="—"
                                className="hidden lg:block h-8 text-xs w-full"
                              />
                              <Input
                                type="number" min="0" step="1"
                                value={v.stock}
                                onChange={e => updateVariant(v.id, "stock", parseInt(e.target.value) || 0)}
                                className="hidden lg:block h-8 text-xs w-full"
                              />
                              <Input
                                value={v.sku}
                                onChange={e => updateVariant(v.id, "sku", e.target.value)}
                                placeholder="SKU"
                                className="hidden lg:block h-8 text-xs w-full"
                              />
                              <div className="hidden lg:flex justify-center">
                                <Toggle on={v.active} onToggle={() => updateVariant(v.id, "active", !v.active)} />
                              </div>
                            </div>

                            {/* Expanded images panel */}
                            {isImgsOpen && (
                              <div className="ms-6 lg:ms-[84px] bg-muted/30 rounded-lg p-3 border border-dashed space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-semibold text-muted-foreground">
                                    {t("variants.variant_images", "صور هذه التركيبة")}
                                  </p>
                                  {groups.length > 0 && imageCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const primaryValue = v.combination[0]?.value;
                                        if (!primaryValue) return;
                                        onVariantsChange(variants.map(r =>
                                          r.combination[0]?.value === primaryValue
                                            ? { ...r, images: [...v.images] }
                                            : r,
                                        ));
                                      }}
                                      className="text-[10px] text-primary hover:underline"
                                    >
                                      {t("variants.copy_to_same", "نسخ لنفس {{attr}}", { attr: groups[0]?.name || "variant" })}
                                    </button>
                                  )}
                                </div>
                                <ImagesList
                                  images={v.images}
                                  onChange={imgs => updateVariant(v.id, "images", imgs)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t("variants.price_inherit_note", "اتركْ حقل السعر فارغاً لاستخدام السعر الأساسي للمنتج. 'قبل الخصم' هو السعر الأصلي المشطوب.")}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
        {/* end builder column */}
      </div>
    </div>
  );
}
