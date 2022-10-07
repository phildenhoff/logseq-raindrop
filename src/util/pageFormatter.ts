import type { Raindrop } from "@types";

export const formatRaindropToProperties = (
  r: Raindrop
): Record<string, string> => {
  return {
    "raindrop-id": r.id,
    "raindrop-title": r.title,
    "raindrop-url": r.url.toString(),
    tags: r.tags.map((tag) => `[[${tag}]]`).join(" "),
  };
};
