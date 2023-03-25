import type { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin.js";
import type { Just } from "true-myth/maybe";
import { Maybe, just, nothing } from "true-myth/maybe";

import { findPagesByRaindropID } from "@queries/getBlockBy.js";
import type { Annotation, Raindrop } from "@types";
import { alertDuplicatePageIdUsed } from "@util/notify.js";
import { formatRaindropToProperties } from "@util/pageFormatter.js";
import {
  filterBlocksWithProperty,
  someBlockHasProperty,
  upsertBlockProperties,
} from "@util/blocks.js";
import { settings } from "@util/settings.js";
import { applyAsyncFunc } from "@util/async.js";
import { raindropTransformer } from "@util/raindropTransformer.js";

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
  r: Raindrop
): Promise<Maybe<PageEntity>> => {
  const pagesHavingId = (await findPagesByRaindropID(r.id)) as (PageEntity &
    Record<"createdAt", number>)[];

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
  pageBlocks: BlockEntity[],
  pageUuid: string
) => {
  const pageHasBlockWithNoAnnotationProp = await someBlockHasProperty(
    pageBlocks,
    noAnnotationsProp
  );
  if (!pageHasBlockWithNoAnnotationProp) {
    await logseq.Editor.appendBlockInPage(
      pageUuid,
      "There's nothing to import from Raindrop. Write some notes in Raindrop and sync this page again to bring the notes into Logseq. Don't delete this block. It will be automatically cleaned up by the Raindrop plugin.",
      { properties: { [noAnnotationsProp]: true } }
    );
    logseq.Editor.exitEditingMode();
  }
};

const ioRemoveEmptyStateBlock = async (pageBlocks: BlockEntity[]) => {
  (await filterBlocksWithProperty(pageBlocks, noAnnotationsProp)).forEach(
    async (block) => {
      await logseq.Editor.removeBlock(block.uuid);
    }
  );
};

const ioCreateOrLoadPage = async (r: Raindrop) => {
  const maybeExistingPage = await ioMaybeGetPageForRaindrop(r);
  const formattedRaindropProperties = formatRaindropToProperties(r, {
    tags: settings.default_page_tags(),
  });

  if (maybeExistingPage.isJust) {
    logseq.App.pushState("page", { name: maybeExistingPage.value.name });
  } else {
    await logseq.Editor.createPage(
      generatePageName(r, settings.namespace_label()),
      {},
      { createFirstBlock: true, redirect: true }
    );
  }

  const currentPage = await logseq.Editor.getCurrentPage();
  if (!currentPage) throw new Error("No current page found");

  const propBlock =
    (await logseq.Editor.getCurrentPageBlocksTree()).at(0) ||
    (await logseq.Editor.insertBlock(currentPage.uuid, ""))!;
  await upsertBlockProperties(propBlock, formattedRaindropProperties);
};

const ioAddOrRemoveEmptyState = async (
  r: Raindrop,
  pageBlocks: BlockEntity[],
  currentPage: PageEntity
) => {
  if (r.annotations.length === 0) {
    ioAddEmptyStateBlock(pageBlocks, currentPage.uuid);
  } else {
    ioRemoveEmptyStateBlock(pageBlocks);
  }
};

const ioCreateAnnotationBlock = async (
  annotation: Annotation,
  currentPage: PageEntity
): Promise<BlockEntity> => {
  const highlightFormatted = settings.formatting_template
    .highlight()
    .replace("{text}", annotation.text);
  const noteFormatted = settings.formatting_template
    .annotation()
    .replace("{text}", annotation.note);

  // We're asserting this here because the docs online indicate that
  // appendBlockInPage returns a non-nullable Promise<BlockEntity>, so
  // I'm going to assume that the type definition is wrong.
  return (await logseq.Editor.appendBlockInPage(
    currentPage.uuid,
    `${highlightFormatted}\n\n${noteFormatted}`,
    { properties: { "annotation-id": annotation.id } }
  ))!;
};

const upsertAnnotationBlocks = async (
  r: Raindrop,
  currentPage: PageEntity
): Promise<BlockEntity[]> => {
  const currentPageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree();
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
      return Maybe.of(await ioCreateAnnotationBlock(annotation, currentPage));
    }
  );

  return addedBlocks
    .filter((item): item is Just<BlockEntity> => item.isJust)
    .map((item) => item.value);
};

const getSingleRaindrop = async (id: Raindrop["id"]) => {
  try {
    return await fetch(`https://api.raindrop.io/rest/v1/raindrop/${id}`, {
      method: "GET",
      headers: new Headers({
        Authorization: `Bearer ${settings.access_token()}`,
        "Content-Type": "application/json",
      }),
    })
      .then((res) => {
        if (res.status !== 200) {
          throw new Error("Request not successful");
        }

        return res;
      })
      .then((res) => res.json())
      .then((parsed) => raindropTransformer(parsed["item"]))
      .then((transformed) => just(transformed));
  } catch {
    return nothing();
  }
};

export const upsertRaindropPage = async (r: Raindrop) => {
  const maybeRaindrop = await getSingleRaindrop(r.id);

  if (maybeRaindrop.isJust) {
    const fullRaindrop = maybeRaindrop.value;
    await ioCreateOrLoadPage(fullRaindrop);
    const pageBlocks = await logseq.Editor.getCurrentPageBlocksTree();
    const currentPage = await logseq.Editor.getCurrentPage();
    await ioAddOrRemoveEmptyState(
      fullRaindrop,
      pageBlocks,
      currentPage as PageEntity
    );
    await upsertAnnotationBlocks(fullRaindrop, currentPage as PageEntity);
  } else {
    logseq.UI.showMsg(
      "Error while trying to receive content from Raindrop API",
      "error"
    );
  }
};
