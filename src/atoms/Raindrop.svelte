<script lang="ts">
  export let full;
  export let title;
  export let description;
  export let annotations;
  export let tags;
  export let collection;
  export let url;
  export let created;
  export let coverImage;

  const formattedCreated =
    !!created &&
    new Intl.DateTimeFormat("default", {
      month: "short",
      day: "numeric",
    }).format(new Date(created));

  const formattedUrl = new URL(url).hostname;
</script>

<button class="raindrop" class:full>
  {#if full}
    <img class="coverImage" src={coverImage} />
    <div class="about">
      <span class="title">{title}</span>
      {#if !!description}
        <span class="description">{description}</span>
      {/if}
      {#if !!annotations}
        <span class="annotations">
          {#each annotations as annotation}
            <div class="annotation">
              {#if annotation.note.length > 0}
                <span class="annotation__comment">💬</span>
              {/if}
              <span>{annotation.text}</span>
            </div>
          {/each}
        </span>
      {/if}
      {#if !!tags}
        <span class="tags">
          {#each tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </span>
      {/if}
      <div class="info">
        <span>{collection}</span>
        <span>{formattedUrl}</span>
        <span>{formattedCreated}</span>
      </div>
    </div>
  {:else}
    <div class="about">
      <span class="title">{title}</span>
      <div class="info">
        <span>{formattedUrl}</span>
      </div>
    </div>
  {/if}
</button>

<style>
  button {
    background-color: inherit;
    border: 1px solid transparent;
    color: inherit;
    text-align: left;
  }

  .annotations {
    display: flex;
    flex-direction: column;
  }

  .annotation {
    display: flex;
    flex-direction: row;
    margin-bottom: 5px;
  }

  .annotation::before {
    background-image: linear-gradient(
      180deg,
      hsla(0, 0%, 100%, 0.3) 0,
      hsla(0, 0%, 100%, 0.3)
    );
    background: var(--highlight-color, #fe0);
    border-radius: 3px;
    content: "";
    margin-right: 0.5rem;
    width: 3px;
  }

  .annotation__comment {
    margin-right: 0.25rem;
  }

  .tags {
    display: flex;
    flex-direction: row;
  }

  .tag {
    color: #dcc28f;
    margin-right: 0.5rem;
  }

  .tag::before {
    content: "#";
  }

  .raindrop {
    background-color: #1e1e1e;
    border: 1px solid #525252;
    display: grid;
    grid-gap: 1rem;
    grid-template-columns: auto 1fr;
    margin-bottom: 0.25rem;
    width: 100%;
  }

  .raindrop:hover {
    border: 1px solid #1888df;
  }

  .raindrop:active {
    border: 1px solid #0db3e1;
  }

  .raindrop.full {
    padding: 1rem;
  }

  .coverImage {
    align-self: flex-start;
    width: 56px;
    aspect-ratio: auto 56 / 48;
    height: 48px;
  }

  .info {
    display: flex;
    flex-direction: row;

    align-self: flex-end;
    color: #999;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    font-size: 0.8125rem;
    overflow: hidden;
    overflow: clip;
  }

  .info span:not(:last-child):not([data-inline]) {
    padding-right: 0.6rem;
  }

  .full .about {
    grid-gap: 0.375rem;
  }

  .about {
    align-content: flex-start;
    display: grid;
    line-height: 1.3125rem;
    flex: 1;
    grid-auto-flow: row;
  }

  .title {
    font-size: 1rem;
    line-height: 1.3125rem;
  }
</style>
