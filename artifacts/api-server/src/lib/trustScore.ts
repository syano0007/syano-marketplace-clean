/**
 * Trust Score Engine — computes a real 0-100 score from live DB data.
 *
 * Score breakdown (100 pts total):
 *   Verification tier   → 0 / 10 / 20 / 30  (none / basic / verified / business)
 *   Profile completeness→ 0-15
 *   Account age         → 0-10
 *   Order completion    → 0-15
 *   Product reviews     → 0-15
 *   Seller service score→ 0-15  (communication + shipping + professionalism)
 *   Store followers     → 0-10  (social proof)
 *   Activity volume     → 0-5   (products listed + total orders)
 */
import { eq, and, avg, count, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  sellerApplicationsTable,
  productsTable,
  reviewsTable,
  ordersTable,
  orderItemsTable,
  storeFollowsTable,
  sellerReviewsTable,
} from "@workspace/db";

export type VerificationLevel = "none" | "basic" | "verified" | "business";

export interface TrustScoreBreakdown {
  total: number;
  verificationLevel: VerificationLevel;
  components: {
    verification: number;
    profileCompleteness: number;
    accountAge: number;
    orderCompletion: number;
    productReviews: number;
    sellerService: number;
    followers: number;
    activity: number;
  };
  details: {
    isVerified: boolean;
    completenessFields: { field: string; filled: boolean }[];
    accountAgeMonths: number;
    completionRate: number;
    totalOrders: number;
    avgProductRating: number | null;
    reviewCount: number;
    sellerScore: number | null;
    sellerReviewCount: number;
    followerCount: number;
    totalProducts: number;
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function verificationPoints(level: VerificationLevel): number {
  switch (level) {
    case "business": return 30;
    case "verified": return 20;
    case "basic":    return 10;
    default:         return 0;
  }
}

export async function computeTrustScore(sellerId: number): Promise<TrustScoreBreakdown> {
  const [userRow] = await db
    .select({
      createdAt:         usersTable.createdAt,
      isVerified:        usersTable.isVerified,
      verificationLevel: usersTable.verificationLevel,
    })
    .from(usersTable)
    .where(eq(usersTable.id, sellerId));

  const [appRow] = await db
    .select({
      storeName:        sellerApplicationsTable.storeName,
      storeDescription: sellerApplicationsTable.description,
      storeLogo:        sellerApplicationsTable.storeLogo,
      storeBanner:      sellerApplicationsTable.storeBanner,
      categories:       sellerApplicationsTable.categories,
      city:             sellerApplicationsTable.city,
      website:          sellerApplicationsTable.website,
      phone:            sellerApplicationsTable.phone,
    })
    .from(sellerApplicationsTable)
    .where(
      and(
        eq(sellerApplicationsTable.userId, sellerId),
        eq(sellerApplicationsTable.status, "approved")
      )
    );

  const [productStats, orderStats, followerRow, sellerReviewStat] = await Promise.all([
    db
      .select({
        totalProducts: count(productsTable.id),
        avgRating:     avg(reviewsTable.rating),
        reviewCount:   count(reviewsTable.id),
      })
      .from(productsTable)
      .leftJoin(reviewsTable, eq(reviewsTable.productId, productsTable.id))
      .where(eq(productsTable.sellerId, sellerId))
      .groupBy(),

    db
      .select({
        total:     count(ordersTable.id),
        delivered: sql<number>`cast(count(case when ${ordersTable.status} = 'delivered' then 1 end) as int)`,
      })
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
      .where(eq(orderItemsTable.sellerId, sellerId)),

    db
      .select({ count: count() })
      .from(storeFollowsTable)
      .where(eq(storeFollowsTable.sellerId, sellerId)),

    db
      .select({
        avgComm:  avg(sellerReviewsTable.communicationRating),
        avgShip:  avg(sellerReviewsTable.shippingRating),
        avgProf:  avg(sellerReviewsTable.professionalismRating),
        total:    count(),
      })
      .from(sellerReviewsTable)
      .where(eq(sellerReviewsTable.sellerId, sellerId)),
  ]);

  const level = ((userRow?.verificationLevel as VerificationLevel | null) ?? "none") as VerificationLevel;
  const isVerified = userRow?.isVerified ?? false;

  // ── 1. Verification (0-30) ───────────────────────────────────────────────
  const verificationPts = verificationPoints(level);

  // ── 2. Profile Completeness (0-15) ──────────────────────────────────────
  const completenessFields = [
    { field: "storeName",    filled: !!appRow?.storeName },
    { field: "description",  filled: (appRow?.storeDescription?.length ?? 0) > 20 },
    { field: "logo",         filled: !!appRow?.storeLogo },
    { field: "banner",       filled: !!appRow?.storeBanner },
    { field: "categories",   filled: (appRow?.categories?.length ?? 0) > 0 },
    { field: "city",         filled: !!appRow?.city },
    { field: "website",      filled: !!appRow?.website },
    { field: "phone",        filled: !!appRow?.phone },
  ];
  const filledCount = completenessFields.filter((f) => f.filled).length;
  const profilePts = clamp(Math.round((filledCount / completenessFields.length) * 15), 0, 15);

  // ── 3. Account Age (0-10) ────────────────────────────────────────────────
  const accountAgeMonths = userRow
    ? Math.floor((Date.now() - new Date(userRow.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;
  const agePts = clamp(Math.floor(accountAgeMonths / 2), 0, 10); // 1pt per 2 months, max 10

  // ── 4. Order Completion (0-15) ───────────────────────────────────────────
  const totalOrders = Number(orderStats[0]?.total ?? 0);
  const deliveredOrders = Number(orderStats[0]?.delivered ?? 0);
  const completionRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
  // Scale: 80%+ = full 15pts, linear below
  const completionPts = totalOrders === 0
    ? 7  // new sellers get 7/15 (benefit of doubt)
    : clamp(Math.round((completionRate / 80) * 15), 0, 15);

  // ── 5. Product Reviews (0-15) ────────────────────────────────────────────
  const totalProducts = Number(productStats[0]?.totalProducts ?? 0);
  const avgRating = productStats[0]?.avgRating != null ? parseFloat(productStats[0].avgRating) : null;
  const reviewCount = Number(productStats[0]?.reviewCount ?? 0);
  // 5pts for rating (rating/5 * 10), 5pts for review volume (log scale)
  const ratingPts = avgRating != null ? clamp(Math.round((avgRating / 5) * 10), 0, 10) : 0;
  const volumePts = reviewCount === 0 ? 0 : clamp(Math.round(Math.log10(reviewCount + 1) * 5), 0, 5);
  const reviewPts = ratingPts + volumePts;

  // ── 6. Seller Service Score (0-15) ──────────────────────────────────────
  const sr = sellerReviewStat[0];
  const sellerReviewCount = Number(sr?.total ?? 0);
  let sellerScore: number | null = null;
  let servicePts = 0;
  if (sellerReviewCount > 0) {
    sellerScore = parseFloat(
      (
        parseFloat(sr.avgComm ?? "0") * 0.4 +
        parseFloat(sr.avgShip ?? "0") * 0.3 +
        parseFloat(sr.avgProf ?? "0") * 0.3
      ).toFixed(2)
    );
    servicePts = clamp(Math.round((sellerScore / 5) * 15), 0, 15);
  } else {
    servicePts = 8; // new sellers get 8/15
  }

  // ── 7. Followers (0-10) ──────────────────────────────────────────────────
  const followerCount = Number(followerRow[0]?.count ?? 0);
  const followerPts = followerCount === 0 ? 0 : clamp(Math.round(Math.log10(followerCount + 1) * 4), 0, 10);

  // ── 8. Activity Volume (0-5) ─────────────────────────────────────────────
  const activityScore = (totalProducts > 0 ? 2 : 0) + (totalOrders > 0 ? 2 : 0) + (totalProducts >= 5 ? 1 : 0);
  const activityPts = clamp(activityScore, 0, 5);

  const total = clamp(
    verificationPts + profilePts + agePts + completionPts + reviewPts + servicePts + followerPts + activityPts,
    0,
    100
  );

  return {
    total,
    verificationLevel: level,
    components: {
      verification:       verificationPts,
      profileCompleteness: profilePts,
      accountAge:         agePts,
      orderCompletion:    completionPts,
      productReviews:     reviewPts,
      sellerService:      servicePts,
      followers:          followerPts,
      activity:           activityPts,
    },
    details: {
      isVerified,
      completenessFields,
      accountAgeMonths,
      completionRate: Math.round(completionRate),
      totalOrders,
      avgProductRating: avgRating,
      reviewCount,
      sellerScore,
      sellerReviewCount,
      followerCount,
      totalProducts,
    },
  };
}

export async function refreshTrustScore(sellerId: number): Promise<number> {
  const result = await computeTrustScore(sellerId);
  await db
    .update(usersTable)
    .set({
      trustScore:           result.total,
      trustScoreUpdatedAt:  new Date(),
      trustLevel:           scoreToBand(result.total),
    })
    .where(eq(usersTable.id, sellerId));
  return result.total;
}

export function scoreToBand(score: number): "new" | "basic" | "established" | "trusted" {
  if (score >= 75) return "trusted";
  if (score >= 50) return "established";
  if (score >= 25) return "basic";
  return "new";
}

export function verificationLevelLabel(level: VerificationLevel): { en: string; ar: string } {
  switch (level) {
    case "business": return { en: "Business Verified",  ar: "موثّق تجاري" };
    case "verified":  return { en: "ID Verified",        ar: "موثّق بالهوية" };
    case "basic":     return { en: "Basic Verified",     ar: "موثّق أساسي" };
    default:          return { en: "Unverified",         ar: "غير موثّق" };
  }
}
