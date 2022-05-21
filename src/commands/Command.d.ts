export type Command = {
  title: string;
  task: () => Promise<void>;
};
