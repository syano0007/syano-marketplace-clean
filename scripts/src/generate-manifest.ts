/**
 * SYANO Manifest Generator
 *
 * Usage: pnpm manifest:generate
 *
 * Refreshes project.manifest.json with live database counts.
 * The static fields (versions, roadmap, stack) are preserved from the existing manifest.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../");

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env["DATABASE_URL"]! });

const client = await pool.connect();

const tableRes = await client.query<{ count: string }>(
  `SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`
);
const tableCount = parseInt(tableRes.rows[0]?.count ?? "0", 10);

const productRes = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM products`);
const productCount = parseInt(productRes.rows[0]?.count ?? "0", 10);

client.release();
await pool.end();

// Load existing manifest to preserve static fields
const manifestPath = path.join(ROOT, "project.manifest.json");
const existing = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

// Update only the live data fields
const updated = {
  ...existing,
  lastVerified: new Date().toISOString().slice(0, 10),
  database: {
    ...existing.database,
    tables:   tableCount,
    products: productCount,
  },
};

fs.writeFileSync(manifestPath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
console.log(`✓ project.manifest.json updated: ${tableCount} tables, ${productCount} products`);
