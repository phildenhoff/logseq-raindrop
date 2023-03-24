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
  {
    default: "logseq-raindrop",
    title: "Hierarchy parent page name",
    description:
      "The page under which all imported pages are put. By default, pages are created with a title like 'logseq-raindrop/My Imported Page Name'. If you **do not** want namespaced pages, you can leave this empty.",
    key: "namespace_label",
    type: "string",
  },
  {
    default: "",
    title: "Default page tags",
    description:
      "A list of #tags to include on every imported page. For example: '#[[Web page]] #raindrop [[imported]]'.",
    key: "default_page_tags",
    type: "string",
  },
];

/**
 * Properties within the object return current setting values.
 */
export const settings = {
  access_token: (): string => logseq.settings["access_token"],
  namespace_label: (): string => logseq.settings["namespace_label"],
  default_page_tags: (): string => logseq.settings["default_page_tags"],
  formatting_template: {
    highlight: (): string => logseq.settings["template_highlight"],
    annotation: (): string => logseq.settings["template_annotation"],
    deleted: (): string => logseq.settings["template_deleted"],
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
