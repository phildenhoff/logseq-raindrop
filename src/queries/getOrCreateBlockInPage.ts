import type { LSBlockEntity, LogseqServiceClient } from "@services/logseq";
import type { Result } from "true-myth";
import { ok, err } from "true-myth/result";

/**
 * Returns the first block in a page identified by `pageUuid` that matches
 * `matcher`. If not block matches, a new block is created.
 * @param logseqClient Client for interacting with Logseq.
 * @param pageUuid UUID of the page to search.
 * @param matcher Function that returns true if the block is returnable.
 * @param newBlockContent Content for the new block, if none match.
 * @returns A Promise that resolves to the created block, or an error if a block
 * could not be created.
 */
export const getOrCreateBlockInPage = async (
  logseqClient: LogseqServiceClient,
  pageUuid: string,
  matcher: (block: LSBlockEntity) => boolean,
  newBlockContent: string
): Promise<Result<LSBlockEntity, Error>> => {
  const pageBlockTree = await logseqClient.getBlockTreeForPage(pageUuid);
  const block = pageBlockTree.find(matcher);
  if (block) return ok(block);

  const createdBlock = await logseqClient.createBlock(
    pageUuid,
    newBlockContent,
    {
      sibling: true,
      before: false,
    }
  );
  if (createdBlock) return ok(createdBlock);

  return err(new Error("Failed to create block"));
};
