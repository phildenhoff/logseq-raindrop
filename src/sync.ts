import type { LogseqServiceClient } from "@services/interfaces.js";

import { importHighlightsSinceLastSync } from "./importHighlights.js";

export const startSync = (logseqClient: LogseqServiceClient): (() => void) => {
  // Do nothing if sync is disabled
  if (!logseqClient.settings.syncToSinglePage) return () => {};

  const intervalMinutes = logseqClient.settings.syncInterval;
  const pageName = logseqClient.settings.pageName;
  const lastSyncDate = logseqClient.settings.lastSyncTimestamp;

  const syncIntervalId = setInterval(async () => {
    importHighlightsSinceLastSync(lastSyncDate, logseqClient, pageName);
  }, intervalMinutes * 1000 * 60);

  return () => clearInterval(syncIntervalId);
};
