<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import "leaflet/dist/leaflet.css";
  import markerIconUrl from "leaflet/dist/images/marker-icon.png";
  import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
  import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
  import { geocode } from "$lib/utils/geocode";
  import { Search } from "lucide-svelte";

  export let height = "300px";
  export let initialLocation: { lat: number; lng: number } | null = null;

  const dispatch = createEventDispatcher();
  let mapContainer: HTMLDivElement;
  let map: any;
  let marker: any;
  let L: any;
  let searchQuery = "";
  let searchLoading = false;
  let searchError = "";

  onMount(async () => {
    if (!browser) return;

    try {
      const leafletModule = await import("leaflet");
      L = leafletModule.default;

      // Use Leaflet marker images from package (Vite resolves URLs)
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIconRetinaUrl,
        iconUrl: markerIconUrl,
        shadowUrl: markerShadowUrl,
      });

      map = L.map(mapContainer).setView(
        initialLocation ? [initialLocation.lat, initialLocation.lng] : [20, 0],
        initialLocation ? 10 : 2
      );

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      if (initialLocation) {
        addMarker(initialLocation.lat, initialLocation.lng);
      }

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        addMarker(lat, lng);
        dispatch("locationSelect", { lat, lng });
      });
    } catch (e) {
      console.error("Error initializing map:", e);
    }
  });

  function addMarker(lat: number, lng: number) {
    if (!map || !L) return;
    if (marker) {
      map.removeLayer(marker);
    }
    marker = L.marker([lat, lng]).addTo(map);
  }

  async function handleSearch() {
    if (!searchQuery.trim() || !map) return;
    searchError = "";
    searchLoading = true;
    try {
      const result = await geocode(searchQuery);
      if (result) {
        map.setView([result.lat, result.lng], 14);
        addMarker(result.lat, result.lng);
        dispatch("locationSelect", { lat: result.lat, lng: result.lng });
      } else {
        searchError = "No se encontró la ubicación. Prueba con otra búsqueda.";
      }
    } catch (e) {
      searchError = "Error al buscar. Intenta de nuevo.";
    } finally {
      searchLoading = false;
    }
  }

  onDestroy(() => {
    if (map) {
      map.remove();
    }
  });
</script>

<div class="location-picker-wrapper">
  <div class="search-row">
    <input
      type="text"
      class="search-input"
      placeholder="Buscar ciudad, dirección..."
      bind:value={searchQuery}
      on:keydown={(e) => e.key === "Enter" && handleSearch()}
    />
    <button
      type="button"
      class="search-btn"
      disabled={searchLoading || !searchQuery.trim()}
      on:click={handleSearch}
      title="Buscar ubicación"
    >
      <Search size={18} />
      <span>{searchLoading ? "Buscando..." : "Buscar"}</span>
    </button>
  </div>
  {#if searchError}
    <p class="search-error">{searchError}</p>
  {/if}
  <div
    bind:this={mapContainer}
    class="map-container"
    style="height: {height};"
  />
  <p class="hint">Haz clic en el mapa o busca una ubicación para elegir.</p>
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
  .search-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(71, 85, 105, 0.6);
    border-radius: 8px;
    background: rgba(30, 41, 59, 0.8);
    color: #e2e8f0;
    font-size: 0.875rem;
    font-family: inherit;
  }
  .search-input::placeholder {
    color: #64748b;
  }
  .search-input:focus {
    outline: none;
    border-color: rgba(96, 165, 250, 0.8);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  .search-btn {
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
  .search-btn:hover:not(:disabled) {
    background: #2563eb;
  }
  .search-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
