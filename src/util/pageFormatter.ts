import type { Raindrop } from "./Raindrop";

export const formatRaindropToProperties = (r: Raindrop): Record<string, string> => {
  return {
    "raindrop-id": r.id,
    "raindrop-title": r.title,
    "raindrop-url": r.url.toString(),
  }
}

