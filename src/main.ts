import "@logseq/libs";
import "svelte";

import App from "./App.svelte";

import { registerCommands } from "@commands/commands.js";
import { registerSettings } from "@services/logseq/settings.js";
import { setupRaindropHttpClient } from "@services/raindrop/index.js";
import { generateLogseqClient } from "@services/logseq/client.js";

const main = async () => {
  const addColorStyle = import.meta.env.PROD ? "" : "color: orange!important;";

  const logseqClient = generateLogseqClient();
  setupRaindropHttpClient({
    accessToken: logseqClient.settings.accessToken,
    apiUrl: "https://api.raindrop.io/rest/v1",
  });

  registerCommands();
  await registerSettings();

  new App({
    target: document.getElementById("app")!,
    props: {
      logseqClient,
    },
  });

  const createModel = () => ({
    show: () => {
      logseq.showMainUI();
    },
  });

  logseq.provideModel(createModel());

  logseq.App.registerUIItem("toolbar", {
    key: "logseq-raindrop",
    template: `
      <a data-on-click="show" class="button" style="${addColorStyle}">
        <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_1_12)">
            <path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M74.4721 90.1196C74.4721 90.1425 25.5279 90.1221 25.5279 90.1221C25.5025 90.1196 25.4518 90.1196 25.4009 90.117C11.2751 89.3915 0 77.6844 0 63.3706C0 52.361 6.66832 42.894 16.1618 38.7803C18.8343 22.4632 32.9853 10 50.0126 10C67.0399 10 81.1657 22.4632 83.8382 38.7803C93.3317 42.894 100 52.361 100 63.3706C100 77.6844 88.7503 89.3915 74.5991 90.117L74.4721 90.1196ZM15.831 47.0611C10.5879 50.5918 7.12632 56.5816 7.12632 63.3706C7.12632 73.8737 15.3983 82.465 25.7572 82.9996C25.859 83.0047 41.0283 83.0251 41.0283 83.0251L27.4623 70.231L27.4368 70.2081C20.8957 64.4678 16.5436 56.271 15.831 47.0611ZM76.0755 36.7413C72.7922 25.4135 62.3567 17.1276 50.0126 17.1276C37.643 17.1276 27.2077 25.4135 23.9245 36.7413C24.8662 36.6395 25.8333 36.5886 26.7751 36.5886C36.7013 36.5886 45.3804 41.9954 50.0126 50.0191C54.6194 41.9954 63.2984 36.5886 73.2246 36.5886C74.1918 36.5886 75.1338 36.6395 76.0755 36.7413ZM58.9717 83.0251C58.9717 83.0251 74.141 83.0047 74.2428 82.9996C84.6017 82.465 92.8737 73.8737 92.8737 63.3706C92.8737 56.5816 89.4121 50.5918 84.169 47.0611C83.4564 56.271 79.1043 64.4678 72.5632 70.2081L58.9717 83.0251ZM46.4496 63.1543C46.3223 52.4068 37.5666 43.7162 26.7751 43.7162C25.4261 43.7162 24.1283 43.8536 22.8557 44.1108C22.8557 44.1922 22.8557 44.2737 22.8557 44.3526C22.8557 52.5443 26.4699 59.8959 32.1711 64.8878C32.222 64.9184 32.2473 64.9489 32.2727 64.9794L46.4496 78.331V63.2128C46.4496 63.2128 46.4496 63.1645 46.4496 63.1543ZM53.5759 63.1543C53.5759 63.1645 53.5759 63.2128 53.5759 63.2128V78.331L67.7273 64.9794C67.7527 64.9489 67.8034 64.9184 67.8289 64.8878C73.5555 59.8959 77.1698 52.5443 77.1698 44.3526C77.1698 44.2737 77.1698 44.1922 77.1698 44.1108C75.8972 43.8536 74.5736 43.7162 73.2246 43.7162C62.4331 43.7162 53.6777 52.4068 53.5759 63.1543Z"/>
          </g>
          <defs>
            <clipPath id="clip0_1_12">
              <rect width="100" height="80.1305" fill="white" transform="translate(0 10)"/>
            </clipPath>
          </defs>
        </svg>
      </a>
    `,
  });
};

logseq.ready(main).catch(console.error);
