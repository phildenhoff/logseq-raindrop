import type { Maybe } from "true-myth";
import { just, nothing } from "true-myth/maybe";

import type {
  BlockEntity,
  BlockUUID,
  BlockUUIDTuple,
  EntityID,
  IEntityID,
} from "@logseq/libs/dist/LSPlugin.js";

import type { BlockMap, PageMap } from "./types.js";
import type { LSBlockEntity } from "@services/interfaces.js";

const updateBlockLeft = (
  sibling: boolean,
  before: boolean,
  blocksMap: BlockMap,
  pagesMap: PageMap,
  referenceBlockUuid: BlockUUID,
  newBlockIdentity: IEntityID
) => {
  const refIsPage = pagesMap.has(referenceBlockUuid);
  const refBlock = blocksMap.get(referenceBlockUuid);
  const refPage = pagesMap.get(referenceBlockUuid);
  const parentBlockOrPage = refIsPage ? refPage : refBlock;

  if (sibling && before && refBlock) {
    // We're able to mutate the objects in our map directly; we receive the
    // object by reference and not by copy.
    refBlock.left = newBlockIdentity;
  } else if (!sibling && before && parentBlockOrPage) {
    const maybeLeftmostChild = getLeftmostChild(
      (refIsPage ? refPage?.roots : refBlock?.children) ?? [],
      parentBlockOrPage.id,
      blocksMap
    );
    if (maybeLeftmostChild.isJust) {
      maybeLeftmostChild.value.left = newBlockIdentity;
    }
  }
};

const getLeftmostChild = (
  children: (BlockEntity | BlockUUIDTuple)[],
  parentBlockId: EntityID,
  blocksMap: BlockMap
): Maybe<LSBlockEntity> => {
  const result = children
    .map((item) => {
      if (Array.isArray(item)) {
        return blocksMap.get(item[1]);
      } else {
        return blocksMap.get(item.uuid);
      }
    })
    .filter((block) => block?.left.id === parentBlockId)
    .at(0);

  if (result) {
    return just(result);
  } else {
    return nothing();
  }
};

/**
 * Get the left and parent blocks for a new block, and mutate any relevant blocks
 * to point to the correct left block.
 *
 * @param sibling If true, insert as a sibling of the reference block. If false, insert as a child of the reference block.
 * @param before If true, insert before the reference block. If false, insert after the reference block.
 * @param blocksMap A map of UUIDs to blocks
 * @param pagesMap A map of UUIDs to pages
 * @param newBlockEntityId The id and uuid of the new block
 * @param referenceBlockUuid The uuid of the reference block, which we will insert
 * the new block relative to
 * @returns
 */
export const getLeftAndParentBlocksAndMutateBlocks = async (
  sibling: boolean,
  before: boolean,
  blocksMap: BlockMap,
  pagesMap: PageMap,
  newBlockEntityId: IEntityID,
  referenceBlockUuid: BlockUUID
): Promise<{ left: IEntityID; parent: IEntityID }> => {
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
      updateBlockLeft(
        sibling,
        before,
        blocksMap,
        pagesMap,
        referenceBlockUuid,
        newBlockEntityId
      );
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

      const maybeLeftmostChild = getLeftmostChild(
        (refIsPage ? refPage?.roots : refBlock?.children) ?? [],
        parentBlockOrPageIdentity.id,
        blocksMap
      );

      if (blockOptions?.before) {
        left = parentBlockOrPageIdentity;

        // update first child of parent to point to the new block
        updateBlockLeft(
          sibling,
          before,
          blocksMap,
          pagesMap,
          referenceBlockUuid,
          newBlockEntityId
        );
      } else {
        left = maybeLeftmostChild.isJust
          ? {
              id: maybeLeftmostChild.value.id,
              uuid: maybeLeftmostChild.value.uuid,
            }
          : parentBlockOrPageIdentity;
      }
    }
  }

  return { left: left!, parent: parent! };
};
