import type { Raindrop } from "@types";
import type { Maybe } from "true-myth";

export interface RaindropClient {
  getRaindrop: (id: Raindrop["id"]) => Promise<Maybe<Raindrop>>;
  searchTerm: (query: string, collectionId: string) => Promise<Response>;
}
