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
  import AlbumModal from "$lib/components/ui/AlbumModal.svelte"
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
  let showUnlinkModal = false
  let immichAlbums: any[] = []
  let isLinkingInfo = false
  let isUnlinkingAlbum = false
  let showHiddenPhotos = false

  $: hasImmichPhotos = photos.some((p) => p.provider === "immich")

  $: displayedPhotos = [
    ...(showHiddenPhotos ? photos : photos.filter((p) => !p.isHidden)),
  ].sort((a, b) => {
    if (a.isCover === b.isCover) return 0
    return a.isCover ? -1 : 1
  })

  $: computedCoverImage = photos.find((p) => p.isCover)
    ? getImageUrl(photos.find((p) => p.isCover)!)
    : trip?.coverImage
    ? `${API_URL}/media/photos/${trip?.coverImage}/image`
    : null

  let activeIndex = 0
  $: if (activeIndex >= displayedPhotos.length)
    activeIndex = Math.max(0, displayedPhotos.length - 1)
  $: selectedPhoto =
    displayedPhotos.length > 0 ? displayedPhotos[activeIndex] : null

  $: carouselImages = displayedPhotos.map((p) => ({
    alt: "Foto del viaje",
    src: getImageUrl(p),
  }))

  import { Carousel, Thumbnails } from "flowbite-svelte"

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

  async function toggleMapVisibility(photo: AppPhoto | null) {
    if (!photo) return
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

  async function toggleHiddenVisibility(photo: AppPhoto | null) {
    if (!photo) return
    try {
      const updated = await mediaService.updatePhoto(photo.id, {
        isHidden: !photo.isHidden,
      })
      photos = photos.map((p) => (p.id === photo.id ? updated : p))
      toast.success(
        updated.isHidden ? "Foto oculta de la galería" : "Foto restaurada"
      )
    } catch (err) {
      toast.error("Error al ocultar la foto")
    }
  }

  async function setCover(photo: AppPhoto | null) {
    if (!photo) return
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
              return { ...t, coverImage: updated.id }
            }
            return t
          })
        )
      }
      activeIndex = 0
      toast.success("Portada actualizada")
    } catch (err) {
      toast.error("Error al establecer la portada")
    }
  }

  function getImageUrl(photo: AppPhoto) {
    return `${API_URL}/media/photos/${photo.id}/image`
  }

  async function openImmichModal() {
    try {
      immichAlbums = await integrationsService.getImmichAlbums()
      showImmichModal = true
    } catch (e) {
      toast.error("Error. Asegúrate de haber conectado Immich en tu Perfil.")
    }
  }

  async function handleLinkAlbum(event: CustomEvent<{ albumId: string }>) {
    const selectedAlbumId = event.detail.albumId
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
          asset.id,
          asset.exifInfo // Pass the exif info along
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

  async function handleUnlinkAlbum() {
    isUnlinkingAlbum = true
    toast.info("Comprobando álbumes vinculados...")
    try {
      const allAlbums = await integrationsService.getImmichAlbums()

      const localImmichExternalIds = new Set(
        photos
          .filter((p) => p.provider === "immich")
          .map((p) => p.externalId || p.id)
      )

      if (localImmichExternalIds.size > 0) {
        await Promise.all(
          allAlbums.map(async (album: any) => {
            try {
              const assets = await integrationsService.getImmichAlbumAssets(
                album.id
              )
              album.isLinked = assets.some((a: any) =>
                localImmichExternalIds.has(a.id)
              )
            } catch (e) {
              album.isLinked = false
            }
          })
        )
      } else {
        allAlbums.forEach((a: any) => (a.isLinked = false))
      }

      immichAlbums = allAlbums.sort(
        (a: any, b: any) => (b.isLinked ? 1 : 0) - (a.isLinked ? 1 : 0)
      )
      showUnlinkModal = true
    } catch (e) {
      toast.error("Error cargando álbumes de Immich.")
    } finally {
      isUnlinkingAlbum = false
    }
  }

  async function handleCommitUnlinkAlbum(
    event: CustomEvent<{ albumId: string }>
  ) {
    const selectedAlbumId = event.detail.albumId
    if (!selectedAlbumId) return

    isUnlinkingAlbum = true
    toast.info("Desvinculando fotos del álbum seleccionado...")

    try {
      // 1. Get the assets for the selected album
      const assets = await integrationsService.getImmichAlbumAssets(
        selectedAlbumId
      )
      const assetIds = new Set(assets.map((a: any) => a.id))

      // 2. Find local photos that are from Immich AND are part of this album
      // Note: we linked them with asset.id as externalId (which here is stored in photo param, often url or id mapping, we check the externalId if available, or just fetch the ones from this album).
      // Assuming mediaService.getTripPhotos returned externalId. Let's filter our state.
      // If externalId isn't on the frontend model yet, we might need a workaround or fetch it.
      // Let's assume the backend will handle the exact matching if we pass the asset IDs, OR we just delete ones that match.
      // To be safe and precise, we will loop through our local immich photos and check if their external provider ID matches the album's assets.
      // Our `linkExternalPhoto` stores `asset.id` as `externalId`.

      const photosToDelete = photos.filter(
        (p) => p.provider === "immich" && assetIds.has(p.externalId || p.id)
      ) // Fallback to p.id if externalId isn't mapped properly in the frontend type, though it should be.

      let deletedCount = 0
      for (const photo of photosToDelete) {
        await mediaService.deletePhoto(photo.id)
        deletedCount++
      }

      // Remove them from local state
      photos = photos.filter((p) => !photosToDelete.includes(p))
      showUnlinkModal = false
      toast.success(`Se eliminaron ${deletedCount} fotos del álbum.`)
    } catch (err) {
      console.error(err)
      toast.error("Error al desvincular el álbum.")
    } finally {
      isUnlinkingAlbum = false
    }
  }

  // --- Photo Metadata Modal ---
  let selectedMetadataPhoto: AppPhoto | null = null

  function showMetadata(photo: AppPhoto | null) {
    if (!photo) return
    selectedMetadataPhoto = photo
  }

  function closeMetadata() {
    selectedMetadataPhoto = null
  }
</script>

{#if trip}
  <div class="page-container">
    <header class="trip-header">
      <div class="trip-cover">
        {#if computedCoverImage && computedCoverImage.length > 5 && computedCoverImage !== trip.name}
          <img
            src={computedCoverImage}
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
        <div
          class="actions-group flex flex-col sm:flex-row gap-2 items-start sm:items-center mt-4 sm:mt-0"
        >
          <label class="toggle-hidden-container">
            <input type="checkbox" bind:checked={showHiddenPhotos} />
            <span class="toggle-label">Ocultas</span>
          </label>

          <input
            type="file"
            bind:this={fileInput}
            on:change={handleFileUpload}
            accept="image/*"
            style="display:none;"
          />

          <div class="flex flex-wrap gap-2">
            <button class="btn btn-sm" on:click={() => fileInput.click()}>
              Subir Foto
            </button>
            <button
              class="btn btn-sm btn-secondary"
              on:click={openImmichModal}
              disabled={isLinkingInfo || isUnlinkingAlbum}
            >
              {isLinkingInfo ? "Vinculando..." : "Vincular Álbum"}
            </button>

            {#if hasImmichPhotos}
              <button
                class="btn btn-sm"
                style="background-color: #ef4444; border-color: #ef4444; color: white;"
                on:click={handleUnlinkAlbum}
                disabled={isLinkingInfo || isUnlinkingAlbum}
              >
                {isUnlinkingAlbum ? "Desvinculando..." : "Desvincular Álbum"}
              </button>
            {/if}
          </div>
        </div>
      </div>

      {#if displayedPhotos.length > 0}
        <div class="gallery-container">
          {#if selectedPhoto}
            <div
              class="main-photo-card"
              class:is-cover={selectedPhoto.isCover}
              class:is-hidden={selectedPhoto.isHidden}
            >
              <div class="main-img-wrapper">
                <Carousel
                  images={carouselImages}
                  bind:index={activeIndex}
                  slideDuration={0}
                  let:Controls
                  let:Indicators
                  class="h-full w-full"
                  imgClass="object-contain h-full w-full"
                >
                  <Controls />
                  {#if carouselImages.length <= 8}
                    <Indicators />
                  {/if}
                </Carousel>
                {#if selectedPhoto.isCover}
                  <span class="cover-badge">PORTADA</span>
                {/if}
                {#if selectedPhoto.provider === "immich"}
                  <img src="/immich.png" alt="Immich" class="provider-badge" />
                {/if}
              </div>

              <div
                class="thumbnails-wrapper bg-slate-900 p-2 border-b border-slate-700"
              >
                <Thumbnails
                  images={carouselImages}
                  bind:index={activeIndex}
                  class="flex-nowrap justify-start overflow-x-auto gap-2 p-1 snap-x scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent bg-transparent"
                  imgClass="h-16 w-16 min-w-[64px] object-cover rounded-md opacity-60 hover:opacity-100 transition-opacity snap-center cursor-pointer"
                />
              </div>

              <div class="photo-actions">
                <label class="map-toggle">
                  <input
                    type="checkbox"
                    checked={selectedPhoto.showOnMap}
                    on:change={() => toggleMapVisibility(selectedPhoto)}
                  />
                  Mostrar en Mapa
                </label>

                <div class="photo-buttons">
                  {#if !selectedPhoto.isCover}
                    <button
                      class="btn btn-sm btn-secondary"
                      on:click={() => setCover(selectedPhoto)}
                      >Hacer Portada</button
                    >
                  {/if}
                  {#if selectedPhoto.metadata?.exif}
                    <button
                      class="btn-text"
                      on:click={() => showMetadata(selectedPhoto)}>Info</button
                    >
                  {/if}
                  <button
                    class="btn-text"
                    style="color:#ef4444;"
                    on:click={() => toggleHiddenVisibility(selectedPhoto)}
                  >
                    {selectedPhoto.isHidden
                      ? "Mostrar en Galería"
                      : "Ocultar de Galería"}
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="empty-state">
          <p>
            Aún no hay fotos {showHiddenPhotos ? "" : "visibles"} en este viaje.
            Sube algunas de tus mejores tomas locales o conéctalo con tu librería.
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
{/if}

{#if showImmichModal}
  <AlbumModal
    albums={immichAlbums}
    {isLinkingInfo}
    on:close={() => (showImmichModal = false)}
    on:link={handleLinkAlbum}
  />
{/if}

{#if selectedMetadataPhoto}
  <div class="modal-backdrop" on:click|self={closeMetadata}>
    <div class="modal card meta-modal">
      <header class="modal-header">
        <h3>Información Fotográfica</h3>
        <button class="close-btn" on:click={closeMetadata}>&times;</button>
      </header>
      <div class="modal-body meta-body">
        {#if selectedMetadataPhoto.metadata?.exif}
          <div class="meta-item">
            <span class="meta-label">Dispositivo</span>
            <span class="meta-val"
              >{selectedMetadataPhoto.metadata.exif.make || "Desconocido"}
              {selectedMetadataPhoto.metadata.exif.model || ""}</span
            >
          </div>
          <div class="meta-item">
            <span class="meta-label">Fecha de captura</span>
            <span class="meta-val"
              >{selectedMetadataPhoto.metadata.exif.dateTimeOriginal
                ? new Date(
                    selectedMetadataPhoto.metadata.exif.dateTimeOriginal
                  ).toLocaleString()
                : "Desconocida"}</span
            >
          </div>
          <div class="meta-item">
            <span class="meta-label">Ubicación (Lat/Lng)</span>
            <span class="meta-val">
              {#if selectedMetadataPhoto.metadata.exif.latitude !== null && selectedMetadataPhoto.metadata.exif.longitude !== null}
                {selectedMetadataPhoto.metadata.exif.latitude.toFixed(6)}, {selectedMetadataPhoto.metadata.exif.longitude.toFixed(
                  6
                )}
              {:else}
                No disponible en EXIF
              {/if}
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Lente</span>
            <span class="meta-val"
              >{selectedMetadataPhoto.metadata.exif.lensModel ||
                "Desconocido"}</span
            >
          </div>
        {:else}
          <p>No hay metadatos EXIF disponibles para esta foto.</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if showImmichModal}
  <AlbumModal
    albums={immichAlbums}
    {isLinkingInfo}
    on:close={() => (showImmichModal = false)}
    on:link={handleLinkAlbum}
  />
{/if}

{#if showUnlinkModal}
  <AlbumModal
    title="Desvincular Álbum"
    description="Selecciona un álbum de Immich para eliminar sus fotos de este viaje. Las fotos seleccionadas desaparecerán de TravelMap, pero seguirán intactas en tu servidor de Immich."
    actionText="Desvincular"
    loadingText="Desvinculando..."
    actionClass="btn-danger"
    albums={immichAlbums}
    isLinkingInfo={isUnlinkingAlbum}
    on:close={() => (showUnlinkModal = false)}
    on:link={handleCommitUnlinkAlbum}
  />
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
  .gallery-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .main-photo-card {
    background: #0f172a;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #334155;
    transition: transform 0.2s;
  }

  .main-photo-card.is-cover {
    border: 2px solid #60a5fa;
  }

  .main-photo-card.is-hidden {
    opacity: 0.6;
    border: 1px dashed #64748b;
  }

  .main-img-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: 70vh;
    background: #0f172a; /* slate-900 */
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .carousel-container {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding-bottom: 1rem;
    /* scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: #475569 #1e293b;
  }
  .cover-dot {
    position: absolute;
    bottom: 4px;
    left: 4px;
    width: 10px;
    height: 10px;
    background-color: #60a5fa;
    border-radius: 50%;
    border: 1px solid #1e40af;
  }

  .cover-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(0, 0, 0, 0.7);
    color: #60a5fa;
    border: 1px solid #60a5fa;
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    font-weight: bold;
    border-radius: 6px;
    z-index: 10;
  }

  .provider-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px !important;
    height: 32px !important;
    border-radius: 8px;
    filter: brightness(1.2);
    z-index: 10;
  }

  .photo-actions {
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.95rem;
    color: #cbd5e1;
    background: #1e293b;
  }

  .map-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: 500;
  }

  .photo-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .btn-text {
    background: transparent;
    border: none;
    color: #94a3b8;
    text-align: left;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .btn-text:hover {
    color: white;
    background-color: rgba(255, 255, 255, 0.05);
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

  .toggle-hidden-container {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    font-size: 0.85rem;
    color: #94a3b8;
    margin-right: 1rem;
  }

  /* Metadata Modal specifics */
  .meta-modal {
    max-width: 400px;
    padding: 0;
  }

  .meta-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .meta-label {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meta-val {
    font-size: 0.95rem;
    color: #f1f5f9;
  }

  @media (max-width: 768px) {
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .header-content h1 {
      font-size: 1.8rem;
    }

    .actions {
      flex-direction: column;
      gap: 1rem;
    }

    .btn {
      width: 100%;
      text-align: center;
      justify-content: center;
    }

    .photo-actions {
      flex-direction: column;
      align-items: flex-start;
    }

    .photo-buttons {
      width: 100%;
      margin-top: 0.5rem;
    }
  }
</style>
