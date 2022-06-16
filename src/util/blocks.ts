import type { BlockEntity } from "@logseq/libs/dist/LSPlugin";
import { applyAsyncFunc } from "./async";

const stringMatchesPropertyName = (text: string, propertyName: string) =>
  propertyName.toLowerCase() === text.toLowerCase();

/*
 * We have to use this because `upsertBlockProperty` and `updateBlock` both
 * seem to have broken behaviour.
 *
 * 1. `upsertBlockProperty` doesn't actually seem to update the rendered
 * content of the block. It also doesn't seem to update what is searchable via
 * queries.
 * 2. `updateBlock` doesn't apply properties if the `content` is empty (??).
 *
 */
const generateBlockPropertyContent = (
  properties: Record<string, string>
): string =>
  Object.entries(properties)
    .map(([key, value]) => `${key}:: ${value}`)
    .join("\n");

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

export const upsertBlockProperties = async (
  block: BlockEntity,
  properties: Record<string, string>
): Promise<void> => {
  await applyAsyncFunc(
    Object.entries(properties),
    async ([key, value]) =>
      await logseq.Editor.upsertBlockProperty(block.uuid, key, value)
  );

  // We have to reset the content of the block to be the properties content
  // so that logseq actually indexes the block. Fun stuff!
  const currentContent = (await logseq.Editor.getBlock(block.uuid)).content;
  const currentProps: Record<string, string> = (await logseq.Editor.getBlockProperties(block.uuid));

  await logseq.Editor.updateBlock(block.uuid, "Updating raindrop props...", {properties: currentProps});
  await logseq.Editor.updateBlock(block.uuid, currentContent, {properties: currentProps});

  return;
};

export const upsertBlockProperty = async (
  block: BlockEntity,
  key: string,
  value: string
): Promise<void> => await upsertBlockProperties(block, { [key]: value });
