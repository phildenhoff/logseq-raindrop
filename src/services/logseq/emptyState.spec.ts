import { describe, it, expect, assert } from "vitest";

import { ioAddEmptyStateBlock, ioRemoveEmptyStateBlock } from "./emptyState.js";
import { TESTING_FUNCS } from "@testing/logseq";

const { generateMoqseqClient } = TESTING_FUNCS;

describe("ioAddEmptyStateBlock", () => {
  it("should add a new block to let the user know that there are no annotations", async () => {
    const mockLogseqClient = generateMoqseqClient({
      settings: {
        enable_empty_page_state: true,
      },
    });
    const page = await mockLogseqClient.createPage("test");
    assert(page);
    const pageBlocksBefore = await mockLogseqClient.getBlockTreeForPage(
      page.uuid
    );
    expect(pageBlocksBefore).toBeTruthy();
    expect(pageBlocksBefore.length).toBe(0);

    await ioAddEmptyStateBlock(pageBlocksBefore, page.uuid, mockLogseqClient);

    // Ensure a new block was added
    const actualFirst = await mockLogseqClient.getBlockTreeForPage(page.uuid);

    expect(actualFirst).toBeTruthy();
    expect(actualFirst.length).toBe(1);
  });

  it("must only add the block once", async () => {
    const mockLogseqClient = generateMoqseqClient({
      settings: {
        enable_empty_page_state: true,
      },
    });
    const page = await mockLogseqClient.createPage("test");
    assert(page);
    const pageBlocksBefore = await mockLogseqClient.getBlockTreeForPage(
      page.uuid
    );
    await ioAddEmptyStateBlock(pageBlocksBefore, page.uuid, mockLogseqClient);
    // Add the block once
    const pageBlocksAfter = await mockLogseqClient.getBlockTreeForPage(
      page.uuid
    );

    // Attempt to add the block a second time
    await ioAddEmptyStateBlock(pageBlocksAfter, page.uuid, mockLogseqClient);

    const actualSecond = await mockLogseqClient.getBlockTreeForPage(page.uuid);
    expect(actualSecond).toBeTruthy();
    expect(actualSecond.length).toBe(1);
  });

  it("must not add a block when `enable_empty_page_state` is disabled", async () => {
    const mockLogseqClient = generateMoqseqClient({
      settings: {
        enable_empty_page_state: false,
      },
    });
    const page = await mockLogseqClient.createPage("test");
    assert(page);
    const pageBlocksBefore = await mockLogseqClient.getBlockTreeForPage(
      page.uuid
    );
    await ioAddEmptyStateBlock(pageBlocksBefore, page.uuid, mockLogseqClient);

    const actual = await mockLogseqClient.getBlockTreeForPage(page.uuid);
    expect(actual).toBeTruthy();
    expect(actual.length).toBe(0);
  });
});

describe("ioRemoveEmptyStateBlock", () => {
  it("must remove the block", async () => {
    const mockLogseqClient = generateMoqseqClient({
      settings: {
        enable_empty_page_state: true,
      },
    });
    const page = await mockLogseqClient.createPage("test");
    assert(page);

    // Add the block
    await ioAddEmptyStateBlock([], page.uuid, mockLogseqClient);
    const pageBlocksAfter = await mockLogseqClient.getBlockTreeForPage(
      page.uuid
    );
    // Verify block is there
    const actualAfterAdd = await mockLogseqClient.getBlockTreeForPage(
      page.uuid
    );
    expect(actualAfterAdd).toBeTruthy();
    expect(actualAfterAdd.length).toBe(1);

    // Remove the block
    await ioRemoveEmptyStateBlock(pageBlocksAfter, mockLogseqClient);

    // Verify block is gone
    const actualAfterRemove = await mockLogseqClient.getBlockTreeForPage(
      page.uuid
    );
    expect(actualAfterRemove).toBeTruthy();
    expect(actualAfterRemove.length).toBe(0);
  });

  it("must not remove any other blocks", async () => {
    const mockLogseqClient = generateMoqseqClient({
      settings: {
        enable_empty_page_state: true,
      },
    });
    const page = await mockLogseqClient.createPage("test");
    assert(page);

    // Add a non-empty state block
    await mockLogseqClient.createBlock(page.uuid, "test", {
      sibling: false,
      before: false,
    });
    // Verify block is there
    const actualAfterAdd = await mockLogseqClient.getBlockTreeForPage(
      page.uuid
    );
    expect(actualAfterAdd).toBeTruthy();
    expect(actualAfterAdd.length).toBe(1);

    // Remove the block
    await ioRemoveEmptyStateBlock(actualAfterAdd, mockLogseqClient);

    // Verify non-empty state block is still there
    const actualAfterRemove = await mockLogseqClient.getBlockTreeForPage(
      page.uuid
    );
    expect(actualAfterRemove).toBeTruthy();
    expect(actualAfterRemove.length).toBe(1);
  });
});
