import type {
  BlockEntity,
  BlockUUID,
  BlockUUIDTuple,
  EntityID,
  IBatchBlock,
  IEntityID,
  PageEntity,
  SettingSchemaDesc,
} from "@logseq/libs/dist/LSPlugin.js";

// Duplicated from @logseq/libs/dist/LSPlugin.d.ts because the Logseq type
// includes a `[key: string]: any]` prop which corrupts the rest of the type
// and makes it impossible to make higher-order-types based off of it.
// In part, that is because Typescript doesn't have anything for excluding
// types.
type LSPlugin = {
  BlockEntity: {
    id: EntityID;
    uuid: BlockUUID;
    left: IEntityID;
    format: "markdown" | "org";
    parent: IEntityID;
    content: string;
    page: IEntityID;
    properties?: Record<string, any>;
    anchor?: string;
    body?: any;
    children?: Array<BlockEntity | BlockUUIDTuple>;
    container?: string;
    file?: IEntityID;
    level?: number;
    meta?: {
      timestamps: any;
      properties: any;
      startPos: number;
      endPos: number;
    };
    title?: Array<any>;
    // Declared as required in the API, but querying the DB does not provide this
    // field, so it must be optional.
    unordered?: boolean;
    // Undocumented, but this is true for blocks that are the props block of a
    // page.
    preBlock?: boolean;
  };
  PageEntity: {
    id: EntityID;
    uuid: BlockUUID;
    name: string;
    originalName: string;
    "journal?": boolean;
    file?: IEntityID;
    namespace?: IEntityID;
    children?: Array<PageEntity>;
    properties?: Record<string, any>;
    format?: "markdown" | "org";
    journalDay?: number;
    updatedAt?: number;
  };
};

export type LSBlockEntity = LSPlugin["BlockEntity"];
export type LSPageEntity = LSPlugin["PageEntity"];

/**
 * Wraps the Logseq client in an interface that we can mock out for testing.
 */
export interface LogseqServiceClient {
  /**
   * Execute query aginst the Logseq graph.
   *
   * The query language is a DSL for Logseq.
   * @see https://docs.logseq.com/#/page/queries
   *
   * @param query A Logseq query.
   * @returns A promise that resolves to the result of the query.
   *
   */
  queryDb: (query: string) => Promise<(LSBlockEntity | LSPageEntity)[]>;

  /**
   * Get the properties for a block.
   *
   * @param blockUuid The ID of the block to get properties for.
   * @returns A Promise that resolves to a block, if it exists.
   */
  getPropertiesForBlock: (
    blockUuid: BlockUUID
  ) => Promise<Record<string, unknown> | null>;

  /**
   * Inserts new properties for a block, if the `key` doesn't already exist in
   * the block's properties. Otherwise, it updates the existing property.
   *
   * If there is no block for `blockUuid`, nothing happens.
   *
   * @param blockUuid The ID of the block to insert properties for.
   * @param properties The properties to upset.
   * @returns A Promise that resolves to void when the updates are complete.
   */
  upsertPropertiesForBlock: (
    blockUuid: BlockUUID,
    properties: Record<string, string>
  ) => Promise<void>;

  /**
   * Get a block by its ID.
   *
   * @param blockUuid The ID of the block to get.
   * @returns A Promise that resolves to a block, if it exists.
   */
  getBlockById: (blockUuid: BlockUUID) => Promise<LSBlockEntity | null>;

  /**
   * Update the text content and properties of a block.
   *
   * @param blockUuid The ID of the block to update.
   * @param content The new text content of the block.
   * @param options Optional. Additional fields to update on the block (e.g.,
   * upset block properties.)
   *
   * @returns A Promise that resolves to void when the update is complete.
   */
  updateBlock: (
    blockUuid: BlockUUID,
    content: string,
    options?: { properties?: LSBlockEntity["properties"] }
  ) => Promise<void>;

  /**
   * Delete a block.
   * @param blockUuid The ID of the block to delete.
   * @returns A Promise that resolves to void when the block is deleted.
   */
  deleteBlock: (blockUuid: BlockUUID) => Promise<void>;

  /**
   * Adds a block to the graph.
   *
   * You can create a block in a few different ways:
   * - **`before` and `sibling` are both `false`**: the block is created as a
   * child * of `parentBlockUuid`, appended to the child list (after all other
   * children).
   * - **`before` is `true` and `sibling` is `false`**: the block is created as
   * a child of `parentBlockUuid`, prepended to the child list (before all other
   * children).
   * - **`before` is `false` and `sibling` is `true`**: the block is created as
   * a sibling after `parentBlockUuid` (appended).
   * - **`before` and `sibling` are both `true`**: the block is created as a
   * sibling before `parentBlockUuid` (prepended).
   *
   * @param refenceBlockUuid The ID of the block to create the new block near.
   * @param content The text content of the new block.
   * @param options Optional. Additional options for creating the block.
   *
   * @returns A Promise that resolves to the new block.
   */
  createBlock: (
    refenceBlockUuid: BlockUUID,
    content: string,
    options?: {
      before?: boolean;
      sibling?: boolean;
      isPageBlock?: boolean;
      focus?: boolean;
      customUuid?: string;
      properties?: LSBlockEntity["properties"];
    }
  ) => Promise<LSBlockEntity | null>;

  /**
   * Batched version of `creatBlock`. Creates multiple blocks in a single call.
   *
   * @see createBlock
   *
   * @param refenceBlockUuid
   * @param blocks
   * @param options
   * @returns
   */
  createBlockBatch: (
    refenceBlockUuid: BlockUUID,
    blocks: IBatchBlock[],
    options?: {
      before?: boolean;
      sibling?: boolean;
    }
  ) => Promise<LSBlockEntity[] | null>;

  /**
   * Opens a page so that it's viewable in Logseq.
   *
   * @param pageName The name of the page to open.
   * @returns A Promise that resolves to void when the page is opened.
   */
  openPageByName: (pageName: string) => Promise<void>;

  /**
   * Creates a page.
   *
   * @param pageName The name of the page to create.
   * @param properties Properties to add to the page.
   * @param options Optional. Additional options for creating the page.
   *
   * @returns A Promise that resolves to void when the page is created.
   */
  createPage: (
    pageName: string,
    properties?: LSBlockEntity["properties"],
    options?: {
      redirect?: boolean;
      createFirstBlock?: boolean;
      format?: "markdown" | "org";
      journal?: boolean;
    }
  ) => Promise<LSPageEntity | null>;

  /**
   * Returns the current page or block.
   *
   * When looking at the journal, this is `undefined`.
   *
   * Note: in Logseq, users can "drill down" into a block, which essentially
   * makes blocks into pages.
   *
   * @returns A Promise that resolves to the current page.
   *
   * @example
   * When looking at a page
   * ```ts
   * const page = await logseqClient.getFocusedPageOrBlock();
   * page === {
   *   createdAt: 1684739695487
   *   file: {id: 41278}
   *   format: "markdown"
   *   id: 41268
   *   journal?: true
   *   journalDay: 20230522
   *   name: "may 22nd, 2023"
   *   originalName: "May 22nd, 2023"
   *   updatedAt: 1684790469983
   *   uuid: "646b166f-8c48-40d0-a689-8c0711fda1ff"
   * }
   * ```
   *
   * @example
   * When looking at a block
   * ```ts
   * const block = await logseqClient.getFocusedPageOrBlock();
   * block === {
   * content: "New questions"
   *   format: "markdown"
   *   id: 41295
   *   journal?: true
   *   left: {id: 41286}
   *   page: {id: 41268}
   *   parent: {id: 41269}
   *   pathRefs: (2) [{…}, {…}]
   *   properties: {}
   *   unordered: true
   *   uuid: "646bd5fe-b135-43da-9da4-634e20567dd9"
   * }
   * ```
   *
   * @example
   * When looking at the root journal page
   * ```ts
   * const journal = await logseqClient.getFocusedPageOrBlock();
   * journal === undefined
   * ```
   *
   */
  getFocusedPageOrBlock: () => Promise<LSBlockEntity | LSPageEntity | null>;

  /**
   * Throws an error. **You cannot use this.** It's here to ensure you use
   * `getFocusedPageOrBlock` instead.
   *
   * @see getFocusedPageOrBlock
   */
  getCurrentPage: () => never;

  /**
   * Returns the PageEntity, if one exists, for a Page ID.
   */
  getPageById: (pageId: EntityID) => Promise<LSPageEntity | null>;

  /**
   * Returns the PageEntity, if one exists, for a Page UUID.
   */
  getPageByUuid: (pageUuid: BlockUUID) => Promise<LSPageEntity | null>;

  /**
   * Returns the PageEntity, if one exists, for a Page UUID.
   */
  getPageByName: (pageName: string) => Promise<LSPageEntity | null>;

  /**
   * Returns all the blocks for the specific page.
   * @param pageUuid The page to get the block tree for.
   * @returns A Promise that resolves to the block tree for the page.
   */
  getBlockTreeForPage: (pageUuid: BlockUUID) => Promise<LSBlockEntity[]>;
  // todo: this doesn't belong in the SDK
  getBlockTreeForCurrentPage: () => Promise<LSBlockEntity[]>;

  /**
   * Display a message to the user.
   * @param message Content of the message to display
   * @returns
   */
  displayMessage: (
    message: string,
    status?: "success" | "warning" | "error",
    options?: {
      key?: string;
      timeout?: number;
    }
  ) => Promise<void>;

  /**
   * Exits editing mode.
   */
  exitEditMode: () => Promise<void>;

  settings: {
    registerSchema: (schema: SettingSchemaDesc[]) => void;
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
}
