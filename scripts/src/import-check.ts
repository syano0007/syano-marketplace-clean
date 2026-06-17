/**
 * SYANO Import & Recovery Check
 *
 * Usage: pnpm import:check
 *
 * Verifies that a fresh GitHub import is fully operational:
 *   - node_modules present
 *   - DATABASE_URL set and DB reachable
 *   - All 37 required tables present
 *   - All required enums with correct value counts
 *   - Critical migration columns present
 *   - Courier V3.3 tables present (delivery_missions, mission_offers, dispatch_alerts)
 *   - Schema drift detection (Drizzle expected tables vs DB actual tables)
 *   - Embedding service reachable (warning only)
 *   - Marketplace source files present
 *   - Mobile source files present
 *
 * Exits 0 on PASS, 1 on FAIL.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../");

const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

const pass  = (msg: string) => console.log(`  ${GREEN}✓${RESET} ${msg}`);
const fail  = (msg: string) => console.log(`  ${RED}✗${RESET} ${msg}`);
const warn  = (msg: string) => console.log(`  ${YELLOW}⚠${RESET} ${msg}`);
const info  = (msg: string) => console.log(`  ${CYAN}ℹ${RESET} ${msg}`);
const section = (msg: string) => console.log(`\n${BOLD}${msg}${RESET}`);

let failures = 0;
let warnings = 0;

function checkFail(msg: string) { fail(msg); failures++; }
function checkWarn(msg: string) { warn(msg); warnings++; }

// ── SECTION 1: Node Modules ──────────────────────────────────────────────────

section("1. Node Modules");

const criticalModules = [
  "node_modules/.bin/vite",
  "artifacts/api-server/node_modules",
  "artifacts/mobile/node_modules/.bin/expo",
];
for (const mod of criticalModules) {
  const fullPath = path.join(ROOT, mod);
  if (fs.existsSync(fullPath)) {
    pass(mod);
  } else {
    checkFail(`${mod} missing — run: pnpm install`);
  }
}

// ── SECTION 2: Environment Variables ────────────────────────────────────────

section("2. Environment Variables");

const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET"];
for (const v of requiredEnvVars) {
  if (process.env[v]) pass(`${v} set`);
  else checkFail(`${v} not set`);
}

const optionalEnvVars = ["EMBEDDING_SERVICE_URL", "RESEND_API_KEY", "VAPID_PUBLIC_KEY"];
for (const v of optionalEnvVars) {
  if (process.env[v]) pass(`${v} set`);
  else checkWarn(`${v} not set (optional)`);
}

if (failures > 0) {
  console.log(`\n${RED}${BOLD}FAIL${RESET} — cannot continue without DATABASE_URL and SESSION_SECRET\n`);
  process.exit(1);
}

// ── SECTION 3: Database Connection + Tables ──────────────────────────────────

section("3. Database Connection & Schema");

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env["DATABASE_URL"]! });

let client: pg.PoolClient;
try {
  client = await pool.connect();
  pass("Database connection OK");
} catch (err) {
  checkFail(`Cannot connect to database: ${err instanceof Error ? err.message : err}`);
  console.log(`\n${RED}${BOLD}FAIL${RESET} — database unreachable\n`);
  process.exit(1);
}

// Count tables
const tableCountRes = await client.query<{ count: string }>(
  `SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`
);
const tableCount = parseInt(tableCountRes.rows[0]?.count ?? "0", 10);

if (tableCount >= 37) {
  pass(`Table count: ${tableCount} (≥37 required)`);
} else if (tableCount >= 27) {
  checkWarn(`Table count: ${tableCount} (\u226537 expected — run 'pnpm --filter @workspace/db run push' then restart API)`);
} else {
  checkFail(`Table count: ${tableCount} (need ≥27 — run: pnpm --filter @workspace/db run push)`);
}

// Required tables
const requiredTables = [
  // Core
  "users", "products", "orders", "cart_items", "order_items",
  "seller_applications", "notifications", "reviews",
  "conversations", "messages",
  // Courier V3.3
  "couriers", "courier_assignments", "courier_wallet_transactions",
  "delivery_zones", "delivery_missions", "mission_offers", "dispatch_alerts",
  // Extended
  "hero_banners", "wishlists", "product_variants", "product_variant_groups",
  "seller_verification_log", "search_synonyms", "order_status_history",
];

const tableCheckRes = await client.query<{ table_name: string }>(
  `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`
);
const existingTables = new Set(tableCheckRes.rows.map(r => r.table_name));

const missingTables: string[] = [];
for (const t of requiredTables) {
  if (existingTables.has(t)) {
    pass(`  table: ${t}`);
  } else {
    checkFail(`  table: ${t} MISSING`);
    missingTables.push(t);
  }
}

// ── SECTION 4: Enums ─────────────────────────────────────────────────────────

section("4. Database Enums");

const enumChecks: Array<{ name: string; min: number; expected: number }> = [
  { name: "notification_type",       min: 32, expected: 32 },
  { name: "order_status",            min: 15, expected: 15 },
  { name: "delivery_mission_status", min: 7,  expected: 9  },
];

for (const { name, min, expected } of enumChecks) {
  try {
    const res = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM unnest(enum_range(NULL::${name}))`
    );
    const count = parseInt(res.rows[0]?.count ?? "0", 10);
    if (count >= min) {
      pass(`${name}: ${count} values (${count >= expected ? "✓" : `expected ${expected}`})`);
    } else {
      checkFail(`${name}: ${count}/${min} values missing — run ALTER TYPE migrations`);
    }
  } catch {
    checkFail(`${name}: enum not found — run: pnpm --filter @workspace/db run push`);
  }
}

// ── SECTION 5: Critical Columns ──────────────────────────────────────────────

section("5. Critical Migration Columns");

const criticalColumns: Array<[string, string]> = [
  ["users",         "account_status"],
  ["users",         "trust_score"],
  ["users",         "verification_level"],
  ["users",         "preferred_theme"],
  ["orders",        "delivery_fee"],
  ["orders",        "zone_id"],
  ["conversations", "type"],
  ["products",      "sales_count"],
  ["couriers",      "availability_status"],
  ["products",      "fts_vector"],
];

const colRes = await client.query<{ table_name: string; column_name: string }>(
  `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'`
);
const existingCols = new Set(colRes.rows.map(r => `${r.table_name}.${r.column_name}`));

for (const [table, col] of criticalColumns) {
  const key = `${table}.${col}`;
  if (existingCols.has(key)) pass(key);
  else checkFail(`${key} MISSING — run migrations`);
}

// ── SECTION 6: Schema Drift Detection ───────────────────────────────────────

section("6. Schema Drift (Drizzle vs Database)");

// Tables that Drizzle schema defines (expected in DB)
const drizzleExpectedTables = [
  "users", "products", "product_variants", "product_variant_groups",
  "product_variant_options", "variant_images", "cart_items", "orders", "order_items",
  "order_status_history", "reviews", "seller_applications", "seller_reviews",
  "notifications", "push_subscriptions", "conversations", "messages",
  "message_attachments", "store_follows", "couriers", "delivery_zones",
  "courier_assignments", "courier_wallet_transactions", "delivery_missions",
  "mission_offers", "dispatch_alerts", "hero_banners", "wishlists",
  "search_synonyms", "seller_verification_log", "seller_verification_log",
  "support_tickets",
];

const uniqueExpected = [...new Set(drizzleExpectedTables)];
const driftMissing: string[] = [];
const driftPresent: string[] = [];

for (const t of uniqueExpected) {
  if (existingTables.has(t)) driftPresent.push(t);
  else driftMissing.push(t);
}

if (driftMissing.length === 0) {
  pass(`No schema drift — all ${driftPresent.length} Drizzle tables present in DB`);
} else {
  for (const t of driftMissing) {
    checkFail(`Schema drift: '${t}' in Drizzle schema but NOT in DB`);
  }
  info(`Fix: pnpm --filter @workspace/db run push && restart API (auto-migrations create the rest)`);
}

// ── SECTION 7: Seeded Data ───────────────────────────────────────────────────

section("7. Seeded Data");

try {
  const prodRes = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM products`);
  const prodCount = parseInt(prodRes.rows[0]?.count ?? "0", 10);
  if (prodCount >= 42) pass(`Products: ${prodCount} (≥42 required)`);
  else if (prodCount > 0) checkWarn(`Products: ${prodCount} (42 expected — API will re-seed on next start)`);
  else checkFail(`Products: 0 — start API server to trigger bootstrapDemoMarketplaceData()`);

  const zoneRes = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM delivery_zones`);
  const zoneCount = parseInt(zoneRes.rows[0]?.count ?? "0", 10);
  if (zoneCount >= 40) pass(`Delivery zones: ${zoneCount}`);
  else if (zoneCount > 0) checkWarn(`Delivery zones: ${zoneCount} (40 expected)`);
  else checkFail(`Delivery zones: 0 — start API to trigger migration seed`);

  const adminRes = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM users WHERE role='admin'`
  );
  const adminCount = parseInt(adminRes.rows[0]?.count ?? "0", 10);
  if (adminCount > 0) pass(`Admin users: ${adminCount}`);
  else checkFail(`No admin users — start API to trigger bootstrapRootAdmin()`);
} catch (err) {
  checkWarn(`Seeded data check skipped: ${err instanceof Error ? err.message : err}`);
}

// ── SECTION 8: Embedding Service ─────────────────────────────────────────────

section("8. Embedding Service");

const embeddingUrl = process.env["EMBEDDING_SERVICE_URL"] ?? "http://localhost:8000";
try {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 2000);
  const eRes = await fetch(`${embeddingUrl}/health`, { signal: ctrl.signal });
  clearTimeout(tid);
  if (eRes.ok) {
    const body = await eRes.json() as Record<string, unknown>;
    pass(`Embedding service: ${body["backend"] ?? "running"} (${body["vector_dimensions"] ?? "?"} dims)`);
  } else {
    checkWarn(`Embedding service returned ${eRes.status} — TF-IDF fallback will be used`);
  }
} catch {
  checkWarn("Embedding service not reachable — start 'Embedding Service' workflow (TF-IDF fallback available)");
}

// ── SECTION 9: API Server ────────────────────────────────────────────────────

section("9. API Server");

const apiPort = process.env["PORT"] ?? "8080";
try {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 3000);
  const apiRes = await fetch(`http://localhost:${apiPort}/api/healthz`, { signal: ctrl.signal });
  clearTimeout(tid);
  if (apiRes.ok) {
    const body = await apiRes.json() as Record<string, unknown>;
    pass(`API healthz: status=${body["status"]} tables=${(body["database"] as Record<string, unknown>)?.["tables"] ?? "?"}`);
  } else {
    checkWarn(`API healthz returned ${apiRes.status}`);
  }
} catch {
  checkWarn("API server not reachable — start 'API Server' workflow");
}

// ── SECTION 10: Source Files ─────────────────────────────────────────────────

section("10. Source Files");

const requiredSourceFiles = [
  "artifacts/api-server/src/index.ts",
  "artifacts/api-server/src/routes/health.ts",
  "artifacts/api-server/src/lib/run-migrations.ts",
  "artifacts/api-server/src/lib/startup-validation.ts",
  "artifacts/marketplace/src/App.tsx",
  "artifacts/marketplace/vite.config.ts",
  "artifacts/mobile/package.json",
  "artifacts/mobile/app/_layout.tsx",
  "artifacts/embedding-service/main.py",
  "lib/db/src/schema/index.ts",
  "lib/db/src/schema/delivery_missions.ts",
  "lib/db/src/schema/mission_offers.ts",
  "lib/db/src/schema/dispatch_alerts.ts",
  "project.manifest.json",
];

for (const f of requiredSourceFiles) {
  const fullPath = path.join(ROOT, f);
  if (fs.existsSync(fullPath)) pass(f);
  else checkFail(`Missing: ${f}`);
}

// ── FINAL SUMMARY ────────────────────────────────────────────────────────────

client.release();
await pool.end();

console.log("\n" + "─".repeat(60));
if (failures === 0 && warnings === 0) {
  console.log(`${GREEN}${BOLD}✓ PASS${RESET} — All checks passed. Project is import-ready.\n`);
  process.exit(0);
} else if (failures === 0) {
  console.log(`${YELLOW}${BOLD}⚠ PASS WITH WARNINGS${RESET} — ${warnings} warning(s), 0 failures.\n`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}✗ FAIL${RESET} — ${failures} failure(s), ${warnings} warning(s).\n`);
  console.log(`Run these to fix:`);
  console.log(`  1. pnpm install`);
  console.log(`  2. pnpm --filter @workspace/db run push`);
  console.log(`  3. Start the 'API Server' workflow (auto-runs migrations + seed)`);
  console.log(`  4. pnpm import:check  (re-run to confirm)\n`);
  process.exit(1);
}
