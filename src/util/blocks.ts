import type { LSBlockEntity } from "@services/logseq";

import { applyAsyncFunc } from "@util/async.js";

type BlockWithProperties = LSBlockEntity &
  Required<Pick<LSBlockEntity, "properties">>;

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
): Promise<LSBlockEntity[]> => {
  /**
   * A tuple containing a block and whether or not that block has that
   * provided property.
   */
  const blockAndBlockHasProp = async (
    block: BlockWithProperties
  ): Promise<[LSBlockEntity, boolean]> => [
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

export const filterBlocksWithPropertyField = (blocks: LSBlockEntity[]) =>
  blocks.filter((block): block is BlockWithProperties => "properties" in block);
