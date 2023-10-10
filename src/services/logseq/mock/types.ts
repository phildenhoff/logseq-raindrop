import type { BlockUUID } from "@logseq/libs/dist/LSPlugin.js";
import type { LSBlockEntity, LSPageEntity } from "../interfaces.js";

export type PageEntityWithRootBlocks = LSPageEntity & {
  roots?: ["uuid", BlockUUID][];
};
export type BlockMap = Map<LSBlockEntity["uuid"], LSBlockEntity>;
export type PageMap = Map<LSPageEntity["uuid"], PageEntityWithRootBlocks>;
