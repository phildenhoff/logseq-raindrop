import { httpClient } from "./http.js";

export const searchTerm = async (query: string, collectionId: string = "0") => {
  if (!httpClient) {
    throw new Error("Raindrop client not initialized");
  }

  return httpClient.get(`/raindrops/${collectionId}?search=${query}`);
};

export async function* getCollectionUpdatedSince(
  since: Date,
  collectionId: string = "0",
  params?: {
    perPage?: number;
  }
) {
  let pageOffset = 0;
  yield httpClient.get(
    `/raindrops/${collectionId}?sort-lastUpdate&perpage=${
      params?.perPage ?? 10
    }&page=${pageOffset}`
  );
}
