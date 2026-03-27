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
  import { getCountryFlag, getCountryName } from "$lib/utils/countries"
  import { languageStore } from "$lib/stores/ui"
  import ImagePlaceholder from "$lib/components/ui/ImagePlaceholder.svelte"
  import AlbumModal from "$lib/components/ui/AlbumModal.svelte"
  import CountryMultiSelect from "$lib/components/ui/CountryMultiSelect.svelte"
  import ProvinceMultiSelect from "$lib/components/ui/ProvinceMultiSelect.svelte"
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
    X,
    Camera,
    Image,
    Monitor,
    Globe,
    Save,
  } from "lucide-svelte"
  import { onMount, tick } from "svelte"
  import { fade, slide } from "svelte/transition"
  import { mediaService, type AppPhoto } from "$lib/services/media"
  import { integrationsService } from "$lib/services/integrations"
  import { API_URL } from "$lib/services/auth"
  import { toast } from "$lib/stores/ui"
  import { reverseGeocode } from "$lib/utils/geocode"
  import { normalizeString } from "$lib/utils/string"
  import { SPAIN_PROVINCES } from "$lib/utils/provinces"

  import { tripsService } from "$lib/services/trips"
  import { locationsService } from "$lib/services/locations"
  import { t } from "$lib/stores/i18n"

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
  let modalLocationAdminArea1 = ""
  let modalLocationAdminArea2 = ""
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
    modalLocationAdminArea1 = ""
    modalLocationAdminArea2 = ""
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
    modalLocationAdminArea1 = loc.adminArea1 || ""
    modalLocationAdminArea2 = loc.adminArea2 || ""
    selectedPhotoForLocation = null // If they want to link a new photo, they can
    showLocationModal = true
  }

  async function handleLocationModalSelect(
    e: CustomEvent<{
      lat: number
      lng: number
      country?: string
      province?: string
      county?: string
    }>,
  ) {
    modalLocationLat = e.detail.lat
    modalLocationLng = e.detail.lng

    if (e.detail.country !== undefined) {
      modalLocationCountry = e.detail.country || ""
      modalLocationAdminArea1 = e.detail.province || ""
      modalLocationAdminArea2 = e.detail.county || ""
    } else {
      const result = await reverseGeocode(e.detail.lat, e.detail.lng)
      if (result) {
        modalLocationCountry = result.countryCode || ""
        if (modalLocationCountry === "ES" && result.state) {
          const normalizedState = normalizeString(result.state)
          const matched = SPAIN_PROVINCES.find((p) => {
            const normalizedP = normalizeString(p.name)
            return (
              normalizedState.includes(normalizedP) ||
              normalizedP.includes(normalizedState)
            )
          })
          if (matched) modalLocationAdminArea1 = matched.name
          else modalLocationAdminArea1 = ""
        } else {
          modalLocationAdminArea1 = result.state || ""
        }
        modalLocationAdminArea2 = result.county || ""
      }
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
      const result = await reverseGeocode(lat, lng)
      if (result) {
        modalLocationCountry = result.countryCode || ""
        if (modalLocationCountry === "ES" && result.state) {
          const normalizedState = normalizeString(result.state)
          const matched = SPAIN_PROVINCES.find((p) => {
            const normalizedP = normalizeString(p.name)
            return (
              normalizedState.includes(normalizedP) ||
              normalizedP.includes(normalizedState)
            )
          })
          if (matched) modalLocationAdminArea1 = matched.name
          else modalLocationAdminArea1 = ""
        } else {
          modalLocationAdminArea1 = result.state || ""
        }
        modalLocationAdminArea2 = result.county || ""
      }
      toast.success($t("trip.photoLinkedGps"))
    } else {
      toast.success($t("trip.photoLinkedNoGps"))
    }
  }

  async function saveLocation() {
    if (!modalLocationName) {
      toast.error($t("form.nameRequired"))
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
        adminArea1: modalLocationAdminArea1,
        adminArea2: modalLocationAdminArea2,
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

      toast.success($t("trip.locationUpdated"))
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
        adminArea1: modalLocationAdminArea1,
        adminArea2: modalLocationAdminArea2,
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

      toast.success($t("trip.locationAdded"))
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

      toast.success($t("trip.locationDeleted"))
      showLocationModal = false
      editingLocation = null
    } catch (err) {
      console.error("[deleteLocation] Failed to delete location:", err)
      toast.error($t("trip.errorDeletingLocation"))
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
    e: CustomEvent<{
      lat: number
      lng: number
      country?: string
      province?: string
      county?: string
    }>,
  ) {
    batchSelectedCoords = e.detail
  }

  async function saveBatchLocation() {
    if (!batchSelectedCoords) {
      toast.error($t("trip.selectLocationPrompt"))
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
      toast.success(
        $t("trip.batchGpsSuccess", { count: selectedPhotosIds.length }),
      )

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
      toast.error($t("trip.batchGpsError"))
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
    provinces: [] as string[],
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
      provinces: [...(trip.provinces || [])],
    }
    isEditingTrip = true
  }

  async function saveTripEdit() {
    if (!editTripData.name.trim()) {
      toast.error($t("form.nameRequired"))
      return
    }
    if (!editTripData.startDate) {
      toast.error($t("form.startDateRequired"))
      return
    }

    try {
      toast.info($t("form.saving"))
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
      toast.success($t("trip.tripUpdated"))
    } catch (error) {
      console.error($t("trip.errorUpdatingTrip"), error)
      toast.error($t("trip.tripUpdateError"))
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
    if (confirm($t("trip.deleteConfirm"))) {
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
  let isImportingPhotos = false
  let importingProgress = { current: 0, total: 0 }
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
        console.error($t("trip.errorLoadingPhotos"), e)
        toast.error($t("trip.errorRefreshingGallery"))
      }
    }
  }

  async function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      toast.info($t("trip.uploading"))
      try {
        // Convertir FileList a Array y subir todos
        const filesArray = Array.from(input.files)
        const newPhotos = await mediaService.uploadLocalPhoto(
          tripId,
          filesArray,
        )
        // newPhotos es un array, lo extendemos al inicio
        photos = [...newPhotos, ...photos]
        input.value = "" // Reset
        toast.success($t("trip.uploadSuccess"))
      } catch (err) {
        console.error($t("trip.errorUploadingPhoto"), err)
        toast.error($t("trip.uploadError"))
      }
    }
  }

  async function toggleMapVisibility(photo: AppPhoto | null) {
    if (!photo) return

    // Auto-prompt GPS if missing
    if (!photo.showOnMap && !photo.metadata?.exif?.latitude) {
      toast.error($t("trip.addGpsPrompt"))
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

      toast.success(
        updated.showOnMap ? $t("trip.addedToMap") : $t("trip.hiddenFromMap"),
      )
    } catch (err) {
      toast.error($t("trip.errorUpdatingPhoto"))
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
        updated.isHidden ? $t("trip.photoHidden") : $t("trip.photoRestored"),
      )
    } catch (err) {
      toast.error($t("trip.errorHidingPhoto"))
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
      toast.success($t("trip.coverUpdated"))
    } catch (err) {
      console.error($t("trip.errorSettingCover"), err)
      toast.error($t("trip.errorSettingCover"))
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
      toast.error($t("trip.immichConnectError"))
    }
  }

  async function handleLinkAlbum(event: CustomEvent<{ albumId: string }>) {
    const selectedAlbumId = event.detail.albumId
    if (!selectedAlbumId) return
    
    isImportingPhotos = true
    importingProgress = { current: 0, total: 0 }
    isLinkingInfo = true
    showImmichModal = false
    toast.info($t("trip.importingImmichPhotos"))
    
    try {
      const assets = await integrationsService.getImmichAlbumAssets(
        selectedAlbumId,
      )
      const status = await integrationsService.checkStatus()

      importingProgress.total = assets.length
      let count = 0
      for (const asset of assets) {
        let cleanBase = status.url.endsWith("/api")
          ? status.url.slice(0, -4)
          : status.url
        const assetUrl = `${cleanBase}/api/assets/${asset.id}/thumbnail?size=preview`

        const newPhoto = await mediaService.linkExternalPhoto(
          tripId,
          assetUrl,
          asset.id,
          asset.exifInfo,
        )
        photos = [newPhoto, ...photos]
        count++
        importingProgress.current = count
      }
      toast.success($t("trip.immichImportSuccess", { count }))
    } catch (err) {
      console.error(err)
      toast.error($t("trip.immichImportError"))
    } finally {
      isImportingPhotos = false
      importingProgress = { current: 0, total: 0 }
      isLinkingInfo = false
    }
  }

  async function handleUnlinkAlbum() {
    isUnlinkingAlbum = true
    toast.info($t("trip.checkingLinkedAlbums"))
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
      toast.error($t("trip.errorLoadingImmichAlbums"))
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
    toast.info($t("trip.unlinkingAlbumPhotos"))

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
      toast.success($t("trip.albumUnlinkSuccess", { count: deletedCount }))
    } catch (err) {
      console.error(err)
      toast.error($t("trip.errorUnlinkingAlbum"))
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
      toast.info($t("trip.savingLocation"))
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
      toast.success($t("trip.locationSaved"))
    } catch (err) {
      console.error($t("trip.errorSavingLocation"), err)
      toast.error($t("trip.errorSavingLocation"))
    }
  }

  function handleMetadataLocationSelect(
    e: CustomEvent<{
      lat: number
      lng: number
      country?: string
      province?: string
      county?: string
    }>,
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
        <div class="badge {getStatusColor(trip.status)}">
          {$t(`status.${trip.status}`)}
        </div>
        <h1>{trip.name}</h1>
        <p class="dates">
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
        </p>
        <div class="countries-section">
          {#each trip.countries as country}
            <div class="country-group">
              <span class="country-tag">
                {getCountryFlag(country)}
                {getCountryName(country, $languageStore)}
              </span>

              {#if country === "ES" && trip.provinces && trip.provinces.length > 0}
                <div class="provinces-list" transition:slide>
                  {#each trip.provinces as provName}
                    {@const province = SPAIN_PROVINCES.find(
                      (p) => p.name === provName,
                    )}
                    <span class="province-tag">
                      {province?.name}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
        <button
          class="btn btn-sm btn-secondary mx-auto mt-4 block"
          on:click={startEditTrip}
        >
          {$t("trip.editInfo")}
        </button>
      </div>
    </header>

    <section class="description-section">
      <h2>{$t("trip.about")}</h2>
      {#if trip.description}
        <p>{trip.description}</p>
      {:else}
        <button
          class="btn btn-sm btn-secondary mx-auto mt-4 block"
          on:click={startEditTrip}
        >
          {$t("trip.addDescription")}
        </button>
      {/if}
    </section>

    <section class="locations-section">
      <div class="section-header">
        <h2>{$t("trip.locationsTitle")}</h2>
        <button on:click={openAddLocation} class="btn btn-sm"
          >{$t("trip.addLocation")}</button
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
                    {getCountryFlag(location.country)}
                    {getCountryName(location.country, $languageStore)}
                  {/if}
                </p>
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <p>{$t("trip.emptyLocations")}</p>
        </div>
      {/if}
    </section>

    <section
      class="gallery-section mt-12 bg-slate-900/40 rounded-2xl p-6 border border-slate-800/60 shadow-lg"
    >
      <div
        class="section-header sm:flex hidden flex-col items-start border-b border-slate-700/50 pb-5 mb-6"
      >
        <h2
          class="flex items-center text-2xl font-bold text-white mb-3 gap-3 w-full"
        >
          <div class="bg-blue-500/20 p-2 rounded-full">
            <Eye class="text-blue-400" size={24} />
          </div>
          {$t("trip.galleryTitle")}
        </h2>

        <div class="actions-group flex flex-wrap gap-3 items-center w-full">
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border {showHiddenPhotos
              ? 'bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-700'
              : 'bg-transparent border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
            on:click={() => (showHiddenPhotos = !showHiddenPhotos)}
          >
            {#if showHiddenPhotos}
              <Eye size={16} /> {$t("trip.hideHidden")}
            {:else}
              <EyeOff size={16} /> {$t("trip.showHidden")}
            {/if}
          </button>

          <div class="h-6 w-px bg-slate-700/50 mx-1 hidden sm:block" />

          <input
            type="file"
            bind:this={fileInput}
            on:change={handleFileUpload}
            multiple
            accept="image/*"
            style="display:none;"
          />

          <button
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm shadow-blue-500/20"
            on:click={() => fileInput.click()}
          >
            <Upload size={16} />
            {$t("trip.uploadPhoto")}
          </button>

          <div
            class="flex items-center border border-slate-700/50 rounded-lg overflow-hidden bg-transparent"
          >
            <button
              class="flex items-center justify-center p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              on:click={openImmichModal}
              disabled={isLinkingInfo || isUnlinkingAlbum}
              title={$t("trip.linkAlbum")}
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
            {isSelectionMode
              ? $t("trip.cancelSelection")
              : $t("trip.selectMultiple")}
          </button>

          {#if isSelectionMode && selectedPhotosIds.length > 0}
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 transition-colors ml-auto"
              on:click={openBatchLocationPicker}
            >
              <MapPin size={16} />
              {$t("trip.batchGps")} ({selectedPhotosIds.length})
            </button>
          {/if}

          {#if hasImmichPhotos}
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors ml-auto"
              on:click={handleUnlinkAlbum}
              disabled={isLinkingInfo || isUnlinkingAlbum}
            >
              <Trash2 size={16} />
              {isUnlinkingAlbum ? $t("trip.unlinking") : $t("trip.unlinkAlbum")}
            </button>
          {/if}
        </div>
      </div>

      <!-- Mobile-only Gallery Header and Toolbar -->
      <div class="sm:hidden mb-4">
        <h2 class="text-xl font-bold flex items-center gap-2 text-white">
          <div class="bg-blue-500/20 p-2 rounded-full">
            <Eye class="text-blue-400" size={24} />
          </div>
          {$t("trip.galleryTitle")}
        </h2>

        <div
          class="mobile-gallery-toolbar mt-4 flex items-center justify-between bg-slate-800/50 p-2 rounded-xl border border-slate-700/50"
        >
          <button
            class="p-2 rounded-lg bg-blue-600 text-white shadow-lg"
            on:click={() => fileInput.click()}
            title={$t("trip.uploadPhoto")}
          >
            <Upload size={20} />
          </button>

          <button
            class="p-2 rounded-lg text-slate-300 hover:bg-slate-700/50"
            on:click={openImmichModal}
            title={$t("trip.linkAlbum")}
          >
            <LinkIcon size={20} />
          </button>

          <button
            class="p-2 rounded-lg text-slate-300 hover:bg-slate-700/50"
            on:click={refreshPhotos}
            title={$t("trip.refreshPhotos")}
          >
            <RefreshCcw size={20} />
          </button>

          <button
            class="p-2 rounded-lg {isSelectionMode
              ? 'text-blue-400 bg-blue-400/10'
              : 'text-slate-300 hover:bg-slate-700/50'}"
            on:click={toggleSelectionMode}
            title={$t("trip.selectPhotos")}
          >
            <CheckSquare size={20} />
          </button>

          <button
            class="p-2 rounded-lg text-red-400 hover:bg-red-400/10"
            on:click={handleUnlinkAlbum}
            disabled={!hasImmichPhotos}
            title={$t("trip.unlinkAlbum")}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {#if displayedPhotos.length > 0 || isImportingPhotos}
        <div class="gallery-container">
          {#if selectedPhoto}
            <div
              class="main-photo-card"
              class:is-cover={selectedPhoto.isCover}
              class:is-hidden={selectedPhoto.isHidden}
            >
              <div
                class="main-img-wrapper overflow-hidden rounded-2xl md:rounded-b-none"
              >
                <!-- Blurred background for "full" look -->
                {#if selectedPhoto}
                  <div
                    class="main-img-bg absolute inset-0 bg-cover bg-center scale-110 transition-all duration-500"
                    style="background-image: url({getImageUrl(selectedPhoto)})"
                  />
                {/if}

                {#key activeIndex}
                  <div class="gallery-fade h-full w-full relative z-[1]">
                    <!-- <Carousel
                      images={carouselImages}
                      bind:index={activeIndex}
                      slideDuration={0}
                      let:Controls
                      let:Indicators
                      class="h-full w-full"
                      imgClass="object-contain h-full w-full"
                    >
                      <Controls
                        class="opacity-0 hover:opacity-100 transition-opacity"
                      />
                      {#if carouselImages.length <= 8}
                        <Indicators />
                      {/if}
                    </Carousel>-->
                  </div>
                {/key}

                {#if selectedPhoto.isCover}
                  <span
                    class="cover-badge absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-[5] flex items-center gap-1"
                  >
                    <Star size={12} fill="white" />
                    {$t("trip.coverBadge")}
                  </span>
                {/if}

                <!-- Top Right Badges (Map + Provider) -->
                <div
                  class="absolute top-4 right-4 flex items-center gap-2 z-[5]"
                >
                  {#if selectedPhoto.showOnMap && selectedPhoto.metadata?.exif?.latitude}
                    <div
                      class="bg-blue-600 text-white p-2 rounded-full shadow-lg"
                    >
                      <MapPin size={18} />
                    </div>
                  {/if}

                  {#if selectedPhoto.provider === "immich"}
                    <div class="p-1.5 rounded-lg">
                      <img src="/immich.png" alt="Immich" class="h-8 w-8" />
                    </div>
                  {:else}
                    <div
                      class="bg-slate-800/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700 shadow-lg text-slate-300"
                      title="Local"
                    >
                      <Monitor size={16} />
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Thumbnails horizontal scroll -->
              <div
                class="thumbnails-wrapper bg-slate-900/40 backdrop-blur-sm py-4 px-2"
              >
                <div
                  class="flex flex-nowrap justify-start overflow-x-auto gap-3 p-1 snap-x gallery-thumbs-scroll custom-scrollbar"
                >
                  {#each carouselImages as img, i}
                    <button
                      class="relative h-24 w-32 min-w-[128px] snap-center cursor-pointer transition-all rounded-xl overflow-hidden {activeIndex ===
                      i
                        ? 'ring-2 ring-blue-500 shadow-xl scale-105 z-10'
                        : 'opacity-60 grayscale-[20%] hover:opacity-100 hover:grayscale-0'}"
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

                      {#if displayedPhotos[i].showOnMap && displayedPhotos[i].metadata?.exif?.latitude}
                        <div
                          class="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-md"
                        >
                          <MapPin size={10} />
                        </div>
                      {/if}

                      {#if displayedPhotos[i].isCover}
                        <div
                          class="absolute top-2 left-2 bg-amber-500 text-white rounded-full p-1 shadow-md"
                        >
                          <Star size={10} fill="white" />
                        </div>
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Action Toolbar -->
              <div
                class="flex flex-wrap md:flex-nowrap justify-between items-center w-full p-4 bg-slate-900/80 backdrop-blur-md rounded-b-2xl border-t border-slate-800 gap-y-3"
              >
                <button
                  class="flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-sm rounded-xl transition-all border flex-1 md:flex-none {selectedPhoto.showOnMap
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'}"
                  on:click={() => toggleMapVisibility(selectedPhoto)}
                >
                  {#if selectedPhoto.showOnMap}
                    <MapPin size={18} /> {$t("trip.hideFromMap")}
                  {:else}
                    <MapPinOff size={18} /> {$t("trip.addToMap")}
                  {/if}
                </button>

                <div
                  class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none"
                >
                  <button
                    class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border {selectedPhoto.isCover
                      ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 text-amber-500 border-amber-500/30 hover:bg-slate-700'}"
                    on:click={() => setCover(selectedPhoto)}
                  >
                    <Star
                      size={18}
                      fill={selectedPhoto.isCover ? "white" : "none"}
                    />
                    {$t("trip.coverBadge")}
                  </button>

                  <button
                    class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
                    on:click={() => showMetadata(selectedPhoto)}
                  >
                    <Info size={18} />
                    {$t("trip.info")}
                  </button>

                  <button
                    class="flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-all {selectedPhoto.isHidden
                      ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'}"
                    on:click={() => toggleHiddenVisibility(selectedPhoto)}
                  >
                    <Trash2 size={18} />
                    {selectedPhoto.isHidden
                      ? $t("trip.showInGallery")
                      : $t("trip.removeFromGallery")}
                  </button>
                </div>
              </div>
            </div>
          {/if}

          {#if isImportingPhotos}
            <div class="import-progress p-6 bg-slate-800/50 rounded-xl">
              <div class="flex items-center justify-between mb-2">
                <span class="text-slate-300 font-medium">{$t("trip.importingImmichPhotos")}</span>
                <span class="text-blue-400 font-bold">{importingProgress.current} / {importingProgress.total}</span>
              </div>
              <div class="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  class="bg-blue-500 h-full transition-all duration-300 ease-out"
                  style="width: {importingProgress.total > 0 ? (importingProgress.current / importingProgress.total) * 100 : 0}%"
                ></div>
              </div>
            </div>
          {/if}
        </div>
      {:else if !isImportingPhotos}
        <div class="empty-state">
          <p>
            {$t("trip.emptyGallery")}
          </p>
        </div>
      {/if}
    </section>

    <div
      class="flex justify-between items-center mt-12 mb-8 gap-4 border-t border-border pt-6"
    >
      <button class="btn btn-danger font-medium" on:click={handleDelete}
        >{$t("trip.deleteTrip")}</button
      >
      <a href="/trips" class="btn btn-ghost font-medium">{$t("trip.back")}</a>
    </div>
  </div>
{:else}
  <div
    class="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
  >
    <h1 class="text-2xl font-bold mb-4">{$t("trip.notFound")}</h1>
    <a href="/trips" class="btn btn-primary">{$t("trip.backToTrips")}</a>
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
    class="modal-backdrop pointer-events-auto"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="premium-modal w-full max-w-lg"
      transition:slide={{ duration: 300, axis: "y" }}
    >
      <!-- Header -->
      <header class="modal-header-premium">
        <div class="header-main">
          <div class="header-icon edit-icon">
            <Globe size={24} />
          </div>
          <div class="header-text">
            <h3>{$t("trip.editTripHeader")}</h3>
            <p class="subheader text-purple-400">
              {$t("trip.editTripSubheader")}
            </p>
          </div>
        </div>
        <button
          class="btn-close-modal"
          on:click={() => (isEditingTrip = false)}
        >
          <X size={20} />
        </button>
      </header>

      <!-- Body -->
      <div class="modal-body-scroll scroll-content">
        <div class="form-grid">
          <!-- Name -->
          <div class="form-field-group full-width-field">
            <span class="field-label">{$t("trip.tripName")}</span>
            <input
              type="text"
              bind:value={editTripData.name}
              placeholder={$t("form.namePlaceholder")}
              class="premium-input"
            />
          </div>

          <!-- Status -->
          <div class="form-field-group">
            <span class="field-label">{$t("trip.tripStatus")}</span>
            <select bind:value={editTripData.status} class="premium-select">
              <option value="Planificado">{$t("status.Planificado")}</option>
              <option value="En curso">{$t("status.En curso")}</option>
              <option value="Completado">{$t("status.Completado")}</option>
            </select>
          </div>

          <!-- Description -->
          <div class="form-field-group full-width-field">
            <span class="field-label">{$t("trip.tripDescription")}</span>
            <textarea
              bind:value={editTripData.description}
              class="premium-textarea"
              rows="3"
              placeholder={$t("form.descPlaceholder")}
            />
          </div>

          <!-- Dates -->
          <div class="form-field-group">
            <span class="field-label">{$t("form.startDate")}</span>
            <input
              type="date"
              bind:value={editTripData.startDate}
              class="premium-input"
            />
          </div>
          <div class="form-field-group">
            <span class="field-label">{$t("form.endDate")}</span>
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
              class="premium-input"
            />
          </div>

          <!-- Countries -->
          <div class="form-field-group full-width-field">
            <span class="field-label">{$t("trip.tripCountries")}</span>
            <CountryMultiSelect
              bind:selectedCountries={editTripData.countries}
            />
          </div>

          <!-- Provinces -->
          {#if editTripData.countries.includes("ES")}
            <div transition:slide class="form-field-group full-width-field">
              <span class="field-label">{$t("trip.tripProvinces")}</span>
              <ProvinceMultiSelect
                bind:selectedProvinces={editTripData.provinces}
              />
            </div>
          {/if}
        </div>
      </div>

      <!-- Footer -->
      <footer class="premium-modal-footer">
        <button
          class="btn-cancel-premium"
          on:click={() => (isEditingTrip = false)}
        >
          {$t("form.cancel")}
        </button>

        <button
          class="btn-save-premium"
          on:click={saveTripEdit}
          disabled={!editTripData.name}
        >
          <Save size={18} />
          {$t("trip.saveTripBtn")}
        </button>
      </footer>
    </div>
  </div>
{/if}

{#if showLocationModal}
  <div class="modal-backdrop flex items-center justify-center p-4">
    <div
      class="premium-modal"
      class:is-adding={!editingLocation}
      in:fade={{ duration: 200 }}
    >
      <!-- Header -->
      <header class="modal-header-premium">
        <div class="header-main">
          <div class="header-icon" class:edit-icon={editingLocation}>
            {#if editingLocation}
              <MapPin size={24} />
            {:else}
              <Plus size={24} />
            {/if}
          </div>
          <div class="header-text">
            <h3>
              {editingLocation
                ? $t("trip.editLocationHeader")
                : $t("trip.addLocationHeader")}
            </h3>
            <p class="subheader text-blue-400">
              {editingLocation
                ? $t("trip.editLocationSubheader")
                : $t("trip.addLocationSubheader")}
            </p>
          </div>
        </div>
        <button
          class="btn-close-modal"
          on:click={() => (showLocationModal = false)}
        >
          <X size={20} />
        </button>
      </header>

      <!-- Body -->
      <div class="modal-body-scroll scroll-content">
        <div class="form-grid">
          <!-- Name -->
          <div class="form-field-group full-width-field">
            <span class="field-label">{$t("form.name")}</span>
            <input
              type="text"
              bind:value={modalLocationName}
              placeholder={$t("form.namePlaceholder")}
              class="premium-input"
            />
          </div>

          <!-- Category (Select) -->
          <div class="form-field-group">
            <span class="field-label">{$t("form.category")}</span>
            <select bind:value={modalLocationCategory} class="premium-select">
              <option value="Monumento">{$t("categories.Monumento")}</option>
              <option value="Naturaleza">{$t("categories.Naturaleza")}</option>
              <option value="Ciudad">{$t("categories.Ciudad")}</option>
              <option value="Ciudad de escala"
                >{$t("categories.Ciudad de escala")}</option
              >
              <option value="Cultura">{$t("categories.Cultura")}</option>
              <option value="Playa">{$t("categories.Playa")}</option>
              <option value="Montaña">{$t("categories.Montaña")}</option>
              <option value="Otro">{$t("categories.Otro")}</option>
            </select>
          </div>

          {#if modalLocationCountry === "ES" || modalLocationCountry === "Spain" || modalLocationCountry === "España"}
            <div class="form-field-group">
              <span class="field-label">{$t("map.provinceLabel")}</span>
              <select
                bind:value={modalLocationAdminArea1}
                class="premium-select"
              >
                <option value="">{$t("map.selectProvince")}</option>
                {#each SPAIN_PROVINCES as province}
                  <option value={province.name}>{province.name}</option>
                {/each}
              </select>
            </div>
          {/if}

          <!-- Rating (Simple Star selector or just field) -->
          <!-- <div class="form-field-group">
            <span class="field-label">{"Rating"}</span>
            <select bind:value={modalLocationRating} class="premium-select">
              {#each [1, 2, 3, 4, 5] as r}
                <option value={r}
                  >{r} {$t("trip.stars", { count: r }) || "★"}</option
                >
              {/each}
            </select>
          </div> -->

          <!-- Description -->
          <div class="form-field-group full-width-field">
            <span class="field-label">{$t("form.description")}</span>
            <textarea
              bind:value={modalLocationDescription}
              class="premium-textarea"
              rows="3"
              placeholder={$t("form.descPlaceholder")}
            />
          </div>
        </div>

        <!-- Photo Selection Scroller -->
        <div class="photo-scroller-container">
          <span class="field-label mb-2 block"
            >{$t("trip.linkPhotoOptional")}</span
          >
          {#if displayedPhotos.length > 0}
            <div class="photo-scroller custom-scrollbar">
              {#each displayedPhotos as photo}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                  class="photo-scroller-item"
                  class:selected={selectedPhotoForLocation?.id === photo.id}
                  on:click={() => handleLinkPhotoToLocation(photo)}
                >
                  <img src={getImageUrl(photo)} alt="Miniatura" />
                  {#if selectedPhotoForLocation?.id === photo.id}
                    <div
                      class="absolute inset-0 flex items-center justify-center"
                    >
                      <CheckCircle2 size={24} class="text-white drop-shadow" />
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-xs text-slate-500 italic px-2">
              {$t("trip.emptyGallery")}
            </p>
          {/if}
        </div>

        <!-- Map Section -->
        <div class="form-field-group">
          <div class="flex justify-between items-center mb-1">
            <span class="field-label">{$t("trip.location")}</span>
            {#if modalLocationLat && modalLocationLng}
              <span class="text-[10px] text-slate-500 font-mono">
                {modalLocationLat.toFixed(4)}, {modalLocationLng.toFixed(4)}
              </span>
            {/if}
          </div>

          <div class="map-preview-container">
            <LocationPicker
              height="200px"
              hideSearch={false}
              initialLocation={modalLocationLat !== 0
                ? { lat: modalLocationLat, lng: modalLocationLng }
                : null}
              on:locationSelect={handleLocationModalSelect}
            />
          </div>
          <p class="text-[11px] text-slate-500 italic text-center mb-2">
            {$t("common.mapHint")}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <footer class="premium-modal-footer">
        {#if editingLocation}
          <button
            class="btn-delete-premium"
            on:click={requestDeleteLocation}
            title={$t("form.delete")}
          >
            <Trash2 size={18} />
            <span class="hidden sm:inline">{$t("form.delete")}</span>
          </button>
        {/if}

        <button
          class="btn-cancel-premium"
          on:click={() => (showLocationModal = false)}
        >
          {$t("form.cancel")}
        </button>

        <button class="btn-save-premium" on:click={saveLocation}>
          <CheckCircle2 size={18} />
          {editingLocation ? $t("form.save") : $t("form.save")}
        </button>
      </footer>
    </div>
  </div>
{/if}

{#if selectedMetadataPhoto}
  <div
    class="modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4"
    on:click|self={closeMetadata}
  >
    <div
      class="modal-premium-sheet w-full max-w-lg bg-slate-900 rounded-t-[32px] sm:rounded-3xl border-t sm:border border-slate-700/50 shadow-2xl overflow-hidden"
      transition:slide={{ duration: 300, axis: "y" }}
    >
      <header
        class="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/20 backdrop-blur-xl"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-500/10 rounded-xl text-blue-400">
            <Info size={24} />
          </div>
          <div>
            <h3 class="text-xl font-bold text-white leading-tight">
              {$t("trip.photoInfo")}
            </h3>
            <p
              class="text-xs text-slate-400 font-medium tracking-wide uppercase"
            >
              {$t("trip.metadata") || "METADATA EXIF"}
            </p>
          </div>
        </div>
        <button
          class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
          on:click={closeMetadata}
        >
          <X size={20} />
        </button>
      </header>

      <div
        class="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-900/50"
      >
        {#if selectedMetadataPhoto.metadata?.exif}
          <div class="grid grid-cols-1 gap-4">
            <!-- Camera Info -->
            <div
              class="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30"
            >
              <div class="p-3 bg-slate-700/50 rounded-xl text-slate-300">
                <Camera size={20} />
              </div>
              <div class="flex flex-col">
                <span
                  class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                  >{$t("trip.device")}</span
                >
                <span class="text-slate-200 font-bold">
                  {selectedMetadataPhoto.metadata.exif.make ||
                    $t("trip.unknown")}
                  {selectedMetadataPhoto.metadata.exif.model || ""}
                </span>
              </div>
            </div>

            <!-- Date Info -->
            <div
              class="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30"
            >
              <div class="p-3 bg-slate-700/50 rounded-xl text-slate-300">
                <Calendar size={20} />
              </div>
              <div class="flex flex-col">
                <span
                  class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                  >{$t("trip.captureDate")}</span
                >
                <span class="text-slate-200 font-bold">
                  {selectedMetadataPhoto.metadata.exif.dateTimeOriginal
                    ? formatDate(
                        selectedMetadataPhoto.metadata.exif.dateTimeOriginal,
                      )
                    : $t("trip.unknown")}
                </span>
              </div>
            </div>

            <!-- Lens Info -->
            <div
              class="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30"
            >
              <div class="p-3 bg-slate-700/50 rounded-xl text-slate-300">
                <Image size={20} />
              </div>
              <div class="flex flex-col">
                <span
                  class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                  >{$t("trip.lens")}</span
                >
                <span class="text-slate-200 font-bold">
                  {selectedMetadataPhoto.metadata.exif.lensModel ||
                    $t("trip.unknown")}
                </span>
              </div>
            </div>

            <!-- Location Info -->
            <div
              class="flex flex-col gap-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                    <MapPin size={20} />
                  </div>
                  <div class="flex flex-col">
                    <span
                      class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                      >{$t("trip.location")}</span
                    >
                    <span class="text-slate-200 font-mono text-xs font-bold">
                      {#if selectedMetadataPhoto.metadata.exif.latitude !== null}
                        {selectedMetadataPhoto.metadata.exif.latitude.toFixed(
                          6,
                        )}, {selectedMetadataPhoto.metadata.exif.longitude.toFixed(
                          6,
                        )}
                      {:else}
                        {$t("trip.notAvailableExif")}
                      {/if}
                    </span>
                  </div>
                </div>
                <button
                  class="text-xs text-blue-400 font-bold hover:underline"
                  on:click={() =>
                    (editingMetadataLocation = !editingMetadataLocation)}
                >
                  {editingMetadataLocation
                    ? $t("trip.cancelEdit")
                    : $t("trip.editLocation")}
                </button>
              </div>

              {#if editingMetadataLocation}
                <div
                  class="mt-2 rounded-xl overflow-hidden border border-slate-700"
                >
                  <LocationPicker
                    height="180px"
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
                    class="btn btn-primary w-full py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20"
                    on:click={saveMetadataLocation}
                  >
                    {$t("trip.saveLocation")}
                  </button>
                {/if}
              {:else if selectedMetadataPhoto.metadata.exif.latitude !== null}
                <div
                  class="mt-1 rounded-xl overflow-hidden border border-slate-700/50 grayscale-[30%] opacity-80"
                >
                  <MiniStaticMap
                    lat={selectedMetadataPhoto.metadata.exif.latitude}
                    lng={selectedMetadataPhoto.metadata.exif.longitude}
                    height="120px"
                  />
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div
            class="flex flex-col items-center justify-center p-12 text-center"
          >
            <div
              class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700"
            >
              <AlertTriangle size={32} class="text-slate-500" />
            </div>
            <p class="text-slate-300 font-bold">{$t("trip.noExifData")}</p>
            <p class="text-slate-500 text-sm mt-1">
              {$t("trip.noExifDataDesc") ||
                "Esta fotografía no contiene información técnica embebida."}
            </p>
          </div>
        {/if}
      </div>

      <div class="p-6 bg-slate-800/20 border-t border-slate-800/50 flex gap-3">
        <button
          class="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-700 hover:bg-slate-700"
          on:click={closeMetadata}
        >
          {$t("form.back") || "Volver"}
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showUnlinkModal}
  <AlbumModal
    title={$t("trip.unlinkAlbumTitle")}
    description={$t("trip.unlinkAlbumDescription")}
    actionText={$t("trip.unlinkAlbum")}
    loadingText={$t("trip.unlinking")}
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
          {$t("trip.batchGpsToPhotos", { count: selectedPhotosIds.length }) ||
            `Añadir GPS a ${selectedPhotosIds.length} fotos`}
        </h3>
        <button
          class="text-slate-400 hover:text-white transition-colors"
          on:click={() => (showBatchLocationModal = false)}>&times;</button
        >
      </header>

      <div class="mb-4 text-sm text-slate-300">
        {$t("trip.clickToLocate")}
      </div>

      <div class="mb-6 rounded-lg overflow-hidden border border-slate-700/50">
        <LocationPicker on:locationSelect={handleBatchLocationSelect} />
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <button
          class="btn btn-secondary flex-1"
          on:click={() => (showBatchLocationModal = false)}
          >{$t("form.cancel")}</button
        >
        <button
          class="btn btn-primary flex-1"
          disabled={!batchSelectedCoords}
          on:click={saveBatchLocation}>{$t("trip.saveLocation")}</button
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
      <h3 class="text-lg font-bold text-white mb-2">
        {$t("trip.deleteLocation")}
      </h3>
      <p class="text-slate-300 text-sm mb-6">
        {$t("trip.deleteLocationConfirm")}
      </p>

      <div class="flex gap-3 justify-center">
        <button
          class="btn btn-secondary flex-1"
          on:click={() => (showDeleteConfirm = false)}
          >{$t("form.cancel")}</button
        >
        <button
          class="btn btn-danger flex-1 bg-red-500 hover:bg-red-600 border-none text-white"
          on:click={confirmDeleteLocation}>{$t("form.delete")}</button
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

  .countries-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    width: 100%;
    margin-top: 1.5rem;
  }

  .country-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .country-tag {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #60a5fa;
    padding: 0.4rem 1rem;
    border-radius: 9999px;
    font-size: 1rem;
    font-weight: 600;
  }

  .provinces-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 16px;
    border: 1px dashed rgba(148, 163, 184, 0.2);
    max-width: 95%;
  }

  .province-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(148, 163, 184, 0.1);
    color: #e2e8f0;
    padding: 0.25rem 0.6rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid rgba(148, 163, 184, 0.15);
  }

  .chip-flag {
    width: 16px;
    height: 12px;
    object-fit: cover;
    border-radius: 2px;
  }

  section {
    margin-bottom: 3rem;
    background: #1e293b;
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid #334155;
  }

  /* Mobile Gallery Specific Styles */
  .mobile-gallery-toolbar button {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .mobile-gallery-toolbar button:active {
    transform: scale(0.9);
  }

  .gallery-thumbs-scroll {
    scrollbar-width: none; /* Firefox */
  }
  .gallery-thumbs-scroll::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }

  .main-photo-card {
    background: #0f172a;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .page-container {
      padding: 1rem;
    }

    .trip-cover {
      height: 200px;
      margin-bottom: 1.5rem;
      border-radius: 20px;
    }

    h1 {
      font-size: 2rem;
    }

    section {
      padding: 1rem;
      margin-bottom: 2rem;
      border-radius: 20px;
    }

    .main-photo-card {
      border-radius: 20px;
    }

    .thumbnails-wrapper {
      padding: 1rem 0.5rem;
    }

    .mobile-gallery-toolbar {
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-none {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  }

  h2 {
    color: #60a5fa;
    margin-bottom: 1.5rem;
  }

  .section-header {
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
    max-height: 85vh;
    background: #0a0f1d;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .main-img-bg {
    /* filter: blur(20px) brightness(0.6); */
    transform: scale(1.1);
  }

  @media (min-width: 1200px) {
    .main-img-wrapper {
      aspect-ratio: 21 / 9;
    }
  }

  @media (max-width: 768px) {
    .main-img-wrapper {
      aspect-ratio: auto;
      height: 400px; /* Fixed height to avoid collapsing on mobile */
      max-height: 60vh;
    }
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

  /* Premium Modal Styles (Phase 15) */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .premium-modal {
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 28px;
    width: 95%;
    max-width: 550px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    color: #f8fafc;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header-premium {
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #1e293b;
  }

  .header-main {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(37, 99, 235, 0.1);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
  }

  .header-icon.edit-icon {
    background: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
  }

  .header-text h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .header-text .subheader {
    font-size: 0.65rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .btn-close-modal {
    color: #64748b;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .btn-close-modal:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f8fafc;
  }

  .modal-body-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 2rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .form-field-group {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .field-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .premium-input,
  .premium-select,
  .premium-textarea {
    background: #141c2f;
    border: 1px solid #1e293b;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    color: #f1f5f9;
    font-size: 0.95rem;
    width: 100%;
    transition: all 0.2s;
    font-family: inherit;
  }

  .premium-input:focus,
  .premium-select:focus,
  .premium-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(15, 23, 42, 0.8);
  }

  .full-width-field {
    grid-column: span 2;
  }

  .map-preview-container {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #1e293b;
    margin-bottom: 1.5rem;
  }

  /* Photo selection in modal */
  .photo-scroller-container {
    margin-bottom: 1.5rem;
  }

  .photo-scroller {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding: 0.5rem 0.25rem;
    scrollbar-width: none;
  }

  .photo-scroller::-webkit-scrollbar {
    display: none;
  }

  .photo-scroller-item {
    flex-shrink: 0;
    width: 70px;
    height: 70px;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .photo-scroller-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .photo-scroller-item:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }

  .photo-scroller-item.selected {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .photo-scroller-item.selected::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(37, 99, 235, 0.2);
  }

  .premium-modal-footer {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
    background: rgba(15, 23, 42, 0.5);
    border-top: 1px solid #1e293b;
  }

  .btn-cancel-premium {
    background: transparent;
    border: 1px solid #1e293b;
    color: #64748b;
    padding: 0.6rem 1.25rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel-premium:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f8fafc;
    border-color: #334155;
  }

  .btn-save-premium {
    background: #2563eb;
    color: white;
    border: none;
    padding: 0.6rem 2rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  .btn-save-premium:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  }

  .btn-save-premium:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-delete-premium {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 0.6rem 1.25rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-right: auto;
  }

  .btn-delete-premium:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: #ef4444;
  }

  @media (max-width: 768px) {
    .premium-modal {
      width: 100%;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .full-width-field {
      grid-column: span 1;
    }
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
