import { describe, expect, it } from "vitest";
import { relaxedUniqueBy, uniqueBy } from "./unique.js";

describe("uniqueBy", () => {
  it("filters out non-unique items", async () => {
    const objects = [
      { label: "a", value: 1 },
      { label: "b", value: 2 },
      { label: "a", value: 3 },
    ];
    const expectedOutput = [
      { label: "a", value: 1 },
      { label: "b", value: 2 },
    ];

    const result = uniqueBy("label", objects);

    expect(result).toEqual(expectedOutput);
  });

  it("throws if any item does not have the key", async () => {
    const objects = [
      { label: "a", value: 1 },
      { label: "b", value: 2 },
      { label: "a", value: 3 },
      { value: 4 },
    ];

    expect(() => uniqueBy("label", objects)).toThrow();
  });
});

describe("relaxedUniqueBy", () => {
  it("does not throw if any object does not have the key", async () => {
    const objects = [
      { label: "a", value: 1 },
      { label: "b", value: 2 },
      { label: "a", value: 3 },
      { value: 4 },
    ];
    const expectedOutput = [
      { label: "a", value: 1 },
      { label: "b", value: 2 },
      { value: 4 },
    ];

    const result = relaxedUniqueBy("label", objects);

    expect(result).toEqual(expectedOutput);
  });
});
