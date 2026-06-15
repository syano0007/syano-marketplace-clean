import app from "./app";
import { logger } from "./lib/logger";
import { runSearchStartup } from "./lib/search-startup";
import { runMigrations } from "./lib/run-migrations";
import { bootstrapRootAdmin } from "./lib/bootstrap-admin";
import { bootstrapTestAccounts } from "./lib/bootstrap-test-accounts";
import { bootstrapDemoMarketplaceData } from "./lib/bootstrap-demo-data";
import { runEmbeddingBackfill } from "./scripts/generateEmbeddings";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

(async () => {
  await runMigrations();
  await runSearchStartup();
  await bootstrapRootAdmin();
  await bootstrapTestAccounts();
  await bootstrapDemoMarketplaceData();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");

    // Non-blocking: generate embeddings for products that don't have them yet.
    // Runs after the server is already listening so it never delays startup.
    runEmbeddingBackfill().catch((err) =>
      logger.error({ err }, "[embeddings] Backfill error"),
    );
  });
})();
