<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { browser } from "$app/environment"
  import { userProfile } from "$lib/stores/data"
  import type { Location } from "$lib/stores/data"
  import "leaflet/dist/leaflet.css"
  import "leaflet.markercluster/dist/MarkerCluster.css"
  import "leaflet.markercluster/dist/MarkerCluster.Default.css"

  export let height = "100%"
  export let locations: Location[] = []
  export let showHome = true

  let mapContainer: HTMLDivElement
  let map: any
  let markerClusterGroup: any
  let L: any
  let currentTileLayer: any

  // Reactive update when locations prop changes
  $: if (map && browser && L && markerClusterGroup && locations) {
    updateMarkers()
  }

  async function updateMarkers() {
    if (!map || !markerClusterGroup) return

    // Clear existing layer
    markerClusterGroup.clearLayers()

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
    })

    // Ensure the layer is added to map
    if (!map.hasLayer(markerClusterGroup)) {
      map.addLayer(markerClusterGroup)
    }

    updateHomeMarker()
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
    }
  }

  // React to showHome change
  $: if (map && (showHome || !showHome)) {
    updateHomeMarker()
  }

  function getCategoryEmoji(category: string) {
    const map: Record<string, string> = {
      Naturaleza: "🌲",
      Ciudad: "🏙️",
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

      // Fix for Leaflet images in webpack/vite
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/images/marker-icon-2x.png",
        iconUrl: "/images/marker-icon.png",
        shadowUrl: "/images/marker-shadow.png",
      })

      // Expose L to window for plugins that rely on global L
      // @ts-ignore
      window.L = L

      // Import plugin explicitly
      // We use the file path found in verification to ensure it resolves
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

  onDestroy(() => {
    if (map) {
      map.remove()
    }
  })
</script>

```
<div bind:this={mapContainer} class="map-wrapper" style="height: {height}" />

<style>
  .map-wrapper {
    width: 100%;
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
    border-radius: 8px;
    padding: 0;
    overflow: hidden;
  }
  :global(.leaflet-popup-content) {
    margin: 12px;
  }
  :global(.leaflet-popup-tip) {
    background: white;
  }
</style>
