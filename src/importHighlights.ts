import type { IBatchBlock } from "@logseq/libs/dist/LSPlugin.user.js";
import { getOrCreateBlockInPage } from "@queries/getOrCreateBlockInPage.js";
import { getOrCreatePageByName } from "@queries/getOrCreatePage.js";
import type { LSBlockEntity, LogseqServiceClient } from "@services/logseq";
import { createCollectionUpdatedSinceGenerator } from "@services/raindrop";
import type { Raindrop } from "@types";
import {
  SETTING_ENUM,
  formatDateForSettings,
  importFilterOptions,
} from "@services/logseq";
import type { Result } from "true-myth";
import { err, ok } from "true-myth/result";
import { renderBookmark, renderHighlight } from "./bookmarks/rendering.js";

/**
 * Import highlights (and notes) for a single Raindrop as blocks underneath the
 * given block.
 *
 * @param raindrop Raindrop to import
 * @param logseqClient Logseq client to use
 * @param raindropBlock Block to put the highlights underneath
 */
const importHighlightsForRaindrop = async (
  raindrop: Raindrop,
  logseqClient: LogseqServiceClient,
  raindropBlock: LSBlockEntity
) => {
  const highlightTemplate = (await logseqClient.settings.get(
    SETTING_ENUM.highlightMustacheTemplate
  )) as string;
  const highlightsBlock = await logseqClient.createBlock(
    raindropBlock.uuid,
    `## Highlights`,
    { sibling: false, before: false }
  );
  if (!highlightsBlock) {
    throw new Error(
      "Failed to import pages, could not create block to put highlights into"
    );
  }

  const highlightBatch = raindrop.annotations.map(
    (a): IBatchBlock => ({
      content: renderHighlight(a, highlightTemplate),
    })
  );
  await logseqClient.createBlockBatch(highlightsBlock.uuid, highlightBatch, {
    before: true,
    sibling: false,
  });
};

/**
 * Import a single Raindrop as a block underneath OR before the given block,
 * depending on the value of `isFirstInsertion`.
 *
 * @param raindrop The Raindrop to import
 * @param logseqClient Logseq Client to use for inserting blocks
 * @param lastInsertedBlock The last block that was inserted
 * @param isFirstInsertion If this is the first block to be inserted. This affects the
 * insertion strategy (to maintain chronological order).
 * @returns A Result containing the block that was inserted, or an error if the
 * insertion failed.
 */
const importRaindrop = async (
  raindrop: Raindrop,
  logseqClient: LogseqServiceClient,
  lastInsertedBlock: LSBlockEntity,
  isFirstInsertion: boolean
): Promise<Result<LSBlockEntity, Error>> => {
  const userConfig = await logseqClient.getUserConfig();
  const bookmarkTemplate = (await logseqClient.settings.get(
    SETTING_ENUM.bookmarkMustacheTemplate
  )) as string;
  const articleBlock = await logseqClient.createBlock(
    lastInsertedBlock.uuid,
    renderBookmark(raindrop, userConfig, bookmarkTemplate),
    // We want to insert the FIRST block from the generator as the first child of
    // the "Articles" block.
    // However, every subsequent block should be inserted as a sibling of that
    // first block, and MUST be inserted before it to get a chronological order.
    // NOTE: THIS ASSUMES that the generator returns the blocks in reverse
    // chronological order (e.g. the most recently edited block is the LAST
    // element provided by the generator).
    { sibling: !isFirstInsertion, before: isFirstInsertion }
  );

  if (!articleBlock) {
    return err(
      new Error(
        "Failed to import pages, could not create block to put highlights into"
      )
    );
  }
  return ok(articleBlock);
};

/**
 * Returns true if the bookmark must not be inserted into the page, false otherwise.
 * @param bookmark The Raindrop bookmark to check
 * @param importFilter The user's selected import filter
 */
const shouldSkipBookmark = (bookmark: Raindrop, importFilter: unknown) =>
  importFilter === importFilterOptions.WITH_ANNOTATIONS &&
  bookmark.annotations.length === 0;

/**
 * Import all of the Raindrops provided by the generator as blocks underneath the
 * `parentBlock`.
 *
 * Inserts highlights as well, if each Raindrop has any.
 *
 * @param generator A generator that returns arrays of Raindrops to import.
 * @param logseqClient The Logseq Client to use for insertion, getting settings.
 * @param parentBlock The block to insert the Raindrops underneath.
 */
export const importRaindropsFromGenerator = async (
  generator: AsyncGenerator<Raindrop[]>,
  logseqClient: LogseqServiceClient,
  parentBlock: LSBlockEntity
) => {
  let lastInsertedBlock: LSBlockEntity = parentBlock;
  let isFirstInsertion = true;
  const { importFilter } = logseqClient.settings;

  for await (const raindropListWindow of generator) {
    await Promise.all(
      raindropListWindow.map(async (r) => {
        if (shouldSkipBookmark(r, importFilter)) {
          return Promise.resolve();
        }

        const importedBlockResult = await importRaindrop(
          r,
          logseqClient,
          lastInsertedBlock,
          isFirstInsertion
        );
        if (importedBlockResult.isErr) {
          return Promise.reject(importedBlockResult.error);
        }

        lastInsertedBlock = importedBlockResult.value;
        isFirstInsertion = false;

        if (r.annotations.length !== 0) {
          await importHighlightsForRaindrop(
            r,
            logseqClient,
            importedBlockResult.value
          );
          return;
        }
      })
    );
  }
  return Promise.resolve();
};

export const importHighlightsSinceLastSync = async (
  lastSync: Date,
  logseqClient: LogseqServiceClient,
  pageName: string
) => {
  const page = await getOrCreatePageByName(logseqClient, pageName);
  if (page.isErr) {
    throw new Error(
      "Failed to import pages, could not create page to put highlights into"
    );
  }

  // Get the block under which we import the page, and underneath that, the
  // highlights. This generally looks like `# Articles`, and is one of the first
  // children of the page.
  const articleListParentBlock = await getOrCreateBlockInPage(
    logseqClient,
    page.value.uuid,
    (block) => block.content === "# Articles",
    "# Articles"
  );
  if (articleListParentBlock.isErr) {
    throw new Error(
      "Failed to import pages, could not create block to put highlights into"
    );
  }

  const generator = createCollectionUpdatedSinceGenerator(lastSync);
  await importRaindropsFromGenerator(
    generator,
    logseqClient,
    articleListParentBlock.value
  );

  logseqClient.settings.set(
    "last_sync_timestamp",
    formatDateForSettings(new Date())
  );
};
