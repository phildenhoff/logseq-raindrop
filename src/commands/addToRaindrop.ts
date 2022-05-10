import { extractUrlFromText } from "../util/url";

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
  const { content, uuid } = await logseq.Editor.getCurrentBlock();
  const auth_token = await logseq.settings?.auth_token;
  const urls = extractUrlFromText(content);
  if (!urls) {
    logseq.UI.showMsg(strings.error.no_urls, "warning", { timeout: 4000 });
  }

  if (!auth_token) {
    logseq.UI.showMsg(strings.error.no_access_token, "warning", {
      timeout: 4000,
    });
    logseq.showSettingsUI();
    return;
  }

  const responses = await Promise.all(
    urls.map((url) =>
      fetch("https://api.raindrop.io/rest/v1/raindrop", {
        method: "POST",
        headers: new Headers({
          Authorization: `Bearer ${auth_token}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          link: url,
          pleaseParse: {},
        }),
      })
    )
  );

  const newRaindrops = await convertResponsesToRaindrops(responses);
  const linksText = newRaindrops.map(convertRaindropToMdLink);
  const text = "Saved to Raindrop: \n" + linksText.join("\n");
  await logseq.Editor.insertBlock(uuid, text, { sibling: false });
};
