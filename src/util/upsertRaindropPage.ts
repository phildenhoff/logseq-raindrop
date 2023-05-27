import type { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin.js";
import type { Just } from "true-myth/maybe";
import { Maybe, nothing } from "true-myth/maybe";

import { findPagesByRaindropID } from "src/queries/getBlockBy.js";
import type { Annotation, Raindrop } from "@types";
import { alertDuplicatePageIdUsed } from "@util/notify.js";
import { formatRaindropToProperties } from "@util/pageFormatter.js";
import {
  filterBlocksWithProperty,
  filterBlocksWithPropertyField,
  someBlockHasProperty,
} from "@util/blocks.js";
import { settings } from "@util/settings.js";
import { applyAsyncFunc } from "@util/async.js";
import type {
  LSBlockEntity,
  LogseqServiceClient,
} from "src/services/interfaces.js";

const noAnnotationsProp = "noannotations";

/**
 * Create the name for a page using the Raindrop and any hierarchy.
 *
 * @param raindrop The Raindrop to create a name for
 * @param namespace A namespace to create pages in. If this string is empty,
 * no hierarchy is used.
 */
const generatePageName = (raindrop: Raindrop, namespace: string): string => {
  if (namespace.length === 0) {
    return raindrop.title;
  } else {
    return namespace + "/" + raindrop.title;
  }
};

const ioMaybeGetPageForRaindrop = async (
  r: Raindrop,
  logseqClient: LogseqServiceClient
): Promise<Maybe<PageEntity>> => {
  const pagesHavingId = (await findPagesByRaindropID(
    r.id,
    logseqClient
  )) as (PageEntity & Record<"createdAt", number>)[];

  if (pagesHavingId.length === 0) return nothing<PageEntity>();
  if (pagesHavingId.length > 1) alertDuplicatePageIdUsed(r);

  const sortedByAge = [...pagesHavingId].sort(
    (a, b) => a.createdAt - b.createdAt
  );
  const oldestPage = sortedByAge.at(0);

  return Maybe.of(oldestPage);
};

/**
 * Adds a new block (once) to let the user know that there are no annotations
 * to import for this raindrop.
 *
 * Only insert the paragraph if the noAnnotationsProp field is missing.
 * Sets that field every time.
 *
 * The property must be removed once there are annotations to import.
 */
const ioAddEmptyStateBlock = async (
  pageBlocks: LSBlockEntity[],
  pageUuid: string,
  logseqClient: LogseqServiceClient
) => {
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

const ioRemoveEmptyStateBlock = async (
  pageBlocks: LSBlockEntity[],
  logseqClient: LogseqServiceClient
) => {
  const pageBlocksWithProperties = pageBlocks.filter(
    (block): block is BlockEntity & { properties: Record<string, any> } =>
      "properties" in block
  );
  (
    await filterBlocksWithProperty(pageBlocksWithProperties, noAnnotationsProp)
  ).forEach(async (block) => {
    await logseqClient.deleteBlock(block.uuid);
  });
};

const ioCreateOrLoadPage = async (
  r: Raindrop,
  logseqClient: LogseqServiceClient
) => {
  const maybeExistingPage = await ioMaybeGetPageForRaindrop(r, logseqClient);
  const formattedRaindropProperties = formatRaindropToProperties(r, {
    tags: settings.default_page_tags(),
  });

  if (maybeExistingPage.isJust) {
    await logseqClient.openPageByName(maybeExistingPage.value.name);
  } else {
    await logseqClient.createPage(
      generatePageName(r, settings.namespace_label()),
      {},
      { createFirstBlock: true, redirect: true }
    );
  }

  const currentPage = await logseqClient.getFocusedPageOrBlock();
  if (!currentPage) throw new Error("No current page found");

  const propBlock =
    (await logseqClient.getBlockTreeForCurrentPage()).at(0) ||
    (await logseqClient.createBlock(currentPage.uuid, ""))!;
  await logseqClient.upsertPropertiesForBlock(
    propBlock.uuid,
    formattedRaindropProperties
  );
};

const ioAddOrRemoveEmptyState = async (
  r: Raindrop,
  pageBlocks: LSBlockEntity[],
  currentPage: PageEntity,
  logseqClient: LogseqServiceClient
) => {
  if (r.annotations.length === 0) {
    await ioAddEmptyStateBlock(pageBlocks, currentPage.uuid, logseqClient);
  } else {
    await ioRemoveEmptyStateBlock(pageBlocks, logseqClient);
  }
};

const ioCreateAnnotationBlock = async (
  annotation: Annotation,
  currentPage: PageEntity,
  logseqClient: LogseqServiceClient
): Promise<LSBlockEntity | null> => {
  const highlightFormatted = settings.formatting_template
    .highlight()
    .replace("{text}", annotation.text);
  const noteFormatted = settings.formatting_template
    .annotation()
    .replace("{text}", annotation.note);

  return await logseqClient.createBlock(
    currentPage.uuid,
    `${highlightFormatted}\n\n${noteFormatted}`,
    {
      properties: { "annotation-id": annotation.id },
      sibling: false,
      before: false,
    }
  );
};

const ioUpsertAnnotationBlocks = async (
  r: Raindrop,
  currentPage: PageEntity,
  logseqClient: LogseqServiceClient
): Promise<BlockEntity[]> => {
  const currentPageBlocksTree = await logseqClient.getBlockTreeForCurrentPage();
  const knownRaindropAnnotationIds = new Set(
    currentPageBlocksTree
      .map((block) => block?.properties?.annotationId ?? undefined)
      .filter((annotationId) => annotationId !== undefined)
  );

  const addedBlocks = await applyAsyncFunc(
    r.annotations,
    async (annotation) => {
      if (knownRaindropAnnotationIds.has(annotation.id))
        return Promise.resolve(nothing<BlockEntity>());
      return Maybe.of(
        await ioCreateAnnotationBlock(annotation, currentPage, logseqClient)
      );
    }
  );

  return addedBlocks
    .filter((item): item is Just<BlockEntity> => item.isJust)
    .map((item) => item.value);
};

export const upsertRaindropPage = async (
  fullRaindrop: Raindrop,
  logseqClient: LogseqServiceClient
) => {
  await ioCreateOrLoadPage(fullRaindrop, logseqClient);
  const pageBlocks = await logseqClient.getBlockTreeForCurrentPage();
  const currentPage = await logseqClient.getFocusedPageOrBlock();
  await ioAddOrRemoveEmptyState(
    fullRaindrop,
    pageBlocks,
    currentPage as PageEntity,
    logseqClient
  );
  await ioUpsertAnnotationBlocks(
    fullRaindrop,
    currentPage as PageEntity,
    logseqClient
  );
};
