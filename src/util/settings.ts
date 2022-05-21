import type { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";

const settingsConfig: SettingSchemaDesc[] = [
  {
    default: "",
    description:
      "Your API access token is used to save links for you. You can make a test token at https://app.raindrop.io/settings/integrations.",
    key: "access_token",
    title: "Raindrop access token",
    type: "string",
  },
  {
    default: true,
    description:
      "When you add the links in a block to Raindrop, this setting allows you to insert a new block within your current block that links back to Raindrop.",
    key: "pref_add_nested_raindrop_url",
    title: "Nest Raindrop URL link inside block",
    type: "boolean",
  },
];

/**
 * Properties within the object return current setting values.
 */
export const settings = {
  access_token: (): string => logseq.settings["access_token"],
  preferences: {
    add_nested_raindrop_url: (): boolean =>
      logseq.settings["pref_add_nested_raindrop_url"],
  },
};

/**
 * Registers the settings config with Logseq.
 * Logseq then generates a plugin settings page for us.
 *
 */
export const registerSettings = (): void => {
  logseq.useSettingsSchema(settingsConfig);
};
