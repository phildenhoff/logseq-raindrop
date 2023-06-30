import type { LogseqServiceClient } from "@services/interfaces.js";
import { settings } from "@util/settings.js";
import { importHighlightsSinceLastSync } from "./importHighlights.js";

export const startSync = (logseqClient: LogseqServiceClient): (() => void) => {
  // Do nothing if sync is disabled
  if (!settings.sync_to_single_page) return () => {};

  const intervalMinutes = settings.sync_interval();
  const pageName = settings.page_name();
  const lastSyncDate = settings.last_sync_timestamp();

  const syncIntervalId = setInterval(async () => {
    importHighlightsSinceLastSync(lastSyncDate, logseqClient, pageName);
  }, intervalMinutes * 1000 * 60);

  return () => clearInterval(syncIntervalId);
};
