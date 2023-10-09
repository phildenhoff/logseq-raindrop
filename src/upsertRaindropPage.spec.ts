import { describe, it, expect, assert } from "vitest";

import type { LSBlockEntity, LSPageEntity } from "@services/interfaces.js";
import type { Annotation, Raindrop } from "@types";
import type { PageEntityWithRootBlocks } from "@services/logseq/mock/types.js";
import { generateMoqseqClient } from "@services/logseq/mock/client.js";

import { __TESTING } from "./upsertRaindropPage.js";

const {
  ioMaybeGetPageForRaindrop,
  ioCreateOrLoadPage,
  ioCreateAnnotationBlock,
  ioUpsertAnnotationBlocks,
} = __TESTING;

const emptyQueryGenerator = function* () {
  // Blocks
  yield [];
  // Pages
  yield [];
};

describe("ioMaybeGetPageForRaindrop", () => {
  it("returns the oldest if multiple pages match the ID", async () => {
    const logseqClient = generateMoqseqClient({});
    logseqClient.PRIVATE_FOR_TESTING.setDbQueryResponseGenerator(function* () {
      // Matching blocks
      yield [];

      // Then Pages
      let oldPage: LSPageEntity & Record<"createdAt", Date> = {
        id: 2020,
        uuid: "2020",
        name: "Page 1",
        originalName: "Page 1",
        "journal?": false,
        createdAt: new Date("2020-01-01"),
        properties: {
          "raindrop-id": 123,
        },
      };
      let newPage: LSPageEntity & Record<"createdAt", Date> = {
        id: 2022,
        uuid: "2022",
        name: "Page 2",
        originalName: "Page 2",
        "journal?": false,
        createdAt: new Date("2022-01-01"),
        properties: {
          "raindrop-id": 123,
        },
      };
      yield [newPage, oldPage];
    });
    const maybePage = await ioMaybeGetPageForRaindrop(
      {
        id: "123",
        title: "",
        note: "",
        description: "",
        annotations: [],
        tags: [],
        coverImage: "",
        created: new Date(),
        lastUpdate: new Date(),
        url: new URL("https://example.com"),
      },
      logseqClient
    );

    expect(maybePage.isJust).toBe(true);
    if (maybePage.isJust) {
      expect(maybePage.value.name).toBe("Page 1");
    }
  });

  it("returns nothing if a page was not found", async () => {
    const logseqClient = generateMoqseqClient({});
    logseqClient.PRIVATE_FOR_TESTING.setDbQueryResponseGenerator(
      emptyQueryGenerator
    );
    const maybePage = await ioMaybeGetPageForRaindrop(
      {
        id: "123",
        title: "",
        note: "",
        description: "",
        annotations: [],
        tags: [],
        coverImage: "",
        created: new Date(),
        lastUpdate: new Date(),
        url: new URL("https://example.com"),
      },
      logseqClient
    );

    expect(maybePage.isNothing).toBe(true);
  });
});

describe("ioCreateOrLoadPage", () => {
  it("creates a page if it does not exist", async () => {
    const namespaceLabel = "logseq-raindrop";
    const raindropTitle = "RD1";
    const raindropId = "123";
    const expectedPageName = "logseq-raindrop/RD1";

    const logseqClient = generateMoqseqClient({
      settings: {
        default_page_tags: "",
        namespace_label: namespaceLabel,
      },
    });
    logseqClient.PRIVATE_FOR_TESTING.setDbQueryResponseGenerator(
      emptyQueryGenerator
    );

    await ioCreateOrLoadPage(
      {
        id: raindropId,
        title: raindropTitle,
        note: "",
        description: "",
        annotations: [],
        tags: [],
        coverImage: "",
        created: new Date(),
        lastUpdate: new Date(),
        url: new URL("https://example.com"),
      },
      logseqClient
    );

    const currentPage = await logseqClient.getFocusedPageOrBlock();
    assert(currentPage);

    const propBlock = (await logseqClient.getBlockTreeForCurrentPage()).at(0);
    assert(propBlock);

    assert("name" in currentPage);
    expect(currentPage.name).toBe(expectedPageName);

    assert("properties" in propBlock);
    assert(propBlock.properties !== undefined);
    expect(propBlock.properties["raindropId"]).toBe(raindropId);
  });

  it("opens a page if it exists", async () => {
    const namespaceLabel = "logseq-raindrop";
    const raindropTitle = "RD1";
    const raindropId = "123";
    const expectedPageName = "logseq-raindrop/RD1";

    const existingRdPage: PageEntityWithRootBlocks & Record<"createdAt", Date> =
      {
        id: 2020,
        uuid: "2020",
        name: expectedPageName,
        originalName: expectedPageName,
        "journal?": false,
        createdAt: new Date("2020-01-01"),
        properties: {
          "raindrop-id": raindropId,
        },
        roots: [["uuid", "rd-props"]],
      };
    const existingRdPagePropBlock: LSBlockEntity = {
      id: 4040,
      uuid: "rd-props",
      properties: {
        "raindrop-id": raindropId,
      },
      preBlock: true,
      left: {
        id: existingRdPage.id,
      },
      parent: {
        id: existingRdPage.id,
      },
      content: "",
      format: "markdown",
      page: {
        id: existingRdPage.id,
      },
    };

    const logseqClient = generateMoqseqClient({
      settings: {
        default_page_tags: "",
        namespace_label: namespaceLabel,
      },
      defaultPages: [existingRdPage],
      defaultBlocks: [existingRdPagePropBlock],
    });
    logseqClient.PRIVATE_FOR_TESTING.setDbQueryResponseGenerator(function* () {
      // Matching blocks
      yield [];

      // Then Pages
      yield [existingRdPage];
    });

    await ioCreateOrLoadPage(
      {
        id: raindropId,
        title: raindropTitle,
        note: "",
        description: "",
        annotations: [],
        tags: [],
        coverImage: "",
        created: new Date(),
        lastUpdate: new Date(),
        url: new URL("https://example.com"),
      },
      logseqClient
    );

    const currentPage = await logseqClient.getFocusedPageOrBlock();
    assert(currentPage);

    const propBlock = (await logseqClient.getBlockTreeForCurrentPage()).at(0);
    assert(propBlock);

    assert("name" in currentPage);
    expect(currentPage.name).toBe(expectedPageName);

    assert("properties" in propBlock);
    assert(propBlock.properties !== undefined);
    expect(propBlock.properties["raindropId"]).toBe(raindropId);
  });
});

describe("ioCreateAnnotationBlock", () => {
  it("creates a new annotation block", async () => {
    const noteText = "this is a note";
    const highlightedText = "this is highlighted";
    const annotationId = "annotid";

    const logseqClient = generateMoqseqClient({
      settings: {
        template_highlight: "> {text}",
        template_annotation: "{text}",
      },
    });

    const page = await logseqClient.createPage("Page 1");
    assert(page);

    const annotation: Annotation = {
      id: annotationId,
      created: new Date(),
      note: noteText,
      color: "yellow",
      text: highlightedText,
    };

    await ioCreateAnnotationBlock(annotation, page, logseqClient);

    const blocks = await logseqClient.getBlockTreeForPage(page.uuid);
    assert(blocks);
    const firstBlock = blocks.at(0);
    assert(firstBlock, "Annotation block was not created");

    expect(firstBlock.content).includes(highlightedText);
    expect(firstBlock.content).includes(noteText);
    assert("properties" in firstBlock, "Block must have properties");
    expect(firstBlock.properties).toHaveProperty("annotationId", annotationId);
  });

  it("creates new annotations below existing annotations", async () => {
    const logseqClient = generateMoqseqClient({
      settings: {
        template_highlight: "> {text}",
        template_annotation: "{text}",
      },
    });

    const page = await logseqClient.createPage("Page 1");
    assert(page);

    const annotationOne: Annotation = {
      id: "one",
      created: new Date(),
      note: "Note 1",
      color: "yellow",
      text: "Highlight 1",
    };
    const annotationTwo: Annotation = {
      id: "two",
      created: new Date(),
      note: "Note 2",
      color: "yellow",
      text: "Highlight 2",
    };

    await ioCreateAnnotationBlock(annotationOne, page, logseqClient);
    await ioCreateAnnotationBlock(annotationTwo, page, logseqClient);

    const blocks = await logseqClient.getBlockTreeForPage(page.uuid);
    assert(blocks);
    const firstBlock = blocks.at(0);
    assert(firstBlock);
    const secondBlock = blocks.at(1);
    assert(secondBlock);

    expect(firstBlock.content).includes("1");
    expect(firstBlock.content).includes("1");
    expect(secondBlock.content).includes("2");
    expect(secondBlock.content).includes("2");
  });
});

describe("ioUpsertAnnotationBlocks", () => {
  it("creates a new annotation block", async () => {
    const raindrop: Raindrop = {
      id: "123",
      title: "RD1",
      note: "note on rd1",
      description: "",
      annotations: [
        {
          id: "annotation1",
          created: new Date(),
          note: "this is a note",
          color: "yellow",
          text: "this is highlighted",
        },
      ],
      tags: [],
      coverImage: "",
      url: new URL("https://example.com"),
      created: new Date(),
      lastUpdate: new Date(),
    };

    const logseqClient = generateMoqseqClient({
      settings: {
        template_highlight: "> {text}",
        template_annotation: "{text}",
      },
    });
    const page = await logseqClient.createPage(
      "Page 1",
      {},
      { redirect: true }
    );
    assert(page);

    await ioUpsertAnnotationBlocks(raindrop, page, logseqClient);

    const blocks = await logseqClient.getBlockTreeForPage(page.uuid);
    assert(blocks);
    const propBlock = blocks.at(0);
    assert(propBlock);
    const firstContentBlock = blocks.at(1);
    assert(firstContentBlock);
    expect(firstContentBlock.content).includes("this is highlighted");
  });

  it.skip("updates existing annotation blocks", async () => {
    const raindropBefore: Raindrop = {
      id: "123",
      title: "RD1",
      note: "note on rd1",
      description: "",
      annotations: [
        {
          id: "annotation1",
          created: new Date(),
          note: "note Before",
          color: "yellow",
          text: "highlightBefore",
        },
      ],
      tags: [],
      coverImage: "",
      url: new URL("https://example.com"),
      created: new Date(),
      lastUpdate: new Date(),
    };
    const raindropAfter: Raindrop = {
      id: "123",
      title: "RD1",
      note: "note on rd1",
      description: "",
      annotations: [
        {
          id: "annotation1",
          created: new Date(),
          note: "note After",
          color: "yellow",
          text: "highlightAfter",
        },
      ],
      tags: [],
      coverImage: "",
      url: new URL("https://example.com"),
      created: new Date(),
      lastUpdate: new Date(),
    };

    const logseqClient = generateMoqseqClient({
      settings: {
        formatting_template: {
          highlight: "> {text}",
          annotation: "{text}",
        },
      },
    });
    const page = await logseqClient.createPage(
      "Page 1",
      {},
      { redirect: true }
    );
    assert(page);

    // Insert original annotation
    await ioUpsertAnnotationBlocks(raindropBefore, page, logseqClient);

    // Verify annotation was inserted
    const blocksBefore = await logseqClient.getBlockTreeForPage(page.uuid);
    assert(blocksBefore);
    const firstBlockBefore = blocksBefore.at(0);
    assert(firstBlockBefore);
    expect(firstBlockBefore.content).includes("note Before");
    expect(firstBlockBefore.content).includes("highlightBefore");

    // Update existing annotation by ID
    await ioUpsertAnnotationBlocks(raindropAfter, page, logseqClient);
    // Verify annotation was updated
    const blocksAfter = await logseqClient.getBlockTreeForPage(page.uuid);
    assert(blocksAfter);
    const firstBlockAfter = blocksAfter.at(0);
    assert(firstBlockAfter);
    expect(firstBlockAfter.content).includes("note After");
    expect(firstBlockAfter.content).includes("highlightAfter");
  });
});
