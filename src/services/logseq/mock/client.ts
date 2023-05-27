import { randomUUID } from "crypto";
import type {
  LogseqServiceClient,
  LSPageEntity,
  LSBlockEntity,
} from "../../interfaces.js";
import { applyAsyncFunc } from "@util/async.js";
import type { BlockUUID, PageEntity } from "@logseq/libs/dist/LSPlugin.user.js";

type PageEntityWithRootBlocks = LSPageEntity & {
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
export const generateMoqseqClient = (
  mockSetup?: Partial<{
    [key in keyof LogseqServiceClient]: unknown[];
  }> & {
    defaultPages?: PageEntity[];
  }
): LogseqServiceClient & TestableLogseqServiceClient => {
  let focusedPageOrBlock: LSBlockEntity | LSPageEntity | null = null;
  let blocks: BlockMap = new Map();
  let pages: PageMap = new Map(
    mockSetup?.defaultPages?.map((item) => [item.uuid, item]) ?? []
  );
  let idGenerator = 0;
  let queryResponseGenerator: Generator<(LSBlockEntity | LSPageEntity)[]> =
    throwErrorGenerator();

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
    const refBlock = blocks.get(referenceBlockUuid);
    const refPage = pages.get(referenceBlockUuid);
    if (!refBlock && !refPage) {
      throw new Error("Parent block not found");
    }

    const newBlock: LSBlockEntity = {
      uuid: randomUUID(),
      content: blockContent,
      properties: blockOptions?.properties ?? {},
      left: {
        // this is wrong! We should look at siblings & before
        id: refBlock?.id ?? refPage!.id,
        uuid: refBlock?.uuid ?? refPage!.uuid,
      },
      format: "markdown",
      id: idGenerator++,
      parent: {
        // this is also wrong! we should look at siblings & before
        id: refBlock?.id ?? refPage!.id,
        uuid: refBlock?.uuid ?? refPage!.uuid,
      },
      unordered: true,
      page: {
        id: refBlock ? refBlock.page.id : refPage!.id,
        uuid: refBlock ? refBlock.page.uuid : refPage!.uuid,
      },
    };

    if (refBlock) _addChildToBlock(refBlock, newBlock.uuid);
    if (refPage) _addChildToPage(refPage, newBlock.uuid);
    blocks.set(newBlock.uuid, newBlock);

    return newBlock;
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

      return applyAsyncFunc(page.roots, async ([, rootBlock]) =>
        recursiveChildrenOfBlock(rootBlock, blocks, true)
      ).then((children) => children.flat());
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
      properties: properties,
      originalName: pageName,
      "journal?": options?.journal ?? false,
      ...options,
    };

    pages.set(newPage.uuid, newPage);

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
    createPage,
    openPageByName,
    createBlock,
    deleteBlock,
    updateBlock,
    upsertPropertiesForBlock,
    queryDb,
    PRIVATE_FOR_TESTING: {
      setDbQueryResponseGenerator,
    },
  };
};
