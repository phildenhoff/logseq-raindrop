import type { Just } from "true-myth/maybe";
import { Maybe, nothing } from "true-myth/maybe";

import type { Annotation, Raindrop } from "@types";
import type {
  LSBlockEntity,
  LSPageEntity,
  LogseqServiceClient,
} from "src/services/interfaces.js";
import { findPagesByRaindropID } from "src/queries/getBlockBy.js";
import { formatRaindropToProperties } from "@util/pageFormatter.js";
import { applyAsyncFunc } from "@util/async.js";

import { generatePageName } from "./util/generatePageName.js";
import {
  ioAddEmptyStateBlock,
  ioRemoveEmptyStateBlock,
} from "@services/logseq/emptyState.js";

const alertDuplicatePageIdUsed = (r: Raindrop, client: LogseqServiceClient) => {
  client.displayMessage(
    `You have duplicate pages for this article: \n${r.title}.\n\nWe'll use the oldest one, but you should merge these pages.`,
    "warning",
    { key: r.id, timeoutMs: 5000 }
  );
};

const ioMaybeGetPageForRaindrop = async (
  r: Raindrop,
  logseqClient: LogseqServiceClient
): Promise<Maybe<LSPageEntity>> => {
  const pagesHavingId = (await findPagesByRaindropID(
    r.id,
    logseqClient
  )) as (LSPageEntity & Record<"createdAt", number>)[];

  if (pagesHavingId.length === 0) return nothing<LSPageEntity>();
  if (pagesHavingId.length > 1) alertDuplicatePageIdUsed(r, logseqClient);

  const sortedByAge = [...pagesHavingId].sort(
    (a, b) => a.createdAt - b.createdAt
  );
  const oldestPage = sortedByAge.at(0);

  return Maybe.of(oldestPage);
};

const ioCreateOrLoadPage = async (
  r: Raindrop,
  logseqClient: LogseqServiceClient
) => {
  const maybeExistingPage = await ioMaybeGetPageForRaindrop(r, logseqClient);
  const formattedRaindropProperties = formatRaindropToProperties(r, {
    tags: logseqClient.settings.defaultPageTags,
  });

  if (maybeExistingPage.isJust) {
    await logseqClient.openPageByName(maybeExistingPage.value.name);
  } else {
    await logseqClient.createPage(
      generatePageName(r, logseqClient.settings.namespaceLabel),
      formattedRaindropProperties,
      { createFirstBlock: true, redirect: true }
    );
  }
};

const ioCreateAnnotationBlock = async (
  annotation: Annotation,
  currentPage: LSPageEntity,
  logseqClient: LogseqServiceClient
): Promise<LSBlockEntity | null> => {
  const highlightFormatted = logseqClient.settings.templateHighlight.replace(
    "{text}",
    annotation.text
  );
  const noteFormatted = logseqClient.settings.templateAnnotation.replace(
    "{text}",
    annotation.note
  );

  const template = `${highlightFormatted}\n\n${noteFormatted}`;

  return logseqClient.createBlock(currentPage.uuid, template, {
    properties: { "annotation-id": annotation.id },
    sibling: false,
    before: false,
  });
};

const ioUpsertAnnotationBlocks = async (
  r: Raindrop,
  currentPage: LSPageEntity,
  logseqClient: LogseqServiceClient
): Promise<LSBlockEntity[]> => {
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
        return Promise.resolve(nothing<LSBlockEntity>());
      return Maybe.of(
        await ioCreateAnnotationBlock(annotation, currentPage, logseqClient)
      );
    }
  );

  return addedBlocks
    .filter((item): item is Just<LSBlockEntity> => item.isJust)
    .map((item) => item.value);
};

export const upsertRaindropPage = async (
  fullRaindrop: Raindrop,
  logseqClient: LogseqServiceClient
) => {
  await ioCreateOrLoadPage(fullRaindrop, logseqClient);
  const pageBlocks = await logseqClient.getBlockTreeForCurrentPage();
  const currentPage = await logseqClient.getFocusedPageOrBlock();

  if (!currentPage) throw new Error("Could not get current page");

  if (fullRaindrop.annotations.length === 0) {
    await ioAddEmptyStateBlock(pageBlocks, currentPage.uuid, logseqClient);
  } else {
    await ioRemoveEmptyStateBlock(pageBlocks, logseqClient);
  }

  await ioUpsertAnnotationBlocks(
    fullRaindrop,
    currentPage as LSPageEntity,
    logseqClient
  );
};

/**
 * Exported for testing purposes only.
 * If you are not writing the tests for this module, do not use this.
 */
export const __TESTING = {
  ioMaybeGetPageForRaindrop,
  ioCreateOrLoadPage,
  ioCreateAnnotationBlock,
  ioUpsertAnnotationBlocks,
};
