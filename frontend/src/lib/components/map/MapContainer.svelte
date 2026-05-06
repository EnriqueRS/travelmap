<script lang="ts">
import { onMount, onDestroy, createEventDispatcher } from "svelte"
import { browser } from "$app/environment"
import { goto } from "$app/navigation"
  import { toast, languageStore } from "$lib/stores/ui"
  import { t } from "$lib/stores/i18n"
  import { getStatusColor, userProfile } from "$lib/stores/data"
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
  import { normalizeString } from "$lib/utils/string"

  export let height = "100%"
  export let locations: Location[] = []
  export let mapPhotos: AppPhoto[] = []
  export let trips: Trip[] = []
  export let hiddenTrips: string[] = []
  export let tripColorMap: Record<string, string> = {}
  export let showHome = true
  export let showCountryHighlights = false

  import countriesInfo from "i18n-iso-countries"
  import esLocale from "i18n-iso-countries/langs/es.json"
  import { formatDate } from "$lib/utils/formatters"
  import { getCountryFlag } from "$lib/utils/countries"
  countriesInfo.registerLocale(esLocale)

  let mapContainer: HTMLDivElement
  let map: any
  let markerClusterGroup: any
  let L: any
  let currentTileLayer: any
  let searchQuery = ""
  let searchLoading = false
  let searchError = ""
  let currentZoom = 2
  const ZOOM_THRESHOLD_PROVINCES = 4

const dispatch = createEventDispatcher()
let tripLinesGroup: any
let photoClusterGroup: any
let countryHighlightsGroup: any
let geoJsonData: any = null
let provincesGeoJSONData: any = null

// Trip navigation handler
const tripNavigateHandler = (e: any) => {
const tripId = e.detail?.tripId
if (tripId) {
goto(`/trips/${tripId}`)
}
}

  // 1. Reactive update for DATA changes (Should fit bounds)
  $: if (
    map &&
    browser &&
    L &&
    markerClusterGroup &&
    (locations ||
      mapPhotos ||
      trips ||
      hiddenTrips ||
      tripColorMap ||
      showCountryHighlights !== undefined)
  ) {
    updateMarkers(true)
  }

  // 2. Reactive update for ZOOM changes (Should NOT fit bounds)
  $: if (map && browser && L && currentZoom !== undefined) {
    updateMarkers(false)
  }

  async function updateMarkers(shouldFit = false) {
    if (!map || !markerClusterGroup) return

    // Clear existing layer
    markerClusterGroup.clearLayers()
    if (photoClusterGroup) {
      photoClusterGroup.clearLayers()
    }
    if (tripLinesGroup) {
      tripLinesGroup.clearLayers()
    } else {
      tripLinesGroup = L.layerGroup().addTo(map)
    }

    if (countryHighlightsGroup) {
      countryHighlightsGroup.clearLayers()
    } else {
      countryHighlightsGroup = L.layerGroup().addTo(map)
    }

    const bounds = L.latLngBounds()

    // Add new markers
    locations.forEach((loc) => {
      const locPhotoId =
        loc.images && loc.images.length > 0 ? loc.images[0] : null
      const locPhoto = locPhotoId
        ? mapPhotos.find((p) => p.id === locPhotoId)
        : null

      let headerHtml = ""
      if (locPhoto) {
        const url =
          locPhoto.provider === "local"
            ? `${API_URL}${locPhoto.url}`
            : `${API_URL}/media/photos/${locPhoto.id}/image`
        headerHtml = `<img src="${url}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />`
      } else {
        headerHtml = `<div style="
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
        </div>`
      }

      const popupContent = `
        <div style="text-align: center; width: 160px;">
          ${headerHtml}
          <h3 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">${
            loc.name
          }</h3>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">${$t(
            `${loc.name}`,
          )}</p>
        </div>
      `

      // Custom Icon logic: show photo if available, otherwise emoji pin
      let customIcon
      if (locPhoto) {
        const url =
          locPhoto.provider === "local"
            ? `${API_URL}${locPhoto.url}`
            : `${API_URL}/media/photos/${locPhoto.id}/image`
        const borderColor = (loc.tripId && tripColorMap ? tripColorMap[loc.tripId] : undefined) || "#3b82f6"
        customIcon = L.divIcon({
          className: "custom-photo-marker location-photo-marker",
          html: `
            <div class="marker-photo-wrapper" style="border-color: ${borderColor}">
              <img src="${url}" alt="${loc.name}" class="marker-photo-img" />
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 48],
          popupAnchor: [0, -48],
        })
      } else {
        customIcon = L.divIcon({
          className: "custom-map-marker",
          html: `<div class="marker-pin-custom" style="background-color: #3b82f6;">
                    <span class="marker-emoji">${getCategoryEmoji(
                      loc.category,
                    )}</span>
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        })
      }

      const marker = L.marker([loc.coordinates[0], loc.coordinates[1]], {
        icon: customIcon,
      }).bindPopup(popupContent)

      // Add tooltip with location name
      const tooltipOffset = locPhoto ? [0, -48] : [0, -40]
      marker.bindTooltip(loc.name, {
        permanent: false,
        direction: "top",
        offset: tooltipOffset,
        className: "location-marker-tooltip",
      })

      markerClusterGroup.addLayer(marker)
      bounds.extend([loc.coordinates[0], loc.coordinates[1]])
    })

    // Add Photos Markers (solo fotos sin locationId, las otras ya se muestran en el marcador del lugar)
    mapPhotos.forEach((photo) => {
      // Filtrar fotos vinculadas a un lugar - ya se muestran en el popup del lugar
      if (photo.locationId) {
        return
      }
      if (photo.metadata?.exif?.latitude && photo.metadata?.exif?.longitude) {
        const url =
          photo.provider === "local"
            ? `${API_URL}${photo.url}`
            : `${API_URL}/media/photos/${photo.id}/image`
        const photoTripId = photo.tripId
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
              <img src="${url}" alt="${$t(
            "common.mapPhotoAlt",
          )}" class="marker-photo-img" />
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 48],
          popupAnchor: [0, -48],
        })

const tripClickHandler = photoTrip ? `onclick="window.dispatchEvent(new CustomEvent('navigate-to-trip', {detail: {tripId: '${photoTrip.id}'}}))" style="cursor: pointer;"` : ''
const popupContent = `
    <div style="text-align: center; width: 220px; padding: 0.5rem;">
    <img src="${url}" style="width: 100%; border-radius: 8px; margin-bottom: 12px; object-fit: cover; max-height: 150px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);" />
    ${
    photoTrip
    ? `<div style="margin-bottom: 8px;">
    <span ${tripClickHandler} style="background: rgba(59, 130, 246, 0.2); color: #93c5fd; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${$t(
    "trip.tripPrefix",
    )}: ${photoTrip.name}</span>
                     ${
                       photoTrip.countries && photoTrip.countries.length > 0
                         ? `<div style="margin-top: 8px; display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">${photoTrip.countries
                             .map(
                               (c) =>
                                 `<span style="background: rgba(255, 255, 255, 0.1); padding: 3px 8px; border-radius: 8px; font-size: 11px; white-space: nowrap;">${
                                   getCountryFlag ? getCountryFlag(c) : ""
                                 } ${c}</span>`,
                             )
                             .join("")}</div>`
                         : ""
                     }
                   </div>`
                : ""
            }
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">${
              photo.metadata?.exif?.dateTimeOriginal
                ? formatDate(photo.metadata.exif.dateTimeOriginal)
                : $t("common.unknown")
            }</p>
          </div>
        `

        const marker = L.marker(
          [photo.metadata.exif.latitude, photo.metadata.exif.longitude],
          {
            icon: photoIcon,
          },
        ).bindPopup(popupContent, {
          className: "dark-popup",
        })

        if (photoClusterGroup) {
          photoClusterGroup.addLayer(marker)
        }
        bounds.extend([
          photo.metadata.exif.latitude,
          photo.metadata.exif.longitude,
        ])
      }
    })

    // Ensure the layers are added to map
    if (!map.hasLayer(markerClusterGroup)) {
      map.addLayer(markerClusterGroup)
    }
    if (photoClusterGroup && !map.hasLayer(photoClusterGroup)) {
      map.addLayer(photoClusterGroup)
    }

    // --- Country Highlights Logic ---
    if (showCountryHighlights && typeof window !== "undefined") {
      try {
        if (!geoJsonData) {
          const res = await fetch("/countries.geo.json")
          geoJsonData = await res.json()
        }

        // Gather isos
        const visitedIsos = new Set<string>()
        const plannedIsos = new Set<string>()
        trips.forEach((t) => {
          if (t.countries && Array.isArray(t.countries)) {
            t.countries.forEach((alpha2: string) => {
              if (alpha2) {
                const alpha3 = countriesInfo.toAlpha3(alpha2)
                if (alpha3) {
                  if (t.status === "Completado" || t.status === "En curso") {
                    visitedIsos.add(alpha3)
                  } else if (t.status === "Planificado") {
                    plannedIsos.add(alpha3)
                  }
                }
              }
            })
          }
        })
        const geoLayer = L.geoJSON(geoJsonData, {
          style: function (feature: any) {
            const iso = feature.id

            // If it's a country with provinces (like ES) and we are zoomed in, show a very faint highlight
            if (iso === "ESP" && currentZoom >= ZOOM_THRESHOLD_PROVINCES) {
              if (visitedIsos.has(iso)) {
                return {
                  fillColor: "#10b981",
                  color: "#047857",
                  weight: 0.5,
                  fillOpacity: 0.03,
                }
              } else if (plannedIsos.has(iso)) {
                return {
                  fillColor: "#3b82f6",
                  color: "#1d4ed8",
                  weight: 0.5,
                  fillOpacity: 0.02,
                }
              }
            }

            if (visitedIsos.has(iso)) {
              return {
                fillColor: "#10b981",
                color: "#047857",
                weight: 1,
                fillOpacity: 0.35,
              }
            } else if (plannedIsos.has(iso)) {
              return {
                fillColor: "#3b82f6",
                color: "#1d4ed8",
                weight: 1,
                fillOpacity: 0.25,
              }
            } else {
              return { weight: 0, fillOpacity: 0 }
            }
          },
        })

        countryHighlightsGroup.addLayer(geoLayer)
      } catch (err) {
        console.error("Error loading GeoJSON data", err)
      }

      // --- Province Highlights Logic (for Home Country) ---
      if ($userProfile.homeCountry && typeof window !== "undefined") {
        try {
          const homeIso2 = $userProfile.homeCountry
          if (!provincesGeoJSONData) {
            // Check if we have a file for this country (only ES implemented for now)
            if (homeIso2 === "ES") {
              const res = await fetch("/geo/provinces_ES.geo.json")
              if (res.ok) {
                provincesGeoJSONData = await res.json()
              }
            }
          }

          if (provincesGeoJSONData) {
            const visitedProvinces = new Set<string>()
            const plannedProvinces = new Set<string>()

            locations.forEach((loc) => {
              if (loc.country === homeIso2 && loc.adminArea1) {
                const provName = normalizeString(loc.adminArea1)
                const trip = trips.find((t) => t.id === loc.tripId)
                if (
                  trip &&
                  (trip.status === "Completado" || trip.status === "En curso")
                ) {
                  visitedProvinces.add(provName)
                } else if (trip && trip.status === "Planificado") {
                  plannedProvinces.add(provName)
                } else if (!loc.tripId) {
                  // Legacy or direct locations
                  visitedProvinces.add(provName)
                }
              }
            })

            trips.forEach((t) => {
              if (t.provinces && t.provinces.length > 0) {
                t.provinces.forEach((prov: string) => {
                  if (t.status === "Completado" || t.status === "En curso") {
                    visitedProvinces.add(normalizeString(prov))
                  } else if (t.status === "Planificado") {
                    plannedProvinces.add(normalizeString(prov))
                  }
                })
              }
            })

            // Ensure visited takes precedence
            visitedProvinces.forEach((p) => plannedProvinces.delete(p))

            // Only show provinces if zoomed in
            if (currentZoom >= ZOOM_THRESHOLD_PROVINCES) {
              const provLayer = L.geoJSON(provincesGeoJSONData, {
                style: function (feature: any) {
                  const featName = normalizeString(
                    feature.properties.name || "",
                  )

                  // Flexible check: does any visited province name match this feature name or vice versa?
                  let isVisited = false
                  visitedProvinces.forEach((v) => {
                    if (v.includes(featName) || featName.includes(v))
                      isVisited = true
                  })

                  let isPlanned = false
                  if (!isVisited) {
                    plannedProvinces.forEach((p) => {
                      if (p.includes(featName) || featName.includes(p))
                        isPlanned = true
                    })
                  }

                  const homeProv = $userProfile.homeProvince
                    ? normalizeString($userProfile.homeProvince)
                    : null
                  const isHome =
                    homeProv &&
                    (homeProv.includes(featName) || featName.includes(homeProv))
                  if (isVisited) {
                    return {
                      fillColor: "#10b981",
                      color: "#059669",
                      weight: 1.5,
                      fillOpacity: 0.6, // Higher opacity for contrast
                    }
                  } else if (isPlanned) {
                    return {
                      fillColor: "#3b82f6",
                      color: "#2563eb",
                      weight: 1.5,
                      fillOpacity: 0.5,
                    }
                  } else if (isHome && showHome) {
                    return {
                      fillColor: "#ef4444",
                      color: "#b91c1c",
                      weight: 1.5,
                      fillOpacity: 0.15,
                    }
                  }
                  return {
                    color: "rgba(255,255,255,0.1)",
                    weight: 0.3,
                    fillOpacity: 0.02,
                    fillColor: "#ffffff",
                  }
                },
              })
              countryHighlightsGroup.addLayer(provLayer)
            }
          }
        } catch (err) {
          console.error("Error loading province GeoJSON", err)
        }
      }
    }

    const homeBounds = updateHomeMarker()
    if (homeBounds) {
      bounds.extend(homeBounds)
    }

    if (shouldFit && bounds.isValid()) {
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
        zIndexOffset: -1000,
      }).addTo(map).bindPopup(`
          <div style="text-align: center;">
            <h3 style="margin: 0;">🏠</h3>
            <p>${$t("map.home")}</p>
          </div>
        `)

      return [home.coordinates[0], home.coordinates[1]]
    }
    return null
  }

  // React to showHome change
  $: if (map && showHome !== undefined) {
    updateMarkers(false)
  }

  function getCategoryEmoji(category: string) {
    const map: Record<string, string> = {
      Monumento: "🏛️",
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
          attribution: $t("map.satelliteAttribution"),
          maxZoom: 19,
        },
      )
    } else {
      currentTileLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: $t("map.defaultAttribution"),
          subdomains: "abcd",
          maxZoom: 20,
        },
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

      map.on("zoomend", () => {
        currentZoom = map.getZoom()
      })

      currentZoom = map.getZoom()

      if (L.markerClusterGroup) {
        // Initialize Cluster Group with custom styles for Location Markers
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

        // Initialize Cluster Group specific for Photos
        photoClusterGroup = L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
          maxClusterRadius: 60,
          iconCreateFunction: function (cluster: any) {
            const childCount = cluster.getChildCount()
            // We use the first photo as the cluster icon background if possible, or just a generic style
            const markers = cluster.getAllChildMarkers()
            // Try to extract image src from custom icon html
            let bgImage = ""
            if (markers.length > 0 && markers[0].options.icon.options.html) {
              const html = markers[0].options.icon.options.html
              const match = html.match(/src="([^"]+)"/)
              if (match && match[1]) {
                bgImage = match[1]
              }
            }

            return L.divIcon({
              html: `
                <div style="
                  width: 48px;
                  height: 48px;
                  border-radius: 8px;
                  background-color: #1e293b;
                  background-image: url('${bgImage || ""}');
                  background-size: cover;
                  background-position: center;
                  border: 3px solid white;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  position: relative;
                ">
                  <div style="
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #ef4444;
                    color: white;
                    font-size: 11px;
                    font-weight: 700;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    border: 2px solid white;
                  ">${childCount}</div>
                  ${!bgImage ? `<span style="font-size: 20px;">🖼️</span>` : ""}
                </div>
              `,
              className: "custom-photo-cluster",
              iconSize: [48, 48],
            })
          },
        })

        map.addLayer(photoClusterGroup)
      } else {
        console.error("Leaflet MarkerClusterGroup not found!")
      }

// Initial marker update
updateMarkers()
} catch (e) {
console.error("Error initializing map:", e)
}
})

// Listen for navigate-to-trip events from map popups
if (browser) {
window.addEventListener('navigate-to-trip', tripNavigateHandler)
}

  async function handleSearch() {
    if (!searchQuery.trim() || !map) return
    searchError = ""
    searchLoading = true
    try {
      const result = await geocode(searchQuery)
      if (result) {
        map.setView([result.lat, result.lng], 12)
        dispatch("locationSelect", { lat: result.lat, lng: result.lng })
      } else {
        searchError = $t("common.noLocationFound")
      }
    } catch (e) {
      searchError = $t("common.searchError")
    } finally {
      searchLoading = false
    }
  }

onDestroy(() => {
if (map) {
map.remove()
}
if (browser) {
window.removeEventListener('navigate-to-trip', tripNavigateHandler)
}
})
</script>

<div class="map-outer">
  <div class="map-search-bar">
    <input
      type="text"
      class="map-search-input"
      placeholder={$t("common.searchPlaceholderMap")}
      bind:value={searchQuery}
      on:keydown={(e) => e.key === "Enter" && handleSearch()}
    />
    <button
      type="button"
      class="map-search-btn"
      disabled={searchLoading || !searchQuery.trim()}
      on:click={handleSearch}
      title={$t("common.searchTitleMap")}
    >
      <Search size={18} />
      <span>{searchLoading ? "..." : $t("common.searchBtn")}</span>
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

  /* Hide map search bar on mobile (mobile panel provides its own) */
  @media (max-width: 768px) {
    .map-search-bar {
      display: none;
    }
    .map-search-error {
      display: none;
    }
  }
</style>
