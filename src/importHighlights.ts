import type { IBatchBlock } from "@logseq/libs/dist/LSPlugin.user.js";
import { getOrCreateBlockInPage } from "@queries/getOrCreateBlockInPage.js";
import { getOrCreatePageByName } from "@queries/getOrCreatePage.js";
import type {
  LSBlockEntity,
  LogseqServiceClient,
} from "@services/interfaces.js";
import { formatDateForSettings } from "@services/logseq/formatting.js";
import { createCollectionUpdatedSinceGenerator } from "@services/raindrop/collection.js";
import type { Raindrop } from "@types";
import { importFilterOptions } from "@util/settings.js";
import type { Result } from "true-myth";
import { err, ok } from "true-myth/result";

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
      content: [`> ${a.text}`, "", `${a.note}`].join("\n"),
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
  const articleBlock = await logseqClient.createBlock(
    lastInsertedBlock.uuid,
    `[${raindrop.title}](${raindrop.url})
        title:: ${raindrop.title}
        url:: ${raindrop.url}
        Tags:: ${raindrop.tags.join(", ")}
        `,
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
  const importFilter = await logseqClient.settings.get("import_filter");

  for await (const raindropListWindow of generator) {
    raindropListWindow.forEach(async (r) => {
      if (
        importFilter === importFilterOptions.WITH_ANNOTATIONS &&
        r.annotations.length === 0
      ) {
        return;
      }

      const importedBlockResult = await importRaindrop(
        r,
        logseqClient,
        lastInsertedBlock,
        isFirstInsertion
      );
      if (importedBlockResult.isErr) {
        throw importedBlockResult.error;
      }

      lastInsertedBlock = importedBlockResult.value;
      isFirstInsertion = false;

      if (r.annotations.length !== 0) {
        importHighlightsForRaindrop(r, logseqClient, importedBlockResult.value);
      }
    });
  }
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
