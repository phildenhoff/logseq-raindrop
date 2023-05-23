import type { ILSPluginUser } from "@logseq/libs/dist/LSPlugin.user.js";
import type { LogseqServiceClient as LogseqServiceWrapper } from "./interfaces.js";

export const generateLogseqClient = (): LogseqServiceWrapper => {
  const logseq = window.logseq as ILSPluginUser;

  return {
    displayMessage: async (message, status, options) =>
      await logseq.UI.showMsg(message, status, options).then(() => {}),
    getCurrentPage: () => {
      throw new Error("Not implemented");
    },
    getFocusedPageOrBlock: async () => await logseq.Editor.getCurrentPage(),
    queryDb: async (query) => (await logseq.DB.q(query)) ?? [],

    // Block
    createBlock: async (parentBlockUuid, blockContent, blockOptions) =>
      logseq.Editor.insertBlock(parentBlockUuid, blockContent, blockOptions),
    deleteBlock: async (blockUuid) => logseq.Editor.removeBlock(blockUuid),
    getBlockById: async (blockUuid) => logseq.Editor.getBlock(blockUuid),
    getPropertiesForBlock: async (blockUuid) =>
      await logseq.Editor.getBlock(blockUuid),
    updateBlock: async (blockUuid, content, options) =>
      logseq.Editor.updateBlock(blockUuid, content, options),
    upsertPropertiesForBlock: async (blockUuid, properties) => {
      const block = await logseq.Editor.getBlock(blockUuid);
      if (!block) {
        return;
      }
      const newProperties = { ...block.properties, ...properties };
      await logseq.Editor.updateBlock(blockUuid, block.content, {
        ...block.properties,
        properties: newProperties,
      });
    },

    // Page
    getBlockTreeForCurrentPage: async () =>
      logseq.Editor.getCurrentPageBlocksTree(),
    getBlockTreeForPage: async (pageUuid) =>
      logseq.Editor.getPageBlocksTree(pageUuid),
    createPage: async (page, properties, options) =>
      logseq.Editor.createPage(page, properties, options),
    openPageByName: async (name) => logseq.Editor.openPage(name),
  };
};
