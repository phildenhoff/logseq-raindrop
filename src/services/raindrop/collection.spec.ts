import { assert, describe, expect, it, vi } from "vitest";

import { createCollectionUpdatedSinceGenerator } from "./collection.js";
import { httpClient } from "./http.js";
import { generateRaindropResponse } from "src/testing/raindropFactory.js";

vi.mock("./http.js", () => {
  const get = vi.fn();
  const post = vi.fn();

  return { httpClient: { get, post } };
});

/**
 * Creates a barely valid mock HTTP client response.
 * Do not trust this function to generate a valid Response. It probably is not
 * doing what you want it to.
 *
 * @param raindropResponseItems An array of raindrops to return
 * @returns A mock HTTP client response.
 */
const createMockHttpClientResponse = (
  raindropResponseItems: unknown[]
): Response => {
  return {
    json: async () => {
      return {
        items: raindropResponseItems,
        count: raindropResponseItems.length,
      };
    },
  } as unknown as Response;
};

describe("getCollectionUpdatedSince", () => {
  it("returns a list of raindrops", async () => {
    vi.mocked(httpClient)!.get.mockResolvedValueOnce(
      createMockHttpClientResponse([
        generateRaindropResponse({
          title: "Raindrop 1",
          lastUpdate: new Date("2020-01-01T00:00:00.000Z").toISOString(),
        }),
        generateRaindropResponse({
          title: "Raindrop 2",
          lastUpdate: new Date("2020-01-02T00:00:00.000Z").toISOString(),
        }),
      ])
    );
    const raindrops = await createCollectionUpdatedSinceGenerator(
      new Date("2020-01-01"),
      "0"
    ).next();

    assert(raindrops.value);
    expect(raindrops.value.length).toBe(2);
    expect(raindrops.value.at(0)).toHaveProperty("title", "Raindrop 1");
    expect(raindrops.value.at(1)).toHaveProperty("title", "Raindrop 2");
  });

  it("only returns raindrops updated since the given date", async () => {
    vi.mocked(httpClient)!.get.mockResolvedValueOnce(
      createMockHttpClientResponse([
        generateRaindropResponse({
          title: "Raindrop 1",
          lastUpdate: new Date("1999-01-01T00:00:00.000Z").toISOString(),
        }),
        generateRaindropResponse({
          title: "Raindrop 2",
          lastUpdate: new Date("2020-01-02T00:00:00.000Z").toISOString(),
        }),
      ])
    );
    const raindrops = await createCollectionUpdatedSinceGenerator(
      new Date("2020-01-02"),
      "0"
    ).next();

    assert(raindrops.value);
    expect(raindrops.value.length).toBe(1);
    expect(raindrops.value.at(0)).toHaveProperty("title", "Raindrop 2");
  });

  it("returns pages of raindrops", async () => {
    const pastDate = new Date("2019-01-01T00:00:00.000Z");
    const moreRecentThanPastDate = new Date("2020-01-01T00:00:00.000Z");
    vi.mocked(httpClient)!.get.mockResolvedValueOnce(
      createMockHttpClientResponse([
        generateRaindropResponse({
          title: "Raindrop 1",
          lastUpdate: moreRecentThanPastDate.toISOString(),
        }),
      ])
    );
    const generator = createCollectionUpdatedSinceGenerator(pastDate, "0");

    // First page of data
    const actual1 = await generator.next();

    assert(actual1.value);
    expect(actual1.value.length).toBe(1);
    expect(actual1.value.at(0)).toHaveProperty("title", "Raindrop 1");

    // Second page of data
    vi.mocked(httpClient)!.get.mockResolvedValueOnce(
      createMockHttpClientResponse([
        generateRaindropResponse({
          title: "Raindrop 2",
          lastUpdate: moreRecentThanPastDate.toISOString(),
        }),
      ])
    );

    const actual2 = await generator.next();

    assert(actual2.value);
    expect(actual2.value.length).toBe(1);
    expect(actual2.value.at(0)).toHaveProperty("title", "Raindrop 2");
  });

  it("returns done when there are no more raindrops", async () => {
    vi.mocked(httpClient)!.get.mockResolvedValueOnce(
      createMockHttpClientResponse([])
    );
    const generator = createCollectionUpdatedSinceGenerator(
      new Date("2020-01-01"),
      "0"
    );
    const actual = await generator.next();
    expect(actual.done).toBe(true);
  });
});
