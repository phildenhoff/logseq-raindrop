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
      "When you save URLs to Raindrop, add a new child block containing the URLs of the raindrops. Allows you to add tags, annotations, and set collections more easily.",
    key: "pref_add_nested_raindrop_url",
    title: "Nest Raindrop URL link inside block",
    type: "boolean",
  },
{
    default: "> {text}",
    description:
      "Markdown (or org mode) formatting to use for notes (highlights). Available variables: `{text}`, which is the contents of the highlight, and `{color}`, which is the color of the highlight.",
    key: "template_highlight",
    title: "Highlight template",
    type: "string",
  },
{
    default: "{text}",
    description:
      "Markdown (or org mode) formatting to use for annotations (comments). Available variables: `{text}`, which is the contents of the highlight.",
    key: "template_annotation",
    title: "Annotation template",
    type: "string",
  },
{
    default: "🗑 {content}",
    description:
      "Markdown (or org mode) formatting to use for deleted content. Available variables: `{content}`, which is the formatted contents of the deleted block.",
    key: "template_deleted",
    title: "Deleted content template",
    type: "string",
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
  formatting_template: {
    highlight: (): string =>
      logseq.settings["template_highlight"],
    annotation: (): string =>
      logseq.settings["template_annotation"],
    deleted: (): string =>
      logseq.settings["template_deleted"],
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
