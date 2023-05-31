import { createRaindrop } from "@services/raindrop/raindrop.js";
import { extractUrlFromText } from "@util/url.js";
import { isOk, type Ok } from "true-myth/result";

const strings = {
  error: {
    no_access_token:
      "You have to set your Raindrop API access token in the plugin settings.",
    no_urls:
      "No URLs found in the current selection. Make sure they start with https://",
  },
};

type Raindrop = {
  link: string;
  raindropId: string;
};

const convertResponsesToRaindrops = async (
  responses: Response[]
): Promise<Raindrop[]> => {
  const raindrops = await Promise.all(responses.map((res) => res.json()));
  return raindrops.map((res_1) => ({
    link: res_1.item.link,
    raindropId: res_1.item._id,
  }));
};

const convertRaindropToMdLink = ({ link, raindropId }: Raindrop): string =>
  `[${link}](${`https://app.raindrop.io/my/-1/item/${raindropId}/preview`})`;

export const addUrlsToRaindrop = async (): Promise<void> => {
  // We can't use `content` from `getCurrentBlock()` because it's not updated
  // as the user types
  const current_block = await logseq.Editor.getCurrentBlock();
  if (!current_block) return;

  const { uuid } = current_block;
  const content = await logseq.Editor.getEditingBlockContent();

  const access_token = await logseq.settings?.access_token;
  const urls = extractUrlFromText(content);
  if (!urls) {
    logseq.UI.showMsg(strings.error.no_urls, "warning", { timeout: 4000 });
    return;
  }

  if (!access_token) {
    logseq.UI.showMsg(strings.error.no_access_token, "warning", {
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
  const linksText = newRaindrops.map(convertRaindropToMdLink);
  const savedLinksBlockText = "Saved to Raindrop: \n" + linksText.join("\n");
  await logseq.Editor.insertBlock(uuid, savedLinksBlockText, {
    sibling: false,
  });
};
