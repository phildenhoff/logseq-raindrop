import type { Result } from "true-myth";
import { err, ok } from "true-myth/result";

import type {
  LSPageEntity,
  LogseqServiceClient,
} from "@services/interfaces.js";

export const getOrCreatePageByName = async (
  logseqClient: LogseqServiceClient,
  pageName: string
): Promise<Result<LSPageEntity, Error>> => {
  const page = await logseqClient.getPageByName(pageName);
  if (page) return ok(page);

  const createdPage = await logseqClient.createPage(
    pageName,
    {},
    { createFirstBlock: false }
  );
  if (createdPage) return ok(createdPage);

  return err(new Error("Failed to create page"));
};
