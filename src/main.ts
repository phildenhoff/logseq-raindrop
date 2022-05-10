import "@logseq/libs";
import 'svelte';
import App from "./App.svelte";
import {addUrlsToRaindrop} from "./commands/addToRaindrop";

type Command = {
  title: string,
  task: () => Promise<void>,
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
  logseq.useSettingsSchema([{
    default: "",
    description: "Your API token is used to save links for you. You can make a test token at https://app.raindrop.io/settings/integrations.",
    key: 'auth_token',
    title: 'Raindrop API token',
    type: 'string',
  }]);
}

const main = () => {
  registerSlashCommands();
  registerSettings();

  new App({
    target: document.getElementById("app"),
  });

  logseq.provideModel({
    async startPomoTimer(e: any) {
      const { pomoId, slotId, blockUuid } = e.dataset;
      const startTime = Date.now();

      const block = await logseq.Editor.getBlock(blockUuid);
      const flag = `{{renderer :pomodoro_${pomoId}`;
      const newContent = block?.content?.replace(
        `${flag}}}`,
        `${flag},${startTime}}}`
      );
      if (!newContent) return;
      await logseq.Editor.updateBlock(blockUuid, newContent);
    },
  });

  let createModel = () => ({
    show: () => {
      logseq.showMainUI();
    },
  });

  logseq.provideModel(createModel());

  // TODO : Make a menu
  logseq.App.registerUIItem("toolbar", {
    key: "a",
    template: `
      <div data-on-click="show">⚙️</div>
    `,
  });
};

logseq.ready(main).catch(console.error);
