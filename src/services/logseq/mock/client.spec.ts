import type { IEntityID } from "@logseq/libs/dist/LSPlugin.js";
import { assert, describe, expect, it } from "vitest";
import { generateMoqseqClient, recursiveChildrenOfBlock } from "./client.js";
import type { LSBlockEntity } from "../../interfaces.js";
import { randomUUID } from "crypto";

describe("recursiveChildrenOfBlock", () => {
  it("must return the children of a block one deep", async () => {
    const b1: LSBlockEntity = {
      uuid: "block1",
      properties: {},
      id: 1,
      left: {
        id: 2,
      },
      format: "markdown" as const,
      parent: {
        id: 4,
      },
      unordered: true,
      content: "block content",
      page: {
        id: 4,
      },
      children: [
        ["uuid", "block2"],
        ["uuid", "block3"],
      ],
    };
    const b2: LSBlockEntity = {
      uuid: "block2",
      properties: {},
      id: 1,
      left: {
        id: 2,
      },
      format: "markdown" as const,
      parent: {
        id: 4,
      },
      unordered: true,
      content: "block content",
      page: {
        id: 4,
      },
      children: [],
    };
    const b3: LSBlockEntity = {
      uuid: "block3",
      properties: {},
      id: 1,
      left: {
        id: 2,
      },
      format: "markdown" as const,
      parent: {
        id: 4,
      },
      unordered: true,
      content: "block content",
      page: {
        id: 4,
      },
      children: [],
    };
    const blocks = new Map<string, LSBlockEntity>([
      [b1.uuid, b1],
      [b2.uuid, b2],
      [b3.uuid, b3],
    ]);

    const actual = await recursiveChildrenOfBlock(b1.uuid, blocks, true);
    expect(actual).toEqual([b2, b3]);
  });

  it("must return the children of a block many levels deep", async () => {
    const b1: LSBlockEntity = {
      uuid: "block1",
      properties: {},
      id: 1,
      left: {
        id: 2,
      },
      format: "markdown" as const,
      parent: {
        id: 4,
      },
      unordered: true,
      content: "block content",
      page: {
        id: 4,
      },
      children: [["uuid", "block2"]],
    };
    const b2: LSBlockEntity = {
      uuid: "block2",
      properties: {},
      id: 2,
      left: {
        id: 2,
      },
      format: "markdown" as const,
      parent: {
        id: 4,
      },
      unordered: true,
      content: "block content",
      page: {
        id: 4,
      },
      children: [["uuid", "block3"]],
    };
    const b3: LSBlockEntity = {
      uuid: "block3",
      properties: {},
      id: 3,
      left: {
        id: 2,
      },
      format: "markdown" as const,
      parent: {
        id: 4,
      },
      unordered: true,
      content: "block content",
      page: {
        id: 4,
      },
      children: [["uuid", "block4"]],
    };
    const b4: LSBlockEntity = {
      uuid: "block4",
      properties: {},
      id: 4,
      left: {
        id: 2,
      },
      format: "markdown" as const,
      parent: {
        id: 4,
      },
      unordered: true,
      content: "block content",
      page: {
        id: 4,
      },
      children: [["uuid", "block5"]],
    };
    const b5: LSBlockEntity = {
      uuid: "block5",
      properties: {},
      id: 5,
      left: {
        id: 2,
      },
      format: "markdown" as const,
      parent: {
        id: 4,
      },
      unordered: true,
      content: "block content",
      page: {
        id: 4,
      },
      children: [],
    };
    const blocks = new Map<string, LSBlockEntity>([
      [b1.uuid, b1],
      [b2.uuid, b2],
      [b3.uuid, b3],
      [b4.uuid, b4],
      [b5.uuid, b5],
    ]);

    const actual = await recursiveChildrenOfBlock(b1.uuid, blocks, true);
    expect(actual).toEqual([b2, b3, b4, b5]);
  });

  it("throws an error if the provided block ID doesn't exist", async () => {
    const blocks: Map<string, LSBlockEntity> = new Map();
    await expect(async () =>
      recursiveChildrenOfBlock("blockDoesNotExist", blocks, true)
    ).rejects.toThrow();
  });
});

describe("moqseq", () => {
  describe("createPage", () => {
    it("returns the newly created page", async () => {
      const mock = generateMoqseqClient({});

      const actual = await mock.createPage("page1");
      expect(actual).not.toBeNull();
      expect(actual!.name).toBe("page1");

      const actualWithOptions = await mock.createPage(
        "page2",
        {},
        {
          journal: true,
        }
      );
      expect(actualWithOptions!["journal?"]).toBeTruthy();

      const actualWithProps = await mock.createPage(
        "page3",
        {
          foo: "bar",
        },
        {}
      );
      expect(actualWithProps!.properties!["foo"]).toBe("bar");
    });

    it("sets the current page if `redirect: true`", async () => {
      const mock = generateMoqseqClient({});
      mock.createPage("page1");
      mock.createPage("page2", {}, { redirect: true });

      const actual = await mock.getFocusedPageOrBlock();
      expect(actual).not.toBeNull();
      assert(actual);
      assert("name" in actual);
      expect(actual.name).toBe("page2");
    });
  });

  describe("openPageByname", () => {
    it("must update the current page name when changed", async () => {
      const mock = generateMoqseqClient({});

      const actualAtStart = await mock.getFocusedPageOrBlock();
      expect(actualAtStart).toBeNull();

      mock.createPage("page1");
      mock.openPageByName("page1");
      const actualAfterOpen = await mock.getFocusedPageOrBlock();

      expect(actualAfterOpen).not.toBeNull();
      assert("name" in actualAfterOpen!);
      expect(actualAfterOpen.name).toBe("page1");
    });

    it("does nothing if the page does not exist", async () => {
      const mock = generateMoqseqClient({});
      mock.createPage("page1");
      mock.openPageByName("page1");

      mock.openPageByName("pageDoesNotExist");

      const actualAfterOpen = await mock.getFocusedPageOrBlock();
      expect(actualAfterOpen).not.toBeNull();
      assert("name" in actualAfterOpen!);
      expect(actualAfterOpen.name).toBe("page1");
    });
  });

  describe("getCurrentPage", () => {
    it("throws an error when `getCurrentPage` is called", () => {
      const mock = generateMoqseqClient({});

      expect(() => mock.getCurrentPage()).toThrow();
    });
  });

  describe("getPageById", () => {
    it("returns pages by ID", async () => {
      const mock = generateMoqseqClient({});
      const page1 = await mock.createPage("page1");
      const page2 = await mock.createPage("page2");

      assert(page1);
      assert(page2);

      expect(await mock.getPageById(page1.id)).toBe(page1);
      expect(await mock.getPageById(page2.id)).toBe(page2);
    });

    it("returns null if the page does not exist", async () => {
      const mock = generateMoqseqClient({});
      expect(await mock.getPageById(1)).toBeNull();
    });
  });

  describe("getPageByUuid", () => {
    it("returns pages by UUID", async () => {
      const mock = generateMoqseqClient({});
      const page1 = await mock.createPage("page1");
      const page2 = await mock.createPage("page2");

      assert(page1);
      assert(page2);

      expect(await mock.getPageByUuid(page1.uuid)).toBe(page1);
      expect(await mock.getPageByUuid(page2.uuid)).toBe(page2);
    });

    it("returns null if the page does not exist", async () => {
      const mock = generateMoqseqClient({});
      expect(await mock.getPageByUuid("non-existent")).toBeNull();
    });
  });

  describe("getBlockTreeForCurrentPage", () => {
    it("does nothing if no page is focused (e.g. journal)", async () => {
      const mock = generateMoqseqClient({});
      await mock.createPage("page1");

      const actual = await mock.getBlockTreeForCurrentPage();
      expect(actual).toEqual([]);
    });

    it("returns the block tree for the current page", async () => {
      const mock = generateMoqseqClient({});
      const page1 = await mock.createPage("page1");
      if (!page1) throw new Error("page1 not created");
      await mock.openPageByName("page1");

      const b1 = await mock.createBlock(page1.uuid, "block1");
      const b2 = await mock.createBlock(page1.uuid, "block2");

      const actual = await mock.getBlockTreeForCurrentPage();
      expect(actual).toEqual([b1, b2]);
    });

    it("returns an empty list when the page has no blocks", async () => {
      const mock = generateMoqseqClient({});
      const page1 = await mock.createPage("page1");
      if (!page1) throw new Error("page1 not created");
      await mock.openPageByName("page1");

      const actual = await mock.getBlockTreeForCurrentPage();
      expect(actual).toEqual([]);
    });
  });

  describe("upsertPropertiesForBlock", () => {
    it("does nothing if the block does not exist", async () => {
      const mock = generateMoqseqClient({});

      expect(
        async () =>
          await mock.upsertPropertiesForBlock("uuid-for-missing-block", {
            foo: "bar",
          })
      ).not.toThrow();
    });

    it("inserts new properties", async () => {
      const mock = generateMoqseqClient({});
      const rootPage = await mock.createPage("page1");
      const b1 = await mock.createBlock(rootPage!.uuid, "block1");

      expect(b1?.properties).toEqual({});

      await mock.upsertPropertiesForBlock(b1!.uuid, {
        foo: "bar",
      });

      const actual = await mock.getBlockById(b1!.uuid);
      expect(actual?.properties).toEqual({
        foo: "bar",
      });
    });

    it("updates existing properties", async () => {
      const mock = generateMoqseqClient({});
      const rootPage = await mock.createPage("page1");
      const b1 = await mock.createBlock(rootPage!.uuid, "block1", {
        properties: { prop1: "before" },
      });

      expect(b1?.properties).toEqual({ prop1: "before" });

      await mock.upsertPropertiesForBlock(b1!.uuid, {
        prop1: "after",
      });

      const actual = await mock.getBlockById(b1!.uuid);
      expect(actual?.properties).toEqual({
        prop1: "after",
      });
    });
  });

  describe("updateBlock", () => {
    it("does nothing if the block does not exist", async () => {
      const mock = generateMoqseqClient({});

      expect(
        async () =>
          await mock.updateBlock("uuid-for-missing-block", "New content", {
            properties: {
              foo: "bar",
            },
          })
      ).not.toThrow();
    });

    it("updates the block content", async () => {
      const mock = generateMoqseqClient({});
      const rootPage = await mock.createPage("page1");
      const b1 = await mock.createBlock(rootPage!.uuid, "block1", {
        properties: { prop1: "before" },
      });

      expect(b1!.content).toEqual("block1");

      await mock.updateBlock(b1!.uuid, "New content");

      const actual = await mock.getBlockById(b1!.uuid);
      expect(actual!.content).toEqual("New content");
    });

    it("replaces the block properties", async () => {
      const mock = generateMoqseqClient({});
      const rootPage = await mock.createPage("page1");
      const b1 = await mock.createBlock(rootPage!.uuid, "block1", {
        properties: { prop1: "before" },
      });

      expect(b1!.properties).toEqual({ prop1: "before" });

      await mock.updateBlock(b1!.uuid, "New content", {
        properties: {
          prop1: "after",
        },
      });

      const actual = await mock.getBlockById(b1!.uuid);
      expect(actual!.properties).toEqual({ prop1: "after" });
    });
  });

  describe("getPropertiesForBlock", () => {
    it("returns null if the block does not exist", async () => {
      const mock = generateMoqseqClient({});

      const actual = await mock.getPropertiesForBlock("uuid-for-missing-block");
      expect(actual).toBeNull();
    });

    it("returns the block properties", async () => {
      const mock = generateMoqseqClient({});
      const rootPage = await mock.createPage("page1");
      const b1 = await mock.createBlock(rootPage!.uuid, "block1", {
        properties: { prop1: "value" },
      });

      const actual = await mock.getPropertiesForBlock(b1!.uuid);
      expect(actual).toEqual({ prop1: "value" });
    });
  });

  describe("deleteBlock", () => {
    it("does nothing if the block does not exist", async () => {
      const mock = generateMoqseqClient({});

      expect(
        async () => await mock.deleteBlock("uuid-for-missing-block")
      ).not.toThrow();
    });

    it("removes the block from the page's block tree", async () => {
      const mock = generateMoqseqClient({});
      const rootPage = await mock.createPage("page1");
      const b1 = await mock.createBlock(rootPage!.uuid, "block1");
      const b2 = await mock.createBlock(rootPage!.uuid, "block2");

      await mock.deleteBlock(b1!.uuid);

      const actual = await mock.getBlockById(b1!.uuid);
      expect(actual).toBeNull();

      const actual2 = await mock.getBlockTreeForPage(rootPage!.uuid);
      expect(actual2).toEqual([b2]);
    });

    it("recursively deletes the block's children", async () => {
      const mock = generateMoqseqClient({});
      const rootPage = await mock.createPage("page1");
      const b1 = await mock.createBlock(rootPage!.uuid, "block1");
      const b2 = await mock.createBlock(b1!.uuid, "block2");

      await mock.deleteBlock(b1!.uuid);

      const actual1 = await mock.getBlockById(b1!.uuid);
      expect(actual1).toBeNull();
      const actual2 = await mock.getBlockById(b2!.uuid);
      expect(actual2).toBeNull();

      const actual3 = await mock.getBlockTreeForPage(rootPage!.uuid);
      expect(actual3).toEqual([]);
    });
  });

  describe("createBlock", () => {
    it("creates a block with the given content and properties", async () => {
      const mock = generateMoqseqClient({});
      const rootPage = await mock.createPage("page1");
      const createdBlock = await mock.createBlock(rootPage!.uuid, "block1", {
        properties: { prop1: "value" },
      });

      expect(createdBlock!.content).toEqual("block1");
      expect(createdBlock!.properties).toEqual({ prop1: "value" });

      const actual = await mock.getBlockById(createdBlock!.uuid);
      expect(actual).toEqual(createdBlock);
    });

    it("throws an error if the refernce block doesn't exist", async () => {
      const mock = generateMoqseqClient({});

      await expect(async () => {
        await mock.createBlock("fake-ref-uuid", "block1", {
          properties: { prop1: "value" },
        });
      }).rejects.toThrow();
    });
  });

  describe("displayMessage", () => {
    it("consumes a message", async () => {
      const mock = generateMoqseqClient({});
      await mock.displayMessage("Hello World");
    });
  });

  describe("queryDb", () => {
    const generateRandomBlock = (options?: {
      uuid?: string;
      left?: IEntityID;
      content?: string;
      parent?: IEntityID;
      page?: IEntityID;
    }): LSBlockEntity => {
      return {
        id: Math.random() * 1000,
        uuid: options?.uuid || randomUUID(),
        left: options?.left || { id: Math.random() * 1000 },
        format: "markdown",
        parent: options?.parent || {
          id: Math.random() * 1000,
          uuid: randomUUID(),
        },
        unordered: true,
        content: options?.content || randomUUID(),
        page: options?.page || {
          id: Math.random() * 1000,
        },
      };
    };

    it("returns the mocked query response", async () => {
      const mock = generateMoqseqClient({});
      const sampleLsBlockEntity = generateRandomBlock();

      mock.PRIVATE_FOR_TESTING.setDbQueryResponseGenerator(function* () {
        yield [sampleLsBlockEntity];
      });

      const actual = await mock.queryDb("foo");

      expect(actual[0]).toBe(sampleLsBlockEntity);
    });

    it("yields successive responses from the same generator", async () => {
      const mock = generateMoqseqClient({});

      mock.PRIVATE_FOR_TESTING.setDbQueryResponseGenerator(function* () {
        let count = 0;
        while (true) {
          yield [
            generateRandomBlock({
              uuid: count.toString(),
            }),
          ];
          count++;
        }
      });

      expect((await mock.queryDb("foo")).at(0)).toHaveProperty("uuid", "0");
      expect((await mock.queryDb("bar")).at(0)).toHaveProperty("uuid", "1");
      expect((await mock.queryDb("baz")).at(0)).toHaveProperty("uuid", "2");
    });

    it("it throws an error when not configured", async () => {
      const mock = generateMoqseqClient({});

      expect(async () => await mock.queryDb("foo")).rejects.toThrowError();
    });
  });
});
