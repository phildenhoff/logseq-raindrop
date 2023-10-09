import type { Raindrop } from "@types";

type DefaultProperties = {
  tags: string;
};

/**
 * Returns a string of tags to be added to the page
 * @param tagList The list of tags from Raindrop
 * @param defaultTags The user's default tags. This can be an empty string.
 */
const generateTags = (tagList: Raindrop["tags"], defaultTags: string) => {
  const separator = defaultTags.length > 0 ? " " : "";
  return defaultTags + separator + tagList.map((tag) => `[[${tag}]]`).join(" ");
};

export const formatRaindropToProperties = (
  r: Raindrop,
  defaults?: DefaultProperties | undefined
): Record<string, string> => {
  return {
    "raindrop-id": r.id,
    "raindrop-title": r.title,
    "raindrop-url": r.url.toString(),
    "raindrop-note": r.note,
    tags: generateTags(r.tags, defaults?.tags ?? ""),
  };
};
