<script lang="ts">
  import { page } from "$app/stores"
  import {
    trips,
    locations,
    getCategoryEmoji,
    getStatusColor,
  } from "$lib/stores/data"
  import { goto } from "$app/navigation"
  import { formatDate } from "$lib/utils/formatters"
  import ImagePlaceholder from "$lib/components/ui/ImagePlaceholder.svelte"
  import { onMount } from "svelte"
  import { mediaService, type AppPhoto } from "$lib/services/media"
  import { integrationsService } from "$lib/services/integrations"
  import { API_URL } from "$lib/services/auth"
  import { toast } from "$lib/stores/ui"

  $: tripId = $page.params.id
  $: trip = $trips.find((t) => t.id === tripId)
  $: tripLocations = $locations.filter(
    (l) => trip?.locations.includes(l.id) || l.tripId === tripId
  )

  function handleDelete() {
    if (confirm("¿Estás seguro de que quieres eliminar este viaje?")) {
      trips.update((current) => current.filter((t) => t.id !== tripId))
      goto("/trips")
    }
  }

  // --- Galería y Fotos ---
  let photos: AppPhoto[] = []
  let fileInput: HTMLInputElement

  let showImmichModal = false
  let immichAlbums: any[] = []
  let selectedAlbumId = ""
  let isLinkingInfo = false

  onMount(async () => {
    if (tripId) {
      try {
        photos = await mediaService.getTripPhotos(tripId)
      } catch (e) {
        console.error("Error cargando fotos", e)
      }
    }
  })

  async function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      toast.info("Subiendo imagen...")
      try {
        const newPhoto = await mediaService.uploadLocalPhoto(
          tripId,
          input.files[0]
        )
        photos = [newPhoto, ...photos]
        input.value = "" // Reset
        toast.success("Foto subida correctamente")
      } catch (err) {
        console.error("Error subiendo foto", err)
        toast.error("Error al subir la imagen")
      }
    }
  }

  async function toggleMapVisibility(photo: AppPhoto) {
    try {
      const updated = await mediaService.updatePhoto(photo.id, {
        showOnMap: !photo.showOnMap,
      })
      photos = photos.map((p) => (p.id === photo.id ? updated : p))
      toast.success(updated.showOnMap ? "Añadida al mapa" : "Ocultada del mapa")
    } catch (err) {
      toast.error("Error al actualizar la foto")
    }
  }

  async function setCover(photo: AppPhoto) {
    try {
      const updated = await mediaService.updatePhoto(photo.id, {
        isCover: true,
      })
      photos = photos.map((p) => ({
        ...p,
        isCover: p.id === photo.id,
      }))

      // Update local UI immediately
      if (trip) {
        trips.update((allTrips) =>
          allTrips.map((t) => {
            if (t.id === trip.id) {
              return { ...t, coverImage: updated.url }
            }
            return t
          })
        )
      }
      toast.success("Portada actualizada")
    } catch (err) {
      toast.error("Error al establecer la portada")
    }
  }

  function getImageUrl(url: string) {
    if (url.startsWith("/uploads")) {
      return `${API_URL}${url}`
    }
    return url
  }

  async function openImmichModal() {
    try {
      immichAlbums = await integrationsService.getImmichAlbums()
      showImmichModal = true
    } catch (e) {
      toast.error("Error. Asegúrate de haber conectado Immich en tu Perfil.")
    }
  }

  async function linkAlbum() {
    if (!selectedAlbumId) return
    isLinkingInfo = true
    toast.info("Importando fotos de Immich...")
    try {
      const assets = await integrationsService.getImmichAlbumAssets(
        selectedAlbumId
      )
      const status = await integrationsService.checkStatus()

      let count = 0
      for (const asset of assets) {
        // Thumbnail request to generic Immich endpoint with the user's base URL API attached
        let cleanBase = status.url.endsWith("/api")
          ? status.url.slice(0, -4)
          : status.url
        const assetUrl = `${cleanBase}/api/assets/${asset.id}/thumbnail?size=preview`

        const newPhoto = await mediaService.linkExternalPhoto(
          tripId,
          assetUrl,
          asset.id
        )
        photos = [newPhoto, ...photos]
        count++
      }
      showImmichModal = false
      toast.success(`Se importaron ${count} fotos del álbum.`)
    } catch (err) {
      console.error(err)
      toast.error("Error importando el álbum.")
    } finally {
      isLinkingInfo = false
    }
  }
</script>

{#if trip}
  <div class="page-container">
    <header class="trip-header">
      <div class="trip-cover">
        {#if trip.coverImage && trip.coverImage.length > 5 && trip.coverImage !== trip.name}
          <img
            src={getImageUrl(trip.coverImage)}
            alt="Cover"
            style="width:100%; height:100%; object-fit:cover;"
          />
        {:else}
          <ImagePlaceholder text={trip.name} type="trip" />
        {/if}
      </div>
      <div class="header-content">
        <div class="badge {getStatusColor(trip.status)}">{trip.status}</div>
        <h1>{trip.name}</h1>
        <p class="dates">
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
        </p>
        <div class="countries">
          {#each trip.countries as country}
            <span class="country-tag">🌍 {country}</span>
          {/each}
        </div>
      </div>
    </header>

    <section class="description-section">
      <h2>Acerca del viaje</h2>
      <p>{trip.description}</p>
    </section>

    <section class="locations-section">
      <div class="section-header">
        <h2>Lugares Visitados</h2>
        <a href="/locations?trip={trip.id}" class="btn btn-sm">Añadir Lugar</a>
      </div>

      {#if tripLocations.length > 0}
        <div class="locations-grid">
          {#each tripLocations as location}
            <div class="location-card">
              <div class="location-image">
                <ImagePlaceholder text={location.name} type="location" />
              </div>
              <div class="location-info">
                <h3>{getCategoryEmoji(location.category)} {location.name}</h3>
                <p class="location-country">{location.country}</p>
                <div class="rating">
                  {"⭐".repeat(location.rating)}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <p>No hay lugares registrados en este viaje aún.</p>
        </div>
      {/if}
    </section>

    <section class="gallery-section">
      <div class="section-header">
        <h2>📷 Galería Fotográfica</h2>
        <div class="actions-group" style="display:flex; gap:0.5rem;">
          <input
            type="file"
            bind:this={fileInput}
            on:change={handleFileUpload}
            accept="image/*"
            style="display:none;"
          />
          <button class="btn btn-sm btn-secondary" on:click={openImmichModal}
            >Vincular Álbum</button
          >
          <button class="btn btn-sm" on:click={() => fileInput.click()}
            >Subir Foto</button
          >
        </div>
      </div>

      {#if photos.length > 0}
        <div class="gallery-grid">
          {#each photos as photo (photo.id)}
            <div class="photo-card" class:is-cover={photo.isCover}>
              <div class="img-wrapper">
                <!-- Fix CORS issue displaying images dynamically cross domain in MVP via object-fit -->
                <img
                  src={getImageUrl(photo.url)}
                  alt="Foto del viaje"
                  loading="lazy"
                  crossorigin="anonymous"
                />
                {#if photo.isCover}
                  <span class="cover-badge">PORTADA</span>
                {/if}
                {#if photo.provider === "immich"}
                  <img src="/favicon.png" alt="Immich" class="provider-badge" />
                {/if}
              </div>

              <div class="photo-actions">
                <label class="map-toggle">
                  <input
                    type="checkbox"
                    checked={photo.showOnMap}
                    on:change={() => toggleMapVisibility(photo)}
                  />
                  Mostrar en Mapa
                </label>
                {#if !photo.isCover}
                  <button class="btn-text" on:click={() => setCover(photo)}
                    >Hacer Portada</button
                  >
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <p>
            Aún no hay fotos en este viaje. Sube algunas de tus mejores tomas
            locales o conéctalo con tu librería.
          </p>
        </div>
      {/if}
    </section>

    <div class="actions">
      <button class="btn btn-danger" on:click={handleDelete}
        >Eliminar Viaje</button
      >
      <a href="/trips" class="btn btn-secondary">Volver a Viajes</a>
    </div>
  </div>
{:else}
  <div class="not-found">
    <h1>Viaje no encontrado</h1>
    <a href="/trips" class="btn btn-primary">Volver a mis viajes</a>
  </div>

  <!-- Modal Inserción Immich Álbum -->
  {#if showImmichModal}
    <div class="modal-backdrop" on:click|self={() => (showImmichModal = false)}>
      <div class="modal card">
        <h3>Vincular Álbum Externo (Immich)</h3>
        <p style="color:#94a3b8; font-size:0.9rem; margin-bottom:1rem;">
          Elige un álbum para inyectar su contenido en la bóveda de viaje local.
          Sólo se descargarán los enlaces a los assets.
        </p>

        <div class="form-group">
          <label>Tus álbumes</label>
          {#if immichAlbums.length === 0}
            <p>No se encontraron álbumes en tu cuenta o está cargando...</p>
          {:else}
            <select
              bind:value={selectedAlbumId}
              style="width:100%; padding:0.5rem; background:#0f172a; border-radius:6px; color:white; margin-bottom:1rem;"
            >
              <option value="" disabled>-- Selecciona un Álbum --</option>
              {#each immichAlbums as alb}
                <option value={alb.id}
                  >{alb.albumName} ({alb.assetCount} items)</option
                >
              {/each}
            </select>
          {/if}
        </div>

        <div
          class="modal-actions"
          style="display:flex; justify-content:flex-end; gap:1rem;"
        >
          <button
            class="btn btn-secondary"
            on:click={() => (showImmichModal = false)}>Cerrar</button
          >
          <button
            class="btn btn-primary"
            on:click={linkAlbum}
            disabled={!selectedAlbumId || isLinkingInfo}
          >
            {isLinkingInfo ? "Vinculando..." : "Vincular"}
          </button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .page-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }

  .trip-cover {
    height: 300px;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 2rem;
  }

  .header-content {
    text-align: center;
    margin-bottom: 3rem;
  }

  h1 {
    font-size: 3rem;
    margin: 1rem 0;
    color: white;
  }

  .badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .badge.green {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }
  .badge.blue {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }
  .badge.gray {
    background: rgba(148, 163, 184, 0.2);
    color: #cbd5e1;
  }

  .dates {
    color: #94a3b8;
    font-size: 1.1rem;
  }

  .countries {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .country-tag {
    background: #1e293b;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid #334155;
  }

  section {
    margin-bottom: 3rem;
    background: #1e293b;
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid #334155;
  }

  h2 {
    color: #60a5fa;
    margin-bottom: 1.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .locations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .location-card {
    background: #0f172a;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #334155;
  }

  .location-image {
    height: 150px;
  }

  .location-info {
    padding: 1rem;
  }

  .location-info h3 {
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
  }

  .location-country {
    color: #94a3b8;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    border: none;
    display: inline-block;
  }

  .btn-secondary {
    background: #334155;
    color: white;
  }

  .btn-danger {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.5);
  }

  .btn-danger:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: #3b82f6;
    color: white;
  }

  .not-found {
    text-align: center;
    padding: 5rem;
  }

  /* Gallery UI */
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .photo-card {
    background: #0f172a;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #334155;
    transition: transform 0.2s;
  }

  .photo-card.is-cover {
    border: 2px solid #60a5fa;
  }

  .photo-card:hover {
    transform: translateY(-3px);
  }

  .img-wrapper {
    position: relative;
    height: 160px;
    background: #000;
  }

  .img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-badge {
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: #60a5fa;
    border: 1px solid #60a5fa;
    padding: 0.15rem 0.4rem;
    font-size: 0.65rem;
    font-weight: bold;
    border-radius: 4px;
    z-index: 10;
  }

  .provider-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px !important;
    height: 20px !important;
    border-radius: 5px;
    filter: brightness(1.2);
    z-index: 10;
  }

  .photo-actions {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #cbd5e1;
  }

  .map-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
  }

  .btn-text {
    background: transparent;
    border: none;
    color: #94a3b8;
    text-align: left;
    padding: 0;
    cursor: pointer;
    font-size: 0.8rem;
    text-decoration: underline;
  }

  .btn-text:hover {
    color: white;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }
  .modal.card {
    background: #1e293b;
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid #475569;
    max-width: 450px;
    width: 100%;
  }

  .actions-group {
    display: flex;
    gap: 0.5rem;
  }
</style>
