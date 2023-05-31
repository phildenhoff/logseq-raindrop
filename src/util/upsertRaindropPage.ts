import type { Just } from "true-myth/maybe";
import { Maybe, nothing } from "true-myth/maybe";

import type { Annotation, Raindrop } from "@types";
import type {
  LSBlockEntity,
  LSPageEntity,
  LogseqServiceClient,
} from "src/services/interfaces.js";
import { findPagesByRaindropID } from "src/queries/getBlockBy.js";
import { alertDuplicatePageIdUsed } from "@util/notify.js";
import { formatRaindropToProperties } from "@util/pageFormatter.js";
import { applyAsyncFunc } from "@util/async.js";

import { generatePageName } from "./generatePageName.js";
import {
  ioAddEmptyStateBlock,
  ioRemoveEmptyStateBlock,
} from "src/services/logseq/emptyState.js";

export const ioMaybeGetPageForRaindrop = async (
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

export const ioCreateOrLoadPage = async (
  r: Raindrop,
  logseqClient: LogseqServiceClient
) => {
  const maybeExistingPage = await ioMaybeGetPageForRaindrop(r, logseqClient);
  const formattedRaindropProperties = formatRaindropToProperties(r, {
    tags: (await logseqClient.settings.get("default_page_tags")) as string,
  });

  if (maybeExistingPage.isJust) {
    await logseqClient.openPageByName(maybeExistingPage.value.name);
  } else {
    await logseqClient.createPage(
      generatePageName(
        r,
        (await logseqClient.settings.get("namespace_label")) as string
      ),
      formattedRaindropProperties,
      { createFirstBlock: true, redirect: true }
    );
  }
};

export const ioAddOrRemoveEmptyState = async (
  r: Raindrop,
  pageBlocks: LSBlockEntity[],
  currentPage: LSPageEntity,
  logseqClient: LogseqServiceClient
) => {
  if (r.annotations.length === 0) {
    await ioAddEmptyStateBlock(pageBlocks, currentPage.uuid, logseqClient);
  } else {
    await ioRemoveEmptyStateBlock(pageBlocks, logseqClient);
  }
};

export const ioCreateAnnotationBlock = async (
  annotation: Annotation,
  currentPage: LSPageEntity,
  logseqClient: LogseqServiceClient
): Promise<LSBlockEntity | null> => {
  const highlightFormatted = (
    (await logseqClient.settings.get("template_highlight")) as string
  ).replace("{text}", annotation.text);
  const noteFormatted = (
    (await logseqClient.settings.get("template_annotation")) as string
  ).replace("{text}", annotation.note);

  return logseqClient.createBlock(
    currentPage.uuid,
    `${highlightFormatted}\n\n${noteFormatted}`,
    {
      properties: { "annotation-id": annotation.id },
      sibling: false,
      before: false,
    }
  );
};

export const ioUpsertAnnotationBlocks = async (
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
  await ioAddOrRemoveEmptyState(
    fullRaindrop,
    pageBlocks,
    currentPage as LSPageEntity,
    logseqClient
  );
  await ioUpsertAnnotationBlocks(
    fullRaindrop,
    currentPage as LSPageEntity,
    logseqClient
  );
};
