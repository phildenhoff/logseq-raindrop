import type { Command } from "@commands/Command.js";
import { addUrlsToRaindrop } from "@commands/addToRaindrop.js";

const slashCommands: Command[] = [
  {
    title: "Add urls to Raindrop",
    task: addUrlsToRaindrop,
  },
];

export const registerCommands = () => {
  slashCommands.forEach(({ title, task }) => {
    logseq.Editor.registerSlashCommand(title, task);
  });
};
