import type { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.js";
import { userPreferences } from "src/stores/userPreferences.js";

export const importFilterOptions = {
  ALL: "Import all Raindrops",
  WITH_ANNOTATIONS: "Import only Raindrops with highlights",
};

const settingsConfig: SettingSchemaDesc[] = [
  {
    default: false,
    type: "boolean",
    key: "sync_to_single_page",
    title: "Sync to a single page?",
    description:
      "If enabled, all Raindrops will be imported to a single page, instead of each in their own page under the hierarchy page name." +
      "\n\n" +
      "**For example**, when this is off, an article _Great Logseq Plugins_ might be imported in a page `logseq-raindrop/Great Logseq Plugins`." +
      " With it on, this page would be created as a new block under the page `Raindrop`.",
  },
  {
    default: importFilterOptions.ALL,
    type: "enum",
    enumChoices: Object.values(importFilterOptions),
    enumPicker: "select",
    key: "import_filter",
    title: "Which Raindrops should be imported?",
    description:
      "When you import Raindrops to a single page, choose which Raindrops you import. The default is to import all of them, but you can choose to only import Raindrops with highlights.",
  },
  {
    default: "Raindrop",
    type: "string",
    key: "page_name",
    title: "Page Name for Single Page imports",
    description:
      "If 'Sync to a single page?' is enabled, all Raindrops will be imported to this page. It will be created if it does not exist.",
  },
  {
    default: "",
    description:
      "Your API access token is used to save links for you. You can make a test token at https://app.raindrop.io/settings/integrations.",
    key: "access_token",
    title: "Raindrop access token",
    type: "string",
  },
  {
    default: 30,
    description:
      "How many minutes between each sync. Disable syncing entirely with `0`. Default is every 30 minutes.",
    key: "sync_interval",
    title: "Sync interval (minutes)",
    type: "number",
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
      "The page under which all imported pages are put." +
      " By default, pages are created with a title like 'logseq-raindrop/My Imported Page Name'." +
      " If you **do not** want namespaced pages, you can leave this empty." +
      "\n\n" +
      "Note: this setting is **unused** if 'Sync to a single page?' is enabled.",
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
  {
    default: "",
    title: "Last sync time",
    inputAs: "datetime-local",
    description:
      "The time of the last sync. Used to determine which bookmarks have been created since the last sync. You can clear this value to reimport all bookmarks.",
    key: "last_sync_timestamp",
    type: "string",
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
  import_filter: () =>
    logseq.settings!["import_filter"] as keyof typeof importFilterOptions,
  formatting_template: {
    highlight: (): string => logseq.settings!["template_highlight"] as string,
    annotation: (): string => logseq.settings!["template_annotation"] as string,
    deleted: (): string => logseq.settings!["template_deleted"] as string,
  },
  sync_to_single_page: (): boolean =>
    logseq.settings!["sync_to_single_page"] as boolean,
  sync_interval: (): number => logseq.settings!["sync_interval"] as number,
  page_name: (): string => logseq.settings!["page_name"] as string,
  last_sync_timestamp: (): Date =>
    new Date(logseq.settings!["last_sync_timestamp"] as string),
};

/**
 * Registers the settings config with Logseq.
 * Logseq then generates a plugin settings page for us.
 *
 */
export const registerSettings = (): void => {
  logseq.onSettingsChanged(userPreferences.onUpdate);

  logseq.useSettingsSchema(settingsConfig);
};
