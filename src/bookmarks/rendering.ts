import Mustache from "mustache";

import type { AppUserConfigs } from "@logseq/libs/dist/LSPlugin.user.js";
import { formatDateUserPreference } from "@services/logseq/formatting.js";

import type { Annotation, Raindrop } from "@types";

import type { BookmarkView, HighlightView } from "./views.js";

export const createHighlightRenderView = (
  highlight: Annotation
): HighlightView => {
  return {
    text: highlight.text,
    note: highlight.note,
  };
};

export const createBookmarkRenderView = (
  bookmark: Raindrop,
  userConfig: AppUserConfigs
): BookmarkView => {
  return {
    title: bookmark.title,
    note: bookmark.note,
    url: bookmark.url.toString(),
    tags: bookmark.tags.join(", "),
    dateCreated: formatDateUserPreference(bookmark.created, userConfig),
    dateUpdated: formatDateUserPreference(bookmark.lastUpdate, userConfig),
  };
};

export const renderHighlight = (highlight: Annotation, template: string) => {
  return Mustache.render(template, createHighlightRenderView(highlight));
};

export const renderBookmark = (
  bookmark: Raindrop,
  userConfig: AppUserConfigs,
  template: string
) => {
  return Mustache.render(
    template,
    createBookmarkRenderView(bookmark, userConfig)
  );
};
