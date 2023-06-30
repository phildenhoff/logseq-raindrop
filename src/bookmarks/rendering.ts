import type { AppUserConfigs } from "@logseq/libs/dist/LSPlugin.user.js";
import { formatDateUserPreference } from "@services/logseq/formatting.js";
import type { Annotation, Raindrop } from "@types";

export const renderHighlight = (highlight: Annotation) => {
  return [`> ${highlight.text}`, "", `${highlight.note}`].join("\n");
};

export const renderBookmark = (
  bookmark: Raindrop,
  userConfig: AppUserConfigs
) => {
  return `[${bookmark.title}](${bookmark.url})
title:: ${bookmark.title}
url:: ${bookmark.url}
Tags:: ${bookmark.tags.join(", ")}
date-saved:: [[${formatDateUserPreference(bookmark.created, userConfig)}]]
last-updated:: [[${formatDateUserPreference(
    bookmark.lastUpdate,
    userConfig
  )}]]`;
};
