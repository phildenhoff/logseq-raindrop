<script lang="ts">
  import { setContext } from "svelte";

  import logo from "@assets/raindrop.png";
  import ImportRaindrops from "@organisms/ImportRaindrops.svelte";
  import { ifIsEnter, ifIsEscape } from "@util/keyboardEvents.js";
  import SinglePageSyncMenu from "@organisms/SinglePageSyncMenu.svelte";
  import type { LogseqServiceClient } from "@services/logseq";
  import { logseqClientCtxKey } from "@services/logseq";
  import ThemeProvider from "@atoms/ThemeProvider.svelte";

  import { startSync } from "./sync.js";

  export let logseqClient: LogseqServiceClient;

  setContext(logseqClientCtxKey, logseqClient);

  const close = logseqClient.ui.plugin.hide;
  const showSettings = () => {
    logseqClient.ui.pluginSettings.show();
    close();
  };
  const setupComplete = () => {
    const { accessToken } = logseqClient.settings;
    return accessToken !== undefined && accessToken !== "";
  };

  const openAccessTokenHelp = () => {
    window.open(
      "https://github.com/phildenhoff/logseq-raindrop#setting-up-your-plugin"
    );
  };

  let promptUserToCompleteSetup = !setupComplete();
  let isUsingSyncToSinglePage = logseqClient.settings.syncToSinglePage;
  let stopSync = startSync(logseqClient);

  logseqClient.registerEventListener(
    "onSettingsChanged",
    ({ before: _before, after: _after }) => {
      promptUserToCompleteSetup = !setupComplete();

      stopSync();
      stopSync = startSync(logseqClient);
    }
  );
</script>

<div
  class="clickOutCaptureContainer"
  on:click={close}
  on:keydown={ifIsEscape(close)}
>
  <ThemeProvider let:theme>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <main
      class={theme}
      on:click|stopPropagation|preventDefault={() => undefined}
    >
      <header>
        <img src={logo} alt="Raindrop logo" />
        <h3>Raindrop</h3>
      </header>
      {#if promptUserToCompleteSetup}
        <p class="warning">
          Set your access token in the plugin settings to get started.
        </p>
        <p>
          <span
            class="externalLink"
            on:click={openAccessTokenHelp}
            on:keydown={ifIsEnter(openAccessTokenHelp)}
          >
            How do I get an access token?
          </span>
        </p>
        <span on:click={showSettings} class="button">Open settings</span>
      {:else if isUsingSyncToSinglePage}
        <SinglePageSyncMenu />
      {:else}
        <ImportRaindrops />
      {/if}
    </main>
  </ThemeProvider>
</div>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    cursor: default;
  }

  .clickOutCaptureContainer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  main,
  main.dark {
    --rd-primary-text-color: #fff;
    --rd-primary-background-color: #2a2a2a;
    --rd-secondary-background-color: #090909;
    --rd-quarternary-background-color: #504f57;
    --rd-secondary-text-color: #a0a0a0;
    /* General colour palette */
    --rd-blue-base-color: #1888df;
    --rd-blue-light-color: #0db3e1;
    --rd-blue-extra-light-color: #80d4ed;
    --rd-yellow-base-color: #fe0;
    --rd-yellow-dark-color: #dcc28f;
  }

  main.light {
    --rd-primary-text-color: #121212;
    --rd-primary-background-color: #fff;
    --rd-secondary-background-color: #f8f8f8;
    --rd-quarternary-background-color: #e8e8e8;
    --rd-secondary-text-color: #6f6f6f;
  }

  main {
    background-color: var(--rd-secondary-background-color);
    border-radius: 0.375rem;
    box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px,
      rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px,
      rgba(0, 0, 0, 0.1) 0px 4px 6px -4px;
    color: var(--rd-primary-text-color);
    margin: 0 auto;
    max-width: 480px;
    padding: 1em;
    position: absolute;
    right: 3rem;
    text-align: left;
    top: 4rem;
  }

  h3,
  p {
    margin: 0;
  }

  header {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.25rem;
  }

  header img {
    height: 1.5rem;
    margin-right: 1rem;
  }

  .button {
    user-select: none;
    transition: none;
  }

  .button {
    color: var(--rd-secondary-text-color);
    font-size: 0.875rem;
    line-height: 1.25rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    align-items: center;
    display: flex;
  }

  .button:hover {
    background-color: var(--rd-quarternary-background-color);
    color: var(--rd-primary-text-color);
  }

  .externalLink {
    color: var(--rd-blue-base-color);
  }

  .externalLink:hover {
    color: var(--rd-blue-light-color);
  }

  .externalLink::after {
    content: " ↗";
  }

  p {
    margin: 1rem auto;
    line-height: 1.35;
  }

  * {
    box-sizing: border-box;
  }
</style>
