<script lang="ts">
  import { page } from "$app/stores"
  import { Compass, Map, Calendar, CheckCircle2, Circle } from "lucide-svelte"
  import {
    trips,
    locations,
    getCategoryEmoji,
    getStatusColor,
    type Location,
  } from "$lib/stores/data"
  import { goto } from "$app/navigation"
  import { formatDate } from "$lib/utils/formatters"
  import { getCountryFlag } from "$lib/utils/countries"
  import ImagePlaceholder from "$lib/components/ui/ImagePlaceholder.svelte"
  import AlbumModal from "$lib/components/ui/AlbumModal.svelte"
  import CountryPicker from "$lib/components/ui/CountryPicker.svelte"
  import LocationPicker from "$lib/components/map/LocationPicker.svelte"
  import MiniStaticMap from "$lib/components/map/MiniStaticMap.svelte"
  import {
    MapPin,
    MapPinOff,
    Plus,
    Eye,
    EyeOff,
    Upload,
    Link as LinkIcon,
    RefreshCcw,
    CheckSquare,
    Trash2,
    Info,
    AlertTriangle,
    Star,
  } from "lucide-svelte"
  import { onMount, tick } from "svelte"
  import { mediaService, type AppPhoto } from "$lib/services/media"
  import { integrationsService } from "$lib/services/integrations"
  import { API_URL } from "$lib/services/auth"
  import { toast } from "$lib/stores/ui"
  import { reverseGeocode } from "$lib/utils/geocode"

  import { tripsService } from "$lib/services/trips"
  import { locationsService } from "$lib/services/locations"

  $: tripId = $page.params.id
  $: trip = $trips.find((t) => t.id === tripId)
  $: tripLocations = $locations.filter(
    (l) => trip?.locations.includes(l.id) || l.tripId === tripId,
  )

  let showLocationModal = false
  let editingLocation: any = null
  let modalLocationName = ""
  let modalLocationCountry = ""
  let modalLocationCategory = "Naturaleza"
  let modalLocationLat = 0
  let modalLocationLng = 0
  let modalLocationDescription = ""
  let modalLocationRating = 5
  let selectedPhotoForLocation: AppPhoto | null = null

  function openAddLocation() {
    editingLocation = null
    modalLocationName = ""
    modalLocationCountry = ""
    modalLocationCategory = "Naturaleza"
    modalLocationLat = 0
    modalLocationLng = 0
    modalLocationDescription = ""
    modalLocationRating = 5
    selectedPhotoForLocation = null
    showLocationModal = true
  }

  function openEditLocation(loc: any) {
    editingLocation = loc
    modalLocationName = loc.name
    modalLocationCountry = loc.country || ""
    modalLocationCategory = loc.category
    modalLocationLat = loc.coordinates?.[0] || 0
    modalLocationLng = loc.coordinates?.[1] || 0
    modalLocationRating = loc.rating || 5
    modalLocationDescription = loc.description || ""
    selectedPhotoForLocation = null // If they want to link a new photo, they can
    showLocationModal = true
  }

  async function handleLocationModalSelect(
    e: CustomEvent<{ lat: number; lng: number }>,
  ) {
    modalLocationLat = e.detail.lat
    modalLocationLng = e.detail.lng
    const country = await reverseGeocode(e.detail.lat, e.detail.lng)
    if (country) {
      modalLocationCountry = country
    }
    selectedPhotoForLocation = null // Clear selection if user manually clicks map
  }

  async function handleLinkPhotoToLocation(photo: AppPhoto) {
    selectedPhotoForLocation = photo

    if (photo.metadata?.exif?.latitude && photo.metadata?.exif?.longitude) {
      const lat = photo.metadata.exif.latitude
      const lng = photo.metadata.exif.longitude
      modalLocationLat = lat
      modalLocationLng = lng
      const country = await reverseGeocode(lat, lng)
      if (country) {
        modalLocationCountry = country
      }
      toast.success("Foto vinculada y coordenadas extraídas del GPS")
    } else {
      toast.success("Foto vinculada al lugar (sin ubicación GPS)")
    }
  }

  async function saveLocation() {
    if (!modalLocationName || !modalLocationCountry) {
      toast.error("Nombre y País son obligatorios")
      return
    }

    if (editingLocation) {
      // --- EDIT MODE ---
      const updated = {
        name: modalLocationName,
        category: modalLocationCategory as Location["category"],
        coordinates: [modalLocationLat, modalLocationLng] as [number, number],
        rating: modalLocationRating,
        description: modalLocationDescription,
        country: modalLocationCountry, // Frontend field
      }

      // Update local store
      locations.update((locs) =>
        locs.map((l) => {
          if (l.id === editingLocation.id) {
            return { ...l, ...updated }
          }
          return l
        }),
      )

      // Persist to backend
      try {
        await locationsService.updateLocation(editingLocation.id, {
          ...updated,
          visitDate: editingLocation.visitedDate,
          images: selectedPhotoForLocation
            ? [selectedPhotoForLocation.id]
            : undefined,
        })
        console.log("[saveLocation] Location updated:", editingLocation.id)
      } catch (err) {
        console.error("[saveLocation] Failed to persist update:", err)
      }

      toast.success("Lugar actualizado correctamente")
    } else {
      // --- ADD MODE ---
      const newLocId = crypto.randomUUID()
      const newLoc: any = {
        id: newLocId,
        name: modalLocationName,
        description: modalLocationDescription,
        country: modalLocationCountry,
        category: modalLocationCategory,
        coordinates: [modalLocationLat, modalLocationLng],
        rating: modalLocationRating,
        visitedDate: new Date().toISOString().split("T")[0],
        images: selectedPhotoForLocation ? [selectedPhotoForLocation.id] : [],
        tripId: tripId,
      }

      // Persist to backend database
      try {
        await locationsService.createLocation(newLoc)
        console.log("[saveLocation] Location persisted to database:", newLocId)
      } catch (err) {
        console.error(
          "[saveLocation] Failed to persist location to database:",
          err,
        )
      }

      locations.update((locs) => [...locs, newLoc])

      trips.update((allTrips) =>
        allTrips.map((t) => {
          if (t.id === tripId) {
            const updatedCountries = new Set(t.countries || [])
            if (modalLocationCountry) {
              updatedCountries.add(modalLocationCountry)
            }
            return {
              ...t,
              locations: [...(t.locations || []), newLocId],
              countries: Array.from(updatedCountries),
            }
          }
          return t
        }),
      )

      // Also update the trip countries on the backend
      try {
        const currentTrip = $trips.find((t) => t.id === tripId)
        if (currentTrip) {
          const updatedCountries = new Set(currentTrip.countries || [])
          if (modalLocationCountry) updatedCountries.add(modalLocationCountry)
          await tripsService.updateTrip(tripId, {
            countries: Array.from(updatedCountries),
          })
        }
      } catch (err) {
        console.error("[saveLocation] Failed to update trip countries:", err)
      }

      toast.success("Lugar añadido correctamente")
    }

    showLocationModal = false
    editingLocation = null
  }

  let showDeleteConfirm = false

  function requestDeleteLocation() {
    showDeleteConfirm = true
  }

  async function confirmDeleteLocation() {
    if (!editingLocation) return
    showDeleteConfirm = false

    try {
      await locationsService.deleteLocation(editingLocation.id)

      // Remove local
      locations.update((locs) =>
        locs.filter((l) => l.id !== editingLocation.id),
      )
      trips.update((allTrips) =>
        allTrips.map((t) => {
          if (t.id === tripId) {
            return {
              ...t,
              locations:
                t.locations?.filter((locId) => locId !== editingLocation.id) ||
                [],
            }
          }
          return t
        }),
      )

      toast.success("Lugar eliminado correctamente")
      showLocationModal = false
      editingLocation = null
    } catch (err) {
      console.error("[deleteLocation] Failed to delete location:", err)
      toast.error("Error al eliminar el lugar")
    }
  }

  // --- BATCH GPS UPDATE ---
  let isSelectionMode = false
  let selectedPhotosIds: string[] = []
  let showBatchLocationModal = false

  function toggleSelectionMode() {
    isSelectionMode = !isSelectionMode
    selectedPhotosIds = []
  }

  function togglePhotoSelection(id: string) {
    if (selectedPhotosIds.includes(id)) {
      selectedPhotosIds = selectedPhotosIds.filter((pid) => pid !== id)
    } else {
      selectedPhotosIds = [...selectedPhotosIds, id]
    }
  }

  let batchSelectedCoords: { lat: number; lng: number } | null = null

  function openBatchLocationPicker() {
    showBatchLocationModal = true
    batchSelectedCoords = null
  }

  function handleBatchLocationSelect(
    e: CustomEvent<{ lat: number; lng: number }>,
  ) {
    batchSelectedCoords = e.detail
  }

  async function saveBatchLocation() {
    if (!batchSelectedCoords) {
      toast.error("Por favor, selecciona una ubicación en el mapa primero.")
      return
    }

    const lat = batchSelectedCoords.lat
    const lng = batchSelectedCoords.lng

    const updatedData = {
      showOnMap: true,
      metadata: {
        exif: {
          latitude: lat,
          longitude: lng,
        },
      },
    }

    try {
      await mediaService.batchUpdatePhotos(selectedPhotosIds, updatedData)
      toast.success(`Ubicación añadida a ${selectedPhotosIds.length} fotos`)

      photos = photos.map((p) => {
        if (selectedPhotosIds.includes(p.id)) {
          return {
            ...p,
            showOnMap: true,
            metadata: {
              ...p.metadata,
              exif: {
                ...(p.metadata?.exif || {}),
                latitude: lat,
                longitude: lng,
              },
            },
          }
        }
        return p
      })

      showBatchLocationModal = false
      isSelectionMode = false
      selectedPhotosIds = []
      batchSelectedCoords = null
    } catch (err) {
      console.error("[saveBatchLocation] Error:", err)
      toast.error("Error al actualizar la ubicación en lote")
    }
  }

  let isEditingTrip = false
  let editTripData = {
    name: "",
    description: "",
    status: "Planificado" as "Planificado" | "En curso" | "Completado",
    startDate: "",
    endDate: "",
    countries: [] as string[],
  }

  function startEditTrip() {
    if (!trip) return
    editTripData = {
      name: trip.name,
      description: trip.description,
      status: trip.status || "Planificado",
      startDate: trip.startDate ? trip.startDate.split("T")[0] : "",
      endDate: trip.endDate ? trip.endDate.split("T")[0] : "",
      countries: [...trip.countries],
    }
    isEditingTrip = true
  }

  async function saveTripEdit() {
    addCountryToEdit()

    if (!editTripData.name.trim()) {
      toast.error("El nombre es requerido")
      return
    }
    if (!editTripData.startDate) {
      toast.error("Fecha de inicio requerida")
      return
    }

    try {
      toast.info("Guardando...")
      await tripsService.updateTrip(tripId, editTripData)

      trips.update((allTrips) =>
        allTrips.map((t) => {
          if (t.id === tripId) {
            return {
              ...t,
              ...editTripData,
            }
          }
          return t
        }),
      )
      isEditingTrip = false
      toast.success("Viaje actualizado correctamente")
    } catch (error) {
      console.error("Error al actualizar el viaje:", error)
      toast.error("Hubo un error al guardar los cambios en la nube.")
    }
  }

  // Country logic internally
  let countryInputValue = ""
  function addCountryToEdit() {
    if (
      countryInputValue &&
      !editTripData.countries.includes(countryInputValue)
    ) {
      editTripData.countries = [...editTripData.countries, countryInputValue]
    }
    countryInputValue = ""
  }

  function removeCountryFromEdit(c: string) {
    editTripData.countries = editTripData.countries.filter(
      (country) => country !== c,
    )
  }

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
    // Portada al principio siempre
    if (a.isCover && !b.isCover) return -1
    if (!a.isCover && b.isCover) return 1
    // Luego las que se muestran en el mapa
    if (a.showOnMap && !b.showOnMap) return -1
    if (!a.showOnMap && b.showOnMap) return 1

    return 0 // Orden original de resto (fecha de subida o id)
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
    await refreshPhotos()
  })

  async function refreshPhotos() {
    if (tripId) {
      try {
        photos = await mediaService.getTripPhotos(tripId)
      } catch (e) {
        console.error("Error cargando fotos", e)
        toast.error("Error al actualizar galería")
      }
    }
  }

  async function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      toast.info("Subiendo imagen...")
      try {
        const newPhoto = await mediaService.uploadLocalPhoto(
          tripId,
          input.files[0],
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

    // Auto-prompt GPS if missing
    if (!photo.showOnMap && !photo.metadata?.exif?.latitude) {
      toast.error("Por favor, añade una ubicación GPS a esta foto primero")
      selectedPhotosIds = [photo.id]
      isSelectionMode = true
      showBatchLocationModal = true
      batchSelectedCoords = null
      return
    }

    try {
      const photoId = photo.id
      const updated = await mediaService.updatePhoto(photoId, {
        showOnMap: !photo.showOnMap,
      })
      photos = photos.map((p) => (p.id === photoId ? updated : p))

      await tick()
      const newIndex = displayedPhotos.findIndex((p) => p.id === photoId)
      if (newIndex !== -1) activeIndex = newIndex

      toast.success(updated.showOnMap ? "Añadida al mapa" : "Ocultada del mapa")
    } catch (err) {
      toast.error("Error al actualizar la foto")
    }
  }

  async function toggleHiddenVisibility(photo: AppPhoto | null) {
    if (!photo) return
    try {
      const photoId = photo.id
      const updated = await mediaService.updatePhoto(photoId, {
        isHidden: !photo.isHidden,
      })
      photos = photos.map((p) => (p.id === photoId ? updated : p))

      await tick()
      const newIndex = displayedPhotos.findIndex((p) => p.id === photoId)
      if (newIndex !== -1) activeIndex = newIndex

      toast.success(
        updated.isHidden ? "Foto oculta de la galería" : "Foto restaurada",
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
          }),
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
        selectedAlbumId,
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
          asset.exifInfo, // Pass the exif info along
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
          .map((p) => p.externalId || p.id),
      )

      if (localImmichExternalIds.size > 0) {
        await Promise.all(
          allAlbums.map(async (album: any) => {
            try {
              const assets = await integrationsService.getImmichAlbumAssets(
                album.id,
              )
              album.isLinked = assets.some((a: any) =>
                localImmichExternalIds.has(a.id),
              )
            } catch (e) {
              album.isLinked = false
            }
          }),
        )
      } else {
        allAlbums.forEach((a: any) => (a.isLinked = false))
      }

      immichAlbums = allAlbums.filter((a: any) => a.isLinked)
      showUnlinkModal = true
    } catch (e) {
      toast.error("Error cargando álbumes de Immich.")
    } finally {
      isUnlinkingAlbum = false
    }
  }

  async function handleCommitUnlinkAlbum(
    event: CustomEvent<{ albumId: string }>,
  ) {
    const selectedAlbumId = event.detail.albumId
    if (!selectedAlbumId) return

    isUnlinkingAlbum = true
    toast.info("Desvinculando fotos del álbum seleccionado...")

    try {
      // 1. Get the assets for the selected album
      const assets = await integrationsService.getImmichAlbumAssets(
        selectedAlbumId,
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
        (p) => p.provider === "immich" && assetIds.has(p.externalId || p.id),
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
  let editingMetadataLocation = false
  let newMetadataLat: number | null = null
  let newMetadataLng: number | null = null

  async function saveMetadataLocation() {
    if (!selectedMetadataPhoto || !newMetadataLat || !newMetadataLng) return
    try {
      toast.info("Guardando ubicación...")
      const updatedExif = {
        ...selectedMetadataPhoto.metadata?.exif,
        latitude: newMetadataLat,
        longitude: newMetadataLng,
      }

      const updatedPhoto = await mediaService.updatePhoto(
        selectedMetadataPhoto.id,
        {
          metadata: {
            ...selectedMetadataPhoto.metadata,
            exif: updatedExif,
          },
        },
      )

      // Update local state arrays
      photos = photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p))
      selectedMetadataPhoto = updatedPhoto

      editingMetadataLocation = false
      toast.success("Ubicación guardada")
    } catch (err) {
      console.error(err)
      toast.error("Error al guardar la ubicación")
    }
  }

  function handleMetadataLocationSelect(
    e: CustomEvent<{ lat: number; lng: number }>,
  ) {
    newMetadataLat = e.detail.lat
    newMetadataLng = e.detail.lng
  }

  function showMetadata(photo: AppPhoto | null) {
    if (!photo) return
    selectedMetadataPhoto = photo
  }

  function closeMetadata() {
    selectedMetadataPhoto = null
    editingMetadataLocation = false
    newMetadataLat = null
    newMetadataLng = null
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
            <span class="country-tag">{getCountryFlag(country)} {country}</span>
          {/each}
        </div>
        <button
          class="btn btn-sm btn-secondary mx-auto mt-4 block"
          on:click={startEditTrip}
        >
          Editar Info
        </button>
      </div>
    </header>

    <section class="description-section">
      <h2>Acerca del viaje</h2>
      <p>{trip.description}</p>
    </section>

    <section class="locations-section">
      <div class="section-header">
        <h2>Lugares Visitados</h2>
        <button on:click={openAddLocation} class="btn btn-sm"
          >Añadir Lugar</button
        >
      </div>

      {#if tripLocations.length > 0}
        <div class="locations-grid">
          {#each tripLocations as location}
            {@const locPhoto = (function (loc, pts) {
              const id =
                loc.images && loc.images.length > 0 ? loc.images[0] : null
              return id ? pts.find((p) => p.id === id) : null
            })(location, photos)}
            <button
              class="location-card"
              on:click={() => openEditLocation(location)}
            >
              <div class="location-image">
                {#if locPhoto}
                  <img
                    src={getImageUrl(locPhoto)}
                    alt={location.name}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <ImagePlaceholder text={location.name} type="location" />
                {/if}
                <div class="edit-overlay">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path
                      d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                    /></svg
                  >
                </div>
              </div>
              <div class="location-info">
                <h3>{getCategoryEmoji(location.category)} {location.name}</h3>
                <p class="location-country">
                  {#if location.country}
                    {getCountryFlag(location.country)} {location.country}
                  {/if}
                </p>
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <p>No hay lugares registrados en este viaje aún.</p>
        </div>
      {/if}
    </section>

    <section
      class="gallery-section mt-12 bg-slate-900/40 rounded-2xl p-6 border border-slate-800/60 shadow-lg"
    >
      <div
        class="section-header flex flex-col items-start border-b border-slate-700/50 pb-5 mb-6"
      >
        <h2
          class="flex items-center text-2xl font-bold text-white mb-3 gap-3 w-full"
        >
          <div class="bg-blue-500/20 p-2 rounded-full">
            <Eye class="text-blue-400" size={24} />
          </div>
          Galería Fotográfica
        </h2>

        <div class="actions-group flex flex-wrap gap-3 items-center w-full">
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border {showHiddenPhotos
              ? 'bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-700'
              : 'bg-transparent border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
            on:click={() => (showHiddenPhotos = !showHiddenPhotos)}
          >
            {#if showHiddenPhotos}
              <Eye size={16} /> Mostrar Ocultas
            {:else}
              <EyeOff size={16} /> Ocultar de Galería
            {/if}
          </button>

          <div class="h-6 w-px bg-slate-700/50 mx-1 hidden sm:block" />

          <input
            type="file"
            bind:this={fileInput}
            on:change={handleFileUpload}
            accept="image/*"
            style="display:none;"
          />

          <button
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm shadow-blue-500/20"
            on:click={() => fileInput.click()}
          >
            <Upload size={16} /> Subir Foto
          </button>

          <div
            class="flex items-center border border-slate-700/50 rounded-lg overflow-hidden bg-transparent"
          >
            <button
              class="flex items-center justify-center p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              on:click={openImmichModal}
              disabled={isLinkingInfo || isUnlinkingAlbum}
              title="Vincular Álbum"
            >
              <LinkIcon size={16} />
            </button>
            <div class="w-px h-full bg-slate-700/50" />
            <button
              class="flex items-center justify-center p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              on:click={refreshPhotos}
              title="Refrescar"
            >
              <RefreshCcw size={16} />
            </button>
          </div>

          <button
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700/50 bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors {isSelectionMode
              ? 'bg-slate-800 text-white border-slate-600'
              : ''}"
            on:click={toggleSelectionMode}
          >
            <CheckSquare size={16} />
            {isSelectionMode ? "Cancelar Selección" : "Seleccionar"}
          </button>

          {#if isSelectionMode && selectedPhotosIds.length > 0}
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 transition-colors ml-auto"
              on:click={openBatchLocationPicker}
            >
              <MapPin size={16} /> Añadir GPS ({selectedPhotosIds.length})
            </button>
          {/if}

          {#if hasImmichPhotos}
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors ml-auto"
              on:click={handleUnlinkAlbum}
              disabled={isLinkingInfo || isUnlinkingAlbum}
            >
              <Trash2 size={16} />
              {isUnlinkingAlbum ? "Desvinculando..." : "Desvincular Álbum"}
            </button>
          {/if}
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
                {#key activeIndex}
                  <div class="gallery-fade">
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
                  </div>
                {/key}
                {#if selectedPhoto.isCover}
                  <span class="cover-badge">PORTADA</span>
                {/if}
                {#if selectedPhoto.provider === "immich"}
                  <img src="/immich.png" alt="Immich" class="provider-badge" />
                {/if}
              </div>

              <div class="thumbnails-wrapper bg-slate-900 pb-6 pt-4 px-2">
                <div
                  class="flex flex-nowrap justify-start overflow-x-auto gap-3 p-1 snap-x gallery-thumbs-scroll"
                >
                  {#each carouselImages as img, i}
                    <button
                      class="relative h-20 w-24 min-w-[96px] snap-center cursor-pointer transition-all rounded-xl overflow-hidden {activeIndex ===
                      i
                        ? 'ring-2 ring-blue-500 shadow-lg scale-105'
                        : 'opacity-70 hover:opacity-100 hover:scale-100'}"
                      on:click={(e) => {
                        if (isSelectionMode) {
                          e.preventDefault()
                          togglePhotoSelection(displayedPhotos[i].id)
                        } else {
                          activeIndex = i
                        }
                      }}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        class="h-full w-full object-cover"
                      />

                      <!-- Overlay gradient for better icon visibility -->
                      <div
                        class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"
                      />

                      {#if isSelectionMode}
                        <div
                          class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
                        >
                          {#if selectedPhotosIds.includes(displayedPhotos[i].id)}
                            <CheckCircle2
                              size={32}
                              class="text-blue-500 fill-white drop-shadow-md"
                            />
                          {:else}
                            <Circle
                              size={32}
                              class="text-white drop-shadow-md opacity-70"
                            />
                          {/if}
                        </div>
                      {/if}
                      {#if !displayedPhotos[i].metadata?.exif?.latitude}
                        <div
                          class="absolute top-1.5 right-1.5 bg-yellow-500/90 rounded-full p-1 shadow flex items-center justify-center"
                          title="Sin ubicación GPS"
                        >
                          <AlertTriangle size={12} class="text-slate-900" />
                        </div>
                      {/if}
                      {#if displayedPhotos[i].showOnMap && displayedPhotos[i].metadata?.exif?.latitude}
                        <div
                          class="absolute bottom-1.5 right-1.5 bg-blue-500/90 rounded-full p-1 shadow flex items-center justify-center"
                        >
                          <MapPin size={12} class="text-white" />
                        </div>
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Footer Toolbar -->
              <div
                class="flex justify-between items-center w-full mt-2 p-4 bg-slate-900 rounded-b-2xl border-t border-slate-800"
              >
                <button
                  class="flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-lg transition-colors border {selectedPhoto.showOnMap
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/30 hover:bg-blue-600/20'
                    : 'bg-transparent text-slate-400 border-slate-700/50 hover:bg-slate-800/50 hover:text-slate-200'}"
                  on:click={() => toggleMapVisibility(selectedPhoto)}
                >
                  {#if selectedPhoto.showOnMap}
                    <MapPin size={16} /> Ocultar del Mapa
                  {:else}
                    <MapPinOff size={16} /> Mostrar en Mapa
                  {/if}
                </button>

                <div class="flex items-center gap-2">
                  {#if !selectedPhoto.isCover}
                    <button
                      class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-amber-400 border border-amber-500/40 hover:bg-amber-500/10 transition-colors"
                      on:click={() => setCover(selectedPhoto)}
                    >
                      <Star size={16} /> Hacer Portada
                    </button>
                  {/if}

                  {#if selectedPhoto.metadata?.exif}
                    <button
                      class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-transparent text-slate-300 border border-slate-700/50 hover:bg-slate-800/50 transition-colors"
                      on:click={() => showMetadata(selectedPhoto)}
                    >
                      <Info size={16} /> Info
                    </button>
                  {/if}

                  <div class="w-px h-6 bg-slate-800 mx-2" />

                  <button
                    class="flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    on:click={() => toggleHiddenVisibility(selectedPhoto)}
                  >
                    <Trash2 size={16} />
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

    <div
      class="flex justify-between items-center mt-12 mb-8 gap-4 border-t border-border pt-6"
    >
      <button class="btn btn-danger font-medium" on:click={handleDelete}
        >Eliminar Viaje</button
      >
      <a href="/trips" class="btn btn-ghost font-medium">Volver a Viajes</a>
    </div>
  </div>
  <div
    class="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
  >
    <h1 class="text-2xl font-bold mb-4">Viaje no encontrado</h1>
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

{#if isEditingTrip}
  <div
    class="modal-backdrop pointer-events-auto flex items-center justify-center p-4"
  >
    <div
      class="modal card meta-modal w-full max-w-lg bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl overflow-y-auto max-h-[90vh] text-left"
    >
      <header class="modal-header flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white m-0">Editar Viaje</h3>
        <button
          class="text-slate-400 hover:text-white"
          on:click={() => (isEditingTrip = false)}>&times;</button
        >
      </header>

      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1"
            >Nombre</label
          >
          <input type="text" bind:value={editTripData.name} class="input-box" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1"
            >Estado</label
          >
          <select bind:value={editTripData.status} class="input-box">
            <option value="Planificado">Planificado</option>
            <option value="En curso">En curso</option>
            <option value="Completado">Completado</option>
          </select>
        </div>

        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-slate-300 mb-1"
              >Inicio</label
            >
            <input
              type="date"
              bind:value={editTripData.startDate}
              class="input-box"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-slate-300 mb-1"
              >Fin</label
            >
            <input
              type="date"
              bind:value={editTripData.endDate}
              on:focus={() => {
                if (!editTripData.endDate) {
                  editTripData.endDate =
                    editTripData.startDate ||
                    new Date().toISOString().split("T")[0]
                }
              }}
              class="input-box"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1"
            >Descripción</label
          >
          <textarea
            bind:value={editTripData.description}
            rows="3"
            class="input-box"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1"
            >Países</label
          >
          <div class="flex gap-2 mb-2">
            <CountryPicker id="edit-country" bind:value={countryInputValue} />
            <button
              class="btn btn-sm flex items-center justify-start gap-1"
              on:click={addCountryToEdit}
            >
              <Plus size={16} />
              Añadir
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            {#each editTripData.countries as country}
              <span
                class="inline-flex items-center gap-1 bg-slate-700 text-sm px-2 py-1 rounded-md text-white border border-slate-600"
              >
                {country}
                <button
                  class="text-red-400 hover:text-red-300 text-xs ml-1"
                  on:click={() => removeCountryFromEdit(country)}
                  >&times;</button
                >
              </span>
            {/each}
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-700">
        <button class="btn btn-ghost" on:click={() => (isEditingTrip = false)}
          >Cancelar</button
        >
        <button class="btn btn-primary" on:click={saveTripEdit}
          >Guardar Cambios</button
        >
      </div>
    </div>
  </div>
{/if}

{#if showLocationModal}
  <div
    class="scroll-content modal-backdrop pointer-events-auto flex items-center justify-center p-4"
  >
    <div
      class="modal card meta-modal w-full max-w-lg bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl overflow-y-auto max-h-[90vh] text-left"
    >
      <header class="modal-header flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white m-0">
          {editingLocation ? "Editar Lugar" : "Añadir Lugar"}
        </h3>
        <button
          class="text-slate-400 hover:text-white"
          on:click={() => (showLocationModal = false)}>&times;</button
        >
      </header>

      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1"
            >Nombre</label
          >
          <input
            type="text"
            bind:value={modalLocationName}
            placeholder="Ej: Torre Eiffel"
            class="input-box"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1"
            >Descripción</label
          >
          <textarea
            bind:value={modalLocationDescription}
            class="input-box"
            rows="2"
            placeholder="Descripción opcional"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1"
            >Categoría</label
          >
          <select bind:value={modalLocationCategory} class="input-box">
            <option value="Monumento">Monumento</option>
            <option value="Naturaleza">Naturaleza</option>
            <option value="Ciudad">Ciudad</option>
            <option value="Ciudad de escala">Ciudad de escala</option>
            <option value="Cultura">Cultura</option>
            <option value="Playa">Playa</option>
            <option value="Montaña">Montaña</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2"
            >Vincular con Foto (Opcional)</label
          >
          {#if displayedPhotos.length > 0}
            <div class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {#each displayedPhotos as photo}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                  class="flex-shrink-0 relative rounded-md overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 {selectedPhotoForLocation?.id ===
                  photo.id
                    ? 'border-blue-500 opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-100'}"
                  style="width: 60px; height: 60px;"
                  on:click={() => handleLinkPhotoToLocation(photo)}
                >
                  <img
                    src={getImageUrl(photo)}
                    alt="Miniatura"
                    class="w-full h-full object-cover"
                  />
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-xs text-slate-400">
              No hay fotos en este viaje aún.
            </p>
          {/if}
        </div>

        {#if modalLocationCountry}
          <span class="country-tag"
            >{getCountryFlag(modalLocationCountry)} {modalLocationCountry}</span
          >
          <!-- <div>
            <label class="block text-sm font-medium text-slate-300 mb-1"
              >{editingLocation ? "País" : "País detectado"}</label
            >
            <div
              class="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 text-slate-400 min-h-[42px] content-center"
            >
              {modalLocationCountry ||
                "Selecciona un punto en el mapa para detectar"}
            </div>
          </div> -->
        {/if}

        <div>
          <label
            class="flex justify-between items-center text-sm font-medium text-slate-300 mb-1"
          >
            <span>Ubicación</span>
            {#if modalLocationLat && modalLocationLng}
              <span
                class="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700"
              >
                {modalLocationLat.toFixed(5)}, {modalLocationLng.toFixed(5)}
              </span>
            {/if}
          </label>
          <div class="mt-1 border border-slate-700 rounded-md overflow-hidden">
            <LocationPicker
              height="200px"
              initialLocation={modalLocationLat !== 0
                ? { lat: modalLocationLat, lng: modalLocationLng }
                : null}
              on:locationSelect={handleLocationModalSelect}
            />
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-700">
        {#if editingLocation}
          <button
            class="btn btn-danger mr-auto"
            on:click={requestDeleteLocation}>Eliminar</button
          >
        {/if}
        <button
          class="btn btn-ghost"
          on:click={() => (showLocationModal = false)}>Cancelar</button
        >
        <button class="btn btn-primary" on:click={saveLocation}>Guardar</button>
      </div>
    </div>
  </div>
{/if}

{#if selectedMetadataPhoto}
  <div class="modal-backdrop" on:click|self={closeMetadata}>
    <div class="modal card meta-modal">
      <header
        class="modal-header flex flex-row justify-between items-start border-b border-slate-700 pb-3 mb-4"
      >
        <h3 class="text-xl font-semibold flex items-center gap-2">
          <MapPin size={20} class="text-blue-400" /> Info. Fotográfica
        </h3>
        <button
          class="close-btn text-slate-400 hover:text-white text-2xl leading-none"
          on:click={closeMetadata}>&times;</button
        >
      </header>
      <div class="modal-body meta-body flex flex-col gap-4">
        {#if selectedMetadataPhoto.metadata?.exif}
          <div
            class="meta-item flex flex-col bg-slate-800/50 p-3 rounded-lg border border-slate-700"
          >
            <span
              class="meta-label text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1"
              >Dispositivo</span
            >
            <span class="meta-val font-medium text-slate-200"
              >{selectedMetadataPhoto.metadata.exif.make || "Desconocido"}
              {selectedMetadataPhoto.metadata.exif.model || ""}</span
            >
          </div>
          <div
            class="meta-item flex flex-col bg-slate-800/50 p-3 rounded-lg border border-slate-700"
          >
            <span
              class="meta-label text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1"
              >Fecha de captura</span
            >
            <span class="meta-val font-medium text-slate-200"
              >{selectedMetadataPhoto.metadata.exif.dateTimeOriginal
                ? formatDate(
                    selectedMetadataPhoto.metadata.exif.dateTimeOriginal,
                  )
                : "Desconocida"}</span
            >
          </div>
          <div
            class="meta-item flex flex-col bg-slate-800/50 p-3 rounded-lg border border-slate-700"
          >
            <div class="flex justify-between items-center mb-1">
              <span
                class="meta-label text-xs text-slate-400 uppercase tracking-wider font-semibold"
                >Ubicación (Lat/Lng)</span
              >
              <button
                class="text-xs text-blue-400 hover:text-blue-300 font-medium"
                on:click={() =>
                  (editingMetadataLocation = !editingMetadataLocation)}
              >
                {editingMetadataLocation
                  ? "Cancelar Edición"
                  : "Editar Ubicación"}
              </button>
            </div>
            <span class="meta-val font-medium text-slate-200">
              {#if editingMetadataLocation}
                <div class="mt-2 mb-3">
                  <LocationPicker
                    height="200px"
                    initialLocation={newMetadataLat && newMetadataLng
                      ? { lat: newMetadataLat, lng: newMetadataLng }
                      : selectedMetadataPhoto.metadata.exif.latitude
                      ? {
                          lat: selectedMetadataPhoto.metadata.exif.latitude,
                          lng: selectedMetadataPhoto.metadata.exif.longitude,
                        }
                      : null}
                    on:locationSelect={handleMetadataLocationSelect}
                  />
                </div>
                {#if newMetadataLat && newMetadataLng}
                  <button
                    class="btn btn-sm w-full py-2"
                    on:click={saveMetadataLocation}
                  >
                    <MapPin size={16} /> Guardar Ubicación
                  </button>
                {/if}
              {:else if selectedMetadataPhoto.metadata.exif.latitude !== null && selectedMetadataPhoto.metadata.exif.longitude !== null}
                {selectedMetadataPhoto.metadata.exif.latitude.toFixed(6)}, {selectedMetadataPhoto.metadata.exif.longitude.toFixed(
                  6,
                )}
                {#if newMetadataLat && newMetadataLng && !editingMetadataLocation}
                  <div class="text-xs text-green-400 mt-1">
                    Ubicación Actualizada en este dispositivo.
                  </div>
                {/if}
                {#if !editingMetadataLocation}
                  <div class="mt-3">
                    <MiniStaticMap
                      lat={selectedMetadataPhoto.metadata.exif.latitude}
                      lng={selectedMetadataPhoto.metadata.exif.longitude}
                      height="120px"
                    />
                  </div>
                {/if}
              {:else}
                No disponible en EXIF
              {/if}
            </span>
          </div>
          <div
            class="meta-item flex flex-col bg-slate-800/50 p-3 rounded-lg border border-slate-700"
          >
            <span
              class="meta-label text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1"
              >Lente</span
            >
            <span class="meta-val font-medium text-slate-200"
              >{selectedMetadataPhoto.metadata.exif.lensModel ||
                "Desconocido"}</span
            >
          </div>
        {:else}
          <div
            class="flex flex-col items-center justify-center p-6 text-center text-slate-400"
          >
            <MapPinOff size={48} class="mb-4 opacity-50" />
            <p>No hay metadatos EXIF disponibles para esta foto.</p>
          </div>
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

{#if showBatchLocationModal}
  <div
    class="modal-backdrop pointer-events-auto flex items-center justify-center p-4"
  >
    <div
      class="modal card w-full max-w-lg bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl overflow-y-auto max-h-[90vh] text-left"
    >
      <header class="modal-header flex justify-between items-center mb-6">
        <h3 class="text-lg font-bold text-white m-0 tracking-tight">
          Añadir GPS a {selectedPhotosIds.length} fotos
        </h3>
        <button
          class="text-slate-400 hover:text-white transition-colors"
          on:click={() => (showBatchLocationModal = false)}>&times;</button
        >
      </header>

      <div class="mb-4 text-sm text-slate-300">
        Haz clic en el mapa para establecer una ubicación GPS para todas las
        fotos seleccionadas.
      </div>

      <div class="mb-6 rounded-lg overflow-hidden border border-slate-700/50">
        <LocationPicker on:locationSelect={handleBatchLocationSelect} />
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <button
          class="btn btn-secondary flex-1"
          on:click={() => (showBatchLocationModal = false)}>Cancelar</button
        >
        <button
          class="btn btn-primary flex-1"
          disabled={!batchSelectedCoords}
          on:click={saveBatchLocation}>Guardar Ubicación</button
        >
      </div>
    </div>
  </div>
{/if}

{#if showDeleteConfirm}
  <div
    class="modal-backdrop pointer-events-auto flex items-center justify-center p-4"
    style="z-index: 9999;"
  >
    <div
      class="modal card w-full max-w-sm bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl text-center"
    >
      <h3 class="text-lg font-bold text-white mb-2">Eliminar Lugar</h3>
      <p class="text-slate-300 text-sm mb-6">
        ¿Estás seguro de que quieres eliminar este lugar de forma permanente?
        Esta acción no se puede deshacer.
      </p>

      <div class="flex gap-3 justify-center">
        <button
          class="btn btn-secondary flex-1"
          on:click={() => (showDeleteConfirm = false)}>Cancelar</button
        >
        <button
          class="btn btn-danger flex-1 bg-red-500 hover:bg-red-600 border-none text-white"
          on:click={confirmDeleteLocation}>Eliminar</button
        >
      </div>
    </div>
  </div>
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
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s;
    text-align: left;
    width: 100%;
    font: inherit;
    color: inherit;
    padding: 0;
  }
  .location-card:hover {
    transform: translateY(-2px);
    border-color: #6366f1;
  }
  .location-card:hover .edit-overlay {
    opacity: 1;
  }

  .location-image {
    height: 150px;
    position: relative;
  }

  .edit-overlay {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.2s;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid #475569;
    background: #1e293b;
    color: #cbd5e1;
    font-size: 0.9rem;
  }

  .btn-secondary {
    background: transparent;
    color: #60a5fa;
    border-color: #60a5fa;
    border: 1px solid #60a5fa;
  }

  .btn-secondary:hover {
    background: rgba(96, 165, 250, 0.1);
    color: #60a5fa;
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

  /* Fade transition for gallery image switching */
  .gallery-fade {
    animation: galleryFadeIn 300ms ease-out;
    width: 100%;
    height: 100%;
  }
  @keyframes galleryFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Gallery thumbnails scrollbar */
  .gallery-thumbs-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(100, 116, 139, 0.4) transparent;
  }
  .gallery-thumbs-scroll::-webkit-scrollbar {
    height: 6px;
  }
  .gallery-thumbs-scroll::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
  }
  .gallery-thumbs-scroll::-webkit-scrollbar-thumb {
    background: rgba(100, 116, 139, 0.35);
    border-radius: 999px;
    transition: background 0.2s;
  }
  .gallery-thumbs-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.5);
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
