import Mustache from "mustache";
import { isOk, type Ok } from "true-myth/result";

import { createRaindrop } from "@services/raindrop/raindrop.js";
import { extractUrlFromText } from "@util/url.js";
import { settings } from "@services/logseq/settings.js";

import type { AddedToRaindropView } from "./views.js";
import type { LogseqServiceClient } from "@services/interfaces.js";

const STRINGS = {
  ERROR: {
    NO_ACCESS_TOKEN:
      "You have to set your Raindrop API access token in the plugin settings.",
    NO_URLS:
      "No URLs found in the current selection. Make sure they start with https://",
  },
};

type Raindrop = {
  url: string;
  raindropId: string;
};

const createLinkRenderView = (
  raindropList: Raindrop[]
): AddedToRaindropView => {
  return {
    links: raindropList.map(({ url, raindropId }) => ({
      addedUrl: url,
      raindropPreviewUrl: `https://app.raindrop.io/my/-1/item/${raindropId}/web`,
    })),
  };
};

const convertResponsesToRaindrops = async (
  responses: Response[]
): Promise<Raindrop[]> => {
  const raindrops = await Promise.all(responses.map((res) => res.json()));
  return raindrops.map((data) => ({
    url: data.item.link,
    raindropId: data.item._id,
  }));
};

const renderAddedToRaindrop = (raindropList: Raindrop[], template: string) => {
  const view = createLinkRenderView(raindropList);
  return Mustache.render(template, view);
};

export const genAddUrlsToRaindropCmd =
  (logseqClient: LogseqServiceClient) => async (): Promise<void> => {
    // We can't use `content` from `getCurrentBlock()` because it's not updated
    // as the user types
    const currentBlock = await logseq.Editor.getCurrentBlock();
    if (!currentBlock) return;

    const { uuid } = currentBlock;
    const content = await logseq.Editor.getEditingBlockContent();

    const accessToken = await logseq.settings?.access_token;
    const urls = extractUrlFromText(content);
    if (!urls) {
      logseq.UI.showMsg(STRINGS.ERROR.NO_URLS, "warning", { timeout: 4000 });
      return;
    }

    if (!accessToken) {
      logseq.UI.showMsg(STRINGS.ERROR.NO_ACCESS_TOKEN, "warning", {
        timeout: 4000,
      });
      logseq.showSettingsUI();
      return;
    }

    const responses = await Promise.all(
      urls.map((url) => createRaindrop({ link: url }))
    );

    const newRaindrops = await convertResponsesToRaindrops(
      responses.filter(isOk).map((res) => (res as Ok<Response, unknown>).value)
    );

    const template = settings.formatting_template.add_link_mustache_template();
    const text = renderAddedToRaindrop(newRaindrops, template);
    if (!text) {
      logseq.UI.showMsg("Added URLs to Raindrop");
      return;
    }

    await logseq.Editor.insertBlock(uuid, text, {
      sibling: false,
    });
  };
