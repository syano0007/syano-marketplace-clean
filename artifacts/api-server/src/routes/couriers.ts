import { Router, type IRouter } from "express";
import { eq, and, desc, sum, count, inArray } from "drizzle-orm";
import {
  db, couriersTable, usersTable, ordersTable, orderItemsTable,
  courierAssignmentsTable, courierWalletTransactionsTable,
  orderStatusHistoryTable, sellerApplicationsTable,
} from "@workspace/db";
import { requireAuth, requireActiveAccount } from "../middlewares/auth";
import { createNotification, bi } from "../lib/notif";

const router: IRouter = Router();

// ─── Helper: insert status history ────────────────────────────────────────────
async function insertStatusHistory(
  orderId: number, from: string, to: string, changedBy: number, role: string,
) {
  await db.insert(orderStatusHistoryTable).values({
    orderId, fromStatus: from, toStatus: to, changedBy, changedByRole: role,
  });
}

// ─── Courier apply ─────────────────────────────────────────────────────────────
router.post("/couriers/apply", requireAuth, requireActiveAccount, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const existing = await db.select().from(couriersTable).where(eq(couriersTable.userId, userId));
  if (existing.length > 0) { res.status(409).json({ error: "Courier application already exists" }); return; }
  const { phone, vehicleType, district } = req.body;
  if (!phone) { res.status(400).json({ error: "Phone is required" }); return; }
  const [courier] = await db.insert(couriersTable).values({
    userId, phone,
    vehicleType: vehicleType ?? "motorcycle",
    district: district ?? null,
    status: "pending",
  }).returning();

  // Notify all admins — fire-and-forget
  db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin"))
    .then((admins) =>
      Promise.allSettled(admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: "courier_applied",
          title: bi("New Courier Application", "طلب مندوب جديد"),
          body: bi(
            `A new courier application has been submitted and is awaiting your review.`,
            `تم تقديم طلب مندوب توصيل جديد وينتظر مراجعتك.`
          ),
          priority: "important",
          link: `/admin/courier-applications`,
        })
      ))
    ).catch(() => {});

  res.status(201).json({ id: courier.id, status: courier.status, message: "Application submitted. Pending admin approval." });
});

// ─── My courier profile ────────────────────────────────────────────────────────
router.get("/couriers/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [courier] = await db.select().from(couriersTable).where(eq(couriersTable.userId, userId));
  if (!courier) { res.status(404).json({ error: "No courier profile found" }); return; }
  res.json({
    id: courier.id,
    status: courier.status,
    active: courier.active,
    phone: courier.phone,
    vehicleType: courier.vehicleType,
    district: courier.district,
    rating: courier.rating ? parseFloat(String(courier.rating)) : null,
    completedDeliveries: courier.completedDeliveries,
  });
});

// ─── Toggle active status ──────────────────────────────────────────────────────
router.patch("/couriers/profile/toggle", requireAuth, requireActiveAccount, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [courier] = await db.select().from(couriersTable).where(eq(couriersTable.userId, userId));
  if (!courier) { res.status(404).json({ error: "No courier profile found" }); return; }
  if (courier.status !== "approved") { res.status(403).json({ error: "Courier account not approved" }); return; }
  const [updated] = await db.update(couriersTable)
    .set({ active: !courier.active, updatedAt: new Date() })
    .where(eq(couriersTable.id, courier.id))
    .returning();
  res.json({ active: updated.active });
});

// ─── My assignments (active: assigned / picked_up / out_for_delivery) ──────────
router.get("/couriers/assignments", requireAuth, requireActiveAccount, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [courier] = await db.select().from(couriersTable).where(eq(couriersTable.userId, userId));
  if (!courier) { res.status(404).json({ error: "No courier profile found" }); return; }
  if (courier.status !== "approved") { res.status(403).json({ error: "Courier account not approved" }); return; }

  const rows = await db
    .select({
      id: courierAssignmentsTable.id,
      orderId: courierAssignmentsTable.orderId,
      status: courierAssignmentsTable.status,
      assignedAt: courierAssignmentsTable.assignedAt,
      acceptedAt: courierAssignmentsTable.acceptedAt,
      pickedUpAt: courierAssignmentsTable.pickedUpAt,
      deliveredAt: courierAssignmentsTable.deliveredAt,
      notes: courierAssignmentsTable.notes,
      orderStatus: ordersTable.status,
      orderDate: ordersTable.createdAt,
      shippingAddress: ordersTable.shippingAddress,
      customerPhone: ordersTable.customerPhone,
      city: ordersTable.city,
      deliveryNotes: ordersTable.deliveryNotes,
      deliveryFee: ordersTable.deliveryFee,
      total: ordersTable.total,
      customerId: ordersTable.customerId,
    })
    .from(courierAssignmentsTable)
    .innerJoin(ordersTable, eq(ordersTable.id, courierAssignmentsTable.orderId))
    .where(
      and(
        eq(courierAssignmentsTable.courierId, courier.id),
        inArray(courierAssignmentsTable.status, ["assigned", "picked_up", "out_for_delivery"]),
      )
    )
    .orderBy(desc(courierAssignmentsTable.assignedAt));

  if (rows.length === 0) { res.json([]); return; }

  // Batch enrich: customer names
  const customerIds = [...new Set(rows.map((r) => r.customerId))];
  const customerUsers = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(inArray(usersTable.id, customerIds));
  const customerMap: Record<number, string> = Object.fromEntries(customerUsers.map((u) => [u.id, u.name ?? ""]));

  // Batch enrich: order items (product snapshot)
  const orderIds = rows.map((r) => r.orderId);
  const items = await db
    .select({
      orderId: orderItemsTable.orderId,
      productName: orderItemsTable.productName,
      quantity: orderItemsTable.quantity,
      unitPrice: orderItemsTable.unitPrice,
      sellerId: orderItemsTable.sellerId,
    })
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orderIds));

  // Batch enrich: seller user names
  const sellerIds = [...new Set(items.map((i) => i.sellerId))];
  const [sellerUsers, sellerApps] = sellerIds.length > 0
    ? await Promise.all([
      db.select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable).where(inArray(usersTable.id, sellerIds)),
      db.select({ userId: sellerApplicationsTable.userId, storeName: sellerApplicationsTable.storeName, phone: sellerApplicationsTable.phone })
        .from(sellerApplicationsTable)
        .where(and(inArray(sellerApplicationsTable.userId, sellerIds), eq(sellerApplicationsTable.status, "approved"))),
    ])
    : [[], []];

  const sellerUserMap: Record<number, string> = Object.fromEntries((sellerUsers as any[]).map((u) => [u.id, u.name ?? ""]));
  const sellerAppMap: Record<number, { storeName: string; phone: string }> =
    Object.fromEntries((sellerApps as any[]).map((s) => [s.userId, { storeName: s.storeName, phone: s.phone }]));

  // Group items by order
  const itemsByOrder: Record<number, typeof items> = {};
  for (const item of items) {
    if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
    itemsByOrder[item.orderId].push(item);
  }

  res.json(rows.map((a) => {
    const orderItems = itemsByOrder[a.orderId] ?? [];
    const firstSellerId = orderItems[0]?.sellerId;
    return {
      id: a.id,
      orderId: a.orderId,
      status: a.status,
      orderStatus: a.orderStatus,
      orderDate: a.orderDate.toISOString(),
      assignedAt: a.assignedAt.toISOString(),
      acceptedAt: a.acceptedAt?.toISOString() ?? null,
      pickedUpAt: a.pickedUpAt?.toISOString() ?? null,
      deliveredAt: a.deliveredAt?.toISOString() ?? null,
      notes: a.notes,
      shippingAddress: a.shippingAddress,
      city: a.city,
      deliveryNotes: a.deliveryNotes,
      deliveryFee: a.deliveryFee ? parseFloat(String(a.deliveryFee)) : null,
      total: parseFloat(String(a.total)),
      customerName: customerMap[a.customerId] ?? null,
      customerPhone: a.customerPhone,
      storeName: firstSellerId ? (sellerAppMap[firstSellerId]?.storeName ?? null) : null,
      sellerName: firstSellerId ? (sellerUserMap[firstSellerId] ?? null) : null,
      sellerPhone: firstSellerId ? (sellerAppMap[firstSellerId]?.phone ?? null) : null,
      products: orderItems.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        unitPrice: parseFloat(String(i.unitPrice)),
      })),
    };
  }));
});

// ─── Mark picked up ────────────────────────────────────────────────────────────
router.patch("/couriers/assignments/:id/pickup", requireAuth, requireActiveAccount, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const assignmentId = parseInt(String(req.params.id), 10);
  const [courier] = await db.select().from(couriersTable).where(eq(couriersTable.userId, userId));
  if (!courier || courier.status !== "approved") { res.status(403).json({ error: "Access denied" }); return; }

  const [assignment] = await db.select().from(courierAssignmentsTable)
    .where(and(eq(courierAssignmentsTable.id, assignmentId), eq(courierAssignmentsTable.courierId, courier.id)));
  if (!assignment) { res.status(404).json({ error: "Assignment not found" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, assignment.orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (order.status !== "courier_assigned") {
    res.status(400).json({ error: "Order must be in courier_assigned status" }); return;
  }

  await Promise.all([
    db.update(courierAssignmentsTable).set({ pickedUpAt: new Date(), updatedAt: new Date() }).where(eq(courierAssignmentsTable.id, assignment.id)),
    db.update(ordersTable).set({ status: "picked_up" as any, updatedAt: new Date() }).where(eq(ordersTable.id, order.id)),
    insertStatusHistory(order.id, "courier_assigned", "picked_up", userId, "courier"),
  ]);

  await createNotification({
    userId: order.customerId, type: "order_picked_up",
    title: bi("Order Picked Up", "تم استلام طلبك"),
    body: bi(`Your order #${order.id} has been picked up by the courier and is on the way!`, `تم استلام طلبك رقم #${order.id} من قِبل المندوب وهو في الطريق إليك!`),
    orderId: order.id, priority: "important", link: `/orders`,
  });

  res.json({ message: "Order marked as picked up", status: "picked_up" });
});

// ─── Start delivery (picked_up → out_for_delivery) ─────────────────────────────
router.patch("/couriers/assignments/:id/start-delivery", requireAuth, requireActiveAccount, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const assignmentId = parseInt(String(req.params.id), 10);
  const [courier] = await db.select().from(couriersTable).where(eq(couriersTable.userId, userId));
  if (!courier || courier.status !== "approved") { res.status(403).json({ error: "Access denied" }); return; }

  const [assignment] = await db.select().from(courierAssignmentsTable)
    .where(and(eq(courierAssignmentsTable.id, assignmentId), eq(courierAssignmentsTable.courierId, courier.id)));
  if (!assignment) { res.status(404).json({ error: "Assignment not found" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, assignment.orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (order.status !== "picked_up") {
    res.status(400).json({ error: "Order must be in picked_up status to start delivery" }); return;
  }

  await Promise.all([
    db.update(courierAssignmentsTable).set({ status: "out_for_delivery", updatedAt: new Date() })
      .where(eq(courierAssignmentsTable.id, assignment.id)),
    db.update(ordersTable).set({ status: "out_for_delivery" as any, updatedAt: new Date() })
      .where(eq(ordersTable.id, order.id)),
    insertStatusHistory(order.id, "picked_up", "out_for_delivery", userId, "courier"),
  ]);

  await createNotification({
    userId: order.customerId, type: "order_out_for_delivery",
    title: bi("Out for Delivery!", "طلبك في الطريق إليك!"),
    body: bi(`Your order #${order.id} is out for delivery and will arrive soon!`, `طلبك رقم #${order.id} في طريقه إليك وسيصل قريباً!`),
    orderId: order.id, priority: "important", link: `/orders`,
  });

  res.json({ message: "Order is now out for delivery", status: "out_for_delivery" });
});

// ─── Mark delivered (out_for_delivery → delivered) ─────────────────────────────
router.patch("/couriers/assignments/:id/deliver", requireAuth, requireActiveAccount, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const assignmentId = parseInt(String(req.params.id), 10);
  const [courier] = await db.select().from(couriersTable).where(eq(couriersTable.userId, userId));
  if (!courier || courier.status !== "approved") { res.status(403).json({ error: "Access denied" }); return; }

  const [assignment] = await db.select().from(courierAssignmentsTable)
    .where(and(eq(courierAssignmentsTable.id, assignmentId), eq(courierAssignmentsTable.courierId, courier.id)));
  if (!assignment) { res.status(404).json({ error: "Assignment not found" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, assignment.orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  // Accept both out_for_delivery (V1) and picked_up (backward compat for old orders)
  if (order.status !== "out_for_delivery" && order.status !== "picked_up") {
    res.status(400).json({ error: "Order must be out_for_delivery or picked_up to mark as delivered" }); return;
  }

  const fee = order.deliveryFee ? parseFloat(String(order.deliveryFee)) : 0;
  const courierCut = parseFloat((fee * 0.8).toFixed(2));

  await Promise.all([
    db.update(courierAssignmentsTable).set({
      status: "delivered", deliveredAt: new Date(), updatedAt: new Date(),
    }).where(eq(courierAssignmentsTable.id, assignment.id)),
    db.update(ordersTable).set({ status: "delivered" as any, updatedAt: new Date() }).where(eq(ordersTable.id, order.id)),
    db.update(couriersTable).set({
      completedDeliveries: courier.completedDeliveries + 1, updatedAt: new Date(),
    }).where(eq(couriersTable.id, courier.id)),
    insertStatusHistory(order.id, order.status as string, "delivered", userId, "courier"),
  ]);

  if (fee > 0) {
    await db.insert(courierWalletTransactionsTable).values({
      courierId: courier.id, orderId: order.id,
      amount: String(courierCut), type: "delivery_fee",
      notes: `Delivery of order #${order.id}`,
    });
  }

  await createNotification({
    userId: order.customerId, type: "order_delivered",
    title: bi("Order Delivered!", "تم تسليم طلبك!"),
    body: bi(`Your order #${order.id} has been delivered. Enjoy!`, `تم تسليم طلبك رقم #${order.id}. استمتع بمشترياتك!`),
    orderId: order.id, priority: "important", link: `/orders`,
  });

  res.json({ message: "Order marked as delivered", status: "delivered" });
});

// ─── Report delivery failure (out_for_delivery → delivery_failed) ──────────────
router.patch("/couriers/assignments/:id/fail-delivery", requireAuth, requireActiveAccount, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const assignmentId = parseInt(String(req.params.id), 10);
  const [courier] = await db.select().from(couriersTable).where(eq(couriersTable.userId, userId));
  if (!courier || courier.status !== "approved") { res.status(403).json({ error: "Access denied" }); return; }

  const [assignment] = await db.select().from(courierAssignmentsTable)
    .where(and(eq(courierAssignmentsTable.id, assignmentId), eq(courierAssignmentsTable.courierId, courier.id)));
  if (!assignment) { res.status(404).json({ error: "Assignment not found" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, assignment.orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (order.status !== "out_for_delivery") {
    res.status(400).json({ error: "Order must be out_for_delivery to report a failure" }); return;
  }

  const { notes, failureReason } = req.body;
  const reasonLabel = failureReason ?? notes ?? null;

  await Promise.all([
    db.update(courierAssignmentsTable).set({
      status: "delivery_failed",
      notes: reasonLabel,
      updatedAt: new Date(),
    }).where(eq(courierAssignmentsTable.id, assignment.id)),
    db.update(ordersTable).set({ status: "delivery_failed" as any, updatedAt: new Date() })
      .where(eq(ordersTable.id, order.id)),
    insertStatusHistory(order.id, "out_for_delivery", "delivery_failed", userId, "courier"),
  ]);

  const reasonSuffix = reasonLabel ? ` (${reasonLabel})` : "";

  // Notify customer
  await createNotification({
    userId: order.customerId, type: "order_delivery_failed",
    title: bi("Delivery Failed", "فشل التوصيل"),
    body: bi(`Delivery of order #${order.id} was unsuccessful. Our team will contact you.`, `تعذّر تسليم طلبك رقم #${order.id}. سيتواصل معك فريقنا.`),
    orderId: order.id, priority: "critical", link: `/orders`,
  });

  // Notify seller — find via order items
  const sellerItem = await db.select({ sellerId: orderItemsTable.sellerId }).from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id)).limit(1);
  if (sellerItem[0]) {
    await createNotification({
      userId: sellerItem[0].sellerId, type: "order_delivery_failed",
      title: bi("Delivery Failed", "فشل توصيل طلب"),
      body: bi(`Courier reported delivery failure for order #${order.id}${reasonSuffix}. Admin will follow up.`,
        `أبلغ المندوب عن فشل تسليم الطلب رقم #${order.id}${reasonSuffix}. سيتابع الإدارة الأمر.`),
      orderId: order.id, priority: "critical", link: `/seller/orders`,
    }).catch(() => {});
  }

  // Notify admins fire-and-forget
  db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin"))
    .then((admins) => Promise.allSettled(admins.map((admin) =>
      createNotification({
        userId: admin.id, type: "order_delivery_failed",
        title: bi("Delivery Failed", "فشل التوصيل"),
        body: bi(`Courier reported delivery failure for order #${order.id}${reasonSuffix}.`,
          `أبلغ المندوب عن فشل تسليم الطلب رقم #${order.id}${reasonSuffix}.`),
        orderId: order.id, priority: "critical", link: `/admin/orders`,
      })
    ))).catch(() => {});

  res.json({ message: "Delivery failure reported", status: "delivery_failed" });
});

// ─── Earnings summary ──────────────────────────────────────────────────────────
router.get("/couriers/earnings", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [courier] = await db.select().from(couriersTable).where(eq(couriersTable.userId, userId));
  if (!courier) { res.status(404).json({ error: "No courier profile found" }); return; }

  const [totals] = await db
    .select({ total: sum(courierWalletTransactionsTable.amount) })
    .from(courierWalletTransactionsTable)
    .where(eq(courierWalletTransactionsTable.courierId, courier.id));

  const recent = await db
    .select()
    .from(courierWalletTransactionsTable)
    .where(eq(courierWalletTransactionsTable.courierId, courier.id))
    .orderBy(desc(courierWalletTransactionsTable.createdAt))
    .limit(20);

  res.json({
    totalEarnings: parseFloat(String(totals?.total ?? "0")),
    completedDeliveries: courier.completedDeliveries,
    transactions: recent.map((t) => ({
      id: t.id,
      orderId: t.orderId,
      amount: parseFloat(String(t.amount)),
      type: t.type,
      notes: t.notes,
      createdAt: t.createdAt.toISOString(),
    })),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN routes
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Admin: list couriers ──────────────────────────────────────────────────────
router.get("/admin/couriers", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Access denied" }); return; }
  const rows = await db
    .select({
      id: couriersTable.id,
      userId: couriersTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
      status: couriersTable.status,
      active: couriersTable.active,
      phone: couriersTable.phone,
      vehicleType: couriersTable.vehicleType,
      district: couriersTable.district,
      rating: couriersTable.rating,
      completedDeliveries: couriersTable.completedDeliveries,
      notes: couriersTable.notes,
      createdAt: couriersTable.createdAt,
    })
    .from(couriersTable)
    .innerJoin(usersTable, eq(usersTable.id, couriersTable.userId))
    .orderBy(desc(couriersTable.createdAt));

  if (rows.length === 0) { res.json([]); return; }

  // Add active assignment count per courier
  const courierIds = rows.map((r) => r.id);
  const activeCounts = await db
    .select({ courierId: courierAssignmentsTable.courierId, cnt: count() })
    .from(courierAssignmentsTable)
    .where(
      and(
        inArray(courierAssignmentsTable.courierId, courierIds),
        inArray(courierAssignmentsTable.status, ["assigned", "picked_up", "out_for_delivery"]),
      )
    )
    .groupBy(courierAssignmentsTable.courierId);
  const activeMap: Record<number, number> = Object.fromEntries(activeCounts.map((c) => [c.courierId, Number(c.cnt)]));

  res.json(rows.map((r) => ({
    ...r,
    rating: r.rating ? parseFloat(String(r.rating)) : null,
    createdAt: r.createdAt.toISOString(),
    activeAssignments: activeMap[r.id] ?? 0,
  })));
});

// ─── Admin: get single courier detail ─────────────────────────────────────────
router.get("/admin/couriers/:id", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Access denied" }); return; }
  const id = parseInt(String(req.params.id), 10);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [row] = await db
    .select({
      id: couriersTable.id,
      userId: couriersTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userCreatedAt: usersTable.createdAt,
      status: couriersTable.status,
      active: couriersTable.active,
      phone: couriersTable.phone,
      vehicleType: couriersTable.vehicleType,
      district: couriersTable.district,
      rating: couriersTable.rating,
      completedDeliveries: couriersTable.completedDeliveries,
      notes: couriersTable.notes,
      createdAt: couriersTable.createdAt,
      updatedAt: couriersTable.updatedAt,
    })
    .from(couriersTable)
    .innerJoin(usersTable, eq(usersTable.id, couriersTable.userId))
    .where(eq(couriersTable.id, id));

  if (!row) { res.status(404).json({ error: "Courier not found" }); return; }

  res.json({
    ...row,
    rating: row.rating ? parseFloat(String(row.rating)) : null,
    userCreatedAt: row.userCreatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
});

// ─── Admin: approve/suspend/reject/reactivate courier ─────────────────────────
router.patch("/admin/couriers/:id", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Access denied" }); return; }
  const id = parseInt(String(req.params.id), 10);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { status, notes } = req.body;
  if (!status) { res.status(400).json({ error: "status is required" }); return; }

  // Fetch current status before updating (to distinguish approval vs reactivation)
  const [current] = await db.select({ status: couriersTable.status, userId: couriersTable.userId })
    .from(couriersTable).where(eq(couriersTable.id, id));
  if (!current) { res.status(404).json({ error: "Courier not found" }); return; }
  const previousStatus = current.status;

  const [updated] = await db.update(couriersTable)
    .set({ status, notes: notes ?? null, updatedAt: new Date() })
    .where(eq(couriersTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Courier not found" }); return; }

  // Sync user.role with courier status decision
  if (status === "approved") {
    await db.update(usersTable)
      .set({ role: "courier" as any })
      .where(eq(usersTable.id, updated.userId));

    const isReactivation = previousStatus === "suspended";
    if (isReactivation) {
      await createNotification({
        userId: updated.userId, type: "order_processing",
        title: bi("Courier Account Reactivated", "إعادة تفعيل حساب المندوب"),
        body: bi(
          "Your courier account has been reactivated. You can now access your courier dashboard.",
          "تمت إعادة تفعيل حسابك كمندوب. يمكنك الآن الوصول إلى لوحة تحكم المندوب.",
        ),
        link: "/courier/application-status",
        priority: "important",
      });
    } else {
      await createNotification({
        userId: updated.userId, type: "order_processing",
        title: bi("Courier Application Approved", "تمت الموافقة على طلبك كمندوب"),
        body: bi(
          "Congratulations! Your courier application has been approved. Tap to open your courier dashboard.",
          "تهانينا! تمت الموافقة على طلبك كمندوب. اضغط لفتح لوحة تحكم المندوب.",
        ),
        link: "/courier/application-status",
        priority: "important",
      });
    }
  } else if (status === "rejected") {
    await db.update(usersTable)
      .set({ role: "customer" as any })
      .where(eq(usersTable.id, updated.userId));
    await createNotification({
      userId: updated.userId, type: "order_cancelled",
      title: bi("Courier Application Update", "تحديث طلب التوصيل"),
      body: bi(
        "Your courier application was not approved at this time. You may apply again whenever you like.",
        "لم تتم الموافقة على طلبك كمندوب في الوقت الحالي. يمكنك إعادة التقديم في أي وقت.",
      ),
      priority: "normal",
    });
  } else if (status === "suspended") {
    // Keep role as "courier" but courier is suspended — they'll see suspension screen on dashboard
    await createNotification({
      userId: updated.userId, type: "order_cancelled",
      title: bi("Courier Account Suspended", "تعليق حساب المندوب"),
      body: bi(
        "Your courier account has been suspended. Please contact support for more information.",
        "تم إيقاف حسابك كمندوب. يُرجى التواصل مع الدعم للمزيد من المعلومات.",
      ),
      priority: "important",
    });
  }

  res.json({ id: updated.id, status: updated.status });
});

// ─── Admin: assign courier to order ───────────────────────────────────────────
router.post("/admin/orders/:id/assign-courier", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Access denied" }); return; }
  const orderId = parseInt(String(req.params.id), 10);
  if (!orderId) { res.status(400).json({ error: "Invalid order ID" }); return; }
  const { courierId } = req.body;
  if (!courierId) { res.status(400).json({ error: "courierId is required" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (!["ready_for_pickup", "processing"].includes(order.status as string)) {
    res.status(400).json({ error: "Order must be ready_for_pickup or processing to assign a courier" }); return;
  }

  const [courier] = await db.select().from(couriersTable).where(eq(couriersTable.id, courierId));
  if (!courier || courier.status !== "approved") { res.status(400).json({ error: "Courier not found or not approved" }); return; }

  // Remove existing assignment if any
  await db.delete(courierAssignmentsTable).where(eq(courierAssignmentsTable.orderId, orderId));

  await Promise.all([
    db.insert(courierAssignmentsTable).values({
      orderId, courierId, status: "assigned", adminId: req.user!.userId,
    }),
    db.update(ordersTable).set({ status: "courier_assigned" as any, updatedAt: new Date() }).where(eq(ordersTable.id, orderId)),
    insertStatusHistory(orderId, order.status as string, "courier_assigned", req.user!.userId, "admin"),
  ]);

  const [courierUser] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, courier.userId));
  await createNotification({
    userId: order.customerId, type: "order_courier_assigned",
    title: bi("Courier Assigned", "تم تعيين مندوب توصيل"),
    body: bi(`A courier has been assigned to your order #${order.id}.`, `تم تعيين مندوب توصيل لطلبك رقم #${order.id}.`),
    orderId: order.id, priority: "normal", link: `/orders`,
  });

  res.json({ message: "Courier assigned", courierId, courierName: courierUser?.name ?? "Unknown", orderId, newStatus: "courier_assigned" });
});

// ─── Admin: unassign courier from order ───────────────────────────────────────
router.delete("/admin/orders/:id/assign-courier", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Access denied" }); return; }
  const orderId = parseInt(String(req.params.id), 10);
  if (!orderId) { res.status(400).json({ error: "Invalid order ID" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  await Promise.all([
    db.delete(courierAssignmentsTable).where(eq(courierAssignmentsTable.orderId, orderId)),
    db.update(ordersTable).set({ status: "ready_for_pickup" as any, updatedAt: new Date() }).where(eq(ordersTable.id, orderId)),
    insertStatusHistory(orderId, order.status as string, "ready_for_pickup", req.user!.userId, "admin"),
  ]);

  res.json({ message: "Courier unassigned", orderId, newStatus: "ready_for_pickup" });
});

// ─── Admin: ready orders waiting for courier ───────────────────────────────────
router.get("/admin/delivery/ready-orders", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Access denied" }); return; }
  const orders = await db
    .select({
      id: ordersTable.id,
      total: ordersTable.total,
      status: ordersTable.status,
      shippingAddress: ordersTable.shippingAddress,
      customerPhone: ordersTable.customerPhone,
      city: ordersTable.city,
      deliveryFee: ordersTable.deliveryFee,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
      customerName: usersTable.name,
    })
    .from(ordersTable)
    .innerJoin(usersTable, eq(usersTable.id, ordersTable.customerId))
    .where(eq(ordersTable.status, "ready_for_pickup" as any))
    .orderBy(desc(ordersTable.createdAt));

  if (orders.length === 0) { res.json([]); return; }

  // Batch: items + seller info
  const orderIds = orders.map((o) => o.id);
  const items = await db
    .select({ orderId: orderItemsTable.orderId, productName: orderItemsTable.productName, quantity: orderItemsTable.quantity, sellerId: orderItemsTable.sellerId })
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orderIds));

  const sellerIds = [...new Set(items.map((i) => i.sellerId))];
  const [sellerUsers, sellerApps] = sellerIds.length > 0
    ? await Promise.all([
      db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, sellerIds)),
      db.select({ userId: sellerApplicationsTable.userId, storeName: sellerApplicationsTable.storeName, phone: sellerApplicationsTable.phone })
        .from(sellerApplicationsTable)
        .where(and(inArray(sellerApplicationsTable.userId, sellerIds), eq(sellerApplicationsTable.status, "approved"))),
    ])
    : [[], []];

  const sellerNameMap: Record<number, string> = Object.fromEntries((sellerUsers as any[]).map((u) => [u.id, u.name ?? ""]));
  const sellerStoreMap: Record<number, { storeName: string; phone: string }> =
    Object.fromEntries((sellerApps as any[]).map((s) => [s.userId, { storeName: s.storeName, phone: s.phone }]));

  const itemsByOrder: Record<number, typeof items> = {};
  for (const item of items) {
    if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
    itemsByOrder[item.orderId].push(item);
  }

  res.json(orders.map((o) => {
    const orderItems = itemsByOrder[o.id] ?? [];
    const firstSellerId = orderItems[0]?.sellerId;
    return {
      id: o.id,
      total: parseFloat(String(o.total)),
      status: o.status,
      shippingAddress: o.shippingAddress,
      customerPhone: o.customerPhone,
      city: o.city,
      deliveryFee: o.deliveryFee ? parseFloat(String(o.deliveryFee)) : null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      customerName: o.customerName,
      sellerName: firstSellerId ? (sellerNameMap[firstSellerId] ?? null) : null,
      storeName: firstSellerId ? (sellerStoreMap[firstSellerId]?.storeName ?? null) : null,
      sellerPhone: firstSellerId ? (sellerStoreMap[firstSellerId]?.phone ?? null) : null,
      products: orderItems.map((i) => ({ name: i.productName, quantity: i.quantity })),
    };
  }));
});

// ─── Admin: active deliveries ──────────────────────────────────────────────────
router.get("/admin/delivery/active", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Access denied" }); return; }
  const rows = await db
    .select({
      assignmentId: courierAssignmentsTable.id,
      orderId: courierAssignmentsTable.orderId,
      assignmentStatus: courierAssignmentsTable.status,
      assignedAt: courierAssignmentsTable.assignedAt,
      pickedUpAt: courierAssignmentsTable.pickedUpAt,
      courierId: couriersTable.id,
      courierName: usersTable.name,
      courierPhone: couriersTable.phone,
      orderStatus: ordersTable.status,
      shippingAddress: ordersTable.shippingAddress,
      city: ordersTable.city,
      customerPhone: ordersTable.customerPhone,
      deliveryFee: ordersTable.deliveryFee,
      total: ordersTable.total,
      customerId: ordersTable.customerId,
    })
    .from(courierAssignmentsTable)
    .innerJoin(couriersTable, eq(couriersTable.id, courierAssignmentsTable.courierId))
    .innerJoin(usersTable, eq(usersTable.id, couriersTable.userId))
    .innerJoin(ordersTable, eq(ordersTable.id, courierAssignmentsTable.orderId))
    .where(inArray(courierAssignmentsTable.status, ["assigned", "picked_up", "out_for_delivery", "delivery_failed"]))
    .orderBy(desc(courierAssignmentsTable.assignedAt));

  if (rows.length === 0) { res.json([]); return; }

  // Batch: customer names
  const customerIds = [...new Set(rows.map((r) => r.customerId))];
  const customerUsers = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(inArray(usersTable.id, customerIds));
  const customerNameMap: Record<number, string> = Object.fromEntries(customerUsers.map((u) => [u.id, u.name ?? ""]));

  // Batch: order items + seller info
  const orderIds = rows.map((r) => r.orderId);
  const items = await db
    .select({ orderId: orderItemsTable.orderId, productName: orderItemsTable.productName, quantity: orderItemsTable.quantity, sellerId: orderItemsTable.sellerId })
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orderIds));

  const sellerIds = [...new Set(items.map((i) => i.sellerId))];
  const sellerApps = sellerIds.length > 0
    ? await db.select({ userId: sellerApplicationsTable.userId, storeName: sellerApplicationsTable.storeName })
        .from(sellerApplicationsTable)
        .where(and(inArray(sellerApplicationsTable.userId, sellerIds), eq(sellerApplicationsTable.status, "approved")))
    : [];
  const sellerAppMap: Record<number, string> = Object.fromEntries((sellerApps as any[]).map((s) => [s.userId, s.storeName]));

  const itemsByOrder: Record<number, typeof items> = {};
  for (const item of items) {
    if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
    itemsByOrder[item.orderId].push(item);
  }

  res.json(rows.map((r) => {
    const orderItems = itemsByOrder[r.orderId] ?? [];
    const firstSellerId = orderItems[0]?.sellerId;
    return {
      assignmentId: r.assignmentId,
      orderId: r.orderId,
      assignmentStatus: r.assignmentStatus,
      assignedAt: r.assignedAt.toISOString(),
      pickedUpAt: r.pickedUpAt?.toISOString() ?? null,
      courierId: r.courierId,
      courierName: r.courierName,
      courierPhone: r.courierPhone,
      orderStatus: r.orderStatus,
      shippingAddress: r.shippingAddress,
      city: r.city,
      customerName: customerNameMap[r.customerId] ?? null,
      customerPhone: r.customerPhone,
      deliveryFee: r.deliveryFee ? parseFloat(String(r.deliveryFee)) : null,
      total: parseFloat(String(r.total)),
      storeName: firstSellerId ? (sellerAppMap[firstSellerId] ?? null) : null,
      products: orderItems.map((i) => ({ name: i.productName, quantity: i.quantity })),
    };
  }));
});

// ─── Seller: mark order ready for pickup ──────────────────────────────────────
router.patch("/seller/orders/:id/ready", requireAuth, requireActiveAccount, async (req, res): Promise<void> => {
  if (req.user?.role !== "seller") { res.status(403).json({ error: "Access denied" }); return; }
  const orderId = parseInt(String(req.params.id), 10);
  if (!orderId) { res.status(400).json({ error: "Invalid order ID" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  const allBelongToSeller = items.every((i) => i.sellerId === req.user!.userId);
  if (!allBelongToSeller) { res.status(403).json({ error: "Access denied" }); return; }

  if (order.status !== "processing") {
    res.status(400).json({ error: "Order must be in processing status to mark as ready" }); return;
  }

  await Promise.all([
    db.update(ordersTable).set({ status: "ready_for_pickup" as any, updatedAt: new Date() }).where(eq(ordersTable.id, orderId)),
    insertStatusHistory(orderId, "processing", "ready_for_pickup", req.user!.userId, "seller"),
  ]);

  await createNotification({
    userId: order.customerId, type: "order_processing",
    title: bi("Order Ready for Pickup", "طلبك جاهز للاستلام"),
    body: bi(`Your order #${order.id} is ready and waiting for a courier.`, `طلبك رقم #${order.id} جاهز وينتظر مندوب التوصيل.`),
    orderId: order.id, priority: "normal", link: `/orders`,
  });

  res.json({ message: "Order marked as ready for pickup", status: "ready_for_pickup" });
});

export default router;
