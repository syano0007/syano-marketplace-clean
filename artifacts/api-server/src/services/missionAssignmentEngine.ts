/**
 * SYANO — Mission Assignment Engine (V3.3)
 *
 * Strategy: up to 3 rounds × 3 couriers per round × 60-second offer window.
 * No GPS — "nearest" proxy = available couriers ordered by completedDeliveries DESC
 * (fair load distribution until GPS is added in a later phase).
 *
 * Future GPS will replace findNearestCouriers() without touching the rest of the engine.
 */

import { eq, and, notInArray, desc } from "drizzle-orm";
import {
  pool, db,
  couriersTable, deliveryMissionsTable, missionOffersTable, usersTable,
} from "@workspace/db";
import { createNotification, bi } from "../lib/notif";
import { logger } from "../lib/logger";

// ─── Constants ────────────────────────────────────────────────────────────────

const OFFER_SECONDS    = 60;
const MAX_ROUNDS       = 3;
const COURIERS_PER_ROUND = 3;

// ─── findNearestCouriers ──────────────────────────────────────────────────────
// Returns up to `limit` available couriers, excluding already-contacted ones.
// Sorted by completedDeliveries DESC (proximity proxy until GPS phase).

export async function findNearestCouriers(
  _missionId: number,
  excludeCourierIds: number[] = [],
  limit = COURIERS_PER_ROUND,
): Promise<Array<{ id: number; userId: number; completedDeliveries: number }>> {
  const conditions: ReturnType<typeof eq>[] = [
    eq(couriersTable.status, "approved"),
    eq(couriersTable.availabilityStatus as any, "ONLINE"),
    eq(couriersTable.isAcceptingDeliveries, true),
  ];

  if (excludeCourierIds.length > 0) {
    conditions.push(notInArray(couriersTable.id, excludeCourierIds) as any);
  }

  return db
    .select({
      id:                   couriersTable.id,
      userId:               couriersTable.userId,
      completedDeliveries:  couriersTable.completedDeliveries,
    })
    .from(couriersTable)
    .where(and(...conditions))
    .orderBy(desc(couriersTable.completedDeliveries))
    .limit(limit);
}

// ─── createMissionOffers ──────────────────────────────────────────────────────
// Inserts OFFERED rows for all given couriers with a shared 60-second expiry.

export async function createMissionOffers(
  missionId: number,
  courierIds: number[],
  round: number,
): Promise<void> {
  if (courierIds.length === 0) return;
  const expiresAt = new Date(Date.now() + OFFER_SECONDS * 1000);

  await db.insert(missionOffersTable).values(
    courierIds.map((courierId) => ({
      missionId,
      courierId,
      status:    "OFFERED" as const,
      round,
      offeredAt: new Date(),
      expiresAt,
    })),
  );
}

// ─── expireStaleMissionOffers ─────────────────────────────────────────────────
// Marks all OFFERED offers for a mission as EXPIRED (called after round timeout).

export async function expireStaleMissionOffers(missionId: number): Promise<void> {
  await db
    .update(missionOffersTable)
    .set({ status: "EXPIRED" as any, respondedAt: new Date() })
    .where(and(
      eq(missionOffersTable.missionId, missionId),
      eq(missionOffersTable.status, "OFFERED"),
    ));
}

// ─── assignMissionToCourier ───────────────────────────────────────────────────
// Atomic: accept offer, assign mission, mark courier BUSY, cancel other offers.
// Uses SELECT FOR UPDATE NOWAIT to prevent race conditions.

export async function assignMissionToCourier(
  missionId: number,
  courierId: number,
  offerId: number,
): Promise<{ success: boolean; error?: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock offer row — fail fast if someone else has it (NOWAIT)
    const offerRes = await client.query<{ id: number; status: string }>(
      `SELECT id, status FROM mission_offers WHERE id = $1 AND courier_id = $2 FOR UPDATE NOWAIT`,
      [offerId, courierId],
    );

    if (offerRes.rows.length === 0 || offerRes.rows[0].status !== "OFFERED") {
      await client.query("ROLLBACK");
      return { success: false, error: "Offer is no longer available" };
    }

    // Lock mission row
    const missionRes = await client.query<{ id: number; status: string }>(
      `SELECT id, status FROM delivery_missions WHERE id = $1 FOR UPDATE NOWAIT`,
      [missionId],
    );

    if (missionRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Mission not found" };
    }

    if (!["PENDING", "SEARCHING"].includes(missionRes.rows[0].status)) {
      await client.query("ROLLBACK");
      return { success: false, error: "Mission is already assigned" };
    }

    const now = new Date();

    await client.query(
      `UPDATE mission_offers SET status='ACCEPTED', responded_at=$1 WHERE id=$2`,
      [now, offerId],
    );
    await client.query(
      `UPDATE delivery_missions SET status='ASSIGNED', courier_id=$1, updated_at=$2 WHERE id=$3`,
      [courierId, now, missionId],
    );
    await client.query(
      `UPDATE couriers SET availability_status='BUSY', is_accepting_deliveries=false,
         last_availability_change_at=$1, updated_at=$1 WHERE id=$2`,
      [now, courierId],
    );
    await client.query(
      `UPDATE mission_offers SET status='CANCELLED', responded_at=$1
         WHERE mission_id=$2 AND id != $3 AND status='OFFERED'`,
      [now, missionId, offerId],
    );

    await client.query("COMMIT");
    return { success: true };
  } catch (err: any) {
    try { await client.query("ROLLBACK"); } catch { /* ignore */ }
    if (err.code === "55P03") {
      return { success: false, error: "Concurrent request — try again" };
    }
    throw err;
  } finally {
    client.release();
  }
}

// ─── startAssignmentRound ─────────────────────────────────────────────────────
// Sets mission to SEARCHING, picks up to 3 couriers, creates offers, notifies them.

export async function startAssignmentRound(
  missionId: number,
  round: number,
  excludedCourierIds: number[],
): Promise<{ courierIds: number[] }> {
  // Mark mission SEARCHING
  await db
    .update(deliveryMissionsTable)
    .set({ status: "SEARCHING" as any, updatedAt: new Date() })
    .where(eq(deliveryMissionsTable.id, missionId));

  const couriers = await findNearestCouriers(missionId, excludedCourierIds, COURIERS_PER_ROUND);
  if (couriers.length === 0) return { courierIds: [] };

  const courierIds = couriers.map((c) => c.id);
  await createMissionOffers(missionId, courierIds, round);

  logger.info({ missionId, round, courierIds }, "[AssignmentEngine] Offers sent");

  // Notify each courier (fire-and-forget)
  for (const c of couriers) {
    createNotification({
      userId:   c.userId,
      type:     "order_processing" as any,
      title:    bi("🚚 New Delivery Mission!", "🚚 مهمة توصيل جديدة!"),
      body:     bi(
        `Mission #${missionId} is available. You have ${OFFER_SECONDS} seconds to accept.`,
        `المهمة رقم #${missionId} متاحة. لديك ${OFFER_SECONDS} ثانية للقبول.`,
      ),
      priority: "important",
      link:     "/courier/dashboard",
    }).catch(() => {});
  }

  return { courierIds };
}

// ─── runAssignmentEngine ──────────────────────────────────────────────────────
// Orchestrates up to MAX_ROUNDS rounds with OFFER_SECONDS wait between each.
// After all rounds fail → mission = NO_COURIER_FOUND + admin dispatch alert.

export async function runAssignmentEngine(missionId: number): Promise<void> {
  const excludedCourierIds: number[] = [];

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    // Guard: mission may have been manually assigned or cancelled
    const [mission] = await db
      .select({ status: deliveryMissionsTable.status })
      .from(deliveryMissionsTable)
      .where(eq(deliveryMissionsTable.id, missionId));

    if (!mission || !["PENDING", "SEARCHING"].includes(mission.status as string)) {
      logger.info({ missionId, status: mission?.status }, "[AssignmentEngine] Mission handled externally — stopping");
      return;
    }

    logger.info({ missionId, round }, "[AssignmentEngine] Starting round");

    const { courierIds } = await startAssignmentRound(missionId, round, excludedCourierIds);
    excludedCourierIds.push(...courierIds);

    // Wait for offers to expire
    await new Promise<void>((resolve) => setTimeout(resolve, OFFER_SECONDS * 1000));

    // Check if accepted during wait
    const [missionPost] = await db
      .select({ status: deliveryMissionsTable.status })
      .from(deliveryMissionsTable)
      .where(eq(deliveryMissionsTable.id, missionId));

    if (!missionPost || missionPost.status === "ASSIGNED") {
      logger.info({ missionId, round }, "[AssignmentEngine] Accepted — engine done");
      return;
    }

    // Expire stale offers before next round
    await expireStaleMissionOffers(missionId);
  }

  // All rounds exhausted — no courier found
  await db
    .update(deliveryMissionsTable)
    .set({ status: "NO_COURIER_FOUND" as any, updatedAt: new Date() })
    .where(eq(deliveryMissionsTable.id, missionId));

  logger.warn({ missionId }, "[AssignmentEngine] NO_COURIER_FOUND — dispatch alert sent");

  const admins = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));

  await Promise.allSettled(
    admins.map((admin) =>
      createNotification({
        userId:   admin.id,
        type:     "dispatch_alert" as any,
        title:    bi("⚠️ No Courier Found", "⚠️ لم يتم إيجاد مندوب"),
        body:     bi(
          `Mission #${missionId} failed after ${MAX_ROUNDS} rounds. Manual assignment required.`,
          `فشلت المهمة رقم #${missionId} بعد ${MAX_ROUNDS} جولات. التعيين اليدوي مطلوب.`,
        ),
        priority: "critical",
        link:     `/admin/delivery-missions`,
      }),
    ),
  );
}

// ─── triggerAssignmentEngine ──────────────────────────────────────────────────
// Fire-and-forget wrapper — safe to call without awaiting.

export function triggerAssignmentEngine(missionId: number): void {
  runAssignmentEngine(missionId).catch((err) => {
    logger.error({ err, missionId }, "[AssignmentEngine] Unhandled engine error");
  });
}
