import type { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.js";

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
      "Markdown (or org mode) formatting to use for notes (highlights). Available variables: `{text}`, which is the contents of the highlight.",
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
  {
    default: false,
    title: "Enable broken, experimental features",
    description:
      "Enable pre-release features that are not yet ready for general use.",
    key: "broken_experimental_features",
    type: "boolean",
  },
  {
    type: "boolean",
    key: "enable_empty_page_state",
    title: "Enable empty page state",
    default: true,
    description:
      "When a Raindrop page is imported, but has no annotations, a block will be added to the page letting you know that the page is empty (and that nothing went wrong)." +
      "\n\n" +
      "If you disable this, no blocks will be added but **you will have to delete existing blocks manually**.",
  },
];

/**
 * Properties within the object return current setting values.
 */
export const settings = {
  enable_broken_experimental_features: () =>
    logseq.settings!["broken_experimental_features"] as boolean,
  access_token: (): string => logseq.settings!["access_token"] as string,
  namespace_label: (): string => logseq.settings!["namespace_label"] as string,
  default_page_tags: (): string =>
    logseq.settings!["default_page_tags"] as string,
  formatting_template: {
    highlight: (): string => logseq.settings!["template_highlight"] as string,
    annotation: (): string => logseq.settings!["template_annotation"] as string,
    deleted: (): string => logseq.settings!["template_deleted"] as string,
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
