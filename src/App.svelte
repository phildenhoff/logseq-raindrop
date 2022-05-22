<script lang="ts">
  import logo from "./assets/raindrop.png";
  import ImportRaindrops from "./organisms/ImportRaindrops.svelte";
  import { settings } from "./util/settings";

  const l = window?.logseq ?? {};

  const close = () => l?.hideMainUI();
  const showSettings = () => {
    l?.showSettingsUI();
    close();
  };
  const setupComplete = () => {
    return (
      settings.access_token !== undefined && settings.access_token !== ""
    );
  };
  const getTheme = async () => {
    return (await l.App.getUserConfigs()).preferredThemeMode;
  };

  let promptUserToCompleteSetup = !setupComplete();
  let themePromise = getTheme();

  // We need to update state when these events occurr
  l?.onSettingsChanged((a) => {
    promptUserToCompleteSetup = !setupComplete();
  });

  l?.App.onThemeModeChanged(({ mode }) => {
    themePromise = Promise.resolve(mode);
  });
</script>

<div class="clickOutCaptureContainer" on:click={close}>
  {#await themePromise}
    <p>Loading your theme...</p>
  {:then theme}
    <main
      class={theme}
      on:click|stopPropagation|preventDefault={() => undefined}
    >
      <header>
        <img src={logo} alt="Raindrop logo" />
        <h3>Logseq → Raindrop</h3>
      </header>
      {#if promptUserToCompleteSetup}
        <p class="warning">
          You'll have to set your access token in the plugin settings before you
          get started.
        </p>
        <a on:click={showSettings} class="button">Open settings</a>
      {:else}
        <p>You're all set! Go ahead and use the slash commands.</p>
      {/if}
      <ImportRaindrops />
    </main>
  {/await}
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
    --rd-quarternary-background-color: #504F57;
    --rd-secondary-text-color: #a0a0a0;
    /* General colour palette */
    --rd-blue-base-color: #1888df;
    --rd-blue-light-color: #0db3e1;
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
    max-width: 400px;
    padding: 1em;
    position: absolute;
    right: 3rem;
    text-align: left;
    top: 4rem;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
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

  button,
  .button,
  a {
    user-select: none;
    transition: none;
  }

  a.button {
    color: var(--rd-secondary-text-color);
    font-size: 0.875rem;
    line-height: 1.25rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    align-items: center;
    display: flex;
  }

  a.button:hover {
    background-color: var(--rd-quarternary-background-color);
    color: var(--rd-primary-text-color);
  }

  p {
    margin: 1rem auto;
    line-height: 1.35;
  }

  * {
    box-sizing: border-box;
  }
</style>
