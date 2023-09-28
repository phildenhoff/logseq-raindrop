import type { Raindrop } from "@types";
import { httpClient } from "./http.js";
import type { Result } from "true-myth";
import { err, ok } from "true-myth/result";
import { raindropTransformer } from "@services/raindrop/normalize.js";

export const getRaindrop = async (
  id: Raindrop["id"]
): Promise<Result<Raindrop, string>> => {
  if (!httpClient) {
    throw new Error("Raindrop client not initialized");
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

    const transformed = raindropTransformer(
      // @ts-expect-error TODO: Parse resJson.item to ensure it's valid
      resJson.item
    );
    return ok(transformed);
  } catch (e) {
    console.error(e);

    return err("Getting Raindrop failed");
  }
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
