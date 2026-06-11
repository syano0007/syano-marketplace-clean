---
name: notification_type enum recovery
description: schema.sql has only 17 of 31 notification_type enum values; the 14 delivery/courier types must always be added manually after any schema.sql restore
---

# notification_type Enum Recovery

**Rule:** After any `psql -f schema.sql` restore, always run the ALTER TYPE block below. Without it, every courier/delivery notification INSERT will crash the DB transaction.

**Why:** The 14 missing values were added iteratively after the initial schema was exported to schema.sql. The enum cannot be modified inside a transaction block (PostgreSQL restriction), so they cannot be in schema.sql migrations easily.

**How to apply:** Run after every fresh schema.sql restore, before starting the API server:

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_confirmed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_preparing';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_ready';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_courier_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_picked_up';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_out_for_delivery';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_delivery_failed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_returned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_cancelled_by_customer';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_refunded';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_user';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'courier_applied';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'courier_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'courier_rejected';
```

Verify: `SELECT COUNT(*) FROM unnest(enum_range(NULL::notification_type));` → should return 31.

See: RECOVERY_GUIDE.md Step 3.
