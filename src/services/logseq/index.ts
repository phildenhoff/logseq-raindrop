export { generateLogseqClient } from "./client.js";

export type {
  LSBlockEntity,
  LSPageEntity,
  LogseqServiceClient,
} from "./interfaces.js";
export { formatDateForSettings } from "./formatting.js";

export { ioAddEmptyStateBlock, ioRemoveEmptyStateBlock } from "./emptyState.js";

// Used for testing
import type { PageEntityWithRootBlocks } from "./mock/types.js";
import { generateMoqseqClient } from "./mock/client.js";

export const TESTING_FUNCS = {
  generateMoqseqClient,
};
export type TESTING_TYPES = {
  PageEntityWithRootBlocks: PageEntityWithRootBlocks;
};
