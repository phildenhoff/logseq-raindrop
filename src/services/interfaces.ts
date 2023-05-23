import type { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin.js";

export type IBlockEntity = BlockEntity;
export type IBlockUuid = BlockEntity["uuid"];
export type IPageEntity = PageEntity;
export type IPageUuid = PageEntity["uuid"];

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
  queryDb: (query: string) => Promise<IBlockEntity[]>;

  /**
   * Get the properties for a block.
   *
   * @param blockUuid The ID of the block to get properties for.
   * @returns A Promise that resolves to a block, if it exists.
   */
  getPropertiesForBlock: (
    blockUuid: IBlockUuid
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
    blockUuid: IBlockUuid,
    properties: Record<string, string>
  ) => Promise<void>;

  /**
   * Get a block by its ID.
   *
   * @param blockUuid The ID of the block to get.
   * @returns A Promise that resolves to a block, if it exists.
   */
  getBlockById: (blockUuid: IBlockUuid) => Promise<IBlockEntity | null>;

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
    blockUuid: IBlockUuid,
    content: string,
    options?: { properties?: IBlockEntity["properties"] }
  ) => Promise<void>;

  /**
   * Delete a block.
   * @param blockUuid The ID of the block to delete.
   * @returns A Promise that resolves to void when the block is deleted.
   */
  deleteBlock: (blockUuid: IBlockUuid) => Promise<void>;

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
    refenceBlockUuid: IBlockUuid,
    content: string,
    options?: {
      before: boolean;
      sibling: boolean;
      isPageBlock: boolean;
      focus: boolean;
      customUuid: string;
      properties: IBlockEntity["properties"];
    }
  ) => Promise<IBlockEntity | null>;

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
    properties?: IBlockEntity["properties"],
    options?: {
      redirect?: boolean;
      createFirstBlock?: boolean;
      format?: "markdown" | "org";
      journal?: boolean;
    }
  ) => Promise<IPageEntity | null>;

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
  getFocusedPageOrBlock: () => Promise<IPageEntity | IBlockEntity | null>;

  /**
   * Throws an error. **You cannot use this.** It's here to ensure you use
   * `getFocusedPageOrBlock` instead.
   *
   * @see getFocusedPageOrBlock
   */
  getCurrentPage: () => never;

  /**
   * Returns all the blocks for the specific page.
   * @param pageUuid The page to get the block tree for.
   * @returns A Promise that resolves to the block tree for the page.
   */
  getBlockTreeForPage: (pageUuid: IPageUuid) => Promise<IBlockEntity[]>;
  // todo: this doesn't belong in the SDK
  getBlockTreeForCurrentPage: () => Promise<IBlockEntity[]>;

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
}
