import { generateMoqseqClient } from "src/services/logseq/mock/client.js";
import { describe, expect, it } from "vitest";
import { findPagesByRaindropID } from "./getBlockBy.js";
import type { LSBlockEntity, LSPageEntity } from "src/services/interfaces.js";

// Created by running the query "(property raindrop-id 457389317)" on
// my Logseq database, and then removing the following non-supported fields:
// - pathRefs
// - propertiesTextValues
// - preBlock
// - refs
const exampleBlockResponse: LSBlockEntity[] = [
  {
    properties: {
      title: "logseq-raindrop/12 Factor App Revisited",
      raindropId: 457389317,
      raindropTitle: "12 Factor App Revisited",
      raindropUrl: "https://architecturenotes.co/12-factor-app-revisited/",
    },
    parent: {
      id: 33217,
    },
    id: 33219,
    uuid: "64233cd1-ed3f-43d9-a0b9-cd3522f4ba4c",
    content:
      "title:: logseq-raindrop/12 Factor App Revisited\nraindrop-id:: 457389317\nraindrop-title:: 12 Factor App Revisited\nraindrop-url:: https://architecturenotes.co/12-factor-app-revisited/\ntags::\n\n",
    page: {
      name: "logseq-raindrop/12 factor app revisited",
      originalName: "logseq-raindrop/12 Factor App Revisited",
      id: 33217,
    },
    left: {
      id: 33217,
    },
    format: "markdown",
  },
];
// Created by running the query "(page-property raindrop-id 457389317)" on
// my Logseq database, and then removing the following non-supported fields:
// - createdAt
// - propertiesTextValues
const examplePageResponse: LSPageEntity[] = [
  {
    properties: {
      title: "logseq-raindrop/12 Factor App Revisited",
      raindropId: 457389317,
      raindropTitle: "12 Factor App Revisited",
      raindropUrl: "https://architecturenotes.co/12-factor-app-revisited/",
    },
    updatedAt: 1680030929310,
    id: 33217,
    name: "logseq-raindrop/12 factor app revisited",
    uuid: "64233cd1-ec8f-427b-97ed-2ea4a6334070",
    "journal?": false,
    originalName: "logseq-raindrop/12 Factor App Revisited",
    file: {
      id: 33216,
    },
    namespace: {
      id: 56,
    },
  },
];

const pageForBlockReference: LSPageEntity = {
  id: 33217,
  uuid: "64233cd1-ed3f-43d9-a0b9-cd3522f4ba4c",
  name: "logseq-raindrop/12 factor app revisited",
  originalName: "logseq-raindrop/12 Factor App Revisited",
  "journal?": false,
};

describe("findPagesByRaindropId", () => {
  it("must return an array of pages", async () => {
    const mockClient = generateMoqseqClient({
      defaultPages: [pageForBlockReference],
    });
    mockClient.PRIVATE_FOR_TESTING.setDbQueryResponseGenerator(function* () {
      // First, we mock retrieving blocks
      yield exampleBlockResponse;
      // Then pages
      yield examplePageResponse;
    });

    const result = await findPagesByRaindropID("457389317", mockClient);
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(1);
    expect(result).toEqual(examplePageResponse);
  });

  it("returns recently-added, non-indexed pages", async () => {
    // When pages are not indexed, the query to page-property does not
    // return them
    const mockClient = generateMoqseqClient({
      defaultPages: [pageForBlockReference],
    });
    mockClient.PRIVATE_FOR_TESTING.setDbQueryResponseGenerator(function* () {
      // We mock retrieving blocks
      yield exampleBlockResponse;
      // And then pages — this time, the query to page-property returns
      // no pages
      yield [];
    });

    const result = await findPagesByRaindropID("457389317", mockClient);
    expect(result[0]).toEqual(pageForBlockReference);
  });
});
