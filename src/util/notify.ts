import type { Raindrop } from "./Raindrop";

const notify = logseq.UI.showMsg;

export const alertDuplicatePageIdUsed = (r: Raindrop) => {
  notify(
    `You have duplicate pages for this article: \n${r.title}.\n\nWe'll use the oldest one, but you should merge these pages.`,
    "warning",
    { key: r.id, timeout: 5000 }
  );
};
