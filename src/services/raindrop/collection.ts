import { httpClient } from "./http.js";

export const searchTerm = async (query: string, collectionId: string = "0") => {
  if (!httpClient) {
    throw new Error("Raindrop client not initialized");
  }

  return httpClient.get(`/raindrops/${collectionId}?search=${query}`);
};
