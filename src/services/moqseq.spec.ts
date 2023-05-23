import type { BlockEntity } from "@logseq/libs/dist/LSPlugin.js";
import { assert, describe, expect, it } from "vitest";
import { generateMoqseqClient, recursiveChildrenOfBlock } from "./moqseq.js";
import type { LSPageEntity } from "./interfaces.js";

describe("recursiveChildrenOfBlock", () => {
  it("must return the children of a block one deep", async () => {
    const b1: BlockEntity = {
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
    const b2: BlockEntity = {
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
    const b3: BlockEntity = {
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
    const blocks = new Map<string, BlockEntity>([
      [b1.uuid, b1],
      [b2.uuid, b2],
      [b3.uuid, b3],
    ]);

    const actual = await recursiveChildrenOfBlock(b1.uuid, blocks, true);
    expect(actual).toEqual([b2, b3]);
  });

  it("must return the children of a block many levels deep", async () => {
    const b1: BlockEntity = {
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
    const b2: BlockEntity = {
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
    const b3: BlockEntity = {
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
    const b4: BlockEntity = {
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
    const b5: BlockEntity = {
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
    const blocks = new Map<string, BlockEntity>([
      [b1.uuid, b1],
      [b2.uuid, b2],
      [b3.uuid, b3],
      [b4.uuid, b4],
      [b5.uuid, b5],
    ]);

    const actual = await recursiveChildrenOfBlock(b1.uuid, blocks, true);
    expect(actual).toEqual([b2, b3, b4, b5]);
  });
});

// Mogseq client tests

describe("moqseq", () => {
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
});
