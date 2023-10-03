import type { ILSPluginUser } from "@logseq/libs/dist/LSPlugin.user.js";
import type {
  LSEventMap,
  LogseqServiceClient as LogseqServiceWrapper,
} from "../interfaces.js";
import { applyAsyncFunc } from "@util/async.js";
import { generateClientSettings } from "./settings.js";

export const logseqClientCtxKey = Symbol();

const relabelSettingsChangedParams =
  (fn: LSEventMap["onSettingsChanged"]) =>
  <T>(a: T, b: T): void => {
    fn({ before: b, after: a });
  };

export const generateLogseqClient = (): LogseqServiceWrapper => {
  const logseq = window.logseq as ILSPluginUser;

  const getSetting = (key: string) => logseq.settings![key];
  const updateSetting = (key: string, value: any) =>
    logseq.updateSettings({ [key]: value });

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
    createBlockBatch: async (parentBlockUuid, blocks, batchOptions) =>
      logseq.Editor.insertBatchBlock(parentBlockUuid, blocks, batchOptions),
    deleteBlock: async (blockUuid) => logseq.Editor.removeBlock(blockUuid),
    getBlockById: async (blockUuid) => logseq.Editor.getBlock(blockUuid),
    getPropertiesForBlock: async (blockUuid) =>
      await logseq.Editor.getBlockProperties(blockUuid),
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
    getEditingBlock: async () => {
      const block = await logseq.Editor.getCurrentBlock();
      if (!block) return null;
      return block;
    },
    getEditingBlockContent: async () => {
      const content = await logseq.Editor.getEditingBlockContent();
      return content;
    },

    // Page
    getBlockTreeForCurrentPage: async () =>
      logseq.Editor.getCurrentPageBlocksTree(),
    getBlockTreeForPage: async (pageUuid) =>
      logseq.Editor.getPageBlocksTree(pageUuid),
    createPage: async (page, properties, options) =>
      logseq.Editor.createPage(page, properties, options),
    openPageByName: async (name) => logseq.App.pushState("page", { name }),
    getPageById: async (id) => {
      if (typeof id !== "number") return null;
      return logseq.Editor.getPage(id);
    },
    getPageByUuid: async (id) => {
      if (typeof id !== "string") return null;
      return logseq.Editor.getPage(id);
    },
    getPageByName: async (name) => {
      if (typeof name !== "string") return null;
      return logseq.Editor.getPage(name);
    },
    settings: generateClientSettings(getSetting, updateSetting, (schema) => {
      logseq.useSettingsSchema(schema);
    }),
    ui: {
      plugin: {
        hide: async () => logseq.hideMainUI(),
        show: async () => logseq.showMainUI(),
      },
      pluginSettings: {
        hide: async () => logseq.hideSettingsUI(),
        show: async () => logseq.showSettingsUI(),
      },
    },
    getUserConfig: logseq.App.getUserConfigs,
    registerEventListener: async (event, callback) => {
      // We have to cast the callback to the correct type as TypeScript
      // can't narrow it. I also tried function overloading but that also didn't work.
      let typedCallback;
      switch (event) {
        case "onThemeModeChanged":
          typedCallback = callback as LSEventMap["onThemeModeChanged"];
          logseq.App.onThemeModeChanged(typedCallback);
          break;
        case "onRouteChanged":
          typedCallback = callback as LSEventMap["onRouteChanged"];
          logseq.App.onRouteChanged(typedCallback);
          break;
        case "onSettingsChanged":
          typedCallback = callback as LSEventMap["onSettingsChanged"];
          logseq.onSettingsChanged(relabelSettingsChangedParams(typedCallback));
          break;
        default:
          break;
      }
    },
  };
};
