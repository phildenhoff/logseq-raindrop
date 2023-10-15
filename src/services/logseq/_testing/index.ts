import type { PageEntityWithRootBlocks } from "./mock/types.js";
import { generateMoqseqClient } from "./mock/client.js";

export type TESTING_TYPES = {
  PageEntityWithRootBlocks: PageEntityWithRootBlocks;
};
export const TESTING_FUNCS = {
  generateMoqseqClient,
};
