<script lang="ts">
  import { getContext } from "svelte";
  import { derived, writable } from "svelte/store";

  import type { LogseqServiceClient } from "@services/logseq";
  import { logseqClientCtxKey } from "@services/logseq";

  import { importHighlightsSinceLastSync } from "src/importHighlights.js";
  import { pluginSettings } from "src/stores/pluginSettings.js";
  import { formatDatetime } from "@util/time.js";

  const logseqClient = getContext<LogseqServiceClient>(logseqClientCtxKey);

  const lastSyncTimestamp = derived(
    pluginSettings,
    ($settings) => new Date($settings.last_sync_timestamp)
  );
  const syncInterval = derived(
    pluginSettings,
    ($settings) => $settings.sync_interval
  );

  const onManuallySyncBookmarks = async (): Promise<void> => {
    const lastSyncDate = $lastSyncTimestamp;
    const { pageName } = logseqClient.settings;

    importHighlightsSinceLastSync(lastSyncDate, logseqClient, pageName).then(
      () => {
        logseqClient.displayMessage("Raindrop sync complete 🎉", "success", {
          key: "raindrop-sync-complete",
        });
      }
    );

    logseqClient.openPageByName(pageName);
  };
  const onChangeLastSyncTime = (): void => {
    logseq.showSettingsUI();
  };
</script>

<div>
  <button on:click={onManuallySyncBookmarks}>Sync Bookmarks</button>
  <p>Last synced at: {formatDatetime($lastSyncTimestamp)}</p>

  {#if $syncInterval > 0}
    <p>
      Syncing updates every {$syncInterval} minute{$syncInterval > 1
        ? "s"
        : ""}.
    </p>
  {:else}
    <p>Syncing updates is disabled</p>
  {/if}

  <p>To change the last sync time, you can view Plugin Settings.</p>
  <button on:click={onChangeLastSyncTime}>Open Plugin Settings</button>
</div>

<style>
  button {
    margin: 16px 0;
    padding: 8px 12px;
    border: transparent;
    border-radius: 16px;
    background-color: var(--rd-blue-base-color);
    color: var(--rd-primary-text-color);
    transition: all 0.1s ease-in-out;
  }

  button:hover {
    background-color: var(--rd-blue-light-color);
    box-shadow: 0 2px 2px 2px #0db3e132;
  }

  @media (prefers-color-scheme: light) {
    button {
      background-color: var(--rd-blue-extra-light-color);
    }
    button:hover {
      background-color: var(--rd-blue-light-color);
      box-shadow: 0 2px 2px 2px #80d3ed32;
    }
  }
</style>
