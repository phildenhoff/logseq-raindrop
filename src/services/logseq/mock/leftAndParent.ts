import type { BlockUUID, IEntityID } from "@logseq/libs/dist/LSPlugin.js";
import type { BlockMap, PageMap } from "./types.js";

export const getLeftAndParentBlocksAndMutateBlocks = async (
  sibling: boolean,
  before: boolean,
  blocksMap: BlockMap,
  pagesMap: PageMap,
  newBlockEntityId: IEntityID,
  referenceBlockUuid: BlockUUID
): Promise<{ left: IEntityID; parent: IEntityID }> => {
  const { id: generatedId, uuid: generatedUuid } = newBlockEntityId;
  const blockOptions = {
    sibling,
    before,
  };
  const refIsPage = pagesMap.has(referenceBlockUuid);
  const refBlock = blocksMap.get(referenceBlockUuid);
  const refPage = pagesMap.get(referenceBlockUuid);
  const refPageEntityId: IEntityID | null = refPage
    ? {
        id: refPage.id,
        uuid: refPage.uuid,
      }
    : null;

  let parent: IEntityID | null = null;
  let left: IEntityID | null = null;

  if (blockOptions?.sibling) {
    parent = refBlock ? refBlock.parent : refPageEntityId!;
    if (blockOptions?.before) {
      // inserted before the reference block, under the same parent
      left = refBlock ? refBlock.left : refPageEntityId!;
      // Update refBlock, if it exists, to point to the new block
      if (refBlock) {
        // We're able to mutate the objects in our map directly; we receive the
        // object by reference and not by copy.
        refBlock.left = {
          id: generatedId,
          uuid: generatedUuid,
        };
      }
    } else {
      // insert after the reference block, under the same parent
      left = refBlock
        ? { id: refBlock.id, uuid: refBlock.uuid }
        : refPageEntityId!;
    }
  } else {
    const parentBlockOrPage = refIsPage ? refPage : refBlock;
    if (parentBlockOrPage) {
      const parentBlockOrPageIdentity = {
        id: parentBlockOrPage?.id,
        uuid: parentBlockOrPage?.uuid,
      };
      parent = parentBlockOrPageIdentity;

      const firstChild = (
        (refIsPage ? refPage?.roots : refBlock?.children) ?? []
      )
        .map((item) => {
          const block = Array.isArray(item)
            ? blocksMap.get(item[1])
            : blocksMap.get(item.uuid);
          return block;
        })
        .filter((block) => {
          return block?.left.id === parentBlockOrPage.id;
        })
        .at(0);

      if (blockOptions?.before) {
        left = parentBlockOrPageIdentity;

        // update first child of parent to point to the new block
        if (firstChild) {
          firstChild.left = {
            id: generatedId,
            uuid: generatedUuid,
          };
        }
      } else {
        left = firstChild
          ? { id: firstChild?.id, uuid: firstChild?.uuid }
          : parentBlockOrPageIdentity;
      }
    }
  }

  return { left: left!, parent: parent! };
};
