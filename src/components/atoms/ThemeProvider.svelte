<script lang="ts">
  import { getContext } from "svelte";
  import { logseqClientCtxKey } from "@services/logseq/client.js";
  import type { LogseqServiceClient } from "@services/logseq";

  const logseqClient = getContext<LogseqServiceClient>(logseqClientCtxKey);

  const getTheme = async () => {
    return (await logseqClient.getUserConfig()).preferredThemeMode;
  };

  let themePromise = getTheme();
  logseqClient.registerEventListener("onThemeModeChanged", ({ mode }) => {
    themePromise = Promise.resolve(mode);
  });
</script>

{#await themePromise}
  <p>Loading your theme...</p>
{:then theme}
  <slot {theme} />
{/await}
