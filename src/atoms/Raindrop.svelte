<script lang="ts">
import { Annotation, Tag } from "@types";


  /**
   * If true, shows a full-size Raindrop with all info
  */
  export let full: boolean;
  /**
   * The Raindrop title. Not necessarily the URL title — this is editable within
   *  Raindrop.
   */
  export let title: string;
  /**
   * A description of the raindrop. Editable by the user within Raindrop.
   */
  export let description: string;
  /**
   * Highlights & notes the user has made within Raindrop.
   */
  export let annotations: Annotation[];
  /**
   * Tags the user has added.
   */
  export let tags: Tag[];
  /**
   * The name of the assigned Collection.
   */
  export let collectionName: string;
  export let url: URL;
  export let created: Date;
  export let coverImage: string | URL;
  /**
   * Action to take when the Raindrop is clicked.
   */
  export let onClick: () => void;

  $: formattedCreated = () =>
    !!created &&
    new Intl.DateTimeFormat("default", {
      month: "short",
      day: "numeric",
    }).format(new Date(created));

  $: formattedUrl = () => new URL(url).hostname;
</script>

<button class="raindrop" class:full on:click={onClick}>
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
        {#if !!collectionName}
          <span>{collectionName}</span>
        {/if}
        <span>{formattedUrl()}</span>
        <span>{formattedCreated()}</span>
      </div>
    </div>
  {:else}
    <div class="about">
      <span class="title">{title}</span>
      <div class="info">
        <span>{formattedUrl()}</span>
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
    border-left: 2px solid var(--rd-yellow-base-color);
    display: flex;
    flex-direction: row;
    margin-bottom: 5px;
    padding-left: 0.5rem;
  }

  .annotation__comment {
    margin-right: 0.25rem;
  }

  .description {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .tags {
    display: flex;
    flex-direction: row;
  }

  .tag {
    color: var(--rd-yellow-dark-color);
    margin-right: 0.5rem;
  }

  .tag::before {
    content: "#";
  }

  .raindrop {
    background-color: var(--rd-secondary-background-color);
    border: 1px solid var(--rd-quarternary-background-color);
    display: grid;
    grid-gap: 1rem;
    grid-template-columns: auto 1fr;
    margin-bottom: 0.25rem;
    width: 100%;
  }

  .raindrop:hover {
    border: 1px solid var(--rd-blue-base-color);
  }

  .raindrop:active {
    border: 1px solid var(--rd-blue-light-color);
  }

  .raindrop.full {
    padding: 1rem;
  }

  .coverImage {
    align-self: flex-start;
    width: 56px;
    aspect-ratio: auto 56 / 48;
    height: 48px;
    object-fit: cover;
  }

  .info {
    display: flex;
    flex-direction: row;
    align-self: flex-end;
    color: var(--rd-secondary-text-color);
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
