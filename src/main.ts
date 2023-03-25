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
    target: document.getElementById("app"),
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
      <a data-on-click="show" class="button ti ti-cloud" style="font-size: 24px; margin: 4px 6px; ${addColorStyle}"></a>
    `,
  });
};

logseq.ready(main).catch(console.error);
