import {
  pgTable, serial, integer, text, numeric, timestamp, boolean, index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const couriersTable = pgTable("couriers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  active: boolean("active").notNull().default(false),
  city: text("city").notNull().default("Aleppo"),
  district: text("district"),
  phone: text("phone").notNull(),
  vehicleType: text("vehicle_type").notNull().default("motorcycle"),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  completedDeliveries: integer("completed_deliveries").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_couriers_user_id").on(t.userId),
  index("idx_couriers_status").on(t.status),
]);

export type Courier = typeof couriersTable.$inferSelect;
export type InsertCourier = typeof couriersTable.$inferInsert;
