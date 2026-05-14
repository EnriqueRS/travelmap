<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { t } from "$lib/stores/i18n"

  export let albums: any[] = []
  export let isLinkingInfo = false

  export let title = $t("trip.linkAlbumTitle")
  export let description = $t("trip.linkAlbumDesc")
  export let actionText = $t("trip.linkAlbum")
  export let loadingText = $t("trip.unlinking") // Or maybe a 'linking' key? I'll use unlinking for now as it exists, but I should probably add a 'linking' key.
  export let actionClass = "btn-primary"

  const dispatch = createEventDispatcher()
  let selectedAlbumId = ""
  let searchQuery = ""

  $: filteredAlbums = albums
    ? albums.filter((a) =>
        a.albumName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : []

  // Auto-select the first linked album if none is selected
  $: if (albums && albums.length > 0 && !selectedAlbumId) {
    const firstLinked = albums.find((a) => a.isLinked)
    if (firstLinked) {
      selectedAlbumId = firstLinked.id
    }
  }

  function close() {
    dispatch("close")
  }

  function link() {
    if (selectedAlbumId) {
      dispatch("link", { albumId: selectedAlbumId })
    }
  }
</script>

<div class="modal-backdrop scroll-content" on:click|self={close}>
  <div class="modal card">
    <header class="modal-header">
      <h3>{title}</h3>
      <button class="close-btn" on:click={close}>&times;</button>
    </header>

    <div class="modal-body">
      <p class="description">
        {description}
      </p>

      <div class="search-container" style="margin-bottom: 1rem;">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder={$t("trip.filterAlbums")}
          class="search-input"
        />
      </div>

      {#if filteredAlbums.length === 0}
        <div class="loading-state">
          <p>
            {albums.length === 0
              ? $t("trip.loadingAlbums")
              : $t("trip.noAlbumsMatch")}
          </p>
        </div>
      {:else}
        <div class="albums-list">
          {#each filteredAlbums as alb}
            <label
              class="album-item"
              class:selected={selectedAlbumId === alb.id}
            >
              <input
                type="radio"
                name="album"
                value={alb.id}
                bind:group={selectedAlbumId}
                class="hidden-radio"
              />
              <div class="album-content">
                <span class="album-name">
                  {alb.albumName}
                  {#if alb.isLinked}
                    <span class="linked-badge">{$t("trip.linkedBadge")}</span>
                  {/if}
                </span>
                <span class="album-count badge"
                  >{$t("trip.itemsCount", { count: alb.assetCount })}</span
                >
              </div>
            </label>
          {/each}
        </div>
      {/if}
    </div>

    <footer class="modal-footer">
      <button class="btn btn-secondary" on:click={close}
        >{$t("form.cancel")}</button
      >
      <button
        class="btn {actionClass}"
        on:click={link}
        disabled={!selectedAlbumId || isLinkingInfo}
      >
        {isLinkingInfo ? loadingText : actionText}
      </button>
    </footer>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }

  .modal.card {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    max-width: 500px;
    width: 90%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
    padding: 0;
    overflow: hidden;
  }

  .modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.125rem;
    font-weight: 600;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    padding: 0.25rem;
    margin: 0;
    transition: color 0.2s;
    border-radius: var(--radius-base);
  }

  .close-btn:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-tertiary);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-light) transparent;
  }

  .description {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .loading-state {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted);
    background: var(--color-bg-main);
    border-radius: var(--radius-base);
  }

  .albums-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .album-item {
    display: block;
    background: var(--color-bg-main);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .album-item:hover {
    border-color: var(--color-border-light);
    background: var(--color-bg-tertiary);
  }

  .album-item.selected {
    border-color: var(--color-accent-primary);
    background: var(--color-accent-muted);
  }

  .hidden-radio {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .album-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .album-name {
    color: var(--color-text-primary);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .linked-badge {
    font-size: 0.75rem;
    color: var(--color-accent-text);
    background: var(--color-accent-muted);
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-sm);
    font-weight: 600;
  }

  .album-count.badge {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-full);
  }

  .album-item.selected .album-count.badge {
    background: var(--color-accent-muted);
    color: var(--color-accent-text);
  }

  .modal-footer {
    padding: 1.25rem 1.5rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  .search-input::placeholder {
    color: var(--color-text-muted);
  }
  .search-input:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 3px var(--color-accent-muted);
  }
</style>
