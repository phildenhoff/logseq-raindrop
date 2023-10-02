import type { LSBlockEntity, LogseqServiceClient } from "../interfaces.js";

import {
  filterBlocksWithProperty,
  filterBlocksWithPropertyField,
  someBlockHasProperty,
} from "@util/blocks.js";

const noAnnotationsProp = "noannotations";

/**
 * Adds a new block (once) to let the user know that there are no annotations
 * to import for this raindrop.
 *
 * Only insert the paragraph if the noAnnotationsProp field is missing.
 * Sets that field every time.
 *
 * The property must be removed once there are annotations to import.
 */
export const ioAddEmptyStateBlock = async (
  pageBlocks: LSBlockEntity[],
  pageUuid: string,
  logseqClient: LogseqServiceClient
) => {
  if (!logseqClient.settings.emptyPageState) return;

  const blocksWithProperties = filterBlocksWithPropertyField(pageBlocks);
  const pageHasBlockWithNoAnnotationProp = await someBlockHasProperty(
    blocksWithProperties,
    noAnnotationsProp
  );
  if (!pageHasBlockWithNoAnnotationProp) {
    await logseqClient.createBlock(
      pageUuid,
      "There's nothing to import from Raindrop. Write some notes in Raindrop and sync this page again to bring the notes into Logseq. Don't delete this block. It will be automatically cleaned up by the Raindrop plugin.",
      {
        properties: { [noAnnotationsProp]: true },
        sibling: false,
        before: false,
      }
    );
    await logseqClient.exitEditMode();
  }
};

export const ioRemoveEmptyStateBlock = async (
  pageBlocks: LSBlockEntity[],
  logseqClient: LogseqServiceClient
) => {
  const pageBlocksWithProperties = pageBlocks.filter(
    (block): block is LSBlockEntity & { properties: Record<string, any> } =>
      "properties" in block
  );
  (
    await filterBlocksWithProperty(pageBlocksWithProperties, noAnnotationsProp)
  ).forEach(async (block) => {
    await logseqClient.deleteBlock(block.uuid);
  });
};
