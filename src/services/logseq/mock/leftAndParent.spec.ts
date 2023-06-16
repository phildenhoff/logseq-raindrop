import { describe, expect, it } from "vitest";
import { getLeftAndParentBlocksAndMutateBlocks } from "./leftAndParent.js";
import type { BlockMap, PageMap } from "./types.js";

describe("getLeftAndParentBlocks", () => {
  it("returns the right values when sibling is false and before is true", async () => {
    /**
     * We have this page layout:
     * Page 1
     *   Block A
     *     Block B
     *
     * We want to insert a new block that is NOT a sibling of Block A, but is
     * "before". So, this new block becomes the new first child of A. We want:
     *
     * Page 1
     *  Block A
     *   New Block
     *   Block B
     */
    const SIBLING = false;
    const BEFORE = true;
    const page1Identity = {
      id: 1,
      uuid: "_p1",
    };

    const blocksMap: BlockMap = new Map([
      [
        "_a",
        {
          id: 2,
          uuid: "_a",
          content: "Block A",
          left: page1Identity,
          parent: page1Identity,
          page: page1Identity,
          children: [["uuid", "_b"]],
          format: "markdown",
        },
      ],
      [
        "_b",
        {
          id: 3,
          uuid: "_b",
          content: "Block B",
          left: { id: 2, uuid: "_a" },
          parent: { id: 2, uuid: "_a" },
          page: page1Identity,
          children: [],
          format: "markdown",
        },
      ],
    ]);
    const pagesMap: PageMap = new Map([
      [
        "_p1",
        {
          id: page1Identity.id,
          uuid: page1Identity.uuid,
          name: "Page 1",
          originalName: "Page 1",
          "journal?": false,
          roots: [["uuid", "_a"]],
        },
      ],
    ]);

    const result = await getLeftAndParentBlocksAndMutateBlocks(
      SIBLING,
      BEFORE,
      blocksMap,
      pagesMap,
      { id: 4, uuid: "_new" },
      "_a"
    );

    expect(result).toEqual({
      left: { id: 2, uuid: "_a" },
      parent: { id: 2, uuid: "_a" },
    });

    const blockB = blocksMap.get("_b");
    expect(blockB?.left).toEqual({ id: 4, uuid: "_new" });
  });

  it("returns the right values when both sibling and before are false", async () => {
    /**
     * We have this page layout:
     * Page 1
     *   Block A
     *     Block B
     *
     * We want to insert a new block that is NOT a sibling of Block A, and is NOT
     * "before". So, this new block becomes the LAST child of A. We want:
     *
     * Page 1
     *  Block A
     *   Block B
     *   New Block
     */
    const SIBLING = false;
    const BEFORE = false;
    const page1Identity = {
      id: 1,
      uuid: "_p1",
    };

    const blocksMap: BlockMap = new Map([
      [
        "_a",
        {
          id: 2,
          uuid: "_a",
          content: "Block A",
          left: page1Identity,
          parent: page1Identity,
          page: page1Identity,
          children: [["uuid", "_b"]],
          format: "markdown",
        },
      ],
      [
        "_b",
        {
          id: 3,
          uuid: "_b",
          content: "Block B",
          left: { id: 2, uuid: "_a" },
          parent: { id: 2, uuid: "_a" },
          page: page1Identity,
          children: [],
          format: "markdown",
        },
      ],
    ]);
    const pagesMap: PageMap = new Map([
      [
        "_p1",
        {
          id: page1Identity.id,
          uuid: page1Identity.uuid,
          name: "Page 1",
          originalName: "Page 1",
          "journal?": false,
          roots: [["uuid", "_a"]],
        },
      ],
    ]);

    const result = await getLeftAndParentBlocksAndMutateBlocks(
      SIBLING,
      BEFORE,
      blocksMap,
      pagesMap,
      { id: 4, uuid: "_new" },
      "_a"
    );

    expect(result).toEqual({
      left: { id: 3, uuid: "_b" },
      parent: { id: 2, uuid: "_a" },
    });

    const blockB = blocksMap.get("_b");
    expect(blockB?.left).toEqual({ id: 2, uuid: "_a" });
  });

  it("returns the right values when both sibling and before are true", async () => {
    /**
     * We have this page layout:
     * Page 1
     *   Block A
     *     Block B
     *
     * We want to insert a new block that is BOTH a Sibling of Block A AND is BEFORE
     * Block A. We want:
     *
     * Page 1
     *  New Block
     *  Block A
     *   Block B
     */
    const SIBLING = true;
    const BEFORE = true;
    const page1Identity = {
      id: 1,
      uuid: "_p1",
    };

    const blocksMap: BlockMap = new Map([
      [
        "_a",
        {
          id: 2,
          uuid: "_a",
          content: "Block A",
          left: page1Identity,
          parent: page1Identity,
          page: page1Identity,
          children: [["uuid", "_b"]],
          format: "markdown",
        },
      ],
      [
        "_b",
        {
          id: 3,
          uuid: "_b",
          content: "Block B",
          left: { id: 2, uuid: "_a" },
          parent: { id: 2, uuid: "_a" },
          page: page1Identity,
          children: [],
          format: "markdown",
        },
      ],
    ]);
    const pagesMap: PageMap = new Map([
      [
        "_p1",
        {
          id: page1Identity.id,
          uuid: page1Identity.uuid,
          name: "Page 1",
          originalName: "Page 1",
          "journal?": false,
          roots: [["uuid", "_a"]],
        },
      ],
    ]);

    const result = await getLeftAndParentBlocksAndMutateBlocks(
      SIBLING,
      BEFORE,
      blocksMap,
      pagesMap,
      { id: 4, uuid: "_new" },
      "_a"
    );

    expect(result).toEqual({
      left: page1Identity,
      parent: page1Identity,
    });

    const blockA = blocksMap.get("_a");
    expect(blockA?.left).toEqual({ id: 4, uuid: "_new" });
  });

  it("returns the right values when both sibling is TRUE but before is FALSE", async () => {
    /**
     * We have this page layout:
     * Page 1
     *   Block A
     *     Block B
     *
     * We want to insert a new block that is a sibling of Block A but is NOT before,
     * so we want to append it to the page. We want:
     *
     * Page 1
     *  Block A
     *   Block B
     *  New Block
     */
    const SIBLING = true;
    const BEFORE = false;
    const page1Identity = {
      id: 1,
      uuid: "_p1",
    };

    const blocksMap: BlockMap = new Map([
      [
        "_a",
        {
          id: 2,
          uuid: "_a",
          content: "Block A",
          left: page1Identity,
          parent: page1Identity,
          page: page1Identity,
          children: [["uuid", "_b"]],
          format: "markdown",
        },
      ],
      [
        "_b",
        {
          id: 3,
          uuid: "_b",
          content: "Block B",
          left: { id: 2, uuid: "_a" },
          parent: { id: 2, uuid: "_a" },
          page: page1Identity,
          children: [],
          format: "markdown",
        },
      ],
    ]);
    const pagesMap: PageMap = new Map([
      [
        "_p1",
        {
          id: page1Identity.id,
          uuid: page1Identity.uuid,
          name: "Page 1",
          originalName: "Page 1",
          "journal?": false,
          roots: [["uuid", "_a"]],
        },
      ],
    ]);

    const result = await getLeftAndParentBlocksAndMutateBlocks(
      SIBLING,
      BEFORE,
      blocksMap,
      pagesMap,
      { id: 4, uuid: "_new" },
      "_a"
    );

    expect(result).toEqual({
      left: { id: 2, uuid: "_a" },
      parent: page1Identity,
    });

    const blockA = blocksMap.get("_a");
    expect(blockA?.left).toEqual(page1Identity);
    const blockB = blocksMap.get("_b");
    expect(blockB?.left).toEqual({ id: 2, uuid: "_a" });
  });
});
