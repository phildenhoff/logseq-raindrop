import { randomUUID } from "crypto";
import type {
  LogseqServiceClient,
  LSPageEntity,
  LSBlockEntity,
} from "../../interfaces.js";
import { applyAsyncFunc } from "@util/async.js";
import type {
  BlockUUID,
  BlockUUIDTuple,
  IEntityID,
  PageEntity,
} from "@logseq/libs/dist/LSPlugin.user.js";
import { first } from "true-myth/maybe";

export type PageEntityWithRootBlocks = LSPageEntity & {
  roots?: ["uuid", BlockUUID][];
};
type BlockMap = Map<LSBlockEntity["uuid"], LSBlockEntity>;
type PageMap = Map<LSPageEntity["uuid"], PageEntityWithRootBlocks>;

type TestableLogseqServiceClient = {
  PRIVATE_FOR_TESTING: {
    setDbQueryResponseGenerator: (
      generator: () => Generator<(LSBlockEntity | LSPageEntity)[]>
    ) => void;
  };
};

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

export const getLeftAndParentBlocks = async (
  left: boolean,
  parent: boolean,
  blocksMap: BlockMap,
  pagesMap: PageMap
): Promise<{ left: IEntityID; parent: IEntityID }> => {};

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
  let blocks: BlockMap = new Map(
    mockSetup?.defaultBlocks?.map((item) => [item.uuid, item]) ?? []
  );
  let pages: PageMap = new Map(
    mockSetup?.defaultPages?.map((item) => [item.uuid, item]) ?? []
  );
  let idGenerator = Math.max(
    ...(mockSetup?.defaultBlocks?.map((item) => item.id) || []),
    ...(mockSetup?.defaultPages?.map((item) => item.id) || []),
    0
  );
  let queryResponseGenerator: Generator<(LSBlockEntity | LSPageEntity)[]> =
    throwErrorGenerator();
  let settings = new Map<string, string | number | boolean | unknown>(
    Object.entries(mockSetup?.settings ?? {})
  );

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
    const refIsPage = pages.has(referenceBlockUuid);
    const refBlock = blocks.get(referenceBlockUuid);
    const refPage = pages.get(referenceBlockUuid);
    if (!refBlock && !refPage) {
      throw new Error("Parent block not found");
    }
    const refPageEntityId: IEntityID | null = refPage
      ? {
          id: refPage.id,
          uuid: refPage.uuid,
        }
      : null;

    const generatedId = idGenerator++;
    const generatedUuid = randomUUID();

    let left: IEntityID;
    let parent: IEntityID;

    if (blockOptions?.sibling) {
      parent = refBlock ? refBlock.parent : refPageEntityId!;
      if (blockOptions?.before) {
        // inserted before the reference block, under the same parent
        left = refBlock ? refBlock.left : refPageEntityId!;
        // Update refBlock, if it exists, to point to the new block
        if (refBlock) {
          // We're able to mutate the objects in our map directly; we receive the
          // object by reference and not by copy.
          refBlock.left = {
            id: generatedId,
            uuid: generatedUuid,
          };
        }
      } else {
        // insert after the reference block, under the same parent
        left = refBlock
          ? { id: refBlock.id, uuid: refBlock.uuid }
          : refPageEntityId!;
      }
    } else {
      const parentBlockOrPage = refIsPage ? refPage : refBlock;
      if (parentBlockOrPage) {
        const parentBlockOrPageIdentity = {
          id: parentBlockOrPage?.id,
          uuid: parentBlockOrPage?.uuid,
        };
        parent = parentBlockOrPageIdentity;

        const firstChild = (
          (refIsPage ? refPage?.roots : refBlock?.children) ?? []
        )
          .map((item) => {
            const block = Array.isArray(item)
              ? blocks.get(item[1])
              : blocks.get(item.uuid);
            return block;
          })
          .filter((block) => {
            return block?.left.id === parentBlockOrPage.id;
          })
          .at(0);

        if (blockOptions?.before) {
          left = parentBlockOrPageIdentity;

          // update first child of parent to point to the new block
          if (firstChild) {
            firstChild.left = {
              id: generatedId,
              uuid: generatedUuid,
            };
          }
        } else {
          left = firstChild
            ? { id: firstChild?.id, uuid: firstChild?.uuid }
            : parentBlockOrPageIdentity;
        }
      }
    }

    const newBlock: LSBlockEntity = {
      uuid: generatedUuid,
      content: blockContent,
      properties: blockOptions?.properties ?? {},
      left: {
        // "which block is the predecessor of this block"
        id: refBlock?.id ?? refPage!.id,
        uuid: refBlock?.uuid ?? refPage!.uuid,
      },
      format: "markdown",
      id: generatedId,
      parent: {
        // "which block this is a child of"
        // this is also wrong! we should look at siblings & before
        id: refBlock?.id ?? refPage!.id,
        uuid: refBlock?.uuid ?? refPage!.uuid,
      },
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
  const getSetting: LogseqServiceClient["settings"]["get"] = async (
    settingName
  ) => {
    return Promise.resolve(settings.get(settingName));
  };
  const setSetting: LogseqServiceClient["settings"]["set"] = async (
    key,
    value
  ) => {
    settings.set(key, value);
    return Promise.resolve();
  };

  // Ensure that any default-added blocks are correctly attached to their page
  mockSetup?.defaultBlocks?.forEach((block) => {
    const page = pages.get(block.page.uuid);
    if (!page) {
      return;
    }
    _addChildToPage(page, block.uuid);
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
    },
    PRIVATE_FOR_TESTING: {
      setDbQueryResponseGenerator,
    },
  };
};
