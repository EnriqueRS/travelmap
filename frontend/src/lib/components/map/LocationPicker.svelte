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
  import { reverseGeocode } from "$lib/utils/geocode"
  import { getCountryFlag, getCountryName } from "$lib/utils/countries"
  import { languageStore } from "$lib/stores/ui"
  import { SPAIN_PROVINCES } from "$lib/utils/provinces"
  import { normalizeString } from "$lib/utils/string"

  export let height = "300px"
  export let initialLocation: { lat: number; lng: number } | null = null
  export let hideSearch = false
  export let countryName: string | null = null
  export let provinceName: string | null = null
  export let countyName: string | null = null

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
      if (initialLocation) {
        const geoResult = await reverseGeocode(
          initialLocation.lat,
          initialLocation.lng,
        )
        if (geoResult) {
          countryName = geoResult.countryCode || null
          if (countryName === "ES" && geoResult.state) {
            const normalizedState = normalizeString(geoResult.state)
            const matched = SPAIN_PROVINCES.find((p) => {
              const normalizedP = normalizeString(p.name)
              return (
                normalizedState.includes(normalizedP) ||
                normalizedP.includes(normalizedState)
              )
            })
            provinceName = matched ? matched.name : geoResult.state
          } else {
            provinceName = geoResult.state || null
          }
          countyName = geoResult.county || null
        }
      }

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

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng
        const geoResult = await reverseGeocode(lat, lng)
        if (geoResult) {
          countryName = geoResult.countryCode || null
          if (countryName === "ES" && geoResult.province) {
            const normalizedState = normalizeString(geoResult.province)
            const matched = SPAIN_PROVINCES.find((p) => {
              const normalizedP = normalizeString(p.name)
              return (
                normalizedState.includes(normalizedP) ||
                normalizedP.includes(normalizedState)
              )
            })
            provinceName = matched ? matched.name : geoResult.province
          } else {
            provinceName = geoResult.province || null
          }
          countyName = geoResult.county || null
        } else {
          countryName = null
          provinceName = null
          countyName = null
        }
        addMarker(lat, lng)
        dispatch("locationSelect", {
          lat,
          lng,
          country: countryName,
          province: provinceName,
          county: countyName,
        })
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
        const geoResult = await reverseGeocode(result.lat, result.lng)
        if (geoResult) {
          countryName = geoResult.countryCode || null
          if (countryName === "ES" && geoResult.state) {
            const normalizedState = normalizeString(geoResult.state)
            const matched = SPAIN_PROVINCES.find((p) => {
              const normalizedP = normalizeString(p.name)
              return (
                normalizedState.includes(normalizedP) ||
                normalizedP.includes(normalizedState)
              )
            })
            provinceName = matched ? matched.name : geoResult.state
          } else {
            provinceName = geoResult.state || null
          }
          countyName = geoResult.county || null
        } else {
          countryName = null
          provinceName = null
          countyName = null
        }
        dispatch("locationSelect", {
          lat: result.lat,
          lng: result.lng,
          country: countryName,
          province: provinceName,
          county: countyName,
        })
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
          >{searchLoading
            ? $t("common.searching")
            : $t("common.searchBtn")}</span
        >
      </button>
    </div>
  {/if}
  {#if searchError}
    <p class="search-error">{searchError}</p>
  {/if}
  <div bind:this={mapContainer} class="map-container" style="height: {height};">
    {#if countryName}
      <div class="country-badge-floating">
        <div class="dot" />
        <span class="label">{$t("map.detectedCountryLabel")}</span>
        <span class="value"
          >{getCountryFlag(countryName)}
          {getCountryName(countryName, $languageStore)}</span
        >
      </div>
    {/if}
  </div>
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
    position: relative;
  }
  .country-badge-floating {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    background: #0f172a;
    border: 1px solid #1e293b;
    padding: 0.4rem 0.75rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .country-badge-floating .dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
  }
  .country-badge-floating .label {
    color: #64748b;
    text-transform: uppercase;
  }
  .country-badge-floating .value {
    color: #10b981;
  }
  .hint {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: #64748b;
  }
</style>
