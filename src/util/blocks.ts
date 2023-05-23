import type { BlockEntity } from "@logseq/libs/dist/LSPlugin.js";

import { applyAsyncFunc } from "@util/async.js";

const stringMatchesPropertyName = (text: string, propertyName: string) =>
  propertyName.toLowerCase() === text.toLowerCase();

export const blockHasProperty = async (
  block: BlockEntity,
  property: string
): Promise<boolean> => {
  const blockProps = (await logseq.Editor.getBlockProperties(block.uuid)) || [];
  const hasProp = Object.entries(blockProps).some(([name, _value]) =>
    stringMatchesPropertyName(property, name)
  );

  return hasProp;
};

export const someBlockHasProperty = async (
  blocks: BlockEntity[],
  property: string
): Promise<boolean> => {
  const blockHasThisProp = async (block: BlockEntity) =>
    await blockHasProperty(block, property);
  const appliedBlocksHaveProp = await applyAsyncFunc(blocks, blockHasThisProp);
  return appliedBlocksHaveProp.some((value) => value);
};

export const filterBlocksWithProperty = async (
  blocks: BlockEntity[],
  property: string
): Promise<BlockEntity[]> => {
  /**
   * A tuple containing a block and whether or not that block has that
   * provided property.
   */
  const blockAndBlockHasProp = async (
    block: BlockEntity
  ): Promise<[BlockEntity, boolean]> => [
    block,
    await blockHasProperty(block, property),
  ];

  const appliedBlockHasProperty = await applyAsyncFunc(
    blocks,
    blockAndBlockHasProp
  );

  return appliedBlockHasProperty
    .filter(([, hasProp]) => hasProp)
    .map(([block]) => block);
};
