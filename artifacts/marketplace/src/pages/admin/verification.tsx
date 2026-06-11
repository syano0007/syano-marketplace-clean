import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SellerTrustBadge, TrustScoreBar, type VerificationLevel } from "@/components/SellerTrustBadge";
import {
  Shield, ShieldCheck, Award, ShieldX, Store,
  RefreshCw, Search, ChevronDown,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface SellerVerificationRow {
  userId: number;
  name: string;
  email: string;
  isVerified: boolean;
  verificationLevel: string;
  verifiedAt: string | null;
  verificationMethod: string | null;
  trustScore: number | null;
  trustLevel: string;
  storeName: string | null;
  storeSlug: string | null;
  createdAt: string;
}

const VERIFY_TIERS: { value: VerificationLevel; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { value: "basic",    label: "Basic Verified",    desc: "Phone/email confirmed.",                           icon: Shield,      color: "text-blue-600" },
  { value: "verified", label: "ID Verified",       desc: "Government ID checked and confirmed.",             icon: ShieldCheck, color: "text-emerald-600" },
  { value: "business", label: "Business Verified", desc: "Business license and commercial registration.",    icon: Award,       color: "text-violet-600" },
];

const FILTER_OPTIONS = [
  { value: "all",      label: "All sellers" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
  { value: "basic",    label: "Basic" },
  { value: "id_verified", label: "ID Verified" },
  { value: "business", label: "Business" },
];

export default function AdminVerificationPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [verifyTarget, setVerifyTarget] = useState<SellerVerificationRow | null>(null);
  const [verifyLevel, setVerifyLevel] = useState<VerificationLevel>("basic");
  const [unverifyTarget, setUnverifyTarget] = useState<SellerVerificationRow | null>(null);
  const [recomputeId, setRecomputeId] = useState<number | null>(null);

  const { data: sellers = [], isLoading, refetch } = useQuery<SellerVerificationRow[]>({
    queryKey: ["admin-verification-list"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sellers/verification", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!token,
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, level }: { id: number; level: VerificationLevel }) => {
      const res = await fetch(`/api/admin/sellers/${id}/verification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", level }),
      });
      if (!res.ok) throw new Error("Failed to verify");
      return res.json();
    },
    onSuccess: (_, { id }) => {
      toast({ title: "Seller verified" });
      setVerifyTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-verification-list"] });
    },
    onError: () => toast({ title: "Failed to verify", variant: "destructive" }),
  });

  const unverifyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/sellers/${id}/verification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unverify" }),
      });
      if (!res.ok) throw new Error("Failed to unverify");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Verification removed" });
      setUnverifyTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-verification-list"] });
    },
    onError: () => toast({ title: "Failed to remove verification", variant: "destructive" }),
  });

  const recomputeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/sellers/${id}/recompute-trust`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to recompute");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `Trust score updated: ${data.trustScore}/100` });
      setRecomputeId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-verification-list"] });
    },
    onError: () => toast({ title: "Failed to recompute trust score", variant: "destructive" }),
  });

  const filtered = sellers.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.storeName ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "verified" && s.isVerified) ||
      (filter === "unverified" && !s.isVerified) ||
      (filter === "basic" && s.verificationLevel === "basic") ||
      (filter === "id_verified" && s.verificationLevel === "verified") ||
      (filter === "business" && s.verificationLevel === "business");

    return matchesSearch && matchesFilter;
  });

  const verifiedCount   = sellers.filter((s) => s.isVerified).length;
  const unverifiedCount = sellers.filter((s) => !s.isVerified).length;
  const businessCount   = sellers.filter((s) => s.verificationLevel === "business").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground">{t("admin.verification_title", "Seller Verification")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("admin.verification_desc", "Manage seller verification tiers and trust scores.")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            {t("admin.refresh", "Refresh")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total sellers", value: sellers.length, color: "text-foreground" },
            { label: "Verified", value: verifiedCount, color: "text-emerald-600" },
            { label: "Unverified", value: unverifiedCount, color: "text-amber-600" },
            { label: "Business tier", value: businessCount, color: "text-violet-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border/80 rounded-2xl p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.search_sellers", "Search sellers...")}
              className="ps-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                  filter === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
              <Store className="h-8 w-8 opacity-30" />
              <p className="text-sm">{t("admin.no_sellers_found", "No sellers found")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{t("admin.col_seller", "Seller")}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{t("admin.col_verification", "Verification")}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{t("trust.trust_score", "Trust Score")}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{t("admin.col_verified_at", "Verified At")}</th>
                    <th className="text-end px-4 py-3 font-semibold text-muted-foreground">{t("admin.col_actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((seller, i) => {
                    const level = (seller.verificationLevel ?? "none") as VerificationLevel;
                    return (
                      <tr key={seller.userId} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-black text-primary">{seller.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{seller.name}</p>
                              <p className="text-xs text-muted-foreground">{seller.email}</p>
                              {seller.storeName && (
                                <p className="text-xs text-muted-foreground">{seller.storeName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {seller.isVerified && level !== "none" ? (
                            <SellerTrustBadge level={level} isVerified={seller.isVerified} size="sm" />
                          ) : (
                            <span className="text-xs text-muted-foreground">{t("admin.unverified", "Unverified")}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {seller.trustScore != null ? (
                            <div className="w-32">
                              <TrustScoreBar score={seller.trustScore} size="sm" />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {seller.verifiedAt ? format(new Date(seller.verifiedAt), "dd MMM yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                setRecomputeId(null);
                                recomputeMutation.mutate(seller.userId);
                              }}
                              disabled={recomputeMutation.isPending}
                              title="Recompute trust score"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            {seller.isVerified ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                                onClick={() => setUnverifyTarget(seller)}
                                title="Remove verification"
                              >
                                <ShieldX className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => { setVerifyTarget(seller); setVerifyLevel("basic"); }}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {seller.isVerified ? t("admin.change_tier", "Change") : t("admin.verify_user", "Verify")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Verify dialog */}
      <Dialog open={!!verifyTarget} onOpenChange={() => setVerifyTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.verify_user_title", "Verify Seller")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("admin.verify_user_desc_name", "Select verification tier for {{name}}:", { name: verifyTarget?.name })}
          </p>
          <RadioGroup value={verifyLevel} onValueChange={(v) => setVerifyLevel(v as VerificationLevel)} className="gap-3 mt-1">
            {VERIFY_TIERS.map((tier) => {
              const TIcon = tier.icon;
              return (
                <Label
                  key={tier.value}
                  htmlFor={`vtier-${tier.value}`}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${verifyLevel === tier.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
                >
                  <RadioGroupItem id={`vtier-${tier.value}`} value={tier.value} className="mt-0.5" />
                  <TIcon className={`h-4 w-4 mt-0.5 shrink-0 ${tier.color}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tier.label}</p>
                    <p className="text-xs text-muted-foreground">{tier.desc}</p>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyTarget(null)}>{t("admin.cancel", "Cancel")}</Button>
            <Button
              onClick={() => verifyTarget && verifyMutation.mutate({ id: verifyTarget.userId, level: verifyLevel })}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? t("admin.saving", "Saving…") : t("admin.verify_user", "Verify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unverify confirmation */}
      <AlertDialog open={!!unverifyTarget} onOpenChange={() => setUnverifyTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.unverify_confirm_title", "Remove Verification")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.unverify_confirm_desc", "This will remove all verification from {{name}} and recompute their trust score.", { name: unverifyTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => unverifyTarget && unverifyMutation.mutate(unverifyTarget.userId)}
            >
              {t("admin.remove_verification", "Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
