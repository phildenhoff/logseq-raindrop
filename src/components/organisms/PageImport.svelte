<script lang="ts">
  import { settings } from "@util/settings.js";
  import { derived, writable } from "svelte/store";

  let lastSyncDatetime = writable(0);

  const hasEnabledExperimentalFeatures = settings.enable_broken_experimental_features(); 

  const msToSeconds = (value: number) => value * 1000;
  const formatterOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  } as const;
  const formatMsAsDateTime = (value: number) => Intl.DateTimeFormat(undefined, formatterOptions).format(msToSeconds(value));
</script>

{#if hasEnabledExperimentalFeatures}
<div class="experimental">
  <h3>Import Recently Added</h3>
  <p>Bookmarks new to your Raindrop. This does not include old bookmarks that you've recently updated by adding new tags or annotations.</p>
  <button>Fetch new bookmarks</button>
  <form class="sync-container">
    <label for="last-sync">Last sync: {formatMsAsDateTime($lastSyncDatetime)}</label>
    <input id="last-sync" type="text" bind:value={$lastSyncDatetime}/>
  </form>
</div>
{/if}

<style>
  .experimental {
    background-color: #411100;
    padding: 8px;
  }

  h3 {
    margin-top: 0;
  }

  .sync-container {
    display: flex;
    flex-direction: column;
    max-width: 24ch;
  }

  @media (prefers-color-scheme: light) {
    .experimental {
      background-color: #f4c8b8;
    }
  }
</style>