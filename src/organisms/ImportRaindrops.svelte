<script lang="ts">
  import Raindrop from "../atoms/Raindrop.svelte";

  const l = window?.logseq ?? {};

  const onChange = () => undefined;
  const loading = true;
  const data = [
    {
      title: "Logseq plugin library",
      description: "maybe notes field?",
      annotations: [
        {
          note: "",
          color: "yellow",
          text: "🚀 Logseq SDK libraries.",
          created: "2022-05-21T03:21:04.906Z",
          lastUpdate: "2022-05-21T03:21:04.915Z",
          creatorRef: 920589,
          _id: "62885aa03423a74260d94d13",
        },
        {
          note: "Good stuff here",
          text: "yarn add @logseq/libs",
          created: "2022-05-21T03:21:26.321Z",
          lastUpdate: "2022-05-21T03:21:26.356Z",
          creatorRef: 920589,
          _id: "62885ab63423a7b8fdd94d15",
        },
      ],
      tags: ["logseq", "plugins", "documentation"],
      coverImage:
        "https://rdl.ink/render/https%3A%2F%2Flogseq.github.io%2Fplugins%2F",
      created: "2022-05-21T02:53:26.708Z",
      url: "https://logseq.github.io/plugins/",
      collection: "Unsorted",
      id: "396671602",
    },
    {
      url: "https://discuss.logseq.com/t/making-obsidian-play-nice-with-logseq/1185",
      title:
        "Making Obsidian play nice with Logseq - Look what I built - Logseq",
      created: "2022-03-26T10:45:24.000Z",
      collection: "Read Archive",
      id: 391702267,
    },
  ];

  /* const [loading, data, performSearch] = useRemoteData<string>(); */
  /* const onChange = (event: React.ChangeEvent<HTMLInputElement>) => { */
  /*   performSearch(event.target.value); */
  /* }; */
</script>

<div>
  <h2>Annotations</h2>
  <button>Import all annotations</button>
  <hr />
  <h3>Import specific page</h3>
  <form>
    <input placeholder="Search" {onChange} style={{ minWidth: "24ch" }} />
    {#if loading}
      <p>Searching</p>
    {:else}
      <p>Filtering. ⏎ to search</p>
    {/if}
  </form>

  <ul class="results">
    {#each data as result}
      <li role="option">
        <Raindrop
          full={true}
          title={result.title}
          description={result?.description}
          annotations={result?.annotations}
          tags={result?.tags}
          url={result?.url}
          created={result?.created}
          collection={result?.collection}
          coverImage={result?.coverImage}
        />
      </li>
    {/each}
  </ul>
</div>

<style>
  form {
    display: flex;
    flex-direction: row;
  }

  input {
    min-width: 24ch;
  }

  .results {
    display: flex;
    flex-direction: column;
    margin-top: 0.5rem;
  }

  ul {
    margin: 0;
    padding: 0;
  }

  li {
    list-style: none;
  }
</style>
