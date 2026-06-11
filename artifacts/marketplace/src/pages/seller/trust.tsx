import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { SellerNav } from "@/components/SellerNav";
import { SellerTrustBadge, TrustScoreBar, type VerificationLevel } from "@/components/SellerTrustBadge";
import { Shield, ShieldCheck, Award, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function ScoreRow({ label, score, max, tip }: { label: string; score: number; max: number; tip?: string }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const color =
    pct >= 75 ? "bg-emerald-500" :
    pct >= 50 ? "bg-blue-500" :
    pct >= 25 ? "bg-amber-500" :
    "bg-muted-foreground";
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {tip && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{tip}</p>}
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-foreground w-12 text-end">
        {score}/{max}
      </span>
    </div>
  );
}

function CompletenessField({ field, filled }: { field: string; filled: boolean }) {
  const FIELD_LABELS: Record<string, string> = {
    storeName: "Store name",
    description: "Store description",
    logo: "Store logo",
    banner: "Banner image",
    categories: "Product categories",
    city: "City",
    website: "Website URL",
    phone: "Phone number",
  };
  return (
    <div className="flex items-center gap-2 py-1">
      {filled
        ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        : <XCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
      <span className={`text-xs ${filled ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {FIELD_LABELS[field] ?? field}
      </span>
    </div>
  );
}

export default function SellerTrustPage() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const sellerId = user?.userId;

  const { data: trustData, isLoading } = useQuery({
    queryKey: ["seller-trust", sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/sellers/${sellerId}/trust`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load trust data");
      return res.json();
    },
    enabled: !!sellerId && !!token,
  });

  const level = (trustData?.verificationLevel ?? "none") as VerificationLevel;
  const isVerified = trustData?.isVerified ?? false;
  const score = trustData?.liveBreakdown?.total ?? null;
  const components = trustData?.liveBreakdown?.components ?? null;
  const details = trustData?.liveBreakdown?.details ?? null;

  const tierConfig = {
    none:     { icon: Shield,      color: "text-muted-foreground", bg: "bg-muted",              label: t("trust.level_none", "Unverified") },
    basic:    { icon: Shield,      color: "text-blue-600",         bg: "bg-blue-500/10",        label: t("trust.level_basic", "Basic Verified") },
    verified: { icon: ShieldCheck, color: "text-emerald-600",     bg: "bg-emerald-500/10",     label: t("trust.level_verified", "ID Verified") },
    business: { icon: Award,       color: "text-violet-600",      bg: "bg-violet-500/10",      label: t("trust.level_business", "Business Verified") },
  }[level] ?? { icon: Shield, color: "text-muted-foreground", bg: "bg-muted", label: "Unverified" };

  const TierIcon = tierConfig.icon;

  return (
    <Layout>
      <SellerNav />
      <div className="container max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-foreground">{t("trust_panel.title", "Store Trust Level")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("trust_panel.page_desc", "Your trust score is computed from live data — reviews, orders, profile completeness, and more.")}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Current tier card */}
            <div className={`p-5 rounded-2xl border ${isVerified ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl ${tierConfig.bg} flex items-center justify-center shrink-0`}>
                  <TierIcon className={`h-6 w-6 ${tierConfig.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-black text-foreground">{tierConfig.label}</p>
                    {isVerified && level !== "none" && (
                      <SellerTrustBadge level={level} isVerified={isVerified} size="sm" />
                    )}
                  </div>
                  {trustData?.verifiedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("trust_panel.verified_since", "Verified since")} {new Date(trustData.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                  {!isVerified && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("trust_panel.unverified_desc", "Complete your profile to improve your score.")}
                    </p>
                  )}
                </div>
              </div>

              {score != null && (
                <div className="mt-4">
                  <TrustScoreBar score={score} size="md" />
                </div>
              )}
            </div>

            {/* Score breakdown */}
            {components && (
              <div className="p-5 rounded-2xl border border-border bg-card">
                <h2 className="text-sm font-bold text-foreground mb-4">{t("trust_panel.score_breakdown", "Score Breakdown")}</h2>
                <div className="space-y-3">
                  <ScoreRow label={t("trust_panel.factor_verification", "Verification tier")} score={components.verification} max={30}
                    tip={t("trust_panel.tip_verification", "Get verified by SYANO to earn up to 30 pts")} />
                  <ScoreRow label={t("trust_panel.factor_profile", "Profile completeness")} score={components.profileCompleteness} max={15}
                    tip={t("trust_panel.tip_profile", "Fill in all store details for full marks")} />
                  <ScoreRow label={t("trust_panel.factor_reviews", "Product reviews")} score={components.productReviews} max={15}
                    tip={t("trust_panel.tip_reviews", "High ratings + review volume")} />
                  <ScoreRow label={t("trust_panel.factor_service", "Seller service")} score={components.sellerService} max={15}
                    tip={t("trust_panel.tip_service", "Communication, shipping, professionalism ratings")} />
                  <ScoreRow label={t("trust_panel.factor_orders", "Order completion")} score={components.orderCompletion} max={15}
                    tip={t("trust_panel.tip_orders", "80%+ delivered orders earns full marks")} />
                  <ScoreRow label={t("trust_panel.factor_age", "Account age")} score={components.accountAge} max={10}
                    tip={t("trust_panel.tip_age", "1 pt per 2 months, up to 10")} />
                  <ScoreRow label={t("trust_panel.factor_followers", "Store followers")} score={components.followers} max={10}
                    tip={t("trust_panel.tip_followers", "Social proof from followers")} />
                  <ScoreRow label={t("trust_panel.factor_activity", "Activity")} score={components.activity} max={5}
                    tip={t("trust_panel.tip_activity", "Active listings and orders")} />
                </div>
              </div>
            )}

            {/* Profile completeness checklist */}
            {details?.completenessFields && (
              <div className="p-5 rounded-2xl border border-border bg-card">
                <h2 className="text-sm font-bold text-foreground mb-3">{t("trust_panel.profile_checklist", "Profile Checklist")}</h2>
                <div className="grid grid-cols-2 gap-x-4">
                  {details.completenessFields.map((f: { field: string; filled: boolean }) => (
                    <CompletenessField key={f.field} field={f.field} filled={f.filled} />
                  ))}
                </div>
                <Link href="/seller/store-settings">
                  <Button variant="outline" size="sm" className="mt-4 gap-1.5">
                    {t("trust_panel.edit_profile", "Edit Store Profile")}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Stats snapshot */}
            {details && (
              <div className="p-5 rounded-2xl border border-border bg-card">
                <h2 className="text-sm font-bold text-foreground mb-3">{t("trust_panel.stats_snapshot", "Stats Snapshot")}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: t("trust_panel.total_orders", "Total orders"), value: details.totalOrders },
                    { label: t("trust_panel.completion_rate", "Completion rate"), value: `${details.completionRate}%` },
                    { label: t("trust_panel.review_count", "Reviews"), value: details.reviewCount },
                    { label: t("trust_panel.avg_rating", "Avg rating"), value: details.avgProductRating != null ? Number(details.avgProductRating).toFixed(1) : "—" },
                    { label: t("trust_panel.followers", "Followers"), value: details.followerCount },
                    { label: t("trust_panel.products", "Products"), value: details.totalProducts },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/40 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                      <p className="text-lg font-black text-foreground mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to get verified */}
            {!isVerified && (
              <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{t("trust_panel.how_to_verify_title", "How to get verified")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("trust_panel.how_to_verify", "To get verified, contact SYANO support or complete seller onboarding.")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
