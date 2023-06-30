import Mustache from "mustache";

import type { AppUserConfigs } from "@logseq/libs/dist/LSPlugin.user.js";
import { formatDateUserPreference } from "@services/logseq/formatting.js";
import type { Annotation, Raindrop } from "@types";

type HighlightView = {
  text: string;
  note: string;
};
type BookmarkView = {
  title: string;
  url: string;
  tags: string;
  dateCreated: string;
  dateUpdated: string;
};

const defaultHighlightTemplate = `> {{{text}}}

{{{note}}}`;
const defaultBookmarkTemplate = `[{{{title}}}]({{{url}}})
title:: {{{title}}}
url:: {{{url}}}
Tags:: {{{tags}}}
date-saved:: [[{{{dateCreated}}}]]
last-updated:: [[{{{dateUpdated})}]]`;

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
    url: bookmark.url.toString(),
    tags: bookmark.tags.join(", "),
    dateCreated: formatDateUserPreference(bookmark.created, userConfig),
    dateUpdated: formatDateUserPreference(bookmark.lastUpdate, userConfig),
  };
};

export const renderHighlight = (highlight: Annotation) => {
  return Mustache.render(
    defaultHighlightTemplate,
    createHighlightRenderView(highlight)
  );
};

export const renderBookmark = (
  bookmark: Raindrop,
  userConfig: AppUserConfigs
) => {
  return Mustache.render(
    defaultBookmarkTemplate,
    createBookmarkRenderView(bookmark, userConfig)
  );
};
