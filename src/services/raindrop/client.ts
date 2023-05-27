import { raindropTransformer } from "@util/raindropTransformer.js";
import { just, nothing } from "true-myth/maybe";

import type { RaindropClient } from "./interfaces.js";
import { generateHttpClient } from "./http.js";

const DEFAULT_BASE_URL = "https://api.raindrop.io";

export const raindropClientCtxKey = Symbol();

export const generateRaindropClient = (options: {
  accessToken: string;
  baseUrl?: string;
  apiVersion?: "v1";
}): RaindropClient => {
  const apiUrl = `${options.baseUrl ?? DEFAULT_BASE_URL}/rest/${
    options.apiVersion ?? "v1"
  }`;
  const httpClient = generateHttpClient({
    apiUrl,
    accessToken: options.accessToken,
  });

  return {
    getRaindrop: async (id) => {
      try {
        const res = await httpClient.getRaindrop(id);
        if (res.status !== 200) {
          throw new Error("Request not successful");
        }

        const resJson = (await res.json()) as unknown;
        if (typeof resJson !== "object" || !resJson || !("item" in resJson)) {
          throw new Error("Invalid response");
        }

        // @ts-expect-error TODO: Parse the item to make sure it can be transformed
        const transformed = raindropTransformer(resJson.item);
        return just(transformed);
      } catch {
        return nothing();
      }
    },
    searchTerm: async (query, collectionId = "0") => {
      return await httpClient.search(query, collectionId);
    },
  };
};
