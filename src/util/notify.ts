import type { Raindrop } from "@types";
import type { LogseqServiceClient } from "src/services/interfaces.js";
export const alertDuplicatePageIdUsed = (
  r: Raindrop,
  client: LogseqServiceClient
) => {
  client.displayMessage(
    `You have duplicate pages for this article: \n${r.title}.\n\nWe'll use the oldest one, but you should merge these pages.`,
    "warning",
    { key: r.id, timeout: 5000 }
  );
};
