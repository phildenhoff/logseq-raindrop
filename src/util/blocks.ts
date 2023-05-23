import type { BlockEntity } from "@logseq/libs/dist/LSPlugin.js";

import { applyAsyncFunc } from "@util/async.js";

type BlockWithProperties = BlockEntity &
  Required<Pick<BlockEntity, "properties">>;

// @ts-ignore We require logseq to be undefined here to prevent
// using it in the wrong context.
const logseq = null;

const stringMatchesPropertyName = (text: string, propertyName: string) =>
  propertyName.toLowerCase() === text.toLowerCase();

export const blockHasProperty = async (
  block: BlockWithProperties,
  property: string
): Promise<boolean> => {
  const hasProp = Object.entries(block.properties).some(([name, _value]) =>
    stringMatchesPropertyName(property, name)
  );

  return hasProp;
};

export const someBlockHasProperty = async (
  blocks: BlockWithProperties[],
  property: string
): Promise<boolean> => {
  const blockHasThisProp = async (block: BlockWithProperties) =>
    await blockHasProperty(block, property);

  const appliedBlocksHaveProp = await applyAsyncFunc(blocks, blockHasThisProp);
  return appliedBlocksHaveProp.some((value) => value);
};

export const filterBlocksWithProperty = async (
  blocks: BlockWithProperties[],
  property: string
): Promise<BlockEntity[]> => {
  /**
   * A tuple containing a block and whether or not that block has that
   * provided property.
   */
  const blockAndBlockHasProp = async (
    block: BlockWithProperties
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
