import { generateMoqseqClient } from "@services/logseq/mock/client.js";
import type { Raindrop } from "@types";
import { assert, describe, expect, it } from "vitest";
import { generateRaindrop } from "./testing/raindropFactory.js";
import { importRaindropsFromGenerator } from "./importHighlights.js";

describe("importRaindropsFromGenerator", () => {
  it("must insert new blocks above old blocks", async () => {
    /*
      Before:
      Raindrop (page)
        - # Articles
          - Older Import 1
          - Older Import 2

      After (expected):
      Raindrop (page)
        - # Articles
          - Newest Import
          - New Import
          - Older Import 1
          - Older Import 2
    */
    const mockClient = generateMoqseqClient({
      defaultPages: [
        {
          name: "Raindrop",
          originalName: "Raindrop",
          id: 1,
          uuid: "raindrop-1",
          "journal?": false,
        },
      ],
      defaultBlocks: [
        {
          parent: {
            id: 1,
          },
          page: {
            id: 1,
            uuid: "raindrop-1",
          },
          id: 2,
          uuid: "articles-list-block",
          left: {
            id: 1,
          },
          format: "markdown",
          content: "# Articles",
        },
        {
          parent: {
            id: 2,
          },
          page: {
            id: 1,
            uuid: "raindrop-1",
          },
          id: 3,
          uuid: "older-import-1",
          left: {
            id: 2,
          },
          format: "markdown",
          content: "Older Import 1",
        },
        {
          parent: {
            id: 2,
          },
          page: {
            id: 1,
            uuid: "raindrop-1",
          },
          id: 4,
          uuid: "older-import-2",
          left: {
            id: 3,
          },
          format: "markdown",
          content: "Older Import 2",
        },
      ],
      settings: {
        highlight_mustache_template: "> {{{text}}}",
        bookmark_mustache_template: "[{{{title}}}]({{{url}}})",
      },
    });

    const newBlocks: Record<string, Raindrop> = {
      newImport: generateRaindrop({
        title: "New Import",
      }),
      newestImport: generateRaindrop({
        title: "Newest Import",
      }),
    };

    const generator: AsyncGenerator<Raindrop[]> = (async function* () {
      // The `createCollectionUpdatedSinceGenerator` must return the most recently
      // updated items first, so we do the same.
      yield Promise.resolve([newBlocks.newestImport]);
      yield Promise.resolve([newBlocks.newImport]);
    })();

    await importRaindropsFromGenerator(
      generator,
      mockClient,
      (await mockClient.getBlockById("articles-list-block"))!
    );

    const blockTree = await mockClient.getBlockTreeForPage("raindrop-1");

    const newImportBlock = blockTree
      .filter((item) => item.content.includes("New Import"))
      .at(0);
    const newestImportBlock = blockTree
      .filter((item) => item.content.includes("Newest Import"))
      .at(0);

    assert(newImportBlock);
    assert(newestImportBlock);

    expect(newestImportBlock.left).toEqual({
      id: 2,
      uuid: "articles-list-block",
    });
    expect(newImportBlock.left).toEqual({
      id: newestImportBlock.id,
      uuid: newestImportBlock.uuid,
    });
  });
});
