import { describe, expect, it } from "vitest";
import { applyAsyncFunc } from "./async.js";

describe("applyAsyncFunc", () => {
  it("applies async function", async () => {
    const items = [1, 2, 3];
    const f = async (item: number) => item * 2;
    const expectedOutput = [2, 4, 6];
    const result = await applyAsyncFunc(items, f);
    expect(result).toEqual(expectedOutput);
  });

  it("works with an empty array", async () => {
    const items: number[] = [];
    const f = async (item: number) => item * 2;
    const expectedOutput: number[] = [];
    const result = await applyAsyncFunc(items, f);
    expect(result).toEqual(expectedOutput);
  });

  it("rejects when any item rejects", async () => {
    const items = [1, 2, 3];
    const f = async (item: number) => {
      if (item === 2) {
        throw new Error("Rejected promise");
      }
      return item * 2;
    };
    await expect(applyAsyncFunc(items, f)).rejects.toThrow("Rejected promise");
  });

  it("returns results in the input order", async () => {
    const items = [1, 2, 3];
    const f = async (item: number) => {
      if (item === 2) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
      return item * 2;
    };
    const expectedOutput = [2, 4, 6];
    const result = await applyAsyncFunc(items, f);
    expect(result).toEqual(expectedOutput);
  });
});
