import type { LSBlockEntity } from "src/services/interfaces.js";
import { describe, expect, it } from "vitest";
import {
  blockHasProperty,
  filterBlocksWithProperty,
  someBlockHasProperty,
} from "./blocks.js";

const generateBlockWithProps = (
  props: Record<string, unknown>
): LSBlockEntity & Required<Pick<LSBlockEntity, "properties">> =>
  ({
    uuid: "uuid",
    properties: props,
    id: 1,
    left: {
      id: 2,
    },
    format: "markdown",
    parent: {
      id: 4,
    },
    unordered: true,
    content: "block content",
    page: {
      id: 4,
    },
  } as const);

describe("blockHasProperty", () => {
  it("returns true if a block has a property exactly matching", async () => {
    const original = generateBlockWithProps({ exactMatch: "all good" });
    const queryPropertyName = "exactMatch";
    const actual = await blockHasProperty(original, queryPropertyName);

    expect(actual).toBe(true);
  });

  it("returns true if a block has a property with different casing", async () => {
    const original = generateBlockWithProps({ caseInsensitive: "all good" });
    const queryPropertyName = "CaSeInSeNsItIvE";
    const actual = await blockHasProperty(original, queryPropertyName);

    expect(actual).toBe(true);
  });
});

describe("someBlockHasProperty", () => {
  it("returns true if any block has a property exactly matching", async () => {
    const blocks = [
      generateBlockWithProps({ prop1: "value" }),
      generateBlockWithProps({ prop2: "value" }),
      generateBlockWithProps({ prop3: "value" }),
    ];
    const queryPropertyName = "prop2";
    const actual = await someBlockHasProperty(blocks, queryPropertyName);

    expect(actual).toBe(true);
  });

  it("returns true if any block has a property with different casing", async () => {
    const blocks = [
      generateBlockWithProps({ prop1: "value" }),
      generateBlockWithProps({ prop2: "value" }),
      generateBlockWithProps({ prop3: "value" }),
    ];
    const queryPropertyName = "PROP2";
    const actual = await someBlockHasProperty(blocks, queryPropertyName);

    expect(actual).toBe(true);
  });
});

describe("filterBlocksWithProperty", () => {
  it("returns only blocks with a property exactly matching or with different casing", async () => {
    const blocks = [
      generateBlockWithProps({ prop1: "value" }),
      generateBlockWithProps({ prop2: "value" }),
      generateBlockWithProps({ PROP2: "value" }),
      generateBlockWithProps({ prop3: "value" }),
    ];
    const queryPropertyName = "prop2";
    const actual = await filterBlocksWithProperty(blocks, queryPropertyName);

    expect(actual.length).toBe(2);
    expect(actual[0].properties).toHaveProperty("prop2");
    expect(actual[1].properties).toHaveProperty("PROP2");
  });
});
