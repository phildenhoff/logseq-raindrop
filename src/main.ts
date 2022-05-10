import "@logseq/libs";
import "svelte";
import App from "./App.svelte";
import { addUrlsToRaindrop } from "./commands/addToRaindrop";

type Command = {
  title: string;
  task: () => Promise<void>;
};

const commands: Command[] = [
  {
    title: "Add urls to Raindrop",
    task: addUrlsToRaindrop,
  },
];

const registerSlashCommands = () => {
  commands.forEach(({ title, task }) => {
    logseq.Editor.registerSlashCommand(title, task);
  });
};

const registerSettings = () => {
  logseq.useSettingsSchema([
    {
      default: "",
      description:
        "Your API access token is used to save links for you. You can make a test token at https://app.raindrop.io/settings/integrations.",
      key: "access_token",
      title: "Raindrop access token",
      type: "string",
    },
  ]);
};

const main = () => {
  registerSlashCommands();
  registerSettings();

  new App({
    target: document.getElementById("app"),
  });
  logseq.provideModel({});
  const createModel = () => ({
    show: () => {
      logseq.showMainUI();
    },
  });

  logseq.provideModel(createModel());

  logseq.App.registerUIItem("toolbar", {
    key: "logseq-raindrop",
    template: `
      <a data-on-click="show" class="button ti ti-cloud" style="font-size: 24px; margin: 4px 6px;"></a>
    `,
  });
};

logseq.ready(main).catch(console.error);
