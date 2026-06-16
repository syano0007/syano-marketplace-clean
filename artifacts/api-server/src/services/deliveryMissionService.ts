import { eq, desc, and, inArray } from "drizzle-orm";
import { db, deliveryMissionsTable, ordersTable, usersTable, sellerApplicationsTable, couriersTable } from "@workspace/db";
import type { DeliveryMission, InsertDeliveryMission } from "@workspace/db";
import { getAvailableCouriers, setCourierBusy } from "./courierAvailabilityService";

// ─── Status transition map ────────────────────────────────────────────────────
const MISSION_TRANSITIONS: Record<string, string[]> = {
  PENDING:    ["ASSIGNED", "CANCELLED"],
  ASSIGNED:   ["ACCEPTED", "CANCELLED"],
  ACCEPTED:   ["PICKED_UP", "CANCELLED"],
  PICKED_UP:  ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "FAILED"],
  DELIVERED:  [],
  FAILED:     [],
  CANCELLED:  [],
};

// ─── createDeliveryMission ────────────────────────────────────────────────────
export async function createDeliveryMission(params: {
  orderId: number;
  sellerId: number;
  customerId: number;
  deliveryFee?: string | null;
  deliverySize?: "SMALL" | "MEDIUM" | "LARGE";
}): Promise<DeliveryMission> {
  const { orderId, sellerId, customerId, deliveryFee, deliverySize = "MEDIUM" } = params;

  // Fetch order for addresses
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) throw new Error(`Order ${orderId} not found`);

  // Fetch seller store address for pickup
  const [sellerApp] = await db
    .select({ address: sellerApplicationsTable.address, storeName: sellerApplicationsTable.storeName })
    .from(sellerApplicationsTable)
    .where(eq(sellerApplicationsTable.userId, sellerId));

  const pickupAddress = sellerApp?.address ?? "Seller address on file";
  const dropoffAddress = order.shippingAddress;

  const [mission] = await db
    .insert(deliveryMissionsTable)
    .values({
      orderId,
      sellerId,
      customerId,
      deliveryFee: deliveryFee ?? order.deliveryFee ?? null,
      deliverySize,
      pickupAddress,
      dropoffAddress,
      status: "PENDING",
    })
    .returning();

  return mission;
}

// ─── getMission ───────────────────────────────────────────────────────────────
export async function getMission(missionId: number): Promise<DeliveryMission | null> {
  const [mission] = await db
    .select()
    .from(deliveryMissionsTable)
    .where(eq(deliveryMissionsTable.id, missionId));
  return mission ?? null;
}

export async function getMissionByOrderId(orderId: number): Promise<DeliveryMission | null> {
  const [mission] = await db
    .select()
    .from(deliveryMissionsTable)
    .where(eq(deliveryMissionsTable.orderId, orderId));
  return mission ?? null;
}

// ─── updateMissionStatus ──────────────────────────────────────────────────────
export async function updateMissionStatus(
  missionId: number,
  newStatus: string,
): Promise<DeliveryMission> {
  const mission = await getMission(missionId);
  if (!mission) throw new Error(`Delivery mission ${missionId} not found`);

  const allowed = MISSION_TRANSITIONS[mission.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Cannot transition mission from '${mission.status}' to '${newStatus}'. Allowed: ${allowed.join(", ") || "none"}`,
    );
  }

  const now = new Date();
  const timestamps: Record<string, Date | null> = {};
  if (newStatus === "ACCEPTED")   timestamps.acceptedAt  = now;
  if (newStatus === "PICKED_UP")  timestamps.pickedUpAt  = now;
  if (newStatus === "DELIVERED")  timestamps.deliveredAt = now;
  if (newStatus === "CANCELLED")  timestamps.cancelledAt = now;
  if (newStatus === "FAILED")     timestamps.failedAt    = now;

  const [updated] = await db
    .update(deliveryMissionsTable)
    .set({ status: newStatus as any, updatedAt: now, ...timestamps })
    .where(eq(deliveryMissionsTable.id, missionId))
    .returning();

  return updated;
}

// ─── V3.3: offerMissionToCourier ──────────────────────────────────────────────
// Internal: marks a mission as OFFERED to a specific courier.
// Does NOT auto-accept — courier must accept via their dashboard.
// Sets assignmentStartedAt + assignmentExpiresAt (5-min window) + increments round.
export async function offerMissionToCourier(
  missionId: number,
  courierId: number,
  expiryMinutes = 5,
): Promise<DeliveryMission> {
  const mission = await getMission(missionId);
  if (!mission) throw new Error(`Mission ${missionId} not found`);
  if (!["PENDING", "ASSIGNED"].includes(mission.status)) {
    throw new Error(`Mission is not in an offerable state (current: ${mission.status})`);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);
  const currentRound = (mission as any).assignmentRound ?? 0;

  const [updated] = await db
    .update(deliveryMissionsTable)
    .set({
      courierId,
      status: "ASSIGNED",
      updatedAt: now,
      ...(Object.fromEntries([
        ["assignment_started_at", now],
        ["assignment_expires_at", expiresAt],
        ["assignment_round", currentRound + 1],
        ["assignment_status", "OFFERED"],
      ])),
    } as any)
    .where(eq(deliveryMissionsTable.id, missionId))
    .returning();

  return updated;
}

// ─── V3.3: assignMission ──────────────────────────────────────────────────────
// Admin/system: directly assigns a mission to a specific courier (no offer window).
// Transitions status to ASSIGNED and marks courier BUSY.
// If courierId is omitted, picks the first available courier automatically.
export async function assignMission(
  missionId: number,
  courierId?: number,
): Promise<{ mission: DeliveryMission; courierId: number }> {
  const mission = await getMission(missionId);
  if (!mission) throw new Error(`Mission ${missionId} not found`);
  if (mission.status !== "PENDING") {
    throw new Error(`Mission must be PENDING to assign (current: ${mission.status})`);
  }

  let resolvedCourierId = courierId;

  if (!resolvedCourierId) {
    const available = await getAvailableCouriers();
    if (available.length === 0) throw new Error("No couriers available for assignment");
    resolvedCourierId = available[0].id;
  }

  const now = new Date();
  const [updated] = await db
    .update(deliveryMissionsTable)
    .set({
      courierId: resolvedCourierId,
      status: "ASSIGNED",
      updatedAt: now,
      ...(Object.fromEntries([
        ["assignment_started_at", now],
        ["assignment_round", 1],
        ["assignment_status", "DIRECT"],
      ])),
    } as any)
    .where(eq(deliveryMissionsTable.id, missionId))
    .returning();

  // Mark courier BUSY
  await setCourierBusy(resolvedCourierId).catch(() => {});

  return { mission: updated, courierId: resolvedCourierId };
}
