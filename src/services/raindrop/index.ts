import { setupHttpClient } from "./http.js";

export { normalizeApiRaindrop, type RaindropResponse } from "./normalize.js";

export * from "./raindrop.js";
export * from "./collection.js";

export const setupRaindropHttpClient = setupHttpClient;
