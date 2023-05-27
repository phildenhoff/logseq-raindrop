import type { ILSPluginUser } from "@logseq/libs/dist/LSPlugin.user.js";
import type { LogseqServiceClient as LogseqServiceWrapper } from "../interfaces.js";
import { applyAsyncFunc } from "@util/async.js";

export const logseqClientCtxKey = Symbol();

export const generateLogseqClient = (): LogseqServiceWrapper => {
  const logseq = window.logseq as ILSPluginUser;

  return {
    displayMessage: async (message, status, options) =>
      await logseq.UI.showMsg(message, status, options).then(() => {}),
    exitEditMode: async () => await logseq.Editor.exitEditingMode(),
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
      // Upsert the block's properties
      await applyAsyncFunc(
        Object.entries(properties),
        async ([key, value]) =>
          await logseq.Editor.upsertBlockProperty(blockUuid, key, value)
      );

      // After upserting the properties, we have to unset & reset the content
      // of the block so that Logseq indexes our changes.
      // First, we get the current block content & the property values we set.
      const currentContent = (await logseq.Editor.getBlock(blockUuid))!.content;
      const currentProps: Record<string, string> =
        await logseq.Editor.getBlockProperties(blockUuid);

      // Then, we unset content
      await logseq.Editor.updateBlock(blockUuid, "Indexing block props", {
        properties: currentProps,
      });
      // And re-set the block content
      await logseq.Editor.updateBlock(blockUuid, currentContent, {
        properties: currentProps,
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
    getPageById: async (id) => {
      if (typeof id !== "number") return null;
      return logseq.Editor.getPage(id);
    },
    getPageByUuid: async (id) => {
      if (typeof id !== "string") return null;
      return logseq.Editor.getPage(id);
    },
  };
};
