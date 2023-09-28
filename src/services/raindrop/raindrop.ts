import type { Raindrop } from "@types";
import type { Result } from "true-myth";
import { err, ok } from "true-myth/result";

import { httpClient } from "./http.js";
import { raindropTransformer } from "./normalize.js";

const getRaindropFromApi = async (
  id: Raindrop["id"]
): Promise<Result<unknown, string>> => {
  if (!httpClient) {
    return err("Raindrop client not initialized");
  }
  try {
    const res = await httpClient.get(`/raindrop/${id}`);
    if (res.status !== 200) {
      return err("Request not successful");
    }

    const resJson = (await res.json()) as unknown;
    if (typeof resJson !== "object" || !resJson || !("item" in resJson)) {
      return err("Invalid response");
    }

    return ok(resJson.item);
  } catch (e) {
    return err("Getting Raindrop failed");
  }
};

export const getRaindrop = async (
  id: Raindrop["id"]
): Promise<Result<Raindrop, string>> => {
  const apiResponse = await getRaindropFromApi(id);

  if (apiResponse.isErr) {
    return err("Getting Raindrop failed");
  }
  const normalizedResponse = raindropTransformer(apiResponse.value);
  return ok(normalizedResponse);
};

export const createRaindrop = async ({ link }: { link: string }) => {
  if (!httpClient) {
    throw new Error("Raindrop client not initialized");
  }

  try {
    const res = await httpClient.post("/raindrop", {
      link,
      pleaseParse: {},
    });
    return ok(res);
  } catch {
    return err("Creating Raindrop failed");
  }
};
