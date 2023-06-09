import { httpClient } from "./http.js";
import {
  raindropTransformer,
  type RaindropResponse,
} from "@util/raindropTransformer.js";

type CollectionResponse = {
  result: boolean;
  items?: RaindropResponse[];
  count: number;
  collectionId: "string";
};

export const searchTerm = async (query: string, collectionId: string = "0") => {
  if (!httpClient) {
    throw new Error("Raindrop client not initialized");
  }

  return httpClient.get(`/raindrops/${collectionId}?search=${query}`);
};

/**
 * Creates a generator that returns a list of Raindrops that have been updated
 * after the given `since` date.
 *
 * @param since A date, used to keep only the raindrops updated since this date.
 * @param collectionId The id of the collection to fetch.
 * @param params Additional query parameters
 * @returns A generator that can be used to get each page of results.
 *
 * @example
 * const raindrops = await createCollectionUpdatedSinceGenerator(
 *   new Date("2020-01-01"),
 *   "0"
 * ).next();
 * // raindrops is an object with a done and a value
 * // the generator is done when there is no more content.
 * // value is a list of Raindrops
 */
export async function* createCollectionUpdatedSinceGenerator(
  since: Date,
  collectionId: string = "0",
  params?: {
    perPage?: number;
  }
) {
  if (!httpClient) {
    throw new Error("Raindrop client not initialized");
  }
  let pageOffset = 0;

  while (true) {
    const response = await httpClient.get(
      `/raindrops/${collectionId}?sort-lastUpdate&perpage=${
        params?.perPage ?? 10
      }&page=${pageOffset}`
    );
    const raindrops = (await response.json()) as CollectionResponse;
    const raindropsUpdatedSince = (raindrops.items ?? []).filter(
      (r) => new Date(r.lastUpdate) >= since
    );

    if (raindropsUpdatedSince.length === 0) break;
    yield raindropsUpdatedSince.map(raindropTransformer);

    pageOffset += 1;
  }
  return;
}
