import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Additive DB migrations run once at server startup.
 * All statements use IF EXISTS / IF NOT EXISTS guards so they are:
 *  - Safe to re-run on existing deployments (idempotent)
 *  - Safe on a fresh database where tables may not exist yet (will
 *    be created by `drizzle-kit push`; these just add extra columns)
 *
 * NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
 * Those statements are run as individual client.query() calls before the
 * main migration block.
 */
export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // ── Extend role enum with 'courier' ────────────────────────────────────────
    try {
      await client.query(`ALTER TYPE role ADD VALUE IF NOT EXISTS 'courier'`);
    } catch {
      // May already exist
    }

    // ── Extend order_status enum (each must be its own non-transaction call) ──
    const newStatusValues = [
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "courier_assigned",
      "picked_up",
      "in_transit",
      "out_for_delivery",
      "delivery_failed",
      "returned",
    ];
    for (const val of newStatusValues) {
      try {
        await client.query(`ALTER TYPE order_status ADD VALUE IF NOT EXISTS '${val}'`);
      } catch {
        // Value may already exist in older PG versions that don't support IF NOT EXISTS
      }
    }

    // ── Extend notification_type enum ─────────────────────────────────────────
    // schema.sql only has 17 of 31 values — these 14 were added after initial
    // schema generation and must be present for courier/delivery/trust features.
    // Each ALTER TYPE must be its own non-transaction call.
    const newNotifValues = [
      "order_confirmed",
      "order_preparing",
      "order_ready",
      "order_courier_assigned",
      "order_picked_up",
      "order_out_for_delivery",
      "order_delivery_failed",
      "order_returned",
      "order_cancelled_by_customer",
      "order_refunded",
      "new_user",
      "courier_applied",
      "courier_approved",
      "courier_rejected",
      "new_seller_review",
      "seller_review_reply",
    ];
    for (const val of newNotifValues) {
      try {
        await client.query(`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS '${val}'`);
      } catch {
        // May already exist
      }
    }

    // ── Main migration block (idempotent DDL) ──────────────────────────────────
    await client.query(`
      -- Order tracking fields (added in order-workflow redesign)
      -- Wrapped in DO block so they only run when the table exists
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'orders'
        ) THEN
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_company TEXT;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number  TEXT;
        END IF;
      END $$;

      -- Permanent audit log for every order status transition
      CREATE TABLE IF NOT EXISTS order_status_history (
        id             SERIAL PRIMARY KEY,
        order_id       INTEGER      NOT NULL,
        from_status    TEXT,
        to_status      TEXT         NOT NULL,
        changed_by     INTEGER,
        changed_by_role TEXT,
        notes          TEXT,
        created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id
        ON order_status_history(order_id);

      -- Variant support columns
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_items'
        ) THEN
          ALTER TABLE cart_items  ADD COLUMN IF NOT EXISTS variant_id      INTEGER;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items'
        ) THEN
          ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id      INTEGER;
          ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_details TEXT;
        END IF;
        -- product_variants extended pricing/fulfillment columns
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants'
        ) THEN
          ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS price           NUMERIC(10,2);
          ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10,2);
          ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS barcode         TEXT;
          ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS weight_grams    INTEGER;
          ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS dimensions      TEXT;
        END IF;
      END $$;

      -- Auto-featured products: track delivered sales count per product
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'products'
        ) THEN
          ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER NOT NULL DEFAULT 0;
        END IF;
      END $$;

      -- Account suspension system + password reset OTP
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'users'
        ) THEN
          ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_by INTEGER;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_hash TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMPTZ;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_attempts INTEGER NOT NULL DEFAULT 0;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_locked_until TIMESTAMPTZ;
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

      -- Variant images table (per-variant media with optional option-value link)
      CREATE TABLE IF NOT EXISTS variant_images (
        id              SERIAL PRIMARY KEY,
        variant_id      INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
        url             TEXT NOT NULL,
        position        INTEGER NOT NULL DEFAULT 0,
        option_value_id INTEGER REFERENCES product_variant_options(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS vi_variant_id_idx      ON variant_images(variant_id);
      CREATE INDEX IF NOT EXISTS vi_option_value_id_idx ON variant_images(option_value_id);

      -- ── Delivery system columns ────────────────────────────────────────────────
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'orders'
        ) THEN
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee        NUMERIC(10,2);
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS zone_id             INTEGER;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by        TEXT;
        END IF;
      END $$;

      -- Delivery zones (Aleppo districts)
      CREATE TABLE IF NOT EXISTS delivery_zones (
        id         SERIAL PRIMARY KEY,
        name_en    TEXT        NOT NULL,
        name_ar    TEXT        NOT NULL,
        fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
        active     BOOLEAN     NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Seed default Aleppo delivery zones if none exist
      INSERT INTO delivery_zones (name_en, name_ar, fee, active)
      SELECT * FROM (VALUES
        ('Aleppo Center',      'حلب المركز',      1.00, TRUE),
        ('Al-Aziziyeh',        'العزيزية',        1.00, TRUE),
        ('Al-Suleimaniyeh',    'السليمانية',      1.00, TRUE),
        ('Al-Hamadaniyeh',     'الحمدانية',       1.50, TRUE),
        ('Al-Meridian',        'الميردان',        1.50, TRUE),
        ('Al-Nile',            'حي النيل',        1.50, TRUE),
        ('Al-Kallaseh',        'الكلاسة',         1.00, TRUE),
        ('Al-Jamiliyeh',       'الجميلية',        1.00, TRUE),
        ('Al-Muhafazah',       'المحافظة',        1.00, TRUE),
        ('Al-Sabaa Bahrat',    'الساحة السبع بحرات', 1.00, TRUE),
        ('Al-Masharqah',       'المشارقة',        1.50, TRUE),
        ('Al-Sabil',           'السبيل',          2.00, TRUE),
        ('Al-Hannano',         'هنانو',           2.00, TRUE),
        ('Al-Ramousa',         'الراموسة',        2.00, TRUE),
        ('Al-Khalidiyeh',      'الخالدية',        1.50, TRUE),
        ('Al-Shaar',           'الشعار',          1.50, TRUE)
      ) AS v(name_en, name_ar, fee, active)
      WHERE NOT EXISTS (SELECT 1 FROM delivery_zones LIMIT 1);

      -- Expand Aleppo delivery zones (idempotent — skips zones that already exist)
      WITH new_zones(name_en, name_ar, fee) AS (VALUES
        ('Al-Midan',            'الميدان',            1.50),
        ('Bab Al-Nayrab',       'باب النيرب',         1.50),
        ('Al-Firdaws',          'الفردوس',            1.50),
        ('Al-Zahraa',           'الزهراء',            1.50),
        ('New Aleppo',          'حلب الجديدة',        2.00),
        ('Al-Ansari',           'الأنصاري',           2.00),
        ('Al-Qaterji',          'القاطرجي',           2.00),
        ('Al-Furqan',           'الفرقان',            1.50),
        ('Bab Al-Faraj',        'باب الفرج',          1.00),
        ('Al-Azamiyeh',         'العظيمية',           1.50),
        ('Al-Haydariyeh',       'الحيدرية',           2.00),
        ('Al-Maadie',           'المعادي',            2.00),
        ('Salah Al-Din',        'صلاح الدين',         2.00),
        ('Al-Lairamoun',        'الليرمون',           2.50),
        ('Bab Al-Hadid',        'باب الحديد',         1.00),
        ('Al-Bustan',           'البستان',            1.50),
        ('Al-Jazmati',          'الجزماتي',           1.50),
        ('Karm Al-Jabal',       'كرم الجبل',          2.00),
        ('Al-Rashideen',        'الراشدين',           2.50),
        ('Sheikh Fares',        'شيخ فارس',           2.00),
        ('Al-Mansoura',         'المنصورة',           2.00),
        ('Al-Mujahideen',       'المجاهدين',          2.00),
        ('Al-Khadra',           'الخضراء',            2.50),
        ('Al-Old City',         'المدينة القديمة',    1.00)
      )
      INSERT INTO delivery_zones (name_en, name_ar, fee, active)
      SELECT nz.name_en, nz.name_ar, nz.fee, TRUE
      FROM   new_zones nz
      WHERE  NOT EXISTS (
        SELECT 1 FROM delivery_zones dz WHERE dz.name_en = nz.name_en
      );

      -- Courier profiles table
      CREATE TABLE IF NOT EXISTS couriers (
        id                    SERIAL PRIMARY KEY,
        user_id               INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        status                TEXT NOT NULL DEFAULT 'pending',
        active                BOOLEAN NOT NULL DEFAULT FALSE,
        city                  TEXT NOT NULL DEFAULT 'Aleppo',
        district              TEXT,
        phone                 TEXT NOT NULL,
        vehicle_type          TEXT NOT NULL DEFAULT 'motorcycle',
        rating                NUMERIC(3,2),
        completed_deliveries  INTEGER NOT NULL DEFAULT 0,
        notes                 TEXT,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_couriers_user_id ON couriers(user_id);
      CREATE INDEX IF NOT EXISTS idx_couriers_status  ON couriers(status);

      -- Courier assignments (one per order)
      CREATE TABLE IF NOT EXISTS courier_assignments (
        id           SERIAL PRIMARY KEY,
        order_id     INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
        courier_id   INTEGER NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
        status       TEXT NOT NULL DEFAULT 'assigned',
        assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        accepted_at  TIMESTAMPTZ,
        picked_up_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        notes        TEXT,
        admin_id     INTEGER REFERENCES users(id),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_courier_assignments_order_id   ON courier_assignments(order_id);
      CREATE INDEX IF NOT EXISTS idx_courier_assignments_courier_id ON courier_assignments(courier_id);
      CREATE INDEX IF NOT EXISTS idx_courier_assignments_status     ON courier_assignments(status);

      -- Courier earnings ledger
      CREATE TABLE IF NOT EXISTS courier_wallet_transactions (
        id          SERIAL PRIMARY KEY,
        courier_id  INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
        order_id    INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        amount      NUMERIC(10,2) NOT NULL,
        type        TEXT NOT NULL,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_courier_wallet_courier_id ON courier_wallet_transactions(courier_id);

      -- ── Store Settings V2 columns on seller_applications ─────────────────────
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_applications'
        ) THEN
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS shipping_policy   TEXT;
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS return_policy     TEXT;
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS warranty_policy   TEXT;
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS privacy_policy    TEXT;
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS meta_title        TEXT;
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS meta_description  TEXT;
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS seo_image_url     TEXT;
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS whatsapp          TEXT;
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS telegram          TEXT;
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS facebook          TEXT;
          ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS instagram         TEXT;
        END IF;
      END $$;

      -- ── Trust & verification columns on users ──────────────────────────────────
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'users'
        ) THEN
          ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_level     TEXT DEFAULT 'none';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_method    TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_by            INTEGER;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score            INTEGER;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_level            TEXT DEFAULT 'new';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score_updated_at TIMESTAMPTZ;
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS idx_users_verification_level ON users(verification_level);
      CREATE INDEX IF NOT EXISTS idx_users_trust_score        ON users(trust_score);

      -- ── Seller review reply columns ───────────────────────────────────────────
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_reviews'
        ) THEN
          ALTER TABLE seller_reviews ADD COLUMN IF NOT EXISTS seller_reply            TEXT;
          ALTER TABLE seller_reviews ADD COLUMN IF NOT EXISTS seller_reply_at         TIMESTAMP;
          ALTER TABLE seller_reviews ADD COLUMN IF NOT EXISTS seller_reply_updated_at TIMESTAMP;
        END IF;
      END $$;

      -- ── Seller verification audit log (admin approval/rejection history) ────────
      CREATE TABLE IF NOT EXISTS seller_verification_log (
        id          SERIAL PRIMARY KEY,
        seller_id   INTEGER NOT NULL,
        admin_id    INTEGER NOT NULL,
        action      TEXT NOT NULL,
        from_level  TEXT,
        to_level    TEXT,
        method      TEXT,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_seller_verif_log_seller_id ON seller_verification_log(seller_id);
      CREATE INDEX IF NOT EXISTS idx_seller_verif_log_admin_id  ON seller_verification_log(admin_id);
    `);

    logger.info("Migrations complete: delivery system tables, courier enums, order delivery columns ready");
  } catch (err) {
    logger.error({ err }, "Migration error — server cannot start safely");
    throw err;
  } finally {
    client.release();
  }
}
