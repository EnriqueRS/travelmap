<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte"
  import { browser } from "$app/environment"
  import "leaflet/dist/leaflet.css"
  import markerIconUrl from "leaflet/dist/images/marker-icon.png"
  import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
  import markerShadowUrl from "leaflet/dist/images/marker-shadow.png"
  import { geocode } from "$lib/utils/geocode"
  import { Search } from "lucide-svelte"
  import { t } from "$lib/stores/i18n"

  export let height = "300px"
  export let initialLocation: { lat: number; lng: number } | null = null
  export let hideSearch = false

  const dispatch = createEventDispatcher()
  let mapContainer: HTMLDivElement
  let map: any
  let marker: any
  let L: any
  let searchQuery = ""
  let searchLoading = false
  let searchError = ""

  onMount(async () => {
    if (!browser) return

    try {
      const leafletModule = await import("leaflet")
      L = leafletModule.default

      // Use Leaflet marker images from package (Vite resolves URLs)
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIconRetinaUrl,
        iconUrl: markerIconUrl,
        shadowUrl: markerShadowUrl,
      })

      map = L.map(mapContainer).setView(
        initialLocation ? [initialLocation.lat, initialLocation.lng] : [20, 0],
        initialLocation ? 10 : 2,
      )

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        },
      ).addTo(map)

      if (initialLocation) {
        addMarker(initialLocation.lat, initialLocation.lng)
      }

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng
        addMarker(lat, lng)
        dispatch("locationSelect", { lat, lng })
      })

      setTimeout(() => {
        map.invalidateSize()
      }, 250)
    } catch (e) {
      console.error("Error initializing map:", e)
    }
  })

  $: if (map && L && initialLocation) {
    // Only update if marker doesn't exist or doesn't match the new location
    if (
      !marker ||
      marker.getLatLng().lat !== initialLocation.lat ||
      marker.getLatLng().lng !== initialLocation.lng
    ) {
      map.setView([initialLocation.lat, initialLocation.lng], 14)
      addMarker(initialLocation.lat, initialLocation.lng)
    }
  }

  function addMarker(lat: number, lng: number) {
    if (!map || !L) return
    if (marker) {
      map.removeLayer(marker)
    }
    marker = L.marker([lat, lng]).addTo(map)
  }

  export async function handleSearch(query?: string) {
    const q = query ?? searchQuery
    if (!q.trim() || !map) return
    searchError = ""
    searchLoading = true
    try {
      const result = await geocode(q)
      if (result) {
        map.setView([result.lat, result.lng], 14)
        addMarker(result.lat, result.lng)
        dispatch("locationSelect", { lat: result.lat, lng: result.lng })
        return true
      } else {
        searchError = $t("common.noLocationFound")
        return false
      }
    } catch (e) {
      searchError = $t("common.searchError")
      return false
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

<div class="location-picker-wrapper">
  {#if !hideSearch}
    <div class="search-row">
      <input
        type="text"
        bind:value={searchQuery}
        on:keydown={(e) => e.key === "Enter" && handleSearch()}
        placeholder={$t("common.searchPlaceholderMap")}
        class="input-box pr-10"
      />
      <button
        type="button"
        class="btn btn-primary"
        disabled={searchLoading || !searchQuery.trim()}
        on:click={() => handleSearch()}
        title={$t("common.searchBtn")}
      >
        <Search size={18} />
        <span
          >{searchLoading ? $t("common.searching") : $t("common.searchBtn")}</span
        >
      </button>
    </div>
  {/if}
  {#if searchError}
    <p class="search-error">{searchError}</p>
  {/if}
  <div
    bind:this={mapContainer}
    class="map-container"
    style="height: {height};"
  />
  <p class="hint">{$t("common.mapHint")}</p>
</div>

<style>
  .location-picker-wrapper {
    width: 100%;
  }
  .search-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .search-error {
    margin: 0 0 0.5rem 0;
    font-size: 0.8125rem;
    color: #f87171;
  }
  .map-container {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
  }
  .hint {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: #64748b;
  }
</style>
