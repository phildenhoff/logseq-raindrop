import type { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin";
import { findPagesByRaindropID } from "../../src/queries/getBlockBy";
import Maybe, { nothing } from "true-myth/maybe";

import type { Raindrop } from "./Raindrop";
import { alertDuplicatePageIdUsed } from "./notify";
import { formatRaindropToProperties } from "./pageFormatter";
import { filterBlocksWithProperty, someBlockHasProperty } from "./blocks";

const noAnnotationsProp = "noannotations";
// TODO: Make this a preference
// TODO: Update page names from one prefix to the next? maybe?
const logseqRaindropPrefix = "logseq-raindrop/";

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
 * Async function to apply provided properties to a page.
 *
 * To get the Page's properties block, use getCurrentPageBlocksTree and take
 * the first item from the array.
 */
const ioApplyPropertiesToPage = (
  pagePropertiesBlock: BlockEntity,
  properties: Record<string, string>
): Promise<void[]> =>
  Promise.all(
    Object.entries(properties).map(([property, value]) =>
      logseq.Editor.upsertBlockProperty(
        pagePropertiesBlock.uuid,
        property,
        value
      )
    )
  );

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
  const formattedRaindropProperties = formatRaindropToProperties(r);

  if (maybeExistingPage.isJust) {
    logseq.App.pushState("page", { name: maybeExistingPage.value.name });
    const pagePropertiesBlock = (
      await logseq.Editor.getCurrentPageBlocksTree()
    ).at(0);
    ioApplyPropertiesToPage(pagePropertiesBlock, formattedRaindropProperties);
  } else {
    logseq.Editor.createPage(
      logseqRaindropPrefix + r.title,
      formattedRaindropProperties,
      { redirect: true }
    );
  }
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

const upsertAnnotationBlocks = async (
  r: Raindrop,
  currentPage: PageEntity
): Promise<BlockEntity[]> => {
  return [];
};

export const upsertRaindropPage = async (r: Raindrop) => {
  await ioCreateOrLoadPage(r);
  const pageBlocks = await logseq.Editor.getCurrentPageBlocksTree();
  const currentPage = await logseq.Editor.getCurrentPage();
  await ioAddOrRemoveEmptyState(r, pageBlocks, currentPage as PageEntity);
  await upsertAnnotationBlocks(r, currentPage as PageEntity);
};
