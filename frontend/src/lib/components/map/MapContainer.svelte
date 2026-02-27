<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte"
  import { browser } from "$app/environment"
  import { userProfile } from "$lib/stores/data"
  import type { Location } from "$lib/stores/data"
  import "leaflet/dist/leaflet.css"
  import "leaflet.markercluster/dist/MarkerCluster.css"
  import "leaflet.markercluster/dist/MarkerCluster.Default.css"
  import markerIconUrl from "leaflet/dist/images/marker-icon.png"
  import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
  import markerShadowUrl from "leaflet/dist/images/marker-shadow.png"
  import { geocode } from "$lib/utils/geocode"
  import { Search } from "lucide-svelte"
  import type { AppPhoto } from "$lib/services/media"
  import type { Trip } from "$lib/stores/data"
  import { API_URL } from "$lib/services/auth"

  export let height = "100%"
  export let locations: Location[] = []
  export let mapPhotos: AppPhoto[] = []
  export let trips: Trip[] = []
  export let hiddenTrips: string[] = []
  export let tripColorMap: Record<string, string> = {}
  export let showHome = true

  let mapContainer: HTMLDivElement
  let map: any
  let markerClusterGroup: any
  let L: any
  let currentTileLayer: any
  let searchQuery = ""
  let searchLoading = false
  let searchError = ""

  const dispatch = createEventDispatcher()
  let tripLinesGroup: any
  let photoMarkersGroup: any

  // Reactive update when locations prop changes
  $: if (
    map &&
    browser &&
    L &&
    markerClusterGroup &&
    locations &&
    mapPhotos &&
    trips &&
    hiddenTrips &&
    tripColorMap
  ) {
    updateMarkers()
  }

  async function updateMarkers() {
    if (!map || !markerClusterGroup) return

    // Clear existing layer
    markerClusterGroup.clearLayers()
    if (tripLinesGroup) {
      tripLinesGroup.clearLayers()
    } else {
      tripLinesGroup = L.layerGroup().addTo(map)
    }
    if (photoMarkersGroup) {
      photoMarkersGroup.clearLayers()
    } else {
      photoMarkersGroup = L.layerGroup().addTo(map)
    }

    const bounds = L.latLngBounds()

    // Add new markers
    locations.forEach((loc) => {
      const popupContent = `
        <div style="text-align: center; width: 160px;">
          <div style="
            height: 100px; 
            background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
            border-radius: 8px; 
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          ">
            ${getCategoryEmoji(loc.category)}
          </div>
          <h3 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">${
            loc.name
          }</h3>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">${
            loc.category
          } • ⭐ ${loc.rating}</p>
        </div>
      `

      // Custom Icon logic
      const customIcon = L.divIcon({
        className: "custom-map-marker",
        html: `<div class="marker-pin-custom" style="background-color: #3b82f6;">
                  <span class="marker-emoji">${getCategoryEmoji(
                    loc.category
                  )}</span>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      })

      const marker = L.marker([loc.coordinates[0], loc.coordinates[1]], {
        icon: customIcon,
      }).bindPopup(popupContent)

      markerClusterGroup.addLayer(marker)
      bounds.extend([loc.coordinates[0], loc.coordinates[1]])
    })

    // Add Trip Polylines
    const validTrips = trips.filter(
      (t) =>
        t.status === "Planificado" ||
        t.status === "En curso" ||
        t.status === "Completado"
    )

    validTrips.forEach((trip) => {
      // Get the locations for this trip
      const tripLocations = locations.filter((l) => {
        const locTripId = l.tripId || (l as any).trip_id
        return locTripId === trip.id
      })
      // Sort them sequentially by visitDate if needed (assuming visitedDate or simply order added)
      tripLocations.sort(
        (a, b) =>
          new Date(a.visitedDate).getTime() - new Date(b.visitedDate).getTime()
      )

      if (tripLocations.length > 1) {
        const latlngs = tripLocations.map((l) => [
          l.coordinates[0],
          l.coordinates[1],
        ])
        const color = tripColorMap[trip.id] || "#3b82f6"
        const polyline = L.polyline(latlngs, {
          color: color,
          weight: 3,
          dashArray: trip.status === "Planificado" ? "5, 10" : "", // Dashed line for planned
          opacity: 0.8,
        }).bindPopup(`<strong>Viaje:</strong> ${trip.name}`)

        tripLinesGroup.addLayer(polyline)
        bounds.extend(polyline.getBounds())
      }
    })

    // Add Photos Markers
    mapPhotos.forEach((photo) => {
      if (photo.metadata?.exif?.latitude && photo.metadata?.exif?.longitude) {
        const url =
          photo.provider === "local"
            ? `${API_URL}${photo.url}`
            : `${API_URL}/media/photos/${photo.id}/image`
        const photoTripId = photo.tripId || (photo as any).trip_id
        const photoTrip = photoTripId
          ? trips.find((t) => t.id === photoTripId)
          : null

        const borderColor = photoTrip
          ? tripColorMap[photoTrip.id] || "#3b82f6"
          : "#f59e0b"
        const photoIcon = L.divIcon({
          className: "custom-photo-marker",
          html: `
            <div class="marker-photo-wrapper" style="border-color: ${borderColor}">
              <img src="${url}" alt="Foto de mapa" class="marker-photo-img" />
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 48],
          popupAnchor: [0, -48],
        })

        const popupContent = `
          <div style="text-align: center; width: 220px; padding: 0.5rem;">
            <img src="${url}" style="width: 100%; border-radius: 8px; margin-bottom: 12px; object-fit: cover; max-height: 150px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);" />
            ${
              photoTrip
                ? `<div style="margin-bottom: 8px;"><span style="background: rgba(59, 130, 246, 0.2); color: #93c5fd; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Viaje: ${photoTrip.name}</span></div>`
                : ""
            }
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">Tomada el: ${
              photo.metadata?.exif?.dateTimeOriginal
                ? new Date(
                    photo.metadata.exif.dateTimeOriginal
                  ).toLocaleDateString()
                : "Desconocido"
            }</p>
          </div>
        `

        const marker = L.marker(
          [photo.metadata.exif.latitude, photo.metadata.exif.longitude],
          {
            icon: photoIcon,
          }
        ).bindPopup(popupContent, {
          className: "dark-popup",
        })

        photoMarkersGroup.addLayer(marker)
        bounds.extend([
          photo.metadata.exif.latitude,
          photo.metadata.exif.longitude,
        ])
      }
    })

    // Ensure the layer is added to map
    if (!map.hasLayer(markerClusterGroup)) {
      map.addLayer(markerClusterGroup)
    }

    const homeBounds = updateHomeMarker()
    if (homeBounds) {
      bounds.extend(homeBounds)
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    }
  }

  // Separate Home Marker Logic
  let homeMarker: any

  function updateHomeMarker() {
    if (!map || !L) return

    // Remove existing
    if (homeMarker) {
      map.removeLayer(homeMarker)
      homeMarker = null
    }

    if (showHome && $userProfile.homeLocation) {
      const home = $userProfile.homeLocation
      const customIcon = L.divIcon({
        className: "custom-map-marker",
        html: `<div class="marker-home" style="background-color: #ef4444;">
                  <span class="marker-emoji">🏠</span>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      })

      homeMarker = L.marker([home.coordinates[0], home.coordinates[1]], {
        icon: customIcon,
        zIndexOffset: 1000, // Ensure it's on top
      }).addTo(map).bindPopup(`
          <div style="text-align: center;">
            <h3 style="margin: 0;">🏠 Casa</h3>
            <p>${home.name}</p>
          </div>
        `)

      return [home.coordinates[0], home.coordinates[1]]
    }
    return null
  }

  // React to showHome change
  $: if (map && (showHome || !showHome)) {
    updateHomeMarker()
  }

  function getCategoryEmoji(category: string) {
    const map: Record<string, string> = {
      Naturaleza: "🌲",
      Ciudad: "🏙️",
      "Ciudad de escala": "✈️",
      Playa: "🏖️",
      Montaña: "🏔️",
      Cultura: "🏛️",
      Otro: "📍",
    }
    return map[category] || "📍"
  }

  export function setMapLayer(type: "default" | "satellite") {
    if (!map || !L) return

    if (currentTileLayer) {
      map.removeLayer(currentTileLayer)
    }

    if (type === "satellite") {
      currentTileLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 19,
        }
      )
    } else {
      currentTileLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      )
    }

    currentTileLayer.addTo(map)
  }

  onMount(async () => {
    if (!browser) return

    try {
      // Dynamic imports with robust loading
      const leafletModule = await import("leaflet")
      L = leafletModule.default

      console.log("Leaflet loaded:", L.version)

      // Use Leaflet marker images from package (Vite resolves URLs)
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIconRetinaUrl,
        iconUrl: markerIconUrl,
        shadowUrl: markerShadowUrl,
      })

      // Expose L to window for plugins that rely on global L
      // @ts-ignore
      window.L = L

      // Import plugin explicitly
      // We use the file path found in verification to ensure it resolves
      // @ts-ignore
      await import("leaflet.markercluster/dist/leaflet.markercluster.js")

      console.log("MarkerCluster plugin loaded:", !!L.markerClusterGroup)

      // Initialize map
      map = L.map(mapContainer, {
        center: [20, 0],
        zoom: 2,
        zoomControl: false,
        minZoom: 2,
        maxZoom: 18,
      })

      // Default Dark Mode
      setMapLayer("default")

      // Zoom control top-left as in design
      L.control.zoom({ position: "topleft" }).addTo(map)

      map.on("click", (e: any) => {
        dispatch("mapclick", { lat: e.latlng.lat, lng: e.latlng.lng })
      })

      if (L.markerClusterGroup) {
        // Initialize Cluster Group with custom styles
        markerClusterGroup = L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
          iconCreateFunction: function (cluster: any) {
            const childCount = cluster.getChildCount()
            let c = " marker-cluster-"
            if (childCount < 10) {
              c += "small"
            } else if (childCount < 100) {
              c += "medium"
            } else {
              c += "large"
            }

            return L.divIcon({
              html: "<div><span>" + childCount + "</span></div>",
              className: "marker-cluster" + c,
              iconSize: [40, 40],
            })
          },
        })

        map.addLayer(markerClusterGroup)
      } else {
        console.error("Leaflet MarkerClusterGroup not found!")
      }

      // Initial marker update
      updateMarkers()
    } catch (e) {
      console.error("Error initializing map:", e)
    }
  })

  async function handleSearch() {
    if (!searchQuery.trim() || !map) return
    searchError = ""
    searchLoading = true
    try {
      const result = await geocode(searchQuery)
      if (result) {
        map.setView([result.lat, result.lng], 12)
      } else {
        searchError = "No se encontró la ubicación."
      }
    } catch (e) {
      searchError = "Error al buscar."
    } finally {
      searchLoading = false
    }
  }

  onDestroy(() => {
    if (map) {
      map.remove()
    }
  })
</script>

<div class="map-outer">
  <div class="map-search-bar">
    <input
      type="text"
      class="map-search-input"
      placeholder="Buscar ciudad o lugar..."
      bind:value={searchQuery}
      on:keydown={(e) => e.key === "Enter" && handleSearch()}
    />
    <button
      type="button"
      class="map-search-btn"
      disabled={searchLoading || !searchQuery.trim()}
      on:click={handleSearch}
      title="Buscar en el mapa"
    >
      <Search size={18} />
      <span>{searchLoading ? "..." : "Buscar"}</span>
    </button>
  </div>
  {#if searchError}
    <p class="map-search-error">{searchError}</p>
  {/if}
  <div bind:this={mapContainer} class="map-wrapper" style="height: {height}" />
</div>

<style>
  .map-outer {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .map-search-bar {
    position: absolute;
    top: 0.75rem;
    left: 3rem;
    right: 0.75rem;
    z-index: 1000;
    display: flex;
    gap: 0.5rem;
    max-width: 24rem;
  }
  .map-search-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(71, 85, 105, 0.6);
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.95);
    color: #e2e8f0;
    font-size: 0.875rem;
    font-family: inherit;
  }
  .map-search-input::placeholder {
    color: #64748b;
  }
  .map-search-input:focus {
    outline: none;
    border-color: rgba(96, 165, 250, 0.8);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  .map-search-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 8px;
    background: #3b82f6;
    color: #fff;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  .map-search-btn:hover:not(:disabled) {
    background: #2563eb;
  }
  .map-search-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .map-search-error {
    position: absolute;
    top: 3.25rem;
    left: 0.75rem;
    z-index: 1000;
    margin: 0;
    font-size: 0.8125rem;
    color: #f87171;
  }
  .map-wrapper {
    width: 100%;
    height: 100%;
    z-index: 1;
    background: #1a1a1a;
  }

  :global(.leaflet-pane) {
    z-index: 1;
  }
  :global(.leaflet-top),
  :global(.leaflet-bottom) {
    z-index: 2;
  }

  /* Custom Marker Styles */
  :global(.custom-map-marker) {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
  }

  :global(.marker-pin-custom) {
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    background: #3b82f6;
    position: absolute;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.marker-emoji) {
    transform: rotate(45deg); /* Counteract pin rotation */
    font-size: 18px;
    line-height: 1;
  }

  :global(.custom-photo-marker) {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
  }

  :global(.marker-photo-wrapper) {
    width: 48px;
    height: 48px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    background: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.marker-photo-img) {
    width: 150%;
    height: 150%;
    object-fit: cover;
    transform: rotate(45deg);
  }

  :global(.marker-home) {
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    background: #ef4444; /* Red for Home */
    position: absolute;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  /* Cluster Styles */
  :global(.marker-cluster) {
    background-clip: padding-box;
    border-radius: 20px;
  }

  :global(.marker-cluster div) {
    width: 36px;
    height: 36px;
    margin-left: 2px;
    margin-top: 2px;
    text-align: center;
    border-radius: 50%;
    color: white;
    font-weight: bold;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid rgba(255, 255, 255, 0.5);
    background-color: rgba(59, 130, 246, 0.9); /* Default Blue */
  }

  /* Cluster Sizes (Optional variation) */
  :global(.marker-cluster-small div) {
    background-color: rgba(59, 130, 246, 0.9);
  }
  :global(.marker-cluster-medium div) {
    background-color: rgba(245, 158, 11, 0.9); /* Amber */
  }
  :global(.marker-cluster-large div) {
    background-color: rgba(239, 68, 68, 0.9); /* Red */
  }

  /* Popup Dark Mode Overrides */
  :global(.leaflet-popup-content-wrapper) {
    background: #1e293b !important;
    color: #e2e8f0;
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
  }
  :global(.leaflet-popup-content) {
    margin: 4px;
  }
  :global(.leaflet-popup-tip) {
    background: #1e293b !important;
  }
  :global(.leaflet-popup-close-button) {
    color: #94a3b8 !important;
  }
  :global(.leaflet-popup-close-button:hover) {
    color: #f1f5f9 !important;
  }
</style>
