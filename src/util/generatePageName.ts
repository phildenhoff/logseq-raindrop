import type { Raindrop } from "@types";

/**
 * Create the name for a page using the Raindrop and any hierarchy.
 *
 * @param raindrop The Raindrop to create a name for
 * @param namespace A namespace to create pages in. If this string is empty,
 * no hierarchy is used.
 */
export const generatePageName = (
  raindrop: Raindrop,
  namespace: string
): string => {
  if (namespace.length === 0) {
    return raindrop.title;
  } else {
    return namespace + "/" + raindrop.title;
  }
};
