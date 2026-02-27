<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import MapContainer from "$lib/components/map/MapContainer.svelte"
  import CountryPicker from "$lib/components/ui/CountryPicker.svelte"
  import { toast } from "$lib/stores/ui"
  import { locations, trips, userProfile } from "$lib/stores/data"
  import type { Location, Trip } from "$lib/stores/data"
  import { mediaService } from "$lib/services/media"
  import type { AppPhoto } from "$lib/services/media"
  import LocationPicker from "$lib/components/map/LocationPicker.svelte"
  import { reverseGeocode } from "$lib/utils/geocode"
  import {
    Search,
    Plus,
    Map as MapIcon,
    Layers,
    BarChart3,
    Eye,
    Calendar,
    MapPin,
  } from "lucide-svelte"

  // Bind to map component
  let mapComponent: any
  let currentLayer: "default" | "satellite" = "default"
  let mapPhotos: AppPhoto[] = []

  onMount(async () => {
    try {
      mapPhotos = await mediaService.getMapPhotos()
    } catch (e) {
      console.error("Failed to load map photos:", e)
    }
  })

  // Modal State
  let showAddLocationModal = false
  let newLocationLat = 0
  let newLocationLng = 0
  let newLocationName = ""
  let newLocationCountry = ""
  let newLocationCategory:
    | "Naturaleza"
    | "Ciudad"
    | "Ciudad de escala"
    | "Playa"
    | "Montaña"
    | "Cultura"
    | "Otro" = "Naturaleza"
  let newLocationTripId = ""
  let newTripName = ""

  let newLocationPhotoFiles: FileList | null = null
  let isSavingLocation = false

  let addingMode = false

  function toggleAddingMode() {
    addingMode = !addingMode
    if (addingMode && mapComponent) {
      toast.success(
        "Haz clic en cualquier lugar del mapa para añadir la ubicación"
      )
    }
  }

  async function handleMapClick(e: CustomEvent<{ lat: number; lng: number }>) {
    if (!addingMode) return
    newLocationLat = e.detail.lat
    newLocationLng = e.detail.lng
    newLocationName = ""
    newLocationCountry = ""
    newLocationCategory = "Naturaleza"
    newLocationTripId = "new"
    newTripName = ""
    newLocationPhotoFiles = null
    showAddLocationModal = true

    const country = await reverseGeocode(e.detail.lat, e.detail.lng)
    if (country) {
      newLocationCountry = country
    }
  }

  async function handleLocationModalSelect(
    e: CustomEvent<{ lat: number; lng: number }>
  ) {
    newLocationLat = e.detail.lat
    newLocationLng = e.detail.lng
    const country = await reverseGeocode(e.detail.lat, e.detail.lng)
    if (country) {
      newLocationCountry = country
    }
  }

  async function saveNewLocation() {
    if (!newLocationName) {
      toast.error("Introduce un nombre")
      return
    }

    isSavingLocation = true
    let finalTripId = newLocationTripId

    if (newLocationTripId === "new") {
      if (!newTripName) {
        toast.error("Introduce un nombre para el nuevo viaje")
        isSavingLocation = false
        return
      }
      finalTripId = crypto.randomUUID()
      const newTrip: Trip = {
        id: finalTripId,
        name: newTripName,
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        countries: newLocationCountry ? [newLocationCountry] : [],
        status: "Planificado",
        coverImage: "default-cover",
        locations: [],
      }
      trips.update((t) => [...t, newTrip])
    }

    const newLocId = crypto.randomUUID()

    const newLoc: Location = {
      id: newLocId,
      name: newLocationName,
      description: "",
      country: newLocationCountry || "Desconocido",
      category: newLocationCategory,
      coordinates: [newLocationLat, newLocationLng],
      rating: 5,
      visitedDate: new Date().toISOString().split("T")[0],
      images: [],
      tripId: finalTripId || undefined,
    }

    // Photo Upload Logic
    if (
      newLocationPhotoFiles &&
      newLocationPhotoFiles.length > 0 &&
      finalTripId &&
      newLocationTripId !== "new"
    ) {
      try {
        toast.info("Subiendo imagen para la ubicación...")
        const newPhotoPayload = await mediaService.uploadLocalPhoto(
          finalTripId,
          newLocationPhotoFiles[0]
        )
        // Guardar metadata con latitud / longitud de este picker
        await mediaService.updatePhoto(newPhotoPayload.id, {
          showOnMap: true,
          metadata: {
            exif: { latitude: newLocationLat, longitude: newLocationLng },
          },
        })
        toast.success("Foto asociada al nuevo lugar exitosamente.")
        newLoc.images = [newPhotoPayload.id]
        mapPhotos = await mediaService.getMapPhotos() // Refrescar fotos del mapa global
      } catch (e) {
        console.error("No se pudo subir la foto con el viaje", e)
        toast.error(
          "Error subiendo foto. Asegúrate de asociar a un viaje existente."
        )
      }
    }

    locations.update((locs) => [...locs, newLoc])

    if (finalTripId && finalTripId !== "") {
      trips.update((t) =>
        t.map((trip) => {
          if (trip.id === finalTripId) {
            const updatedCountries = new Set(trip.countries)
            if (newLocationCountry) {
              updatedCountries.add(newLocationCountry)
            }
            return {
              ...trip,
              locations: [...trip.locations, newLocId],
              countries: Array.from(updatedCountries),
            }
          }
          return trip
        })
      )
    }

    showAddLocationModal = false
    addingMode = false
    isSavingLocation = false
  }

  // Filters
  let showCompleted = true
  let showPlanned = true
  let showOngoing = true
  let showHome = true
  let hiddenTrips: string[] = []
  let searchQuery = ""

  const tripColors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
  ]

  $: tripColorMap = $trips.reduce((acc, trip, index) => {
    acc[trip.id] = tripColors[index % tripColors.length]
    return acc
  }, {} as Record<string, string>)

  // Stats derivation
  $: totalLocations = $locations.length
  $: totalTrips = $trips.length
  $: visitedCount = $trips.filter(
    (t) => t.status === "Completado" || t.status === "En curso"
  ).length
  $: plannedCount = $trips.filter((t) => t.status === "Planificado").length
  $: onGoingCount = $trips.filter((t) => t.status === "En curso").length
  $: uniqueCountries = Array.from(
    new Set(
      $trips
        .filter((t) => t.status === "Completado" || t.status === "En curso")
        .flatMap((t) => t.countries || [])
    )
  ).length
  $: regions = uniqueCountries // We use regions for styling compatibility, but it acts as unique countries

  // Filter Logic
  $: filteredTrips = $trips.filter((trip) => {
    if (hiddenTrips.includes(String(trip.id))) return false
    if (trip.status === "Planificado" && !showPlanned) return false
    if (trip.status === "Completado" && !showCompleted) return false
    if (trip.status === "En curso" && !showOngoing) return false
    return true
  })

  $: filteredPhotos = mapPhotos.filter((photo) => {
    const pTripId = photo.tripId || (photo as any).trip_id
    if (!pTripId) return true // Show un-tripped photos always unless user decides otherwise

    const trip = $trips.find((t) => t.id === pTripId)
    if (!trip) return true // If it has a tripId that doesn't exist anymore, still show it

    if (hiddenTrips.includes(String(trip.id))) return false
    if (trip.status === "Planificado" && !showPlanned) return false
    if (trip.status === "Completado" && !showCompleted) return false
    if (trip.status === "En curso" && !showOngoing) return false
    return true
  })

  $: filteredLocations = $locations.filter((loc) => {
    // Search filter
    if (
      searchQuery &&
      !loc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !loc.country.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Status filter
    let isPlanned = false
    let isCompleted = false
    let isOngoing = false

    const locTripId = loc.tripId || (loc as any).trip_id

    if (locTripId) {
      const trip = $trips.find((t) => t.id === locTripId)
      if (trip) {
        if (hiddenTrips.includes(String(trip.id))) return false
        if (trip.status === "Planificado") {
          isPlanned = true
        } else if (trip.status === "Completado") {
          isCompleted = true
        } else if (trip.status === "En curso") {
          isOngoing = true
        }
      }
    } else {
      isCompleted = true // Untripped location treated as completed
    }

    if (showCompleted && isCompleted) return true
    if (showOngoing && isOngoing) return true
    if (showPlanned && isPlanned) return true

    return false
  })

  $: completion = Math.round((regions / 195) * 100)

  function toggleTripSelection(tripId: string | number) {
    const idStr = String(tripId)
    if (hiddenTrips.includes(idStr)) {
      hiddenTrips = hiddenTrips.filter((id) => id !== idStr)
    } else {
      hiddenTrips = [...hiddenTrips, idStr]
    }
  }

  function toggleLayer() {
    currentLayer = currentLayer === "default" ? "satellite" : "default"
    if (mapComponent) {
      mapComponent.setMapLayer(currentLayer)
    }
  }
</script>

<svelte:head>
  <title>TravelMap - Dashboard</title>
</svelte:head>

<main class="dashboard-page">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="section-title">
        <BarChart3 size={18} /> Estadísticas de aventura
      </h2>
    </div>

    <div class="stats-container">
      <div class="stat-main">
        <span class="stat-label">Viajes totales</span>
        <span class="stat-value big">{totalTrips}</span>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">Locaciones</span>
          <span class="stat-value text-blue">{totalLocations}</span>
        </div>
      </div>

      <div class="stats-row mt-4">
        <div class="stat-item">
          <span class="stat-label">Completado</span>
          <span class="stat-value text-green">{visitedCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Planificado</span>
          <span class="stat-value text-blue">{plannedCount}</span>
        </div>
      </div>

      <div class="stat-item mt-4">
        <span class="stat-label">En curso</span>
        <span class="stat-value text-teal">{onGoingCount}</span>
      </div>

      <div class="progress-section mt-4">
        <div class="progress-labels">
          <span>Progreso</span>
          <span>{regions} / 195 países</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {completion}%" />
        </div>
      </div>
    </div>

    <div class="sidebar-section mt-6">
      <h2 class="section-title"><Eye size={18} /> Opciones de visualización</h2>

      <div class="options-list">
        <label class="option-item">
          <input type="checkbox" bind:checked={showHome} />
          <span class="checkmark checked-red" />
          <span class="option-text">Casa</span>
        </label>

        <label class="option-item">
          <input type="checkbox" bind:checked={showCompleted} />
          <span class="checkmark checked-green" />
          <span class="option-text">Completados ({visitedCount})</span>
        </label>

        <label class="option-item">
          <input type="checkbox" bind:checked={showPlanned} />
          <span class="checkmark checked-blue" />
          <span class="option-text">Planificados ({plannedCount})</span>
        </label>

        <label class="option-item">
          <input type="checkbox" bind:checked={showOngoing} />
          <span class="checkmark checked-teal" />
          <span class="option-text">En curso ({onGoingCount})</span>
        </label>
      </div>
    </div>

    <!-- Filtros de Viajes Específicos -->
    <div class="sidebar-section mt-6">
      <h2 class="section-title"><MapIcon size={18} /> Filtrar por Viaje</h2>
      <div
        class="options-list mt-2"
        style="max-height: 200px; overflow-y: auto;"
      >
        {#each $trips as trip}
          <label
            class="option-item"
            style:opacity={hiddenTrips.includes(String(trip.id)) ? "0.5" : "1"}
          >
            <input
              type="checkbox"
              checked={!hiddenTrips.includes(String(trip.id))}
              on:change={() => toggleTripSelection(trip.id)}
            />
            <span
              class="checkmark"
              style="border-color: {tripColorMap[trip.id] ||
                '#64748b'}; {!hiddenTrips.includes(String(trip.id))
                ? `background: ${tripColorMap[trip.id] || '#64748b'};`
                : ''}"
            />
            <span class="option-text"
              >{trip.name}
              {trip.userId !== $userProfile.id ? "(De otro usuario)" : ""}</span
            >
          </label>
        {/each}
      </div>
      {#if hiddenTrips.length > 0}
        <button
          class="text-xs text-blue-400 hover:text-blue-300 mt-2 block"
          on:click={() => (hiddenTrips = [])}
        >
          Mostrar todos los viajes
        </button>
      {/if}
    </div>

    <div class="sidebar-footer">
      <h2 class="section-title"><Plus size={18} /> Nueva ubicación</h2>
      <button
        class="btn-sidebar-action"
        class:btn-active={addingMode}
        on:click={toggleAddingMode}
      >
        {#if addingMode}
          <span>Cancelar adición</span>
        {:else}
          <Plus size={16} /> Agregar al mapa
        {/if}
      </button>
      {#if addingMode}
        <p class="help-text mt-2 text-center text-blue-400">
          Haz clic en el mapa para ubicar un punto
        </p>
      {/if}
    </div>
  </aside>

  <!-- Main Content -->
  <section class="main-content">
    <!-- Top Bar -->
    <header class="topbar">
      <div class="topbar-left">
        <MapIcon size={24} class="text-blue" />
        <div class="title-group">
          <h1>Mapa de ubicación</h1>
          <p>
            {filteredLocations.length} de {totalLocations} ubicaciones mostradas
          </p>
        </div>
      </div>

      <div class="topbar-center">
        <div class="search-bar">
          <Search size={16} class="search-icon" />
          <input
            type="text"
            placeholder="Buscar ubicaciones..."
            bind:value={searchQuery}
          />
        </div>
        <button
          class="btn-top-action {addingMode ? 'btn-active' : ''}"
          on:click={toggleAddingMode}
        >
          {#if addingMode}
            Cancelar
          {:else}
            <Plus size={16} /> Agregar ubicación
          {/if}
        </button>
      </div>

      <div class="topbar-right">
        <div class="mini-stat">
          <span class="label">Visitado</span>
          <span class="value text-green">{visitedCount}</span>
        </div>
        <div class="mini-stat">
          <span class="label">Planificado</span>
          <span class="value text-blue">{plannedCount}</span>
        </div>
      </div>
    </header>

    <!-- Map Area -->
    <div class="map-area">
      <MapContainer
        bind:this={mapComponent}
        locations={filteredLocations}
        mapPhotos={filteredPhotos}
        trips={filteredTrips}
        {hiddenTrips}
        {tripColorMap}
        {showHome}
        height="100%"
        on:mapclick={handleMapClick}
      />

      <!-- Floating Map Controls -->
      <div class="map-controls-floating">
        <button class="control-btn" on:click={toggleLayer}>
          <Layers size={16} />
          {currentLayer === "default" ? "Satélite" : "Default"}
        </button>
      </div>
    </div>
  </section>
</main>

{#if showAddLocationModal}
  <div class="modal-overlay">
    <div class="modal-content">
      <h3
        style="margin-top: 0; color: #f8fafc; margin-bottom: 0.5rem; font-size: 1.25rem;"
      >
        Añadir nueva ubicación
      </h3>
      <div class="form-group" style="margin-bottom: 1.5rem;">
        <LocationPicker
          height="200px"
          initialLocation={newLocationLat && newLocationLng
            ? { lat: newLocationLat, lng: newLocationLng }
            : null}
          on:locationSelect={handleLocationModalSelect}
        />
        {#if newLocationCountry}
          <div style="color: #10b981; font-size: 0.85rem; margin-top: 0.5rem;">
            País detectado: <strong>{newLocationCountry}</strong>
          </div>
        {/if}
      </div>

      <div class="form-group">
        <label>
          Nombre del lugar
          <input
            type="text"
            bind:value={newLocationName}
            placeholder="Ej: Playa Escondida"
          />
        </label>
      </div>

      <div class="form-group">
        <label>
          Categoría
          <select bind:value={newLocationCategory}>
            <option value="Naturaleza">Naturaleza 🌲</option>
            <option value="Ciudad">Ciudad 🏙️</option>
            <option value="Ciudad de escala">Ciudad de escala ✈️</option>
            <option value="Playa">Playa 🏖️</option>
            <option value="Montaña">Montaña 🏔️</option>
            <option value="Cultura">Cultura 🏛️</option>
            <option value="Otro">Otro 📍</option>
          </select>
        </label>
      </div>

      <div class="form-group">
        <label>
          Viaje
          <select bind:value={newLocationTripId}>
            <option value="">Ninguno</option>
            <option value="new">+ Crear nuevo viaje...</option>
            {#each $trips as trip}
              <option value={trip.id}>{trip.name}</option>
            {/each}
          </select>
        </label>
      </div>

      {#if newLocationTripId === "new"}
        <div class="form-group">
          <label>
            Nombre del nuevo viaje
            <input
              type="text"
              bind:value={newTripName}
              placeholder="Ej: Roadtrip Costa Oeste"
            />
          </label>
        </div>
      {/if}

      <div class="form-group">
        <label>
          Añadir foto (opcional)
          <input
            type="file"
            accept="image/*"
            bind:files={newLocationPhotoFiles}
            disabled={newLocationTripId === "new" || newLocationTripId === ""}
            class="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 bg-slate-800 border-slate-700 text-slate-300 w-full"
          />
        </label>
        {#if newLocationTripId === "new" || newLocationTripId === ""}
          <span style="font-size: 0.75rem; color: #f59e0b; margin-top: 0.25rem;"
            >Debes seleccionar un viaje existente para subir fotos.</span
          >
        {/if}
      </div>

      <div class="modal-actions">
        <button
          class="btn-cancel"
          on:click={() => (showAddLocationModal = false)}>Cancelar</button
        >
        <button
          class="btn-sidebar-action"
          style="width: auto; padding: 0.5rem 1.5rem;"
          on:click={saveNewLocation}>Guardar</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  .dashboard-page {
    display: grid;
    grid-template-columns: 300px 1fr;
    height: calc(100vh - 64px); /* Subtract navbar height approx */
    background: #0f172a;
    color: #e2e8f0;
    overflow: hidden;
  }

  /* Sidebar styles */
  .sidebar {
    background: #111827;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #1f2937;
    overflow-y: auto;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-main {
    margin-bottom: 1.5rem;
  }

  .stat-value {
    display: block;
    font-weight: 700;
  }

  .stat-value.big {
    font-size: 2.5rem;
    line-height: 1;
    color: #f8fafc;
    margin-top: 0.25rem;
  }

  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .text-green {
    color: #10b981;
  }
  .text-blue {
    color: #3b82f6;
  }
  .text-teal {
    color: #14b8a6;
  }

  .progress-section {
    margin-top: 1.5rem;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .progress-bar {
    height: 6px;
    background: #374151;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #6366f1;
    border-radius: 3px;
  }

  /* Options List */
  .options-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #cbd5e1;
  }

  .option-item input {
    display: none;
  }

  .checkmark {
    width: 18px;
    height: 18px;
    border: 2px solid #475569;
    border-radius: 50%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .option-item input:checked + .checkmark::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: white;
  }

  .checkmark.checked-green {
    border-color: #10b981;
  }
  .option-item input:checked + .checkmark.checked-green {
    background: #10b981;
  }

  .checkmark.checked-blue {
    border-color: #3b82f6;
  }
  .option-item input:checked + .checkmark.checked-blue {
    background: #3b82f6;
  }

  .checkmark.checked-red {
    border-color: #ef4444;
  }
  .option-item input:checked + .checkmark.checked-red {
    background: #ef4444;
  }

  /* Sidebar Footer */
  .sidebar-footer {
    margin-top: auto;
    padding-top: 2rem;
  }

  .help-text {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 1rem;
  }

  .btn-sidebar-action {
    width: 100%;
    padding: 0.75rem;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-sidebar-action:hover {
    background: #4f46e5;
  }

  .btn-sidebar-action.btn-active,
  .btn-top-action.btn-active {
    background: #ef4444 !important;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
  }

  /* Main Content Styles */
  .main-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .topbar {
    background: #111827;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #1f2937;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .title-group h1 {
    font-size: 1.25rem;
    color: #8b5cf6;
    margin: 0;
  }

  .title-group p {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0;
  }

  .topbar-center {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .search-bar {
    position: relative;
    width: 300px;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .search-bar input {
    width: 100%;
    background: #1f2937;
    border: 1px solid #374151;
    padding: 0.5rem 0.5rem 0.5rem 2.5rem;
    border-radius: 6px;
    color: white;
    line-height: normal; /* Fix for centering text */
  }

  .btn-top-action {
    background: #6366f1;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .topbar-right {
    display: flex;
    gap: 1.5rem;
  }

  .mini-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .mini-stat .label {
    font-size: 0.75rem;
    color: #64748b;
  }

  .mini-stat .value {
    font-weight: 700;
    font-size: 1.1rem;
  }

  .map-area {
    flex: 1;
    position: relative;
    background: #000;
    padding: 1rem;
  }

  .map-controls-floating {
    position: absolute;
    top: 30px;
    right: 30px;
    z-index: 1000;
  }

  .control-btn {
    background: #1f2937;
    color: #e2e8f0;
    border: 1px solid #374151;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .dashboard-page {
      grid-template-columns: 1fr;
      overflow-y: auto;
      height: auto;
    }

    .sidebar {
      border-right: none;
      border-bottom: 1px solid #1f2937;
      height: auto;
    }

    .map-area {
      height: 600px;
    }

    .topbar {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .topbar-center {
      order: 3;
    }
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .modal-content {
    background: #1e293b;
    padding: 2rem;
    border-radius: 12px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    border: 1px solid #334155;
    color: #e2e8f0;
  }

  .form-group {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #cbd5e1;
  }

  .form-group input,
  .form-group select {
    background: #0f172a;
    border: 1px solid #334155;
    padding: 0.75rem;
    border-radius: 6px;
    color: white;
    font-size: 1rem;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #6366f1;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  .btn-cancel {
    background: transparent;
    border: 1px solid #475569;
    color: #cbd5e1;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    background: #334155;
    color: white;
  }
</style>
