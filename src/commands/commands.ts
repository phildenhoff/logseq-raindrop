import type { Command } from "@commands/Command";
import { addUrlsToRaindrop } from "@commands/addToRaindrop";

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
