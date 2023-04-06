import "@logseq/libs";
import "svelte";

import App from "./App.svelte";

import { registerCommands } from "@commands/commands.js";
import { registerSettings } from "@util/settings.js";

const main = () => {
  const addColorStyle = import.meta.env.PROD ? "" : "color: orange!important;";

  registerCommands();
  registerSettings();

  new App({
    target: document.getElementById("app")!,
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
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_3843_101374)">
        		<path fill="currentColor" d="M14.95 3.973a6.597 6.597 0 0 1 2.042 4.44 5 5 0 0 1-1.775 9.582L15 18H5a5 5 0 0 1-1.99-9.588 6.59 6.59 0 0 1 2.04-4.439c2.734-2.63 7.166-2.63 9.9 0Z"></path>
        	</g>
          <defs>
            <clipPath id="clip0_3843_101374">
              <rect width="20" height="20" fill="none"/>
            </clipPath>
          </defs>
        </svg>
      </a>
    `,
  });
};

logseq.ready(main).catch(console.error);
