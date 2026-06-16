import { Router, type IRouter } from "express";
import { eq, desc, and, count } from "drizzle-orm";
import {
  db, deliveryMissionsTable, usersTable, ordersTable, couriersTable,
  sellerApplicationsTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { getMission } from "../services/deliveryMissionService";

const router: IRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePagination(query: Record<string, unknown>) {
  const page  = Math.max(1, parseInt(String(query.page  ?? "1"),  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? "20"), 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

async function enrichMission(m: typeof deliveryMissionsTable.$inferSelect) {
  const [sellerUser, customer, sellerApp, courierRow] = await Promise.all([
    db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, m.sellerId)),
    db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, m.customerId)),
    db.select({ storeName: sellerApplicationsTable.storeName })
      .from(sellerApplicationsTable).where(eq(sellerApplicationsTable.userId, m.sellerId)),
    m.courierId
      ? db.select({ name: usersTable.name, phone: couriersTable.phone })
          .from(couriersTable)
          .innerJoin(usersTable, eq(couriersTable.userId, usersTable.id))
          .where(eq(couriersTable.id, m.courierId))
      : Promise.resolve([] as { name: string; phone: string }[]),
  ]);
  return {
    ...m,
    sellerName:  sellerUser[0]?.name  ?? null,
    storeName:   sellerApp[0]?.storeName ?? null,
    customerName: customer[0]?.name   ?? null,
    courierName:  courierRow[0]?.name  ?? null,
    courierPhone: courierRow[0]?.phone ?? null,
  };
}

// ─── C1: GET /delivery-missions/:id ──────────────────────────────────────────
// Access: customer (own), seller (own), admin (all)

router.get("/delivery-missions/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId, role } = req.user!;
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid mission ID" }); return; }

  const mission = await getMission(id);
  if (!mission) { res.status(404).json({ error: "Delivery mission not found" }); return; }

  // C2 — permission check
  if (role === "customer" && mission.customerId !== userId) {
    res.status(403).json({ error: "Access denied" }); return;
  }
  if (role === "seller" && mission.sellerId !== userId) {
    res.status(403).json({ error: "Access denied" }); return;
  }
  if (role === "courier") {
    // Couriers may only view missions assigned to them
    const [courier] = await db
      .select({ id: couriersTable.id })
      .from(couriersTable)
      .where(eq(couriersTable.userId, userId));
    if (!courier || mission.courierId !== courier.id) {
      res.status(403).json({ error: "Access denied" }); return;
    }
  }

  res.json(await enrichMission(mission));
});

// ─── C1: GET /seller/delivery-missions ───────────────────────────────────────
// Access: seller (own missions only)

router.get("/seller/delivery-missions", requireAuth, requireRole("seller"), async (req, res): Promise<void> => {
  const { userId } = req.user!;
  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

  const [missions, [totalRow]] = await Promise.all([
    db.select()
      .from(deliveryMissionsTable)
      .where(eq(deliveryMissionsTable.sellerId, userId))
      .orderBy(desc(deliveryMissionsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() })
      .from(deliveryMissionsTable)
      .where(eq(deliveryMissionsTable.sellerId, userId)),
  ]);

  const enriched = await Promise.all(missions.map(enrichMission));
  res.json({ data: enriched, total: totalRow?.total ?? 0, page, limit });
});

// ─── GET /admin/delivery-missions/stats ───────────────────────────────────────
// Returns mission counts grouped by status for the admin dashboard counter cards.
router.get("/admin/delivery-missions/stats", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const rows = await db
    .select({ status: deliveryMissionsTable.status, cnt: count() })
    .from(deliveryMissionsTable)
    .groupBy(deliveryMissionsTable.status);

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.status] = Number(row.cnt);
  }
  res.json(result);
});

// ─── C1: GET /admin/delivery-missions ────────────────────────────────────────
// Access: admin (all missions)

router.get("/admin/delivery-missions", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

  const statusFilter = req.query.status as string | undefined;

  const where = statusFilter
    ? eq(deliveryMissionsTable.status, statusFilter as any)
    : undefined;

  const [missions, [totalRow]] = await Promise.all([
    db.select()
      .from(deliveryMissionsTable)
      .where(where)
      .orderBy(desc(deliveryMissionsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() })
      .from(deliveryMissionsTable)
      .where(where),
  ]);

  const enriched = await Promise.all(missions.map(enrichMission));
  res.json({ data: enriched, total: totalRow?.total ?? 0, page, limit });
});

export default router;
