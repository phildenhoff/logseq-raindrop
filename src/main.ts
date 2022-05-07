import "@logseq/libs";
import App from "./App.svelte";

const extractUrlFromText = (text: string) => {
  const regexp =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?!&//=]*)/gi;

  if (typeof text !== "string") {
    throw new TypeError(
      `The str argument should be a string, got ${typeof text}`
    );
  }

  if (!text) {
    return undefined;
  }

  let urls = text.match(regexp);
  if (!urls) return undefined;

  return urls;
};

const commands: any[] = [
  {
    title: "Add urls to Raindrop",
    task: async () => {
      const { content, uuid } = await logseq.Editor.getCurrentBlock();
      const urls = extractUrlFromText(content);

      const AUTH_TOKEN = "";

      const responses = await Promise.all(
        urls.map((url) =>
          fetch("https://api.raindrop.io/rest/v1/raindrop", {
            method: "POST",
            headers: new Headers({
              Authorization: `Bearer ${AUTH_TOKEN}`,
              "Content-Type": "application/json",
            }),
            body: JSON.stringify({
              link: url,
              pleaseParse: {},
            }),
          })
        )
      );

      const newRaindrops = (
        await Promise.all(responses.map((res) => res.json()))
      ).map((res) => ({
        link: res.item.link,
        raindropId: res.item._id,
      }));

      const linksText = newRaindrops.map(({ link, raindropId }) => ({
        content: `[${link}](${`https://app.raindrop.io/my/-1/item/${raindropId}/preview`})`,
      }));

      const text =
        "Saved to Raindrop: \n" +
        linksText.map(({ content }) => content).join("\n");

      await logseq.Editor.insertBlock(uuid, text, { sibling: false });
    },
  },
];

const registerSlashCommands = () => {
  console.log("main");
  commands.forEach(({ title, task }) => {
    logseq.Editor.registerSlashCommand(title, task);
  });
};

const main = () => {
  registerSlashCommands();

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
