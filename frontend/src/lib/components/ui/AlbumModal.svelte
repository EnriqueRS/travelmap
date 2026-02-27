<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let albums: any[] = [];
  export let isLinkingInfo = false;

  export let title = "Vincular Álbum de Immich";
  export let description =
    "Selecciona un álbum de tu cuenta de Immich para importar sus fotos a este viaje. Solo se enlazarán las imágenes y se extraerán sus metadatos (ubicación y fecha).";
  export let actionText = "Vincular Álbum";
  export let loadingText = "Vinculando...";
  export let actionClass = "btn-primary";

  const dispatch = createEventDispatcher();
  let selectedAlbumId = "";

  // Auto-select the first linked album if none is selected
  $: if (albums && albums.length > 0 && !selectedAlbumId) {
    const firstLinked = albums.find((a) => a.isLinked);
    if (firstLinked) {
      selectedAlbumId = firstLinked.id;
    }
  }

  function close() {
    dispatch("close");
  }

  function link() {
    if (selectedAlbumId) {
      dispatch("link", { albumId: selectedAlbumId });
    }
  }
</script>

<div class="modal-backdrop" on:click|self={close}>
  <div class="modal card">
    <header class="modal-header">
      <h3>{title}</h3>
      <button class="close-btn" on:click={close}>&times;</button>
    </header>

    <div class="modal-body">
      <p class="description">
        {description}
      </p>

      {#if albums.length === 0}
        <div class="loading-state">
          <p>Cargando álbumes o no hay ninguno disponible...</p>
        </div>
      {:else}
        <div class="albums-list">
          {#each albums as alb}
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
                    <span class="linked-badge">(Vinculado)</span>
                  {/if}
                </span>
                <span class="album-count badge">{alb.assetCount} items</span>
              </div>
            </label>
          {/each}
        </div>
      {/if}
    </div>

    <footer class="modal-footer">
      <button class="btn btn-secondary" on:click={close}>Cancelar</button>
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
    background: rgba(15, 23, 42, 0.85); /* Slate 900 con opacidad */
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }

  .modal.card {
    background: #1e293b; /* Slate 800 */
    border-radius: 16px;
    border: 1px solid #334155; /* Slate 700 */
    max-width: 500px;
    width: 90%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    padding: 0;
    overflow: hidden;
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #334155;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #0f172a; /* Slate 900 */
  }

  .modal-header h3 {
    margin: 0;
    color: #f8fafc;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    margin: 0;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #f1f5f9;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
  }

  .description {
    color: #94a3b8;
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .loading-state {
    text-align: center;
    padding: 2rem;
    color: #64748b;
    background: #0f172a;
    border-radius: 8px;
  }

  .albums-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .album-item {
    display: block;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .album-item:hover {
    border-color: #475569;
    background: #1e293b;
  }

  .album-item.selected {
    border-color: #3b82f6; /* Blue 500 */
    background: rgba(59, 130, 246, 0.1);
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
    color: #e2e8f0;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .linked-badge {
    font-size: 0.75rem;
    color: #3b82f6; /* Blue 500 */
    background: rgba(59, 130, 246, 0.1);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-weight: 600;
  }

  .album-count.badge {
    background: #334155;
    color: #cbd5e1;
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
  }

  .album-item.selected .album-count.badge {
    background: rgba(59, 130, 246, 0.2);
    color: #93c5fd;
  }

  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #334155;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    background: #0f172a;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: #334155;
    color: #f1f5f9;
  }

  .btn-secondary:hover {
    background: #475569;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-primary:disabled {
    background: #1e293b;
    color: #64748b;
    cursor: not-allowed;
  }

  .btn-danger {
    background: #ef4444; /* Red 500 */
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #dc2626; /* Red 600 */
  }

  .btn-danger:disabled {
    background: #1e293b;
    border-color: #ef4444;
    color: #ef4444;
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
