import type { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.js";
import { STATUS_CODES } from "http";
import { pluginSettings } from "src/stores/pluginSettings.js";
import {
  defaultBookmarkTemplate,
  defaultHighlightTemplate,
  defaultAddedToRaindropTemplate,
} from "src/templates.js";

export const importFilterOptions = {
  ALL: "Import all Raindrops",
  WITH_ANNOTATIONS: "Import only Raindrops with highlights",
};

export const SETTING_IDS = {
  enableBrokenExperimentalFeatures: "broken_experimental_features",
  accessToken: "access_token",
  namespaceLabel: "namespace_label",
  defaultPageTags: "default_page_tags",
  importFilter: "import_filter",
  templateHighlight: "template_highlight",
  templateAnnotation: "template_annotation",
  templateDeleted: "template_deleted",
  addLinkMustacheTemplate: "add_link_mustache_template",
  highlightMustacheTemplate: "highlight_mustache_template",
  bookmarkMustacheTemplate: "bookmark_mustache_template",
  syncToSinglePage: "sync_to_single_page",
  syncInterval: "sync_interval",
  pageName: "page_name",
  lastSyncTimestamp: "last_sync_timestamp",
  emptyPageState: "enable_empty_page_state",
} as const;

const generateSettingsConfig = (userConfig: {
  preferredFormat: "markdown" | "org";
}): SettingSchemaDesc[] => [
  {
    default: false,
    type: "boolean",
    key: SETTING_IDS.syncToSinglePage,
    title: "Sync to a single page?",
    description:
      "If enabled, all Raindrops will be imported to a single page, instead of each in their own page under the hierarchy page name." +
      "\n\n" +
      "**For example**, when this is off, an article _Great Logseq Plugins_ might be imported in a page `logseq-raindrop/Great Logseq Plugins`." +
      " With it on, this page would be created as a new block under the page `Raindrop`.",
  },
  {
    default: "",
    description:
      "Your API access token is used to save links for you. You can make a test token at https://app.raindrop.io/settings/integrations.",
    key: SETTING_IDS.accessToken,
    title: "Raindrop access token",
    type: "string",
  },
  {
    default: "",
    title: "Default page tags",
    description:
      "A list of #tags to include on every imported page. For example: '#[[Web page]] #raindrop [[imported]]'.",
    key: SETTING_IDS.defaultPageTags,
    type: "string",
  },
  {
    default: false,
    title: "Enable broken, experimental features",
    description:
      "Enable pre-release features that are not yet ready for general use.",
    key: SETTING_IDS.enableBrokenExperimentalFeatures,
    type: "boolean",
  },
  {
    title: "Add Link to Raindrop template",
    type: "string",
    inputAs: "textarea",
    key: SETTING_IDS.addLinkMustacheTemplate,
    description:
      "Mustache template used when adding a link to Raindrop. Available variables: `{links}` (an array of links added to Raindrop, each with an `{addedUrl}` and `{raindropPreviewUrl}`).",
    default: defaultAddedToRaindropTemplate[userConfig.preferredFormat],
  },
  {
    key: "category_single-page-imports",
    type: "heading",
    title: "Single Page Import Settings",
    default: "",
    description:
      "Settings for when all bookmarks are imported to a single page.",
  },
  {
    default: importFilterOptions.ALL,
    type: "enum",
    enumChoices: Object.values(importFilterOptions),
    enumPicker: "select",
    key: SETTING_IDS.importFilter,
    title: "Which Raindrops should be imported?",
    description:
      "When you import Raindrops to a single page, choose which Raindrops you import. The default is to import all of them, but you can choose to only import Raindrops with highlights.",
  },
  {
    default: "Raindrop",
    type: "string",
    key: SETTING_IDS.pageName,
    title: "Page Name for Single Page imports",
    description:
      "If 'Sync to a single page?' is enabled, all Raindrops will be imported to this page. It will be created if it does not exist.",
  },
  {
    default: 30,
    description:
      "How many minutes between each sync. Disable syncing entirely with `0`. Default is every 30 minutes.",
    key: SETTING_IDS.syncInterval,
    title: "Sync interval (minutes)",
    type: "number",
  },
  {
    default: "",
    title: "Last sync time",
    inputAs: "datetime-local",
    description:
      "The time of the last sync. Used to determine which bookmarks have been created since the last sync. You can clear this value to reimport all bookmarks.",
    key: SETTING_IDS.lastSyncTimestamp,
    type: "string",
  },
  {
    title: "Bookmark template",
    type: "string",
    inputAs: "textarea",
    key: SETTING_IDS.bookmarkMustacheTemplate,
    description:
      "Mustache template used when adding a bookmark to your page. Available variables: `{title}`, `{url}`, `{tags}`, `{dateCreated}`, `{dateUpdated}`.",
    default: defaultBookmarkTemplate[userConfig.preferredFormat],
  },
  {
    title: "Highlight template",
    type: "string",
    inputAs: "textarea",
    key: SETTING_IDS.highlightMustacheTemplate,
    description:
      "Mustache template used when adding a highlight for a bookmark. Available variables: `{text}`, `{note}`.",
    default: defaultHighlightTemplate[userConfig.preferredFormat],
  },
  {
    key: "category_multipage-imports",
    type: "heading",
    title: "Multi Page Import Settings",
    default: "",
    description: "Settings for when each bookmark is imported to its own page.",
  },
  {
    default: "> {text}",
    description:
      "Markdown (or org mode) formatting to use for notes (highlights). Available variables: `{text}`, which is the contents of the highlight.",
    key: SETTING_IDS.templateHighlight,
    title: "Highlight template",
    type: "string",
  },
  {
    default: "{text}",
    description:
      "Markdown (or org mode) formatting to use for annotations (comments). Available variables: `{text}`, which is the contents of the highlight.",
    key: SETTING_IDS.templateAnnotation,
    title: "Annotation template",
    type: "string",
  },
  {
    default: "🗑 {content}",
    description:
      "Markdown (or org mode) formatting to use for deleted content. Available variables: `{content}`, which is the formatted contents of the deleted block.",
    key: SETTING_IDS.templateDeleted,
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
    key: SETTING_IDS.namespaceLabel,
    type: "string",
  },
  {
    type: "boolean",
    key: SETTING_IDS.emptyPageState,
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
    logseq.settings![SETTING_IDS.enableBrokenExperimentalFeatures] as boolean,
  access_token: (): string =>
    logseq.settings![SETTING_IDS.accessToken] as string,
  namespace_label: (): string =>
    logseq.settings![SETTING_IDS.namespaceLabel] as string,
  default_page_tags: (): string =>
    logseq.settings![SETTING_IDS.defaultPageTags] as string,
  import_filter: () =>
    logseq.settings![
      SETTING_IDS.importFilter
    ] as keyof typeof importFilterOptions,
  formatting_template: {
    highlight: (): string =>
      logseq.settings![SETTING_IDS.templateHighlight] as string,
    annotation: (): string =>
      logseq.settings![SETTING_IDS.templateAnnotation] as string,
    deleted: (): string =>
      logseq.settings![SETTING_IDS.templateDeleted] as string,
    add_link_mustache_template: (): string =>
      logseq.settings![SETTING_IDS.addLinkMustacheTemplate] as string,
  },
  sync_to_single_page: (): boolean =>
    logseq.settings![SETTING_IDS.syncToSinglePage] as boolean,
  sync_interval: (): number =>
    logseq.settings![SETTING_IDS.syncInterval] as number,
  page_name: (): string => logseq.settings![SETTING_IDS.pageName] as string,
  last_sync_timestamp: (): Date =>
    new Date(logseq.settings![SETTING_IDS.lastSyncTimestamp] as string),
};

/**
 * Registers the settings config with Logseq.
 * Logseq then generates a plugin settings page for us.
 *
 */
export const registerSettings = async (): Promise<void> => {
  logseq.onSettingsChanged(pluginSettings.onUpdate);

  const { preferredFormat } = await logseq.App.getUserConfigs();

  logseq.useSettingsSchema(generateSettingsConfig({ preferredFormat }));
};
