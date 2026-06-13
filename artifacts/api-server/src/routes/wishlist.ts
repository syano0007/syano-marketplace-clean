import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

// Inline wishlist table definition — avoids regenerating lib typings
const wishlistsTable = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const router: IRouter = Router();

// GET /wishlist — full product objects for current user
router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  try {
    const rows = await db
      .select({ product: productsTable })
      .from(wishlistsTable)
      .innerJoin(productsTable, eq(wishlistsTable.productId, productsTable.id))
      .where(eq(wishlistsTable.userId, user.id))
      .orderBy(desc(wishlistsTable.createdAt));
    res.json(rows.map((r) => r.product));
  } catch {
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// GET /wishlist/ids — lightweight: just product IDs (for heart toggle state)
router.get("/wishlist/ids", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  try {
    const rows = await db
      .select({ productId: wishlistsTable.productId })
      .from(wishlistsTable)
      .where(eq(wishlistsTable.userId, user.id));
    res.json(rows.map((r) => r.productId));
  } catch {
    res.status(500).json({ error: "Failed to fetch wishlist IDs" });
  }
});

// POST /wishlist — add a product
router.post("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const productId = Number(req.body?.productId);
  if (!productId || isNaN(productId)) {
    res.status(400).json({ error: "productId required" });
    return;
  }
  try {
    await db
      .insert(wishlistsTable)
      .values({ userId: user.id, productId })
      .onConflictDoNothing();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

// DELETE /wishlist/:productId — remove a product
router.delete("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const productId = parseInt(String(req.params.productId), 10);
  if (isNaN(productId)) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }
  try {
    await db
      .delete(wishlistsTable)
      .where(and(eq(wishlistsTable.userId, user.id), eq(wishlistsTable.productId, productId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

export default router;
