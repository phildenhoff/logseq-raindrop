import type { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin";
import type { ID } from "@types";
import { uniqueBy } from "@util/unique";

const findPagesByProperty =
  (propertyName: string): ((propertyValue: string) => Promise<PageEntity[]>) =>
  async (propertyValue) => {
    // Searching for pages by page-properties is really broken in Logseq right
    // now. If you've recently added a page and haven't re-indexed, a
    // page-property query likely won't return that page. At the same time,
    // later, searching for a _block_ by a property won't always return it,
    // especially if logseq has now figured out it's a page-property block. So,
    // to reliably get pages by page-properties, we need to do two things:
    //
    // 1. Get recently added pages by finding blocks that have a matching
    // property ID and then getting that block's page. We'll need to de-dupe
    // pages just in case there is more than one block on a page with that ID.
    // Unlikely, but it could happen.
    // 2. Get properly indexed pages using page-property.
    //
    // We'll then return a combined set of de-duplicated pages.
    //
    // For more info on how page-property is broken, see this PR
    // https://github.com/logseq/logseq/issues/5445

    const blocks: BlockEntity[] = await logseq.DB.q(
      `(property ${propertyName} ${propertyValue})`
    );
    const pagesOfBlocks = await Promise.all(
      blocks.map(async (block) => await logseq.Editor.getPage(block.page.id))
    );

    const pagesByPageProperty: PageEntity[] = await logseq.DB.q(
      `(page-property ${propertyName} ${propertyValue})`
    );

    const uniquePages = uniqueBy("id", [
      ...pagesByPageProperty,
      ...pagesOfBlocks,
    ]);
    return [...uniquePages];
  };

export const findPagesByRaindropID = async (id: ID): Promise<PageEntity[]> => {
  return findPagesByProperty("raindrop-id")(id.toString());
};
