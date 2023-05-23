import { randomUUID } from "crypto";
import type {
  MinimalBlockEntity,
  MinimalPageEntity,
  LogseqServiceClient,
  IBlockUuid,
  IPageUuid,
  LSBlockEntity,
  LSPageEntity,
} from "./interfaces.js";
import { applyAsyncFunc } from "@util/async.js";

type PageEntityWithRootBlocks = LSPageEntity & {
  roots?: ["uuid", IBlockUuid][];
};
type BlockMap = Map<LSBlockEntity["uuid"], LSBlockEntity>;
type PageMap = Map<LSPageEntity["uuid"], PageEntityWithRootBlocks>;

export const recursiveChildrenOfBlock = async (
  blockUuid: MinimalBlockEntity["uuid"],
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

/**
 * Create a new Mock Logseq client.
 */
export const generateMoqseqClient = (
  mockSetup: Partial<{
    [key in keyof LogseqServiceClient]: unknown[];
  }>
): LogseqServiceClient => {
  // let currentPage: IPageEntity | null = null;
  let focusedPageOrBlock: LSBlockEntity | LSPageEntity | null = null;
  let blocks: BlockMap = new Map();
  let pages: PageMap = new Map();
  let idGenerator = 0;

  // TEMP: using to ensure we remove all calls to Logseq
  const logseq = null;

  // Internal functions
  const _addChildToBlock = async (
    block: LSBlockEntity,
    childUuid: MinimalBlockEntity["uuid"]
  ) => {
    if (block.children === undefined) {
      block.children = [];
    }
    block.children.push(["uuid", childUuid]);
  };
  const _addChildToPage = async (
    page: PageEntityWithRootBlocks,
    childUuid: MinimalBlockEntity["uuid"]
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
  const queryDb: LogseqServiceClient["queryDb"] = async (query) => {
    throw new Error("Not implemented");
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
      children: [],
      left: {
        // this is wrong! We should look at siblings & before
        id: refBlock?.id ?? refPage!.id,
      },
      format: "markdown",
      id: idGenerator++,
      parent: {
        // this is also wrong! we should look at siblings & before
        id: refBlock?.id ?? refPage!.id,
      },
      unordered: true,
      page: {
        id: refBlock ? refBlock.page.id : refPage!.id,
      },
    };

    if (refBlock) _addChildToBlock(refBlock, newBlock.uuid);
    if (refPage) _addChildToPage(refPage, newBlock.uuid);
    blocks.set(newBlock.uuid, newBlock);

    return newBlock;
  };
  const deleteBlock: LogseqServiceClient["deleteBlock"] = async (blockUuid) =>
    Promise.resolve(blocks.delete(blockUuid)).then(() => {});
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

  return {
    displayMessage,
    getBlockById,
    getCurrentPage,
    getFocusedPageOrBlock,
    getPropertiesForBlock,
    getBlockTreeForCurrentPage,
    getBlockTreeForPage,
    createPage,
    openPageByName,
    createBlock,
    deleteBlock,
    updateBlock,
    upsertPropertiesForBlock,
    queryDb,
  };
};
