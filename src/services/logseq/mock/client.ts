import { randomUUID } from "crypto";
import type {
  LogseqServiceClient,
  LSPageEntity,
  LSBlockEntity,
  LSEvent,
  LSEventMap,
} from "../../interfaces.js";
import { applyAsyncFunc } from "@util/async.js";
import type {
  AppUserConfigs,
  BlockUUID,
} from "@logseq/libs/dist/LSPlugin.user.js";
import type { BlockMap, PageEntityWithRootBlocks, PageMap } from "./types.js";
import { getLeftAndParentBlocks, updateBlockLeft } from "./leftAndParent.js";
import { generateSettingsGetterAndSetter } from "../settings.js";

type TestableLogseqServiceClient = {
  PRIVATE_FOR_TESTING: {
    setDbQueryResponseGenerator: (
      generator: () => Generator<(LSBlockEntity | LSPageEntity)[]>
    ) => void;
    /**
     * Write the set of blocks to stdout.
     */
    displayBlocks: () => void;
    /**
     * Write the set of pages to stdout.
     */
    displayPages: () => void;

    triggerEvent: <E extends LSEvent>(
      event: E,
      ...args: Parameters<LSEventMap[E]>
    ) => void;

    setBlockUnderEdit: (block: LSBlockEntity) => void;
  };
};

type EventListenerMap = Record<LSEvent, ((...args: any[]) => void)[]>;

const kebabToCamelCase = (str: string) =>
  str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

const normalizeBlockProperties = (properties: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [
      kebabToCamelCase(key),
      value,
    ])
  );

/**
 * Apply normalizations to block.
 * In particular, this converts kebab-case properties to camelCase.
 *
 * @param block The block to normalize
 */
const normalizeBlock: (block: LSBlockEntity) => LSBlockEntity = (block) => {
  const blockProperties = block.properties ?? {};

  return {
    ...block,
    properties: normalizeBlockProperties(blockProperties),
  };
};

export const recursiveChildrenOfBlock = async (
  blockUuid: BlockUUID,
  blockMap: BlockMap,
  isRoot = false
): Promise<LSBlockEntity[]> => {
  const block = blockMap.get(blockUuid);
  if (!block) {
    throw new Error(
      "Provided block doesn't exist in graph. Invalid block uuid: " + blockUuid
    );
  }

  const children = block.children;
  if (!children || children.length === 0) {
    return [block];
  }

  const childrenUuids = children.map((child) =>
    "uuid" in child ? child.uuid : child[1]
  );

  const recursiveChildren = await Promise.all(
    childrenUuids.map((child) => recursiveChildrenOfBlock(child, blockMap))
  );

  if (isRoot) {
    return recursiveChildren.flat();
  }
  return [block, ...recursiveChildren.flat()];
};

function* throwErrorGenerator() {
  throw new Error(
    "Query responses not configured. Use `setDbQueryResponseGenerator` to configure a new generator for testing query responses."
  );
}

/**
 * Create a new Mock Logseq client.
 */
export const generateMoqseqClient = (mockSetup?: {
  defaultPages?: LSPageEntity[];
  defaultBlocks?: LSBlockEntity[];
  settings?: Record<string, string | number | boolean | unknown>;
}): LogseqServiceClient & TestableLogseqServiceClient => {
  let focusedPageOrBlock: LSBlockEntity | LSPageEntity | null = null;
  let blockUnderEdit: LSBlockEntity | null = null;
  let blocks: BlockMap = new Map(
    mockSetup?.defaultBlocks?.map((item) => [item.uuid, item]) ?? []
  );
  let pages: PageMap = new Map(
    mockSetup?.defaultPages?.map((item) => [item.uuid, item]) ?? []
  );
  let idGenerator =
    Math.max(
      ...(mockSetup?.defaultBlocks?.map((item) => item.id) || []),
      ...(mockSetup?.defaultPages?.map((item) => item.id) || []),
      -1
    ) + 1;
  let queryResponseGenerator: Generator<(LSBlockEntity | LSPageEntity)[]> =
    throwErrorGenerator();
  let settings = new Map<string, string | number | boolean | unknown>(
    Object.entries(mockSetup?.settings ?? {})
  );
  const listeners: EventListenerMap = {} as EventListenerMap;

  // Internal functions
  const _addChildToBlock = async (
    block: LSBlockEntity,
    childUuid: BlockUUID
  ) => {
    if (block.children === undefined) {
      block.children = [];
    }
    block.children.push(["uuid", childUuid]);
  };
  const _addChildToPage = async (
    page: PageEntityWithRootBlocks,
    childUuid: BlockUUID
  ) => {
    if (page.roots === undefined) {
      page.roots = [];
    }
    page.roots.push(["uuid", childUuid]);
  };
  const _createBlock = async (
    referenceBlockUuid: BlockUUID,
    blockContent: string,
    blockOptions: Parameters<LogseqServiceClient["createBlock"]>[2],
    creationOptions: {
      isPreBlock: boolean;
    }
  ) => {
    const refBlock = blocks.get(referenceBlockUuid);
    const refPage = pages.get(referenceBlockUuid);
    if (!refBlock && !refPage) {
      throw new Error("Parent block not found");
    }

    const generatedId = idGenerator++;
    const generatedUuid = randomUUID();

    const { left, parent } = await getLeftAndParentBlocks(
      blockOptions?.sibling || false,
      blockOptions?.before || false,
      blocks,
      pages,
      referenceBlockUuid
    );
    updateBlockLeft(
      blockOptions?.sibling || false,
      blockOptions?.before || false,
      blocks,
      pages,
      referenceBlockUuid,
      { id: generatedId, uuid: generatedUuid }
    );

    const newBlock: LSBlockEntity = {
      uuid: generatedUuid,
      content: blockContent,
      properties: blockOptions?.properties ?? {},
      left,
      format: "markdown",
      id: generatedId,
      parent,
      unordered: true,
      page: {
        id: refBlock ? refBlock.page.id : refPage!.id,
        uuid: refBlock ? refBlock.page.uuid : refPage!.uuid,
      },
      preBlock: creationOptions.isPreBlock || false,
    };

    if (refBlock) _addChildToBlock(refBlock, newBlock.uuid);
    if (refPage) _addChildToPage(refPage, newBlock.uuid);
    blocks.set(newBlock.uuid, newBlock);

    return newBlock;
  };

  const displayMessage: LogseqServiceClient["displayMessage"] = async (
    ..._args
  ) => Promise.resolve();
  const getCurrentPage = () => {
    throw new Error("Not implemented");
  };
  const getFocusedPageOrBlock = async () => Promise.resolve(focusedPageOrBlock);
  const setDbQueryResponseGenerator: TestableLogseqServiceClient["PRIVATE_FOR_TESTING"]["setDbQueryResponseGenerator"] =
    (iterator) => {
      queryResponseGenerator = iterator();
    };
  const displayBlocks: TestableLogseqServiceClient["PRIVATE_FOR_TESTING"]["displayBlocks"] =
    () => {
      console.table(
        Array.from(blocks.values()).map((block) => ({
          id: block.id,
          uuid: block.uuid,
          content: block.content,
          parent: block.parent,
          page: block.page,
          left: block.left,
          children: block.children?.map((child) =>
            Array.isArray(child) ? child[1] : child.uuid
          ),
          properties: block.properties,
        }))
      );
    };
  const displayPages: TestableLogseqServiceClient["PRIVATE_FOR_TESTING"]["displayPages"] =
    () => {
      console.table(Array.from(pages.values()));
    };
  const triggerEvent: TestableLogseqServiceClient["PRIVATE_FOR_TESTING"]["triggerEvent"] =
    (event, ...args) => {
      const eventListeners = listeners[event];
      if (!eventListeners) {
        return;
      }

      eventListeners.forEach((listener) => listener(...args));
    };
  const setBlockUnderEdit: TestableLogseqServiceClient["PRIVATE_FOR_TESTING"]["setBlockUnderEdit"] =
    (block) => {
      blockUnderEdit = block;
    };
  const queryDb: LogseqServiceClient["queryDb"] = async (query) => {
    return queryResponseGenerator.next(query).value;
  };

  // Block
  const createBlock: LogseqServiceClient["createBlock"] = async (
    referenceBlockUuid,
    blockContent,
    blockOptions
  ) => {
    return _createBlock(referenceBlockUuid, blockContent, blockOptions, {
      isPreBlock: false,
    });
  };
  const createBlockBatch: LogseqServiceClient["createBlockBatch"] = async (
    referenceBlockUuid,
    blocks,
    batchOptions
  ) => {
    // ensure that no blocks have children: that is not supported by moqseq
    if (blocks.some((block) => block.children?.length)) {
      throw new Error(
        "Batch creation is not supported for blocks with children"
      );
    }

    return Promise.all(
      blocks.map((block) =>
        _createBlock(
          referenceBlockUuid,
          block.content,
          {
            properties: block.properties,
            ...batchOptions,
          },
          { isPreBlock: false }
        )
      )
    );
  };
  const deleteBlock: LogseqServiceClient["deleteBlock"] = async (blockUuid) => {
    const block = blocks.get(blockUuid);
    if (!block) {
      return;
    }
    const blockParentPage = pages.get(block?.parent.uuid);

    const recursiveChildren = await recursiveChildrenOfBlock(blockUuid, blocks);
    Promise.all(
      recursiveChildren.map(async (child) => {
        await deleteBlock(child.uuid);
      })
    );

    if (blockParentPage) {
      blockParentPage.roots =
        blockParentPage.roots?.filter(
          ([, rootBlock]) => rootBlock !== blockUuid
        ) ?? [];
    }
    blocks.delete(blockUuid);
  };
  const getBlockById: LogseqServiceClient["getBlockById"] = async (blockUuid) =>
    Promise.resolve(blocks.get(blockUuid)).then((item) => item ?? null);
  const getPropertiesForBlock: LogseqServiceClient["getPropertiesForBlock"] =
    async (blockUuid) =>
      Promise.resolve(blocks.get(blockUuid)?.properties ?? null);
  const updateBlock: LogseqServiceClient["updateBlock"] = async (
    blockUuid,
    content,
    options
  ) => {
    const block = blocks.get(blockUuid);
    if (!block) {
      return;
    }

    blocks.set(blockUuid, {
      ...block,
      content,
      properties: options?.properties ?? {},
    });
  };
  const upsertPropertiesForBlock: LogseqServiceClient["upsertPropertiesForBlock"] =
    async (blockUuid, properties) => {
      const block = blocks.get(blockUuid);
      if (!block) {
        return;
      }

      blocks.set(blockUuid, {
        ...block,
        properties: {
          ...block.properties,
          ...properties,
        },
      });
    };

  const getEditingBlock: LogseqServiceClient["getEditingBlock"] = async () => {
    return blockUnderEdit;
  };
  const getEditingBlockContent: LogseqServiceClient["getEditingBlockContent"] =
    async () => {
      const block = await getEditingBlock();
      if (!block) {
        return "";
      }
      return block.content;
    };

  // Page
  const getBlockTreeForPage: LogseqServiceClient["getBlockTreeForPage"] =
    async (pageUuid) => {
      const page = pages.get(pageUuid);
      if (!page || page.roots === undefined) {
        return [];
      }

      const childrenBlocks = await applyAsyncFunc(
        page.roots,
        async ([, rootBlock]) =>
          recursiveChildrenOfBlock(rootBlock, blocks, true)
      ).then((children) => children.flat());

      return childrenBlocks.map(normalizeBlock);
    };
  const getBlockTreeForCurrentPage = async () => {
    if (!focusedPageOrBlock) {
      return [];
    }
    return getBlockTreeForPage(focusedPageOrBlock.uuid);
  };
  const createPage: LogseqServiceClient["createPage"] = async (
    pageName,
    properties,
    options
  ) => {
    const newPage: LSPageEntity = {
      id: idGenerator++,
      uuid: randomUUID(),
      name: pageName,
      // WARNING: This is 100% going to be a problem later. We create the
      // properties twice: once on the page, and once as a prop block below.
      // We're not keeping them in sync if we update the page, which just seems
      // ripe for bugs with Moqseq.
      properties: normalizeBlockProperties(properties ?? {}),
      originalName: pageName,
      "journal?": options?.journal ?? false,
      ...options,
    };

    pages.set(newPage.uuid, newPage);
    if (options?.redirect) {
      focusedPageOrBlock = newPage;
    }
    if (properties) {
      await _createBlock(
        newPage.uuid,
        "",
        { properties },
        { isPreBlock: true }
      );
    }

    return newPage;
  };
  const openPageByName: LogseqServiceClient["openPageByName"] = async (
    name
  ) => {
    const pageWithname = [...pages.values()].find((page) => page.name === name);
    if (!pageWithname) {
      return;
    }

    focusedPageOrBlock = pageWithname;
  };
  const getPageById: LogseqServiceClient["getPageById"] = async (pageId) => {
    const pageList = [...pages.values()];
    return Promise.resolve(pageList.find((page) => page.id === pageId) ?? null);
  };
  const getPageByUuid: LogseqServiceClient["getPageByUuid"] = async (
    pageUuid
  ) => {
    return Promise.resolve(pages.get(pageUuid) ?? null);
  };
  const getPageByName: LogseqServiceClient["getPageByUuid"] = async (
    pageName
  ) => {
    const pageList = [...pages.values()];
    return Promise.resolve(
      pageList.find((page) => page.name === pageName) ?? null
    );
  };

  // Settings
  const registerSchema: LogseqServiceClient["settings"]["registerSchema"] =
    async (_schema) => {
      return;
    };
  const getSetting: LogseqServiceClient["settings"]["get"] = (settingName) => {
    return settings.get(settingName);
  };
  const setSetting: LogseqServiceClient["settings"]["set"] = async (
    key,
    value
  ) => {
    settings.set(key, value);
    return Promise.resolve();
  };

  const getUserConfig = (): Promise<AppUserConfigs> => {
    return Promise.resolve({
      preferredDateFormat: "MMMM do, yyyy",
      preferredFormat: "markdown",
      preferredLanguage: "en",
      preferredStartOfWeek: "monday",
      preferredThemeMode: "light",
      preferredWorkflow: "now",
      currentGraph: "/path/to/graph",
      showBracket: true,
      enabledFlashcards: true,
      enabledJournals: true,
    });
  };

  const ui = {
    plugin: {
      hide: async () => Promise.resolve(),
      show: async () => Promise.resolve(),
    },
    pluginSettings: {
      hide: async () => Promise.resolve(),
      show: async () => Promise.resolve(),
    },
  };

  const registerEventListener: LogseqServiceClient["registerEventListener"] =
    async (event, callback) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    };

  // Ensure that any default-added blocks are correctly attached to their page
  mockSetup?.defaultBlocks?.forEach((block) => {
    const page = pages.get(block.page.uuid);
    if (page && block.parent.id === page.id) {
      _addChildToPage(page, block.uuid);
    }
    const maybeParentBlock = mockSetup.defaultBlocks?.find(
      (parent) => parent.id === block.parent.id
    );
    if (maybeParentBlock) {
      _addChildToBlock(maybeParentBlock, block.uuid);
    }
  });

  return {
    displayMessage,
    exitEditMode: () => Promise.resolve(),
    getBlockById,
    getCurrentPage,
    getFocusedPageOrBlock,
    getPropertiesForBlock,
    getBlockTreeForCurrentPage,
    getBlockTreeForPage,
    getEditingBlock,
    getEditingBlockContent,
    getPageById,
    getPageByUuid,
    getPageByName,
    createPage,
    openPageByName,
    createBlock,
    createBlockBatch,
    deleteBlock,
    updateBlock,
    upsertPropertiesForBlock,
    queryDb,
    settings: {
      registerSchema,
      get: getSetting,
      set: setSetting,
      ...generateSettingsGetterAndSetter(getSetting, setSetting),
    },
    getUserConfig,
    ui,
    registerEventListener,
    PRIVATE_FOR_TESTING: {
      setDbQueryResponseGenerator,
      displayBlocks,
      displayPages,
      triggerEvent,
      setBlockUnderEdit,
    },
  };
};
