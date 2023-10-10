import type { Command } from "@commands/Command.js";
import { genAddUrlsToRaindropCmd } from "@commands/addToRaindrop.js";
import type { LogseqServiceClient } from "@services/logseq";

const genSlashCommands = (logseqClient: LogseqServiceClient): Command[] => [
  {
    title: "Add urls to Raindrop",
    task: genAddUrlsToRaindropCmd(logseqClient),
  },
];

export const registerCommands = (logseqClient: LogseqServiceClient) => {
  genSlashCommands(logseqClient).forEach(({ title, task }) => {
    logseq.Editor.registerSlashCommand(title, task);
  });
};
