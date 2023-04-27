<script lang="ts">
  import { derived, writable } from "svelte/store";

  import type {Raindrop as TRaindrop} from "@types";
  import { settings } from "@util/settings.js";
  import { raindropTransformer } from "@util/raindropTransformer.js";
  import Raindrop from "@atoms/Raindrop.svelte";
  import { userPreferences } from "src/stores/userPreferences.js";

  const lastSyncTimestampSecs = derived(
    userPreferences,
    ($userPrefences) => Number($userPrefences.last_sync_timestamp) || 0
  );
  let lastSyncTimestampValueStr = writable($lastSyncTimestampSecs.toString() || '0');
  const hasEnabledExperimentalFeatures = derived(
    userPreferences,
    ($userPrefences) => $userPrefences.broken_experimental_features
  );

  const secondsToMs = (value: number) => value * 1000;
  const formatterOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  } as const;
  const formatSecondsAsDateTime = (seconds: number) => Intl.DateTimeFormat(undefined, formatterOptions).format(secondsToMs(seconds));

  const remoteData = writable<TRaindrop[]>([]);
  const requestsInFlight = writable(0);
  const mostRecentRequestTime = writable(new Date(0));
  const loading = derived(
    requestsInFlight,
    ($requestsInFlight) => $requestsInFlight > 0
  );
  const sinceLastUpdate = derived(
    [remoteData, lastSyncTimestampSecs],
    ([$remoteData2, $lastSyncDatetime]) => {
      const lastSyncDate = new Date($lastSyncDatetime * 1000);
      return $remoteData2.filter((raindrop) => raindrop.created > lastSyncDate);
    }
  )


  const performSearch = async (): Promise<void> => {
    const requestTime = new Date();
    requestsInFlight.update((n) => n + 1);

    const res = await fetch(
      `https://api.raindrop.io/rest/v1/raindrops/0?sort=-created&perpage=40&version=2`,
      {
        method: "GET",
        headers: new Headers({
          Authorization: `Bearer ${settings.access_token()}`,
          "Content-Type": "application/json",
        }),
      }
    );
    const { items } = await res.json();

    requestsInFlight.update((n) => n - 1);
    mostRecentRequestTime.update((currentRequestTime) => {
      if (requestTime < currentRequestTime) return currentRequestTime;
      remoteData.update((_) => items.map(raindropTransformer));
      return requestTime;
    });
  };
  const onSearch = (): void => {
    performSearch();
  };
  const onUpdateTimestamp = (event: Event) => {
    const newValue = (event.target as HTMLInputElement).value; 
    userPreferences.updateSetting('last_sync_timestamp', Number(newValue));
  }
</script>

{#if $hasEnabledExperimentalFeatures}
<div class="experimental">
  <h3>Import Recently Added</h3>
  <p>Bookmarks new to your Raindrop. This does not include old bookmarks that you've recently updated by adding new tags or annotations.</p>
  <button on:click={onSearch}>Fetch new bookmarks</button>
  <form class="sync-container">
    <label for="last-sync">Last sync: {formatSecondsAsDateTime($lastSyncTimestampSecs)}</label>
    <input id="last-sync" type="text"
    bind:value={$lastSyncTimestampValueStr} 
    on:input={onUpdateTimestamp}/>
  </form>

  <div>
    <h4>Raindrops since last sync</h4>
    {#each $sinceLastUpdate as result}
      <Raindrop 
        full={false}
        title={result.title}
        description={result?.description}
        annotations={result?.annotations}
        tags={result?.tags}
        url={result?.url}
        created={result?.created}
        collectionName={result?.collectionName}
        coverImage={result?.coverImage}
        onClick={() => console.log("ok")}
      />
    {/each}
  </div>
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