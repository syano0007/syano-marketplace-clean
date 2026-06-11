import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { logger } from "./logger";

// ─── PERMANENT TEST ACCOUNTS ─────────────────────────────────────────────────
// These accounts must ALWAYS exist for development, QA, and recovery testing.
// They are auto-created and self-healing, exactly like bootstrapRootAdmin().
// Passwords default to 00Amer00 unless overridden by env vars.

interface TestAccountSpec {
  email: string;
  name: string;
  role: "seller" | "courier" | "customer" | "admin";
  phone: string | null;
  envPasswordVar: string;
  defaultPassword: string;
}

const TEST_ACCOUNTS: TestAccountSpec[] = [
  {
    email: "delewatiamer8@gmail.com",
    name: "Test Seller",
    role: "seller",
    phone: null,
    envPasswordVar: "TEST_SELLER_PASSWORD",
    defaultPassword: "00Amer00",
  },
  {
    email: "delewatiamer9@gmail.com",
    name: "Test Courier",
    role: "courier",
    phone: null,
    envPasswordVar: "TEST_COURIER_PASSWORD",
    defaultPassword: "00Amer00",
  },
];

/**
 * Ensures all permanent test accounts exist and are healthy.
 * Runs on every server startup. Idempotent and safe to re-run.
 *
 * For each account guarantees:
 *   - email matches spec
 *   - role matches spec
 *   - account_status = active
 *   - is_verified = true
 *   - password matches env var (default: 00Amer00)
 *
 * Never creates duplicates. Never overwrites a valid password.
 * Survives schema restores and migration runs.
 */
export async function bootstrapTestAccounts(): Promise<void> {
  for (const spec of TEST_ACCOUNTS) {
    const password = process.env[spec.envPasswordVar] ?? spec.defaultPassword;

    try {
      const [existing] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, spec.email))
        .limit(1);

      if (!existing) {
        // Account missing — create it
        const passwordHash = await bcrypt.hash(password, 12);
        await db.insert(usersTable).values({
          email: spec.email,
          phone: spec.phone,
          passwordHash,
          name: spec.name,
          role: spec.role,
          isVerified: true,
          accountStatus: "active",
        } as any);
        logger.info(
          { email: spec.email, role: spec.role },
          `Test account bootstrapped (created): ${spec.name}`
        );
      } else {
        // Account exists — repair any drift
        const patch: Partial<typeof usersTable.$inferInsert> = {};
        const repairs: string[] = [];

        if (existing.role !== spec.role) {
          patch.role = spec.role;
          repairs.push(`role→${spec.role}`);
        }
        if (existing.accountStatus !== "active") {
          patch.accountStatus = "active";
          repairs.push("accountStatus→active");
        }
        if (!existing.isVerified) {
          patch.isVerified = true;
          repairs.push("isVerified→true");
        }

        // Only reset password if it is empty/invalid
        const hashValid =
          existing.passwordHash.length > 0 &&
          (await bcrypt.compare(password, existing.passwordHash));
        if (!hashValid) {
          patch.passwordHash = await bcrypt.hash(password, 12);
          repairs.push("passwordHash regenerated");
        }

        if (Object.keys(patch).length > 0) {
          await db
            .update(usersTable)
            .set(patch)
            .where(eq(usersTable.email, spec.email));
          logger.info(
            { email: spec.email, repairs },
            `Test account repaired: ${spec.name}`
          );
        } else {
          logger.info(
            { email: spec.email },
            `Test account healthy: ${spec.name}`
          );
        }
      }
    } catch (err) {
      // Non-fatal — log and continue so other accounts still bootstrap
      logger.error(
        { email: spec.email, err },
        `Failed to bootstrap test account: ${spec.name}`
      );
    }
  }
}
