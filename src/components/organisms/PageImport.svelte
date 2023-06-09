<script lang="ts">
  import { derived, writable } from "svelte/store";

  import type {Raindrop as TRaindrop} from "@types";
  import Raindrop from "@atoms/Raindrop.svelte";
  import { userPreferences } from "src/stores/userPreferences.js";
  import { formatSecondsAsDateTime } from "@util/time.js";
  import { createCollectionUpdatedSinceGenerator } from "@services/raindrop/collection.js";


  const lastSyncTimestampSecs = derived(
    userPreferences,
    ($userPrefences) => Number($userPrefences.last_sync_timestamp) || 0
  );
  let lastSyncTimestampValueStr = writable($lastSyncTimestampSecs.toString() || '0');
  const hasEnabledExperimentalFeatures = derived(
    userPreferences,
    ($userPrefences) => $userPrefences.broken_experimental_features
  );

  const remoteData = writable<TRaindrop[]>([]);
  const requestsInFlight = writable(0);
  const mostRecentRequestTime = writable(new Date(0));
  const loading = derived(
    requestsInFlight,
    ($requestsInFlight) => $requestsInFlight > 0
  );
  const lastSyncDate = new Date($lastSyncTimestampSecs * 1000);
  const sinceLastUpdate = derived(
    [remoteData, lastSyncTimestampSecs],
    ([$remoteData2, $lastSyncDatetime]) => {
      console.log($remoteData2, $lastSyncDatetime);
      return $remoteData2.filter((raindrop) => raindrop.created > lastSyncDate);
    }
  )
  const generator = createCollectionUpdatedSinceGenerator(lastSyncDate);
  const generatorIsDone = writable(false);

  const performSearch = async (): Promise<void> => {
    const currentRequestStartedAt = new Date();
    requestsInFlight.update((n) => n + 1);


    const {done, value: items} = await generator.next();

    requestsInFlight.update((n) => n - 1);

    if (done) {
      generatorIsDone.update((_) => true);
      return;
    }

    mostRecentRequestTime.update((activeRequestDatetime) => {
      if (currentRequestStartedAt < activeRequestDatetime) return activeRequestDatetime;

      remoteData.update((previousItems) => [...previousItems, ...items]);

      return currentRequestStartedAt;
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

  <div class="results">
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
    {#if $generatorIsDone === false}
      <button on:click={onSearch}>get more</button>
    {:else}
      <p>showing all results</p> 
    {/if}
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

  .results {
    overflow-y: scroll;
    max-height: 50vh;
  }

  @media (prefers-color-scheme: light) {
    .experimental {
      background-color: #f4c8b8;
    }
  }
</style>