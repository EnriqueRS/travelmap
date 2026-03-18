<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade, scale, slide } from "svelte/transition"
  import MapContainer from "$lib/components/map/MapContainer.svelte"
  import ProvinceExplorer from "$lib/components/ui/ProvinceExplorer.svelte"
  import ProvinceMultiSelect from "$lib/components/ui/ProvinceMultiSelect.svelte"
  import { SPAIN_PROVINCES } from "$lib/utils/provinces"

  import { toast, languageStore } from "$lib/stores/ui"
  import { t } from "$lib/stores/i18n"
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
    MapPin,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    X,
    Eye,
    Globe,
    Compass,
    Filter,
    Home,
    CheckCircle2,
    Calendar,
    Activity,
    Info,
    Camera,
  } from "lucide-svelte"
  import { COUNTRIES, getCountryName } from "$lib/utils/countries"
  import { normalizeString } from "$lib/utils/string"
  import { locationsService } from "$lib/services/locations"

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
  let showCountryHighlights = true
  let newLocationLat = 0
  let newLocationLng = 0
  let newLocationName = ""
  let newLocationCountry = ""
  let newLocationCategory:
    | "Monumento"
    | "Naturaleza"
    | "Ciudad"
    | "Ciudad de escala"
    | "Playa"
    | "Montaña"
    | "Cultura"
    | "Otro" = "Ciudad"
  let newLocationTripId = ""
  let newLocationProvince = ""
  let newLocationCounty = ""
  let newTripName = ""
  let newTripProvinces: string[] = []
  let showProvinceExplorer = false

  let newLocationPhotoFiles: FileList | null = null
  let isSavingLocation = false

  // Modal Search State
  let modalSearchQuery = ""
  let locationPickerRef: any

  async function handleModalSearch() {
    if (locationPickerRef) {
      await locationPickerRef.handleSearch(modalSearchQuery)
    }
  }

  let addingMode = false
  let isSidebarMinimized = false
  let mobileStatsCollapsed = false

  function toggleSidebar() {
    isSidebarMinimized = !isSidebarMinimized
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 300)
  }

  function toggleAddingMode() {
    addingMode = !addingMode
    if (addingMode && mapComponent) {
      toast.success($t("map.clickPrompt"))
    }
  }

  async function handleMapClick(e: CustomEvent<{ lat: number; lng: number }>) {
    if (!addingMode) return
    newLocationLat = e.detail.lat
    newLocationLng = e.detail.lng
    newLocationName = ""
    newLocationCountry = ""
    newLocationCategory = "Ciudad"
    newLocationTripId = ""
    newLocationProvince = ""
    newTripName = ""
    newLocationPhotoFiles = null
    showAddLocationModal = true

    const geoResult = await reverseGeocode(e.detail.lat, e.detail.lng)
    console.log("[Map] handleMapClick geoResult:", geoResult)
    newLocationCounty = ""
    if (geoResult) {
      newLocationCountry = geoResult.countryCode || ""
      if (newLocationCountry === "ES" && geoResult.state) {
        const normalizedState = normalizeString(geoResult.state)
        const matched = SPAIN_PROVINCES.find((p) => {
          const normalizedP = normalizeString(p.name)
          return (
            normalizedState.includes(normalizedP) ||
            normalizedP.includes(normalizedState)
          )
        })
        if (matched) newLocationProvince = matched.name
      } else {
        newLocationProvince = geoResult.state || ""
      }
      newLocationCounty = geoResult.county || ""
    }
  }

  async function handleLocationModalSelect(
    e: CustomEvent<{ lat: number; lng: number }>,
  ) {
    newLocationLat = e.detail.lat
    newLocationLng = e.detail.lng
    const geoResult = await reverseGeocode(e.detail.lat, e.detail.lng)
    console.log("[Map] handleLocationModalSelect geoResult:", geoResult)
    newLocationCounty = ""
    if (geoResult) {
      newLocationCountry = geoResult.countryCode || ""
      if (newLocationCountry === "ES" && geoResult.province) {
        const normalizedState = normalizeString(geoResult.province)
        const matched = SPAIN_PROVINCES.find((p) => {
          const normalizedP = normalizeString(p.name)
          return (
            normalizedState.includes(normalizedP) ||
            normalizedP.includes(normalizedState)
          )
        })
        if (matched) newLocationProvince = matched.name
        else newLocationProvince = ""
      } else {
        newLocationProvince = geoResult.province || ""
      }
      newLocationCounty = geoResult.county || ""
    }
  }

  async function saveNewLocation() {
    if (!newLocationName) {
      toast.error($t("map.nameRequired"))
      return
    }

    isSavingLocation = true
    let finalTripId = newLocationTripId

    if (newLocationTripId === "new") {
      if (!newTripName) {
        toast.error($t("map.newTripNameRequired"))
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
        provinces: newTripProvinces,
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
      country: newLocationCountry || $t("map.unknownCountry"),
      category: newLocationCategory,
      coordinates: [newLocationLat, newLocationLng],
      rating: 5,
      visitedDate: new Date().toISOString().split("T")[0],
      images: [],
      tripId: finalTripId || undefined,
      adminArea1: newLocationProvince || undefined,
      adminArea2: newLocationCounty || undefined,
    }

    // Photo Upload Logic
    if (
      newLocationPhotoFiles &&
      newLocationPhotoFiles.length > 0 &&
      finalTripId &&
      newLocationTripId !== "new"
    ) {
      try {
        toast.info($t("map.uploadingToast"))
        const newPhotoPayload = await mediaService.uploadLocalPhoto(
          finalTripId,
          newLocationPhotoFiles[0],
        )
        // Guardar metadata con latitud / longitud de este picker
        await mediaService.updatePhoto(newPhotoPayload.id, {
          showOnMap: true,
          metadata: {
            exif: { latitude: newLocationLat, longitude: newLocationLng },
          },
        })
        toast.success($t("map.uploadSuccessToast"))
        newLoc.images = [newPhotoPayload.id]
        mapPhotos = await mediaService.getMapPhotos() // Refrescar fotos del mapa global
      } catch (e) {
        console.error("No se pudo subir la foto con el viaje", e)
        toast.error($t("map.uploadErrorToast"))
      }
    }

    locations.update((locs) => [...locs, newLoc])

    // Persist to backend database
    try {
      await locationsService.createLocation(newLoc)
      console.log("[saveNewLocation] Location persisted to database:", newLocId)
    } catch (err) {
      console.error(
        "[saveNewLocation] Failed to persist location to database, saving locally only:",
        err,
      )
    }

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
        }),
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

  $: statsData = {
    totalCountries: COUNTRIES.length,
    visitedCountries: uniqueCountries,
    notVisitedCountries: COUNTRIES.length - uniqueCountries,
    totalPlaces: $locations.length,
    totalTrips: $trips.length,
  }

  // Province Progress calculation for Home Country
  $: visitedProvinceNamesSet = $locations
    .filter((loc) => loc.country === $userProfile.homeCountry)
    .reduce((acc, loc) => {
      const trip = $trips.find((t) => t.id === loc.tripId)
      if (
        !loc.tripId ||
        (trip && (trip.status === "Completado" || trip.status === "En curso"))
      ) {
        if (loc.adminArea1) acc.add(loc.adminArea1)
      }
      return acc
    }, new Set<string>())

  $: plannedProvinceNamesSet = $locations
    .filter((loc) => loc.country === $userProfile.homeCountry)
    .reduce((acc, loc) => {
      const trip = $trips.find((t) => t.id === loc.tripId)
      if (trip && trip.status === "Planificado") {
        if (loc.adminArea1) acc.add(loc.adminArea1)
      }
      return acc
    }, new Set<string>())

  // Ensure visited takes precedence in display set
  $: {
    visitedProvinceNamesSet.forEach((p) => plannedProvinceNamesSet.delete(p))
  }

  // Stats derivation
  $: totalLocations = $locations.length
  $: totalTrips = $trips.length
  $: visitedCount = $trips.filter(
    (t) => t.status === "Completado" || t.status === "En curso",
  ).length
  $: plannedCount = $trips.filter((t) => t.status === "Planificado").length
  $: onGoingCount = $trips.filter((t) => t.status === "En curso").length
  $: visitedCountryNames = Array.from(
    new Set(
      $trips
        .filter((t) => t.status === "Completado" || t.status === "En curso")
        .flatMap((t) => t.countries || []),
    ),
  )
  $: uniqueCountries = visitedCountryNames.length
  $: regions = uniqueCountries // We use regions for styling compatibility

  let showProgressModal = false

  // Continent-based statistics logic
  $: continentStats = (() => {
    let stats = {
      Europa: { total: 0, visited: 0 },
      América: { total: 0, visited: 0 },
      Asia: { total: 0, visited: 0 },
      África: { total: 0, visited: 0 },
      Oceanía: { total: 0, visited: 0 },
    }

    COUNTRIES.forEach((c) => {
      // Map continents based on basic geographical knowledge or custom field
      let cont = "América" // Default
      if (["EU", "AS"].includes(c.id)) cont = "Europa" // Simplified mapping for example
      // In production, an exact region map is better, here we'll do our best with existing data
      // To keep it simple, we categorize roughly or assume COUNTRIES has a region prop.
      // Assuming COUNTRIES has a 'region' field (we will fall back to Europa if missing for the demo)
      const region = (c as any).region || "Europa"

      let mappedCont = "Europa"
      if (region.includes("Americas")) mappedCont = "América"
      else if (region.includes("Asia")) mappedCont = "Asia"
      else if (region.includes("Africa")) mappedCont = "África"
      else if (region.includes("Oceania")) mappedCont = "Oceanía"

      stats[mappedCont as keyof typeof stats].total += 1
      if (visitedCountryNames.includes(c.id)) {
        stats[mappedCont as keyof typeof stats].visited += 1
      }
    })

    return stats
  })()

  // Explorer inner state
  let explorerSearch = ""
  let explorerContinent = "Todos"

  const AMERICAS = [
    "US",
    "CA",
    "MX",
    "AR",
    "BR",
    "CL",
    "CO",
    "PE",
    "UY",
    "VE",
    "CU",
    "DO",
    "PA",
    "CR",
    "GT",
    "HN",
    "SV",
    "NI",
    "BO",
    "PY",
    "EC",
  ]
  const ASIA = [
    "CN",
    "JP",
    "KR",
    "IN",
    "ID",
    "TH",
    "VN",
    "PH",
    "MY",
    "SG",
    "QA",
    "AE",
    "SA",
    "IL",
    "TR",
    "IR",
    "IQ",
    "AF",
    "PK",
    "BD",
    "KZ",
    "UZ",
    "AM",
    "AZ",
    "GE",
    "KG",
    "TJ",
    "TM",
    "NP",
    "BT",
  ]
  const AFRICA = [
    "EG",
    "ZA",
    "NG",
    "MA",
    "DZ",
    "TN",
    "KE",
    "ET",
    "GH",
    "SN",
    "AO",
    "TZ",
    "UG",
    "RW",
    "MZ",
    "ZW",
    "NA",
    "BW",
    "SY",
    "LB",
    "JO",
    "PS",
  ]
  const OCEANIA = [
    "AU",
    "NZ",
    "FJ",
    "PG",
    "VU",
    "SB",
    "MH",
    "FM",
    "PW",
    "NR",
    "KI",
    "TO",
    "WS",
    "TV",
  ]

  $: filteredExplorerCountries = [...COUNTRIES]
    .map((c) => {
      let mappedCont = "Europa"
      if (AMERICAS.includes(c.id)) mappedCont = "América"
      else if (ASIA.includes(c.id)) mappedCont = "Asia"
      else if (AFRICA.includes(c.id)) mappedCont = "África"
      else if (OCEANIA.includes(c.id)) mappedCont = "Oceanía"

      return {
        ...c,
        mappedCont,
        isVisited: visitedCountryNames.includes(c.id),
        localizedName: getCountryName(c.id, $languageStore),
      }
    })
    .filter((c) => {
      const matchesContinent =
        explorerContinent === "Todos" || c.mappedCont === explorerContinent
      const matchesSearch = c.localizedName
        .toLowerCase()
        .includes(explorerSearch.toLowerCase())
      return matchesContinent && matchesSearch
    })
    .sort((a, b) => {
      const aVisited = a.isVisited ? -1 : 1
      const bVisited = b.isVisited ? -1 : 1
      return aVisited === bVisited
        ? a.localizedName.localeCompare(b.localizedName)
        : aVisited - bVisited
    })

  // Filter Logic
  $: filteredTrips = $trips.filter((trip) => {
    if (hiddenTrips.includes(String(trip.id))) return false
    if (trip.status === "Planificado" && !showPlanned) return false
    if (trip.status === "Completado" && !showCompleted) return false
    if (trip.status === "En curso" && !showOngoing) return false
    return true
  })

  $: filteredPhotos = mapPhotos.filter((photo) => {
    const pTripId = photo.tripId
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
      !normalizeString(loc.name).includes(normalizeString(searchQuery)) &&
      !normalizeString(getCountryName(loc.country, $languageStore)).includes(
        normalizeString(searchQuery),
      )
    ) {
      return false
    }

    // Status filter
    let isPlanned = false
    let isCompleted = false
    let isOngoing = false

    const locTripId = loc.tripId

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
  <title>TravelMap</title>
</svelte:head>

<main class="dashboard-page" class:sidebar-minimized={isSidebarMinimized}>
  <!-- Mobile Stats Panel (visible only on mobile ≤768px) -->
  <div class="mobile-stats-panel" class:collapsed={mobileStatsCollapsed}>
    {#if !mobileStatsCollapsed}
      <div transition:slide={{ duration: 250 }}>
        <!-- Mobile Search Bar -->
        <div class="mobile-search-bar">
          <Search size={14} class="mobile-search-icon" />
          <input
            type="text"
            placeholder={$t("map.searchPlaceholder")}
            bind:value={searchQuery}
          />
        </div>

        <!-- Mobile Stats Row -->
        <div class="mobile-stats-container">
          <div class="mobile-stat-main">
            <span class="mobile-stat-label">{$t("map.totalTripsLabel")}</span>
            <span class="mobile-stat-value">{totalTrips}</span>
          </div>
          <div class="mobile-stat-items">
            <div class="mobile-stat-item">
              <span class="mobile-stat-number text-emerald-400"
                >{visitedCount}</span
              >
              <span class="mobile-stat-item-label"
                >{$t("status.Completado")}</span
              >
            </div>
            <div class="mobile-stat-item">
              <span class="mobile-stat-number text-blue-400"
                >{plannedCount}</span
              >
              <span class="mobile-stat-item-label"
                >{$t("status.Planificado")}</span
              >
            </div>
            <div class="mobile-stat-item">
              <span class="mobile-stat-number text-slate-400"
                >{onGoingCount}</span
              >
              <span class="mobile-stat-item-label">{$t("status.En curso")}</span
              >
            </div>
          </div>
        </div>

        <!-- Mobile Progress Bar -->
        <div
          class="mobile-progress-row"
          on:click={() => (showProgressModal = true)}
          on:keydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              showProgressModal = true
            }
          }}
          tabindex="0"
          role="button"
          aria-label={$t("map.viewAllCountries")}
        >
          <span class="mobile-progress-label">{$t("map.progresoLabel")}</span>
          <div class="mobile-progress-bar-track">
            <div
              class="mobile-progress-bar-fill"
              style="width: {completion}%"
            />
          </div>
          <span class="mobile-progress-count"
            >{regions} / 195 {$t("map.paisesLabel").toLowerCase()}</span
          >
        </div>

        <!-- Mobile Filter Chips -->
        <div class="mobile-filter-chips">
          <button
            class="mobile-chip chip-home"
            class:active={showHome}
            on:click={() => (showHome = !showHome)}
          >
            {$t("map.home")} · 1
          </button>
          <button
            class="mobile-chip chip-completed"
            class:active={showCompleted}
            on:click={() => (showCompleted = !showCompleted)}
          >
            {$t("status.Completado")} · {visitedCount}
          </button>
          <button
            class="mobile-chip chip-planned"
            class:active={showPlanned}
            on:click={() => (showPlanned = !showPlanned)}
          >
            {$t("status.Planificado")} · {plannedCount}
          </button>
          {#if onGoingCount > 0}
            <button
              class="mobile-chip chip-ongoing"
              class:active={showOngoing}
              on:click={() => (showOngoing = !showOngoing)}
            >
              {$t("status.En curso")} · {onGoingCount}
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Collapse/Expand Toggle Handle -->
    <button
      class="mobile-panel-toggle"
      on:click={() => (mobileStatsCollapsed = !mobileStatsCollapsed)}
      aria-label={mobileStatsCollapsed ? "Expand panel" : "Collapse panel"}
    >
      <div class="toggle-handle-bar" />
      {#if mobileStatsCollapsed}
        <ChevronDown size={14} />
      {:else}
        <ChevronUp size={14} />
      {/if}
    </button>
  </div>

  <!-- Sidebar (hidden on mobile) -->
  <aside class="sidebar" class:collapsed={isSidebarMinimized}>
    <button
      class="sidebar-toggle bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full text-slate-300 border border-slate-600 absolute z-50 transition-all {isSidebarMinimized
        ? 'top-4 left-1/2 -translate-x-1/2'
        : 'top-4 right-4'}"
      on:click={toggleSidebar}
      title={isSidebarMinimized
        ? $t("map.maximizeSidebar")
        : $t("map.minimizeSidebar")}
    >
      {#if isSidebarMinimized}
        <ChevronRight size={18} />
      {:else}
        <ChevronLeft size={18} />
      {/if}
    </button>

    {#if isSidebarMinimized}
      <div class="minimized-sidebar-content">
        <div class="minimized-filters">
          <div
            class="mini-filter-item casa"
            class:inactive={!showHome}
            title={$t("map.home")}
            on:click={() => (showHome = !showHome)}
            on:keydown={(e) =>
              (e.key === "Enter" || e.key === " ") && (showHome = !showHome)}
            role="button"
            tabindex="0"
          >
            <Home size={20} />
          </div>
          <div
            class="mini-filter-item completado"
            class:inactive={!showCompleted}
            title={$t("status.Completado")}
            on:click={() => (showCompleted = !showCompleted)}
            on:keydown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              (showCompleted = !showCompleted)}
            role="button"
            tabindex="0"
          >
            <CheckCircle2 size={20} />
          </div>
          <div
            class="mini-filter-item planificado"
            class:inactive={!showPlanned}
            title={$t("status.Planificado")}
            on:click={() => (showPlanned = !showPlanned)}
            on:keydown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              (showPlanned = !showPlanned)}
            role="button"
            tabindex="0"
          >
            <Calendar size={20} />
          </div>
          <div
            class="mini-filter-item en-curso"
            class:inactive={!showOngoing}
            title={$t("status.En curso")}
            on:click={() => (showOngoing = !showOngoing)}
            on:keydown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              (showOngoing = !showOngoing)}
            role="button"
            tabindex="0"
          >
            <Activity size={20} />
          </div>
        </div>

        <div
          class="mini-progress-indicator"
          on:click={() => (showProgressModal = true)}
          role="button"
          tabindex="0"
          on:keydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              showProgressModal = true
            }
          }}
          title={$t("map.progresoLabel")}
        >
          <div class="mini-circle-box">
            <Globe size={18} />
            <div class="mini-progress-dot" />
          </div>
          <span class="mini-stats-text">{regions}</span>
        </div>
      </div>
    {/if}

    {#if !isSidebarMinimized}
      <div
        class="sidebar-nav-container scroll-content"
        class:hidden={isSidebarMinimized}
      >
        <!-- Section: Estadísticas de Aventura -->
        <div class="nav-section">
          <h3 class="nav-section-header">
            <!-- <Compass size={18} />
          {$t("map.statsAventura")} -->
          </h3>

          <div class="adventure-stats-content">
            <div class="main-stat-card">
              <span class="main-stat-label">{$t("map.totalTripsLabel")}</span>
              <span class="main-stat-value">{totalTrips}</span>
            </div>

            <div class="stats-list-vertical">
              <div class="stats-list-item">
                <span class="item-label">{$t("map.totalLocations")}</span>
                <span class="item-value text-blue-400">{totalLocations}</span>
              </div>
              <div class="stats-list-item">
                <span class="item-label">{$t("status.Completado")}</span>
                <span class="item-value text-emerald-400">{visitedCount}</span>
              </div>
              <div class="stats-list-item">
                <span class="item-label">{$t("status.Planificado")}</span>
                <span class="item-value text-blue-500">{plannedCount}</span>
              </div>
              <div class="stats-list-item">
                <span class="item-label">{$t("status.En curso")}</span>
                <span class="item-value text-slate-400">{onGoingCount}</span>
              </div>
            </div>

            <div
              class="global-progress-mini mt-6 cursor-pointer"
              on:click={() => (showProgressModal = true)}
              on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  showProgressModal = true
                }
              }}
              tabindex="0"
              role="button"
              aria-label={$t("map.viewAllCountries")}
            >
              <div class="progress-info-row">
                <span class="progress-label">{$t("map.progresoLabel")}</span>
                <span class="progress-count"
                  >{regions} / 195 {$t("map.paisesLabel")}</span
                >
              </div>
              <div class="minimal-progress-bar">
                <div class="progress-bar-fill" style="width: {completion}%" />
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Opciones de Visualización -->
        <div class="nav-section">
          <h3 class="nav-section-header">
            <Eye size={18} />
            {$t("map.displayOptions")}
          </h3>

          <div class="visualization-options">
            <label class="custom-pill-toggle">
              <input type="checkbox" bind:checked={showHome} />
              <span class="pill-dot bg-red-500" />
              <span class="pill-label">{$t("map.home")}</span>
              <span class="pill-count">1</span>
            </label>

            <label class="custom-pill-toggle">
              <input type="checkbox" bind:checked={showCompleted} />
              <span class="pill-dot bg-emerald-500" />
              <span class="pill-label">{$t("status.Completado")}</span>
              <span class="pill-count">{visitedCount}</span>
            </label>

            <label class="custom-pill-toggle">
              <input type="checkbox" bind:checked={showPlanned} />
              <span class="pill-dot bg-blue-500" />
              <span class="pill-label">{$t("status.Planificado")}</span>
              <span class="pill-count">{plannedCount}</span>
            </label>

            <label class="custom-pill-toggle">
              <input type="checkbox" bind:checked={showOngoing} />
              <span class="pill-dot bg-slate-400" />
              <span class="pill-label">{$t("status.En curso")}</span>
              <span class="pill-count">{onGoingCount}</span>
            </label>
          </div>
        </div>

        <!-- Section: Filtrar por Viaje -->
        <div class="nav-section">
          <h3 class="nav-section-header">
            <Filter size={18} />
            {$t("map.filterByTrip")}
          </h3>

          <div class="trip-filter-list custom-scrollbar">
            {#each $trips as trip}
              <button
                class="trip-filter-item"
                class:hidden-trip={hiddenTrips.includes(String(trip.id))}
                on:click={() => toggleTripSelection(trip.id)}
              >
                <span
                  class="trip-dot"
                  style="background-color: {tripColorMap[trip.id] || '#64748b'}"
                />
                <span class="trip-name">{trip.name}</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="sidebar-footer">
          <h2 class="section-title">
            <Plus size={18} />
            {$t("map.newLocation")}
          </h2>
          <button
            class="btn-sidebar-action"
            class:btn-active={addingMode}
            on:click={toggleAddingMode}
          >
            {#if addingMode}
              <span>{$t("form.cancel")}</span>
            {:else}
              <Plus size={16} /> {$t("map.addToMapBtn")}
            {/if}
          </button>
          {#if addingMode}
            <p class="help-text mt-2 text-center text-blue-400">
              {$t("map.clickPrompt")}
            </p>
          {/if}
        </div>
      </div>
    {/if}
  </aside>

  <!-- Main Content -->
  <section class="main-content">
    <!-- Top Bar -->
    <header class="topbar">
      <div class="topbar-left">
        <MapIcon size={24} class="text-blue" />
        <div class="title-group">
          <h1>{$t("map.title")}</h1>
          <p>
            {$t("map.subtitle", {
              filtered: filteredLocations.length,
              total: totalLocations,
            })}
          </p>
        </div>
      </div>

      <div class="topbar-center">
        <div class="search-bar">
          <Search size={16} class="search-icon" />
          <input
            type="text"
            placeholder={$t("map.searchPlaceholder")}
            bind:value={searchQuery}
          />
        </div>
        <button
          class="btn-top-action {addingMode ? 'btn-active' : ''}"
          on:click={toggleAddingMode}
        >
          {#if addingMode}
            {$t("form.cancel")}
          {:else}
            <Plus size={16} /> {$t("map.newLocation")}
          {/if}
        </button>
      </div>

      <div class="topbar-right">
        <div class="mini-stat">
          <span class="label">{$t("status.Completado")}</span>
          <span class="value text-green">{visitedCount}</span>
        </div>
        <div class="mini-stat">
          <span class="label">{$t("status.Planificado")}</span>
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
        {showCountryHighlights}
        height="100%"
        on:mapclick={handleMapClick}
      />

      <!-- Floating Map Controls -->
      <div class="map-controls-floating flex flex-col gap-2">
        <!-- New Floating Add Trip Button (Mobile Only) -->
        <a
          href="/trips/new"
          class="control-btn add-trip-floating-btn"
          title={$t("dashboard.newTrip")}
        >
          <Plus size={20} />
          <span class="btn-tooltip">{$t("dashboard.newTrip")}</span>
        </a>

        <button class="control-btn" on:click={toggleLayer}>
          <Layers size={16} />
          {currentLayer === "default"
            ? $t("map.satellite")
            : $t("map.defaultLayer")}
        </button>
        <button
          class="control-btn {showCountryHighlights
            ? 'bg-blue-600 text-white border-blue-600'
            : ''}"
          on:click={() => (showCountryHighlights = !showCountryHighlights)}
        >
          <MapIcon size={16} />
          {showCountryHighlights
            ? $t("map.hideCountries")
            : $t("map.showCountries")}
        </button>
      </div>
    </div>
  </section>
</main>

{#if showAddLocationModal}
  <div
    class="modal-overlay"
    on:click|self={() => (showAddLocationModal = false)}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="premium-modal"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <!-- Header -->
      <header class="modal-header-premium">
        <div class="header-main">
          <div class="header-icon">
            <Plus size={24} />
          </div>
          <div class="header-text">
            <h3>{$t("map.addLocationHeader")}</h3>
            <p class="subheader">{$t("map.addLocationSubheader")}</p>
          </div>
        </div>
        <button
          class="btn-close-modal"
          on:click={() => (showAddLocationModal = false)}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </header>

      <div class="modal-body-scroll custom-scrollbar">
        <!-- Integrated Search -->
        <div class="integrated-search">
          <input
            type="text"
            bind:value={modalSearchQuery}
            on:keydown={(e) => e.key === "Enter" && handleModalSearch()}
            placeholder={$t("map.searchLocationPlaceholder")}
          />
          <button class="btn-integrated-search" on:click={handleModalSearch}>
            {$t("map.searchBtnShort")}
          </button>
        </div>

        <!-- Map Preview -->
        <div class="map-preview-container">
          <LocationPicker
            bind:this={locationPickerRef}
            height="200px"
            hideSearch={true}
            initialLocation={newLocationLat && newLocationLng
              ? { lat: newLocationLat, lng: newLocationLng }
              : null}
            countryName={getCountryName(newLocationCountry, $languageStore) ||
              $t("map.unknownCountry")}
            on:locationSelect={handleLocationModalSelect}
          />
        </div>
        <p class="map-help-text">{$t("map.clickMapPrompt")}</p>

        <!-- Form Fields -->
        <div class="form-grid">
          <div class="form-field-group">
            <label class="field-label" for="loc-name"
              >{$t("map.locationNameLabel")}</label
            >
            <input
              id="loc-name"
              class="premium-input"
              type="text"
              bind:value={newLocationName}
              placeholder={$t("map.placeNamePlaceholder")}
            />
          </div>
          <div class="form-field-group">
            <label class="field-label" for="loc-cat"
              >{$t("map.categoryLabel")}</label
            >
            <select
              id="loc-cat"
              class="premium-select"
              bind:value={newLocationCategory}
            >
              <option value="Monumento">{$t("categories.Monumento")}</option>
              <option value="Naturaleza">{$t("categories.Naturaleza")}</option>
              <option value="Ciudad">{$t("categories.Ciudad")}</option>
              <option value="Ciudad de escala"
                >{$t("categories.Ciudad de escala")}</option
              >
              <option value="Playa">{$t("categories.Playa")}</option>
              <option value="Montaña">{$t("categories.Montaña")}</option>
              <option value="Cultura">{$t("categories.Cultura")}</option>
              <option value="Otro">{$t("categories.Otro")}</option>
            </select>
          </div>

          {#if newLocationCountry === "ES" && $userProfile?.homeCountry === "ES"}
            <div class="form-field-group">
              <label class="field-label" for="loc-province"
                >{$t("map.provinceLabel")}</label
              >
              <select
                id="loc-province"
                class="premium-select"
                bind:value={newLocationProvince}
              >
                <option value="">{$t("map.selectProvince")}</option>
                {#each SPAIN_PROVINCES as province}
                  <option value={province.name}>{province.name}</option>
                {/each}
              </select>
            </div>
          {/if}

          <div class="form-field-group full-width-field">
            <label class="field-label" for="loc-trip"
              >{$t("map.tripLabel")}</label
            >
            <select
              id="loc-trip"
              class="premium-select"
              bind:value={newLocationTripId}
            >
              <option value="">{$t("map.selectTrip")}</option>
              <option value="new">{$t("map.newTripOption")}</option>
              {#each $trips as trip}
                <option value={trip.id}>{trip.name}</option>
              {/each}
            </select>
          </div>

          {#if newLocationTripId === "new"}
            <div class="form-field-group full-width-field" transition:slide>
              <label class="field-label" for="new-trip-name"
                >{$t("map.newTripNameLabel")}</label
              >
              <input
                id="new-trip-name"
                class="premium-input"
                type="text"
                bind:value={newTripName}
                placeholder={$t("map.newTripNamePlaceholder")}
              />
            </div>

            {#if newLocationCountry === "ES"}
              <div class="form-field-group full-width-field" transition:slide>
                <label class="field-label" for="new-trip-provinces"
                  >{$t("map.provinces")}</label
                >
                <ProvinceMultiSelect
                  bind:selectedProvinces={newTripProvinces}
                />
              </div>
            {/if}
          {/if}
        </div>

        <!-- Photo Upload Area -->
        <div class="form-field-group">
          <label class="field-label">{$t("map.uploadPhotoOptional")}</label>
          <label class="dashed-upload-box">
            <input
              type="file"
              class="hidden"
              accept="image/*"
              bind:files={newLocationPhotoFiles}
              disabled={newLocationTripId === "new" || newLocationTripId === ""}
            />
            <div class="upload-icon-circle">
              <Camera size={20} />
            </div>
            <div class="upload-text-main">
              {newLocationPhotoFiles && newLocationPhotoFiles.length > 0
                ? newLocationPhotoFiles[0].name
                : $t("map.uploadPhotoPrompt")}
            </div>
            <div class="upload-text-sub">{$t("map.uploadPhotoFormats")}</div>
          </label>

          {#if !newLocationTripId || newLocationTripId === "new"}
            <div class="upload-warning-box" transition:fade>
              <div class="text-amber-500">
                <Info size={16} />
              </div>
              <p class="text">{$t("map.uploadWarning")}</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Actions -->
      <footer class="premium-modal-footer">
        <button
          class="btn-cancel-premium"
          on:click={() => (showAddLocationModal = false)}
        >
          {$t("form.cancel")}
        </button>
        <button
          class="btn-save-premium"
          disabled={isSavingLocation ||
            !newLocationName ||
            (newLocationTripId === "new" && !newTripName)}
          on:click={saveNewLocation}
        >
          {#if isSavingLocation}
            <div
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
          {/if}
          {$t("map.saveLocationBtn")}
        </button>
      </footer>
    </div>
  </div>
{/if}

{#if showProgressModal}
  {@const globalPerc = Math.round((regions / 195) * 100)}
  <div
    class="modal-overlay"
    on:click|self={() => (showProgressModal = false)}
    on:keydown={(e) => {
      if (e.key === "Escape") showProgressModal = false
    }}
    tabindex="-1"
    role="button"
    aria-label="Cerrar modal"
  >
    <div class="progress-modal-glass scroll-content">
      <!-- Left Sidebar (Stats) -->
      <div class="progress-sidebar">
        <div class="progress-header">
          <div class="header-icon-box">
            <Globe size={24} color="#60a5fa" />
          </div>
          <h2>{$t("map.countries")}</h2>
        </div>

        <div class="global-progress-card">
          <span class="progress-subtitle">{$t("map.globalProgress")}</span>
          <div class="progress-big-number">
            <span>{completion}%</span>
            <span class="muted">{$t("map.ofTheWorld")}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: {completion}%" />
          </div>
          <div class="progress-footer-text">
            <span
              ><svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><polyline points="20 6 9 17 4 12" /></svg
              ></span
            >
            <span
              >{$t("map.visitedCountriesAmount", {
                count: regions,
                total: 195,
                percentage: globalPerc,
              })}</span
            >
          </div>
        </div>

        <div class="continent-breakdown">
          <span class="breakdown-title">{$t("map.byContinent")}</span>

          {#each Object.entries(continentStats) as [continent, data]}
            {@const perc =
              data.total > 0
                ? Math.round((data.visited / data.total) * 100)
                : 0}
            <div class="continent-row">
              <div class="continent-labels">
                <span class="continent-name"
                  >{$t("continents." + continent)}</span
                >
                <span class="continent-pct">{perc}%</span>
              </div>
              <div class="continent-bar-bg">
                <div class="continent-bar-fill" style="width: {perc}%" />
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Right Main Area (Explorer) -->
      <div class="progress-main">
        <button
          class="modal-close-btn"
          on:click={() => (showProgressModal = false)}
        >
          <X size={20} />
        </button>

        <div class="main-header">
          <h2>{$t("map.explorerTitle")}</h2>
          <p>{$t("map.explorerSubtitle")}</p>
        </div>

        <div class="explorer-controls">
          <div class="explorer-search">
            <input
              type="text"
              placeholder={$t("map.searchCountryPlaceholder")}
              bind:value={explorerSearch}
            />
          </div>

          <div class="continent-toggles custom-scrollbar">
            {#each ["Todos", "Europa", "América", "Asia", "África", "Oceanía"] as opt}
              <button
                class="toggle-btn"
                class:active={explorerContinent === opt}
                on:click={() => (explorerContinent = opt)}
              >
                {$t(`continents.${opt}`)}
              </button>
            {/each}
          </div>
        </div>

        <div class="countries-grid custom-scrollbar">
          {#each filteredExplorerCountries as country}
            {@const isHomeCountry = country.id === $userProfile.homeCountry}
            <div
              class="modern-country-card"
              class:visited={country.isVisited}
              class:clickable-stats={isHomeCountry}
              on:click={() => {
                if (isHomeCountry) {
                  showProvinceExplorer = true
                }
              }}
            >
              {#if country.isVisited}
                <div class="visited-check">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><polyline points="20 6 9 17 4 12" /></svg
                  >
                </div>
              {/if}
              <span class="flag-emoji" class:grayscale={!country.isVisited}
                >{country.flag}</span
              >
              <span class="country-name" class:muted={!country.isVisited}
                >{country.localizedName}</span
              >
              <div class="country-footer">
                <span class="country-continent"
                  >{$t("continents." + country.mappedCont).toUpperCase()}</span
                >
                {#if isHomeCountry}
                  <div
                    class="home-indicator"
                    title={$t("profile.viewDetailedStats")}
                  >
                    <MapPin size={10} />
                    <span>Prov.</span>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <div class="explorer-footer">
          <button class="btn-done" on:click={() => (showProgressModal = false)}
            >{$t("map.doneBtn")}</button
          >
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showProvinceExplorer}
  <ProvinceExplorer
    countryCode={$userProfile.homeCountry || "ES"}
    visitedProvinces={visitedProvinceNamesSet}
    plannedProvinces={plannedProvinceNamesSet}
    on:close={() => (showProvinceExplorer = false)}
  />
{/if}

<style>
  .dashboard-page {
    display: grid;
    grid-template-columns: 300px 1fr;
    height: calc(100vh - 64px); /* Subtract navbar height approx */
    background: #0f172a;
    color: #e2e8f0;
    overflow: hidden;
    transition: grid-template-columns 0.3s ease;
  }

  .dashboard-page.sidebar-minimized {
    grid-template-columns: 80px 1fr;
  }

  /* Minimized Sidebar Styles */
  .minimized-sidebar-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    height: 100%;
    padding-top: 5rem;
    z-index: 10;
  }

  .minimized-filters {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .mini-filter-item {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    opacity: 1;
    color: white;
  }

  .mini-filter-item:hover {
    transform: scale(1.05);
  }

  .mini-filter-item.inactive {
    opacity: 0.3;
    filter: grayscale(1);
  }

  .mini-filter-item.casa {
    color: #ef4444;
  }
  .mini-filter-item.completado {
    color: #10b981;
  }
  .mini-filter-item.planificado {
    color: #3b82f6;
  }
  .mini-filter-item.en-curso {
    color: #94a3b8;
  }

  .mini-progress-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.75rem 0.5rem;
    border-radius: 12px;
    transition: background 0.2s;
  }

  .mini-progress-indicator:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .mini-circle-box {
    position: relative;
    width: 36px;
    height: 36px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
  }

  .mini-progress-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    background: #3b82f6;
    border: 2px solid var(--color-bg-secondary);
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
  }

  .mini-stats-text {
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  /* Sidebar styles */
  .sidebar {
    background: var(--color-bg-secondary);
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .sidebar-top-logo {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .logo-box {
    width: 40px;
    height: 40px;
    background: #2563eb;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
  }

  .sidebar-nav-container {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .nav-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .nav-section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Adventure Stats Cards */
  .main-stat-card {
    background: var(--color-bg-tertiary);
    opacity: 0.8;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1.25rem;
  }

  .main-stat-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .main-stat-value {
    font-size: 3rem;
    font-weight: 800;
    color: var(--color-text-primary);
    line-height: 1;
  }

  .stats-list-vertical {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0 0.5rem;
  }

  .stats-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .item-label {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }

  .item-value {
    font-size: 1rem;
    font-weight: 700;
  }

  .global-progress-mini {
    padding: 0.5rem;
    border-radius: 12px;
    transition: background 0.2s;
    border: 1px solid var(--color-border);
  }

  .global-progress-mini:hover {
    background: var(--color-bg-tertiary);
    opacity: 0.8;
  }

  .progress-info-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .progress-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .progress-count {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .minimal-progress-bar {
    height: 4px;
    background: var(--color-bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background: #2563eb;
    border-radius: 2px;
    transition: width 0.5s ease-out;
  }

  /* Visualization Options - Pills */
  .visualization-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .custom-pill-toggle {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background: var(--color-bg-tertiary);
    opacity: 0.7;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid var(--color-border);
  }

  .custom-pill-toggle:hover {
    background: var(--color-bg-tertiary);
    opacity: 1;
  }

  .custom-pill-toggle:has(input:checked) {
    background: rgba(37, 99, 235, 0.1);
    border-color: #2563eb;
    opacity: 1;
  }

  .custom-pill-toggle input {
    display: none;
  }

  .pill-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .pill-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text-primary);
    flex: 1;
  }

  .pill-count {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-text-muted);
    background: rgba(0, 0, 0, 0.2);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .custom-pill-toggle:has(input:checked) .pill-count {
    color: white;
    background: #2563eb;
  }

  /* Trip Filter List */
  .trip-filter-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 250px;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .trip-filter-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.6rem 0.75rem;
    border-radius: 10px;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .trip-filter-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
  }

  .trip-filter-item.hidden-trip {
    opacity: 0.4;
    filter: grayscale(1);
  }

  .trip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .trip-name {
    font-size: 0.9rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Footer */
  .sidebar-footer {
    display: none; /* Moved functionality or redesigning below */
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

  /* --- Mobile Stats Panel (hidden on desktop) --- */
  .mobile-stats-panel {
    display: none;
  }

  /* Responsive - Mobile */
  @media (max-width: 768px) {
    .dashboard-page {
      display: flex;
      flex-direction: column;
      height: calc(
        100vh - 3.25rem - 56px
      ); /* Subtract top navbar + bottom nav */
      overflow: hidden;
    }

    .dashboard-page.sidebar-minimized {
      grid-template-columns: unset;
    }

    .sidebar {
      display: none !important;
    }

    .topbar {
      display: none !important;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .map-area {
      flex: 1;
      padding: 0;
    }

    /* Mobile Stats Panel */
    .mobile-stats-panel {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      background: var(--color-bg-secondary);
      border-bottom: 1px solid var(--color-border);
    }

    /* Mobile Search */
    .mobile-search-bar {
      position: relative;
      display: flex;
      align-items: center;
    }

    .mobile-search-bar :global(.mobile-search-icon) {
      position: absolute;
      left: 0.75rem;
      color: #64748b;
      pointer-events: none;
    }

    .mobile-search-bar input {
      width: 100%;
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border-radius: 8px;
      color: var(--color-text-primary);
      font-size: 0.85rem;
      line-height: normal;
    }

    .mobile-search-bar input::placeholder {
      color: #64748b;
    }

    .mobile-search-bar input:focus {
      outline: none;
      border-color: var(--color-accent-primary);
    }

    /* Mobile Stats Row */
    .mobile-stats-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 0.75rem 1rem;
    }

    .mobile-stat-main {
      display: flex;
      flex-direction: column;
      margin-right: auto;
    }

    .mobile-stat-label {
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mobile-stat-value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--color-text-primary);
      line-height: 1;
    }

    .mobile-stat-items {
      display: flex;
      gap: 1.25rem;
    }

    .mobile-stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .mobile-stat-number {
      font-size: 1.25rem;
      font-weight: 800;
      line-height: 1;
    }

    .mobile-stat-item-label {
      font-size: 0.6rem;
      color: var(--color-text-secondary);
      margin-top: 2px;
    }

    /* Mobile Progress Row */
    .mobile-progress-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      background: var(--color-bg-tertiary);
      transition: background 0.2s;
    }

    .mobile-progress-row:active {
      background: rgba(37, 99, 235, 0.08);
    }

    .mobile-progress-label {
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      white-space: nowrap;
    }

    .mobile-progress-bar-track {
      flex: 1;
      height: 4px;
      background: var(--color-bg-tertiary);
      border-radius: 2px;
      overflow: hidden;
    }

    .mobile-progress-bar-fill {
      height: 100%;
      background: #2563eb;
      border-radius: 2px;
      transition: width 0.5s ease-out;
    }

    .mobile-progress-count {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    /* Mobile Filter Chips */
    .mobile-filter-chips {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 2px;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .mobile-filter-chips::-webkit-scrollbar {
      display: none;
    }

    .mobile-chip {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
      opacity: 0.5;
    }

    .mobile-chip.active {
      opacity: 1;
    }

    .mobile-chip.chip-home.active {
      background: rgba(239, 68, 68, 0.15);
      border-color: #ef4444;
      color: #ef4444;
    }

    .mobile-chip.chip-completed.active {
      background: rgba(16, 185, 129, 0.15);
      border-color: #10b981;
      color: #10b981;
    }

    .mobile-chip.chip-planned.active {
      background: rgba(59, 130, 246, 0.15);
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .mobile-chip.chip-ongoing.active {
      background: rgba(148, 163, 184, 0.15);
      border-color: #94a3b8;
      color: #94a3b8;
    }

    /* Mobile Panel Toggle Handle */
    .mobile-panel-toggle {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 0.25rem 0 0.15rem;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      transition: color 0.2s;
      width: 100%;
    }

    .mobile-panel-toggle:active {
      color: var(--color-text-primary);
    }

    .toggle-handle-bar {
      width: 32px;
      height: 3px;
      background: var(--color-border);
      border-radius: 2px;
      transition: background 0.2s;
    }

    .mobile-panel-toggle:active .toggle-handle-bar {
      background: var(--color-text-secondary);
    }

    /* Collapsed mobile panel — only shows the toggle handle */
    .mobile-stats-panel.collapsed {
      gap: 0;
      padding: 0.25rem 1rem 0.15rem;
    }

    /* Slide transition inner wrapper spacing */
    .mobile-stats-panel > div:first-child {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      padding-bottom: 0.25rem;
    }

    /* Map Controls on Mobile */
    .map-controls-floating {
      top: 10px;
      right: 10px;
    }

    .add-trip-floating-btn {
      background: var(--color-primary, #3b82f6) !important;
      color: white !important;
      border: none !important;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50% !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      margin-bottom: 0.5rem;
    }

    .add-trip-floating-btn .btn-tooltip {
      display: none;
    }

    .control-btn {
      padding: 0.4rem 0.6rem;
      font-size: 0.75rem;
    }
  }

  /* Modal Styles Redesign (Phase 14) */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(2, 6, 23, 0.85); /* Deep slate backdrop */
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
  }

  .premium-modal {
    background: #0f172a;
    width: 100%;
    max-width: 600px;
    max-height: 95vh;
    border-radius: 24px;
    border: 1px solid #1e293b;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    color: #f8fafc;
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

  .integrated-search {
    display: flex;
    align-items: center;
    background: #141c2f;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 1.5rem;
    transition: border-color 0.2s;
  }

  .integrated-search:focus-within {
    border-color: #3b82f6;
  }

  .integrated-search input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 0.75rem 1rem;
    color: white;
    font-size: 0.95rem;
    outline: none;
  }

  .btn-integrated-search {
    background: #2563eb;
    color: white;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .btn-integrated-search:hover {
    background: #1d4ed8;
  }

  .map-preview-container {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #1e293b;
    margin-bottom: 0.75rem;
  }

  .map-help-text {
    font-size: 0.8rem;
    color: #64748b;
    text-align: center;
    font-style: italic;
    margin-bottom: 1.5rem;
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
  .premium-select {
    background: #141c2f;
    border: 1px solid #1e293b;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    color: #f1f5f9;
    font-size: 0.95rem;
    width: 100%;
    transition: all 0.2s;
  }

  .premium-input:focus,
  .premium-select:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .full-width-field {
    grid-column: span 2;
    margin-bottom: 0.5rem;
  }

  /* Photo Upload Component */
  .dashed-upload-box {
    border: 2px dashed #1e293b;
    border-radius: 16px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(15, 23, 42, 0.3);
    position: relative;
  }

  .dashed-upload-box:hover {
    border-color: #3b82f6;
    background: rgba(37, 99, 235, 0.05);
  }

  .upload-icon-circle {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
  }

  .upload-text-main {
    font-size: 0.95rem;
    font-weight: 600;
    color: #94a3b8;
  }

  .upload-text-sub {
    font-size: 0.75rem;
    color: #64748b;
  }

  .upload-warning-box {
    background: rgba(245, 158, 11, 0.05);
    border: 1px solid rgba(245, 158, 11, 0.1);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-top: 1rem;
  }

  .upload-warning-box .text {
    font-size: 0.75rem;
    color: #d97706;
    line-height: 1.4;
  }

  .premium-modal-footer {
    padding: 1.5rem 2rem;
    background: #0f172a;
    border-top: 1px solid #1e293b;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .btn-cancel-premium {
    background: transparent;
    border: 1px solid #1e293b;
    color: #94a3b8;
    padding: 0.6rem 1.5rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel-premium:hover {
    background: rgba(255, 255, 255, 0.03);
    color: #f1f5f9;
  }

  .btn-save-premium {
    background: #2563eb;
    color: white;
    border: none;
    padding: 0.6rem 2rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    transition: all 0.2s;
  }

  .btn-save-premium:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
  }

  .btn-save-premium:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* --- Country Progress Modal Redesign --- */
  .progress-modal-glass {
    background: #0f172a;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    border-radius: 20px;
    border: 1px solid #1e293b;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    display: flex;
  }

  /* Sidebar */
  .progress-sidebar {
    width: 280px;
    background: #141c2f;
    border-right: 1px solid #1e293b;
    display: flex;
    flex-direction: column;
    padding: 2rem 1.5rem;
  }

  .progress-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .header-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(59, 130, 246, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .progress-header h2 {
    margin: 0;
    color: white;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .global-progress-card {
    background: rgba(30, 41, 59, 0.5);
    border-radius: 16px;
    padding: 1.25rem;
    margin-bottom: 2rem;
  }

  .progress-subtitle {
    font-size: 0.65rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .progress-big-number {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin: 0.5rem 0 1rem;
  }

  .progress-big-number span:first-child {
    font-size: 2rem;
    font-weight: 800;
    color: white;
    line-height: 1;
  }

  .progress-big-number .muted {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
  }

  .progress-bar-container {
    height: 6px;
    background: #1e293b;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .progress-bar-fill {
    height: 100%;
    background: #3b82f6; /* Blue */
    border-radius: 3px;
    transition: width 1s ease-out;
  }

  .progress-footer-text {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  /* Continent Breakdown */
  .continent-breakdown {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .breakdown-title {
    font-size: 0.65rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  .continent-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .continent-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
  }

  .continent-name {
    color: #f1f5f9;
    font-weight: 600;
  }

  .continent-pct {
    color: #94a3b8;
  }

  .continent-bar-bg {
    height: 4px;
    background: #1e293b;
    border-radius: 2px;
    overflow: hidden;
  }

  .continent-bar-fill {
    height: 100%;
    background: #64748b;
    border-radius: 2px;
    transition: width 1s ease-out;
  }

  /* Explorer Main Area */
  .progress-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 2rem 2.5rem;
    position: relative;
    background: #0f172a;
  }

  .modal-close-btn {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .modal-close-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  .main-header {
    margin-bottom: 2rem;
  }

  .main-header h2 {
    margin: 0 0 0.5rem 0;
    color: white;
    font-size: 1.75rem;
    font-weight: 700;
  }

  .main-header p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .explorer-controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .explorer-search {
    position: relative;
    width: 260px;
  }

  .explorer-search input {
    width: 100%;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    color: white;
    font-size: 0.9rem;
    transition: border-color 0.2s;
  }

  .explorer-search input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .continent-toggles {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 4px; /* Scrollbar space */
  }

  .toggle-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    background: #3b82f6;
    color: white;
  }

  .toggle-btn:hover:not(.active) {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .countries-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
    overflow-y: auto;
    padding-right: 0.5rem;
    margin-right: -0.5rem;
  }

  .modern-country-card {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 16px;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    transition: transform 0.2s, background 0.2s;
  }

  .modern-country-card:hover {
    background: rgba(30, 41, 59, 0.8);
    transform: translateY(-2px);
  }

  .modern-country-card.visited {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.05);
  }

  .modern-country-card.visited:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  .visited-check {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 20px;
    height: 20px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.4);
  }

  .flag-emoji {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
    transition: filter 0.3s;
  }

  .flag-emoji.grayscale {
    filter: grayscale(0.8) opacity(0.5)
      drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
  }

  .country-name {
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    text-align: center;
    margin-bottom: 0.25rem;
  }

  .country-name.muted {
    color: #94a3b8;
  }

  .country-continent {
    font-size: 0.65rem;
    font-weight: 700;
    color: #475569;
    letter-spacing: 0.05em;
  }

  .explorer-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #1e293b;
  }

  .btn-done {
    background: white;
    color: #0f172a;
    border: none;
    padding: 0.6rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-done:hover {
    background: #f1f5f9;
  }

  @media (max-width: 1200px) {
    .progress-modal-glass {
      flex-direction: column;
      height: 90vh;
      max-width: 95%;
    }
    /* On small screens show explorer (flags + filters) first, stats below */
    .progress-main {
      padding: 1.5rem;
      order: 1;
    }
    .progress-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #1e293b;
      padding: 1.5rem;
      order: 2;
    }
    .explorer-controls {
      flex-direction: column;
      align-items: stretch;
    }
    .explorer-search {
      width: 100%;
    }
  }

  /* Mobile-specific country progress modal */
  @media (max-width: 768px) {
    .progress-modal-glass {
      flex-direction: column;
      height: 95vh;
      max-width: 100%;
      border-radius: 16px;
    }

    .progress-main {
      padding: 1rem;
      order: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .progress-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #1e293b;
      padding: 1rem;
      order: 2;
      max-height: 30vh;
      overflow-y: auto;
    }

    .main-header {
      margin-bottom: 1rem;
    }

    .main-header h2 {
      font-size: 1.25rem;
    }

    .main-header p {
      font-size: 0.8rem;
    }

    .countries-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.5rem;
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .modern-country-card {
      padding: 0.75rem 0.5rem;
      border-radius: 12px;
    }

    .flag-emoji {
      font-size: 1.75rem;
      margin-bottom: 0.4rem;
    }

    .country-name {
      font-size: 0.7rem;
      margin-bottom: 0.15rem;
    }

    .country-continent {
      font-size: 0.55rem;
    }

    .visited-check {
      top: 0.4rem;
      right: 0.4rem;
      width: 16px;
      height: 16px;
    }

    .visited-check svg {
      width: 10px;
      height: 10px;
    }

    .explorer-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .explorer-search {
      width: 100%;
    }

    .explorer-search input {
      padding: 0.6rem 0.75rem;
      font-size: 0.85rem;
    }

    .continent-toggles {
      gap: 0.35rem;
    }

    .toggle-btn {
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
    }

    .explorer-footer {
      margin-top: 1rem;
      padding-top: 1rem;
    }

    .global-progress-card {
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .progress-big-number span:first-child {
      font-size: 1.5rem;
    }

    .continent-row {
      gap: 0.35rem;
    }
  }
  .modern-country-card.clickable-stats {
    cursor: pointer;
    border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  }

  .modern-country-card.clickable-stats:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
    transform: translateY(-2px);
  }

  .country-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-top: auto;
  }

  .home-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 700;
  }
</style>
